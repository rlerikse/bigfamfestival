---
complexity_level: SIMPLE
---

# Implementation Plan: Schedule Genre Filter Uses the Current Lineup

**Branch**: `bugfix/BFF-128-genre-filter-lineup` | **Date**: 2026-08-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/BFF-128-schedule-genre-filter-lineup/spec.md`

---

## Summary

The Schedule screen's genre filter (`genreOptions`) currently derives its options from a
separate Firestore `genres` collection (via `fetchGenres()`), with a hardcoded
`sampleGenres` fallback on failure — neither is tied to the actual loaded lineup, so the
filter can advertise genres with zero matching events.

This fix replaces that source with a pure derivation over the already-loaded, artist-
enriched `events` array: collect distinct genre values from all loaded current-year
events (day-independent), using the same `event.genres` (array, preferred) →
`event.genre` (single-value fallback) precedence the existing filter-matching logic
already uses, dedupe, sort alphabetically, and prepend `All Genres`. The Firestore
`genres` fetch and the `sampleGenres` fallback are removed as the filter's source. No
other filter behavior (reducer, day/stage/My-Schedule filters, selection persistence,
multi-select) changes, per DR-3/FR-009.

The new derivation is implemented as a pure, side-effect-free helper
(`deriveGenreOptions`) in `mobile/src/utils/scheduleUtils.ts` — the same module that
already hosts `clampVerticalOffset`, `resolveScheduleDayScrollTarget`, etc. — so it can
be unit-tested directly with plain Jest, avoiding the Expo SDK 54 Jest-transform failure
that occurs when importing `ScheduleScreen.tsx` (or any `@expo/vector-icons` /
`expo-image`-bearing module) under this repo's Jest config (BFF-124 / #187 precedent).

---

## Technical Context

| Aspect | Value |
|--------|-------|
| **Primary Dependencies** | React Native 0.81.5, Expo SDK ~54, React 19.1.0, TypeScript (strict) |
| **Storage** | N/A for this fix — no new persistence; existing `events` state (Firestore-backed via `eventsService`) is the sole input |
| **Testing Framework** | Jest (`npx jest --config jest.config.js`), no `@testing-library/react-native` `render()` for this fix |
| **Target Platform** | iOS + Android (Expo managed workflow) |
| **Project Type** | Mobile (single React Native app, `mobile/`) |

**Performance Goals**: Derivation runs inside a `useMemo` keyed on `events` (already the
pattern used by `stageOptions`); no additional network calls, no measurable perf impact.

**Constraints**: Must not add a new Firestore read, artist-cache lookup, or any
async/side-effecting call (DR-4) — pure synchronous derivation over already-enriched
`events` only.

**Scale/Scope**: One screen (`ScheduleScreen.tsx`), one utility module
(`scheduleUtils.ts`), one new unit test file. No backend, no data model, no API
contract changes.

---

## Constitution Check

*GATE: Must pass before task generation.*

This plan is checked against `.specify/memory/constitution.md` (v1.4.0).

### Required Documentation Gates

- [x] N/A — API contract (OpenAPI/Swagger spec): not applicable, no backend/API change
- [x] N/A — Sequence diagram: not applicable, no cross-service interaction
- [x] N/A — Data model definition: not applicable, no schema change
- [x] N/A — Database migration: not applicable

### Constitution Compliance Gates

| Gate | Constitution Section | Spec Status | Result |
|------|----------------------|--------------|--------|
| Contract-First API Design (§I) | Backend/NestJS APIs | Not applicable — mobile-only, no API touched | ✅ PASS (N/A) |
| Firestore Data Safety (§III) | All Firestore ops through `FirestoreService`/services | This fix **removes** a direct-Firestore read (`collection(firestore, 'genres')`) from `ScheduleScreen.tsx`; adds none | ✅ PASS (net reduction in direct-SDK usage) |
| Documentation & Data Model Discipline (§IV) | Spec required in `specs/` | spec.md present, DR-1..DR-5 recorded | ✅ PASS |
| PII Handling (§V) | No PII in logs | Genre strings are non-PII; no new logging added | ✅ PASS |
| Mobile Development Standards (§IX) | Screens thin, `useMemo`/`useCallback`, pure helpers extracted | Derivation extracted to `scheduleUtils.ts` (pure function), `genreOptions` stays a `useMemo` in the screen | ✅ PASS |
| Offline Support & Caching (§X) | Cached schedule data usable offline | Genre options now derive from the same cached `events` the screen already shows offline — improves offline correctness (no dependent Firestore genre fetch) | ✅ PASS |

**Summary**: 6 PASS (2 N/A), 0 WARN, 0 FAIL.

> ✅ Constitution Pre-Check: All gates passing. No exemptions required.

---

## Project Structure

### Documentation (this feature)

```text
specs/BFF-128-schedule-genre-filter-lineup/
├── spec.md               # Approved specification (Checkpoint 1 signed off)
├── plan.md                # This file
└── tasks.md               # Phase 2 output (generated next)
```

No `research.md`, `data-model.md`, `contracts/`, or `quickstart.md` — this is a
SIMPLE-complexity bug fix with no unresolved technical unknowns, no data model
change, and no API contract change (per spec.md frontmatter `complexity_level: SIMPLE`).

### Source Code (repository root)

```text
mobile/
├── src/
│   ├── screens/
│   │   └── ScheduleScreen.tsx          # MODIFIED: genreOptions source + remove fetchGenres/sampleGenres
│   ├── utils/
│   │   └── scheduleUtils.ts            # MODIFIED: add deriveGenreOptions (+ GenreOption type)
│   └── __tests__/
│       └── scheduleUtils.genre.test.ts # NEW: unit coverage for deriveGenreOptions
```

**Structure Decision**: Single mobile project, existing structure. No new
directories. Follows the established `scheduleUtils.ts` pure-helper +
`mobile/src/__tests__/*.test.ts` pattern already used for `clampVerticalOffset`
(`HorizontalScheduleView.test.ts`) and other side-effect-free helpers
(`compassFusion.test.ts`, `friendLocationStream.test.ts`).

---

## Testing Strategy (Critical Constraint)

Per repo memory (BFF-124 / #187) and `HorizontalScheduleView.test.ts`'s documented
precedent: importing `ScheduleScreen.tsx`, or any module that transitively pulls in
`@expo/vector-icons` or `expo-image`, fails under this repo's Jest config on the Expo
SDK 54 font-asset transform — **even without calling `render()`**.

**Mitigation** (already the established pattern in this codebase):

- `deriveGenreOptions(events: ScheduleEvent[]): GenreOption[]` is added to
  `mobile/src/utils/scheduleUtils.ts` — a module with **zero** React Native / Expo
  imports (only imports the `ScheduleEvent` type from `../types/event`).
- `ScheduleScreen.tsx` imports `deriveGenreOptions` from `scheduleUtils.ts` and calls it
  inside the existing `genreOptions` `useMemo`. No screen-level render test is added or
  required for this fix.
- The new test file imports **only** from `scheduleUtils.ts`, never from
  `ScheduleScreen.tsx` — mirroring `HorizontalScheduleView.test.ts`'s import of
  `clampVerticalOffset`/`SCHEDULE_ROW_HEIGHT`.
- Tests run via `npx jest --config jest.config.js` (existing project script:
  `npm test` → `jest --config jest.config.js`).

### Required Coverage (maps to FR-007, SC-002, SC-003)

| Scenario | Spec Reference |
|----------|-----------------|
| Distinct genres collected from `event.genres` arrays across multiple events | FR-002, FR-003, US1-AC1/AC2 |
| Single-value `event.genre` fallback used only when `event.genres` is absent | FR-002, FR-005, DR-5, US2-AC1/AC2 |
| `event.genres` (even empty array) takes precedence over `event.genre` on the same event | DR-5, FR-005 |
| Duplicate genres across events collapse to one option | FR-003, US1-AC2 |
| Options are alphabetically sorted, `All Genres` always first | FR-003, FR-004, US1-AC1 |
| No events / no usable genre values → only `All Genres` returned (no static/sample fallback) | FR-006, Edge Cases table |
| Result is day-independent — caller passes the FULL loaded `events` array, not a day-filtered subset (verified by the helper's signature/contract, not by re-implementing day filtering in the test) | FR-008, DR-3 |

---

## Architecture Decisions

### Decision 1: Extract `deriveGenreOptions` as a pure helper in `scheduleUtils.ts` rather than inline in `ScheduleScreen.tsx`

**Context**: The genre-option derivation needs regression test coverage (FR-007), but
`ScheduleScreen.tsx` cannot be imported under this repo's Jest config due to an Expo SDK
54 font-asset transform failure (BFF-124 / #187).

**Decision**: Add `deriveGenreOptions(events: ScheduleEvent[]): GenreOption[]` (plus an
exported `GenreOption` type, or reuse the screen's existing inline shape) to
`mobile/src/utils/scheduleUtils.ts`, which has zero RN/Expo imports. `ScheduleScreen.tsx`
imports and calls it inside the existing `genreOptions` `useMemo`.

**Rationale**: `scheduleUtils.ts` is the established location for exactly this class of
helper (`clampVerticalOffset`, `resolveScheduleDayScrollTarget`, `isEventLive`) — all
extracted specifically so they can be unit-tested with plain Jest, no `render()`,
no RN import chain. This keeps the fix consistent with prior art in the same file
rather than introducing a new pattern.

**Alternatives Considered**:
- Leave the derivation inline in `ScheduleScreen.tsx`'s `useMemo` and skip automated
  tests — rejected: violates FR-007 (regression coverage is a hard requirement) and
  constitution mobile testing expectations.
- Add a new standalone `genreUtils.ts` file — rejected: unnecessary fragmentation; the
  existing `scheduleUtils.ts` already serves as the shared, Jest-safe home for
  schedule-view helpers, and the plan should not introduce a second convention.

### Decision 2: Remove `fetchGenres()`, the Firestore `genres` collection read, and `sampleGenres` entirely (not feature-flag or dead-code-leave)

**Context**: FR-001 and FR-006 require the Firestore `genres` collection and the
hardcoded fallback to no longer be the filter's source.

**Decision**: Delete `fetchGenres` (the `useCallback`), the `genres` state
(`useState<string[]>`), the two `useEffect`s that invoke `fetchGenres`, and the
Firestore `collection`/`getDocs` calls against the `genres` collection from
`ScheduleScreen.tsx`. Replace the `genreOptions` `useMemo`'s dependency from `genres` to
`events`, calling `deriveGenreOptions(events)`.

**Rationale**: DR-1 and FR-006 are explicit — no hardcoded list or failed-fetch fallback
may populate the filter at all, so leaving the dead code path (even unused) would
contradict FR-006 and create dead code the constitution's code-quality gate flags.

**Alternatives Considered**:
- Keep `fetchGenres` as an unused/dormant function for a possible future
  re-introduction — rejected: dead code, and directly contradicts FR-006's "no hardcoded
  genre list ... MAY populate" requirement if any code path could still produce one.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Removing `fetchGenres`'s `useEffect`s inadvertently removes an unrelated side effect (e.g., a login/token-refresh trigger reused elsewhere) | Low | Medium | Both `useEffect`s in the current code exist solely to call `fetchGenres()`; confirmed via `grep_search` that `fetchGenres`/`genres` state have no other consumers in `ScheduleScreen.tsx`. Removal is a clean deletion, not a refactor of shared logic. |
| `event.genres` empty-array edge case (present but empty) incorrectly falls back to `event.genre` | Low | Medium | DR-5 explicitly requires "present array → use it exclusively, even if empty" to match the existing filter's `ev.genres && Array.isArray(ev.genres)` check; test suite includes this exact case. |
| Jest cannot import the new test file due to a hidden transitive RN/Expo import | Low | Medium | Test imports only from `scheduleUtils.ts`, which has zero RN/Expo imports (verified: only imports `ScheduleEvent` type). Mirrors `HorizontalScheduleView.test.ts`'s already-passing pattern. |
| Other consumers of `genreOptions`/`genres` state outside the `useMemo` reference the removed `genres` state | Low | Low | Confirmed via `grep_search` — the only other match beyond lines already inspected is within the same effect chain; no external consumer. |

---

## Changelog

- 2026-08-09: Initial plan generated from approved spec.md (Checkpoint 1 signed off, DR-1..DR-5).
