---
complexity_score: 4
complexity_level: SIMPLE
complexity_assessed_at: 2026-08-09T00:00:00Z
---

# BFF-124: Horizontal Schedule Vertical-Scroll Synchronization

**Status**: Draft
**Source of truth**: [GitHub Issue #187](https://github.com/rlerikse/bigfamfestival/issues/187)
**Issue type**: Bug | **Priority**: P2 | **Area**: UI | **Milestone**: Schedule
**Created**: 2026-08-09
**Feature branch**: `bugfix/BFF-124-vertical-scroll-sync`

> **Traceability note:** The project's Jira space is closed. This specification and GitHub Issue #187 are the authoritative records for BFF-124; no Jira link applies.

---

## Overview

The horizontal schedule view must keep its vertical position and derived visual state coherent while an attendee scrolls through stage rows. Today, vertical movement is not captured or lifted from `HorizontalScheduleView`, while horizontal movement is. This can leave the sticky ruler, "Now" indicator, and viewport-dependent state stale or desynchronized after vertical navigation, filter changes, day changes, or a remount.

This bug fix restores the same continuity guarantees for the vertical axis that already exist for the horizontal axis, without changing schedule content, event filtering rules, or the selected day.

The **primary user-facing behavior** is pull-to-refresh: the list view already reloads schedule data when the attendee pulls down at the top, but the horizontal view's vertical `ScrollView` had no `RefreshControl`, so the same gesture did nothing there. This fix adds pull-to-refresh to the horizontal view, wired to the same reload path the list view uses, so both views share one refresh gesture. The vertical position-preservation work is an additional continuity improvement retained alongside it.

## Evidence of Current Behavior

- `mobile/src/components/HorizontalScheduleView.tsx:L56` defines `onScrollPositionChange` with an X-only contract.
- `mobile/src/components/HorizontalScheduleView.tsx:L162-L164` records and reports only the body grid's horizontal offset.
- `mobile/src/components/HorizontalScheduleView.tsx:L178` declares an offset ref with `x` and `y`, but no vertical-scroll path writes the Y value.
- `mobile/src/components/HorizontalScheduleView.tsx:L410-L415` renders the vertical stage-row `ScrollView` without `onScroll` or `scrollEventThrottle`.
- `mobile/src/components/HorizontalScheduleView.tsx:L397` derives the sticky time-ruler translation from horizontal `scrollX` only.
- `mobile/src/components/HorizontalScheduleView.tsx:L226-L240` recalculates the "Now" time position from the clock and selected day, not vertical viewport movement.
- `mobile/src/components/HorizontalScheduleView.tsx:L451` renders the "Now" line at the full grid height, without a tracked vertical viewport relationship.
- `mobile/src/screens/ScheduleScreen.tsx:L279-L281` stores only `horizontalScrollXRef`; `L1125-L1134` passes only that X state into `HorizontalScheduleView`.
- `mobile/src/components/HorizontalScheduleView.tsx:L289,L319,L433,L462` — the existing remount-key discipline referenced in User Story 2 AC3: a `scrollResetKey` counter, bumped in a `useLayoutEffect` on a genuine content/day change, is used as the React `key` (`vertical-${scrollResetKey}` / `body-${scrollResetKey}`) on both body `ScrollView`s to force a clean native remount instead of mutating a live scroll position. The vertical-offset fix reuses this same counter/key rather than introducing a new remount mechanism.
- `mobile/src/components/HorizontalScheduleView.tsx:L467` — the existing horizontal body `ScrollView` already sets `scrollEventThrottle={16}`; this is the established convention for scroll-cadence on this component.
- `mobile/src/components/HorizontalScheduleView.tsx:L313` — on a genuine filter/day content change, `currentOffsetRef.current` is currently hard-reset to `{ x: preservedX, y: 0 }`, unconditionally zeroing the (currently untracked) vertical offset; this is the specific line the fix must change to carry forward a clamped Y instead of hardcoding zero.

## Clarifications

### Session 2026-08-09

- Q: What scroll event cadence should the new vertical `onScroll` handler use? → A: `scrollEventThrottle={16}`, matching the existing horizontal body `ScrollView` convention at `HorizontalScheduleView.tsx:L467` (default - can be revisited).
- Q: Does FR-006 require the sticky time ruler or "Now" indicator to gain a new vertical-position-dependent transform? → A: No. Both are horizontal-axis-only visuals today (`translateX` bound to `scrollX`; the "Now" line spans the full grid height regardless of vertical scroll) and this bug fix does not change that. FR-006 means: adding vertical scroll tracking MUST NOT introduce stale renders, dropped listeners, or re-render loops that break the *existing* horizontal ruler/"Now" sync — it is a no-regression constraint, not a request for new Y-based ruler/indicator positioning.
- Q: Is the "existing remount-key discipline" in User Story 2 AC3 a specific, identifiable mechanism? → A: Yes — the `scrollResetKey` state counter (see Evidence) already remounts both body `ScrollView`s via `key` on genuine content/day changes; vertical-offset restoration reuses this same counter rather than adding a second remount path.

## Decisions & Rationale

### DR-1: Vertical scroll event cadence
- **Decided**: 2026-08-09 during /blue.clarify
- **Context**: FR-001 said the vertical scroll listener needed a throttle "appropriate for responsive UI synchronization" without a concrete value.
- **Choice**: Use `scrollEventThrottle={16}`, matching the value already used on the horizontal body `ScrollView` (`HorizontalScheduleView.tsx:L467`), so both axes share one cadence convention.
- **Alternatives rejected**:
  - Default/unset throttle (~100ms via RN default) — too coarse for a synchronization-sensitive UI, inconsistent with the horizontal axis.
  - A tighter custom value (e.g. 8) — no evidence it's needed; adds inconsistency with the established horizontal convention for no measurable benefit.
- **Impact**: FR-001, User Story 1 AC1.

### DR-2: Scope of ruler/"Now" indicator coherence requirement
- **Decided**: 2026-08-09 during /blue.clarify
- **Context**: FR-006's wording ("must remain visually coherent with the active vertical viewport") could be read as requiring new Y-based repositioning of the sticky ruler or "Now" line, but both are currently horizontal-only visuals with no viewport-relative vertical behavior.
- **Choice**: Scope FR-006 as a no-regression constraint — vertical scroll tracking must not desynchronize or stale-render the existing horizontal ruler/"Now" sync. No new vertical-based transform is required for either element.
- **Alternatives rejected**:
  - Require the "Now" indicator or ruler to become viewport-relative on the Y axis — out of scope per Non-Goals ("Redesigning... appearance"; "Replacing the existing native horizontal ruler synchronization architecture") and not supported by the root-cause evidence, which shows no Y-dependent rendering today.
- **Impact**: FR-006, User Story 1 AC2 and AC3.

### DR-6: Pull-to-refresh is the primary user-facing requirement (corrects DR-2 scope)
- **Decided**: 2026-08-09 after iOS smoke test with the issue reporter
- **Context**: The autonomous /blue.clarify pass (DR-2) resolved the ambiguous "doesn't refresh/sync on vertical scroll" wording as a *no visible on-scroll behavior* constraint (position preservation only). Manual iOS verification with the reporter showed the actual intent: pulling down / scrolling up at the top of the horizontal view should show a spinner and reload schedule data — i.e., pull-to-refresh, which the list view already had but the horizontal view lacked.
- **Choice**: Add pull-to-refresh (`RefreshControl`) to the horizontal view's vertical `ScrollView`, wired to the same `isRefreshing` state and `fetchEvents()` reload the list view uses. Retain the vertical position-preservation work (User Story 2) as an additional continuity improvement.
- **Alternatives rejected**:
  - Keep DR-2's position-preservation-only scope — rejected: it does not satisfy the reporter's confirmed intent; the gesture stays invisible on the horizontal view.
  - Implement a bespoke refresh spinner instead of reusing the list view's reload path — rejected: duplicates the existing reload logic and diverges the two views' refresh behavior.
- **Impact**: Adds User Story 3, FR-009, FR-010, FR-011, SC-005. Supersedes DR-2's implication that no visible on-scroll behavior is required; DR-2's no-regression guarantee for the ruler/"Now" indicator still holds.

## User Stories

### User Story 1 - Scroll Stage Rows Without a Stale Schedule View

**As a** festival attendee viewing the horizontal schedule,
**I want** vertical scrolling through stage rows to keep the visible schedule state synchronized,
**so that** the time ruler and "Now" indicator remain visually correct for the viewport I am using.

**Why this priority**: P1 because it repairs a primary navigation gesture in the schedule's alternate view and prevents users from reading a stale visual state.

**Independent Test**: Open a schedule day with enough stages to scroll, drag vertically through rows, and confirm the rendered ruler/indicator state remains aligned and does not retain a prior viewport state.

**Acceptance Criteria**:
1. **Given** the horizontal schedule is open with vertically scrollable stage rows, **when** the attendee scrolls vertically, **then** the view captures the current vertical offset at a responsive scroll cadence.
2. **Given** the attendee changes the vertical viewport, **when** schedule-derived visual state is rendered, **then** the sticky time ruler and "Now" indicator remain correct and do not show stale or desynchronized state.
3. **Given** a vertical scroll is in progress, **when** the schedule updates on its regular clock tick, **then** the update does not reset or desynchronize the vertical viewport.

### User Story 2 - Preserve Vertical Position Across a Horizontal-View Remount

**As a** festival attendee,
**I want** my vertical stage-row position restored when the horizontal schedule remounts,
**so that** changing a supported filter, day, or view does not unexpectedly return me to an unrelated stage.

**Why this priority**: P2 because remount continuity is already an established contract for horizontal position and must apply consistently to the vertical axis.

**Independent Test**: Scroll to a nonzero vertical position, trigger each supported remount path, return to the horizontal view, and confirm the last valid Y position is restored or deliberately reset only when the new content cannot support it.

**Acceptance Criteria**:
1. **Given** the attendee has scrolled to a nonzero vertical offset, **when** the horizontal schedule remounts while its stage-row content remains compatible, **then** the same Y offset is restored.
2. **Given** the stage-row content shrinks after a filter or day change, **when** the previously saved Y offset is no longer valid, **then** the restored position is clamped to a valid visible range without stale native scroll state.
3. **Given** an iOS remount or filter change, **when** native scroll state is recreated, **then** restoration follows the existing remount-key discipline and does not rely on a stale `contentOffset` from a torn-down view.

### User Story 3 - Pull to Refresh the Horizontal Schedule

**As a** festival attendee viewing the horizontal schedule,
**I want** to pull down at the top of the stage-row grid to reload schedule data,
**so that** I can get the latest set times and lineup changes with the same gesture the list view already supports.

**Why this priority**: P1 because it is the primary behavior the issue reporter expected; the list view already has it and the horizontal view's missing `RefreshControl` is the user-visible defect.

**Independent Test**: Open the horizontal schedule, scroll to the top, pull down, and confirm a refresh spinner appears and the schedule data reloads — matching the list view's pull-to-refresh.

**Acceptance Criteria**:
1. **Given** the horizontal schedule is open and scrolled to the top, **when** the attendee pulls down, **then** a refresh spinner appears and the schedule data is reloaded via the same reload path the list view uses.
2. **Given** a refresh is in progress, **when** the reload completes, **then** the spinner dismisses and the refreshed events render without resetting the attendee's day selection or filters.
3. **Given** the attendee toggles between list and horizontal views, **when** they pull to refresh in either view, **then** both views trigger the same reload and reflect the same `refreshing` state.

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | The horizontal schedule MUST observe vertical stage-row scrolling with `scrollEventThrottle={16}`, matching the existing horizontal body `ScrollView` convention. |
| FR-002 | The schedule MUST retain the latest vertical offset alongside the existing horizontal offset. |
| FR-003 | The parent schedule screen MUST receive and retain the latest vertical position for the horizontal view, using a contract that represents both axes or an equivalent sibling contract. |
| FR-004 | The horizontal schedule MUST restore a saved valid vertical offset after a compatible remount, alongside the existing X restoration behavior. |
| FR-005 | The horizontal schedule MUST clamp a saved vertical offset when changed filters or days reduce the available stage-row height. |
| FR-006 | The sticky time ruler and "Now" indicator (both horizontal-axis-only visuals; neither has a vertical-position-dependent transform today) MUST NOT regress — vertical scroll tracking MUST NOT desynchronize, stale-render, or otherwise break their existing horizontal synchronization. This is a no-regression constraint, not a requirement to add new Y-based ruler/indicator positioning. |
| FR-007 | The fix MUST preserve existing horizontal scroll synchronization, day-navigation behavior, and filter-change recovery. |
| FR-008 | The behavior MUST be covered by focused component/unit tests and manually verified on both iOS and Android. |
| FR-009 | The horizontal schedule's vertical stage-row `ScrollView` MUST attach a `RefreshControl` so pulling down at the top triggers a schedule-data reload. |
| FR-010 | Pull-to-refresh in the horizontal view MUST reuse the existing list-view reload path (the shared `isRefreshing` state and `fetchEvents()` reload), not a duplicate refresh mechanism, so both views stay consistent. |
| FR-011 | The horizontal view's `RefreshControl` MUST be tinted consistently with the app theme (`theme.primary`) and MUST NOT alter day selection, active filters, or the horizontal/vertical scroll-restoration behavior. |

## Non-Goals

- Redesigning the horizontal schedule's event cards, stage labels, or time-ruler appearance.
- Changing schedule filtering, selected-day selection, event ordering, or the six-thirty festival-day cutoff.
- Replacing the existing native horizontal ruler synchronization architecture.
- Introducing a backend API, persistence model, or cross-repository dependency.

## Edge Cases

| Scenario | Required Handling |
|----------|------------------|
| Filter removes enough stages to make the saved Y offset invalid | Restore a clamped valid offset; do not display an empty or stale viewport. |
| The attendee switches days while momentum scroll is active | Use the remount-key lifecycle so a prior native scroll instance cannot overwrite the restored state. |
| The attendee toggles between list and horizontal views | Preserve the last valid horizontal-view Y offset while the horizontal view is unmounted. |
| The schedule has too few stages to scroll | Treat the vertical offset as zero and retain correct ruler/indicator rendering. |
| The ten-second schedule clock refreshes during vertical interaction | Recompute time-sensitive visuals without resetting or desynchronizing the vertical position. |
| Platform-specific scroll event delivery differs | Produce the same observable restoration and visual alignment outcome on iOS and Android. |

## Validation Plan

### Automated Coverage

- Add focused tests for vertical offset capture, parent position propagation, compatible restoration, and invalid-offset clamping.
- Preserve or extend regression coverage for the existing horizontal X restoration and filter/day remount behavior.

### Manual Platform Verification

1. On iOS, scroll vertically through a multi-stage horizontal schedule, change a filter/day or leave and re-enter the horizontal view, and confirm the intended vertical position and visual synchronization are retained.
2. Repeat the same flow on Android, including a filter change while scroll momentum is active.
3. Confirm the ruler and "Now" indicator remain aligned after each flow and that horizontal scrolling still synchronizes the time ruler.

## Success Criteria

- **SC-001**: In the iOS and Android manual scenarios, vertical scrolling produces no stale or desynchronized schedule visual state.
- **SC-002**: A valid nonzero vertical position is restored after every supported compatible remount scenario exercised in the regression suite.
- **SC-003**: When content changes invalidate a saved vertical offset, the rendered position remains within the available stage rows on both platforms.
- **SC-004**: Existing horizontal ruler synchronization and horizontal position restoration regressions remain green.
- **SC-005**: On iOS and Android, pulling down at the top of the horizontal schedule shows a refresh spinner and reloads schedule data via the same reload path as the list view, without disrupting day selection or filters.

## Related Resources

- [GitHub Issue #187](https://github.com/rlerikse/bigfamfestival/issues/187) - BFF-124 source issue and investigated root cause.
- [BFF-6 Events & Schedule Browser](../BFF-6-events-schedule/spec.md) - schedule-domain baseline.
- `mobile/src/components/HorizontalScheduleView.tsx` - affected component.
- `mobile/src/screens/ScheduleScreen.tsx` - parent state ownership and embedding surface.