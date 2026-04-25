/**
 * ShowModeHome — Festival-style live view for a single venue show.
 * Mirrors the LiveUpcomingEvents 3-stage pattern but for one venue.
 * Shows: now playing / up next + full set time lineup.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';

// ─── Set times (hardcoded fallback — Koda seeding Firestore) ──────────────────
const SET_TIMES = [
  { artist: 'Elektrik Cats', start: '20:00', end: '21:00' },
  { artist: 'Thane Of Earth', start: '21:00', end: '22:00' },
  { artist: 'Stimpack', start: '22:00', end: '23:00' },
  { artist: 'Josh Teed', start: '23:00', end: '00:30' },
  { artist: 'Mfinity', start: '00:30', end: '01:30' },
];

const EVENT_DATE = '2026-04-25';
const TICKET_URL = 'https://www.ticketweb.com/event/josh-teed-pike-room-the-crofoot-tickets/14180784';
const FACEBOOK_URL = 'https://facebook.com/events/s/josh-teed-pike-room/1535485537547851/';
const VENUE = 'The Crofoot / Pike Room';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseSetTime(dateStr: string, timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr + 'T00:00:00-04:00');
  // Handle post-midnight times (after midnight = next day)
  if (h < 12) d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const hour12 = h % 12 || 12;
  const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ShowModeHome: React.FC = () => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000); // update every 10s
    return () => clearInterval(id);
  }, []);

  const sets = useMemo(() => {
    return SET_TIMES.map(s => ({
      ...s,
      startMs: parseSetTime(EVENT_DATE, s.start),
      endMs: parseSetTime(EVENT_DATE, s.end),
    }));
  }, []);

  const currentSet = useMemo(() => sets.find(s => now >= s.startMs && now < s.endMs), [sets, now]);
  const nextSet = useMemo(() => {
    if (currentSet) {
      const idx = sets.indexOf(currentSet);
      return idx < sets.length - 1 ? sets[idx + 1] : null;
    }
    return sets.find(s => now < s.startMs) || null;
  }, [sets, currentSet, now]);

  const showStarted = now >= sets[0].startMs;
  const showEnded = now >= sets[sets.length - 1].endMs;

  // Countdown to doors (8 PM)
  const doorsMs = sets[0].startMs;
  const untilDoors = Math.max(0, doorsMs - now);
  const countdownD = Math.floor(untilDoors / (1000 * 60 * 60 * 24));
  const countdownH = Math.floor((untilDoors / (1000 * 60 * 60)) % 24);
  const countdownM = Math.floor((untilDoors / (1000 * 60)) % 60);
  const countdownS = Math.floor((untilDoors / 1000) % 60);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={styles.container}>
      {/* Flyer hero */}
      <Image
        source={require('../assets/images/josh-teed-flyer.jpg')}
        style={styles.flyer}
        resizeMode="contain"
      />

      {/* Venue name */}
      <Text style={styles.venueName}>{VENUE}</Text>
      <Text style={styles.venueCity}>Pontiac, MI</Text>

      {/* Now Playing / Countdown */}
      {showEnded ? (
        <View style={styles.statusBlock}>
          <Text style={styles.statusLabel}>SHOW ENDED</Text>
          <Text style={styles.statusArtist}>Thanks for coming! 🎶</Text>
        </View>
      ) : currentSet ? (
        <View style={styles.statusBlock}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>NOW PLAYING</Text>
          </View>
          <Text style={styles.statusArtist}>{currentSet.artist}</Text>
          <Text style={styles.statusTime}>
            {formatTime(currentSet.start)} — {formatTime(currentSet.end)}
          </Text>
          {nextSet && (
            <Text style={styles.upNextText}>
              Up next: {nextSet.artist} at {formatTime(nextSet.start)}
            </Text>
          )}
        </View>
      ) : !showStarted ? (
        <View style={styles.statusBlock}>
          <Text style={styles.countdownLabel}>UNTIL DOORS</Text>
          <View style={styles.countdownRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeValue}>{pad(countdownD)}</Text>
              <Text style={styles.timeLabel}>DAYS</Text>
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeValue}>{pad(countdownH)}</Text>
              <Text style={styles.timeLabel}>HRS</Text>
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeValue}>{pad(countdownM)}</Text>
              <Text style={styles.timeLabel}>MIN</Text>
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.timeBlock}>
              <Text style={styles.timeValue}>{pad(countdownS)}</Text>
              <Text style={styles.timeLabel}>SEC</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Full lineup */}
      <View style={styles.lineupSection}>
        <Text style={styles.lineupHeader}>TONIGHT'S LINEUP</Text>
        {sets.map((s, i) => {
          const isLive = currentSet?.artist === s.artist;
          const isPast = now >= s.endMs;
          return (
            <View
              key={i}
              style={[
                styles.lineupRow,
                isLive && styles.lineupRowLive,
                isPast && styles.lineupRowPast,
              ]}
            >
              {isLive && <View style={styles.lineupDot} />}
              <Text style={[
                styles.lineupTime,
                isLive && styles.lineupTimeLive,
                isPast && styles.lineupTimePast,
              ]}>
                {formatTime(s.start)}
              </Text>
              <Text style={[
                styles.lineupArtist,
                isLive && styles.lineupArtistLive,
                isPast && styles.lineupArtistPast,
              ]}>
                {s.artist}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.ticketBtn}
          onPress={() => Linking.openURL(TICKET_URL).catch(() => { /* ignore */ })}
          activeOpacity={0.8}
        >
          <Text style={styles.ticketBtnText}>🎟  Get Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fbBtn}
          onPress={() => Linking.openURL(FACEBOOK_URL).catch(() => { /* ignore */ })}
          activeOpacity={0.8}
        >
          <Text style={styles.fbBtnText}>Facebook Event</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E4C97A';
const GOLD_DIM = '#7A6030';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  flyer: {
    width: '100%',
    height: 340,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
  },
  venueName: {
    color: GOLD_LIGHT,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 12,
    textShadowColor: GOLD,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  venueCity: {
    color: '#B0956A',
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  // Status block (now playing / countdown)
  statusBlock: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  liveText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  statusLabel: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  statusArtist: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: GOLD,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  statusTime: {
    color: GOLD_DIM,
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  upNextText: {
    color: '#B0956A',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Countdown
  countdownLabel: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 8,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: '#B87333',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timeLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  colon: {
    color: GOLD,
    fontSize: 28,
    fontWeight: 'bold',
    paddingBottom: 12,
    marginHorizontal: 2,
  },
  // Lineup
  lineupSection: {
    width: '100%',
    marginTop: 20,
    backgroundColor: 'rgba(10, 10, 10, 0.7)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)',
  },
  lineupHeader: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  lineupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(201, 168, 76, 0.15)',
  },
  lineupRowLive: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  lineupRowPast: {
    opacity: 0.4,
  },
  lineupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  lineupTime: {
    color: GOLD_DIM,
    fontSize: 13,
    fontWeight: '600',
    width: 80,
  },
  lineupTimeLive: {
    color: '#FF3B30',
  },
  lineupTimePast: {},
  lineupArtist: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  lineupArtistLive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  lineupArtistPast: {
    color: '#888',
  },
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  ticketBtn: {
    flex: 1,
    backgroundColor: GOLD,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  ticketBtnText: {
    color: '#0A0A0A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fbBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: GOLD_DIM,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  fbBtnText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default ShowModeHome;
