# Environment Setup Guide

## Overview

Two environments only: **development** and **production**. No staging.

| Environment | Firebase Project | API | Used for |
|---|---|---|---|
| `development` | `bigfamfestival-dev` | localhost:8080 | Local dev, simulator |
| `production` | `bigfamfestival` | Cloud Run (prod) | TestFlight, Play Store |

TestFlight + Google Play closed testing = pre-release validation of production builds.

---

## Backend Setup

### Local development
1. Copy the example:
   ```
   cp backend/.env.development.example backend/.env
   ```
2. Fill in `GOOGLE_APPLICATION_CREDENTIALS` with the path to your **dev** service account key
3. Run: `cd backend && npm run start:dev`

### Production
The production `.env` is managed via Cloud Run environment variables — never committed.

---

## Mobile App Setup

Environment is controlled by the `APP_ENV` variable at build time (read by `app.config.js`).

### Local development (simulator)
```bash
APP_ENV=development npx expo start
```
Firebase will use the dev project config (from `GoogleService-Info.dev.plist` / `google-services-dev.json`).

### Local development (physical device)
```bash
APP_ENV=development EXPO_PUBLIC_API_URL=http://192.168.x.x:8080/api/v1 npx expo start
```
Replace `192.168.x.x` with your machine's LAN IP.

### EAS Builds
- `eas build --profile development` → dev Firebase, dev bundle ID
- `eas build --profile production` → prod Firebase, prod bundle ID

---

## Creating the Dev Firebase Project

> ✅ Dev Firebase project already exists: `bigfam-test-ok6ox7`
> Robert approved on 2026-04-14. Service account key generated.

**Dev project details:**
- Project ID: `bigfam-test-ok6ox7`
- Auth domain: `bigfam-test-ok6ox7.firebaseapp.com`
- Messaging sender ID: `151198250953`
- Service account: `firebase-adminsdk-mjq1q@bigfam-test-ok6ox7.iam.gserviceaccount.com`

**Still needed (one-time, per-machine setup):**
1. Get `google-services.json` for Android dev from Firebase Console → Project Settings → Your apps → Android
2. Get `GoogleService-Info.plist` for iOS dev from Firebase Console → Project Settings → Your apps → iOS
3. Place them at `mobile/google-services-dev.json` and `mobile/GoogleService-Info.dev.plist` (gitignored)
4. `backend/bigfam-dev-serviceaccount.json` — generated via `gcloud iam service-accounts keys create`

---

## Files NOT committed (in .gitignore)

```
backend/.env
backend/.env.development
backend/.env.production
backend/*-serviceaccount.json
mobile/GoogleService-Info.dev.plist
mobile/google-services-dev.json
mobile/google-services.json        # already gitignored
mobile/GoogleService-Info.plist    # already gitignored
```

Example files (`*.example`) **are** committed for onboarding reference.
