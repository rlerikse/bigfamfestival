// src/components/FakeClockOverlay.tsx
/**
 * FakeClockOverlay
 *
 * Admin-only, bottom-pinned overlay that lets Robert/admins scrub a fake
 * "now" time to manually smoke-test schedule live-time behaviors (now-bar,
 * auto-scroll, live-event highlighting — see #147/#148) without touching the
 * device clock.
 *
 * Lives in the Settings tab. Gated on user.role === 'admin' by the parent
 * (SettingsScreen) — this component assumes it's only ever rendered for
 * admins, but also re-checks isAdmin as a defense-in-depth guard.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFakeClock } from '../contexts/FakeClockContext';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  isAdmin: boolean;
  /** Slider window: how many hours before/after "real now" the scrubber covers. Defaults to 24h back / 48h forward. */
  hoursBefore?: number;
  hoursAfter?: number;
}

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 28;

const FakeClockOverlay: React.FC<Props> = ({ isAdmin, hoursBefore = 24, hoursAfter = 48 }) => {
  const { theme, isDark } = useTheme();
  const { now, fakeTime, setFakeTime, isFakeClock } = useFakeClock();
  const [trackWidth, setTrackWidth] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Fixed reference point so the slider range doesn't shift under the user's
  // finger as real time ticks forward while they're dragging.
  const referenceNow = useRef(Date.now()).current;
  const rangeStart = referenceNow - hoursBefore * 60 * 60 * 1000;
  const rangeEnd = referenceNow + hoursAfter * 60 * 60 * 1000;
  const rangeSpan = rangeEnd - rangeStart;

  const currentValue = fakeTime !== null ? fakeTime : now;
  const clampedValue = Math.min(Math.max(currentValue, rangeStart), rangeEnd);
  const fraction = rangeSpan > 0 ? (clampedValue - rangeStart) / rangeSpan : 0;

  const dragging = useRef(false);
  const [displayFraction, setDisplayFraction] = useState(fraction);

  const fractionToTime = useCallback(
    (f: number) => rangeStart + Math.min(Math.max(f, 0), 1) * rangeSpan,
    [rangeStart, rangeSpan],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          dragging.current = true;
          if (trackWidth > 0) {
            const f = evt.nativeEvent.locationX / trackWidth;
            setDisplayFraction(f);
          }
        },
        onPanResponderMove: (evt) => {
          if (trackWidth > 0) {
            const f = evt.nativeEvent.locationX / trackWidth;
            const clamped = Math.min(Math.max(f, 0), 1);
            setDisplayFraction(clamped);
          }
        },
        onPanResponderRelease: () => {
          dragging.current = false;
          setFakeTime(Math.round(fractionToTime(displayFraction)));
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trackWidth, fractionToTime, displayFraction],
  );

  const effectiveFraction = dragging.current ? displayFraction : fraction;
  const previewTime = fractionToTime(effectiveFraction);

  if (!isAdmin) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {isFakeClock && (
        <View style={styles.banner}>
          <Ionicons name="time-outline" size={14} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.bannerText}>⏱ Fake time active — {new Date(now).toLocaleString()}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.header, { backgroundColor: theme.card ?? (isDark ? '#1c1c1e' : '#f2f2f7') }]}
        onPress={() => setExpanded(prev => !prev)}
        accessibilityLabel={expanded ? 'Collapse fake clock control' : 'Expand fake clock control'}
      >
        <Ionicons name="hardware-chip-outline" size={16} color={theme.text} style={{ marginRight: 6 }} />
        <Text style={[styles.headerText, { color: theme.text }]}>Admin: Fake Clock (dev/QA)</Text>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-up'}
          size={16}
          color={theme.text}
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.panel, { backgroundColor: theme.card ?? (isDark ? '#1c1c1e' : '#f2f2f7') }]}>
          <Text style={[styles.previewText, { color: theme.text }]}>{new Date(previewTime).toLocaleString()}</Text>

          <View
            style={styles.track}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
          >
            <View style={[styles.trackFill, { backgroundColor: theme.primary, width: `${effectiveFraction * 100}%` }]} />
            <View
              style={[
                styles.thumb,
                {
                  left: Math.max(0, Math.min(trackWidth - THUMB_SIZE, effectiveFraction * trackWidth - THUMB_SIZE / 2)),
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          <View style={styles.rangeLabelsRow}>
            <Text style={[styles.rangeLabel, { color: theme.muted ?? theme.text }]}>
              {new Date(rangeStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
            <Text style={[styles.rangeLabel, { color: theme.muted ?? theme.text }]}>
              {new Date(rangeEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.border ?? 'rgba(128,128,128,0.4)' }]}
              onPress={() => setFakeTime(referenceNow)}
              accessibilityLabel="Jump to now"
            >
              <Text style={[styles.actionButtonText, { color: theme.text }]}>Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.resetButton,
                { borderColor: isFakeClock ? '#B87333' : 'rgba(128,128,128,0.4)' },
              ]}
              onPress={() => setFakeTime(null)}
              disabled={!isFakeClock}
              accessibilityLabel="Reset to real clock"
            >
              <Ionicons name="refresh-outline" size={14} color={isFakeClock ? '#B87333' : (theme.muted ?? theme.text)} style={{ marginRight: 4 }} />
              <Text style={[styles.actionButtonText, { color: isFakeClock ? '#B87333' : (theme.muted ?? theme.text) }]}>
                Reset to real time
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B87333',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  panel: {
    marginTop: 6,
    borderRadius: 10,
    padding: 14,
  },
  previewText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  track: {
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: { elevation: 3 },
    }),
  },
  rangeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeLabel: {
    fontSize: 11,
    opacity: 0.7,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetButton: {
    flex: 2,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default FakeClockOverlay;
