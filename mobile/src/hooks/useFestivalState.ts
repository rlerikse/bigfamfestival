/**
 * useFestivalState
 *
 * Determines whether the festival is currently "live" (inside the active festival
 * window) or "upcoming/neutral" (outside it).
 *
 * Configuration is fetched from Firestore at:
 *   /config/festivalWindow  { windowStart: Timestamp, windowEnd: Timestamp }
 *
 * If Firestore is unavailable or the document doesn't exist, we fall back to the
 * static dates in festival.config.ts (startDate / endDate).  This means the app
 * always shows *something* sensible — the Firestore document is only needed when
 * you want to adjust the window without a new build.
 *
 * Firestore document format:
 *   {
 *     windowStart: Timestamp,   // When the festival experience begins (e.g. gate-open time)
 *     windowEnd:   Timestamp,   // When the festival experience ends   (e.g. Sunday midnight)
 *   }
 *
 * Atlas / Robert can update this document in the Firebase console at any time.
 */

import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, Timestamp } from 'firebase/firestore';
import { app } from '../config/firebase';
import { festivalConfig } from '../config/festival.config';

export type FestivalPhase = 'upcoming' | 'live' | 'past';

export interface FestivalState {
  phase: FestivalPhase;
  /** The configured window start, or null while loading */
  windowStart: Date | null;
  /** The configured window end, or null while loading */
  windowEnd: Date | null;
  /** True until the first config fetch resolves */
  isLoading: boolean;
}

// Parse "YYYY-MM-DD" → Date at local midnight
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getFallbackWindow(): { start: Date; end: Date } {
  // Use festival.config startDate/endDate; festival ends at midnight after endDate
  const start = parseDateString(festivalConfig.startDate);
  const end = parseDateString(festivalConfig.endDate);
  // Push end to end-of-day (23:59:59) so the last day counts as live
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function computePhase(now: Date, start: Date, end: Date): FestivalPhase {
  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'live';
}

export function useFestivalState(): FestivalState {
  const [state, setState] = useState<FestivalState>({
    phase: 'upcoming',
    windowStart: null,
    windowEnd: null,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      let start: Date;
      let end: Date;

      try {
        const db = getFirestore(app);
        const configDoc = await getDoc(doc(db, 'config', 'festivalWindow'));

        if (configDoc.exists()) {
          const data = configDoc.data();
          const rawStart = data?.windowStart;
          const rawEnd = data?.windowEnd;

          if (rawStart instanceof Timestamp && rawEnd instanceof Timestamp) {
            start = rawStart.toDate();
            end = rawEnd.toDate();
          } else {
            // Firestore doc exists but fields are missing / wrong type — use fallback
            console.warn('[useFestivalState] festivalWindow doc has unexpected shape, using fallback');
            const fallback = getFallbackWindow();
            start = fallback.start;
            end = fallback.end;
          }
        } else {
          // Document doesn't exist yet — use static config
          const fallback = getFallbackWindow();
          start = fallback.start;
          end = fallback.end;
        }
      } catch (err) {
        // Firestore unavailable (offline, rules error, etc.) — degrade gracefully
        console.warn('[useFestivalState] Firestore fetch failed, using fallback:', err);
        const fallback = getFallbackWindow();
        start = fallback.start;
        end = fallback.end;
      }

      if (!mounted) return;

      const now = new Date();
      setState({
        phase: computePhase(now, start, end),
        windowStart: start,
        windowEnd: end,
        isLoading: false,
      });
    };

    loadConfig();

    // Re-evaluate phase every minute (so 'upcoming' → 'live' flips without a restart)
    const tick = setInterval(() => {
      setState(prev => {
        if (!prev.windowStart || !prev.windowEnd) return prev;
        return {
          ...prev,
          phase: computePhase(new Date(), prev.windowStart, prev.windowEnd),
        };
      });
    }, 60_000);

    return () => {
      mounted = false;
      clearInterval(tick);
    };
  }, []);

  return state;
}
