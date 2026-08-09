# FakeClock Debug Tool - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)
**Jira**: none — this feature was never tracked in Jira (built after the Jira space closed)
**GitHub Issue**: #149
**Created**: 2026-08-09 (retroactively documented via `/blue.drift`)

> **⚠️ Drift note (2026-08-09):** This spec did not exist prior to today. `mobile/src/contexts/FakeClockContext.tsx` and `mobile/src/components/FakeClockOverlay.tsx` were shipped (2026-07-20, commits `a1aff6b`/`03dfabc`) with **zero spec coverage** — discovered via a `/blue.drift` audit. This document reconstructs the spec from the implementation so the feature has a system-of-record entry.

---

## Overview

FakeClock lets admins simulate the passage of time within the mobile app — overriding "now" for schedule-dependent UI (now-bar position, live-event highlighting, auto-scroll-to-now, countdowns) without changing the physical device clock. This exists purely to make time-dependent behavior testable/demoable on demand, without waiting hours for a multi-day festival schedule to actually progress.

---

## User Stories

### User Story 1 - Simulate a Point in Time
**As an** admin/developer,
**I want to** override the app's notion of "now" to any timestamp,
**So that** I can verify schedule live-time behavior (now-bar, live highlighting, auto-scroll) without waiting for real time to pass.

**Acceptance Criteria** (Verified):
- [x] `setFakeTime(ts)` overrides the clock for all consumers of `useFakeClock()`
- [x] `setFakeTime(null)` reverts to the real clock immediately
- [x] All schedule-live-time logic reads `now` from context instead of calling `Date.now()` directly

**Implementation**: `mobile/src/contexts/FakeClockContext.tsx`

### User Story 2 - See the Override Indicator
**As an** admin,
**I want to** see a visible indicator when a fake time is active,
**So that** I don't mistake simulated time for the real device clock.

**Acceptance Criteria** (Verified):
- [x] `isFakeClock` flag is `true` whenever an override is active
- [x] `FakeClockOverlay` renders a scrubber/indicator UI when active

**Implementation**: `mobile/src/components/FakeClockOverlay.tsx`

### User Story 3 - Real Clock Ticks Normally When Not Overridden
**As a** normal attendee (no override active),
**I want** the app to use the real device clock,
**So that** the fake-clock tool never affects production behavior.

**Acceptance Criteria** (Verified):
- [x] While `fakeTime === null`, `now` ticks from `Date.now()` on a 10s interval
- [x] Reverting (`setFakeTime(null)`) immediately re-syncs to the real clock (no stale value until next tick)

**Implementation**: `mobile/src/contexts/FakeClockContext.tsx` (`TICK_INTERVAL_MS`, `useEffect`)

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Provide a `now` value usable in place of `Date.now()` | ✅ | `FakeClockContext.tsx` |
| FR-002 | Support setting/clearing a fake time override | ✅ | `setFakeTime()` |
| FR-003 | Expose whether an override is currently active | ✅ | `isFakeClock` |
| FR-004 | Real clock ticks on an interval when no override is set | ✅ | `TICK_INTERVAL_MS = 10_000` |
| FR-005 | Provide a UI affordance to scrub/set the override | ✅ | `FakeClockOverlay.tsx`, admin scrubber UI (#149) |
| FR-006 | Log override activation/deactivation outside production | ✅ | `console.log` gated on `__DEV__ \|\| EXPO_PUBLIC_APP_ENV !== 'production'` |

---

## Data Model

No persisted data model — `FakeClockContextValue` is client-side, in-memory React state only:

```typescript
interface FakeClockContextValue {
  now: number;            // real or fake, ms epoch
  fakeTime: number | null; // active override, or null
  setFakeTime: (ts: number | null) => void;
  isFakeClock: boolean;
}
```

---

## Non-Goals / Known Gaps

- **No backend propagation confirmed**: this spec documents the mobile-side context only. If a backend `X-Fake-Time` header integration was intended (as referenced in earlier planning discussions), it was **not found in the codebase** during this drift audit — treat server-side time as unaffected by this tool.
- **No production gate found in code beyond the env-check on logging**: the override function itself (`setFakeTime`) is not role-gated at the context level. Any role/production restriction is enforced by whichever screen exposes the scrubber UI (verify `AdminFakeClock`/settings screen access before relying on this for production safety).

---

## File Structure

```
mobile/src/
├── contexts/
│   └── FakeClockContext.tsx   # Provider + useFakeClock() hook
└── components/
    └── FakeClockOverlay.tsx   # Scrubber/indicator UI
```

---

## Related Specifications

- [BFF-6 Events & Schedule Browser](../BFF-6-events-schedule/spec.md) — the schedule live-time behaviors this tool is built to test
