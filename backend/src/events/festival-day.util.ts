/**
 * Festival-day boundary logic for the Schedule Editor (epic #165 / issue #166).
 *
 * A "festival day" runs 06:00 -> 06:00 (next calendar day). Anything that
 * starts before 06:00 belongs to the PREVIOUS calendar day's festival night.
 * This is kept as a SEPARATE field from `date` on purpose: mobile push
 * notification scheduling depends on `date`/`startTime` remaining real
 * wall-clock values, so we never overload `date`.
 *
 *   e.g. a set at 2026-06-21 02:00 belongs to festivalDay 2026-06-20.
 *        a set at 2026-06-21 19:00 belongs to festivalDay 2026-06-21.
 */

/** 06:00 — the wall-clock cutover between festival days. */
export const FESTIVAL_DAY_BOUNDARY_HOUR = 6;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Compute the festival day for an event.
 *
 * @param date      Calendar date in YYYY-MM-DD (the real wall-clock date).
 * @param startTime Start time in HH:MM (24h).
 * @returns         YYYY-MM-DD festival day. If startTime < 06:00 this is the
 *                  previous calendar date; otherwise it equals `date`.
 * @throws          Error if date or startTime are malformed — callers pass
 *                  DTO-validated values, but we fail loud rather than emit a
 *                  silently-wrong festivalDay.
 */
export function computeFestivalDay(date: string, startTime: string): string {
  if (!DATE_RE.test(date)) {
    throw new Error(
      `computeFestivalDay: invalid date "${date}" (expected YYYY-MM-DD)`,
    );
  }
  if (!TIME_RE.test(startTime)) {
    throw new Error(
      `computeFestivalDay: invalid startTime "${startTime}" (expected HH:MM)`,
    );
  }

  const hour = Number(startTime.slice(0, 2));
  if (hour >= FESTIVAL_DAY_BOUNDARY_HOUR) {
    return date;
  }

  return previousCalendarDate(date);
}

/**
 * Return the calendar date one day before the given YYYY-MM-DD.
 * Uses UTC to avoid host-timezone/DST drift — we only care about the date
 * arithmetic, not any local offset.
 */
export function previousCalendarDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  // Month is 0-indexed in Date; UTC keeps arithmetic offset-free.
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/**
 * Minutes since the start of the festival day (06:00) for a given wall-clock
 * time. Times before 06:00 belong to the tail end of the festival day, so they
 * map to 18:00-24:00 worth of offset (i.e. +24h) — this makes an 11pm block and
 * a 12:30am block on the same festival night directly comparable on one axis.
 *
 *   06:00 -> 0
 *   23:00 -> 1020
 *   00:30 -> 1110   (00:30 is 18.5h after the 06:00 start)
 *   05:59 -> 1439
 */
export function minutesFromFestivalStart(startTime: string): number {
  if (!TIME_RE.test(startTime)) {
    throw new Error(
      `minutesFromFestivalStart: invalid time "${startTime}" (expected HH:MM)`,
    );
  }
  const hour = Number(startTime.slice(0, 2));
  const minute = Number(startTime.slice(3, 5));
  const raw = hour * 60 + minute;
  const start = FESTIVAL_DAY_BOUNDARY_HOUR * 60;
  // Shift so 06:00 == 0; pre-06:00 wraps to the end of the festival day.
  return raw >= start ? raw - start : raw - start + 24 * 60;
}

/**
 * Do two [start,end) intervals on the same festival day overlap?
 * Inputs are HH:MM wall-clock times; both are normalized onto the festival-day
 * axis first so cross-midnight ranges compare correctly. Touching edges
 * (a.end == b.start) do NOT count as overlap — back-to-back sets are allowed.
 */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const a0 = minutesFromFestivalStart(aStart);
  const a1 = endMinutes(a0, aEnd);
  const b0 = minutesFromFestivalStart(bStart);
  const b1 = endMinutes(b0, bEnd);
  return a0 < b1 && b0 < a1;
}

/**
 * End offset on the festival-day axis. If the normalized end is <= start
 * (e.g. 23:00->01:00, or a 24h/wrap case), the event crosses the boundary so
 * we add a full day to keep end strictly after start.
 */
function endMinutes(startOffset: number, endTime: string): number {
  let end = minutesFromFestivalStart(endTime);
  if (end <= startOffset) {
    end += 24 * 60;
  }
  return end;
}
