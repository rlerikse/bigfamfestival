import { getEventDisplayState } from '../utils/scheduleUtils';
import { ScheduleEvent } from '../types/event';

/**
 * Unit coverage for BFF-127: pure display-state derivation for the Schedule
 * list's memoized `EventCard` prop.
 *
 * Imports ONLY `scheduleUtils.ts` (zero React Native / Expo imports), never
 * `ScheduleScreen.tsx` or `EventCard.tsx` — importing either (or any module
 * pulling in `@expo/vector-icons` / `expo-image`) fails under this repo's
 * Jest config on the Expo SDK 54 font-asset transform, even without
 * `render()` (see `scheduleUtils.genre.test.ts`, BFF-124 / #187).
 */

function makeEvent(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    id: overrides.id ?? 'evt-1',
    name: overrides.name ?? 'Test Event',
    stage: overrides.stage ?? 'Main Stage',
    date: overrides.date ?? '2026-08-01',
    startTime: overrides.startTime ?? '18:00',
    endTime: overrides.endTime ?? '19:00',
    artists: overrides.artists ?? ['artist-1'],
    ...overrides,
  };
}

describe('getEventDisplayState', () => {
  it('returns "upcoming" before the event starts', () => {
    const ev = makeEvent({ date: '2026-08-01', startTime: '18:00', endTime: '19:00' });
    const nowMs = new Date('2026-08-01T17:59:00').getTime();
    expect(getEventDisplayState(ev, nowMs)).toBe('upcoming');
  });

  it('returns "live" at the exact start instant', () => {
    const ev = makeEvent({ date: '2026-08-01', startTime: '18:00', endTime: '19:00' });
    const nowMs = new Date('2026-08-01T18:00:00').getTime();
    expect(getEventDisplayState(ev, nowMs)).toBe('live');
  });

  it('returns "live" while between start and end', () => {
    const ev = makeEvent({ date: '2026-08-01', startTime: '18:00', endTime: '19:00' });
    const nowMs = new Date('2026-08-01T18:30:00').getTime();
    expect(getEventDisplayState(ev, nowMs)).toBe('live');
  });

  it('returns "completed" at the exact end instant', () => {
    const ev = makeEvent({ date: '2026-08-01', startTime: '18:00', endTime: '19:00' });
    const nowMs = new Date('2026-08-01T19:00:00').getTime();
    expect(getEventDisplayState(ev, nowMs)).toBe('completed');
  });

  it('returns "completed" well after the event ends', () => {
    const ev = makeEvent({ date: '2026-08-01', startTime: '18:00', endTime: '19:00' });
    const nowMs = new Date('2026-08-02T08:00:00').getTime();
    expect(getEventDisplayState(ev, nowMs)).toBe('completed');
  });

  it('handles events that cross midnight — still "live" after midnight but before the wrapped end', () => {
    const ev = makeEvent({ date: '2026-08-01', startTime: '23:30', endTime: '01:00' });
    const nowMs = new Date('2026-08-02T00:15:00').getTime();
    expect(getEventDisplayState(ev, nowMs)).toBe('live');
  });

  it('handles events that cross midnight — "completed" after the wrapped end', () => {
    const ev = makeEvent({ date: '2026-08-01', startTime: '23:30', endTime: '01:00' });
    const nowMs = new Date('2026-08-02T01:00:00').getTime();
    expect(getEventDisplayState(ev, nowMs)).toBe('completed');
  });

  it('applies the existing 2-hour fallback duration when endTime is absent', () => {
    const ev = makeEvent({ date: '2026-08-01', startTime: '18:00', endTime: '' });
    const justBeforeEnd = new Date('2026-08-01T19:59:00').getTime();
    const atEnd = new Date('2026-08-01T20:00:00').getTime();
    expect(getEventDisplayState(ev, justBeforeEnd)).toBe('live');
    expect(getEventDisplayState(ev, atEnd)).toBe('completed');
  });

  it('reflects a fake-clock jump across multiple boundaries in one step', () => {
    const ev = makeEvent({ date: '2026-08-01', startTime: '18:00', endTime: '19:00' });
    const before = new Date('2026-08-01T17:00:00').getTime();
    const after = new Date('2026-08-01T20:00:00').getTime();
    expect(getEventDisplayState(ev, before)).toBe('upcoming');
    expect(getEventDisplayState(ev, after)).toBe('completed');
  });

  it('defaults to "upcoming" for a malformed event missing date/startTime', () => {
    const ev = makeEvent({ date: '', startTime: '' });
    const nowMs = new Date('2026-08-01T18:00:00').getTime();
    expect(getEventDisplayState(ev, nowMs)).toBe('upcoming');
  });
});
