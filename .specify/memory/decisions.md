# Decisions — Big Fam Festival (repo memory)

### [2026-08-09] Jira space closed — specs are the system of record
The original Atlassian Jira space (`eriksensolutions.atlassian.net`) is **closed**. Every `**Jira**` link in `specs/BFF-*/spec.md` is **broken** and kept for reference only. The spec files themselves are now the last surviving point of reference for all BFF stories. When updating specs, **annotate (add verification banners), never delete** original content.
— discovered during spec status verification pass

### [2026-08-09] Authentication is Firebase Auth (JWT/bcrypt removed)
Backend verifies Firebase ID tokens via `FirebaseAuthGuard` (`admin.auth().verifyIdToken(token, true)`); mobile uses `firebaseAuthService.ts`. Legacy NestJS Passport/JWT + bcrypt is gone (`auth.service.ts`: "Legacy bcrypt/JWT operations have been removed"). BFF-4's spec body still describes the old JWT/bcrypt design (historical). Migration tracked in BFF-50 (~70%; legacy-user import script + `password` field purge unverified).
— discovered during spec status verification pass

### [2026-08-09] Map is Mapbox-only; HERE de-scoped; what3words never built
`@rnmapbox/maps` + `mobile/src/screens/MapScreen.tsx` is the shipped map. BFF-35 proposed a Mapbox/HERE hybrid but **no HERE SDK** was ever added. BFF-32 what3words is a **mock only** (`mapService.getWhat3WordsAddress()` returns random words); no package/API key — treat as de-scoped/obsolete.
— discovered during spec status verification pass

### [2026-08-09] Email provider is SendGrid
`backend/src/config/sendgrid/` + `@sendgrid/mail`, used by `backend/scripts/email-blast.ts`. "Custom SMTP" (BFF-52) effectively means SendGrid-as-provider. Firebase Auth transactional emails are NOT yet routed through custom SMTP; branded templates + SPF/DKIM/DMARC outstanding.
— discovered during spec status verification pass

### [2026-08-09] BFF-128 clarify: genre filter options = full day-independent 2026 lineup
Genre filter defect (Issue #185): `genreOptions` (`ScheduleScreen.tsx:L363`) derives from the separate Firestore `genres` collection + a hardcoded `sampleGenres` fallback, decoupled from the actual lineup. Fix (human-clarified): derive `genreOptions` from ALL loaded `events` (every day's already-`genreService`-enriched artist genres), producing one distinct, day-independent list that is STABLE across pull-to-refresh and day change. Do NOT derive from day-filtered `filteredEvents` (would shrink per day). The genre filter is ALREADY multi-select (`selectedGenres: string[]`, default `['all']`) — no UI change. Filtering behavior + selection persistence stay UNCHANGED ("the filtering works, just the wrong genres"); do NOT touch the filter reducer's day-change reset. Earlier auto-reset-to-All-Genres direction was dropped (spec DR-3) — a stable full-lineup list never makes a selection vanish. `event.genres` array takes precedence over single `event.genre`, mirroring the existing matcher (L574-581).
— discovered during BFF-128 /blue.clarify (pipeline)

### [2026-08-09] Ticketing is disabled — BFF-27/BFF-38 blocked
`TicketsModule` is commented out in `backend/src/app.module.ts`. QR ticket display (BFF-27) and QR scanner gate entry (BFF-38) are unstarted and blocked until ticketing is revived. Vendor dashboard (BFF-31) is a mock admin UI shell only. Medical emergency (BFF-36) is unbuilt (only an "emergency" notification label exists) — safety-critical, needs a fresh spec if revived.
— discovered during spec status verification pass

### [2026-08-09] Archived unbuilt specs to specs/_archive/
Moved BFF-27, BFF-31, BFF-32, BFF-33, BFF-38 (all Not Implemented) into `specs/_archive/` via `git mv`, with an index at `specs/_archive/README.md`. Content preserved as a restart point. BFF-36 (medical) intentionally kept under `specs/` — unbuilt but safety-critical.
— done during spec archival

### [2026-08-09] Constitution audit --update: 5 fixes applied (v1.3.0 → v1.4.0)
Ran `/blue.constitution --audit --update`. Relaxed §XII "No Ticket = No Spec" (Jira space closed — specs are now the system of record, ticketless naming allowed going forward). Refreshed §XIV Required Workflows list (removed `sync-spec-context.yml`, added the 5 real workflows: release-please, android-deploy, ios-deploy, ci-gate, branch-name-check, prune-stale-branches). Removed false `deploy-functions.yml` claim from §XVI (no such workflow exists — Functions deploy manually). Corrected §VII password-length claim (Firebase default is 6 chars, not 8; unenforced). Added a "Known Deviations" section cross-referencing 3 tracked code-vs-rule violations (CORS wildcard default, unbounded Firestore reads, Sentry ErrorBoundary gap) to the hardening audit doc, so the constitution stops silently overclaiming compliance. Confirmed accurate (no drift): multi-tenancy (TenantMiddleware/FESTIVAL_ID do exist), docs/MOBILE_RELEASE_GUIDE.md + RELEASE_CHECKLIST.md exist, no `password` field persisted in Firestore.
— discovered during `/blue.constitution --audit --update`

### [2026-08-09] BFF-124 schedule scroll-sync spec is GitHub-sourced
BFF-124 documents a net-new mobile UI bug fix for vertical-scroll synchronization in `HorizontalScheduleView`. GitHub Issue #187 is the source of truth because Jira is closed; the draft belongs at `specs/BFF-124-horizontal-schedule-vertical-scroll-sync/` on `bugfix/BFF-124-vertical-scroll-sync`. The defect path records horizontal X only, leaving vertical Y uncaptured and unrestored across remounts.
— discovered during `/blue.specify BFF-124`

### [2026-08-09] BFF-124 clarify resolved 3 ambiguities in-place, complexity SIMPLE (score 4)
Ran `/blue.clarify` (attempt 1, autonomous pipeline mode). No human escalation needed. Resolved from direct code evidence rather than interactive questions: (1) new vertical `onScroll` listener uses `scrollEventThrottle={16}`, matching the existing horizontal body `ScrollView` convention at `HorizontalScheduleView.tsx:L467`; (2) FR-006 re-scoped from an implied "make the ruler/Now-indicator vertical-viewport-aware" requirement to a no-regression constraint — both are horizontal-axis-only visuals today (ruler `translateX` bound to `scrollX`; the "Now" line spans the full grid height independent of Y) and the fix must not add new Y-based positioning, only avoid desync/stale-render from the new vertical tracking; (3) confirmed User Story 2 AC3's "existing remount-key discipline" is the real `scrollResetKey` state counter (`HorizontalScheduleView.tsx:L289/L319/L433/L462`) that already forces a clean remount of both body `ScrollView`s via React `key` on genuine content/day changes — vertical restoration reuses this same mechanism. Flagged the exact code line for `/blue.plan`/`/blue.implement`: `L313` currently hardcodes `y: 0` when preserving X across a remount and must instead carry a clamped Y per FR-005.
— discovered during `/blue.clarify BFF-124` (attempt 1)

### [2026-08-09] BFF-128 Schedule genres must derive from the loaded lineup
GitHub Issue #185 is the authoritative source for BFF-128 because Jira is closed. `ScheduleScreen.tsx` currently renders `genreOptions` from a standalone Firestore `genres` collection and a static fallback, while the event filter already matches `event.genres` with an `event.genre` fallback. The BFF-128 draft requires dynamically deriving, deduplicating, and sorting options from current loaded events so every offered genre yields at least one schedule result.
— discovered during `/blue.specify BFF-128`
