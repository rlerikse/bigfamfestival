# Live Wayfinder HUD - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)
**Jira**: none — this feature was never tracked in Jira (built after the Jira space closed)
**GitHub Issue**: #159 (with follow-up reviews #180, #202, #203)
**Created**: 2026-08-09 (retroactively documented via `/blue.drift`)

> **⚠️ Drift note (2026-08-09):** This spec did not exist prior to today. The Live Wayfinder HUD (friend-radar overlay + compass sensor fusion) was shipped 2026-07-27 (commit `8d98e2c`, "Live Wayfinder — friend-radar HUD + hot/cold directional tracking (#159)") with **zero spec coverage** — discovered via a `/blue.drift` audit. `docs/ADR.md` ADR-015 documents the architectural decision; this document is the feature-level spec. Original decision rationale should be treated as authoritative for the "why"; this file documents the "what" for traceability.

---

## Overview

Live Wayfinder is a border-anchored radar HUD overlaid on the festival map (`MapScreen.tsx`) that shows the heading/direction to opted-in friends who are off-screen, plus proximity ("hot"/"cold") feedback, using tilt-compensated compass sensor fusion rather than the raw device-heading API (which drifts and spins unpredictably). It depends on the realtime friend-location stream documented in [ADR-002](../../ADR.md#adr-002-realtime-friend-locations-via-server-sent-events) and the opt-in sharing model in [BFF-37](../BFF-37-campsite-location-sharing/spec.md).

---

## User Stories

### User Story 1 - See Direction to an Off-Screen Friend
**As a** festival attendee with opted-in friends,
**I want to** see a directional indicator toward friends who are off my visible map area,
**So that** I can navigate toward them without constantly panning/zooming the map.

**Acceptance Criteria** (Verified):
- [x] Off-map friends render as edge-anchored radar markers pointing toward their real-world bearing
- [x] On-map friends are suppressed from the radar (no duplicate indicator) — Architect review fix (#193 referenced in commit history)
- [x] Radar markers are quantized to avoid jitter as heading changes — Architect review fix

**Implementation**: `mobile/src/components/WayfinderHUD.tsx`

### User Story 2 - Hot/Cold Proximity Feedback
**As a** festival attendee tracking a friend,
**I want** a sense of whether I'm getting closer or farther from them,
**So that** the radar is actually useful for navigation, not just direction.

**Acceptance Criteria** (Verified):
- [x] Radar/indicator state reflects relative proximity ("hot" close / "cold" far)

**Implementation**: `mobile/src/hooks/useDirectionalTracking.ts`

### User Story 3 - Stable Compass Heading (No Drift/Spin)
**As a** festival attendee walking/turning with the phone in hand,
**I want** the map's heading and radar to stay stable and accurate,
**So that** the HUD doesn't jitter, drift, or spin uncontrollably.

**Acceptance Criteria** (Verified):
- [x] Heading is computed via tilt-compensated fusion of accelerometer + magnetometer + gyroscope (not the raw `Heading` event alone)
- [x] Camera heading updates are throttled with a trailing flush to prevent stutter (Architect review #202)

**Implementation**: `mobile/src/hooks/compassFusion.ts` (unit-tested: `mobile/src/__tests__/compassFusion.test.ts`)

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Render edge-anchored radar indicators for off-screen opted-in friends | ✅ | `WayfinderHUD.tsx` |
| FR-002 | Suppress radar indicator for friends already visible on-map | ✅ | `WayfinderHUD.tsx` |
| FR-003 | Provide hot/cold proximity feedback | ✅ | `useDirectionalTracking.ts` |
| FR-004 | Compute stable heading via accel+mag+gyro sensor fusion | ✅ | `compassFusion.ts` |
| FR-005 | Throttle camera heading updates with trailing flush | ✅ | `compassFusion.ts` / `MapScreen.tsx` |
| FR-006 | Quantize/constrain radar markers to prevent bounce/jitter | ✅ | `WayfinderHUD.tsx` |
| FR-007 | Only track friends who have opted in to location sharing | ✅ | Consumes `getFriendLocations()` (BFF-37 opt-in model) |

---

## Dependencies

| Dependency | Provides | Spec/ADR |
|---|---|---|
| Realtime friend-location SSE stream | Live position updates powering the radar | [ADR-002](../../ADR.md#adr-002-realtime-friend-locations-via-server-sent-events) |
| Friend opt-in location sharing | Authorization for which friends' locations are visible at all | [BFF-37](../BFF-37-campsite-location-sharing/spec.md) |
| Mapbox interactive map | Camera/heading control the HUD overlays on top of | [BFF-35](../BFF-35-mapbox-here-interactive-map/spec.md) |

---

## Edge Cases & Known Refinements

Discovered post-launch via Architect PR review and fixed in follow-up commits:

| Issue | Fix | Reference |
|---|---|---|
| Radar duplicated markers already visible on-map | Suppress on-map friends from radar | PR #180 review |
| Edge markers bounced/jittered as heading changed | Quantize marker positions | PR #159/#203 review |
| Camera heading stuttered on rapid heading change | Trailing-flush throttle | PR #202 review |

---

## File Structure

```
mobile/src/
├── components/
│   ├── WayfinderHUD.tsx              # Radar HUD overlay component
│   └── DirectionalGradientBorder.tsx # Visual hot/cold border treatment
├── hooks/
│   ├── compassFusion.ts              # Tilt-compensated heading fusion
│   └── useDirectionalTracking.ts     # Hot/cold proximity + bearing logic
├── screens/
│   └── MapScreen.tsx                 # Hosts the HUD over the Mapbox view
└── __tests__/
    └── compassFusion.test.ts         # Unit tests for the fusion algorithm
```

---

## Related Specifications

- [ADR-015: Live Wayfinder HUD with Compass Sensor Fusion](../../ADR.md#adr-015-live-wayfinder-hud-with-compass-sensor-fusion) — architectural rationale
- [BFF-37 Campsite Location Sharing with Friends](../BFF-37-campsite-location-sharing/spec.md) — opt-in authorization model
- [BFF-35 Mapbox/HERE SDK Interactive Map](../BFF-35-mapbox-here-interactive-map/spec.md) — underlying map/camera
