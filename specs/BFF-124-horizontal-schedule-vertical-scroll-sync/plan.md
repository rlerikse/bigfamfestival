---
complexity_level: SIMPLE
plan_generated_at: 2026-08-09T00:00:00Z
constitution_version: 1.4.0
---

# Implementation Plan: BFF-124 — Horizontal Schedule Vertical-Scroll Synchronization

**Spec**: [spec.md](./spec.md) | **Branch**: `bugfix/BFF-124-vertical-scroll-sync` | **Complexity**: SIMPLE (score 4)

## Summary

Extend the vertical-offset tracking that already exists structurally (but is unused) in
`HorizontalScheduleView.tsx` so the vertical axis gets the same continuity guarantees the
horizontal axis already has: capture → lift to parent → restore/clamp across the existing
`scrollResetKey` remount. No new remount mechanism, no new state-management pattern, no API
or data-model change. This is a localized bug fix touching two files.

## Technical Context

- **Language/Runtime**: TypeScript 5.x, React Native 0.81.4, Expo SDK 54 (per `.specify/conventions/tech-stack.md`)
- **Affected files**: `mobile/src/components/HorizontalScheduleView.tsx` (primary), `mobile/src/screens/ScheduleScreen.tsx` (parent state lift)
- **Testing**: Jest + `@testing-library/react-native` (constitution §IX / tech-stack.md)
- **No backend, Firestore, API contract, or data-model changes** — pure client-side presentational/state fix
- **No PII involved** — scroll offsets are ephemeral UI state, not user data

### ⚠️ Testing environment constraint (discovered during planning)

`mobile/src/__tests__/SafeText.test.tsx` has its entire suite `describe.skip`-ed with this note:

> "These tests fail with 'TypeError: Cannot read properties of undefined (reading
> constructor)' due to a React Native / testing-library version incompatibility after the
> Expo SDK 54 upgrade."

`@testing-library/react-native`'s `render()` is currently broken in this repo for component
trees using certain native primitives. `HorizontalScheduleView` renders `Animated.ScrollView`,
`expo-image`, and `@expo/vector-icons` — the exact class of component this incompatibility
affects. Existing precedent for working around this (`compassFusion.test.ts`,
`friendLocationStream.test.ts`) is to extract pure logic into standalone, exported functions
and unit-test *those* directly with plain Jest (no `render()`), rather than mounting the
component. This plan follows that precedent (see Decisions & Rationale, DR-4) rather than
attempting a full-component render test that is likely to hit the same failure.

## Constitution Check

| Gate | Requirement | Status |
|------|-------------|--------|
| §IX Mobile Development Standards | Event handlers use `useCallback`; reusable components use `React.memo`; styles via `StyleSheet.create()` | ✅ PASS — fix follows existing component's established patterns (no new anti-patterns introduced) |
| §IX Component Architecture | Screens are thin orchestrators; business logic in hooks/services | ✅ PASS — `ScheduleScreen.tsx` change is a simple ref/state passthrough, consistent with existing `horizontalScrollXRef` pattern |
| §V PII Data Handling | No PII in logs or state | ✅ PASS — scroll offsets are non-PII UI state |
| §XII Specification Requirements | Spec + plan required in `specs/` dir | ✅ PASS — this plan |
| Testing Requirements (tech-stack.md) | Mobile: Jest + RTL | ⚠️ WARN → mitigated — RTL `render()` is currently broken for this component class (see Technical Context); tests target extracted pure logic instead, consistent with existing repo precedent. Manual iOS/Android verification (spec Validation Plan) covers the render/integration gap. |
| Contract-First API Design (§I) | N/A — no API surface touched | N/A |
| Firestore Data Safety (§III) | N/A — no data access | N/A |

No unjustified violations. No exemption request needed — the RTL gap is a pre-existing,
already-documented repo condition, not something this fix introduces or must fix.

## Approach

### 1. Shared contract change: single `{x, y}` position callback (DR-3)

`onScrollPositionChange?: (x: number) => void` becomes
`onScrollPositionChange?: (position: { x: number; y: number }) => void`. This mirrors the
shape `currentOffsetRef` already uses (`{ x: 0, y: 0 }`) and has exactly one call site
(`ScheduleScreen.tsx:L1134`), so the signature change is low-risk. A sibling second callback
was considered and rejected (see Decisions & Rationale).

