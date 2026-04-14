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

> ⚠️ Requires Robert's approval (billing/infra action)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project: `bigfamfestival-dev`
3. Enable: Firestore, Authentication, Cloud Messaging, Storage
4. Download service account JSON → `backend/bigfam-dev-serviceaccount.json`
5. Download `GoogleService-Info.plist` → `mobile/GoogleService-Info.dev.plist`
6. Download `google-services.json` → `mobile/google-services-dev.json`
7. Update `backend/.env` `GOOGLE_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS`

The `app.config.js` will automatically pick up the dev Firebase files when `APP_ENV=development`.

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
