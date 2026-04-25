/**
 * UpcomingEventCard
 * Compact horizontal card matching the Big Fam schedule card aesthetic.
 * Layout: [thumbnail] | [name / venue+time / genre / desc] | [countdown]
 *
 * Data-driven from UpcomingShow (Firestore-sourced). All show-specific fields
 * (flyerUrl, ticketUrl, doorsTime, etc.) are optional — degrades gracefully.
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

/** Compact countdown label: "2d 4h", "45m", "OPEN" */
function countdownLabel(t: TimeLeft): string {
  if (t.total <= 0) return 'OPEN';
  if (t.days > 0) return `${t.days}d ${t.hours}h`;
  if (t.hours > 0) return `${t.hours}h ${t.minutes}m`;
  return `${t.minutes}m ${t.seconds}s`;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  show: UpcomingShow;
}

const UpcomingEventCard: React.FC<Props> = ({ show }) => {
  const timeLeft = useCountdown(show.doorsTime);
  const flyerSource = getFlyerSource(show);
  const isOpen = timeLeft !== null && timeLeft.total <= 0;

  const handleTickets = useCallback(() => {
    if (show.ticketUrl) Linking.openURL(show.ticketUrl).catch(() => {});
  }, [show.ticketUrl]);

  // Format "Venue — HH:MM AM/PM"
  const venueLine = (() => {
    const venue = show.venueName || show.stage || '';
    const time = (() => {
      try {
        if (show.doorsTime) {
          return new Date(show.doorsTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
        }
        if (show.startTime) return show.startTime;
        return '';
      } catch { return ''; }
    })();
    return [venue, time].filter(Boolean).join(' \u2022 ');
  })();

  const cityLine = show.venueCity || '';
  const genre = show.genre || (show.genres && show.genres[0]) || '';
  // Use supportAct as the description line
  const descLine = show.supportAct || show.description || '';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={show.ticketUrl ? 0.75 : 1}
      onPress={show.ticketUrl ? handleTickets : undefined}
      accessibilityRole={show.ticketUrl ? 'button' : 'none'}
      accessibilityLabel={`${show.name} — tap to get tickets`}
    >
      {/* Thumbnail */}
      <View style={styles.thumbContainer}>
        {flyerSource ? (
          <Image
            source={flyerSource}
            style={styles.thumb}
            resizeMode="cover"
            onError={() => console.warn('[UpcomingEventCard] thumb failed:', show.id)}
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={styles.thumbPlaceholderText}>
              {show.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Text body */}
      <View style={styles.textBody}>
        <Text style={styles.eventName} numberOfLines={1}>{show.name}</Text>
        {venueLine ? (
          <Text style={styles.venueLine} numberOfLines={1}>{venueLine}</Text>
        ) : null}
        {cityLine ? (
          <Text style={styles.cityLine} numberOfLines={1}>{cityLine}</Text>
        ) : null}
        {genre ? (
          <Text style={styles.genreLabel} numberOfLines={1}>{genre}</Text>
        ) : null}
        {descLine ? (
          <Text style={styles.descLine} numberOfLines={1}>{descLine}</Text>
        ) : null}
      </View>

      {/* Right column: countdown + ticket CTA */}
      <View style={styles.rightCol}>
        {timeLeft !== null && (
          <Text style={[styles.countdownBadge, isOpen && styles.countdownOpen]}>
            {countdownLabel(timeLeft)}
          </Text>
        )}
        {show.ticketUrl ? (
          <View style={styles.ticketBadge}>
            <Text style={styles.ticketIcon}>🎟</Text>
            <Text style={styles.ticketText}>Tickets</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_BG = 'rgba(30, 45, 30, 0.82)';   // dark forest green, semi-transparent
const COPPER = '#D4946B';
const GOLD = '#C9A84C';
const WHITE = '#F0EDE8';
const MUTED = '#A09880';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    minHeight: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        shadowOpacity: 0.35,
      },
      android: { elevation: 4 },
    }),
  },
  thumbContainer: {
    width: 100,
    height: 100,
    flexShrink: 0,
  },
  thumb: {
    width: 100,
    height: 100,
  },
  thumbPlaceholder: {
    backgroundColor: '#1a2a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    color: GOLD,
    fontSize: 36,
    fontWeight: '800',
  },
  textBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  eventName: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  venueLine: {
    color: MUTED,
    fontSize: 13,
    marginBottom: 1,
  },
  cityLine: {
    color: MUTED,
    fontSize: 12,
    marginBottom: 2,
  },
  genreLabel: {
    color: COPPER,
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: 2,
  },
  descLine: {
    color: MUTED,
    fontSize: 12,
    fontStyle: 'italic',
  },
  rightCol: {
    paddingRight: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 64,
  },
  countdownBadge: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  countdownOpen: {
    color: COPPER,
  },
  ticketBadge: {
    alignItems: 'center',
  },
  ticketIcon: {
    fontSize: 20,
  },
  ticketText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});

export default UpcomingEventCard;
