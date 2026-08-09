# Known Issues — Big Fam Festival (repo memory)

### [2026-08-09] Firestore rules world-open on users + notifications
`firestore.rules`: `/users/{userId}` has `allow read, write: if true` (PII exposure) and `/notifications` has `allow read: if true`. Default catch-all `if request.auth != null` is over-permissive. Launch-blocking. Full detail in `docs/audits/2026-08-09-deep-analysis-hardening-optimization.md`.
— discovered during hardening analysis

### [2026-08-09] `@Public()` debug endpoints leak info
`backend/src/debug/notifications-debug.controller.ts` exposes token-count / FCM-config / test-send unauthenticated. Should be role-gated or env-flagged.
— discovered during hardening analysis

### [2026-08-09] `POST /artists` missing admin role guard
`backend/src/artists/artists.controller.ts` create endpoint is not gated by `@Roles(Role.ADMIN)` (BFF-9).
— discovered during spec verification

### [2026-08-09] Hardcoded prod Firebase keys committed in mobile
`mobile/app.config.js` hardcodes prod `apiKey`; `google-services.json` + `GoogleService-Info.plist` committed. Rotate + move to EAS secrets. See audit report.
— discovered during hardening analysis

### [2026-08-09] Push delivery unreliable
FCM service account lacks `cloudmessaging.admin`; single-token-per-user overwrite; no mobile caller for `PUT /users/push-token`. See audit report.
— discovered during hardening analysis

### [2026-08-09] Tooling: md-to-pdf for report PDFs
Reports in `docs/` and `docs/audits/` are generated with `npx --yes md-to-pdf <file>.md` (needs network on first run). No pandoc/wkhtmltopdf installed.
— discovered during report generation

### [2026-08-09] /blue.drift found rogue (unspecced) features + stale convention doc
FakeClockContext + Live Wayfinder HUD shipped with zero spec coverage (retroactively documented as BFF-53/BFF-54). BFF-6 was missing festivalDay/overlap-validation/move-resize; BFF-28 was missing the markerAsset custom-icon-upload capability — both extended in-place. `.specify/conventions/architectural-domains.md` was missing 4 backend modules (`friends/`, `map/`, `admin/`, `shifts/`) added since Feb 2026 — refreshed. `.specify/workspace/all-conventions.md` remains an unsynced placeholder (no automated sync exists since the Sync Spec Context workflow was removed) — flagged as informational, not fixed.
— discovered during `/blue.drift` audit

### [2026-08-09] BFF-124 workflow-state drift: plan step never marked completed
`specs/BFF-124-horizontal-schedule-vertical-scroll-sync/.workflow-state.json` has `steps.tasks.status: "completed"` (task_count 7, phase_count 3, correctly matching tasks.md) but `steps.plan.status: "pending"` even though a complete, high-quality `plan.md` exists. `.specify-checkpoint.json` similarly still reads `current_step: "clarify"`. Root cause: whatever generated plan.md/tasks.md for this feature didn't write back `steps.plan.completed_at`/`plan_hash` before advancing to tasks. Risk: a future `/blue.pipeline --resume` or `/blue.implement` gate check reading `steps.plan.status` could misjudge progress. Fix: backfill `steps.plan` (completed_at, plan_hash) and update checkpoint `current_step` to reflect tasks-complete/implement-pending.
— discovered during `/blue.analyze` on BFF-124

### [2026-08-09] Importing an icon-bearing component in Jest fails even without render()
`mobile/src/components/HorizontalScheduleView.tsx` (and any component importing `@expo/vector-icons`/`expo-image`) cannot be imported at all under this repo's `jest.config.js` (`preset: 'react-native'`) — Jest tries to transform a transitively-required `.ttf` font asset and throws `SyntaxError: Invalid or unexpected token`. This is the same underlying Expo SDK 54 incompatibility documented in `SafeText.test.tsx`'s `describe.skip`, but it's triggered by module import/require, not just `@testing-library/react-native`'s `render()`. Confirmed while implementing BFF-124: a test importing only a pure exported helper (`clampVerticalOffset`) from `HorizontalScheduleView.tsx` still failed on import. Fix pattern: move logic intended for unit testing into a side-effect-free module such as `mobile/src/utils/scheduleUtils.ts` (already has zero RN/expo imports and is imported BY the component), and re-export it from the component if a task spec requires the symbol to be "exported from" that file. Applies to any future unit test for a component that imports `@expo/vector-icons` or `expo-image`.
— discovered during BFF-124 implementation
