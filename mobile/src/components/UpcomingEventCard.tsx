/**
 * UpcomingEventCard
 * Data-driven card for an upcoming show/concert.
 * Renders: flyer image → artist + support → venue/date → live countdown → CTA buttons.
 *
 * Accepts an UpcomingShow object (Firestore-sourced). All show-specific fields
 * (flyerUrl, ticketUrl, doorsTime, etc.) are optional — card degrades gracefully.
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

// ─── Local flyer fallback map ─────────────────────────────────────────────────
// Maps event IDs (or artist name slugs) to bundled local assets.
// Add entries here when a flyer image isn't available remotely.
const LOCAL_FLYERS: Record<string, ReturnType<typeof require>> = {
  'josh-teed-2026-04-25': require('../assets/images/josh-teed-flyer.jpg'),
};

function getFlyerSource(show: UpcomingShow) {
  // Remote URL takes priority
  if (show.flyerUrl) return { uri: show.flyerUrl };
  // Local bundled fallback keyed by event id or name slug
  const slug = show.id || show.name.toLowerCase().replace(/\s+/g, '-');
  if (LOCAL_FLYERS[slug]) return LOCAL_FLYERS[slug];
  return null;
}

// ─── Countdown helpers ────────────────────────────────────────────────────────
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
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

// ─── Sub-components ───────────────────────────────────────────────────────────
const GoldDivider = () => <View style={styles.divider} />;

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <View style={styles.timeUnit}>
    <Text style={styles.timeValue}>{value.toString().padStart(2, '0')}</Text>
    <Text style={styles.timeLabel}>{label}</Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  show: UpcomingShow;
}

const UpcomingEventCard: React.FC<Props> = ({ show }) => {
  const timeLeft = useCountdown(show.doorsTime);
  const flyerSource = getFlyerSource(show);
  const doorsOpen = timeLeft !== null && timeLeft.total <= 0;

  const handleTickets = useCallback(() => {
    if (show.ticketUrl) Linking.openURL(show.ticketUrl).catch(() => {});
  }, [show.ticketUrl]);

  const handleFacebook = useCallback(() => {
    if (show.facebookUrl) Linking.openURL(show.facebookUrl).catch(() => {});
  }, [show.facebookUrl]);

  // Format date label from show.date (YYYY-MM-DD) or fall back to doorsTime
  const dateLabel = (() => {
    try {
      const d = show.date
        ? new Date(show.date + 'T12:00:00')
        : show.doorsTime
        ? new Date(show.doorsTime)
        : null;
      if (!d) return '';
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return show.date || '';
    }
  })();

  const doorsLabel = (() => {
    if (!show.doorsTime) return null;
    try {
      return new Date(show.doorsTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return null;
    }
  })();

  const venueLine = [show.venueName || show.stage, show.venueCity]
    .filter(Boolean)
    .join(' \u2014 ');

  return (
    <View style={styles.card}>
      {/* Flyer */}
      {flyerSource && (
        <Image
          source={flyerSource}
          style={styles.flyer}
          resizeMode="contain"
          onError={() => console.warn('[UpcomingEventCard] Flyer failed to load:', show.id)}
          accessibilityLabel={`${show.name} flyer`}
        />
      )}

      <View style={styles.body}>
        {/* Artist */}
        <Text style={styles.artistName}>{show.name}</Text>
        {show.supportAct ? (
          <Text style={styles.supportText}>{show.supportAct}</Text>
        ) : null}

        <GoldDivider />

        {/* Date / venue */}
        {dateLabel ? <Text style={styles.dateText}>{dateLabel}</Text> : null}
        {venueLine ? <Text style={styles.venueText}>{venueLine}</Text> : null}
        {doorsLabel ? (
          <Text style={styles.doorsTimeText}>Doors {doorsLabel}</Text>
        ) : null}

        {/* Countdown — only shown when doorsTime is set */}
        {timeLeft !== null && (
          <>
            <GoldDivider />
            {doorsOpen ? (
              <View style={styles.doorsOpenRow}>
                <Text style={styles.doorsOpenText}>🚪 DOORS OPEN</Text>
              </View>
            ) : (
              <View style={styles.countdownSection}>
                <Text style={styles.countdownTitle}>DOORS OPEN IN</Text>
                <View style={styles.countdownRow}>
                  <TimeUnit value={timeLeft.days} label="DAYS" />
                  <Text style={styles.colonSep}>:</Text>
                  <TimeUnit value={timeLeft.hours} label="HRS" />
                  <Text style={styles.colonSep}>:</Text>
                  <TimeUnit value={timeLeft.minutes} label="MIN" />
                  <Text style={styles.colonSep}>:</Text>
                  <TimeUnit value={timeLeft.seconds} label="SEC" />
                </View>
              </View>
            )}
          </>
        )}

        {/* CTA Buttons */}
        {(show.ticketUrl || show.facebookUrl) && (
          <>
            <GoldDivider />
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
          </>
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E4C97A';
const GOLD_DIM = '#7A6030';
const BLACK_DEEP = '#0A0A0A';
const BLACK_CARD = '#111111';
const BLACK_INNER = '#161616';

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderBottomWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: BLACK_CARD,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 12,
        shadowOpacity: 0.35,
      },
      android: { elevation: 8 },
    }),
  },
  flyer: {
    width: '100%',
    height: 420,
    backgroundColor: BLACK_DEEP,
  },
  body: {
    padding: 18,
    backgroundColor: BLACK_INNER,
  },
  artistName: {
    color: GOLD_LIGHT,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: GOLD,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  supportText: {
    color: '#A89060',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: GOLD_DIM,
    marginVertical: 14,
    opacity: 0.6,
  },
  dateText: {
    color: GOLD_LIGHT,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  venueText: {
    color: '#B0956A',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  doorsTimeText: {
    color: '#8A7050',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  countdownSection: {
    alignItems: 'center',
  },
  countdownTitle: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 54,
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: 'bold',
    lineHeight: 38,
    textShadowColor: GOLD,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
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
    fontSize: 28,
    fontWeight: 'bold',
    paddingBottom: 12,
    marginHorizontal: 2,
  },
  doorsOpenRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  doorsOpenText: {
    color: GOLD_LIGHT,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
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
