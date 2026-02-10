# Quickstart: Firebase Auth Migration Development

**Feature**: BFF-50  
**Last Updated**: 2026-02-10

---

## Prerequisites

- Node.js 20.x
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project: `bigfamfestival`
- Service account JSON (for backend)

---

## 1. Backend Setup

### Install Dependencies

```bash
cd backend
npm install  # Uses .npmrc for registry override
```

### Environment Variables

Add to `.env.development`:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=bigfamfestival
GOOGLE_APPLICATION_CREDENTIALS=./bigfamfestival-firebase-adminsdk-*.json

# Legacy JWT (for dual-token transition)
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=1h
```

### Service Account

Ensure service account JSON is in `backend/`:
```
backend/bigfamfestival-firebase-adminsdk-fbsvc-*.json
```

**Note**: This file is gitignored. Copy from Google Cloud Console if missing.

### Start Backend

```bash
npm run start:dev
```

Backend runs on `http://localhost:3000`

---

## 2. Mobile Setup

### Install Dependencies

```bash
cd mobile
npm install
```

### Install react-native-firebase

```bash
# After firebase auth migration is implemented
npm install @react-native-firebase/app @react-native-firebase/auth
```

### Firebase Config Files

Ensure these files exist in `mobile/`:
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

### iOS Setup

```bash
cd ios
pod install
cd ..
```

### Start Mobile

```bash
# iOS
npm run ios

# Android
npm run android
```

---

## 3. Testing Firebase Auth

### Test Token Verification

```bash
# Get a Firebase ID token from mobile app or Firebase Auth emulator
TOKEN="eyJhbGciOiJSUzI1NiIs..."

# Test profile endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/auth/profile
```

### Test Legacy JWT (During Transition)

```bash
# Legacy JWT still works during dual-token period
JWT="eyJhbGciOiJIUzI1NiIs..."

curl -H "Authorization: Bearer $JWT" \
  http://localhost:3000/auth/profile
```

---

## 4. Firebase Emulator (Optional)

For local development without production Firebase:

### Start Emulator

```bash
firebase emulators:start --only auth
```

Emulator UI: `http://localhost:4000`

### Connect Backend to Emulator

Add to `.env.development`:

```env
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

### Connect Mobile to Emulator

```typescript
// mobile/src/config/firebase.ts
import auth from '@react-native-firebase/auth';

if (__DEV__) {
  auth().useEmulator('http://localhost:9099');
}
```

---

## 5. Migration Script Testing

### Run Migration (Dry Run)

```bash
cd backend
npx ts-node scripts/migrate-to-firebase.ts --dry-run
```

### Run Migration (5-User Subset)

```bash
npx ts-node scripts/migrate-to-firebase.ts --limit=5
```

### Run Full Migration

```bash
npx ts-node scripts/migrate-to-firebase.ts
```

---

## 6. Verify Migration

### Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select `bigfamfestival` project
3. Navigate to Authentication > Users
4. Verify user count matches Firestore (151 users)

### Test User Login

```bash
# After migration, existing user should be able to login
# with their original password via Firebase SDK
```

---

## 7. Troubleshooting

### Token Verification Fails

```
Error: Firebase ID token has expired
```

**Solution**: Get fresh token from Firebase SDK. Tokens expire after 1 hour.

### Service Account Error

```
Error: Could not load the default credentials
```

**Solution**: Set `GOOGLE_APPLICATION_CREDENTIALS` to absolute path of service account JSON.

### Hash Import Fails

```
Error: The password hash algorithm is invalid
```

**Solution**: Ensure bcrypt hashes include the full string (e.g., `$2b$10$...`).

### Emulator Connection Refused

```
Error: Could not reach Firebase Auth emulator
```

**Solution**: Ensure emulator is running with `firebase emulators:start --only auth`.

---

## 8. Development Workflow

### Feature Branch

```bash
git checkout BFF-50-firebase-auth-migration
```

### After Code Changes

```bash
# Backend
cd backend && npm test

# Mobile
cd mobile && npm test
```

### Before PR

```bash
# Run /speckit.analyze to validate constitution compliance
# Ensure all tests pass
# Update spec status in Jira
```

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Start backend | `cd backend && npm run start:dev` |
| Start mobile (iOS) | `cd mobile && npm run ios` |
| Start mobile (Android) | `cd mobile && npm run android` |
| Start Firebase emulator | `firebase emulators:start --only auth` |
| Run migration (dry run) | `cd backend && npx ts-node scripts/migrate-to-firebase.ts --dry-run` |
| Run backend tests | `cd backend && npm test` |
| Run mobile tests | `cd mobile && npm test` |
