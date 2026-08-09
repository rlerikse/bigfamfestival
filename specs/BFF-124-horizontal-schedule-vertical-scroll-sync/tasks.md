# Tasks: BFF-124 - Horizontal Schedule Vertical-Scroll Synchronization

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)
**Complexity**: SIMPLE (score 4)
**Scope**: Two production files plus a focused Jest test file. No API, backend, data-model, or new remount mechanism.

## Phase 1: Clamp Helper and Scroll-Position Contract

**Purpose**: Establish the testable clamp behavior and the shared `{ x, y }` position contract before wiring native scroll events.

- [ ] T001 [US2] [UNIT] [S] Add direct plain-Jest cases for exported `clampVerticalOffset` in `mobile/src/__tests__/HorizontalScheduleView.test.ts`; cover zero stages, in-range offsets, offsets above the reduced-content maximum, and negative or absent offsets without using `@testing-library/react-native` `render()` or component queries. **Traceability**: FR-005, FR-008; US2 AC2.
- [ ] T002 [D:T001] [US1] [US2] [M] Export `clampVerticalOffset(savedY, stageCount, viewportHeight)` and extend the `HorizontalScheduleView` props/callback contract to represent `{ x, y }` plus `initialScrollY` in `mobile/src/components/HorizontalScheduleView.tsx`; keep the helper pure and clamp to the valid vertical range. **Traceability**: FR-002, FR-003, FR-005, FR-008; US1 AC1; US2 AC2.

**Checkpoint**: The pure helper tests fail before T002 and pass after T002; no component render test is added.

## Phase 2: Capture, Lift, and Restore Vertical Position

**Purpose**: Wire the combined position contract through the child and parent, then restore a valid Y position with the existing remount-key lifecycle.

- [ ] T003 [D:T002] [US1] [M] Add the vertical stage-row `ScrollView` `onScroll` handler with `scrollEventThrottle={16}` in `mobile/src/components/HorizontalScheduleView.tsx`; store the latest Y in `currentOffsetRef` and notify the parent with the current `{ x, y }` position without changing ruler or "Now" indicator rendering. **Traceability**: FR-001, FR-002, FR-006, FR-007; US1 AC1-AC3.
- [ ] T004 [D:T002] [US1] [US2] [S] Mirror `horizontalScrollXRef` with `horizontalScrollYRef`, update `handleHorizontalScrollPositionChange` for `{ x, y }`, and pass `initialScrollY` to `HorizontalScheduleView` in `mobile/src/screens/ScheduleScreen.tsx`. **Traceability**: FR-003, FR-004; US2 AC1.
- [ ] T005 [D:T003,T004] [US2] [M] Reuse `scrollResetKey` in `mobile/src/components/HorizontalScheduleView.tsx` to queue and instantaneously restore the saved clamped Y after compatible remounts; preserve Y on view-mode remounts, replace the hardcoded filter/day reset Y with `clampVerticalOffset`, and avoid stale `contentOffset` state from a torn-down native view. **Traceability**: FR-004, FR-005, FR-007; US2 AC1-AC3; edge cases for content shrink, momentum day switch, and non-scrollable stage lists.

**Checkpoint**: Both axes use one callback contract; vertical state survives a compatible remount, while invalid saved Y is clamped and existing horizontal synchronization remains unchanged.

## Phase 3: Focused Verification and Platform Regression

**Purpose**: Prove the pure logic and verify native behavior on both supported platforms, including the horizontal no-regression boundary.

- [ ] T006 [D:T005] [US1] [US2] [UNIT] [S] Run the focused Jest suite for `mobile/src/__tests__/HorizontalScheduleView.test.ts` and the existing relevant mobile test command; confirm the helper coverage passes without mounting `HorizontalScheduleView`. **Traceability**: FR-005, FR-008; US2 AC2.
- [ ] T007 [D:T006] [US1] [US2] [M] Manually verify iOS and Android in the horizontal schedule: vertically scroll a multi-stage day, toggle list/horizontal view, change filter/day including an in-progress momentum scroll, confirm valid/clamped Y restoration, and confirm horizontal ruler/"Now" alignment and horizontal X restoration still work. **Traceability**: FR-001, FR-004-FR-008; US1 AC1-AC3; US2 AC1-AC3; SC-001-SC-004.

## Requirement Traceability

| Requirement | Tasks |
|-------------|-------|
| FR-001 | T003, T007 |
| FR-002 | T002, T003 |
| FR-003 | T002, T004 |
| FR-004 | T004, T005, T007 |
| FR-005 | T001, T002, T005, T006, T007 |
| FR-006 | T003, T007 |
| FR-007 | T003, T005, T007 |
| FR-008 | T001, T006, T007 |

| User Story Acceptance Criteria | Tasks |
|---------------------------------|-------|
| US1 AC1: responsive vertical offset capture | T002, T003, T007 |
| US1 AC2: no stale/desynchronized ruler or "Now" state | T003, T007 |
| US1 AC3: clock updates do not reset/desynchronize Y | T003, T007 |
| US2 AC1: compatible remount restores Y | T004, T005, T007 |
| US2 AC2: invalid Y is clamped | T001, T002, T005-T007 |
| US2 AC3: remount-key lifecycle avoids stale native state | T005, T007 |

## Dependencies and Execution Order

`T001 -> T002 -> (T003 and T004) -> T005 -> T006 -> T007`

T003 and T004 can proceed in parallel after T002 because they modify separate production files. All other tasks are ordered to keep the helper contract, component wiring, parent wiring, and platform verification coherent.

## Test Distribution

| Level | Count | % | Rationale |
|-------|-------|---|-----------|
| UNIT | 2 | 100% | The only automated test surface is the pure clamp helper and its focused Jest execution. |
| INTG | 0 | 0% | Component rendering is excluded by the documented Expo SDK 54 / `@testing-library/react-native` incompatibility. |
| E2E | 0 | 0% | Native visual/remount behavior is covered by required manual iOS and Android verification. |

## Out of Scope

- Do not add `@testing-library/react-native` `render()`, `getByTestId`, or component-query tasks for `HorizontalScheduleView`.
- Do not alter sticky-ruler or "Now" indicator Y positioning, filters, selected-day behavior, event ordering, or the existing horizontal remount architecture.
- Do not create Jira subtasks; BFF-124 is sourced from GitHub Issue #187 and the project Jira space is closed.