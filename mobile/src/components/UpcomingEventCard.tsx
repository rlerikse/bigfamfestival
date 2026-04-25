/**
 * UpcomingEventCard
 * Hero layout: full-width flyer → countdown → CTA buttons.
 * Clean and simple. Data-driven from UpcomingShow.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  Platform,
} from 'react-native';
import { UpcomingShow } from '../types/event';

// ─── Local flyer map ──────────────────────────────────────────────────────────
const LOCAL_FLYERS: Record<string, ReturnType<typeof require>> = {
  'josh-teed-2026-04-25': require('../assets/images/josh-teed-flyer.jpg'),
};

function getFlyerSource(show: UpcomingShow) {
  if (show.flyerUrl) return { uri: show.flyerUrl };
  const slug = show.id || show.name.toLowerCase().replace(/\s+/g, '-');
  if (LOCAL_FLYERS[slug]) return LOCAL_FLYERS[slug];
  if (show.imageUrl) return { uri: show.imageUrl };
  return null;
}

// ─── Countdown ────────────────────────────────────────────────────────────────
interface TimeLeft {
  days: number; hours: number; minutes: number; seconds: number; total: number;
}

function getTimeLeft(target: Date): TimeLeft {
  const total = target.getTime() - Date.now();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total };
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

function useCountdown(doorsTime?: string) {
  const target = doorsTime ? new Date(doorsTime) : null;
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    target ? getTimeLeft(target) : null
  );
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [doorsTime]); // eslint-disable-line react-hooks/exhaustive-deps
  return timeLeft;
}

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <View style={styles.timeUnit}>
    <Text style={styles.timeValue}>{value.toString().padStart(2, '0')}</Text>
    <Text style={styles.timeLabel}>{label}</Text>
  </View>
);

const ColonSep = () => <Text style={styles.colonSep}>:</Text>;

// ─── Component ────────────────────────────────────────────────────────────────
const UpcomingEventCard: React.FC<{ show: UpcomingShow }> = ({ show }) => {
  const timeLeft = useCountdown(show.doorsTime);
  const flyerSource = getFlyerSource(show);
  const doorsOpen = timeLeft !== null && timeLeft.total <= 0;

  const handleTickets = useCallback(() => {
    if (show.ticketUrl) Linking.openURL(show.ticketUrl).catch(() => {});
  }, [show.ticketUrl]);

  const handleFacebook = useCallback(() => {
    if (show.facebookUrl) Linking.openURL(show.facebookUrl).catch(() => {});
  }, [show.facebookUrl]);

  return (
    <View style={styles.card}>

      {/* Hero flyer */}
      {flyerSource && (
        <Image
          source={flyerSource}
          style={styles.flyer}
          resizeMode="contain"
          onError={() => console.warn('[UpcomingEventCard] flyer failed:', show.id)}
          accessibilityLabel={`${show.name} event flyer`}
        />
      )}

      {/* Countdown */}
      {timeLeft !== null && (
        <View style={styles.countdownBlock}>
          {doorsOpen ? (
            <Text style={styles.doorsOpenText}>🚪 DOORS OPEN</Text>
          ) : (
            <>
              <View style={styles.countdownRow}>
                <TimeUnit value={timeLeft.days} label="DAYS" />
                <ColonSep />
                <TimeUnit value={timeLeft.hours} label="HRS" />
                <ColonSep />
                <TimeUnit value={timeLeft.minutes} label="MIN" />
                <ColonSep />
                <TimeUnit value={timeLeft.seconds} label="SEC" />
              </View>
              <Text style={styles.untilLabel}>UNTIL DOORS</Text>
            </>
          )}
        </View>
      )}

      {/* CTA Buttons */}
      {(show.ticketUrl || show.facebookUrl) && (
        <View style={styles.buttonRow}>
          {show.ticketUrl && (
            <TouchableOpacity
              style={[styles.button, styles.ticketButton]}
              onPress={handleTickets}
              activeOpacity={0.8}
              accessibilityLabel="Get tickets"
              accessibilityRole="button"
            >
              <Text style={styles.ticketButtonText}>🎟  Get Tickets</Text>
            </TouchableOpacity>
          )}
          {show.facebookUrl && (
            <TouchableOpacity
              style={[styles.button, styles.fbButton]}
              onPress={handleFacebook}
              activeOpacity={0.8}
              accessibilityLabel="Facebook event"
              accessibilityRole="button"
            >
              <Text style={styles.fbButtonText}>Facebook Event</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E4C97A';
const GOLD_DIM = '#7A6030';
const BLACK_DEEP = '#0A0A0A';

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },

  // Flyer — full width, portrait aspect ratio
  flyer: {
    width: '100%',
    aspectRatio: 285 / 427, // exact dimensions of the flyer asset
    backgroundColor: BLACK_DEEP,
  },

  // Countdown
  countdownBlock: {
    alignItems: 'center',
    paddingVertical: 18,
    width: '100%',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 58,
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: 'bold',
    lineHeight: 42,
    textShadowColor: GOLD,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  timeLabel: {
    color: GOLD_DIM,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  colonSep: {
    color: GOLD,
    fontSize: 30,
    fontWeight: 'bold',
    paddingBottom: 14,
    marginHorizontal: 2,
  },
  untilLabel: {
    color: GOLD_LIGHT,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 8,
    opacity: 0.85,
  },
  doorsOpenText: {
    color: GOLD_LIGHT,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 8,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  ticketButton: {
    backgroundColor: GOLD,
  },
  ticketButtonText: {
    color: BLACK_DEEP,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fbButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: GOLD_DIM,
  },
  fbButtonText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default UpcomingEventCard;
