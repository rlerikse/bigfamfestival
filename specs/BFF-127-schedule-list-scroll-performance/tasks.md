# Tasks: BFF-127 Schedule List Mount and Scroll Performance

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), and [research.md](./research.md)
**Prerequisites**: Approved specification and implementation plan
**Tests**: Unit coverage is intentionally limited to the pure `scheduleUtils.ts` helper. Do not import or render `ScheduleScreen.tsx`, `EventCard.tsx`, or Expo icon/image-bearing modules under Jest; Expo SDK 54 cannot transform those assets.

## Requirement and Decision Traceability

| Requirement / Decision | Covered by |
|---|---|
| FR-001, FR-002, FR-003, FR-009; DR-1 | T004, T006, T007 |
| FR-004, FR-005, FR-006, FR-008; DR-2, DR-5, DR-6 | T003, T005, T008, T009 |
| FR-007 | T005, T009 |
| FR-010; DR-3, DR-4 | T001, T002, T010 |

## Phase 1: Pure Display-State Helper (Foundational)

**Purpose**: Establish the single, Jest-safe source of truth for upcoming/live/completed state before either component consumes it.

**Dependencies**: None.

- [ ] T001 [P] [UNIT] [M] Add failing boundary-focused unit coverage in `mobile/src/__tests__/scheduleUtils.displayState.test.ts` for `getEventDisplayState(event, nowMs)`, following the import-only-`scheduleUtils.ts` convention in `mobile/src/__tests__/scheduleUtils.genre.test.ts`; cover upcoming/live/completed, event end times, fake-clock jumps, cross-midnight events, and the existing two-hour fallback. [FR-010] [DR-3,DR-4]
- [ ] T002 [D:T001] [B:T003,T004,T005] [M] Implement and export `getEventDisplayState(event, nowMs): 'upcoming' | 'live' | 'completed'` in `mobile/src/utils/scheduleUtils.ts`, deriving state only through the existing `isEventLive` and `getEventEndMs` exports without duplicating start/end/midnight/fallback date math. [FR-005,FR-006,FR-010] [DR-3,DR-4]

**Checkpoint**: The pure utility tests demonstrate correct state transitions without importing React Native or Expo modules.

## Phase 2: Backward-Compatible Event Card Contract

**Purpose**: Let the Schedule list provide a stable display-state prop while preserving the Home-screen consumer's existing fallback behavior.

**Dependencies**: T002.

- [ ] T003 [D:T002] [B:T005] [US3] [M] Update `mobile/src/components/EventCard.tsx` with optional `displayState?: 'upcoming' | 'live' | 'completed'`; when supplied, derive `isLive` and `isPast` from it, and when absent preserve the existing `currentTime` Date-math fallback exactly. Do not modify `mobile/src/components/LiveUpcomingEvents.tsx`, add a custom `React.memo` comparator, or create a Jest/RTL component test. [FR-004,FR-005,FR-006,FR-008] [DR-2,DR-5]

**Checkpoint**: `EventCard` remains source-compatible with its unmodified `LiveUpcomingEvents.tsx` consumer and can accept the Schedule list's derived state.

## Phase 3: Schedule List Render Budget and Clock Propagation

**Purpose**: Apply the bounded Android list render budget and pass stable, semantically correct time props to cards.

**Dependencies**: T002 and T003. Execute T004 before T005 because both modify `mobile/src/screens/ScheduleScreen.tsx`.

- [ ] T004 [D:T002,T003] [B:T005] [US1] [US2] [M] Tune the list-view `FlatList` in `mobile/src/screens/ScheduleScreen.tsx`: set `initialNumToRender={10}`, `maxToRenderPerBatch={10}`, `windowSize={7}`, and `removeClippedSubviews={Platform.OS === 'android'}`; retain `getItemLayout` at 112px and `updateCellsBatchingPeriod={100}` unchanged. Preserve fewer-than-budget list behavior, the horizontal view, and correct fixed-row positioning. [FR-001,FR-002,FR-003,FR-008,FR-009] [DR-1]
- [ ] T005 [D:T002,T003,T004] [US3] [L] Update `renderEventCard` in `mobile/src/screens/ScheduleScreen.tsx` to compute `displayState` with `getEventDisplayState(item, now)` using the true, unrounded schedule time, then pass a separately minute-rounded `currentTime` value (`Math.floor(now / 60_000) * 60_000`) only for `EventCard` countdown text. **Warning: never round the value used for `displayState`; doing so delays live/completed transitions and violates FR-006.** Preserve cache-first loading, ordering, filters, pull-to-refresh, favorites, detail navigation, fake-clock behavior, and card content. [FR-004,FR-005,FR-006,FR-007,FR-008] [DR-2,DR-3,DR-6]

