// src/utils/scheduleUtils.ts
/**
 * Shared schedule-view helpers so the vertical list and horizontal grid
 * views stay in lockstep on what counts as a "live" event, day cutoffs, etc.
 * Do not duplicate this logic locally in either view — import from here.
 */
import { ScheduleEvent } from '../types/event';

/** 6:30am — day boundary used consistently across schedule views. */
export const SCHEDULE_DAY_CUTOFF_MINUTES = 6 * 60 + 30;

/**
 * Determine if an event is currently live given a timestamp (ms).
 * Mirrors the isLive check inside EventCard.tsx.
 */
export function isEventLive(ev: ScheduleEvent, nowMs: number): boolean {
  if (!ev.date || !ev.startTime) return false;
  const startTs = new Date(`${ev.date}T${ev.startTime}`).getTime();
  let endTs: number;
  if (ev.endTime && ev.endTime.trim()) {
    endTs = new Date(`${ev.date}T${ev.endTime}`).getTime();
    if (endTs <= startTs) endTs += 24 * 60 * 60 * 1000; // crosses midnight
  } else {
    endTs = startTs + 2 * 60 * 60 * 1000; // fallback 2h
  }
  return nowMs >= startTs && nowMs < endTs;
}

/**
 * Resolve the end timestamp (ms) of an event, mirroring the same
 * start/end/midnight-crossing/2h-fallback logic used by isEventLive above.
 * Exported so callers can determine "has this day fully ended" without
 * reimplementing the date-math.
 */
export function getEventEndMs(ev: ScheduleEvent): number | null {
  if (!ev.date || !ev.startTime) return null;
  const startTs = new Date(`${ev.date}T${ev.startTime}`).getTime();
  let endTs: number;
  if (ev.endTime && ev.endTime.trim()) {
    endTs = new Date(`${ev.date}T${ev.endTime}`).getTime();
    if (endTs <= startTs) endTs += 24 * 60 * 60 * 1000; // crosses midnight
  } else {
    endTs = startTs + 2 * 60 * 60 * 1000; // fallback 2h
  }
  return endTs;
}

export type ScheduleDayScrollTarget = 'live' | 'first' | 'last' | 'none';

/**
 * Decide where the schedule views (vertical list + horizontal grid) should
 * auto-scroll to when the selected day changes, per issue #147 (+ Robert's
 * day-over clarification, ~2026-07-20 20:24 EDT):
 *  - Day in progress (a live event exists right now) -> scroll to the live event.
 *  - Day is fully over (no live event, and now is at/after every event's end) -> scroll to the LAST event of the day.
 *  - Day hasn't started yet (no live event, and now is before at least one event's end) -> scroll to the FIRST event of the day.
 *  - No events at all for the day -> 'none' (nothing to scroll to).
 *
 * Both ScheduleScreen.tsx (vertical list) and HorizontalScheduleView.tsx
 * (horizontal grid) must call this instead of reimplementing the
 * live/first/last decision locally, so behavior stays in lockstep.
 */
export function resolveScheduleDayScrollTarget(events: ScheduleEvent[], nowMs: number): ScheduleDayScrollTarget {
  if (events.length === 0) return 'none';
  if (events.some(ev => isEventLive(ev, nowMs))) return 'live';
  const endTimes = events.map(getEventEndMs).filter((t): t is number => t !== null);
  if (endTimes.length === 0) return 'none';
  const dayIsOver = nowMs >= Math.max(...endTimes);
  return dayIsOver ? 'last' : 'first';
}

/**
 * Stage-row height (px) used by HorizontalScheduleView's grid layout. Lives
 * here (rather than as a local constant in HorizontalScheduleView.tsx) so
 * clampVerticalOffset below stays importable without pulling in that
 * component's react-native / expo-image / @expo/vector-icons imports, which
 * are not transformable by this repo's Jest config (see BFF-124 / #187,
 * SafeText.test.tsx for the same underlying Expo SDK 54 incompatibility).
 */
export const SCHEDULE_ROW_HEIGHT = 108;

/**
 * Clamp a previously-saved vertical stage-row scroll offset (px) to the
 * currently valid range, so a filter/day change that shrinks the stage list
 * can't leave a stale, out-of-bounds offset restored after a remount.
 * Pure and exported so it can be unit-tested directly with plain Jest (no
 * `@testing-library/react-native` `render()` — see plan.md DR-5).
 */
export function clampVerticalOffset(
  savedY: number | null | undefined,
  stageCount: number,
  viewportHeight: number
): number {
  if (savedY == null || !Number.isFinite(savedY) || stageCount <= 0) return 0;
  const contentHeight = SCHEDULE_ROW_HEIGHT * stageCount;
  const maxScrollY = Math.max(0, contentHeight - viewportHeight);
  return Math.min(Math.max(savedY, 0), maxScrollY);
}

/** A selectable option in the Schedule screen's genre filter dropdown. */
export interface GenreOption {
  id: string;
  label: string;
  value: string;
}

/**
 * Derive the Schedule screen's selectable genre filter options from the
 * full, already artist-enriched, loaded current-year `events` lineup —
 * per BFF-128 (#185), replacing the prior independent Firestore `genres`
 * collection / hardcoded fallback as the filter's source of truth.
 *
 * Mirrors the exact field precedence used by the existing genre-matching
 * filter logic in ScheduleScreen.tsx (DR-5): when an event's `genres` is a
 * present array, it is used exclusively for that event (even if empty);
 * `genre` is only used as a fallback when `genres` is absent. This keeps
 * every offered option matchable by at least one lineup event (FR-005).
 *
 * Pure and side-effect-free — callers pass the FULL loaded `events` array
 * (not a day-filtered subset) so the result stays day-independent across
 * pull-to-refresh and day changes (FR-008, DR-3). Reads only the
 * already-enriched `events` state; performs no Firestore/artist lookups
 * of its own (DR-4).
 */
export function deriveGenreOptions(events: ScheduleEvent[]): GenreOption[] {
  const genreSet = new Set<string>();
  events.forEach(event => {
    if (event.genres && Array.isArray(event.genres)) {
      event.genres.forEach(genre => {
        if (genre && genre.trim()) genreSet.add(genre);
      });
    } else if (event.genre && event.genre.trim()) {
      genreSet.add(event.genre);
    }
  });

  const sortedGenres = Array.from(genreSet).sort((a, b) => a.localeCompare(b));

  return [
    { id: 'all', label: 'All Genres', value: 'all' },
    ...sortedGenres.map(genre => ({
      id: genre,
      label: genre,
      value: genre,
    })),
  ];
}
