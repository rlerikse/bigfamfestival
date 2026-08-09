# Tasks: Schedule Genre Filter Uses the Current Lineup

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)  
**Prerequisites**: Approved Checkpoint 1 specification; SIMPLE complexity  
**Scope**: `mobile/src/utils/scheduleUtils.ts`, `mobile/src/screens/ScheduleScreen.tsx`, and new `mobile/src/__tests__/scheduleUtils.genre.test.ts` only. No backend, data-model, contract, or UI/reducer changes.

**Testing constraint**: Tests must import only `mobile/src/utils/scheduleUtils.ts`. Do not import or render `ScheduleScreen.tsx`, `@expo/vector-icons`, or `expo-image` modules because Expo SDK 54's Jest font-asset transform fails for that import chain (BFF-124 / #187).

## Phase 1: Pure Genre-Option Helper Coverage

**Goal**: Establish the full Jest-safe contract for lineup-derived genre options before implementation.

**Independent Test**: `deriveGenreOptions()` returns the deterministic, complete option list from supplied full-lineup events without React Native, Expo, Firestore, or component imports.

- [x] T001 [US1] [UNIT] [M] Add failing direct unit coverage for `deriveGenreOptions` in `/Users/rerikse3/repos/es/bigfamfestival/mobile/src/__tests__/scheduleUtils.genre.test.ts`, importing only `/Users/rerikse3/repos/es/bigfamfestival/mobile/src/utils/scheduleUtils.ts`; cover distinct array-backed genres across events, `event.genre` fallback only when `event.genres` is absent, present-but-empty `event.genres` taking precedence over `event.genre`, duplicate collapse, alphabetical ordering with `All Genres` first, and empty/no-genre events returning only `All Genres` with no catalog/static fallback (FR-002, FR-003, FR-004, FR-005, FR-006, FR-007; DR-5).
- [x] T002 [D:T001] [US1] [M] Implement and export the pure `deriveGenreOptions(events: ScheduleEvent[]): GenreOption[]` helper (and an option type if needed) in `/Users/rerikse3/repos/es/bigfamfestival/mobile/src/utils/scheduleUtils.ts`; retain zero React Native/Expo imports, derive from every supplied event, use a present `event.genres` array exclusively even when empty, otherwise use `event.genre`, deduplicate, alphabetically sort, and prepend `{ id: 'all', label: 'All Genres', value: 'all' }` (FR-001 through FR-006, FR-008; DR-1, DR-2, DR-4, DR-5).

## Phase 2: Full-Lineup Screen Wiring

**Goal**: Make the existing Schedule filter consume the pure full-lineup derivation and remove the disconnected catalog path without changing filter behavior.

**Independent Test**: With the helper passing, `ScheduleScreen` builds `genreOptions` from the complete loaded `events` array and no longer reads the Firestore `genres` collection or a sample fallback.

- [x] T003 [D:T002] [US2] [M] Update `/Users/rerikse3/repos/es/bigfamfestival/mobile/src/screens/ScheduleScreen.tsx` to import and call `deriveGenreOptions(events)` inside `genreOptions` with `[events]` as its dependency; remove `genres` state, `fetchGenres`, its two invoking effects, the `sampleGenres` fallback, and the Firestore `genres` collection read; remove `collection`, `getDocs`, and `firestore` imports only after confirming they have no remaining in-file use. Preserve the filter reducer, selection persistence, multi-select behavior, and all day/stage/My-Schedule/horizontal-schedule filtering (FR-001, FR-005, FR-006, FR-008, FR-009; DR-3).

## Phase 3: Focused Regression Validation

**Goal**: Prove the pure derivation and wiring compile without triggering the known Expo component-import test failure.

- [x] T004 [D:T003] [US2] [UNIT] [S] Run `npx jest --config jest.config.js mobile/src/__tests__/scheduleUtils.genre.test.ts` from `/Users/rerikse3/repos/es/bigfamfestival/mobile` and confirm all lineup-option scenarios pass without importing `/Users/rerikse3/repos/es/bigfamfestival/mobile/src/screens/ScheduleScreen.tsx` (FR-007; SC-002, SC-003).
- [x] T005 [D:T004] [S] Run `npm run typecheck` and `npm run lint` from `/Users/rerikse3/repos/es/bigfamfestival/mobile`; resolve only errors introduced by the changes to `/Users/rerikse3/repos/es/bigfamfestival/mobile/src/utils/scheduleUtils.ts`, `/Users/rerikse3/repos/es/bigfamfestival/mobile/src/screens/ScheduleScreen.tsx`, and `/Users/rerikse3/repos/es/bigfamfestival/mobile/src/__tests__/scheduleUtils.genre.test.ts`.

## Requirement Coverage

| Requirement | Tasks |
|---|---|
| FR-001: lineup is the option source | T002, T003 |
| FR-002: array and single-value compatibility | T001, T002 |
| FR-003: deduplication and alphabetical order | T001, T002 |
| FR-004: retain `All Genres`, exclude unrelated values | T001, T002 |
| FR-005: each offered genre maps to an event; preserve filter composition | T001, T002, T003 |
| FR-006: no static fallback or independent catalog fetch | T001, T003 |
| FR-007: focused regression coverage | T001, T004 |
| FR-008: full, day-independent loaded events input | T002, T003 |
| FR-009: unchanged reducer and other filters | T003 |

## Dependencies & Execution Order

`T001 -> T002 -> T003 -> T004 -> T005`

This is intentionally sequential: the test first defines the pure contract, the helper then gives the screen a Jest-safe dependency, and the screen wiring cannot safely land before that helper exists. There are no parallel opportunities within this narrow three-file fix.

## Implementation Strategy

1. Start with T001 and T002 to achieve the independently testable pure-helper MVP.
2. Complete T003 as the sole screen integration step, keeping all unrelated filters untouched.
3. Finish T004 and T005 before handoff. Do not run `git commit`; pipeline orchestration owns staging review and commit after Checkpoint 2.

## Test Distribution

| Level | Count | % | Target | Status |
|---|---:|---:|---|---|
| UNIT | 2 | 100% | >=50% | Pass - focused bug-fix regression uses a pure unit boundary |
| INTG | 0 | 0% | ~25% | N/A - component import is blocked by the known Expo Jest transform defect |
| E2E | 0 | 0% | <=15% | Pass |
| SIM | 0 | 0% | ~10% | N/A |

## Task Summary

- **Total tasks**: 5
- **Phases**: 3
- **Estimated effort**: 2 small tasks (about 20 minutes), 2 medium tasks (about 60 minutes), and focused validation (about 20 minutes); approximately 1.5-2 hours.
- **Formatting**: All five tasks use the required checkbox, sequential ID, dependency, story (where applicable), size, test-level (for test tasks), exact-file-path format.