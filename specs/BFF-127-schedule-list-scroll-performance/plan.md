# Implementation Plan: BFF-127 Schedule List Mount and Scroll Performance

**Branch**: `bugfix/BFF-127-schedule-list-perf` | **Date**: 2026-08-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/BFF-127-schedule-list-scroll-performance/spec.md`

---

## Summary

The Schedule screen's list view over-mounts (75 rows at first paint) and over-renders (every mounted card re-renders on each 10s schedule-clock tick, because the raw clock epoch is passed straight into a `React.memo`-wrapped `EventCard`, defeating the memo). The fix is two independent, additive changes to `mobile/src/screens/ScheduleScreen.tsx` and `mobile/src/components/EventCard.tsx`, backed by one new pure helper in `mobile/src/utils/scheduleUtils.ts`:

1. **Bound the render budget** — tune `FlatList` props (`initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, Android-only `removeClippedSubviews`) per DR-1. No new dependency, no new component.
2. **Decouple the clock tick from card re-renders** — derive a per-event tri-state (`upcoming`/`live`/`completed`) via a new pure helper `getEventDisplayState(event, nowMs)` and pass *that* (not the raw epoch) as the value gating `EventCard`'s `React.memo` bail-out, per DR-2/DR-3.

No API, data model, or backend changes. No new dependencies. No changes to `HorizontalScheduleView`, `FakeClockContext`, filters, pull-to-refresh, or cached loading.

---

## Technical Context

| Aspect | Value |
|--------|-------|
| **Primary Dependencies** | React Native 0.81.5, Expo SDK ~54.0.36, React 19.1.0, TypeScript 5.x (all per `mobile/package.json` — no new dependency added) |
| **Storage** | N/A — no persistence, cache-policy, or Firestore changes (FR-007) |
| **Testing Framework** | Jest 29.x (`jest-expo` preset) via `mobile/jest.config.js`; run with `npx jest --config jest.config.js` |
| **Target Platform** | iOS + Android via Expo (mobile app) |
| **Project Type** | Mobile (React Native / Expo) — single existing screen + component modified, no new screens |

**Performance Goals**: Per SC-001–SC-003 — initial Schedule list mount ≈ one visible viewport + small buffer (not 75 rows); measurable reduction in time-to-interactivity and measurable improvement in scroll frame rate / dropped frames on a representative mid-range Android device. Thresholds are intentionally profiling-verified (Validation Plan), not fixed numeric targets — no automated perf-regression test is introduced.

**Constraints**:
- MUST NOT change: cached loading path (`eventsService`), event order (`sortedEvents`), filters, pull-to-refresh (`isRefreshing`/`fetchEvents`), `EventCard`'s visible content, `HorizontalScheduleView`, or `FakeClockContext`'s 10s `TICK_INTERVAL_MS`.
- MUST NOT regress `EventCard`'s existing second consumer, `LiveUpcomingEvents.tsx` (Home-screen widget) — discovered during planning via cross-repo search; out of scope per FR-008 but shares the `EventCard` component.
- Component-import limitation: `ScheduleScreen.tsx`/`EventCard.tsx` cannot be imported under this repo's Jest config (Expo SDK 54 font-asset transform failure) — automated coverage is therefore limited to the pure helper (FR-010).

**Scale/Scope**: Single festival schedule (~75 events/day across all stages); single screen (`ScheduleScreen.tsx` list view) plus one shared component (`EventCard.tsx`) and one shared utility module (`scheduleUtils.ts`).

---

## Constitution Check

*GATE: Checked before Phase 0 research. Re-checked after Phase 1 design — no changes required either pass.*

Constitution: `.specify/memory/constitution.md` v1.4.0. This is a pure mobile-frontend performance fix — no API, data model, auth, or infra surface is touched, so most sections (§I–§VIII, §XIII–§XVI) are **not applicable**. Relevant sections:

