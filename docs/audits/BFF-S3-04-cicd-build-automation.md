# BFF-S3-04: CI/CD Build Automation

**Date:** 2026-04-14  
**Author:** Koda  
**Branch:** BFF-S3-04-cicd-build-automation → dev

---

## Summary

Automated build and deploy pipeline for the Big Fam mobile app. Push to `dev` triggers a full CI run; on pass, an Android AAB is built via EAS and submitted to the Google Play closed testing (internal) track automatically.

---

## What Changed

### `.github/workflows/mobile-ci.yml` (updated)
- Added `dev` branch to trigger branches (push + PR)
- Build profile now determined by branch:
  - `main` → `production` profile
  - `dev` → `beta` profile (new — targets Play Store internal track)
  - `develop`/other → `preview` profile
- iOS build commented out (uncomment when Apple certs are configured)

### `.github/workflows/android-deploy.yml` (new)
- Triggers via `workflow_run` after `Mobile CI` completes on `dev`
- Only runs on success (no deploys from broken builds)
- Writes `GOOGLE_PLAY_SA_KEY` secret to disk, runs `eas submit --profile beta --latest`, cleans up key
- Target track: `internal` (Google Play closed testing)

### `.github/workflows/backend-ci.yml` (updated)
- Added `dev` branch to trigger branches

### `mobile/eas.json` (updated)
- Added `beta` build profile: `app-bundle`, `autoIncrement: true`, `APP_ENV=production`
- Added `beta` submit profile: `track: internal`, uses `google-play-service-account.json`

---

## Required Secrets (set in GitHub repo → Settings → Secrets)

| Secret | Owner | Notes |
|---|---|---|
| `EXPO_TOKEN` | Atlas/Robert | EAS access token from expo.dev |
| `GOOGLE_PLAY_SA_KEY` | Atlas (BFF-S3-02) | Play service account JSON, base64-encoded |

**How to base64-encode the SA key:**
```bash
base64 -i google-play-service-account.json | pbcopy
```
Then paste into GitHub secret `GOOGLE_PLAY_SA_KEY`.

**Required Play Console permissions for the SA:**
- Release manager on `com.eriksensolutions.bigfam`
- View app information and download bulk reports

---

## Flow Diagram

```
push to dev
    ↓
mobile-ci.yml — lint + typecheck + test
    ↓ (pass)
mobile-ci.yml — eas build --profile beta (Android AAB)
    ↓ (success)
android-deploy.yml — eas submit --profile beta --latest → Play internal track
    ↓
Beta testers notified by Google Play
```

---

## Dependencies

- **BFF-S3-02** (Atlas) — Google Play service account key must be created and stored as `GOOGLE_PLAY_SA_KEY` secret before the deploy workflow can run. Build workflow runs independently.
- **BFF-S3-01** (Atlas) — Closed testing track must be configured in Play Console before first submission lands.
- **EXPO_TOKEN** — Must be set as a GitHub secret before any EAS build runs.

---

## Production Isolation

All Sprint 3 work targets `dev` branch. No production deployments are triggered by this workflow. Production releases require a manual promotion in Play Console from internal → production track.
