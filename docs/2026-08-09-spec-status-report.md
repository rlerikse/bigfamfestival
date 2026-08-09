# Big Fam Festival — Spec Status Report

**Date:** 2026-08-09
**Author:** Verification pass (read-only analysis against the live `dev` codebase)
**Scope:** All 26 feature specs under `specs/BFF-*`
**Why:** The original specs were authored ~6 months ago and linked to an Atlassian Jira space that has since been **closed**. All `**Jira**` links in the specs are now **broken** and kept for reference only. **These spec files are the last surviving point of reference for every BFF story.** Each spec has been re-verified against the current code and annotated in place (status corrected + a dated verification banner), with original content preserved.

---

## Executive Summary

| Bucket | Count | Specs |
|--------|-------|-------|
| ✅ **Implemented** | **15** | BFF-5, 6, 7, 8, 9, 10, 12, 13, 14, 28, 30, 34, 35, 37 + BFF-4 (via Firebase) |
| 🟢 **Largely implemented** (~70%) | **1** | BFF-50 |
| 🟠 **Partially implemented** | **3** | BFF-29 (~35%), BFF-39 (~65%), BFF-52 (~70%) |
| ❌ **Not implemented** | **6** | BFF-27, 31, 32, 33, 36, 38 |
| 📦 **Archived** (2026-08-09, unbuilt) | **5** | BFF-27, 31, 32, 33, 38 → `specs/_archive/` |

**Biggest finding:** the spec headers were badly out of date. **Seven specs still marked "Draft" are actually fully implemented** (BFF-28, 30, 34, 35, 37) or largely so (BFF-50), because the bulk of that work landed after the specs were written. Conversely, three specs marked "On Hold"/"Draft" are genuinely **unstarted** and are candidates to archive.

**Key content corrections captured in the specs:**
- **BFF-4 (Auth):** feature is implemented, but the whole spec describes the retired **JWT + bcrypt** design. The app now uses **Firebase Auth** (see BFF-50). Spec body flagged as historical.
- **BFF-35 (Map):** shipped as **Mapbox only** — the "Mapbox/HERE hybrid" decision was never followed (no HERE SDK).
- **BFF-32 (what3words):** **never built** — only a mock `getWhat3WordsAddress()` returning random words. Confirmed de-scoped.
- **BFF-52 (email):** **SendGrid** is the shipped provider (blast email works); Firebase Auth custom-SMTP + templates + DNS are not done.

---

## Full Status Table

