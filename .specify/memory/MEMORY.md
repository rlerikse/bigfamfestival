# Repo Memory — Big Fam Festival

Entrypoint index for repo-scoped memory. See topic files for detail.

## Decisions
- Auth is **Firebase Auth** (JWT/bcrypt removed) — see `decisions.md`.
- Map shipped **Mapbox only** (HERE never integrated); what3words never built — see `decisions.md`.
- Email provider is **SendGrid** — see `decisions.md`.
- Original **Jira space is closed**; `specs/BFF-*` are the system of record — see `decisions.md`.
- BFF-124 is a forward-looking mobile schedule bug spec sourced from GitHub Issue #187 — see `decisions.md`.

## Known Issues
- Firestore `users`/`notifications` rules world-open; `@Public()` debug endpoints; `POST /artists` missing admin guard — see `known-issues.md` (+ `docs/audits/2026-08-09-deep-analysis-hardening-optimization.md`).
- BFF-124: importing an `@expo/vector-icons`/`expo-image`-using component in Jest fails even without `render()` — extract pure logic into `scheduleUtils.ts`-style side-effect-free modules instead — see `known-issues.md`.

## BFF-124 Implementation (2026-08-09) — HARDENED, commit 4536bfd
T001-T006 done (clampVerticalOffset in scheduleUtils.ts, {x,y} scroll contract, ScheduleScreen Y-ref, scrollResetKey-based Y restore). tsc/lint/jest clean; verify PASS after 1 self-heal round. T007 (manual iOS/Android) remains open in tasks.md.

## Spec Status (verified 2026-08-09)
- Full report: `docs/2026-08-09-spec-status-report.md`. 15 implemented, BFF-50 ~70%, BFF-29/39/52 partial, BFF-27/31/32/33/36/38 not implemented.
