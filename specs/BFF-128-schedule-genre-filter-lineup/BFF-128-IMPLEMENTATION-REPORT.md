# Implementation Report: BFF-128 Schedule Genre Filter Uses the Current Lineup

**Source of truth**: [GitHub Issue #185](https://github.com/rlerikse/bigfamfestival/issues/185)
**Status**: Implementation complete; native device verification pending
**Feature Branch**: `bugfix/BFF-128-genre-filter-lineup`
**Report Generated At**: 2026-08-09T17:31:52Z
**Report Base Commit**: `df05bcbdbb09cd3d39fbf3cac634ea3dd8f11b30`
**Spec Location**: [spec.md](./spec.md)

> The project's Jira space is closed. This report intentionally does not perform Jira synchronization; GitHub Issue #185 and the feature specification are authoritative.

---

## Executive Summary

The Schedule genre filter previously read a separate Firestore `genres` collection and used a hardcoded `sampleGenres` fallback. Neither source was tied to the loaded festival lineup, so attendees could select genres with no matching scheduled event.

The fix makes the loaded, artist-enriched `events` array the only source of selectable genres. A pure `deriveGenreOptions(events)` helper builds a distinct, alphabetically ordered, day-independent list with `All Genres` first. The Schedule screen now memoizes that helper from the full `events` array and removes the independent catalog read and static fallback.

| Metric | Verified Value |
|---|---:|
| Feature commits | 3 |
| Source files touched | 3 |
| Tasks completed | 5/5 |
| Acceptance criteria met | 6/6 |
| Focused Jest tests | 6/6 passing |
| TypeScript errors | 0 |
| Lint errors | 0 |
| Verification findings | 0 |

## Delivery Timeline

| Phase | Commit | Timestamp | Result |
|---|---|---|---|
| Specification and clarification | `d6fddf0` | 2026-08-09T13:13:01-04:00 | Source issue captured; human clarification recorded |
| Plan and tasks | `6aaebdc` | 2026-08-09T13:21:08-04:00 | SIMPLE three-file implementation plan and five-task breakdown |
| Implementation and verification | `df05bcb` | 2026-08-09T13:29:49-04:00 | Helper, screen wiring, regression suite, and verification report |

The recorded feature-commit timeline spans about 17 minutes from specification commit to implementation commit. This is commit chronology, not a measured engineer-effort duration.

## Implementation Evidence

### Changed Source Files

| File | Change |
|---|---|
| [mobile/src/utils/scheduleUtils.ts](../../mobile/src/utils/scheduleUtils.ts) | Added pure `GenreOption` and `deriveGenreOptions(events)` with `event.genres`-first precedence, `event.genre` fallback, deduplication, alphabetical ordering, and `All Genres`. |
| [mobile/src/screens/ScheduleScreen.tsx](../../mobile/src/screens/ScheduleScreen.tsx) | Replaced catalog-backed `genreOptions` with `useMemo(() => deriveGenreOptions(events), [events])`; removed `genres` state, `fetchGenres`, its effects, `sampleGenres`, and the now-unused Firestore imports/read. |
| [mobile/src/__tests__/scheduleUtils.genre.test.ts](../../mobile/src/__tests__/scheduleUtils.genre.test.ts) | Added six direct Jest cases for array genres, single-value fallback, empty-array precedence, deduplication, order, and no-fallback behavior. |

### Behavior Preserved

- The genre filter remains multi-select through the existing `selectedGenres` state.
- Genre options derive from the complete loaded lineup, not a selected-day subset, so the list remains stable across refresh and day changes.
- The filter reducer, selection persistence, and day, stage, My Schedule, and horizontal schedule filtering behavior were not changed.
- The helper mirrors the screen's existing matching precedence: a present `event.genres` array is authoritative, including an empty array; `event.genre` is used only when that array is absent.

## Clarification Outcome

The clarification flow included three human decisions and two code-evidence technical resolutions. The earlier auto-reset direction was explicitly superseded by DR-3: options are the stable, full-lineup list, and filter selections and behavior remain unchanged. This avoided both an unnecessary reset behavior and a scope expansion into the existing filter reducer.

## Acceptance Criteria Traceability

| Acceptance Criterion | Status | Evidence |
|---|---|---|
| Full-lineup, day-independent options plus `All Genres` | Met | `deriveGenreOptions(events)` is called from the screen with the full `events` array; array-backed collection test passes. |
| Duplicate genres appear only once | Met | `Set` collection plus duplicate-collapse test. |
| Unrelated catalog genres are not offered | Met | The Firestore `genres` read, `fetchGenres`, and `sampleGenres` fallback were removed. |
| Array-backed event genres remain selectable and matchable | Met | Array-precedence helper branch and focused test. |
| Single-value `event.genre` remains selectable and matchable | Met | Fallback helper branch and focused test. |
| Failed or unavailable independent genre source does not inject a fallback | Met | No independent genre source or hardcoded fallback remains; empty/no-genre test returns only `All Genres`. |

## Validation Evidence

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Passed with 0 errors |
| `npx jest --config jest.config.js src/__tests__/scheduleUtils.genre.test.ts` | Passed: 6/6 tests |
| Focused ESLint on the three source files | Passed with 0 errors; 3 pre-existing non-null assertion warnings in `ScheduleScreen.tsx` are unrelated and untouched |
| BLUE verify subagent | PASS, 0 critical, major, or minor findings |
| Independent pipeline pre-PR re-verification | PASS |

The unit-test boundary intentionally imports only the pure `scheduleUtils.ts` helper. This avoids the known Expo SDK 54 Jest font-asset transform failure caused by importing `ScheduleScreen.tsx` or its Expo-dependent component chain.

## Pending Follow-Up

Manual native verification on iOS and Android remains pending. The change is pure logic with focused unit coverage, but the visible genre option list should still be spot-checked on-device: confirm only represented lineup genres appear, each produces a result, and the list remains stable after refresh and day changes.

## Scope and Risk Assessment

The implementation stayed within the planned three source-file boundary. It introduces no backend, API, data model, Firestore write, or UI-reducer change. Removing the independent catalog read is a net reduction in direct Firestore usage and improves offline correctness because the filter now depends only on the already-loaded schedule data.

## Git Evidence

```text
d6fddf0 docs(BFF-128): spec + clarify for lineup-sourced genre filter
6aaebdc docs(BFF-128): implementation plan + tasks
df05bcb feat(BFF-128): derive schedule genre filter options from current lineup
```

The report is based on `df05bcbdbb09cd3d39fbf3cac634ea3dd8f11b30`. It should be committed with the feature branch before PR creation; no Jira closeout is applicable.