**Checkpoint**: The list gives memoized cards stable props across unchanged 10-second ticks while state crossings still use the real schedule clock.

## Phase 4: Manual Device Profiling and Regression Validation

**Purpose**: Validate native rendering behavior and performance that cannot be reliably exercised under the Expo SDK 54 Jest transform.

**Dependencies**: T005.

- [ ] T006 [D:T005] [US1] [MANUAL] [M] On a representative mid-range Android device, capture a cold long-list Schedule open before/after profile in `mobile/`: record initially mounted rows, time to interactivity, and the configured FlatList values; verify first mount is approximately one viewport plus buffer rather than 75 cards. [FR-001,FR-002] [DR-1]
- [ ] T007 [D:T005] [US2] [MANUAL] [M] Profile repeated rapid Android Schedule-list scrolling in `mobile/` and verify rows entering the active window show correct content with no persistent blanks, duplicate cards, broken touch targets, or incorrect fixed-row jumps; document any clipping or height correctness regression before release. [FR-002,FR-003,FR-009] [DR-1]
- [ ] T008 [D:T005] [US3] [MANUAL] [M] Observe at least one ten-second schedule-clock update with visible upcoming, live, and completed events in `mobile/`; confirm unchanged cards avoid a render burst while boundary-crossing cards update on the next tick, including an existing fake-clock jump across multiple boundaries. [FR-004,FR-005,FR-006] [DR-2,DR-3,DR-6]
- [ ] T009 [D:T005] [US1] [US2] [US3] [MANUAL] [M] Smoke the changed Schedule list on iOS and Android in `mobile/`: verify filters, pull-to-refresh, favorites, event-detail navigation, cache-first loading, list card content, and fake-clock-driven status; also confirm the horizontal schedule view remains unchanged. [FR-005,FR-007,FR-008] [DR-5]

## Phase 5: Static Verification and Handoff

**Purpose**: Run the allowed automated checks after implementation and prepare the feature for pipeline-owned approval and commit.

**Dependencies**: T002 and T005; T010-T012 can run in parallel after those tasks complete.

- [ ] T010 [D:T002,T005] [P] [UNIT] [S] Run `npx jest --config jest.config.js scheduleUtils.displayState.test.ts` from `mobile/` and record the result; keep the test run restricted to the pure utility boundary. [FR-010] [DR-3,DR-4]
- [ ] T011 [D:T002,T005] [P] [S] Run `npm run lint` from `mobile/` and resolve only BFF-127-introduced diagnostics. [FR-001,FR-002,FR-003,FR-004,FR-005,FR-006,FR-007,FR-008,FR-009,FR-010]
- [ ] T012 [D:T002,T005] [P] [S] Run `npm run typecheck` from `mobile/` and resolve only BFF-127-introduced diagnostics. [FR-001,FR-002,FR-003,FR-004,FR-005,FR-006,FR-007,FR-008,FR-009,FR-010]
- [ ] T013 [D:T006,T007,T008,T009,T010,T011,T012] [S] Stage the approved BFF-127 source, test, feature artifacts, and workflow-state changes with `git add`; do not create a commit. The pipeline orchestrator creates the signed commit only after Checkpoint 2 approval. [FR-001,FR-002,FR-003,FR-004,FR-005,FR-006,FR-007,FR-008,FR-009,FR-010]

## Dependencies and Execution Order

`T001 -> T002 -> T003 -> T004 -> T005 -> T006/T007/T008/T009/T010/T011/T012 -> T013`

- T001 is the only test-authoring task and must precede T002 for TDD.
- T003 protects the unmodified shared-card consumer before Schedule work begins.
- T004 and T005 are deliberately serialized because both modify `ScheduleScreen.tsx`.
- T006-T009 are manual profiling/smoke tasks, not automated component tests.
- T010-T012 are parallel static checks after the pure-helper and Schedule changes.

## Test Distribution

| Level | Count | % | Target | Status |
|---|---:|---:|---|---|
| UNIT | 2 | 100% | >=50% | Appropriate: component/Jest imports are prohibited by FR-010 |
| INTG | 0 | 0% | ~25% | N/A: no API or service integration surface |
| E2E | 0 | 0% | <=15% | N/A: native profiling and smoke checks are manual by specification |
| SIM | 0 | 0% | ~10% | N/A |

## Coverage Check

- FR-001 through FR-010: mapped to one or more implementation, validation, or static-verification tasks.
- DR-1 through DR-6: mapped to the relevant source and validation tasks.
- No requirement coverage gaps identified.
- No Git commit task is included; T013 is intentionally staging-only.