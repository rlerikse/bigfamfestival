# Feature Specification: Social Login (Google/Apple SSO)

**Jira**: [BFF-34](https://eriksensolutions.atlassian.net/browse/BFF-34)  
**Feature Branch**: `BFF-34-social-login-sso`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-22 (Auth & User Profile)

---

## Overview

Support Google and Apple SSO for streamlined login, reducing friction for new users.

### Current State
- Email/password authentication only (via Firebase Auth)
- Users must create and remember password

### Target State
- Sign in with Google option
- Sign in with Apple option
- Link existing accounts to social logins
- First-time profile completion flow

---

## Constitution Compliance Checklist

- [ ] **Security**: Social provider tokens validated server-side
- [ ] **Privacy**: Minimal data collected from social providers
- [ ] **Platform Requirements**: Apple Sign-In required for iOS
- [ ] **Testing**: Social login flows tested on iOS and Android

---

## User Scenarios & Testing

### User Story 1 - Sign In with Google (Priority: P1)

As a new user, I want to sign in with my Google account, so that I can quickly access the app.

**Why this priority**: Most popular social login provider.

**Independent Test**: Tap Google sign-in, complete OAuth flow, verify account created.

**Acceptance Criteria** (from Jira):
1. **Given** login screen, **When** user taps Sign in with Google, **Then** Google OAuth flow starts
2. **Given** Google auth complete, **When** returning to app, **Then** user is logged in

---

### User Story 2 - Sign In with Apple (Priority: P1)

As an iOS user, I want to sign in with my Apple ID, so that I can use a familiar login method.

**Why this priority**: Required for iOS app store compliance.

**Acceptance Criteria**:
1. **Given** login screen on iOS, **When** user taps Sign in with Apple, **Then** Apple OAuth flow starts
2. **Given** Apple auth complete, **When** returning to app, **Then** user is logged in

---

### User Story 3 - Link Existing Account (Priority: P2)

As an existing user, I want to link my Google/Apple account to my existing profile, so that I can use social login going forward.

**Acceptance Criteria**:
1. **Given** logged in user, **When** in settings, **Then** can link social account
2. **Given** social account linked, **When** logging in later, **Then** can use either method

---

### User Story 4 - First-Time Profile Completion (Priority: P2)

As a new user via social login, I want to complete my profile with additional info, so that I can use all app features.

**Acceptance Criteria**:
1. **Given** new social login user, **When** first login complete, **Then** profile completion screen shows
2. **Given** profile completed, **When** submitting, **Then** account is fully set up

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST support Sign in with Google
- **FR-002**: System MUST support Sign in with Apple (required for iOS)
- **FR-003**: System MUST allow linking social accounts to existing email accounts
- **FR-004**: System MUST prompt new social users to complete profile
- **FR-005**: System MUST handle account linking conflicts gracefully

### Technical Notes (from Jira)

- Firebase Auth providers (Google, Apple)
- Package: expo-auth-session or @react-native-google-signin/google-signin
- Update AuthContext.tsx

---

## Success Criteria

- **SC-001**: Social login completes within 10 seconds
- **SC-002**: 100% of iOS users see Apple Sign-In option
- **SC-003**: Account linking conflicts handled without data loss