### 2. Vertical scroll capture (FR-001, FR-002)

Add a plain (non-Animated) `onScroll` handler to the existing vertical `ScrollView`
(`verticalScrollRef`, currently rendered with no `onScroll`/`scrollEventThrottle` at
`HorizontalScheduleView.tsx:L410-415`), with `scrollEventThrottle={16}` per DR-1 (already
decided at clarify time). Unlike the horizontal body scroll, this does NOT need
`Animated.event`/native-driver wiring — DR-2 already scoped the ruler/"Now" indicator as
horizontal-only, so there is no per-frame native-thread visual to keep in sync for the
vertical axis. The handler writes `currentOffsetRef.current.y` and notifies the parent via
the same combined `{x, y}` callback used by the horizontal handler.

### 3. Viewport height tracking for clamping (FR-005)

Add `viewportHeightRef = useRef(0)`, populated via an `onLayout` handler on the vertical
`ScrollView`. Content height is already knowable analytically as
`ROW_HEIGHT * stages.length`. A clamp helper computes:

```ts
maxScrollY = Math.max(0, ROW_HEIGHT * stageCount - viewportHeight)
clampedY = Math.min(Math.max(savedY, 0), maxScrollY)
```

This helper is a pure, exported function (no component/render dependency) so it can be unit
tested directly (see Testing Strategy) — this is the DR-4 mitigation for the broken RTL
`render()` path.

### 4. Restore/remount integration (FR-004, FR-005, User Story 2 AC1-3)

Reuse the existing `scrollResetKey` remount discipline exactly as User Story 2 AC3 requires —
no second remount path:

- The `useLayoutEffect` at `HorizontalScheduleView.tsx:~L313` currently hard-resets
  `currentOffsetRef.current = { x: preservedX, y: 0 }` on a genuine filter/day content change.
  Replace the hardcoded `y: 0` with the clamp helper applied to the *current* Y offset:
  `y: clampVerticalOffset(currentOffsetRef.current.y, stages.length, viewportHeightRef.current)`.
- Add a `pendingScrollYRef` mirroring the existing `pendingScrollXRef`, and extend
  `applyPendingScrollImpl` to also call `verticalScrollRef.current?.scrollTo({ y, animated })`
  when a pending Y target is queued — same instant-vs-animated rule as X (position-preserving
  restores are instant; day-change navigation does not currently move Y, so Y restores are
  always instant).
- Add an `initialScrollY?: number | null` prop mirroring `initialScrollX`, consumed in the
  existing mount-restore `useEffect` (`HorizontalScheduleView.tsx:~L374-379`) to seed
  `pendingScrollYRef.current` on (re)mount from view-mode toggling.

### 5. Parent state lift (FR-003)

`ScheduleScreen.tsx` adds a `horizontalScrollYRef` alongside the existing
`horizontalScrollXRef` (both `useRef<number | null>(null)`), updates
`handleHorizontalScrollPositionChange` to accept the new `{x, y}` shape and write both refs,
and passes `initialScrollY={horizontalScrollYRef.current}` into `HorizontalScheduleView`
alongside the existing `initialScrollX` prop. No new state-management pattern — this mirrors
the existing ref-based lift used for X exactly.

### 6. No changes to ruler / "Now" indicator rendering (FR-006 — no-regression only)

Per DR-2 (already decided at clarify time), no code changes are made to `scrollX`, the
`Animated.View` header transform, or `nowOffset`. Manual/automated tests must confirm these
remain correct after the vertical changes land (regression, not new behavior).

## Decisions & Rationale

### DR-3: Extend `onScrollPositionChange` to `{x, y}` rather than add a sibling callback
- **Decided**: 2026-08-09 during /blue.plan
- **Context**: FR-003 allows "a contract that represents both axes or an equivalent sibling contract." `currentOffsetRef` already stores `{x, y}` together, and there is exactly one call site for this prop.
- **Choice**: Change the single callback's signature to accept `{ x: number; y: number }`.
- **Alternatives rejected**: Adding a second `onVerticalScrollPositionChange?: (y: number) => void` callback — would double the prop surface and split state that is conceptually one "scroll position" for no benefit, given the single low-risk call site.
- **Impact**: FR-002, FR-003; `HorizontalScheduleView.tsx` Props interface; `ScheduleScreen.tsx` callback + refs.

