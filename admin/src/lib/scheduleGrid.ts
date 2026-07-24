// Shared time/grid math for the Schedule Editor (#165 epic).
// Day boundary rule (Robert): each festival day's column runs 6am -> 6am next
// morning. A set that starts before 06:00 belongs to the PREVIOUS festival day.

export const STAGE_COLUMNS = ['Apogee', 'Bayou', 'Gallery'] as const;
export type StageColumn = (typeof STAGE_COLUMNS)[number];

export const SLOT_MINUTES = 15;
export const PX_PER_MINUTE = 2; // 120px/hour — dense but readable at 15-min granularity
export const DAY_START_HOUR = 6; // 06:00
export const DAY_END_HOUR = 30; // 30:00 == 06:00 next real day
export const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60; // 24h span
export const HEADER_HEIGHT = 48;
export const TIME_GUTTER_WIDTH = 64;
export const STAGE_COLUMN_MIN_WIDTH = 220;

export const BLOCK_TYPE_COLORS: Record<string, string> = {
  artist_set: 'bg-purple-500/20 border-purple-500 text-purple-100',
  workshop: 'bg-blue-500/20 border-blue-500 text-blue-100',
  setup: 'bg-neutral-700/40 border-neutral-500 text-neutral-100',
  special: 'bg-orange-500/20 border-orange-500 text-orange-100',
};

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  artist_set: 'Artist Set',
  workshop: 'Workshop',
  setup: 'Setup / Line Check',
  special: 'Special',
};

/** Add days to a YYYY-MM-DD date string, returns YYYY-MM-DD. */
export function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Compute festivalDay per Robert's rule: if startTime < 06:00, festivalDay is
 * the previous calendar date of `date`; otherwise festivalDay === date.
 */
export function computeFestivalDay(date: string, startTime: string): string {
  const [h] = startTime.split(':').map(Number);
  return h < DAY_START_HOUR ? addDays(date, -1) : date;
}

/** Minutes since the 06:00 column start, correctly wrapping post-midnight times. */
export function timeToColumnMinutes(startTime: string): number {
  const [h, m] = startTime.split(':').map(Number);
  const adjustedH = h < DAY_START_HOUR ? h + 24 : h;
  return (adjustedH - DAY_START_HOUR) * 60 + m;
}

export function columnMinutesToTime(minutes: number): string {
  let totalMin = DAY_START_HOUR * 60 + minutes;
  totalMin = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function snapToSlot(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

export function formatColumnHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export function formatFestivalDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/**
 * Given the real `date` this block resolves to when moved to `newColumnMinutes`
 * within the given `festivalDay` column, compute the real wall-clock date the
 * block should be stored with (times before 06:00 land on the day AFTER the
 * festivalDay, per the inverse of the day-boundary rule).
 */
export function columnMinutesToRealDate(festivalDay: string, columnMinutes: number): string {
  const hourOfDay = Math.floor(columnMinutes / 60) % 24;
  const wrapsPastMidnight = DAY_START_HOUR + Math.floor(columnMinutes / 60) >= 24;
  return wrapsPastMidnight || hourOfDay < DAY_START_HOUR ? addDays(festivalDay, 1) : festivalDay;
}
