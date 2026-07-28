import {
  computeFestivalDay,
  previousCalendarDate,
  minutesFromFestivalStart,
  rangesOverlap,
} from './festival-day.util';

describe('computeFestivalDay', () => {
  it('returns the same date when startTime is exactly 06:00 (boundary is inclusive of "day")', () => {
    expect(computeFestivalDay('2026-06-21', '06:00')).toBe('2026-06-21');
  });

  it('returns the same date for evening events (>= 06:00)', () => {
    expect(computeFestivalDay('2026-06-21', '19:00')).toBe('2026-06-21');
    expect(computeFestivalDay('2026-06-21', '23:59')).toBe('2026-06-21');
  });

  it('returns the previous calendar date for after-midnight events (< 06:00)', () => {
    // The <06:00 edge case: a 2am set belongs to the previous festival day.
    expect(computeFestivalDay('2026-06-21', '02:00')).toBe('2026-06-20');
    expect(computeFestivalDay('2026-06-21', '04:00')).toBe('2026-06-20');
    expect(computeFestivalDay('2026-06-21', '00:00')).toBe('2026-06-20');
    expect(computeFestivalDay('2026-06-21', '05:59')).toBe('2026-06-20');
  });

  it('rolls back across month boundaries', () => {
    expect(computeFestivalDay('2026-07-01', '01:00')).toBe('2026-06-30');
  });

  it('rolls back across year boundaries', () => {
    expect(computeFestivalDay('2027-01-01', '03:30')).toBe('2026-12-31');
  });

  it('handles leap-day arithmetic', () => {
    expect(computeFestivalDay('2028-03-01', '02:00')).toBe('2028-02-29');
  });

  it('throws on malformed date', () => {
    expect(() => computeFestivalDay('06/21/2026', '02:00')).toThrow();
    expect(() => computeFestivalDay('2026-6-21', '02:00')).toThrow();
  });

  it('throws on malformed startTime', () => {
    expect(() => computeFestivalDay('2026-06-21', '2:00')).toThrow();
    expect(() => computeFestivalDay('2026-06-21', '25:00')).toThrow();
    expect(() => computeFestivalDay('2026-06-21', 'noon')).toThrow();
  });
});

describe('previousCalendarDate', () => {
  it('subtracts a single day', () => {
    expect(previousCalendarDate('2026-06-21')).toBe('2026-06-20');
  });

  it('is timezone-stable regardless of host offset', () => {
    // UTC-based arithmetic should not drift near DST changes.
    expect(previousCalendarDate('2026-03-09')).toBe('2026-03-08');
    expect(previousCalendarDate('2026-11-02')).toBe('2026-11-01');
  });
});

describe('minutesFromFestivalStart', () => {
  it('maps 06:00 to zero (start of festival day)', () => {
    expect(minutesFromFestivalStart('06:00')).toBe(0);
  });

  it('maps evening times relative to the 06:00 start', () => {
    expect(minutesFromFestivalStart('23:00')).toBe(17 * 60);
  });

  it('wraps pre-06:00 times to the tail of the festival day', () => {
    // 00:30 is 18.5h after the 06:00 start.
    expect(minutesFromFestivalStart('00:30')).toBe(18 * 60 + 30);
    expect(minutesFromFestivalStart('05:59')).toBe(23 * 60 + 59);
  });
});

describe('rangesOverlap', () => {
  it('detects simple same-evening overlap', () => {
    expect(rangesOverlap('19:00', '21:00', '20:00', '22:00')).toBe(true);
  });

  it('allows back-to-back (touching edges do not overlap)', () => {
    expect(rangesOverlap('19:00', '21:00', '21:00', '23:00')).toBe(false);
  });

  it('allows fully separate ranges', () => {
    expect(rangesOverlap('12:00', '13:00', '18:00', '19:00')).toBe(false);
  });

  it('detects cross-midnight overlap (11pm–1am vs 12:30am–2am)', () => {
    // Same festival night despite different calendar dates.
    expect(rangesOverlap('23:00', '01:00', '00:30', '02:00')).toBe(true);
  });

  it('allows an 11pm–12am block back-to-back with a 12am–2am block', () => {
    expect(rangesOverlap('23:00', '00:00', '00:00', '02:00')).toBe(false);
  });

  it('detects a late-evening block overlapping an after-midnight block', () => {
    expect(rangesOverlap('23:30', '00:45', '00:30', '01:30')).toBe(true);
  });
});
