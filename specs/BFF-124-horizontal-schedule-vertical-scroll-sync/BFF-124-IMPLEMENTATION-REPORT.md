# Implementation Report: BFF-124 Horizontal Schedule Vertical-Scroll Synchronization

**Source of truth**: [GitHub Issue #187](https://github.com/rlerikse/bigfamfestival/issues/187)  
**Jira**: Not applicable - the project Jira space is closed.  
**Branch**: `bugfix/BFF-124-vertical-scroll-sync`  
**Status**: Code complete; iOS pull-to-refresh verified with the issue reporter; Android manual verification pending.  
**Report Generated At**: 2026-08-09T00:00:00Z  
**Report Base Commit**: `489ab6f4f604e1e7a0f28f0ebfb7a46c554b97a7`  
**Spec Location**: [spec.md](./spec.md)  
**Plan Location**: [plan.md](./plan.md)  
**Task Location**: [tasks.md](./tasks.md)

---

## Executive Summary

BFF-124's primary fix adds **pull-to-refresh** to the horizontal schedule view. The list view already reloaded schedule data on pull-down, but the horizontal view's vertical stage-row `ScrollView` had no `RefreshControl`, so the same gesture did nothing there — which is what the issue reporter experienced as "doesn't refresh/sync on vertical scroll." A `RefreshControl` is now attached to that `ScrollView`, wired to the same `isRefreshing` state and `fetchEvents()` reload the list view uses, tinted with `theme.primary`. This was verified on iOS with the reporter ("works great").

The fix also retains the vertical-scroll continuity work: it captures the vertical stage-row offset at the same 16 ms cadence used for horizontal scrolling, lifts both axes to `ScheduleScreen`, and restores a valid Y position through the existing `scrollResetKey` remount lifecycle.

The sticky time ruler and "Now" indicator remain unchanged. Per DR-2 those visuals are horizontal-axis-only; the requirement is a no-regression boundary, not a new Y-based transform. Per **DR-6**, the autonomous /blue.clarify pass originally mis-scoped the intent (position preservation only); iOS verification with the reporter corrected this to pull-to-refresh as the primary requirement. Automated type, lint, unit, and suite verification passed.

### Outcome

| Metric | Result |
|---|---|
| Tasks complete | 6/7 (86%) |
| Pending task | T007 - manual iOS and Android verification |
| Production files modified | 2 |
| Production utility files added | 1 |
| Focused unit-test file added | 1 |
| Acceptance criteria with automated/code evidence | 5/6 |
| Acceptance criteria requiring device evidence | 1/6 pending |
| Full success criteria requiring manual evidence | SC-001 through SC-004 pending |

### Delivery Timeline

| Time | Commit | Milestone |
|---|---|---|
| 2026-08-09 09:20:37 -04:00 | `60b1909` | BFF-124 specification created |
| 2026-08-09 10:54:35 -04:00 | `964aff2` | Plan and task breakdown created |
| 2026-08-09 11:11:46 -04:00 | `489ab6f` | Vertical-scroll synchronization implementation committed |

The branch contains three feature commits. The workflow state records a verify PASS after one self-heal round and an independent pipeline pre-PR re-verification PASS.

---

## Implementation Delivered

### Pull-to-Refresh (Primary Fix)

- Added `RefreshControl` support to [HorizontalScheduleView.tsx](../../mobile/src/components/HorizontalScheduleView.tsx) via new optional props `refreshing`, `onRefresh`, and `refreshTintColor`, attached to the vertical stage-row `ScrollView`. When `onRefresh` is absent the control is omitted, so the component stays backward-compatible.
- Wired the props from [ScheduleScreen.tsx](../../mobile/src/screens/ScheduleScreen.tsx) to the existing `isRefreshing` state and `fetchEvents()` reload — the same path the list view's `RefreshControl` already uses — tinted with `theme.primary`.
- Result: pulling down at the top of the horizontal grid now shows the copper spinner and reloads schedule data, matching the list view. iOS-verified with the reporter.

### Vertical Offset Capture and Parent Contract

- Added a vertical `onScroll` handler with `scrollEventThrottle={16}` to the stage-row `ScrollView` in [HorizontalScheduleView.tsx](../../mobile/src/components/HorizontalScheduleView.tsx).
- The handler stores `contentOffset.y` in `currentOffsetRef` and emits the shared child-to-parent position contract: `{ x, y }`.
- Extended the component API with `initialScrollY`, alongside the existing X restoration input.
- Added `horizontalScrollYRef` to [ScheduleScreen.tsx](../../mobile/src/screens/ScheduleScreen.tsx), so the parent retains both axes while the horizontal view is unmounted.

### Restoration and Clamping

- Reused the existing `scrollResetKey` remount discipline rather than introducing a second native scroll lifecycle.
- Restores a compatible Y offset after remount and clamps it when filtering or day changes reduce the available stage-row content.
- Moved the pure `clampVerticalOffset` helper to [scheduleUtils.ts](../../mobile/src/utils/scheduleUtils.ts), because importing `HorizontalScheduleView` under Jest triggers the repository's Expo SDK 54 transform issue even without component rendering.
- Added six plain-Jest unit cases in [HorizontalScheduleView.test.ts](../../mobile/src/__tests__/HorizontalScheduleView.test.ts): zero stages, in-range offsets, oversized offsets, no scroll range, negative offsets, and null/undefined/non-finite offsets.

### Explicit Non-Changes

- No new vertical positioning behavior was added to the ruler or "Now" indicator.
- No filtering, selected-day, event-ordering, backend, persistence, or API behavior changed.
- Existing horizontal X synchronization and restoration remain the regression boundary.

---

## Verification Evidence

| Check | Result | Evidence |
|---|---|---|
| TypeScript | PASS | `npx tsc --noEmit`: 0 errors |
| Lint | PASS with baseline warnings | `npm run lint`: 0 errors, 241 warnings (baseline) |
| Focused clamp tests | PASS | 6/6 `clampVerticalOffset` unit tests pass |
| Full Jest suite | PASS | 58 passed, 0 failed, 1 pre-existing skipped suite |
| Feature verification | PASS | Verify subagent passed after 1 self-heal round |
| Pipeline pre-PR re-verification | PASS | Independent pipeline re-verify passed |
| Native device verification | **iOS PASS (pull-to-refresh); ANDROID PENDING** | Pull-to-refresh confirmed working on iOS with the reporter; Android half of T007 still open |

### Test Strategy Constraint

The current Expo SDK 54/Jest configuration cannot safely import and render this component class because of the native/expo transform chain. The focused test therefore exercises the pure clamp helper directly, without `@testing-library/react-native` rendering. This is documented in the plan and test file; native behavior remains covered by the required manual iOS and Android regression step.

### Pre-PR Review Note

`git diff --check 489ab6f^ 489ab6f` reports non-blocking trailing whitespace in newly changed `ScheduleScreen.tsx` lines and a blank line at EOF in `.specify/memory/known-issues.md`. This does not affect the stated TypeScript, lint, or Jest outcomes, but should be cleaned before final PR merge if the repository adopts `diff --check` as a gate.

---

## Acceptance Criteria Traceability

| AC | Status | Evidence | Commit |
|---|---|---|---|
| US1 AC1 - capture vertical offset at responsive cadence | MET | Vertical `onScroll` records `contentOffset.y`; vertical `scrollEventThrottle={16}`; shared `{ x, y }` callback | `489ab6f` |
| US1 AC2 - ruler/"Now" remain free of stale or desynchronized state | CODE COMPLETE; **PENDING MANUAL VERIFICATION** | DR-2 preserves the existing horizontal-only rendering path; T007 must confirm actual native behavior | `489ab6f` |
| US1 AC3 - clock updates do not reset/desynchronize vertical viewport | CODE COMPLETE; **PENDING MANUAL VERIFICATION** | Y is retained in refs and restoration reuses the native remount lifecycle; T007 must confirm on device | `489ab6f` |
| US2 AC1 - compatible remount restores saved Y | MET IN CODE; **PENDING MANUAL VERIFICATION** | `initialScrollY`, parent Y ref, pending Y restore, and `scrollResetKey` lifecycle | `489ab6f` |
| US2 AC2 - invalid saved Y is clamped | MET | `clampVerticalOffset` plus 6 passing direct unit tests | `489ab6f` |
| US2 AC3 - iOS remount avoids stale native state | CODE COMPLETE; **ANDROID PENDING** | Existing remount-key discipline retained; iOS observed during smoke test, Android remains T007 | `489ab6f` |
| US3 AC1 - pull down reloads via shared reload path | MET (iOS verified) | `RefreshControl` on vertical `ScrollView` wired to `isRefreshing` + `fetchEvents()`; reporter confirmed on iOS | pull-to-refresh commit |
| US3 AC2 - spinner dismisses, refreshed events render without resetting day/filters | MET (iOS verified) | Reuses list-view reload path which preserves day/filter state | pull-to-refresh commit |
| US3 AC3 - both views share one reload + `refreshing` state | MET | List and horizontal views both bind the same `isRefreshing` + `fetchEvents()` | pull-to-refresh commit |

### Acceptance-Criteria Sign-off Boundary

The automated and code-level portions are complete. The native behavior portions of US1 AC2, US1 AC3, US2 AC1, and US2 AC3 are not signed off until T007 is performed. No report claim should be read as iOS or Android device validation.

---

## Success Criteria Status

| Success Criterion | Status | Reason |
|---|---|---|
| SC-001 - no stale/desynchronized visual state on iOS and Android | **PENDING MANUAL VERIFICATION** | Requires T007 on both platforms |
| SC-002 - valid Y restored after supported compatible remount scenarios | **PENDING MANUAL VERIFICATION** | Code path is complete; native remount behavior must be exercised |
| SC-003 - invalid saved Y renders within available stage rows on both platforms | **PENDING MANUAL VERIFICATION** | Pure clamp helper is unit-tested; platform rendering remains unverified |
| SC-004 - existing horizontal ruler synchronization and X restoration remain green | **ANDROID PENDING** | Automated suite passes; iOS observed clean during smoke test, Android visual half open |
| SC-005 - pull-to-refresh reloads schedule data on both platforms without disrupting day/filters | **iOS VERIFIED; ANDROID PENDING** | Reporter confirmed pull-to-refresh works on iOS; Android half of T007 open |

---

## Risks, Blockers, and Follow-up

| Item | Impact | Resolution or Follow-up |
|---|---|---|
| Expo SDK 54 transform incompatibility prevents component import/render under Jest | Focused component-render integration coverage is unavailable | Extracted `clampVerticalOffset` into side-effect-free `scheduleUtils.ts` and covered it with direct Jest tests; do not treat this as a replacement for T007 |
| iOS and Android native visual verification is incomplete | Final acceptance criteria and SC-001 through SC-004 cannot be signed off | Complete T007: vertical scroll, list/horizontal toggle, filter/day changes including momentum, Y restoration/clamping, and ruler/"Now" plus horizontal-X regression check on both platforms |
| Android was not tested in this session | Cross-platform outcome is unproven | Run the Android half of T007 before marking this feature complete |

## Scope and Quality Summary

The feature remained localized to the intended presentation/state boundary: two production components, one shared pure utility, one focused test, and workflow documentation. No API contract, data model, persistence, PII, or backend changes were introduced.

No AI-cost, time-saved, or ROI figure is asserted in this report because the feature artifacts do not contain measured token, duration, or pricing telemetry. Reporting an estimate as an actual delivery metric would be misleading.

---

## Reviewer Checklist

- Review the combined `{ x, y }` callback contract and its sole parent consumer.
- Confirm the vertical handler is throttled at 16 ms and does not change ruler/"Now" rendering.
- Confirm clamping uses `SCHEDULE_ROW_HEIGHT`, current stage count, and measured viewport height.
- Confirm `scrollResetKey` remains the only native remount mechanism.
- Confirm the horizontal view's `RefreshControl` reuses the list view's `isRefreshing` + `fetchEvents()` reload path rather than a duplicate mechanism.
- Resolve the non-blocking whitespace note if `git diff --check` is part of branch policy.
- Do not mark BFF-124 fully complete until T007 has passed on both iOS and Android.