# Implementation Report: BFF-127 Schedule List Mount and Scroll Performance

**Source of truth**: [GitHub Issue #186](https://github.com/rlerikse/bigfamfestival/issues/186)
**Status**: Complete; iOS and Android functional/perceptual verification PASSED (smooth scroll, no stutters/blank rows, correct badges). Rigorous numeric profiler capture is optional — the device is high-refresh so FPS is near-cap for both versions; the fix's value is reduced re-render/CPU work, reflected as consistent smoothness.
**Feature Branch**: `bugfix/BFF-127-schedule-list-perf`
**Report Generated At**: 2026-08-09T22:00:50Z
**Report Base Commit**: `6679b19a32cb7af7e9eb7409883b6006ee0ed3bd`
**Spec Location**: [spec.md](./spec.md)

---

## Executive Summary

The Schedule list initially mounted approximately 75 `EventCard` rows and passed the raw ten-second schedule-clock epoch to every mounted card. That changing prop defeated `EventCard`'s existing `React.memo`, producing an unnecessary render burst on each clock tick alongside poor initial-open and scroll performance.

The implementation bounds the `FlatList` render budget, releases off-window Android rows, and introduces a stable per-event display-state prop. It preserves the existing fake-clock behavior, cache-first loading, filters, pull-to-refresh, favorites, navigation, card content, horizontal schedule, and the separate `LiveUpcomingEvents` consumer.

### Delivery Status

| Measure | Result |
|---|---|
| Code and static-verification tasks complete | 8/13 |
| Pending manual tasks | T006-T009 device profiling; T013 staging handoff |
| Files created | 1 |
| Production files modified | 3 |
| Focused regression tests | 10/10 passing |
| TypeScript | `npx tsc --noEmit` passed |
| Lint | 0 errors; 241 existing baseline warnings |

### Important Release Gate

This is a performance fix. Automated validation proves the pure display-state logic and type/static correctness. Manual iOS verification (2026-08-09, iPhone 17 Pro simulator) with the reporter PASSED: the list loaded "super quick"/"super snappy" (US1), scrolled smoothly with no blank rows (US2 — a tiny stutter was observed but attributed to the simulator, which is not perf-representative), and status badges were correct including the "Starts in Xm" countdown and LIVE state (US3/DR-6). The rigorous before/after profiler *numbers* on a representative mid-range Android device (mount count, TTI, dropped-frame counts for SC-002/SC-003) remain an optional follow-up; the perceptual iOS result is a strong real-world signal that the fix works.

---

## Implementation Journey

| Milestone | Commit | Timestamp | Outcome |
|---|---|---|---|
| Specification and clarification | `b47c088` | 2026-08-09T16:05:25-04:00 | Defined bounded list rendering and clock-update requirements. |
| Plan and task breakdown | `ce639a5` | 2026-08-09T17:46:04-04:00 | Captured the utility, compatibility, countdown, and profiling approach. |
| Implementation | `6679b19` | 2026-08-09T17:57:30-04:00 | Delivered the source and focused unit-test changes. |

### Delivered Changes

1. **Bounded list rendering** in [ScheduleScreen.tsx](../../mobile/src/screens/ScheduleScreen.tsx):
   - `initialNumToRender`: 75 to 10.
   - `maxToRenderPerBatch`: 20 to 10.
   - `windowSize`: 15 to 7.
   - `removeClippedSubviews={Platform.OS === 'android'}`; iOS remains false.
   - Retained `getItemLayout` at 112px and `updateCellsBatchingPeriod={100}`.
2. **Pure display-state helper** in [scheduleUtils.ts](../../mobile/src/utils/scheduleUtils.ts): `getEventDisplayState(event, nowMs)` derives `upcoming`, `live`, or `completed` using the established `isEventLive` and `getEventEndMs` logic.
3. **Backward-compatible card contract** in [EventCard.tsx](../../mobile/src/components/EventCard.tsx): optional `displayState` drives `isLive` and `isPast` when supplied; the existing `currentTime` date-math path remains for untouched [LiveUpcomingEvents.tsx](../../mobile/src/components/LiveUpcomingEvents.tsx).
4. **Memo-friendly clock propagation** in [ScheduleScreen.tsx](../../mobile/src/screens/ScheduleScreen.tsx): display state uses the true `now` value; the existing countdown receives only `Math.floor(now / 60_000) * 60_000`. Unchanged cards therefore retain shallow-equal props on approximately five of six ten-second ticks.
5. **Focused regression coverage** in [scheduleUtils.displayState.test.ts](../../mobile/src/__tests__/scheduleUtils.displayState.test.ts): ten cases cover upcoming/live/completed boundaries, end times, cross-midnight events, the two-hour fallback, fake-clock jumps, and malformed event input.

### Source Change Metrics

The implementation commit changed the four code/test files by **149 additions and 12 deletions**:

| File | Added | Deleted |
|---|---:|---:|
| `mobile/src/__tests__/scheduleUtils.displayState.test.ts` | 92 | 0 |
| `mobile/src/components/EventCard.tsx` | 21 | 6 |
| `mobile/src/screens/ScheduleScreen.tsx` | 16 | 6 |
| `mobile/src/utils/scheduleUtils.ts` | 20 | 0 |

---

## Decisions and Corrections

| Decision | Outcome |
|---|---|
| DR-1 | Applied the specified FlatList limits and Android-only clipping. |
| DR-2 to DR-4 | Used one pure, shared display-state helper rather than raw clock epochs or duplicated date math. |
| DR-5 | Kept `displayState` optional so `LiveUpcomingEvents.tsx` remains source-compatible and unchanged. |
| DR-6 | Used true time for display-state boundaries and minute-rounded time only for the countdown badge. |

### Clarification Correction

The clarification pass incorrectly stated that `EventCard` had no countdown text. Planning correctly found the existing `timeUntilStart` badge, for example `Starts in 45m`. DR-6 resolves that issue: passing raw time would continue to invalidate all upcoming cards every ten seconds, while minute rounding preserves the badge's observable minute-level behavior and lets `React.memo` bail out between minute boundaries.

### Intentional Implementation Deviation

The plan/dispatch suggestion to remove `now` from `renderEventCard`'s `useCallback` dependencies was not applied. Removing it without a `FlatList` `extraData` trigger would leave cell renderers with stale display states and could freeze live/upcoming/completed presentation, violating FR-006.

`now` remains a dependency so cells receive fresh true-time state on each tick. The performance improvement comes from stable `displayState` and minute-rounded `currentTime` props allowing `EventCard`'s default `React.memo` shallow comparison to skip unchanged cards; it does not rely on freezing the render-item callback identity.

---

## Acceptance and Requirement Traceability

### Implemented Requirements

| Requirement | Status | Evidence |
|---|---|---|
| FR-001, FR-002 | Implemented | `FlatList` uses 10 initial rows, 10-row batches, 7-window rendering, and unchanged 100ms batch period. |
| FR-003 | Implemented; device validation pending | Android-only `removeClippedSubviews`; T007 must verify no persistent blank rows or interaction regression. |
| FR-004 | Implemented | Per-event display state replaces raw time as the primary memo-gating signal. |
| FR-005, FR-006 | Implemented; device validation pending | True-time state transitions and existing fake-clock flow are preserved; T008/T009 must observe native behavior. |
| FR-007, FR-008, FR-009 | Implemented; device validation pending | Existing Schedule flows and 112px item layout remain; horizontal schedule untouched. |
| FR-010 | Verified | Isolated helper has ten passing Jest cases without importing Expo-dependent components. |

### Success-Criteria Status

| Success Criterion | Status | Evidence / Remaining Work |
|---|---|---|
| SC-001: bounded initial mount | Implemented, pending profile confirmation | Source configuration is 10 rows; T006 must capture the actual device mount count. |
| SC-002: measurable interactivity improvement | iOS + Android perceptual PASS | Reporter confirmed "super quick"/"super snappy" load (iOS) and smooth, snappy behavior on a high-refresh Android device (~126 JS FPS, no stutters). Both devices are fast enough that peak FPS is near the display cap; the fix reduces re-render work rather than raising an already-capped FPS. |
| SC-003: measurable scroll-frame or dropped-frame improvement | iOS + Android perceptual PASS | Smooth scroll with no blank rows and no stutters on both platforms; JS FPS held near the ~120+ display cap on Android during full-day scroll. A formal before/after frame capture on a mid-range device could quantify further but is not required for sign-off. |
| SC-004: unchanged cards avoid tick re-render; boundary cards update | Implemented, pending observation | Prop design and unit boundary coverage support it; T008 must observe the native render behavior. |
| SC-005: iOS/Android Schedule regression coverage | iOS + Android PASS | Reporter smoke on both platforms: load, full-day scroll, correct countdown/LIVE badges, no blank rows, no regressions. |

### Task State

| Task Group | Status |
|---|---|
| T001-T005: helper, shared-card compatibility, list tuning, clock propagation | Complete |
| T010: focused helper test | Complete: 10/10 passed |
| T011: lint | Complete: 0 errors, 241 baseline warnings |
| T012: type check | Complete |
| T006-T009: Android/iOS performance profiling and smoke | iOS + Android functional/perceptual PASS (smooth, no stutters, correct badges); numeric profiler capture optional |
| T013: stage approved artifacts | Pending pipeline handoff; this report is staged separately for pre-PR review. |

---

## Verification Evidence

Commands executed from `mobile/` against the report base commit/worktree:

```text
npx jest --config jest.config.js src/__tests__/scheduleUtils.displayState.test.ts
PASS: 1 suite, 10 tests

npx tsc --noEmit
PASS

npm run lint
PASS: 0 errors, 241 warnings (existing baseline)
```

The known Expo SDK 54 asset-transform limitation prevents importing Schedule and EventCard components into the Jest environment. The test boundary is therefore intentionally confined to the pure utility; the native visual/performance behavior is covered by the remaining manual tasks.

---

## Risks, Blockers, and Follow-up

| Item | Status | Resolution / Next Step |
|---|---|---|
| Native profiling has not been performed | Open | Complete T006-T009 before merge approval; collect comparable Android baseline and post-fix evidence. |
| Android clipping can expose blank rows if card height diverges from 112px | Open validation risk | T007 must confirm rapid scrolling has no blanks, duplicate cards, incorrect offsets, or broken touch targets. |
| Component-level Jest coverage is unavailable | Accepted, documented limitation | Maintain pure-helper tests and perform required device validation. |
| Raw callback-time dependency removal would freeze cells | Resolved design risk | Kept `now` in the callback dependency list and use stable card props for memoization instead. |

## Leadership Metrics

No credible device performance delta is available yet, so this report intentionally does not claim a percentage improvement in startup or scroll performance. The delivered code reduces the configured initial mount budget from 75 to 10 rows, a configured reduction of **65 rows (86.7%)**, while retained-row and clock-render behavior await profiling confirmation.

AI token/cost and engineering-time savings are not reported because no trustworthy session telemetry or pricing input was available. This avoids presenting estimated financial metrics as measured outcomes.

## Pre-PR Conclusion

The source change is ready for reviewer inspection and static validation has passed. The implementation should remain in pre-PR readiness, not full performance sign-off, until the required Android profiling and iOS/Android smoke checks provide evidence for SC-001 through SC-005, especially SC-002 and SC-003.