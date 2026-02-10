# Feature Specification: Firebase Auth Migration

**Jira**: [BFF-50](https://eriksensolutions.atlassian.net/browse/BFF-50)  
**Feature Branch**: `BFF-50-firebase-auth-migration`  
**Created**: 2026-02-10  
**Status**: Draft  

---

## Overview

Migrate the Big Fam Festival app from custom NestJS JWT-based authentication to Firebase Authentication. This aligns with the Detroit Dub Collective (DDC) architecture pattern, reduces maintenance burden, and provides built-in features like password reset and automatic token refresh.

### Current State
- **Backend**: Custom auth (bcrypt + JWT) with NestJS Passport strategies
- **Mobile**: React Context + SecureStore + axios interceptors for token refresh
- **Users**: 151 total, 150 with bcrypt password hashes
- **Code burden**: ~500+ lines across auth service, guards, strategies, interceptors

### Target State
- **Auth Provider**: Firebase Authentication (managed by Google)
- **Backend**: Firebase Admin SDK for ID token verification
- **Mobile**: Firebase Auth SDK via react-native-firebase
- **Code reduction**: ~70% less auth code to maintain

---

## Constitution Compliance Checklist

- [ ] **Security**: Firebase Auth handles credential storage, token management
- [ ] **Observability**: Authentication events logged via Firebase
- [ ] **Testing**: Migration script tested with subset before full import
- [ ] **Documentation**: Migration runbook and rollback procedure documented

---

## User Scenarios & Testing

### User Story 1 - Existing User Login (Priority: P1)

As an existing Big Fam user with a password, I want to log in after the migration without resetting my password, so that my experience is seamless.

**Why this priority**: Core functionality - if existing users can't log in, migration fails.

**Independent Test**: Import test user with bcrypt hash, verify login with original password works.

**Acceptance Criteria** (from Jira):
1. **Given** existing users with bcrypt passwords, **When** imported to Firebase Auth, **Then** users can log in with existing credentials
2. **Given** a migrated user attempts login, **When** they enter correct password, **Then** they are authenticated and receive a valid session

---

### User Story 2 - Automatic Token Refresh (Priority: P1)

As a mobile app user, I want my session to persist without manual re-login, so that I have uninterrupted access to the app.

**Why this priority**: Firebase Auth SDK handles this automatically - key benefit of migration.

**Independent Test**: Let app remain open for 1 hour, verify API calls still work without 401s.

**Acceptance Criteria**:
1. **Given** a mobile app user, **When** they log in, **Then** Firebase handles token refresh automatically
2. **Given** an expired access token, **When** the SDK detects it, **Then** it refreshes silently without user action

---

### User Story 3 - Password Reset (Priority: P2)

As a user who forgot my password, I want to request a password reset email, so that I can regain access to my account.

**Why this priority**: Built-in Firebase feature - enables support-free recovery.

**Independent Test**: Request reset for test user, verify email arrives, use link to set new password, login with new password.

**Acceptance Criteria**:
1. **Given** a user who forgot password, **When** they request reset, **Then** Firebase sends reset email
2. **Given** a reset email link, **When** user sets new password, **Then** they can login with new credentials

---

### User Story 4 - Backend Token Validation (Priority: P1)

As a backend service, I want to validate Firebase ID tokens on protected endpoints, so that only authenticated users access sensitive data.

**Why this priority**: Backend must trust Firebase tokens - core security requirement.

**Independent Test**: Call protected endpoint with valid Firebase token (should succeed) and invalid token (should return 401).

**Acceptance Criteria**:
1. **Given** an API request with Firebase ID token, **When** backend validates, **Then** user is authenticated properly
2. **Given** migration is complete, **When** old JWT tokens are used, **Then** they are rejected gracefully (401 with clear error)

---

### User Story 5 - New User Registration (Priority: P2)

As a new user, I want to create an account with email and password, so that I can access the app features.

**Why this priority**: Must work for new users after migration.

**Independent Test**: Register new user, verify user appears in Firebase Console, verify login works.

**Acceptance Criteria**:
1. **Given** a new visitor, **When** they register with email/password, **Then** Firebase creates the account
2. **Given** successful registration, **When** user logs in, **Then** they have access to protected features

---

### Edge Cases

- What happens when user with duplicate email exists in Firestore but not Firebase Auth?
  - Migration script should handle: import all users, flag duplicates for manual review
- How does the app handle users mid-session during deployment?
  - Rolling deployment: new code validates both JWT and Firebase tokens during transition
- What if bcrypt hash format is incompatible?
  - Firebase supports standard bcrypt, but verification pass should confirm before production

---

## Requirements

### Functional Requirements

- **FR-001**: Migration script MUST import all 150 users with bcrypt hashes to Firebase Auth preserving UIDs
- **FR-002**: Mobile app MUST replace custom AuthContext with Firebase Auth SDK integration
- **FR-003**: Backend MUST replace JwtAuthGuard with Firebase token verification
- **FR-004**: System MUST support password reset via Firebase's built-in flow
- **FR-005**: API client MUST remove custom token refresh interceptors (Firebase SDK handles this)
- **FR-006**: System MUST reject old JWT tokens with appropriate error messages post-migration
- **FR-007**: Firestore user documents MUST remove password field after successful migration
- **FR-008**: Backend MUST maintain backward compatibility during rolling deployment (accept both token types temporarily)

### Key Entities

- **Firebase User**: UID (same as Firestore doc ID), email, passwordHash (managed by Firebase)
- **Firestore User Document**: id, email, name, phone, role, ticketType, shareMyCampsite, shareMyLocation, expoPushToken (password field removed)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of existing 150 users can log in with their current passwords after migration
- **SC-002**: Zero password reset emails are required as part of migration
- **SC-003**: Backend auth code reduced by at least 60% (from ~500 lines to <200)
- **SC-004**: Token refresh happens automatically with no user-visible session expirations
- **SC-005**: Password reset flow works end-to-end (email sent within 30 seconds, link valid, password updateable)
- **SC-006**: Migration completes with zero downtime (rolling deployment)

---

## Out of Scope

- Social login providers (Google, Apple) - future enhancement
- Email verification enforcement - can be added later
- Multi-factor authentication (MFA)
- OTA updates during migration window
- User profile updates (name change, avatar) - existing flows remain unchanged

---

## Assumptions

1. Firebase Auth bcrypt import supports our hash format ($2b$ prefix)
2. User UIDs in Firestore can be preserved as Firebase UIDs
3. Mobile app can be updated before backend changes (ship new app version first)
4. Rolling deployment is acceptable (brief window where both auth methods work)
5. DDC implementation patterns are directly applicable

---

## Dependencies

- Firebase project: `bigfamfestival` (already configured)
- Firebase Admin SDK (already installed for Firestore)
- react-native-firebase package for mobile
- Service account with Firebase Auth admin permissions

---

## Related Specifications

- [BFF-4 Authentication](../BFF-4-authentication/spec.md) - Current auth implementation (to be replaced)
- [DDC-1 Authentication](https://github.com/rlerikse/es-spec-kit-context) - Reference implementation pattern

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-10 | Spec-Kit | Initial specification |
