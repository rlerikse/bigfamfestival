import { deriveGenreOptions } from '../utils/scheduleUtils';
import { ScheduleEvent } from '../types/event';

/**
 * Unit coverage for BFF-128: lineup-derived genre filter options.
 *
 * Imports ONLY `scheduleUtils.ts` (zero React Native / Expo imports), never
 * `ScheduleScreen.tsx` — importing that screen (or any module pulling in
 * `@expo/vector-icons` / `expo-image`) fails under this repo's Jest config
 * on the Expo SDK 54 font-asset transform, even without `render()` (see
 * `HorizontalScheduleView.test.ts`, BFF-124 / #187).
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

describe('deriveGenreOptions', () => {
  it('collects distinct genres from array-backed event.genres across multiple events', () => {
    const events = [
      makeEvent({ id: '1', genres: ['Techno', 'House'] }),
      makeEvent({ id: '2', genres: ['Rock'] }),
    ];
    expect(deriveGenreOptions(events)).toEqual([
      { id: 'all', label: 'All Genres', value: 'all' },
      { id: 'House', label: 'House', value: 'House' },
      { id: 'Rock', label: 'Rock', value: 'Rock' },
      { id: 'Techno', label: 'Techno', value: 'Techno' },
    ]);
  });

  it('falls back to the single-value event.genre only when event.genres is absent', () => {
    const events = [
      makeEvent({ id: '1', genre: 'Jazz' }),
      makeEvent({ id: '2', genres: ['Funk'] }),
    ];
    expect(deriveGenreOptions(events)).toEqual([
      { id: 'all', label: 'All Genres', value: 'all' },
      { id: 'Funk', label: 'Funk', value: 'Funk' },
      { id: 'Jazz', label: 'Jazz', value: 'Jazz' },
    ]);
  });

  it('prefers a present-but-empty event.genres array over event.genre on the same event', () => {
    const events = [
      makeEvent({ id: '1', genres: [], genre: 'Jazz' }),
    ];
    // event.genres is present (even empty), so it takes precedence and
    // contributes nothing — event.genre must NOT be used as a fallback here.
    expect(deriveGenreOptions(events)).toEqual([
      { id: 'all', label: 'All Genres', value: 'all' },
    ]);
  });

  it('collapses duplicate genre values across events into one option', () => {
    const events = [
      makeEvent({ id: '1', genres: ['Techno'] }),
      makeEvent({ id: '2', genres: ['Techno'] }),
      makeEvent({ id: '3', genre: 'Techno' }),
    ];
    expect(deriveGenreOptions(events)).toEqual([
      { id: 'all', label: 'All Genres', value: 'all' },
      { id: 'Techno', label: 'Techno', value: 'Techno' },
    ]);
  });

  it('sorts options alphabetically with All Genres always first', () => {
    const events = [
      makeEvent({ id: '1', genres: ['Techno', 'Ambient', 'Reggae'] }),
    ];
    expect(deriveGenreOptions(events)).toEqual([
      { id: 'all', label: 'All Genres', value: 'all' },
      { id: 'Ambient', label: 'Ambient', value: 'Ambient' },
      { id: 'Reggae', label: 'Reggae', value: 'Reggae' },
      { id: 'Techno', label: 'Techno', value: 'Techno' },
    ]);
  });

  it('returns only All Genres when no events have usable genre values, with no catalog/static fallback', () => {
    expect(deriveGenreOptions([])).toEqual([
      { id: 'all', label: 'All Genres', value: 'all' },
    ]);

    const events = [
      makeEvent({ id: '1', genres: [] }),
      makeEvent({ id: '2' }),
    ];
    expect(deriveGenreOptions(events)).toEqual([
      { id: 'all', label: 'All Genres', value: 'all' },
    ]);
  });
});
