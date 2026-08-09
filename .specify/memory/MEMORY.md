# Repo Memory — Big Fam Festival

Entrypoint index for repo-scoped memory. See topic files for detail.

## Decisions
- Auth is **Firebase Auth** (JWT/bcrypt removed) — see `decisions.md`.
- Map shipped **Mapbox only** (HERE never integrated); what3words never built — see `decisions.md`.
- Email provider is **SendGrid** — see `decisions.md`.
- Original **Jira space is closed**; `specs/BFF-*` are the system of record — see `decisions.md`.
- BFF-124 is a forward-looking mobile schedule bug spec sourced from GitHub Issue #187 — see `decisions.md`.
- BFF-128 derives Schedule genre options from the loaded lineup rather than the global genre catalog or a static fallback — see `decisions.md`.
- BFF-127 is a GitHub-sourced Schedule list performance bug; profile visible-row mount and per-tick card updates on device, with pure utility tests for time-state logic — see `decisions.md`.
- BFF-127 clarify (attempt 1) auto-resolved 3 FlatList/clock-decoupling technical decisions with 0 human escalations — see `decisions.md`.
- BFF-127 clarify confirmation pass (attempt 2) returned CLEAN — no remaining ambiguities after DR-1/DR-2/DR-3 — see `decisions.md`.
- BFF-127 implement (code phases + static verification) is HARDENED — pure `getEventDisplayState` helper, optional `EventCard.displayState` prop, FlatList tuning, tsc/lint/jest all clean; T006-T009 manual profiling pending — see `decisions.md`.
- BFF-127 pre-PR report is staged at the canonical feature path; source/static readiness is verified, while SC-002/SC-003 remain pending representative-device profiling — see `decisions.md`.

## Known Issues
- Firestore `users`/`notifications` rules world-open; `@Public()` debug endpoints; `POST /artists` missing admin guard — see `known-issues.md` (+ `docs/audits/2026-08-09-deep-analysis-hardening-optimization.md`).
- BFF-124: importing an `@expo/vector-icons`/`expo-image`-using component in Jest fails even without `render()` — extract pure logic into `scheduleUtils.ts`-style side-effect-free modules instead — see `known-issues.md`.

## BFF-124 Implementation (2026-08-09) — HARDENED, commit 4536bfd
T001-T006 done (clampVerticalOffset in scheduleUtils.ts, {x,y} scroll contract, ScheduleScreen Y-ref, scrollResetKey-based Y restore). tsc/lint/jest clean; verify PASS after 1 self-heal round. T007 (manual iOS/Android) remains open in tasks.md.

## Spec Status (verified 2026-08-09)
- Full report: `docs/2026-08-09-spec-status-report.md`. 15 implemented, BFF-50 ~70%, BFF-29/39/52 partial, BFF-27/31/32/33/36/38 not implemented.

## Routine: run `/postmerge` after EVERY merge into `dev` (auto-run)
After any merge into `dev`, run the closeout routine defined in `.github/prompts/postmerge.prompt.md` (invocable as `/postmerge`). The agent should run this automatically as the Definition of Done for a dev merge, without being asked. Steps: (1) validate & harden (mobile tsc/lint/jest, backend if touched); (2) update human patch notes in `mobile/release-notes/NEXT.md`; (3) preview next semver (do NOT edit manifests — release-please owns version bumps + CHANGELOG.md); (4) update `ADR.md`/`README.md`/`docs/*` as needed; (5) version-consistency drift check across the 3 manifests + `.release-please-manifest.json` + release-notes (flag, don't auto-fix); (6) save memory insights (dual-write); (7) signed commit + push to `dev` (respect branch protection — prefer a quick docs PR or owner-bypass direct push for docs-only closeout). Never manually bump `mobile/package.json`/`backend/package.json`/`mobile/app.json`/`.release-please-manifest.json`/`CHANGELOG.md` versions.

