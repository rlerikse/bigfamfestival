# Architecture Decision Records (ADR)

**Project**: 🎪 Big Fam Festival
**Repository**: `rlerikse/bigfamfestival`
**Coverage**: 2026-07-14 → 2026-07-31
**Last Updated**: 2026-08-09

This document is the index and running log of architecture decisions for the Big Fam Festival platform (NestJS backend, React Native/Expo mobile, React admin, Terraform/GCP infra). Each entry captures the **context**, the **decision**, and the **consequences** so future contributors understand *why* the system is built the way it is.

Full ADR source files live in [`docs/adr/`](docs/adr/).

---

## Index

| ADR | Title | Date | Status |
|-----|-------|------|--------|
| [ADR-001](#adr-001-performance-optimizations-for-artist-modal) | Performance Optimizations for Artist Modal | 2026-07-14 | ✅ Accepted |
| [ADR-002](#adr-002-realtime-friend-locations-via-server-sent-events) | Realtime Friend Locations via Server-Sent Events | 2026-07-31 | ✅ Accepted |

---

## 2026-07 — Mobile Performance & Realtime

### ADR-001: Performance Optimizations for Artist Modal

**Status**: ✅ Accepted
**Date**: 2026-07-14
**Source**: [`docs/adr/001-performance-optimizations.md`](docs/adr/001-performance-optimizations.md)

**Context**: The artist detail modal had noticeable scroll lag and image flicker on certain artists. Root causes were `LayoutAnimation.configureNext()` conflicting with the ScrollView's native scroll animations, double image loading (event `gs://` URL swapping to the artist HTTPS URL), and `SafeText` calling `React.Children.map` on every render even for plain strings.

**Decision**: Remove `LayoutAnimation` from the artist modal; use the event-level `imageUrl` as the primary image source and only fall back to the artist profile image; add a fast-path in `SafeText` that renders directly when `children` is already a string; use plain `Text` for the bio and "Read More" labels.

**Consequences**: Scroll lag eliminated and image flicker resolved. Minor tradeoff: the bio expand/collapse is no longer animated (acceptable for smoothness).

---

### ADR-002: Realtime Friend Locations via Server-Sent Events

**Status**: ✅ Accepted
**Date**: 2026-07-31
**Source**: [`docs/adr/002-realtime-friend-locations-sse.md`](docs/adr/002-realtime-friend-locations-sse.md)

**Context**: The map needs to show opted-in friends' location changes promptly. The initial implementation polled `GET /friends/locations` every 30 seconds, which delayed updates, issued requests even when nothing changed, and had no durable connection semantics. The backend already owns friend-location permissions and opt-in enforcement, so the client needs an authenticated, resilient transport that preserves that server-side authorization model.

**Decision**: Use an authenticated Server-Sent Events (SSE) stream at `GET /friends/locations/stream` for foreground friend-location updates.

- The client uses `react-native-sse`, which supports the Firebase `Authorization: Bearer <token>` header the backend guard requires (the stock `EventSource` cannot).
- The server pushes the permitted friend-location set on connect and on every change; the client stops the 30-second poll while healthy SSE data arrives (`pollingInterval: 0`).
- The screen owns reconnection: on a stream error it closes the subscription, starts temporary 30-second fallback polling, then reconnects with capped exponential backoff (2s → 60s max).
- Each explicit reconnection re-subscribes through `getIdToken()` to use a current Firebase token rather than replaying a stale one.
- On the first healthy SSE payload, fallback polling stops and the reconnect counter resets. Campsites stay on a separate five-minute refresh (near-static). Cleanup closes the stream and cancels polling/reconnect timers on unmount.

**Consequences**: Friend locations update promptly with far fewer requests, while preserving the backend's opt-in authorization model. The client carries additional reconnection/backoff complexity, and requires the `react-native-sse` dependency for authenticated streaming.

---

## Conventions

- **Where they live**: numbered Markdown files in [`docs/adr/`](docs/adr/) (e.g. `003-my-decision.md`); this `ADR.md` is the human-readable index.
- **Format**: each ADR has `Status`, `Date`, `Context`, `Decision`, and `Consequences` sections.
- **Statuses**: `Proposed` (under discussion) → `✅ Accepted` (in effect) → `Superseded` (replaced by a later ADR, which it should link) → `Deprecated` (no longer applies).
- **Immutability**: accepted ADRs are not rewritten. To change a decision, add a **new** ADR that supersedes the old one and update the old entry's status.
- **Adding one**: create the next-numbered file in `docs/adr/`, then add a row to the Index table and a full entry here.
