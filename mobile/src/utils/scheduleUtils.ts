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
