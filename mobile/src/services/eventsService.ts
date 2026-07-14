/**
 * Events Service
 *
 * Fetches festival events from the API with offline-first caching.
 * - On success: writes to AsyncStorage cache
 * - On failure (offline / error): falls back to cached data
 * - Cache TTL: 1 hour (stale but usable at festival with poor connectivity)
 */
import { api } from './api';
import { getIdToken } from './firebaseAuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import genreService from './genreService';
import { ScheduleEvent } from '../types/event';

const EVENTS_CACHE_KEY = 'cached_events';
const EVENTS_CACHE_TIMESTAMP_KEY = 'cached_events_timestamp';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Write events to AsyncStorage cache.
 */
const cacheEvents = async (events: ScheduleEvent[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
    await AsyncStorage.setItem(EVENTS_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (err) {
    console.warn('[EventsService] Failed to cache events:', err);
  }
};

/**
 * Read events from AsyncStorage cache.
 * Returns null if cache is missing or expired.
 */
export const getCachedEvents = async (): Promise<ScheduleEvent[] | null> => {
  try {
    const [data, tsStr] = await Promise.all([
      AsyncStorage.getItem(EVENTS_CACHE_KEY),
      AsyncStorage.getItem(EVENTS_CACHE_TIMESTAMP_KEY),
    ]);

    if (!data) return null;

    // Allow stale cache at festival (poor connectivity) — only expire in production
    // If timestamp is missing or expired, still return data but flag as stale
    if (tsStr) {
      const age = Date.now() - parseInt(tsStr, 10);
      if (age > CACHE_TTL_MS && __DEV__) {
        console.warn('[EventsService] Event cache is stale (>1h)');
      }
    }

    return JSON.parse(data) as ScheduleEvent[];
  } catch (err) {
    console.warn('[EventsService] Failed to read events cache:', err);
    return null;
  }
};

/**
 * Check whether cached events exist and are fresh (within TTL).
 */
export const hasFreshEventCache = async (): Promise<boolean> => {
  try {
    const tsStr = await AsyncStorage.getItem(EVENTS_CACHE_TIMESTAMP_KEY);
    if (!tsStr) return false;
    return Date.now() - parseInt(tsStr, 10) < CACHE_TTL_MS;
  } catch {
    return false;
  }
};

/**
 * Fetch all festival events.
 * - Attempts API fetch first
 * - On network failure: falls back to AsyncStorage cache
 * - Returns { events, fromCache } so callers can show stale-data banners
 */
export const fetchEvents = async (): Promise<{
  events: ScheduleEvent[];
  fromCache: boolean;
}> => {
  // Check connectivity before hitting the API interceptor (which throws on offline)
  const netInfo = await NetInfo.fetch();

  if (!netInfo.isConnected) {
    const cached = await getCachedEvents();
    if (cached) {
      if (__DEV__) console.log('[EventsService] Offline — serving from cache');
      return { events: cached, fromCache: true };
    }
    throw new Error('You\'re offline and no cached event data is available.');
  }

  try {
    // Auth is optional for /events (public endpoint) — don't let auth failures block event loading
    let token: string | null = null;
    try {
      token = await getIdToken();
    } catch {
      // Auth not available — proceed without token (events endpoint is public)
    }
    const response = await api.get<ScheduleEvent[]>('/events', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    // Populate genres
    const eventsWithGenres = await genreService.populateEventGenres(response.data);

    // Cache for offline use
    await cacheEvents(eventsWithGenres);

    return { events: eventsWithGenres, fromCache: false };
  } catch (err) {
    // API failed — try cache as fallback
    const cached = await getCachedEvents();
    if (cached) {
      console.warn('[EventsService] API error — serving from cache:', err);
      return { events: cached, fromCache: true };
    }
    throw err;
  }
};
