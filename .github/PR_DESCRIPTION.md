## Summary

Migrates authentication from custom JWT/Passport.js to Firebase Authentication, plus constitution audit fixes and convention documentation updates.

## Changes

### 🔐 Firebase Auth Migration (BFF-50)

**Backend:**
- Removed `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/jwt`, `bcrypt`
- Added `firebase-admin` for token verification
- Created `FirebaseAuthGuard` replacing `JwtAuthGuard`
- Updated all controllers to use Firebase UID (`req.user.uid`) instead of JWT payload
- Added migration script: `npm run migrate:firebase`
- Added cleanup script: `npm run cleanup:passwords`

**Mobile:**
- Already using `@react-native-firebase/auth` - no changes needed
- Tokens now managed by Firebase SDK (auto-refresh)

### 📜 Constitution Audit (v1.3.0)

- **Node 20**: Updated CI workflows from Node 18 → Node 20
- **Sentry**: Added `@sentry/react-native` to mobile dependencies
- **Tenant Rules**: Updated constitution to allow header/query-based tenant ID
- **Coverage**: Documented 50% coverage threshold in constitution

### 📚 Conventions & Specs

- Updated `.specify/conventions/` for Firebase Auth patterns
- Added 12 new feature specifications with 1:1 Jira mapping
- Linked 14 orphaned Jira stories to parent epics

## Testing

- [x] Backend: `npm test` passes
- [x] Mobile: `npm test` passes
- [x] Firebase Auth login/logout flow verified
- [x] Token refresh working (1hr expiry, auto-refresh)
- [x] Admin role detection from Firebase custom claims

## Migration Notes

**For existing users:**
1. Run `npm run migrate:firebase` to migrate user data
2. Run `npm run cleanup:passwords:execute` to remove legacy passwords from Firestore
3. Users will need to sign in again (Firebase tokens replace JWT)

## Related

- Jira: BFF-50
- Spec: `specs/BFF-50-firebase-auth-migration/`
