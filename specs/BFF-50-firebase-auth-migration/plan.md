# Implementation Plan: Firebase Auth Migration

**Branch**: `BFF-50-firebase-auth-migration` | **Date**: 2026-02-10 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/BFF-50-firebase-auth-migration/spec.md`

---

## Summary

Migrate Big Fam Festival authentication from custom JWT (Passport.js + bcrypt) to Firebase Authentication. This unifies auth patterns with DDC, enables direct client-to-Firebase auth, and preserves all 151 existing user accounts via bcrypt hash import.

---

## Technical Context

| Aspect | Value |
|--------|-------|
| **Primary Dependencies** | NestJS 10.x, firebase-admin 11.x, @react-native-firebase/auth |
| **Storage** | Google Cloud Firestore (users collection) |
| **Testing Framework** | Jest (backend + mobile) |
| **Target Platform** | iOS 15+, Android 8+, Cloud Run |
| **Project Type** | Mobile + API (backend + mobile directories) |

**Performance Goals**: Auth latency <500ms, token verification <100ms

**Constraints**: Zero data loss, zero downtime during migration, maintain backward compatibility

**Scale/Scope**: 151 existing users, ~50 mobile screens affected

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Required Documentation Gates

- [x] API contract (OpenAPI/Swagger spec) exists - see [contracts/auth.yaml](contracts/auth.yaml)
- [x] Sequence diagram for major flows - see [Migration Flow](#migration-flow-sequence)
- [x] Data model definition - see [data-model.md](data-model.md)
- [ ] Database migration scripts - see Implementation Phase 2

### Constitution Compliance Gates

- [x] **Contract Compliance**: OpenAPI contract file authoritative source
- [x] **Security**: Passwords hashed (Firebase handles), tokens verified server-side
- [x] **Observability**: Pino logging for auth events, no PII in logs
- [x] **PII Handling**: Emails logged only with user consent; passwords never logged
- [x] **NestJS Patterns**: Guards, DTOs with validation, proper module organization
- [ ] **Constitution Amendment**: Section VII update required (JWT → Firebase Auth)

> **Note**: Run `/speckit.analyze` before implementation to validate against constitution.

---

## Project Structure

### Documentation (this feature)

```text
specs/BFF-50-firebase-auth-migration/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Technical research decisions
├── data-model.md        # User model changes
├── quickstart.md        # Local dev setup for testing auth
└── contracts/
    └── auth.yaml        # OpenAPI spec for auth endpoints
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts     # MODIFY - deprecate /login, /register
│   │   ├── auth.service.ts        # MODIFY - add Firebase verification
│   │   ├── auth.module.ts         # MODIFY - add Firebase Admin
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts      # KEEP - legacy support phase
│   │   │   ├── firebase-auth.guard.ts # NEW - Firebase token validation
│   │   │   └── hybrid-auth.guard.ts   # NEW - dual-token transition
│   │   └── strategies/
│   │       └── firebase.strategy.ts   # NEW - Firebase strategy
│   └── users/
│       └── interfaces/
│           └── user.interface.ts  # MODIFY - remove password field
└── scripts/
    └── migrate-to-firebase.ts     # NEW - user import script