| Gate | Requirement (Constitution) | Spec/Plan Status | Result |
|------|----------------------------|-------------------|--------|
| §IX Component Architecture | "Reusable components MUST use `React.memo`" | `EventCard` already uses `React.memo`; plan strengthens (not removes) this by fixing what defeats it today | ✅ PASS |
| §IX Component Architecture | "Event handlers MUST use `useCallback`" | `renderEventCard`, `keyExtractor`, heart/press handlers already use `useCallback`; unchanged pattern retained | ✅ PASS |
| §IX Component Architecture | "Styles MUST use `StyleSheet.create()` outside component body" | No new/changed styles in this fix | ✅ PASS (N/A — no style changes) |
| §IX Service Layer | API calls in service files, not components | No API calls added/changed | ✅ PASS (N/A) |
| §V PII Handling | PII MUST NOT be logged | No new logging added; epoch timestamps / display-state strings are not PII | ✅ PASS |
| §XII Specification Requirements | `spec.md` required; `plan.md` required for features entering development | Both present in `specs/BFF-127-schedule-list-scroll-performance/` | ✅ PASS |
| Testing Requirements | "Mobile: Jest + React Native Testing Library" | RNTL is inapplicable here (known Expo SDK 54 Jest-transform limitation, same as BFF-124/BFF-128 precedent); plain Jest unit coverage on the extracted pure helper is used instead, with manual device profiling covering render/behavior verification (documented in Validation Plan) | ✅ PASS (documented deviation, consistent with existing repo precedent — not a new deviation) |

### Required Documentation Gates

- [x] N/A — API contract (OpenAPI/Swagger): not applicable, no API changes.
- [x] N/A — Sequence diagram: not applicable, no cross-service interaction changes.
- [x] N/A — Data model definition: not applicable, no data model changes.
- [x] N/A — Migration scripts: not applicable.

### Constitution Compliance Gates

- [x] **Contract Compliance**: N/A (no API surface touched).
- [x] **Security**: N/A (no auth/data-access changes; no new user input surfaces).
- [x] **Observability**: N/A (no new logs; existing `console.error` in `fetchEvents` untouched).
- [x] **PII Handling**: PASS — epoch ms / display-state values contain no PII.
- [x] **Mobile Component Architecture (§IX)**: PASS — see table above.

**All gates PASS.** No Constitution Exemptions required.

---

## Project Structure

### Documentation (this feature)

```text
specs/BFF-127-schedule-list-scroll-performance/
├── spec.md               # Feature specification (complete, Checkpoint 1 approved)
├── plan.md               # This file
├── research.md           # Phase 0 output
└── tasks.md              # Phase 2 output (generated next, via /blue.tasks)
```

`data-model.md`, `contracts/`, and `quickstart.md` are intentionally **not generated** — this feature has no data model, no API contracts, and no new local-dev setup steps (it modifies an existing screen using the existing `npm run ios`/`npm run android`/`npx jest` workflows already documented in `mobile/README.md`).

### Source Code (repository root)

```text
mobile/
├── src/
│   ├── screens/
│   │   └── ScheduleScreen.tsx          # EDIT: FlatList prop tuning (DR-1); renderEventCard
│   │                                    #       computes displayState + rounded currentTime (DR-2/DR-3/DR-6)
│   ├── components/
│   │   └── EventCard.tsx               # EDIT: optional `displayState` prop (DR-5); isLive/isPast
│   │                                    #       derive from it when present, unchanged Date-math fallback otherwise
│   ├── utils/
│   │   └── scheduleUtils.ts            # EDIT: add getEventDisplayState() (DR-3/DR-4), reusing
│   │                                    #       existing isEventLive()/getEventEndMs()
│   └── __tests__/
│       └── scheduleUtils.displayState.test.ts   # NEW: pure unit coverage (FR-010)
```

**Structure Decision**: Modify the two existing files directly involved (screen + shared card component) and extend the existing shared utility module rather than creating a new file — matches the established `scheduleUtils.ts` convention from BFF-124 (`clampVerticalOffset`) and BFF-128 (`deriveGenreOptions`), and keeps all schedule-view date/time math in one place per that file's own header comment ("Do not duplicate this logic locally... import from here").

---

## Decisions & Rationale

> DR-1, DR-2, DR-3 were settled in `spec.md` during `/blue.clarify` and are not re-litigated here. DR-4 onward were made during `/blue.plan`.

