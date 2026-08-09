---
complexity_score: 3
complexity_level: SIMPLE
complexity_assessed_at: 2026-08-09T00:00:00Z
---

# BFF-128: Schedule Genre Filter Uses the Current Lineup

**Status**: Draft
**Source of truth**: [GitHub Issue #185](https://github.com/rlerikse/bigfamfestival/issues/185)
**Issue type**: Bug | **Priority**: P2 | **Area**: Events, UI | **State**: Open
**Created**: 2026-08-09
**Feature branch**: `bugfix/BFF-128-genre-filter-lineup`

> **Traceability note:** The project's Jira space is closed. This specification and GitHub Issue #185 are the authoritative records for BFF-128; no Jira link applies.

---

## Overview

The Schedule page's genre filter must offer only genres represented by artists performing in the current festival lineup. Today, the filter loads a separate, global Firestore `genres` collection and can fall back to a hardcoded list. Neither source is tied to the events currently loaded for this year's schedule, so attendees can select genres that return no results.

This bug fix makes the loaded schedule events the source of truth for filter options. The option list is compiled from every loaded current-year (2026) event's artist genres into one distinct, day-independent list that stays constant across pull-to-refresh and day changes. The genre filter is already a multi-select checklist (`selectedGenres`), so this fix changes only the source of the options — it does not alter the filter UI, the existing `event.genres` / single `event.genre` matching behavior, filter-selection persistence, or the day/stage/My-Schedule filters.

## Evidence of Current Behavior

- `mobile/src/screens/ScheduleScreen.tsx` stores a separate `genres` state value and uses it to render `genreOptions`.
- `fetchGenres()` reads every document in Firestore's top-level `genres` collection, independent of the currently loaded schedule events.
- When that read fails, `fetchGenres()` substitutes a static `sampleGenres` list, which also has no relationship to the lineup.
- The actual genre filter already matches loaded events through `event.genres` and falls back to `event.genre`.
- The same screen already derives `stageOptions` dynamically from `events`, demonstrating the intended local source-of-truth pattern.

## Clarifications

### Session 2026-08-09

- Q: What is the source and scope of the genre options, and how should they behave on refresh or day change? → A: Compile the option list from every loaded current-year (2026) event's artist genres into one distinct list. This list is day-independent — it always shows the full 2026 lineup's genres and does NOT change when the schedule is refreshed or the selected day changes. (human decision)
- Q: Should the genre filter become a multi-select checklist? → A: No change needed — the genre filter is already multi-select (`selectedGenres: string[]`, default `['all']`); this fix only corrects the option source, not the filter UI or its multi-select behavior. (human decision, code evidence)
- Q: Should filter-selection persistence across day change or refresh be changed? → A: No. The existing filtering behavior works; only the genre option source is wrong. Leave the current day-change/refresh filter-state behavior exactly as-is — this fix does not modify the filter reducer or selection persistence. (human decision)
- Q: Does genre derivation need to enrich from artist records directly, or is the loaded `events` data already sufficient? → A: `events` are already artist-enriched upstream — `eventsService.fetchEvents()` calls `genreService.populateEventGenres()`, which populates `event.genres` from each artist's genre data before `ScheduleScreen` ever sees the events. No additional artist-cache lookup is needed in `ScheduleScreen`; genre derivation reads the already-enriched `events` state directly. (auto-resolved technical decision — code evidence)
- Q: When both `event.genres` and `event.genre` could apply, which precedence should genre-option derivation use? → A: Mirror the exact precedence already used by the genre filter's matching logic in `ScheduleScreen.tsx`: if `event.genres` is a present array, use it exclusively; only fall back to `event.genre` when `event.genres` is absent. This guarantees FR-005's "every offered genre matches at least one lineup event" invariant, since derivation and matching share identical logic. (auto-resolved technical decision — code evidence)

## Decisions & Rationale

### DR-1: Loaded lineup data is authoritative for genre options

- **Decided**: 2026-08-09 from GitHub Issue #185.
- **Context**: The catalog-backed genre list can contain entries with no corresponding event in the current year's schedule.
- **Choice**: Derive the filter's selectable genres from the loaded current-year schedule data, using the same dataset that the filter evaluates.
- **Alternatives rejected**:
  - Continue using the top-level Firestore `genres` collection as the filter source - it is decoupled from the current lineup.
  - Retain the hardcoded fallback as a selectable source - it can advertise genres with zero matching events.
- **Impact**: User Story 1, FR-001 through FR-004, SC-001 through SC-003.

### DR-2: Preserve existing event genre compatibility

- **Decided**: 2026-08-09 from GitHub Issue #185 and the verified current implementation.
- **Context**: Loaded event data may expose multiple values in `event.genres` or a single value in `event.genre`.
- **Choice**: Genre-option derivation and matching must support the existing multi-value field and single-value fallback consistently.
- **Alternatives rejected**:
  - Require only `event.genres` - would exclude valid events that currently use the supported single-value field.
- **Impact**: User Story 2, FR-002, FR-005, SC-002.

### DR-3: Genre options are the stable, day-independent 2026 lineup; filter behavior is unchanged

- **Decided**: 2026-08-09 during /blue.clarify (human decision; supersedes the earlier auto-reset direction).
- **Context**: An earlier clarify pass proposed auto-resetting a selected genre to `All Genres` when a refresh removed it. On review with the reporter, the intended model is different: the genre option list is compiled from the entire current-year lineup and stays constant, so a selected genre never "disappears" on refresh or day change.
- **Choice**: Derive `genreOptions` from ALL loaded current-year `events` (every day's artists), producing one distinct, day-independent list that does not change on pull-to-refresh or day change. Do NOT add any auto-reset logic, and do NOT modify the existing filter reducer, selection persistence, or day/stage/My-Schedule behavior — the filtering mechanism already works; only the option source is corrected.
- **Alternatives rejected**:
  - Auto-reset the genre selection to `All Genres` on refresh (the earlier direction) - unnecessary once options are the stable full-lineup list, and it would change working filter behavior the reporter asked to leave alone.
  - Derive options from the currently day-filtered events - would make the list shrink or grow per selected day, contradicting the required day-independent behavior.
- **Impact**: User Story 1, FR-001, FR-004, FR-008, FR-009; removes the prior auto-reset edge-case handling.

### DR-4: Genre derivation reads already artist-enriched `events`, no new artist lookups

- **Decided**: 2026-08-09 during /blue.clarify (auto-resolved technical decision, code evidence).
- **Context**: The draft spec left open whether genre derivation needs its own artist-cache enrichment to ensure full genre coverage.
- **Choice**: `eventsService.fetchEvents()` already calls `genreService.populateEventGenres()`, which populates each event's `genres` array from its artists' genre data before `ScheduleScreen` receives the `events` state. Genre-option derivation for FR-001/FR-002 MUST read this already-enriched `events` state directly; it MUST NOT perform any additional artist-cache or Firestore lookup.
- **Alternatives rejected**:
  - Add a separate artist-genre lookup in `ScheduleScreen` - redundant with the existing `genreService` enrichment pipeline and risks introducing a second, divergent genre source.
- **Impact**: FR-001, FR-002, User Story 1.

### DR-5: Genre-option derivation mirrors the existing filter's field precedence exactly

- **Decided**: 2026-08-09 during /blue.clarify (auto-resolved technical decision, code evidence).
- **Context**: `event.genres` and `event.genre` can both be present on an event; the draft spec required "compatibility" with both but didn't pin the precedence for derivation.
- **Choice**: Genre-option derivation MUST use the identical precedence as the existing genre-matching logic in `ScheduleScreen.tsx`: when `event.genres` is a present array, use it exclusively for that event; fall back to `event.genre` only when `event.genres` is absent. Using any other precedence in derivation could offer a genre that the matching logic then fails to match, violating FR-005.
- **Alternatives rejected**:
  - Union both fields regardless of precedence - could offer genres from `event.genre` that the matching logic ignores once `event.genres` is present (even as an empty array), breaking the FR-005 guarantee.
- **Impact**: FR-002, FR-005, User Story 2, SC-002, SC-003.

## User Stories

### User Story 1 - Browse Only Genres in the Current Lineup

**As a** festival attendee browsing the schedule,
**I want** the genre filter to list only genres represented in this year's lineup,
**so that** every filter option is relevant to the events I can attend.

**Why this priority**: P1 because the current filter exposes unavailable choices and can lead directly to an empty result set.

**Independent Test**: Load a schedule dataset containing known event genres and confirm the menu includes every distinct represented genre, excludes unrelated catalog genres, and displays the values in deterministic alphabetical order.

**Acceptance Criteria**:
1. **Given** current-year schedule events are loaded, **when** the genre filter options are built, **then** they contain the distinct genre values represented by all loaded current-year events (independent of the selected day), plus the existing `All Genres` option, and this list does not change on refresh or day change.
2. **Given** duplicate genre values occur across multiple current-year events, **when** options are displayed, **then** each represented genre appears exactly once.
3. **Given** the independent Firestore `genres` collection contains a value with no matching loaded event, **when** the genre filter is displayed, **then** that value is not offered.

### User Story 2 - Select a Genre That Produces Schedule Results

**As a** festival attendee,
**I want** each offered genre to map to at least one scheduled performance,
**so that** applying the filter never leads to an avoidable empty result solely because the option was unrelated to the lineup.

**Why this priority**: P1 because it is the direct quality guarantee that resolves the reported defect.

**Independent Test**: For every generated option other than `All Genres`, apply that option to the same loaded event dataset and confirm at least one event remains; exercise both an event with `genres` and an event with only `genre`.

**Acceptance Criteria**:
1. **Given** an event exposes an array in `event.genres`, **when** its genre values are collected and selected, **then** every value is eligible for one or more matching schedule events.
2. **Given** an event has only a single `event.genre` value, **when** options are collected and that value is selected, **then** the event remains discoverable through the genre filter.
3. **Given** a genre source read fails or is unavailable, **when** the schedule has loaded events, **then** no hardcoded genre list is substituted and the filter continues to represent only the available lineup.

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | The Schedule screen MUST derive selectable genre options from the current loaded lineup data rather than treating the top-level Firestore `genres` collection as the filter source of truth. |
| FR-002 | Genre derivation MUST collect values from `event.genres` and preserve compatibility with the existing single-value `event.genre` fallback. |
| FR-003 | The derived genre set MUST remove duplicates and present selectable genre labels in ascending alphabetical order. |
| FR-004 | The filter MUST retain its existing `All Genres` option while excluding genres that have no matching current-year loaded event. |
| FR-005 | For every selectable genre other than `All Genres`, at least one event in the full loaded current-year lineup MUST match it (day-independent); this fix MUST NOT change how the day, stage, or My-Schedule filters compose with the genre filter. |
| FR-006 | No hardcoded genre list or failed independent-genre-catalog fetch MAY populate the Schedule genre filter. |
| FR-007 | The fix MUST include focused regression coverage for the derived options, deduplication and ordering, array and single-value event genre shapes, and the offered-option-to-lineup-match guarantee. |
| FR-008 | Genre options MUST be derived from ALL loaded current-year events (every day's artists), producing one day-independent list that does NOT change on pull-to-refresh or when the selected day changes. |
| FR-009 | This fix MUST NOT modify the filter reducer, filter-selection persistence, multi-select behavior, or the day/stage/My-Schedule/horizontal-schedule filters; only the genre-option source changes. |

## Non-Goals

- Changing the event filter's selected-day, stage, favorites, or horizontal-schedule behavior.
- Editing production events, artist records, or the Firestore `genres` collection.
- Redesigning the genre filter UI or altering the meaning of genre labels.
- Introducing a backend API, Firestore migration, or cross-repository dependency.

## Edge Cases

| Scenario | Required Handling |
|----------|------------------|
| Multiple events share a genre | Show one alphabetically ordered option. |
| An event has multiple `genres` values | Make each represented value available and matchable. |
| An event has only `genre` | Keep that event's genre selectable and matchable. |
| Loaded events have no usable genre values | Show only `All Genres`; do not substitute catalog or sample genres. |
| A separate genre catalog is unavailable | Do not change the set of lineup-derived options or introduce a static fallback. |
| A pull-to-refresh or day change occurs | The genre option list stays the full, day-independent 2026 lineup and does not change; the existing filter-selection behavior is left exactly as-is (this fix does not add reset logic). |

## Validation Plan

### Automated Coverage

- Add regression tests for collecting genres from `event.genres` and the `event.genre` fallback.
- Assert option deduplication, alphabetical ordering, and the absence of an unrelated catalog/static fallback.
- Assert every generated selectable genre returns at least one event when run through the Schedule screen's filtering semantics.

### Manual Verification

1. Load a current festival schedule containing several genres and verify the genre filter lists only represented values.
2. Select each offered genre and verify it returns one or more scheduled events.
3. Verify a genre present only in the legacy catalog, but absent from loaded events, does not appear in the filter.
4. Repeat after a schedule refresh and after changing the selected day; confirm the genre options stay the full 2026 lineup (unchanged) and no unrelated filters are altered.

## Success Criteria

- **SC-001**: The genre filter presents exactly the distinct, alphabetically ordered genre values represented across all loaded current-year lineup events (day-independent), in addition to `All Genres`, and this option list stays constant across pull-to-refresh and day changes.
- **SC-002**: Regression coverage proves array-backed and single-value event genres generate matching selectable options.
- **SC-003**: Regression coverage proves every offered genre produces at least one result from the same loaded events.
- **SC-004**: The Schedule genre filter has no hardcoded genre-list fallback and no independent global genre collection dependency as its source of truth.

## Related Resources

- [GitHub Issue #185](https://github.com/rlerikse/bigfamfestival/issues/185) - BFF-128 source issue and verified root-cause evidence.
- `mobile/src/screens/ScheduleScreen.tsx` - affected screen, current genre catalog fetch, filter options, and event filtering behavior.
- `mobile/src/types/event.ts` - event genre field contract.
- [BFF-6 Events & Schedule Browser](../BFF-6-events-schedule/spec.md) - schedule-domain baseline.