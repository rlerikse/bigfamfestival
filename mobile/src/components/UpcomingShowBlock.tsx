/**
 * UpcomingShowBlock — Josh Teed @ The Crofoot, April 25 2026
 * Dark/gold aesthetic matching the Big Fam flyer.
 * Shows: flyer image, artist, support, venue, countdown to doors, ticket + FB buttons.
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

// ─── Config ──────────────────────────────────────────────────────────────────
const SHOW_CONFIG = {
  artist: 'Josh Teed',
  support: 'with support from Mfinity',
  dateLabel: 'Saturday, April 25, 2026',
  doorsLabel: 'Doors 8:00 PM EST',
  // Doors: Saturday April 25 2026 8:00pm America/Detroit (EDT = UTC-4)
  doorsDate: new Date('2026-04-25T20:00:00-04:00'),
  venue: 'The Crofoot / Pike Room',
  city: 'Detroit, MI',
  // TODO: Replace with real links when available
  ticketUrl: 'https://www.ticketweb.com/event/josh-teed-pike-room-the-crofoot-tickets/14180784',
  facebookUrl: 'https://facebook.com/events/s/josh-teed-pike-room/1535485537547851/',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, total };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const GoldDivider: React.FC = () => (
  <View style={styles.divider} />
);

interface TimeUnitProps {
  value: number;
  label: string;
}
const TimeUnit: React.FC<TimeUnitProps> = ({ value, label }) => (
  <View style={styles.timeUnit}>
    <Text style={styles.timeValue}>{value.toString().padStart(2, '0')}</Text>
    <Text style={styles.timeLabel}>{label}</Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UpcomingShowBlock: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(SHOW_CONFIG.doorsDate));

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(getTimeLeft(SHOW_CONFIG.doorsDate));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleTickets = useCallback(() => {
    Linking.openURL(SHOW_CONFIG.ticketUrl).catch(() => { /* ignore */ });
  }, []);

  const handleFacebook = useCallback(() => {
    Linking.openURL(SHOW_CONFIG.facebookUrl).catch(() => { /* ignore */ });
  }, []);

  const doorsOpen = timeLeft.total <= 0;

  return (
    <View style={styles.container}>
      {/* Gold border card */}
      <View style={styles.card}>

        {/* Flyer image — full width, aspect ratio preserved */}
        <Image
          source={require('../assets/images/josh-teed-flyer.jpg')}
          style={styles.flyer}
          resizeMode="cover"
          accessibilityLabel="Josh Teed — The Crofoot Detroit flyer"
        />

        {/* Content body */}
        <View style={styles.body}>

          {/* Artist name */}
          <Text style={styles.artistName}>Josh Teed</Text>
          <Text style={styles.supportText}>with support from Mfinity</Text>

          <GoldDivider />

          {/* Date / venue */}
          <Text style={styles.dateText}>Saturday, April 25, 2026</Text>
          <Text style={styles.venueText}>The Crofoot / Pike Room — Detroit, MI</Text>

          <GoldDivider />

          {/* Countdown */}
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
              <Text style={styles.doorsTimeText}>Doors 8:00 PM EST</Text>
            </View>
          )}

          <GoldDivider />

          {/* CTA Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.ticketButton]}
              onPress={handleTickets}
              activeOpacity={0.8}
              accessibilityLabel="Get tickets"
              accessibilityRole="button"
            >
              <Text style={styles.ticketButtonText}>🎟  Get Tickets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.fbButton]}
              onPress={handleFacebook}
              activeOpacity={0.8}
              accessibilityLabel="Facebook event"
              accessibilityRole="button"
            >
              <Text style={styles.fbButtonText}>Facebook Event</Text>
            </TouchableOpacity>
          </View>

        </View>
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
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: BLACK_CARD,
    overflow: 'hidden',
    // iOS gold glow
    ...Platform.select({
      ios: {
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 12,
        shadowOpacity: 0.4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  flyer: {
    width: '100%',
    aspectRatio: 16 / 9,
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
  doorsTimeText: {
    color: '#8A7050',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
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
    borderWidth: 0,
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

export default UpcomingShowBlock;
