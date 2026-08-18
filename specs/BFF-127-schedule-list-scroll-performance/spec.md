---
complexity_score: 5
complexity_level: MODERATE
complexity_assessed_at: 2026-08-09T00:00:00Z
---

# BFF-127: Schedule List Mount and Scroll Performance

**Status**: Draft
**Source of truth**: [GitHub Issue #186](https://github.com/rlerikse/bigfamfestival/issues/186)
**Issue type**: Bug (performance / tech debt) | **Priority**: P2 | **Area**: UI | **State**: Open
**Created**: 2026-08-09
**Feature branch**: `bugfix/BFF-127-schedule-list-perf`

> **Traceability note:** The project's Jira space is closed. This specification and GitHub Issue #186 are the authoritative records for BFF-127; no Jira link applies.

---

## Overview

The Schedule screen's list view must open and scroll smoothly on supported mid-range Android devices. It currently renders roughly a full day's worth of event cards before the attendee can use the screen, and every ten-second schedule-clock update causes all mounted cards to update even when most cards' visible live state has not changed. The result is delayed initial interactivity and noticeable scroll lag.

This fix limits first-paint and retained-row work to the attendee's visible schedule viewport, and limits clock-driven visual updates to cards whose live, upcoming, or completed presentation actually changes. It preserves the current cached schedule loading path, event order, filters, pull-to-refresh behavior, card content, and separate horizontal schedule view.

## Clarifications

### Session 2026-08-09 (autonomous, pipeline dispatch — attempt 1/5)

Run under `/blue.clarify` pipeline mode. Per Decision-Risk classification, only Technical/implementation-only ambiguities were auto-resolved; no Behavior-defining ambiguity was found to require human escalation (see rationale below).

- Q: Exact `FlatList` tuning values (`initialNumToRender`/`maxToRenderPerBatch`/`windowSize`/`removeClippedSubviews`) to satisfy FR-001–FR-003? → A: `initialNumToRender=10`, `maxToRenderPerBatch=10`, `windowSize=7`, `removeClippedSubviews={Platform.OS === 'android'}` (iOS unchanged at `false`). See DR-1.
- Q: Which internal strategy decouples the 10s schedule-clock tick from per-card re-renders (FR-004/FR-006)? → A: Derive a compact per-event display state via a pure helper and memoize it per card so unaffected cards' `React.memo` comparison bails out, instead of per-card timers or a context-selector subscription model. See DR-2.
- Q: Should time-state derivation be extracted into a pure, testable helper (relevant to FR-010)? → A: Yes — `getEventDisplayState(event, nowMs)` in `mobile/src/utils/`, reused by both the memoization key and the card's own state check. See DR-3.

**Behavior-defining risks considered and NOT escalated** (resolved by existing spec text + codebase evidence — flag for human override if this reading is wrong):
- *Live/countdown update cadence*: FR-006 already requires a state-crossing card to update "by the next available schedule-clock update" — i.e. the existing 10s cadence is preserved; only cards whose state is unchanged skip re-render (AC US3.1–US3.3). The pulsing LIVE glow in `EventCard.tsx` is already a native-driver (`useNativeDriver: true`), UI-thread animation independent of JS re-renders, so it is unaffected by this fix either way. No countdown/time-remaining text exists in `EventCard.tsx` today. Non-Goals also exclude changing `FakeClockContext.tsx`'s 10s tick interval.
- *`removeClippedSubviews` blank-row trade-off on Android*: Already resolved as a hard constraint, not a negotiable trade-off — AC US2.2 requires "without blank persistent rows" during rapid scroll regardless of technique used, and FR-003's "unless doing so causes a documented correctness regression" clause means the release optimization must be abandoned/mitigated if manual Android profiling (Validation Plan step 4) shows blank rows.
- *Initial-mount visual change*: Lowering `initialNumToRender` does not introduce a new spinner/skeleton state — the existing `isLoading` spinner (schedule data fetch) is unrelated and preserved by Non-Goals; `getItemLayout` already provides fixed 112px row positions, so the reduced initial batch renders directly with no additional reflow. FR-001 AC1's "one visible screen ... initially mounted" already describes the intended first-paint outcome.

## Decisions & Rationale

### DR-1: FlatList tuning values
- **Decided**: 2026-08-09 during /blue.clarify (auto-resolved, Technical)
- **Context**: FR-001–FR-003 required a bounded render budget but did not specify exact prop values for the `mobile/src/screens/ScheduleScreen.tsx` `FlatList`.
- **Choice**: `initialNumToRender=10` (covers a ~7-card mobile viewport at the existing fixed 112px row height, plus a small buffer), `maxToRenderPerBatch=10` (down from 20, smoother incremental batches), `windowSize=7` (down from 15), `removeClippedSubviews={Platform.OS === 'android'}` (scoped per FR-003's "On Android" language; iOS remains `false`, unchanged).
- **Alternatives rejected**:
  - Leaving `windowSize=15`/`maxToRenderPerBatch=20` (rejected — retains the oversized active render set that causes the reported scroll lag).
  - Enabling `removeClippedSubviews` on both platforms (rejected — out of scope; FR-003 and Non-Goals scope the release-work change to Android only).
- **Impact**: FR-001, FR-002, FR-003; US1 AC1–AC2; US2 AC1.

### DR-2: Clock-to-card decoupling strategy
- **Decided**: 2026-08-09 during /blue.clarify (auto-resolved, Technical)
- **Context**: FR-004/FR-006 require that a clock tick not force all mounted cards to update, but the spec did not specify the internal mechanism.
- **Choice**: Derive a small, per-event display state (`'upcoming' | 'live' | 'completed'`) via a pure helper (DR-3) and pass that derived value — not the raw epoch — as the prop that gates each card's re-render, relying on `React.memo`'s default shallow comparison to bail out when the derived value is unchanged.
- **Alternatives rejected**:
  - Per-card timers scheduled at each event's own next boundary (rejected — adds timer-drift risk, battery cost, and testing surface disproportionate to a 10s-tick list).
  - Per-card context-selector subscriptions to `FakeClockContext` (rejected — more invasive architectural change than needed; conflicts with keeping `FakeClockContext.tsx`'s existing shape per Non-Goals).
- **Impact**: FR-004, FR-006; US3 AC1–AC4.

### DR-3: Extract pure display-state helper
- **Decided**: 2026-08-09 during /blue.clarify (auto-resolved, Technical)
- **Context**: FR-010 already mandates a side-effect-free utility for Jest coverage since Schedule components cannot be imported under the current Expo/Jest transform.
- **Choice**: Add `getEventDisplayState(event, nowMs)` to `mobile/src/utils/`, reused by both the parent-level memoization key (DR-2) and any card-level state check, as the single source of truth for live/upcoming/completed derivation.
- **Alternatives rejected**: Duplicating boundary-check logic inline in both `ScheduleScreen.tsx` and `EventCard.tsx` (rejected — duplicated logic risks the two falling out of sync and isn't independently testable per FR-010).
- **Impact**: FR-010; Validation Plan "Automated Coverage".

## Evidence of Current Behavior

- The list-view `FlatList` in `mobile/src/screens/ScheduleScreen.tsx` synchronously requests 75 initial rows, substantially exceeding a typical visible viewport.
- The same list keeps offscreen rows mounted and uses broad batch/window settings, enlarging the active set during scroll.
- The global schedule clock publishes a new time value every 10 seconds through `mobile/src/contexts/FakeClockContext.tsx`.
- The list's card-render callback depends on the raw clock value and passes it to every card, so each clock update changes the renderer input for all mounted rows despite memoized cards.
- Each event card can display time-sensitive live, upcoming, and completed presentation, including a live visual effect, increasing the cost of an unnecessarily broad update.
- Schedule data loading is not the identified bottleneck: the existing cache-first load and filtered/sorted event derivations have been observed as sub-millisecond work.

## User Stories

### User Story 1 - Open the Schedule List Without a Long Initial Pause

**As a** festival attendee,
**I want** the schedule list to become interactive after rendering only the rows I can initially see,
**so that** I can browse performances without waiting for a full day's cards to mount.

**Why this priority**: P1 because initial interactivity is the first user-visible failure and affects every attendee who opens the Schedule tab.

**Independent Test**: On a mid-range Android device, profile a cold Schedule list open and confirm the first render mounts only the visible viewport plus a small prefetch buffer rather than approximately 75 cards.

**Acceptance Criteria**:
1. **Given** the attendee opens the Schedule screen in list view, **when** the first viewport is displayed, **then** only approximately one visible screen of event rows plus a small bounded buffer is initially mounted rather than 75 rows.
2. **Given** the attendee begins scrolling a long schedule, **when** additional rows are needed, **then** they are rendered in bounded batches without delaying responsive scrolling.
3. **Given** the Schedule list contains fewer events than the configured visible-row budget, **when** it opens, **then** every available event remains visible and the empty/list-end behavior is unchanged.

### User Story 2 - Scroll a Long Schedule Smoothly

**As a** festival attendee,
**I want** offscreen Schedule rows to stop consuming rendering work,
**so that** scrolling through a long day remains responsive on Android.

**Why this priority**: P1 because retaining non-visible animated cards makes the reported scroll lag worse as the attendee travels further through the list.

**Independent Test**: On Android, scroll repeatedly through a long schedule and profile the retained/mounted row set and frame pacing before and after the change.

**Acceptance Criteria**:
1. **Given** a long Schedule list is open on Android, **when** event rows leave the viewport and configured render window, **then** they no longer remain unnecessarily mounted.
2. **Given** the attendee scrolls rapidly in either direction, **when** rows enter the render window, **then** the correct event content appears without blank persistent rows, duplicate cards, or broken touch targets.
3. **Given** the list uses fixed-row scroll positioning, **when** card dimensions are not guaranteed to match that positioning assumption, **then** scrolling remains accurate and does not jump to an incorrect item position.

### User Story 3 - Receive Live Schedule Updates Without Re-rendering Every Card

**As a** festival attendee viewing the Schedule list,
**I want** time-sensitive card status to update only when a card's displayed state changes,
**so that** live information stays accurate without interrupting scrolling or re-rendering unrelated performances.

**Why this priority**: P1 because the recurring clock update currently causes repeated work across all mounted cards.

**Independent Test**: With a visible mix of live, upcoming, and completed events, observe card renders across one or more ten-second clock ticks and confirm unaffected mounted cards retain their rendered state while cards crossing a display-state boundary update.

**Acceptance Criteria**:
1. **Given** the schedule clock advances, **when** an event card's displayed live/upcoming/completed state is unchanged, **then** that card is not re-rendered solely because of the clock tick.
2. **Given** an event crosses a displayed live-state boundary, **when** the next schedule-clock update is applied, **then** the affected card updates its time-sensitive presentation without requiring a full-list refresh.
3. **Given** the list is actively scrolling when the clock updates, **when** no visible card changes state, **then** the clock update does not cause a list-wide render burst or visible scroll interruption.
4. **Given** an administrator uses the existing fake-clock capability, **when** the displayed schedule time changes, **then** affected cards continue to reflect the selected fake or real time correctly.

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | The Schedule list MUST use a bounded initial render budget sized for approximately one visible mobile viewport plus a small buffer, rather than mounting 75 event cards at first paint. (`initialNumToRender = 10`; see DR-1.) |
| FR-002 | The Schedule list MUST use bounded batch and render-window behavior appropriate for smooth scrolling on a mid-range Android device. (`maxToRenderPerBatch = 10`, `windowSize = 7`, `updateCellsBatchingPeriod` unchanged at 100ms; see DR-1.) |
| FR-003 | On Android, the Schedule list MUST release rows outside its active render window unless doing so causes a documented correctness regression. (`removeClippedSubviews = Platform.OS === 'android'`; iOS unchanged at `false`; see DR-1.) |
| FR-004 | A global schedule-clock update MUST NOT invalidate the list renderer or pass a changing raw time value to every mounted card when their visible live state is unchanged. (Implementation: derive a per-event display state via a pure helper and gate card re-render on that derived value instead of the raw clock value; see DR-2.) |
| FR-005 | Each event card's live, upcoming, and completed presentation MUST remain correct for real time and for the existing fake-clock override. |
| FR-006 | A card whose time-sensitive display state changes MUST update by the next available schedule-clock update without requiring a Schedule data refetch. |
| FR-007 | The fix MUST preserve cache-first Schedule loading, pull-to-refresh, event ordering, selected day and filters, favorites, navigation to event details, and the current card content. |
| FR-008 | The fix MUST apply only to the Schedule screen's list-view event list; `HorizontalScheduleView` and its grid behavior are out of scope. |
| FR-009 | Any fixed-row positioning optimization MUST be retained only when its height assumption matches the rendered event-card dimensions; otherwise list positioning MUST favor correct scroll behavior. |
| FR-010 | Regression coverage MUST isolate and test time-state derivation or other non-native performance logic in a side-effect-free utility; component render verification MUST be performed through manual device profiling because the current Expo SDK 54 Jest transform cannot import icon/image-bearing Schedule components. (Utility: `getEventDisplayState(event, nowMs)` in `mobile/src/utils/`; see DR-3.) |

## Non-Goals

- Changing schedule data fetching, cache policy, event sorting, filtering semantics, or the existing pull-to-refresh reload path.
- Redesigning `EventCard`, its live animation visual treatment, or event-detail navigation.
- Changing the horizontal schedule grid or its scroll synchronization behavior.
- Introducing backend API, Firestore schema, or cross-repository changes.
- Replacing the existing fake-clock feature.

## Edge Cases

| Scenario | Required Handling |
|----------|------------------|
| The list has fewer events than one viewport | Render all available rows without broken blank, loading, or empty-list behavior. |
| An attendee scrolls rapidly through a long schedule | Rows entering the active window render correctly without persistent blanks, wrong event content, or unusable touch targets. |
| Several cards become live or completed on one tick | Update only the affected cards and retain scroll responsiveness. |
| No visible card changes state on a tick | Avoid a list-wide render/update burst. |
| A fake-clock time jump crosses multiple event boundaries | Recompute each affected card's visible state correctly without data refetch. |
| Event-card height varies from a fixed-layout assumption | Do not use stale fixed positioning that produces inaccurate jumps or offsets. |
| Android row clipping differs from iOS behavior | Validate that Android releases offscreen work while preserving correct card appearance and interaction on both platforms. |

## Validation Plan

### Automated Coverage

- Add pure unit coverage for the extracted event live-state/time-boundary logic, including real-time-compatible timestamps, fake-clock changes, event end times, and cross-midnight events.
- Assert unchanged time state does not require a card-level state change, while live/upcoming/completed boundaries do.
- Keep these tests in a side-effect-free `mobile/src/utils/` module so they run without importing Expo icon/image assets.

### Manual Device Profiling

1. On a representative mid-range Android device, profile a cold open of a long list-view Schedule and record the initially mounted row count, time to interactivity, and scroll frame rate.
2. Compare the baseline to the changed list: initial render must be approximately a visible viewport plus buffer, not 75 rows; capture the configured row/batch/window values alongside the profile evidence.
3. Observe render activity across at least one ten-second schedule-clock tick with a mix of visible live, upcoming, and completed cards. Confirm unchanged cards do not re-render and boundary-crossing cards update.
4. Repeat rapid scrolling on Android and a smoke pass on iOS. Confirm event details, favorites, filtering, pull-to-refresh, and fake-clock-driven card status remain correct.

## Success Criteria

- **SC-001**: Profiling on a representative mid-range Android device shows the initial Schedule list mount renders approximately a visible viewport plus bounded buffer, not 75 event cards.
- **SC-002**: Profiling demonstrates a measurable reduction in time to initial Schedule list interactivity compared with the pre-fix baseline captured on the same device and comparable data set.
- **SC-003**: Profiling demonstrates a measurable improvement in Schedule-list scroll frame rate or a measurable reduction in dropped frames on the same Android device and comparable scroll path.
- **SC-004**: Across observed ten-second clock ticks, mounted cards whose displayed live state does not change do not re-render solely due to the tick; cards crossing a state boundary update by the next tick.
- **SC-005**: Manual iOS and Android regression checks confirm list filtering, pull-to-refresh, favorites, event-detail navigation, and fake-clock card status work without regression.

## Related Resources

- [GitHub Issue #186](https://github.com/rlerikse/bigfamfestival/issues/186) - BFF-127 source issue and root-cause investigation.
- `mobile/src/screens/ScheduleScreen.tsx` - list-view `FlatList`, list renderer, and schedule state ownership.
- `mobile/src/components/EventCard.tsx` - memoized card and time-sensitive presentation.
- `mobile/src/contexts/FakeClockContext.tsx` - ten-second schedule-clock source and fake-clock override.
- `mobile/src/utils/` - side-effect-free utility boundary for Jest-testable Schedule logic.
- [BFF-6 Events & Schedule Browser](../BFF-6-events-schedule/spec.md) - schedule-domain baseline.