mobile/
├── src/
│   ├── config/
│   │   └── firebase.ts            # NEW - Firebase app init
│   ├── contexts/
│   │   └── AuthContext.tsx        # MODIFY - use Firebase Auth
│   ├── services/
│   │   ├── authService.ts         # MODIFY - use Firebase SDK
│   │   └── firebaseAuthService.ts # NEW - Firebase auth methods
│   └── screens/
│       ├── LoginScreen.tsx        # MODIFY - Firebase signIn
│       └── RegisterScreen.tsx     # MODIFY - Firebase createUser
└── package.json                   # ADD - @react-native-firebase/auth
```

**Structure Decision**: Follows existing mobile + API pattern. Auth changes isolated to auth/ and contexts/ modules.

---

## Architecture Decisions

### Decision 1: Firebase Auth over Custom JWT

**Context**: Big Fam uses custom JWT auth; DDC uses Firebase Auth. Need consistent cross-project patterns.

**Decision**: Migrate to Firebase Auth with bcrypt hash import.

**Rationale**: 
- Firebase handles password storage, email verification, password reset
- Reduces backend complexity
- Aligns with DDC patterns
- Better security (Firebase manages credentials)

**Alternatives Considered**: 
- Keep custom JWT: Rejected - duplicates effort, inconsistent with DDC
- Auth0/Clerk: Rejected - adds vendor cost, Firebase already in use

### Decision 2: Dual-Token Transition Period

**Context**: Must maintain backward compatibility during rollout.

**Decision**: Backend accepts both legacy JWT and Firebase ID tokens for 2 weeks.

**Rationale**:
- Zero downtime for existing users
- Graceful migration path
- Allows mobile update to propagate

**Alternatives Considered**:
- Big-bang cutover: Rejected - too risky, forces simultaneous update
- Infinite backward compat: Rejected - technical debt accumulation

### Decision 3: react-native-firebase over expo-auth-session

**Context**: Need mobile Firebase Auth SDK.

**Decision**: Use @react-native-firebase/auth native module.

**Rationale**:
- Better performance (native SDK)
- Full Firebase Auth features
- Matches DDC implementation
- Already have Firebase config files

**Alternatives Considered**:
- expo-auth-session: Rejected - generic OAuth, no onAuthStateChanged

---

## Migration Flow Sequence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Dual Token Support                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ User ──> App (Legacy) ──> Backend    : JWT Token                            │
│            │                │         : Validate via JwtStrategy            │
│            │                └─────────: ✓ Access granted                    │
│                                                                             │
│ User ──> App (Updated) ──> Firebase  : Email + Password                     │
│            │                │         : signInWithEmailAndPassword          │
│            │                ◄─────────: Firebase ID Token                   │
│            │                                                                │
│            └──> Backend              : Firebase ID Token                    │
│                    │                 : verifyIdToken()                      │
│                    └─────────────────: ✓ Access granted                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 2: User Migration Script                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Script ──> Firestore                 : Query all users with password hash   │
│         ◄────────────────────────────: 150 users                            │
│         ──> Firebase Auth Admin      : importUsers() with BCRYPT            │
│         ◄────────────────────────────: 150 users imported                   │
│         ──> Firebase Auth Admin      : setCustomUserClaims({ role })        │
│         ◄────────────────────────────: Claims applied                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Legacy Removal                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Backend: Remove JwtStrategy, HybridAuthGuard                                │
│ Backend: Remove password field from User interface                          │
│ Firestore: Remove password field from user documents                        │
│ Constitution: Update Section VII (JWT → Firebase Auth)                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hash import fails for some users | Low | High | Test with 5-user subset first; verify bcrypt round compatibility |
| Mobile update not adopted | Medium | Medium | In-app update prompt; 14-day grace period; legacy support |
| Token verification latency spike | Low | Medium | Firebase Admin SDK caching; monitor p95 latency |
| Role drift between Firestore and claims | Medium | Medium | Single source of truth: custom claims; Firestore as backup |
| Constitution compliance gap | Certain | Low | Planned amendment in implementation |

---

## Dependencies

### External Dependencies

- **firebase-admin 11.x**: Server-side token verification and user import (existing)
- **@react-native-firebase/app 21.x**: Firebase core for React Native
- **@react-native-firebase/auth 21.x**: Firebase Auth SDK for React Native

### Internal Dependencies

- **UsersService**: Will be modified to remove password operations
- **AuthContext**: Will be refactored for Firebase onAuthStateChanged
- **SecureStore**: Will be removed (Firebase SDK handles token storage)

---

## Testing Strategy

### Unit Tests
| Component | Test Cases |
|-----------|------------|
| FirebaseAuthGuard | Valid token, expired token, malformed token, missing token |
| HybridAuthGuard | Firebase token, legacy JWT, invalid both |
| Migration script | Successful import, partial failure, rollback |

### Integration Tests
| Flow | Test Cases |
|------|------------|
| Login | Firebase login, legacy login (during transition), invalid credentials |
| Register | New Firebase user, duplicate email handling |
| Protected route | Access with Firebase token, access with legacy JWT |

### E2E Tests
| Scenario | Validation |
|----------|------------|
| Full login flow | User signs in, receives token, accesses protected data |
| Migration | Run import, verify user can login with existing password |
| Password reset | User requests reset, receives email, updates password |

---

## Rollback Plan

### If Import Fails
1. Firebase Auth users can be bulk deleted via Admin SDK
2. Firestore user documents unchanged (password hashes preserved)
3. Revert backend to JWT-only guards

### If Mobile Crashes
1. Revert mobile to legacy auth service
2. Backend continues accepting JWT tokens
3. Debug Firebase SDK integration

### If Performance Degrades
1. Increase Cloud Run instances
2. Enable Firebase Admin SDK caching
3. Consider fallback to in-process JWT verification

---

## Implementation Phases

### Phase 1: Backend Dual-Token Support (3 days)
- [ ] Create FirebaseAuthGuard with verifyIdToken
- [ ] Create HybridAuthGuard combining Firebase + JWT
- [ ] Update protected routes to use HybridAuthGuard
- [ ] Add Firebase Admin SDK initialization
- [ ] Update constitution Section VII

### Phase 2: User Migration Script (2 days)
- [ ] Create migration script with importUsers()
- [ ] Test with 5-user subset
- [ ] Run full migration (150 users)
- [ ] Apply custom claims for roles

### Phase 3: Mobile Firebase Integration (4 days)
- [ ] Install @react-native-firebase/auth
- [ ] Configure native Firebase (iOS + Android)
- [ ] Refactor AuthContext for onAuthStateChanged
- [ ] Update login/register screens
- [ ] Remove SecureStore token management

### Phase 4: Legacy Removal (2 days)
- [ ] Remove JwtStrategy and legacy guards
- [ ] Remove password field from user interface
- [ ] Clean up Firestore password fields
- [ ] Final testing and validation

**Total Estimate**: 11 days

---

## Next Steps

1. Run `/speckit.tasks` to generate task breakdown
2. Run `/speckit.analyze` to validate against constitution
3. Begin implementation with `/speckit.implement`
