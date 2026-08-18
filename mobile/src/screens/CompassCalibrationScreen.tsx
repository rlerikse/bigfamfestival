import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-device';

import { useTheme } from '../contexts/ThemeContext';
import {
  createCircularMedianFilter,
  createOneEuroHeadingFilter,
  signedAngularDiff,
} from '../hooks/compassFusion';
import { RootStackParamList } from '../navigation';

type CompassCalibrationNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CompassCalibration'
>;

/**
 * Compass calibration screen.
 *
 * The phone's magnetometer drifts and picks up interference (metal, speakers,
 * generators at a festival), which shows up as a jumpy / inaccurate heading in
 * the map compass mode and the friend-finder. The OS re-calibrates the compass
 * when the device is moved through varied orientations — the classic "figure-8
 * wave". We can't force that from JS, but we CAN guide the motion and read the
 * live calibration level back from `watchHeadingAsync`'s `accuracy` field
 * (0 none → 3 high), so the user gets real feedback and knows when it worked.
 */

// accuracy 0..3 → label + colour. Index === the OS accuracy value.
const ACCURACY_META = [
  { label: 'Uncalibrated', color: '#FF3B30' },
  { label: 'Low', color: '#FF9500' },
  { label: 'Medium', color: '#FFCC00' },
  { label: 'High', color: '#34C759' },
] as const;

// Figure-8 (Gerono lemniscate) sampled at 1/8-turn steps for the guide dot:
//   x(t) = A·sin(2πt),  y(t) = B·sin(4πt)
const FIG8_A = 74;
const FIG8_B = 42;
const FIG8_INPUT = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const FIG8_X = [0, FIG8_A * 0.707, FIG8_A, FIG8_A * 0.707, 0, -FIG8_A * 0.707, -FIG8_A, -FIG8_A * 0.707, 0];
const FIG8_Y = [0, FIG8_B, 0, -FIG8_B, 0, FIG8_B, 0, -FIG8_B, 0];

// Static device facts, resolved once. Device.isDevice is false on emulators —
// an emulator has no real magnetometer, so a bad heading there is expected.
const DEVICE_LABEL = Device.isDevice ? 'Physical device' : 'Simulator / Emulator';
const PLATFORM_LABEL = `${Platform.OS}${Device.osVersion ? ` ${Device.osVersion}` : ''}`;

type DiagRowProps = {
  label: string;
  value: string;
  color: string;
  mutedColor: string;
  warn?: boolean;
};

const DiagRow = ({ label, value, color, mutedColor, warn }: DiagRowProps) => (
  <View style={styles.diagRow}>
    <Text style={[styles.diagLabel, { color: mutedColor }]}>{label}</Text>
    <Text style={[styles.diagValue, { color: warn ? '#FF9500' : color }]}>{value}</Text>
  </View>
);

const CompassCalibrationScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<CompassCalibrationNavigationProp>();

  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [calibrated, setCalibrated] = useState(false);
  // Latch so we only fire the success haptic once per visit.
  const calibratedRef = useRef(false);
  // De-spike the displayed heading so a glitchy raw reading doesn't show wild
  // numbers while the phone is held steady (matches the friend-finder pipeline).
  const headingMedianRef = useRef(createCircularMedianFilter(5));
  // Diagnostics: mirror the friend-finder 1€ filter + measure the raw signal.
  const headingFilterRef = useRef(createOneEuroHeadingFilter());
  const rawBufRef = useRef<{ t: number; h: number }[]>([]);
  const lastDiagAtRef = useRef(0);
  const [diag, setDiag] = useState<{
    filtH: number;
    rateHz: number;
    spread: number;
    trueH: number;
    magH: number;
  } | null>(null);

  const progress = useRef(new Animated.Value(0)).current;

  // Loop the figure-8 guide animation.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  // Subscribe to the OS compass and read back the live calibration level.
  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    (async () => {
      // trueHeading needs location permission; the magnetometer accuracy we
      // care about here streams regardless, so this is best-effort.
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch {
        // ignore — magHeading + accuracy still stream without it
      }
      try {
        const s = await Location.watchHeadingAsync(({ trueHeading, magHeading, accuracy: acc }) => {
          setAccuracy(acc);
          if (acc >= 3 && !calibratedRef.current) {
            calibratedRef.current = true;
            setCalibrated(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
              () => undefined
            );
          }

          const raw = trueHeading != null && trueHeading >= 0 ? trueHeading : magHeading;
          if (raw == null || raw < 0) return;

          // Run the SAME chain the friend-finder uses: median → 1€.
          const med = headingMedianRef.current.push(raw);
          const filt = headingFilterRef.current.filter(med, Date.now());
          setHeading(filt);

          // Collect raw (unfiltered) samples to measure rate + jitter spread.
          const now = Date.now();
          const buf = rawBufRef.current;
          buf.push({ t: now, h: magHeading });
          if (buf.length > 64) buf.shift();

          // Throttle the on-screen diagnostics to ~4Hz so the readout is legible.
          if (now - lastDiagAtRef.current >= 250 && buf.length >= 2) {
            lastDiagAtRef.current = now;
            const first = buf[0];
            const last = buf[buf.length - 1];
            const elapsed = (last.t - first.t) / 1000;
            const rateHz = elapsed > 0 ? (buf.length - 1) / elapsed : 0;
            const rel = buf.map((sample) => signedAngularDiff(last.h, sample.h));
            const spread = Math.max(...rel) - Math.min(...rel);
            setDiag({ filtH: filt, rateHz, spread, trueH: trueHeading, magH: magHeading });
          }
        });
        if (cancelled) s.remove();
        else sub = s;
      } catch {
        // heading hardware/permissions unavailable — leave accuracy null
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  const level = accuracy == null ? null : Math.max(0, Math.min(3, Math.round(accuracy)));
  const meta = level == null ? null : ACCURACY_META[level];
  const guideColor = calibrated ? '#34C759' : theme.primary;

  const translateX = progress.interpolate({ inputRange: FIG8_INPUT, outputRange: FIG8_X });
  const translateY = progress.interpolate({ inputRange: FIG8_INPUT, outputRange: FIG8_Y });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Calibrate Compass</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Slowly wave your phone through the air in a figure-8 a few times, rotating
          your wrist as you go. This retunes the compass so the map and friend-finder
          point accurately.
        </Text>

        {/* Figure-8 guide */}
        <View style={styles.figureArea}>
          <Ionicons name="infinite-outline" size={200} color={guideColor} style={{ opacity: 0.18 }} />
          <Animated.View
            style={[
              styles.guideDot,
              { backgroundColor: guideColor, transform: [{ translateX }, { translateY }] },
            ]}
          >
            <Ionicons name="phone-portrait-outline" size={22} color="#FFFFFF" />
          </Animated.View>
        </View>

        {/* Accuracy meter */}
        <View style={styles.meterRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.meterSegment,
                {
                  backgroundColor:
                    level != null && i <= level && meta ? meta.color : theme.border,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.meterLabel, { color: meta ? meta.color : theme.muted }]}>
          {meta ? `Compass accuracy: ${meta.label}` : 'Detecting compass…'}
        </Text>

        {heading != null && (
          <Text style={[styles.headingReadout, { color: theme.muted }]}>
            Heading: {Math.round(heading)}°
          </Text>
        )}

        {/* Live diagnostics — read the real signal instead of guessing at filters */}
        <View style={[styles.diagCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.diagTitle, { color: theme.text }]}>Diagnostics</Text>
          <DiagRow label="Device" value={DEVICE_LABEL} color={theme.text} mutedColor={theme.muted} warn={!Device.isDevice} />
          <DiagRow label="Platform" value={PLATFORM_LABEL} color={theme.text} mutedColor={theme.muted} />
          <DiagRow
            label="Update rate"
            value={diag ? `${diag.rateHz.toFixed(1)} Hz` : '—'}
            color={theme.text}
            mutedColor={theme.muted}
            warn={diag != null && diag.rateHz < 8}
          />
          <DiagRow
            label="Raw jitter (spread)"
            value={diag ? `${Math.round(diag.spread)}°` : '—'}
            color={theme.text}
            mutedColor={theme.muted}
            warn={diag != null && diag.spread > 12}
          />
          <DiagRow
            label="Raw mag / true"
            value={diag ? `${Math.round(diag.magH)}° / ${diag.trueH >= 0 ? `${Math.round(diag.trueH)}°` : 'n/a'}` : '—'}
            color={theme.text}
            mutedColor={theme.muted}
          />
          <DiagRow
            label="Filtered (smoothed)"
            value={diag ? `${Math.round(diag.filtH)}°` : '—'}
            color={theme.text}
            mutedColor={theme.muted}
          />
        </View>

        {/* Success banner */}
        {calibrated && (
          <View style={[styles.successBanner, { borderColor: '#34C759' }]}>
            <Ionicons name="checkmark-circle" size={22} color="#34C759" />
            <Text style={[styles.successText, { color: theme.text }]}>
              Compass calibrated — you&apos;re all set!
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.doneButton,
          { backgroundColor: calibrated ? '#34C759' : theme.primary },
        ]}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Done"
      >
        <Text style={styles.doneButtonText}>{calibrated ? 'Done' : 'Close'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  scroll: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 8,
  },
  figureArea: {
    height: 220,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  guideDot: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  meterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  meterSegment: {
    width: 56,
    height: 8,
    borderRadius: 4,
  },
  meterLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  headingReadout: {
    fontSize: 13,
    marginTop: 6,
  },
  diagCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 18,
  },
  diagTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  diagLabel: {
    fontSize: 13,
  },
  diagValue: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 20,
  },
  successText: {
    fontSize: 15,
    fontWeight: '600',
  },
  doneButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CompassCalibrationScreen;
