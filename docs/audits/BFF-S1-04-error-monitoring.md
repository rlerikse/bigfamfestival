# BFF-S1-04: Error Monitoring Setup

## Status
✅ Backend Sentry integration wired — DSN configuration pending  
⚠️ Mobile Sentry already installed but DSN never configured

---

## What was done

### Backend (`/backend`)
- Installed `@sentry/nestjs`, `@sentry/node`, `@sentry/profiling-node`
- Created `src/config/sentry/sentry.config.ts` — initializes Sentry before NestJS app bootstrap
- Wired into `main.ts` (must run before `NestFactory.create`)
- Added `SENTRY_DSN` to `app.module.ts` config schema (optional in dev, logs warning in prod if missing)
- Added `SENTRY_DSN` to `.env.*.example` files

### Mobile (`/mobile`)
- `@sentry/react-native` already installed at `^6.8.0`
- `src/config/sentry.ts` already exists with correct init logic
- Added `EXPO_PUBLIC_SENTRY_DSN` placeholder to `eas.json` production profile env — operator must set the real DSN value before shipping

---

## What's still needed

### 1. Create a Sentry project (one-time, manual)
1. Go to https://sentry.io → create organization `bigfamfestival` if not exists
2. Create two projects: `bigfam-backend` (Node.js) and `bigfam-mobile` (React Native)
3. Copy the DSNs

### 2. Configure backend DSN
Option A — Cloud Run (prod): add `SENTRY_DSN` to Cloud Run env vars or Secret Manager  
Option B — local dev: add to `backend/.env` (optional, not required)

```
gcloud run services update bigfam-api-production \
  --region=us-central1 \
  --project=bigfamfestival \
  --set-env-vars="SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx"
```

### 3. Configure mobile DSN
Add to `eas.json` production profile env:
```json
"production": {
  "env": {
    "EXPO_PUBLIC_SENTRY_DSN": "https://xxx@xxx.ingest.sentry.io/xxx"
  }
}
```

And optionally to `app.config.js` `extra` block so it's available via Constants.

---

## Environment behavior

| Environment | Backend Sentry | Mobile Sentry |
|---|---|---|
| `development` | Disabled (no DSN) | Disabled (`__DEV__` guard in sentry.ts) |
| `production` | Active if `SENTRY_DSN` set | Active if `EXPO_PUBLIC_SENTRY_DSN` set |

---

## Security
- `Authorization` headers are stripped from all Sentry events (both backend and mobile)
- Health check errors are filtered out (backend)
- No PII in error events — Firestore document IDs only, no user data