### DR-4: Vertical scroll handler uses plain JS `onScroll`, not `Animated.event`/native-driver
- **Decided**: 2026-08-09 during /blue.plan
- **Context**: The horizontal body scroll uses `Animated.event` with `useNativeDriver: true` specifically because the sticky ruler's `translateX` must track it every frame with zero JS/bridge round-trip (see in-code history at `HorizontalScheduleView.tsx:L140-168`). DR-2 already established there is no equivalent vertical-axis visual (ruler/"Now" indicator are horizontal-only, no regression expected).
- **Choice**: Use a plain `onScroll` prop (JS-thread listener) with `scrollEventThrottle={16}`, matching the DR-1 cadence decision, without any `Animated.Value`/native-driver wiring.
- **Alternatives rejected**: Mirroring the native-driven `Animated.event` pattern for symmetry — unnecessary complexity and an unjustified perf/architecture change for an axis with no per-frame visual dependency; would also complicate the clamp-on-remount logic, which reads a plain ref today.
- **Impact**: FR-001; keeps the fix minimal and consistent with "no regression" scope (FR-006, FR-007).

### DR-5: Extract clamp logic into a pure, exported function; unit-test that function directly rather than the rendered component
- **Decided**: 2026-08-09 during /blue.plan
- **Context**: `@testing-library/react-native`'s `render()` is currently broken for this class of component in this repo (`SafeText.test.tsx`, `describe.skip`, post-Expo-SDK-54 regression). `compassFusion.test.ts` and `friendLocationStream.test.ts` establish the working precedent of testing extracted pure logic with plain Jest instead of mounting components.
- **Choice**: Implement `clampVerticalOffset(savedY, stageCount, viewportHeight)` as a standalone exported function in `HorizontalScheduleView.tsx` (or a small colocated helper), and add direct Jest unit tests against it, covering: zero stages, saved Y within range, saved Y beyond range (clamped to max), and negative/undefined guards.
- **Alternatives rejected**: Attempting a full component `render()` test of `HorizontalScheduleView` — high likelihood of hitting the same pre-existing RN-testing-library incompatibility documented in `SafeText.test.tsx`, which is out of scope for this bug fix to resolve.
- **Impact**: FR-008 (test coverage requirement); satisfies constitution's mobile testing requirement pragmatically given the documented environment constraint.

## Testing Strategy

**Automated (Jest, no RTL `render()`, per DR-5)**:
- `clampVerticalOffset` unit tests: in-range passthrough, clamps to max when content shrank, clamps to 0 for negative input, returns 0 when `stageCount === 0` (matches spec Edge Case "too few stages to scroll").
- If a lightweight interaction test is feasible without full `render()` (e.g. testing the combined `{x,y}` callback-notification logic in isolation, extracted similarly), add it; otherwise document as covered by manual verification per DR-5's documented constraint.

**Manual (per spec Validation Plan — unchanged, this plan does not modify it)**:
- iOS: scroll vertically, change filter/day, toggle view mode, confirm Y restore + ruler/Now regression-free.
- Android: repeat, including a filter change mid-momentum-scroll.

**Regression (existing coverage, if any, plus this plan's manual pass)**:
- Confirm existing horizontal X restore/remount/ruler-sync behavior is unaffected (FR-007).

## Non-Goals (unchanged from spec)

- No ruler/"Now" indicator visual redesign or new Y-based transforms (DR-2).
- No changes to filtering, day selection, event ordering, or the 6:30am cutoff.
- No new remount mechanism — reuses `scrollResetKey` exclusively.
- No backend/API/persistence changes.

## Artifacts

- `plan.md` (this file)
- `tasks.md` (generated next)
- No `contracts/`, `data-model.md`, or `research.md` — not applicable for a SIMPLE, presentational-only bug fix with no API/data surface and no unresolved technical unknowns.
