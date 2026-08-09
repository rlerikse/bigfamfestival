# Research: Schedule List Mount and Scroll Performance (BFF-127)

**Input**: spec.md (CLEAN, Checkpoint 1 approved, DR-1/DR-2/DR-3 settled)
**Mode**: Codebase-pattern-based (no external fetch needed — this is a well-established React Native/FlatList pattern with direct in-repo precedent).

---

## Research: FlatList render-budget tuning

### Question
Are the DR-1 prop values (`initialNumToRender=10`, `maxToRenderPerBatch=10`, `windowSize=7`, `removeClippedSubviews` Android-only) consistent with `FlatList`/`VirtualizedList` behavior and this repo's existing list?

### Investigation
1. **Codebase search**: `mobile/src/screens/ScheduleScreen.tsx` FlatList currently sets `initialNumToRender={75}`, `maxToRenderPerBatch={20}`, `windowSize={15}`, `removeClippedSubviews={false}`, `getItemLayout` fixed at 112px, `updateCellsBatchingPeriod={100}`. These are the exact props DR-1 tunes.
2. **Row height check**: `EventCard.tsx`'s `eventCard` style is `maxHeight: 100` (image height) + `marginBottom: 12` = 112px, matching `getItemLayout`'s `length: 112`. No mismatch found during planning (governs DR-risk on FR-009).
3. **Alternatives evaluated**:
   - Leave defaults and rely only on `removeClippedSubviews` — rejected in spec (DR-1): retains the oversized active render set that causes the reported lag.
   - Switch to `FlashList` (Shopify) or `FlatList` → `SectionList` — rejected: out of scope (Non-Goals forbid introducing new list primitives; DR-1 already settled on `FlatList` prop tuning only).

### Decision
Apply DR-1 values exactly as specified in spec.md. No new research needed — this is prop tuning on an existing, well-understood component.

**Confidence**: HIGH (verified directly against the current file's props and row-height math).

---

## Research: Decoupling the 10s clock from per-card re-render

### Question
What specifically causes every mounted `EventCard` to re-render on each `FakeClockContext` 10s tick today, and how does DR-2's "derived display state" approach fix it while relying on `React.memo`'s *default* shallow comparison (no custom comparator, no per-card timers)?

### Investigation
1. **Codebase search — root cause**: `ScheduleScreen.tsx`'s `renderEventCard` passes `currentTime={now}` (the raw epoch from `useNow()`) to every `EventCard` instance on every render. `EventCard` is wrapped in `React.memo`, but `React.memo`'s default shallow comparison sees `currentTime` (a plain number) differ on every tick, so **every mounted card's memo check fails and it re-renders** — regardless of whether `isLive`/`isPast` actually changed. This is the direct mechanism behind FR-004.
2. **Existing shared-helper precedent**: `mobile/src/utils/scheduleUtils.ts` already exports `isEventLive(ev, nowMs)` and `getEventEndMs(ev)`, used by both `ScheduleScreen.tsx` and `HorizontalScheduleView.tsx` (via `resolveScheduleDayScrollTarget`) to avoid duplicating start/end/midnight-crossing/2h-fallback date math. The file's own header comment: *"Do not duplicate this logic locally in either view — import from here."* `EventCard.tsx` currently has its **own inline copy** of this exact date math (`isLive`, `isPast` `useMemo`s) — a pre-existing duplication this fix should resolve by routing through the shared helper (see DR-4/DR-5).
3. **Cross-consumer check (critical — found during planning)**: `EventCard` is also rendered by `mobile/src/components/LiveUpcomingEvents.tsx` (a Home-screen "Live & Upcoming" widget, unrelated to the Schedule tab), passing `currentTime={now.getTime()}` the same way. `HorizontalScheduleView.tsx` does **not** import `EventCard` (confirmed via search — only a stray comment references it), so it is genuinely unaffected. `LiveUpcomingEvents.tsx`, however, **is** a real second consumer and is explicitly out of scope per FR-008 / Non-Goals — any `EventCard` prop-shape change must not break or alter its behavior.
4. **Alternatives evaluated** (mirrors spec.md's DR-2 alternatives, reconfirmed against code):
   - Per-card timers keyed to each event's own boundary — rejected: timer-drift/battery risk, disproportionate to a 10s-tick list.
   - Context-selector subscription on `FakeClockContext` — rejected: more invasive, conflicts with Non-Goals (`FakeClockContext.tsx` shape unchanged).
   - Custom `React.memo` comparator function on `EventCard` — considered during planning, **rejected**: DR-2 explicitly calls for the *default* shallow comparison; a custom comparator is a second, easy-to-drift source of truth for "what counts as a change" and is unnecessary once the derived value itself is the thing being compared.

### Decision
Implement DR-2/DR-3 by:
- Adding `getEventDisplayState(event, nowMs): 'upcoming' | 'live' | 'completed'` to `scheduleUtils.ts` (not a new file — see DR-4), built directly on the existing `isEventLive`/`getEventEndMs` exports.
- Making `EventCard`'s new `displayState` prop **optional** (see DR-5) so `LiveUpcomingEvents.tsx`'s existing usage (no `displayState` passed) keeps its current internal Date-math behavior, completely unchanged.
- Rounding the `currentTime` value **ScheduleScreen** feeds to `EventCard` to the current minute boundary for the countdown-text calculation only — never for the `displayState` computation itself, which always uses the true, unrounded `now` (see DR-6, and Risk Assessment in plan.md).

**Confidence**: HIGH (root cause and cross-consumer impact confirmed directly via `grep_search` across `mobile/src/**`, not assumed).

---

## Research: Testability under Expo SDK 54 Jest transform

### Question
Where should `getEventDisplayState` live and be tested, given known Jest/Expo constraints?

### Investigation
Repo memory (`known-issues.md` / prior BFF-124, BFF-128 work) and this session's direct confirmation: importing `ScheduleScreen.tsx`, `EventCard.tsx`, or any module pulling in `@expo/vector-icons`/`expo-image` fails under this repo's Jest config on the Expo SDK 54 font-asset transform, even without `render()`. Existing precedent tests — `mobile/src/__tests__/scheduleUtils.genre.test.ts` (BFF-128) — import **only** `scheduleUtils.ts`, which has zero RN/Expo imports, and pass cleanly.

### Decision
Add `getEventDisplayState` to `scheduleUtils.ts` (already a zero-RN/Expo-import module) and add a sibling test file `mobile/src/__tests__/scheduleUtils.displayState.test.ts` following the exact same naming/import convention as `scheduleUtils.genre.test.ts`. Run via `npx jest --config jest.config.js`.

**Confidence**: HIGH (direct precedent, same file already proven Jest-safe).

---

## Summary of Decisions Feeding plan.md

| # | Decision | Source |
|---|----------|--------|
| DR-1, DR-2, DR-3 | FlatList tuning; clock/card decoupling strategy; extract pure helper | spec.md (settled, not re-litigated) |
| DR-4 | `getEventDisplayState` lives in `scheduleUtils.ts`, reusing `isEventLive`/`getEventEndMs` | This research |
| DR-5 | `EventCard.displayState` prop is optional/backward-compatible (protects `LiveUpcomingEvents.tsx`) | This research |
| DR-6 | Minute-rounded `currentTime` for countdown text only; unrounded `now` for `displayState` | This research |
