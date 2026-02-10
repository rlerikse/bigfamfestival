# Tasks: BFF-50 Firebase Auth Migration

**Input**: Design documents from `/specs/BFF-50-firebase-auth-migration/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/auth.yaml ✓

**Jira**: [BFF-50](https://eriksensolutions.atlassian.net/browse/BFF-50)
**Branch**: `BFF-50-firebase-auth-migration`
**Estimated Total**: 11 days (see time estimates below)

---

## Multi-PR Strategy & Task Dependencies

**Recommended Approach**: **Hybrid** - Stack within phases, sequential between phases

**Dependency Notation**:
- `[D:T###]` - Depends on Task ###
- `[P]` - Parallelizable (no dependencies on incomplete tasks)
- `[B:T###]` - Blocks Task ### (must complete first)
- `[US#]` - Belongs to User Story #

**Size Notation**:
- `[S]` = Small (< 15 min)
- `[M]` = Medium (15-45 min)
- `[L]` = Large (45-90 min)
- `[XL]` = Extra Large (> 90 min)

---

## GitHub Copilot Integration

### Required Reading (in order):
1. **Constitution**: `.specify/memory/constitution.md`
2. **Feature Spec**: `specs/BFF-50-firebase-auth-migration/spec.md`
3. **Implementation Plan**: `specs/BFF-50-firebase-auth-migration/plan.md`
4. **This Task List**: `specs/BFF-50-firebase-auth-migration/tasks.md`
5. **API Contract**: `specs/BFF-50-firebase-auth-migration/contracts/auth.yaml`
6. **Data Model**: `specs/BFF-50-firebase-auth-migration/data-model.md`

### Code Pattern References:
- Guard pattern: `backend/src/auth/guards/jwt-auth.guard.ts`
- Service pattern: `backend/src/auth/auth.service.ts`
- Context pattern: `mobile/src/contexts/AuthContext.tsx`

---

## User Story Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Setup                                              │
│   └── T001-T004 (parallelizable)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Backend Dual-Token (US4) - FOUNDATIONAL           │
│   └── T005-T012 (must complete before US1)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│ Phase 3: Migration  │    │ Phase 4: Mobile Firebase (US2)  │
│ Script (US1)        │    │   └── T019-T031                 │
│   └── T013-T018     │    │   └── Can start after T012      │
└─────────┬───────────┘    └────────────────┬────────────────┘
          │                                 │
          └────────────┬────────────────────┘
                       ▼
          ┌─────────────────────────────────┐
          │ Phase 5: Password Reset (US3)   │
          │   └── T032-T035                 │
          │   └── Requires users migrated   │
          └────────────────┬────────────────┘
                           ▼
          ┌─────────────────────────────────┐
          │ Phase 6: Legacy Removal         │
          │   └── T036-T044 (polish)        │
          └─────────────────────────────────┘
```

---

## Phase 0: Documentation & Constitution Compliance

- [x] T001 [S] Verify OpenAPI contract exists at `specs/BFF-50-firebase-auth-migration/contracts/auth.yaml`
- [x] T002 [S] Review constitution Section VII (JWT Auth) - note amendment needed

---

## Phase 1: Setup (Project Dependencies)

**Purpose**: Install dependencies and configure Firebase Admin SDK

**Dependencies**: None (all parallelizable)

- [x] T003 [P] [S] Add `@react-native-firebase/app` and `@react-native-firebase/auth` to `mobile/package.json`
  - Branch: `feat/BFF-50-1_mobile-firebase-deps`
  - Base: `BFF-50-firebase-auth-migration`

- [x] T004 [P] [M] Verify Firebase Admin SDK initialization in backend
  - Check `backend/src/config/firebase.config.ts` exists
  - Ensure `getAuth()` from firebase-admin is available
  - Branch: `feat/BFF-50-2_verify-admin-sdk`
  - Base: `BFF-50-firebase-auth-migration`

---

## Phase 2: Backend Dual-Token Support - US4: Backend Token Validation (P1) 🎯 MVP

**Goal**: Backend can validate both Firebase ID tokens and legacy JWT tokens during transition

**Independent Test**: Call protected endpoint with Firebase ID token → 200; call with invalid token → 401

**Dependencies**: Requires Phase 1 complete

**Blocks**: All subsequent phases

### Story Goal
Backend services must validate Firebase ID tokens on protected endpoints while maintaining backward compatibility with existing JWT tokens during migration.

### Independent Test Criteria
- [ ] Valid Firebase ID token → 200 + user data
- [ ] Expired Firebase token → 401 with clear error
- [ ] Valid legacy JWT → 200 (transition period)
- [ ] Invalid token (neither) → 401

### Implementation Tasks

#### Guards

- [x] T005 [P] [US4] [M] Create `FirebaseAuthGuard` in `backend/src/auth/guards/firebase-auth.guard.ts`
  - Use `getAuth().verifyIdToken(token)` from firebase-admin
  - Extract uid, email from decoded token
  - Get role from custom claims
  - Add Pino logging (no PII)
  - Branch: `feat/BFF-50-3_firebase-guard`
  - Copilot time: 30-45 min

- [x] T006 [P] [US4] [L] Create `HybridAuthGuard` in `backend/src/auth/guards/hybrid-auth.guard.ts`
  - Try Firebase token verification first
  - Fall back to legacy JWT if Firebase fails
  - Log which method succeeded
  - Add clear error messages for debugging
  - Branch: `feat/BFF-50-4_hybrid-guard`
  - Copilot time: 45-60 min

- [x] T007 [D:T005] [US4] [S] Export new guards from `backend/src/auth/guards/index.ts`
  - Create index file if not exists
  - Export FirebaseAuthGuard, HybridAuthGuard
  - Branch: `feat/BFF-50-5_guard-exports`

#### Auth Module Updates

- [x] T008 [D:T005,T006] [US4] [M] Update `backend/src/auth/auth.module.ts` to register new guards
  - Import FirebaseAuthGuard, HybridAuthGuard
  - Add to providers array
  - Ensure Firebase Admin is properly injected
  - Branch: `feat/BFF-50-6_auth-module`
  - Copilot time: 20-30 min

- [x] T009 [D:T008] [US4] [M] Replace `JwtAuthGuard` with `HybridAuthGuard` on protected routes
  - Update `backend/src/users/users.controller.ts`
  - Update `backend/src/schedule/schedule.controller.ts`  
  - Update `backend/src/events/events.controller.ts`
  - Update `backend/src/notifications/notifications.controller.ts`
  - Update any other controllers with `@UseGuards(JwtAuthGuard)`
  - Branch: `feat/BFF-50-7_replace-guards`
  - Copilot time: 30-45 min

#### Verification Endpoint

- [x] T010 [D:T005] [US4] [S] Add `/auth/verify` endpoint per `contracts/auth.yaml`
  - Returns decoded token info (uid, email, role)
  - Use `@UseGuards(FirebaseAuthGuard)` 
  - Add to `backend/src/auth/auth.controller.ts`
  - Branch: `feat/BFF-50-8_verify-endpoint`
  - Copilot time: 15-20 min

#### Testing

- [x] T011 [D:T005] [US4] [M] Unit tests for FirebaseAuthGuard in `backend/src/auth/guards/firebase-auth.guard.spec.ts`
  - Test valid token
  - Test expired token
  - Test malformed token
  - Test missing token
  - Mock firebase-admin getAuth()
  - Branch: `feat/BFF-50-9_guard-tests`
  - Copilot time: 30-45 min

- [x] T012 [D:T006] [US4] [M] Unit tests for HybridAuthGuard in `backend/src/auth/guards/hybrid-auth.guard.spec.ts`
  - Test Firebase token accepted
  - Test legacy JWT accepted (fallback)
  - Test both invalid → 401
  - Branch: `feat/BFF-50-10_hybrid-tests`
  - Copilot time: 30-45 min

**Checkpoint**: Backend now accepts Firebase ID tokens. Proceed to migration script.

---

## Phase 3: User Migration Script - US1: Existing User Login (P1) 🎯 MVP

**Goal**: Import all 150 existing users with bcrypt hashes to Firebase Auth, preserving UIDs

**Independent Test**: Import test user with bcrypt hash → verify login with original password works

**Dependencies**: Requires Phase 2 complete (backend accepts Firebase tokens)

### Story Goal
Existing Big Fam users with passwords can log in after migration without resetting their password.

### Independent Test Criteria
- [ ] 150 users imported to Firebase Auth
- [ ] User UIDs match Firestore document IDs
- [ ] User can login with original password
- [ ] Custom claims (role) applied correctly

### Implementation Tasks

#### Migration Script

- [ ] T013 [D:T008] [US1] [L] Create migration script `backend/scripts/migrate-to-firebase.ts`
  - Query all users from Firestore with password field
  - Build importUsers() payload with BCRYPT algorithm
  - Handle batch limits (max 1000 per call)
  - Add dry-run flag
  - Add limit flag for testing
  - Add progress logging
  - Branch: `feat/BFF-50-11_migration-script`
  - Copilot time: 60-90 min

- [ ] T014 [D:T013] [US1] [M] Add custom claims application to migration script
  - After user import, iterate and call setCustomUserClaims()
  - Set `{ role: user.role }` from Firestore
  - Add error handling for individual failures
  - Branch: `feat/BFF-50-12_custom-claims`
  - Copilot time: 30-45 min

- [ ] T015 [D:T013] [US1] [S] Add npm script `migrate:firebase` to `backend/package.json`
  - `"migrate:firebase": "ts-node scripts/migrate-to-firebase.ts"`
  - Add `"migrate:firebase:dry": "ts-node scripts/migrate-to-firebase.ts --dry-run"`
  - Branch: `feat/BFF-50-13_npm-scripts`

#### Testing Migration

- [ ] T016 [D:T014] [US1] [M] Test migration with 5-user subset
  - Run `npm run migrate:firebase -- --limit=5`
  - Verify users appear in Firebase Console
  - Test login with Firebase SDK
  - Document results
  - Branch: `feat/BFF-50-14_test-migration`
  - Copilot time: 30-45 min

- [ ] T017 [D:T016] [US1] [L] Run full migration (150 users)
  - Run `npm run migrate:firebase`
  - Verify all 150 users in Firebase Console
  - Verify custom claims applied
  - Branch: `feat/BFF-50-15_full-migration`
  - Copilot time: 45-60 min

- [ ] T018 [D:T017] [US1] [M] Verify login for 3 test accounts
  - Pick 3 users (different roles: attendee, staff, admin)
  - Login via Firebase SDK with original passwords
  - Verify backend accepts their tokens
  - Document test results
  - Branch: `feat/BFF-50-16_verify-login`
  - Copilot time: 30-45 min

**Checkpoint**: All existing users migrated and can login. Proceed to mobile integration.

---

## Phase 4: Mobile Firebase Integration - US2: Token Refresh & US5: New Registration (P1)

**Goal**: Mobile app uses Firebase Auth SDK for login, registration, and automatic token refresh

**Independent Test**: 
- US2: Let app remain open for 1 hour, verify API calls still work
- US5: Register new user, verify appears in Firebase Console

**Dependencies**: Can start after T012, runs in parallel with Phase 3

### Story Goals
- **US2**: Mobile sessions persist without manual re-login (automatic token refresh)
- **US5**: New users can create accounts with email and password

### Independent Test Criteria
- [ ] User can login via Firebase SDK
- [ ] User can register via Firebase SDK
- [ ] Token refreshes automatically (no 401s after 1 hour)
- [ ] onAuthStateChanged fires correctly
- [ ] SignOut clears session

### Implementation Tasks

#### Firebase Configuration

- [ ] T019 [P] [US2] [M] Install react-native-firebase packages in `mobile/`
  - Run `cd mobile && npm install @react-native-firebase/app @react-native-firebase/auth`
  - Verify native config files exist: `google-services.json`, `GoogleService-Info.plist`
  - Branch: `feat/BFF-50-17_install-firebase`
  - Copilot time: 20-30 min

- [ ] T020 [D:T019] [US2] [M] Configure iOS Firebase in `mobile/ios/`
  - Verify `GoogleService-Info.plist` in correct location
  - Update `Podfile` if needed
  - Run `cd ios && pod install`
  - Branch: `feat/BFF-50-18_ios-firebase`
  - Copilot time: 30-45 min

- [ ] T021 [D:T019] [US2] [M] Configure Android Firebase in `mobile/android/`
  - Verify `google-services.json` in `android/app/`
  - Verify `build.gradle` has google-services plugin
  - Branch: `feat/BFF-50-19_android-firebase`
  - Copilot time: 30-45 min

#### Auth Service Refactor

- [ ] T022 [D:T019] [US2] [L] Create `firebaseAuthService.ts` in `mobile/src/services/`
  - `signIn(email, password)` → Firebase signInWithEmailAndPassword
  - `signUp(email, password, name)` → Firebase createUserWithEmailAndPassword
  - `signOut()` → Firebase signOut
  - `getCurrentUser()` → Firebase currentUser
  - `getIdToken()` → Get ID token for API calls
  - `onAuthStateChanged(callback)` → Subscribe to auth state
  - Handle Firebase error codes with user-friendly messages
  - Branch: `feat/BFF-50-20_firebase-auth-service`
  - Copilot time: 60-90 min

- [ ] T023 [D:T022] [US2] [S] Add TypeScript types for Firebase service in `mobile/src/types/auth.ts`
  - FirebaseAuthUser type
  - AuthError type
  - Branch: `feat/BFF-50-21_auth-types`

#### AuthContext Refactor

- [ ] T024 [D:T022] [US2] [XL] Refactor `AuthContext.tsx` in `mobile/src/contexts/`
  - Replace JWT token storage with Firebase onAuthStateChanged
  - Remove SecureStore token operations
  - Update login() to use firebaseAuthService.signIn()
  - Update register() to use firebaseAuthService.signUp()
  - Update logout() to use firebaseAuthService.signOut()
  - Add getIdToken() for API Authorization header
  - Update isAuthenticated logic
  - Branch: `feat/BFF-50-22_auth-context`
  - Copilot time: 90-120 min

- [ ] T025 [D:T024] [US2] [M] Update API client to use Firebase ID token
  - Modify `mobile/src/services/api.ts` or axios instance
  - Get token from Firebase: `auth().currentUser?.getIdToken()`
  - Remove custom token refresh interceptor
  - Branch: `feat/BFF-50-23_api-client`
  - Copilot time: 30-45 min

#### Screen Updates

- [ ] T026 [D:T024] [US2] [M] Update `LoginScreen.tsx` in `mobile/src/screens/`
  - Use auth context login() (which now uses Firebase)
  - Handle Firebase-specific errors
  - Update error messaging
  - Branch: `feat/BFF-50-24_login-screen`
  - Copilot time: 30-45 min

- [ ] T027 [D:T024] [US5] [M] Update `RegisterScreen.tsx` in `mobile/src/screens/`
  - Use auth context register() (which now uses Firebase)
  - Handle Firebase-specific errors (email-already-in-use, weak-password)
  - Update error messaging
  - Branch: `feat/BFF-50-25_register-screen`
  - Copilot time: 30-45 min

#### Testing

- [ ] T028 [D:T025] [US2] [M] Test login flow end-to-end
  - Login with migrated user
  - Verify token sent to backend
  - Verify protected API calls succeed
  - Branch: `feat/BFF-50-26_test-login`
  - Copilot time: 30-45 min

- [ ] T029 [D:T027] [US5] [M] Test registration flow end-to-end
  - Register new user
  - Verify user appears in Firebase Console
  - Verify user can access protected endpoints
  - Branch: `feat/BFF-50-27_test-register`
  - Copilot time: 30-45 min

- [ ] T030 [D:T028] [US2] [M] Test token refresh
  - Login and wait for token to approach expiry
  - Make API call
  - Verify no 401 (token auto-refreshed)
  - Branch: `feat/BFF-50-28_test-refresh`
  - Copilot time: 30-45 min

- [ ] T031 [D:T024] [US2] [S] Remove deprecated `authService.ts` if exists
  - Delete or rename old auth service
  - Update any remaining imports
  - Branch: `feat/BFF-50-29_cleanup-old-service`

**Checkpoint**: Mobile app uses Firebase Auth. Proceed to password reset.

---

## Phase 5: Password Reset - US3: Password Reset (P2)

**Goal**: Users can request password reset via Firebase's built-in email flow

**Independent Test**: Request reset for test user → verify email arrives → use link → login with new password

**Dependencies**: Requires Phase 3 complete (users migrated)

### Story Goal
Users who forgot their password can request a reset email and set a new password.

### Independent Test Criteria
- [ ] User can request password reset from app
- [ ] Firebase sends reset email (within 30 seconds)
- [ ] Reset link works and allows new password
- [ ] User can login with new password

### Implementation Tasks

- [ ] T032 [D:T022] [US3] [M] Add `sendPasswordResetEmail()` to `firebaseAuthService.ts`
  - Use Firebase `sendPasswordResetEmail(email)`
  - Handle errors (user-not-found, invalid-email)
  - Branch: `feat/BFF-50-30_reset-service`
  - Copilot time: 20-30 min

- [ ] T033 [D:T032] [US3] [M] Add forgot password UI to `LoginScreen.tsx`
  - Add "Forgot password?" link
  - Show email input modal/form
  - Call sendPasswordResetEmail()
  - Show success message
  - Branch: `feat/BFF-50-31_forgot-password-ui`
  - Copilot time: 30-45 min

- [ ] T034 [D:T033] [US3] [M] Test password reset flow
  - Request reset for test user
  - Verify email received
  - Use Firebase reset link
  - Set new password
  - Login with new password
  - Branch: `feat/BFF-50-32_test-reset`
  - Copilot time: 30-45 min

- [ ] T035 [D:T034] [US3] [S] Update AuthContext to expose reset function
  - Add `resetPassword(email)` to AuthContext value
  - Branch: `feat/BFF-50-33_context-reset`

**Checkpoint**: Password reset working. Proceed to cleanup.

---

## Phase 6: Polish & Legacy Removal

**Goal**: Remove legacy JWT auth, clean up password fields, update constitution

**Dependencies**: All user stories complete

### Implementation Tasks

#### Backend Cleanup

- [ ] T036 [D:T018,T030] [L] Remove `JwtStrategy` from `backend/src/auth/strategies/`
  - Delete `jwt.strategy.ts`
  - Update auth.module.ts providers
  - Branch: `feat/BFF-50-34_remove-jwt-strategy`
  - Copilot time: 30-45 min

- [ ] T037 [D:T036] [M] Replace `HybridAuthGuard` with `FirebaseAuthGuard` everywhere
  - Update all controller guards
  - Remove HybridAuthGuard
  - Branch: `feat/BFF-50-35_firebase-only`
  - Copilot time: 30-45 min

- [ ] T038 [D:T037] [M] Remove password-related code from `auth.service.ts`
  - Remove hashPassword()
  - Remove comparePasswords()
  - Remove bcrypt import
  - Update register() to create Firebase user
  - Mark login/register as deprecated (or remove)
  - Branch: `feat/BFF-50-36_clean-auth-service`
  - Copilot time: 30-45 min

#### Data Model Cleanup

- [ ] T039 [D:T017] [M] Remove `password` field from `user.interface.ts`
  - Update `backend/src/users/interfaces/user.interface.ts`
  - Update any DTOs that reference password
  - Branch: `feat/BFF-50-37_remove-password-field`
  - Copilot time: 20-30 min

- [ ] T040 [D:T039] [L] Create script to remove password fields from Firestore
  - Query all users
  - Use Firestore FieldValue.delete() for password field
  - Add confirmation prompt
  - Branch: `feat/BFF-50-38_clean-firestore`
  - Copilot time: 45-60 min

#### Mobile Cleanup

- [ ] T041 [D:T031] [S] Remove SecureStore auth token code from `mobile/src/`
  - Remove token storage/retrieval
  - Remove token refresh interceptors
  - Branch: `feat/BFF-50-39_remove-securestore`

- [ ] T042 [D:T041] [S] Clean up unused imports across mobile
  - Remove expo-secure-store if no longer needed
  - Run lint to find unused imports
  - Branch: `feat/BFF-50-40_mobile-cleanup`

#### Documentation & Constitution

- [ ] T043 [D:T037] [M] Update constitution Section VII (Auth)
  - Change "Passport.js + JWT" to "Firebase Authentication"
  - Update auth patterns documentation
  - File: `.specify/memory/constitution.md`
  - Branch: `feat/BFF-50-41_update-constitution`
  - Copilot time: 20-30 min

- [ ] T044 [D:T043] [S] Update `docs/SETUP_GUIDE.md` with Firebase Auth instructions
  - Document Firebase project setup
  - Document service account requirements
  - Branch: `feat/BFF-50-42_update-docs`

---

## Dependency Graph Summary

```
Setup:    T001─T004 (parallel) ────────────────────────────────────────────┐
                                                                            │
Backend:  T005─T006 (parallel) ──► T007 ──► T008 ──► T009 ──► T010─T012 ◄──┘
          (guards)                 (exports) (module) (routes) (tests)
                                                                    │
Migration: T013 ──► T014 ──► T015 ──► T016 ──► T017 ──► T018 ◄─────┘
           (script) (claims) (npm)   (test5)  (full)   (verify)
                                                             │
Mobile:   T019 ──► T020 ──► T022 ──► T024 ──► T025 ──► T026─T027 ──► T028─T031 ◄──┘
          (deps)   (ios)   (service)(context)(api)   (screens)   (tests)
                   T021                                           │
                   (android)                                      │
Reset:    T032 ──► T033 ──► T034 ──► T035 ◄──────────────────────┘
          (service)(ui)    (test)   (context)
                                         │
Polish:   T036 ──► T037 ──► T038 ──► T039 ──► T040 ◄─────────────┘
          (jwt)   (guards) (service)(interface)(firestore)
          
          T041 ──► T042 ◄─ (mobile cleanup)
          
          T043 ──► T044 ◄─ (docs)
```

---

## Time Estimates

| Size | Count | Time Each | Subtotal |
|------|-------|-----------|----------|
| Small [S] | 12 | ~10 min | ~2 hours |
| Medium [M] | 22 | ~35 min | ~13 hours |
| Large [L] | 7 | ~60 min | ~7 hours |
| XL [XL] | 1 | ~105 min | ~2 hours |

**Total Estimate**: ~24 hours of focused work ≈ **11 days** (accounting for testing, debugging, code review)

---

## MVP Scope

**Minimum Viable Migration** (US1 + US4 only):
- Phase 1: Setup (T001-T004)
- Phase 2: Backend Dual-Token (T005-T012)
- Phase 3: Migration Script (T013-T018)

This delivers: Existing users can login via Firebase Auth with original passwords.

**Remaining for Full Feature**:
- Phase 4: Mobile Integration (T019-T031)
- Phase 5: Password Reset (T032-T035)
- Phase 6: Polish (T036-T044)

---

## Next Steps

1. Create GitHub issues for PR tracking
2. Start with Phase 1 & 2 tasks (parallel)
3. Run `/speckit.analyze` before first PR
4. Run `/speckit.implement` by phase