### DR-4: `getEventDisplayState` lives in `scheduleUtils.ts`, not a new file
- **Decided**: 2026-08-09 during `/blue.plan`
- **Context**: DR-3 mandates a pure helper in `mobile/src/utils/` but does not name the exact file.
- **Choice**: Add `getEventDisplayState(event, nowMs): 'upcoming' | 'live' | 'completed'` to the existing `scheduleUtils.ts`, implemented directly in terms of the module's existing exports `isEventLive(ev, nowMs)` and `getEventEndMs(ev)` — no reimplementation of start/end/midnight-crossing/2h-fallback date math.
- **Alternatives rejected**:
  - New file `mobile/src/utils/eventDisplayState.ts` (rejected — unnecessary fragmentation; `scheduleUtils.ts` is the established single home for cross-view schedule date/time helpers per BFF-124/BFF-128 precedent and its own header comment).
  - Reimplementing the boundary math inline again (rejected — `EventCard.tsx` already independently duplicates this exact date math today; this fix is the opportunity to route through the one shared implementation instead of adding a third copy).
- **Impact**: FR-010; `mobile/src/utils/scheduleUtils.ts`; new test file location.

### DR-5: `EventCard.displayState` is an optional, backward-compatible prop
- **Decided**: 2026-08-09 during `/blue.plan`
- **Context**: `grep_search` during planning found a **second consumer** of `EventCard` — `mobile/src/components/LiveUpcomingEvents.tsx` (a Home-screen "Live & Upcoming" widget) — which passes `currentTime={now.getTime()}` the same way `ScheduleScreen.tsx` does today. This consumer is out of scope per FR-008/Non-Goals and must not regress. (`HorizontalScheduleView.tsx` was also checked and does **not** import `EventCard` — confirmed no impact there.)
- **Choice**: Add `displayState?: 'upcoming' | 'live' | 'completed'` as an **optional** prop on `EventCard`. When present (new `ScheduleScreen.tsx` call site), `isLive`/`isPast` are derived directly from it (`isLive = displayState === 'live'`, `isPast = displayState === 'completed'`), skipping the internal Date-math `useMemo`s for those two values. When absent (`LiveUpcomingEvents.tsx`'s existing, unmodified call site), `EventCard` falls back to its current internal `currentTime`-driven Date-math for `isLive`/`isPast`, unchanged.
- **Alternatives rejected**:
  - Making `displayState` required and updating `LiveUpcomingEvents.tsx` too (rejected — expands scope beyond FR-008/Non-Goals for no benefit; that widget renders only a handful of cards and was never the reported perf bottleneck).
  - A wrapper/adapter component instead of touching `EventCard` (rejected — adds an extra file/indirection for what is a two-line conditional inside the existing component).
- **Impact**: `EventCard.tsx` (additive prop + conditional derivation), `LiveUpcomingEvents.tsx` (zero changes, explicitly verified), FR-004/FR-006/FR-008.

### DR-6: `currentTime` fed to `EventCard` is minute-rounded for countdown text; `displayState` always uses the true, unrounded clock value
- **Decided**: 2026-08-09 during `/blue.plan`
- **Context**: `EventCard`'s `timeUntilStart` countdown badge (e.g., "45m") still needs an actual timestamp and is explicitly preserved as existing visible content (Non-Goals: "EventCard's visible content" unchanged). If `ScheduleScreen.tsx` kept passing the raw, ever-changing `now` for this purpose, every upcoming card would still re-render on every 10s tick — reintroducing the exact problem DR-2 fixes. Conversely, freezing `currentTime` entirely until a `displayState` boundary crossing would let the countdown badge go stale by tens of minutes while an event is upcoming — a regression against FR-005 ("remain correct for real time").
- **Choice**: `ScheduleScreen.renderEventCard` computes **two** separate values from the same `now`: (a) `getEventDisplayState(item, now)` — always uses the true, unrounded `now`, so `displayState` transitions happen on the correct 10s tick per FR-006; and (b) a `currentTime` prop value rounded down to the current minute boundary (`Math.floor(now / 60_000) * 60_000`) — fed only to `EventCard`'s existing `timeUntilStart` calculation, which already only visually changes on minute boundaries (`Math.ceil` to the nearest minute), so rounding introduces **no observable behavior change** while making the prop shallow-equal across ~5 of every 6 ten-second ticks.
- **Alternatives rejected**:
  - Drop `currentTime` entirely once `displayState` is present (rejected — see staleness regression above).
  - Custom `React.memo` comparator on `EventCard` to selectively ignore `currentTime` changes (rejected — DR-2 explicitly calls for relying on memo's *default* shallow comparison; a custom comparator is a second, easy-to-drift source of truth).
- **Impact**: `ScheduleScreen.tsx` (`renderEventCard`), FR-004, FR-005, FR-006; must be called out explicitly in tasks so the rounding is applied only to the countdown-text value, never to the `displayState` computation.

---

## Complexity Tracking

*No Constitution Check violations — table intentionally empty.*

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `removeClippedSubviews` (Android-only, DR-1) combined with fixed `getItemLayout` (112px) causes blank rows if any card's rendered height ever diverges from 112px | Low | Medium | `getItemLayout` height already matches `EventCard`'s style exactly (100px image + 12px marginBottom = 112px) — verified during planning, no change proposed. FR-003/FR-009 require correctness to win if profiling (Validation Plan step 2/4) finds a mismatch; if triggered, `removeClippedSubviews`/`getItemLayout` must be revisited in a follow-up, not silently patched over. |
| Minute-rounding (DR-6) accidentally applied to the `displayState` computation instead of only the countdown-text `currentTime` value, delaying LIVE/COMPLETED transitions by up to 59s | Medium (if implemented carelessly) | Medium (delayed LIVE badge — violates FR-006 "by the next available schedule-clock update") | Explicit task-level instruction: `getEventDisplayState(item, now)` MUST use the raw, unrounded `now`; only the separate `currentTime` prop value passed to `EventCard` is rounded. Manual profiling step 3 in the Validation Plan directly exercises a clock tick with a mix of live/upcoming/completed cards. |
| `getEventDisplayState` reimplements start/end/midnight/2h-fallback math slightly differently from `EventCard`'s current inline logic, causing a subtle live-state mismatch | Low | Medium | DR-4: build `getEventDisplayState` directly on top of the existing, already-used `isEventLive`/`getEventEndMs` exports rather than reimplementing — guarantees identical semantics to today's behavior. |
| `EventCard` prop-shape change regresses `LiveUpcomingEvents.tsx` (second consumer, out of scope) | Low (mitigated by design) | Medium (Home-screen widget regression) | DR-5: `displayState` is optional and additive; `LiveUpcomingEvents.tsx`'s call site is left completely unmodified and continues to exercise the pre-existing `currentTime`-driven code path. |
| Manual-profiling-only validation (no automated perf assertion) means a regression could land undetected in CI | Low–Medium | Medium | Accepted per spec (SC-002/SC-003 intentionally profiling-verified, not fixed thresholds); the pure-helper unit tests (FR-010) at least guarantee the state-derivation logic itself stays correct under CI, and the Validation Plan's manual steps are mandatory before merge per the spec's own Validation Plan. |

---

## Dependencies

### External Dependencies
None — no new npm packages required. All changes use existing `react-native`/`react` APIs (`FlatList` props, `React.memo`).

### Internal Dependencies
- `mobile/src/utils/scheduleUtils.ts` — extended (already depended upon by `ScheduleScreen.tsx` and `HorizontalScheduleView.tsx`); this fix adds a new export, does not change existing exports' signatures or behavior.
- `mobile/src/contexts/FakeClockContext.tsx` — read-only dependency via `useNow()`; unchanged (Non-Goals).
- `mobile/src/components/LiveUpcomingEvents.tsx` — indirect dependency (shares `EventCard`); explicitly verified unaffected (DR-5).

---

## Next Steps

1. Run `/blue.tasks` to generate the dependency-ordered task breakdown from this plan.
2. Run `/blue.analyze` to validate plan + tasks against `spec.md` and the constitution.
3. Begin implementation with `/blue.implement`.
