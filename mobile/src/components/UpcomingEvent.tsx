import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useCountdown } from '../hooks/useCountdown';

const EVENT_DATE = new Date('2026-04-25T20:00:00-04:00'); // 8 PM EST (EDT)
const HIDE_AFTER = new Date('2026-04-26T02:00:00-04:00'); // event date + 6 hours

const TICKET_URL = 'https://www.ticketweb.com/event/josh-teed-pike-room-the-crofoot-tickets/14180784';
const FACEBOOK_URL = 'https://facebook.com/events/s/josh-teed-pike-room/1535485537547851/';

const flyerImage = require('../assets/images/josh-teed-flyer.jpg');

const UpcomingEvent = () => {
  const timeLeft = useCountdown(EVENT_DATE);
  const [hidden, setHidden] = React.useState(() => Date.now() > HIDE_AFTER.getTime());

  React.useEffect(() => {
    if (Date.now() > HIDE_AFTER.getTime()) {
      setHidden(true);
    }
  }, [timeLeft]);

  if (hidden) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={styles.container}>
      <ExpoImage
        source={flyerImage}
        style={styles.flyer}
        contentFit="contain"
        transition={300}
      />

      <View style={styles.details}>
        <Text style={styles.artist}>Josh Teed</Text>
        <Text style={styles.support}>with support from Manity</Text>

        <View style={styles.divider} />

        <Text style={styles.info}>Saturday, April 25, 2026</Text>
        <Text style={styles.info}>Doors: 8:00 PM EST</Text>
        <Text style={styles.info}>The Crofoot / Pike Room, Detroit, MI</Text>
        <Text style={styles.presentedBy}>Presented by The Crofoot & Big Fam</Text>

        {timeLeft && (
          <View style={styles.countdownSection}>
            <Text style={styles.countdownLabel}>Doors Open In</Text>
            <View style={styles.countdownRow}>
              {[
                { value: timeLeft.days, label: 'DAYS' },
                { value: timeLeft.hours, label: 'HRS' },
                { value: timeLeft.minutes, label: 'MIN' },
                { value: timeLeft.seconds, label: 'SEC' },
              ].map((item, i) => (
                <View key={item.label} style={styles.countdownBlock}>
                  <Text style={styles.countdownValue}>{pad(item.value)}</Text>
                  <Text style={styles.countdownUnit}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => Linking.openURL(TICKET_URL)}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Tickets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={() => Linking.openURL(FACEBOOK_URL)}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.buttonOutlineText]}>Facebook Event</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  flyer: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  details: {
    padding: 16,
    alignItems: 'center',
  },
  artist: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4A574',
    letterSpacing: 1,
  },
  support: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 4,
  },
  divider: {
    height: 1,
    width: '60%',
    backgroundColor: '#B87333',
    opacity: 0.4,
    marginVertical: 12,
  },
  info: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 2,
  },
  presentedBy: {
    fontSize: 12,
    color: '#B87333',
    marginTop: 8,
    fontStyle: 'italic',
  },
  countdownSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#D4A574',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countdownBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,165,116,0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 56,
  },
  countdownValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  countdownUnit: {
    fontSize: 10,
    color: '#B87333',
    marginTop: 2,
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  button: {
    flex: 1,
    backgroundColor: '#B87333',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#B87333',
  },
  buttonOutlineText: {
    color: '#D4A574',
  },
});

export default UpcomingEvent;
