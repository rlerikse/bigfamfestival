/**
 * UpcomingEventsList
 * Scrollable list of upcoming shows, each rendered as an UpcomingEventCard.
 *
 * Data flow:
 *   1. Fetch all events from eventsService (Firestore-backed, offline-cached)
 *   2. Filter to events that have a doorsTime in the future (or within 4h of closing)
 *   3. Cast to UpcomingShow — events missing flyerUrl fall back to local asset map
 *      inside UpcomingEventCard via the id-keyed LOCAL_FLYERS lookup.
 *
 * Tonight's fallback: SEED_SHOWS is always merged in if no Firestore shows are found,
 * so the Josh Teed card always renders regardless of API health.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import UpcomingEventCard from './UpcomingEventCard';
import { fetchEvents } from '../services/eventsService';
import { UpcomingShow } from '../types/event';

// ─── Hardcoded seed show (tonight's fallback) ─────────────────────────────────
// Remove or supersede once Firestore events have flyerUrl / ticketUrl / doorsTime populated.
const SEED_SHOWS: UpcomingShow[] = [
  {
    id: 'josh-teed-2026-04-25',
    name: 'Josh Teed',
    stage: 'The Crofoot / Pike Room',
    date: '2026-04-25',
    startTime: '20:00',
    endTime: '23:59',
    artists: [],
    supportAct: 'with support from Mfinity',
    doorsTime: '2026-04-25T20:00:00-04:00',
    venueName: 'The Crofoot / Pike Room',
    venueCity: 'Pontiac, MI',
    ticketUrl: 'https://www.ticketweb.com/event/josh-teed-pike-room-the-crofoot-tickets/14180784',
    facebookUrl: 'https://facebook.com/events/s/josh-teed-pike-room/1535485537547851/',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Show is "upcoming" if doorsTime is in the future, or within 4 hours after doors */
function isUpcoming(show: UpcomingShow): boolean {
  if (!show.doorsTime) return false;
  const doors = new Date(show.doorsTime).getTime();
  const now = Date.now();
  return now < doors + 4 * 60 * 60 * 1000;
}

function mergeWithSeeds(firebaseShows: UpcomingShow[]): UpcomingShow[] {
  const ids = new Set(firebaseShows.map(s => s.id));
  const extras = SEED_SHOWS.filter(s => !ids.has(s.id));
  return [...firebaseShows, ...extras]
    .filter(isUpcoming)
    .sort((a, b) => {
      const ta = a.doorsTime ? new Date(a.doorsTime).getTime() : 0;
      const tb = b.doorsTime ? new Date(b.doorsTime).getTime() : 0;
      return ta - tb;
    });
}

// ─── Component ────────────────────────────────────────────────────────────────
const UpcomingEventsList: React.FC = () => {
  const [shows, setShows] = useState<UpcomingShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { events } = await fetchEvents();
        // Cast events to UpcomingShow — extra fields (flyerUrl etc.) will be
        // present if Firestore has them, undefined otherwise (graceful degradation)
        const upcomingFromFirestore = events as UpcomingShow[];
        if (mounted) setShows(mergeWithSeeds(upcomingFromFirestore));
      } catch {
        // API down — still render seed shows
        if (mounted) setShows(SEED_SHOWS.filter(isUpcoming));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color="#C9A84C" />
      </View>
    );
  }

  if (shows.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>UPCOMING SHOWS</Text>
      {shows.map(show => (
        <UpcomingEventCard key={show.id} show={show} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 12,
  },
  sectionHeader: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  loadingRow: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default UpcomingEventsList;