| Spec | Feature | Old status | **Verified status (2026-08-09)** | Recommendation |
|------|---------|-----------|----------------------------------|----------------|
| BFF-4 | Authentication | ✅ Implemented | ✅ Implemented **via Firebase Auth** — spec text outdated | Update body (or supersede by BFF-50) |
| BFF-5 | User Management | ✅ Implemented | ✅ Implemented | Keep |
| BFF-6 | Events & Schedule | ✅ Implemented | ✅ Implemented | Keep |
| BFF-7 | Personal Schedule | ✅ Implemented | ✅ Implemented | Keep |
| BFF-8 | Push Notifications | ✅ Implemented | ✅ Implemented (delivery hardening tracked in audits) | Keep |
| BFF-9 | Artists Directory | ✅ Implemented | ✅ Implemented | Add admin guard on `POST /artists` |
| BFF-10 | Campsite Location | ✅ Implemented | ✅ Implemented | Keep |
| BFF-11 | Admin Notifications | ✅ Implemented | ✅ Implemented | Gate `@Public()` debug endpoints |
| BFF-12 | App Settings & Theme | ✅ Implemented | ✅ Implemented | Keep |
| BFF-13 | Health Monitoring | ✅ Implemented | ✅ Implemented | Keep |
| BFF-14 | API Client Infra | ✅ Implemented | ✅ Implemented (Firebase token refresh, not manual JWT) | Minor content update |
| BFF-27 | QR Code Ticket Display | On Hold | ❌ Not Implemented (unstarted; `TicketsModule` disabled) | 📦 **Archived** → `specs/_archive/` |
| BFF-28 | POI Markers (Map) | Draft | ✅ **Implemented** (taxonomy widened to 5 types) | Keep (status fixed) |
| BFF-29 | Staff/Volunteer Shifts | Draft | 🟠 ~35% — admin CRUD only | Build check-in/out + attendee view |
| BFF-30 | Friend Request System | Draft | ✅ **Implemented** (100%) | Keep (status fixed) |
| BFF-31 | Vendor Dashboard | Draft | ❌ Not Implemented (mock admin shell only) | 📦 **Archived** → `specs/_archive/` |
| BFF-32 | What3Words Navigation | Draft | ❌ Not Implemented (mock only) — **de-scoped** | 📦 **Archived** → `specs/_archive/` |
| BFF-33 | Schedule Snapshot Sharing | Draft | ❌ Not Implemented | 📦 **Archived** → `specs/_archive/` |
| BFF-34 | Social Login (Google/Apple) | Draft | ✅ **Implemented** | Keep (status fixed) |
| BFF-35 | Mapbox/HERE Map | Draft | ✅ **Implemented — Mapbox only** | Update decision rationale |
| BFF-36 | Medical Emergency Request | Draft | ❌ Not Implemented (category label only) | **Rewrite fresh if revived** (safety-critical) |
| BFF-37 | Campsite Sharing w/ Friends | Draft | ✅ **Implemented** | Keep (status fixed) |
| BFF-38 | QR Scanner Gate Entry | On Hold | ❌ Not Implemented (blocked by BFF-27) | 📦 **Archived** → `specs/_archive/` |
| BFF-39 | Mobile Deployment | 60% | 🟠 ~65% | Finish M.7–M.9 (Play automation, env, beta docs) |
| BFF-50 | Firebase Auth Migration | Draft | 🟢 ~70% — Firebase Auth live | Confirm legacy-user migration + `password` purge |
| BFF-52 | Custom SMTP / Email | Draft | 🟠 ~70% — SendGrid ready | Wire Firebase Auth SMTP + templates + DNS |

---

## Recommended Housekeeping

**Archived candidates** (unstarted; content still useful as a restart point) — ✅ **archived 2026-08-09 to `specs/_archive/`** (see `specs/_archive/README.md`):
- **BFF-27** QR Ticket Display + **BFF-38** QR Scanner Gate — a paired ticketing/entry effort; both blocked by the disabled `TicketsModule`.
- **BFF-31** Vendor Dashboard — only a mock admin page exists.
- **BFF-32** What3Words — never built; the feature you were unsure about is confirmed de-scoped.
- **BFF-33** Schedule Snapshot Sharing — no code at all.

**Keep + finish** (real work remaining):
- **BFF-29** Shifts — add check-in/out (+ optional location verification) and an attendee-facing shift view.
- **BFF-39** Deployment — Play service-account automation, env strategy, beta onboarding docs.
- **BFF-50** Firebase Auth — verify/close the legacy bcrypt-user migration and Firestore `password` field cleanup.
- **BFF-52** Email — decide whether Firebase Auth transactional email needs the custom SMTP route, then add templates + SPF/DKIM/DMARC.

**Safety flag:**
- **BFF-36** Medical Emergency is unbuilt. If an emergency/SOS feature is desired for a live event, treat it as a **high-priority, freshly specced** item — the current spec predates the codebase and only an "emergency" notification label exists.

**Content-fix (implemented but spec drifted):**
- **BFF-4** and **BFF-14** describe the retired JWT/bcrypt + manual token-refresh design; the app is Firebase-native now. Bodies flagged as historical in-place; a future edit could fold them into BFF-50.

---

## Method & Provenance

- Verification was **read-only** against the live `dev` branch; each claim is backed by specific files (e.g., `backend/src/friends/friends.service.ts`, `mobile/src/screens/MapScreen.tsx`, `backend/src/map/map.controller.ts`, `mobile/src/services/firebaseAuthService.ts`, `backend/src/config/sendgrid/`).
- Each `specs/BFF-*/spec.md` now carries an updated `**Status**` line, a `**Verified**: 2026-08-09` marker, and a `> ⚠️ Verification note` banner. **No original content was deleted** — outdated sections are annotated, not removed.
- All `**Jira**` links are **broken** (Atlassian space closed) and retained for reference only. The specs are the system of record going forward.

*Generated 2026-08-09. Companion to `docs/audits/2026-08-09-deep-analysis-hardening-optimization.md`.*
