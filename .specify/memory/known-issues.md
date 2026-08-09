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
