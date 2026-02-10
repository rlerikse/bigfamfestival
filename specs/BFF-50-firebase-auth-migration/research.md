# BFF-50 Research: Firebase Auth Migration

**Last Updated**: 2026-02-10  
**Status**: Approved

---

## Executive Summary

This document captures technical research for migrating Big Fam Festival from custom JWT authentication (Passport.js + bcrypt) to Firebase Authentication. The migration must preserve all 151 existing user accounts while maintaining zero downtime.

---

## 1. Firebase Auth User Import API

### Hash Algorithm Support

Firebase Auth supports importing users with existing password hashes via the Admin SDK's `importUsers()` method.

**Supported Algorithms**:
- BCRYPT ✅ (our current hash format)
- HMAC_SHA256, SCRYPT, PBKDF2, etc.

**Import Format for bcrypt**:
```typescript
import { getAuth } from 'firebase-admin/auth';

const users = [
  {
    uid: 'existing-firestore-doc-id',  // Preserve existing IDs
    email: 'user@example.com',
    passwordHash: Buffer.from('$2b$10$abc123...'),  // bcrypt hash
    displayName: 'User Name',
  },
];

await getAuth().importUsers(users, {
  hash: {
    algorithm: 'BCRYPT',
  },
});
```

**Key Finding**: bcrypt hashes can be imported directly. Users will NOT need to reset passwords.

### Import Limitations
- Max 1000 users per batch (we have 151 - fits in one batch)
- User UIDs must be unique and < 128 chars
- Email must be unique and valid format

### Reference
- [Firebase Admin SDK - Import Users](https://firebase.google.com/docs/auth/admin/import-users)

---

## 2. Mobile SDK Decision

### Option A: react-native-firebase (RECOMMENDED)
**Package**: `@react-native-firebase/app` + `@react-native-firebase/auth`

**Pros**:
- Native SDK integration (better performance)
- Full Firebase Auth feature set
- Active maintenance, matches Expo SDK 54
- Aligns with DDC implementation pattern

**Cons**:
- Requires native config (GoogleService-Info.plist, google-services.json) - already have these
- Larger bundle size

### Option B: expo-auth-session
**Pros**:
- Managed workflow friendly
- Smaller footprint

**Cons**:
- Generic OAuth, not Firebase-specific
- No onAuthStateChanged listener
- Would require custom token exchange

### Decision: **react-native-firebase**
Rationale: Aligns with DDC patterns, provides native performance, already have Firebase project configured.

---

## 3. Backend Token Verification

### Current Pattern (JWT)
```typescript
// jwt.strategy.ts
async validate(payload: JwtPayload) {
  return { userId: payload.sub, email: payload.email, role: payload.role };
}
```

### New Pattern (Firebase ID Token)
```typescript
// firebase-auth.guard.ts
import { getAuth } from 'firebase-admin/auth';

async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const token = extractBearerToken(request.headers.authorization);
  
  const decodedToken = await getAuth().verifyIdToken(token);
  request.user = {
    userId: decodedToken.uid,
    email: decodedToken.email,
    // Role from Firestore user doc or custom claims
  };
  return true;
}
```

### Custom Claims for Roles
Firebase supports custom claims (max 1000 bytes) for role-based access:
```typescript
await getAuth().setCustomUserClaims(uid, { role: 'admin' });
```

Token will include:
```json
{ "role": "admin", ... }
```

---

## 4. Rolling Deployment Strategy

### Phase 1: Dual Token Support (Week 1)
Backend accepts BOTH:
- Legacy JWT tokens (existing users)
- Firebase ID tokens (new auth flow)

```typescript
// hybrid-auth.guard.ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  const token = extractBearerToken(headers.authorization);
  
  // Try Firebase first
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return this.mapFirebaseUser(decoded);
  } catch {
    // Fall back to legacy JWT
    return this.validateLegacyJwt(token);
  }
}
```

### Phase 2: User Migration (Week 1-2)
- Run import script to create Firebase Auth users
- Existing sessions continue working
- Mobile update prompts re-login to get Firebase token

### Phase 3: Legacy Removal (Week 3)
- Remove dual-token support
- Remove password field from Firestore users
- Deprecate `/auth/login` and `/auth/register` (use Firebase SDK directly)

---

## 5. Data Model Changes

### User Document (Before)
```typescript
interface User {
  id: string;
  email: string;
  password: string;  // ❌ REMOVE - bcrypt hash
  name: string;
  role: Role;
  // ... other fields
}
```

### User Document (After)
```typescript
interface User {
  id: string;           // Same as Firebase UID
  email: string;        // Read from Firebase Auth
  name: string;
  role: Role;           // Also in custom claims
  // ... other fields
}
```

**Password Field Removal**: After migration, password field can be deleted from Firestore. Authentication is handled entirely by Firebase Auth.

---

## 6. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hash import fails | Low | High | Test with subset first, verify hash format |
| Token verification inconsistency | Medium | High | Dual-token period, comprehensive logging |
| Mobile update required | Certain | Medium | Force update notification, grace period |
| Role sync drift | Medium | Medium | Single source: custom claims, Firestore as backup |

---

## 7. DDC Pattern Conformance

This migration aligns with DDC-1 authentication patterns:

| Component | DDC Pattern | Big Fam Implementation |
|-----------|-------------|------------------------|
| Identity Provider | Firebase Auth | Firebase Auth ✓ |
| State Management | Zustand | React Context (acceptable) |
| Auth Persistence | onAuthStateChanged | onAuthStateChanged ✓ |
| Token Storage | Firebase SDK handles | Firebase SDK handles ✓ |
| Protected Routes | RequireAuth wrapper | AuthContext + Navigator ✓ |

---

## 8. Constitution Amendment

Section VII of the constitution currently mandates:
> "Auth: Passport.js + JWT"

Post-migration, this should be updated to:
> "Auth: Firebase Authentication (ID tokens verified via Admin SDK)"

This amendment will be proposed as part of the implementation.

---

## Appendix: User Count Verification

```
Total Users: 151
Users with password hash: 150
Users without password: 1 (likely OAuth or incomplete registration)
```

All 150 users with bcrypt hashes can be migrated. The 1 user without password will need to use password reset flow.
