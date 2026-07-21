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
