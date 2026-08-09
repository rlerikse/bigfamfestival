# Architecture Decision Records (ADR)

**Project**: 🎪 Big Fam Festival
**Repository**: `rlerikse/bigfamfestival`
**Coverage**: 2025-03-03 (repo inception) → 2026-07-31
**Last Updated**: 2026-08-09

This document is the index and running log of architecture decisions for the Big Fam Festival platform — a monorepo with a NestJS backend (Cloud Run), a React Native/Expo mobile app, a React + Vite admin panel (Firebase Hosting), Firebase Cloud Functions, and Terraform/GCP infrastructure. Each entry captures the **context**, the **decision**, and the **consequences** so future contributors understand *why* the system is built the way it is.

> **Retroactive reconstruction (2026-08-09):** ADR-001 and ADR-002 were authored as first-class records. ADR-003 through ADR-016 were **reconstructed from git history** to capture foundational and major decisions that predated the ADR practice. ADR **numbers are identifiers assigned during documentation, not chronological order** — sort by the **Date** column for the timeline. Full narrative ADR source files live in [`docs/adr/`](docs/adr/); entries below marked "reconstructed" summarize decisions evidenced by the commits cited.

---

## Index (chronological)

| ADR | Title | Date | Status |
|-----|-------|------|--------|
| [ADR-003](#adr-003-monorepo-layout-with-segregated-deployment-targets) | Monorepo Layout with Segregated Deployment Targets | 2025-03-03 | ✅ Accepted |
| [ADR-004](#adr-004-nestjs--firestore-backend-stack) | NestJS + Firestore Backend Stack | 2025-03-03 | ✅ Accepted |
| [ADR-005](#adr-005-terraform--gcp-cloud-run--containerized-backend) | Terraform + GCP Cloud Run + Containerized Backend | 2025-03-08 | ✅ Accepted |
| [ADR-006](#adr-006-expo-managed-workflow-for-react-native) | Expo Managed Workflow for React Native | 2025-03-21 | ✅ Accepted |
| [ADR-007](#adr-007-firebase-authentication-migration-from-custom-jwtbcrypt) | Firebase Authentication Migration from Custom JWT/bcrypt | 2026-02-10 | ✅ Accepted |
| [ADR-008](#adr-008-admin-panel-as-a-separate-react--vite-spa-on-firebase-hosting) | Admin Panel as a Separate React + Vite SPA on Firebase Hosting | 2026-04-14 | ✅ Accepted |
| [ADR-009](#adr-009-mapbox-rnmapboxmaps-as-the-interactive-map-provider) | Mapbox (@rnmapbox/maps) as the Interactive Map Provider | 2026-07-14 | ✅ Accepted |
| [ADR-010](#adr-010-direct-gcs-image-urls-instead-of-the-firebase-storage-rest-api) | Direct GCS Image URLs Instead of the Firebase Storage REST API | 2026-07-14 | ✅ Accepted |
| [ADR-001](#adr-001-performance-optimizations-for-artist-modal) | Performance Optimizations for Artist Modal | 2026-07-14 | ✅ Accepted |
| [ADR-011](#adr-011-firestore-denormalization--n1-read-mitigation) | Firestore Denormalization & N+1 Read Mitigation | 2026-07-20 | ✅ Accepted |
| [ADR-012](#adr-012-friend-system-with-backend-enforced-opt-in-location-sharing) | Friend System with Backend-Enforced Opt-In Location Sharing | 2026-07-20 | ✅ Accepted |
| [ADR-013](#adr-013-fakeclock-context-for-time-simulation) | FakeClock Context for Time Simulation | 2026-07-20 | ✅ Accepted |
| [ADR-014](#adr-014-schedule-data-model-festival-day--overlap-validation) | Schedule Data Model (Festival-Day + Overlap Validation) | 2026-07-24 | ✅ Accepted |
| [ADR-015](#adr-015-live-wayfinder-hud-with-compass-sensor-fusion) | Live Wayfinder HUD with Compass Sensor Fusion | 2026-07-27 | ✅ Accepted |
| [ADR-016](#adr-016-release-please-for-unified-semantic-versioning) | release-please for Unified Semantic Versioning | 2026-07-29 | ✅ Accepted |
| [ADR-002](#adr-002-realtime-friend-locations-via-server-sent-events) | Realtime Friend Locations via Server-Sent Events | 2026-07-31 | ✅ Accepted |

---

## 2025-03 — Foundation

### ADR-003: Monorepo Layout with Segregated Deployment Targets

**Status**: ✅ Accepted · **Date**: 2025-03-03 · _reconstructed from git history_

**Context**: The product spans four deployment boundaries — a backend API, a mobile app, a web admin panel, and serverless functions — plus infrastructure. Keeping them in one repository allows atomic cross-layer commits, a single changelog/version, and shared context, without standing up multiple repos on day one.

**Decision**: Use a single repository with top-level directories per target: `backend/` (NestJS API), `mobile/` (Expo app), `admin/` (React + Vite panel), `functions/` (Firebase Cloud Functions), and `infrastructure/` (Terraform). Each has its own `package.json`, build, and CI trigger; layers stay loosely coupled (types duplicated where needed rather than a shared package).

**Consequences**: Atomic changes across backend + mobile + admin avoid version skew, and one git history traces cross-layer impact. Trade-offs: some DTO/type duplication between layers and no monorepo build tool (Nx/Turborepo) yet.

**Evidence**: `0c9fd77` "Init commit" (2025-03-03); the `backend/ mobile/ admin/ functions/ infrastructure/` layout persists through the current tree.

---

### ADR-004: NestJS + Firestore Backend Stack

**Status**: ✅ Accepted · **Date**: 2025-03-03 · _reconstructed from git history_

**Context**: The backend needed fast TypeScript-first development, managed scaling, tight Firebase/GCP integration (auth tokens, push, storage), and real-time-friendly data — with minimal ops overhead.

**Decision**: Build the API on **NestJS 10** (TypeScript, modular DI) with **Firestore** as the primary datastore via a `FirestoreService` wrapper over `@google-cloud/firestore`, Firebase Admin SDK for auth/token verification, and Google Cloud Storage for media. No SQL/ORM layer.

**Consequences**: High velocity and strong typing. Firestore's per-read pricing and lack of first-class multi-doc transactions later drove caching and denormalization work (see ADR-011) and surfaced N+1 patterns that needed manual fixes.

**Evidence**: `0c9fd77` "Init commit"; `backend/package.json` (`@nestjs/*` ^10, `@google-cloud/firestore` ^6.5); `backend/src/app.module.ts`.

---

### ADR-005: Terraform + GCP Cloud Run + Containerized Backend

**Status**: ✅ Accepted · **Date**: 2025-03-08 · _reconstructed from git history_

**Context**: The API needed production-grade, auto-scaling compute without Kubernetes operational overhead, plus reproducible, version-controlled infrastructure.

**Decision**: Containerize the backend (multi-stage Docker) and run it on **GCP Cloud Run**, with **Terraform** managing the service, IAM, and networking. Add `@nestjs/throttler` for request rate limiting as part of production hardening.

**Consequences**: Minimal infra management and elastic scaling; cold starts (~2–3s) are acceptable for this workload. Terraform state lives in GCS (outside git). Later hardening reviews flagged public Cloud Run invoker and state-encryption gaps (tracked in `docs/audits/`).

**Evidence**: `1fbd1dc` "Platform and infrastructure setup" (2025-03-08); `035b22d` "Fixed Dockerfile" (2025-03-20); `21cffb9` "multi-stage Docker build and add throttler module for rate limiting" (2025-11-24); `infrastructure/terraform/`.

---

### ADR-006: Expo Managed Workflow for React Native

**Status**: ✅ Accepted · **Date**: 2025-03-21 · _reconstructed from git history_

**Context**: The team needed rapid iOS + Android iteration without hand-managing native toolchains, and cloud builds/submissions for the app stores.

**Decision**: Use the **Expo managed workflow** (currently SDK 54) with **EAS** for cloud builds and store submission. Native modules (Firebase, `@rnmapbox/maps`) are added via Expo config plugins; native modules mean the app runs on an EAS **dev client**, not Expo Go.

**Consequences**: Fast setup and no local native build config for CI/CD. Trade-offs: tied to Expo's SDK cadence, slightly larger runtime, and any custom native code would require prebuild/config-plugin work.

**Evidence**: `1e5d65b` "Added favicon and updated packages to fix Expo errors" (2025-03-21); `mobile/app.json` (Expo SDK 54); `mobile/eas.json`.

---

## 2026-02 — Authentication

### ADR-007: Firebase Authentication Migration from Custom JWT/bcrypt

**Status**: ✅ Accepted · **Date**: 2026-02-10 · _reconstructed from git history_

**Context**: The original auth used custom JWTs with bcrypt password hashes stored in Firestore — carrying password-storage risk, revocation complexity, and no built-in SSO. Firebase Authentication provides managed tokens, revocation, Google/Apple SSO, and first-party SDKs.

**Decision**: Migrate to **Firebase Authentication**. The backend verifies Firebase ID tokens (`admin.auth().verifyIdToken(token, true)` with revocation check) via a `FirebaseAuthGuard`; roles move to **Firebase custom claims**. Legacy Passport/JWT/bcrypt code was removed; mobile uses the Firebase SDK (email/password + Google/Apple SSO). Supersedes the original design documented in ADR-004-era auth.

**Consequences**: Simpler, safer auth with SSO and managed token lifecycle. Post-migration fixes were needed (auto-create profile on UID mismatch, sync roles to claims, backfill pre-migration user docs). A one-time bcrypt-user import path and `password`-field cleanup should be confirmed closed.

**Evidence**: `8045e77` "Merge PR #6 BFF-50-firebase-auth-migration" (2026-02-10); `2ad3364` "Phase 6 complete — Legacy removal and cleanup (BFF-50)"; later `fe289e3`/`fa64ce9` post-migration fixes. Feature spec: `specs/BFF-50-firebase-auth-migration/`.

---

## 2026-04 — Admin Platform

### ADR-008: Admin Panel as a Separate React + Vite SPA on Firebase Hosting

**Status**: ✅ Accepted · **Date**: 2026-04-14 · _reconstructed from git history_

**Context**: Organizers needed a web tool to manage events, artists, stages, schedule, POIs, and notifications — separate from the attendee mobile app, but reusing the same backend and frontend skills.

**Decision**: Build `admin/` as a **React 18 + TypeScript + Vite** SPA (Tailwind, Radix UI), deployed to **Firebase Hosting**. It calls the same NestJS REST API as mobile and is gated by Firebase Auth with an `admin`/`director` role check (UI-side), while the backend independently enforces `@Roles(Role.ADMIN)`.

**Consequences**: Fast HMR development and instant CDN deploys; admin surface stays off the mobile bundle. Trade-off: some duplication of API-call/types logic between admin and mobile. Env dev/prod separation scaffolding landed alongside it.

**Evidence**: `f7ac63a` "BFF-S3-06 — Admin Control Panel backend (#16)" and `1aee6b1` frontend (#17) (2026-04-14); `f6d8979` "dev/prod environment separation scaffolding (BFF-S1-03)"; `6aa7bc9` "add Firebase Hosting for admin panel" (2026-07-14); `admin/vite.config.ts`, `firebase.json`.

---

## 2026-07 — Festival Feature Sprint

### ADR-009: Mapbox (@rnmapbox/maps) as the Interactive Map Provider

**Status**: ✅ Accepted · **Date**: 2026-07-14 · _reconstructed from git history_

**Context**: The festival map needs custom POI markers (stages, food, campsites, front-gate), vector styling, camera control, and real-time friend overlays with compass heading — beyond what stock Google/Apple map components offer. The BFF-35 spec floated a Mapbox/HERE hybrid.

**Decision**: Standardize on **`@rnmapbox/maps`** (Mapbox) as the single map provider, wrapped in a `MapboxProvider`. POIs load from the backend (`GET /map/pois`). **HERE was evaluated but not adopted** — no HERE SDK was ever integrated.

**Consequences**: Rich customization and real-time layers. Requires a Mapbox access token at runtime (public `pk.` token, supplied via `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`) and attribution per ToS. Coordinate/camera math adds complexity that later ADRs (015) build on.

**Evidence**: `6271d56` "integrate @rnmapbox/maps SDK with MapboxProvider" and `f6b004e` "Mapbox SDK integration — BFF-S5-01 (#107)" (2026-07-14); `mobile/src/providers/MapboxProvider.tsx`, `mobile/src/screens/MapScreen.tsx`.

---

### ADR-010: Direct GCS Image URLs Instead of the Firebase Storage REST API

**Status**: ✅ Accepted · **Date**: 2026-07-14 · _reconstructed from git history_

**Context**: Serving event/artist images through the Firebase Storage REST API added a redirect hop and ~100–200ms latency per image, hurting scroll performance in image-heavy lists.

**Decision**: Serve images from **direct `https://storage.googleapis.com/...` (GCS) URLs**, resolving `gs://` paths where needed, with public read on the relevant buckets/prefixes. This pairs with the artist-modal image fixes in ADR-001.

**Consequences**: Lower latency and no redirect overhead. Requires public-read bucket config and CORS. A follow-up was needed to resolve `gs://` images via the Firebase SDK to fix 403s, and to switch `OptimizedImage` from `expo-image` (which cached 403s) to RN `Image`.

**Evidence**: `4c3ed40` "use direct GCS URLs instead of Firebase Storage REST API — eliminates redirect overhead"; `407e3d3` "resolve gs:// images via Firebase SDK (fixes 403)" (2026-07-14); `storage.rules`.

---

### ADR-001: Performance Optimizations for Artist Modal

**Status**: ✅ Accepted · **Date**: 2026-07-14 · **Source**: [`docs/adr/001-performance-optimizations.md`](docs/adr/001-performance-optimizations.md)

**Context**: The artist detail modal had scroll lag and image flicker. Causes: `LayoutAnimation.configureNext()` conflicting with the ScrollView's native scroll animations; double image loading (event `gs://` URL swapping to the artist HTTPS URL); and `SafeText` calling `React.Children.map` on every render even for plain strings.

**Decision**: Remove `LayoutAnimation` from the modal; use the event-level `imageUrl` as the primary source and only fall back to the artist image; add a `SafeText` fast-path for string children; use plain `Text` for bio and "Read More" labels.

**Consequences**: Scroll lag and flicker resolved. Minor tradeoff: bio expand/collapse is no longer animated (acceptable for smoothness).

**Evidence**: `perf(mobile): remove LayoutAnimation…`, `perf(mobile): prefer event imageUrl…`, `perf(mobile): fast-path to SafeText…` → shipped in release v1.2.1 (2026-07-14).

---

### ADR-011: Firestore Denormalization & N+1 Read Mitigation

**Status**: ✅ Accepted · **Date**: 2026-07-20 · _reconstructed from git history_

**Context**: Firestore has no joins and charges per document read, so naive relational access (events → genres, events → artists) produced N+1 read storms that were slow and costly.

**Decision**: **Denormalize read-hot relationships**: cache artists on the event document (`Event.artistsCache`) and wire a genre cache in `populateSingleEventGenres` to collapse N+1 reads into batched/cached lookups.

**Consequences**: Fewer reads and faster event/schedule loads. Trade-off: caches must be kept in sync on writes, and some access paths (friends search, admin list) still scan collections — an ongoing optimization tracked in `docs/audits/`.

**Evidence**: `65fa549` "wire cache in populateSingleEventGenres to prevent N+1 Firestore reads (#130)" (2026-07-20); "inline artist creation, Event.artistsCache, artist-events reverse view".

---

### ADR-012: Friend System with Backend-Enforced Opt-In Location Sharing

**Status**: ✅ Accepted · **Date**: 2026-07-20 · _reconstructed from git history_

**Context**: Attendees need to find each other at a large festival, which requires friend relationships plus sharing of campsite and live location — but location is sensitive and must be strictly opt-in.

**Decision**: Implement a friend-request lifecycle (`friends.service.ts`: send/respond/incoming/outgoing/cancel/remove) and expose friends' campsites/locations **only through the backend**, which checks the `shareMyCampsite` / `shareMyLocation` opt-in flags and the friendship relationship. Authorization is enforced server-side, **not** via Firestore rules (`campsites`/`userLocations` are owner-only at the rules layer).

**Consequences**: A sound privacy model with a single enforcement point. It also sets up the realtime transport (ADR-002) and the Wayfinder UI (ADR-015). The backend becomes the sole authority for friend-visibility logic.

**Evidence**: `18aefab` "BFF-S7 friend request system, user lookup, friend campsites/locations (#133)" (2026-07-20); `backend/src/friends/friends.service.ts`.

---

### ADR-013: FakeClock Context for Time Simulation

**Status**: ✅ Accepted · **Date**: 2026-07-20 · _reconstructed from git history_

**Context**: Schedule state (past/live/upcoming), countdowns, and the now-line are time-dependent, making them hard to test or demo without waiting real hours during a multi-day festival.

**Decision**: Introduce a **`FakeClockContext`** and `useCurrentTime()` hook that all time-dependent UI reads instead of `Date.now()`. An admin-only scrubber UI lets operators advance/rewind simulated time; production/attendee paths use the real clock, gated by role.

**Consequences**: Rapid testing of time-based features. Requires discipline (no direct `Date.now()` in time-aware components) and a role guard so simulated time cannot leak to attendees.

**Evidence**: `a1aff6b` "BFF-S7-149 FakeClockContext — admin fake-clock provider" and `03dfabc` "admin fake-clock scrubber UI for #149" (2026-07-20).

---

### ADR-014: Schedule Data Model (Festival-Day + Overlap Validation)

**Status**: ✅ Accepted · **Date**: 2026-07-24 · _reconstructed from git history_

**Context**: Festival schedules cross midnight (a "festival day" runs past 00:00), stages can't double-book a slot, and admins need to move/resize sets on a grid — none of which a naive calendar-date model handles.

**Decision**: Adopt an explicit **schedule data model** with festival-day logic (day boundaries offset from midnight), server-side **overlap validation** per stage, and a **move/resize API** backing the admin schedule-grid editor (Shambhala-style horizontal view on mobile).

**Consequences**: Correct cross-midnight grouping and conflict-free stage scheduling. Adds backend validation complexity and couples the admin grid UI to the move/resize contract.

**Evidence**: `7e4f149` "schedule data model, festivalDay logic, overlap validation, move/resize API" (2026-07-24); "schedule editor grid layout" (#169/#172); "Shambhala-style horizontal schedule view (#120)".

---

### ADR-015: Live Wayfinder HUD with Compass Sensor Fusion

**Status**: ✅ Accepted · **Date**: 2026-07-27 · _reconstructed from git history_

**Context**: Static friend markers on a large map are disorienting. Users need heading-relative guidance to friends, including those off-screen, with a stable compass that doesn't drift or spin as the phone rotates.

**Decision**: Build a **Live Wayfinder HUD** over the map: self-location centered, opted-in friends' live avatars (fed by the ADR-002 SSE stream), and an **edge-radar** for off-map friends showing compass direction with hot/cold proximity. Heading comes from **tilt-compensated sensor fusion** (accelerometer + magnetometer + gyro), not the raw heading event; camera updates are throttled with a trailing flush.

**Consequences**: Intuitive real-time wayfinding, at the cost of sensor-fusion math and tuning. Multiple refinements followed: suppress radar for on-map friends, quantize edge markers to stop jitter, and throttle-flush the compass camera (Architect reviews #202/#203).

**Evidence**: `8d98e2c` "Live Wayfinder — friend-radar HUD + hot/cold directional tracking (#159)" (2026-07-27); "full accel+mag+gyro heading fusion (#159)"; "trailing-flush for compass camera throttle (#202)".

---

### ADR-016: release-please for Unified Semantic Versioning

**Status**: ✅ Accepted · **Date**: 2026-07-29 · _reconstructed from git history_

**Context**: Four deployment layers previously drifted in versioning, and cutting releases + triggering mobile builds was manual and error-prone.

**Decision**: Adopt **release-please** (`release-please-config.json`) driven by **conventional commits** to bump a single shared version across `package.json`, `mobile/app.json`, and `CHANGELOG.md`, open a standing release PR, and — on release — **trigger the EAS mobile build** from the version tag.

**Consequences**: Automated, consistent semver and changelog with a coordinated mobile build. Requires commit-message discipline and couples all layers to one version number (can't bump backend alone).

**Evidence**: `797e8bd` "adopt release-please unified semver (#117) (#198)" (2026-07-29); `4fe0682` "trigger EAS build on release-please version tags (#113) (#199)"; `release-please-config.json`.

---

## 2026-07 — Realtime

### ADR-002: Realtime Friend Locations via Server-Sent Events

**Status**: ✅ Accepted · **Date**: 2026-07-31 · **Source**: [`docs/adr/002-realtime-friend-locations-sse.md`](docs/adr/002-realtime-friend-locations-sse.md)

**Context**: The map must show opted-in friends' location changes promptly. The initial implementation polled `GET /friends/locations` every 30 seconds, which delayed updates, issued needless requests, and had no durable connection semantics. The backend already owns opt-in enforcement (ADR-012), so the client needs an authenticated, resilient transport that preserves that model.

**Decision**: Use an authenticated **Server-Sent Events** stream at `GET /friends/locations/stream` with `react-native-sse` (supports the Firebase `Authorization: Bearer` header the guard requires). The server pushes the permitted set on connect and on change; the client stops the 30s poll while healthy (`pollingInterval: 0`), owns reconnection with capped exponential backoff (2s → 60s), re-subscribes via a fresh `getIdToken()` each reconnect, and falls back to temporary polling during outages. Campsites stay on a separate 5-minute refresh.

**Consequences**: Prompt updates with far fewer requests, preserving backend authorization. Adds reconnection/backoff complexity and a dependency on `react-native-sse` for authenticated streaming.

**Evidence**: `feat(friends): realtime friend locations via SSE (replace 30s poll)` and `fix(friends): explicit SSE reconnect with fresh token + backoff` (2026-07-31).

---

## Conventions

- **Where they live**: numbered Markdown files in [`docs/adr/`](docs/adr/) (e.g. `003-my-decision.md`); this `ADR.md` is the human-readable index and log. ADR-001 and ADR-002 have full source files; ADR-003–016 are summarized here from git history.
- **Format**: each ADR captures `Status`, `Date`, `Context`, `Decision`, and `Consequences`.
- **Statuses**: `Proposed` (under discussion) → `✅ Accepted` (in effect) → `Superseded` (replaced by a later ADR, which it links) → `Deprecated` (no longer applies).
- **Numbering**: identifiers are assigned in documentation order, not by date. Sort the index by **Date** for the timeline.
- **Immutability**: accepted ADRs are not rewritten. To change a decision, add a **new** ADR that supersedes the old one and update the old entry's status.
- **Adding one**: create the next-numbered file in `docs/adr/`, then add a row to the Index and a full entry here.
