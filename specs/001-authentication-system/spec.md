# Authentication & Authorization System - Retroactive Specification

**Feature ID**: 001  
**Status**: ✅ Implemented (Retroactive Documentation)  
**Created**: 2026-01-14  
**Source Analysis**: `backend/src/auth/`, `mobile/src/contexts/AuthContext.tsx`, `mobile/src/services/authService.ts`

---

## Overview

JWT-based authentication system with role-based access control (RBAC) supporting 7 user roles. Implemented with NestJS Passport strategies on backend and secure token storage via expo-secure-store on mobile. Supports user registration, login, guest access, and profile management.

---

## User Stories

### User Story 1 - User Registration (Priority: P0 - Implemented)

**As a** new user,  
**I want to** create an account with email and password,  
**So that** I can access festival features and save my schedule.

**Acceptance Criteria** (Verified in Implementation):
- [x] User can register with email, password, name, and optional phone
- [x] Password is hashed with bcrypt before storage
- [x] JWT token returned immediately upon successful registration
- [x] Default role assigned as `ATTENDEE`

**Implementation Reference**: `backend/src/auth/auth.service.ts:L22-L50`

---

### User Story 2 - User Login (Priority: P0 - Implemented)

**As a** registered user,  
**I want to** log in with my credentials,  
**So that** I can access my personalized festival experience.

**Acceptance Criteria** (Verified in Implementation):
- [x] User can log in with email and password
- [x] Invalid credentials return 401 Unauthorized
- [x] JWT token returned on successful login
- [x] Token stored securely in expo-secure-store

**Implementation Reference**: `backend/src/auth/auth.controller.ts:L36-L44`

---

### User Story 3 - Guest Access (Priority: P1 - Implemented)

**As a** visitor,  
**I want to** browse the app without creating an account,  
**So that** I can explore festival content before committing.

**Acceptance Criteria** (Verified in Implementation):
- [x] Guest user can browse events and schedule
- [x] Guest prompted to log in when accessing protected features
- [x] Clear distinction between guest and authenticated state

**Implementation Reference**: `mobile/src/contexts/AuthContext.tsx:L136-L152`

---

### User Story 4 - Role-Based Access (Priority: P1 - Implemented)

**As an** admin/staff member,  
**I want to** access administrative features based on my role,  
**So that** I can manage festival content appropriately.

**Acceptance Criteria** (Verified in Implementation):
- [x] 7 roles supported: Admin, Staff, Artist, Vendor, Volunteer, Director, Attendee
- [x] Role included in JWT payload
- [x] Guards enforce role-based access on protected endpoints

**Implementation Reference**: `backend/src/auth/enums/role.enum.ts`

---

## Functional Requirements

### Authentication

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Register new user with email/password | ✅ | `auth.controller.ts:L27-L34` |
| FR-002 | Login with email/password validation | ✅ | `auth.service.ts:L54-L72` |
| FR-003 | Generate JWT token on authentication | ✅ | `auth.service.ts:L85-L92` |
| FR-004 | Hash passwords with bcrypt | ✅ | `auth.service.ts:L99-L101` |
| FR-005 | Validate token on protected routes | ✅ | `guards/jwt-auth.guard.ts` |

### Authorization

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-006 | Support 7 user roles | ✅ | `enums/role.enum.ts` |
| FR-007 | Include role in JWT payload | ✅ | `auth.service.ts:L87-L91` |
| FR-008 | Roles guard for endpoint protection | ✅ | `guards/roles.guard.ts` |

### Mobile Client

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-009 | Secure token storage (expo-secure-store) | ✅ | `AuthContext.tsx:L95-L96` |
| FR-010 | Auto-load user on app start | ✅ | `AuthContext.tsx:L62-L82` |
| FR-011 | Guest mode without authentication | ✅ | `AuthContext.tsx:L136-L152` |
| FR-012 | Delete account functionality | ✅ | `AuthContext.tsx:L46-L60` |

---

## Data Model

### User Interface (Backend)

```typescript
// From backend/src/users/interfaces/user.interface.ts
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  profilePictureUrl?: string;
  shareMyCampsite: boolean;
  shareMyLocation: boolean;
  ticketType: string; // "ga", "vip", "rv", "need-ticket"
  expoPushToken?: string;
  notificationsEnabled?: boolean;
  userGroups?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Role Enum

```typescript
// From backend/src/auth/enums/role.enum.ts
enum Role {
  ADMIN = 'admin',
  STAFF = 'staff',
  ARTIST = 'artist',
  VENDOR = 'vendor',
  VOLUNTEER = 'volunteer',
  DIRECTOR = 'director',
  ATTENDEE = 'attendee',
}
```

**Firestore Collection**: `users`

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login user |
| GET | `/auth/profile` | JWT | Get current user profile |

---

## Success Criteria

| ID | Criterion | Measurement | Status |
|----|-----------|-------------|--------|
| SC-001 | Users can register and login | Auth flow completes | ✅ Met |
| SC-002 | Tokens persist across app restarts | SecureStore verification | ✅ Met |
| SC-003 | Protected routes reject unauthenticated requests | 401 response | ✅ Met |
| SC-004 | Role-based access enforced | Guards functional | ✅ Met |

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Duplicate email registration | 409 ConflictException | `auth.service.ts:L26-L29` |
| Invalid credentials | 401 UnauthorizedException | `auth.service.ts:L68-L71` |
| Expired token | Token refresh via interceptor | `mobile/src/services/api.ts` |
| Network offline | Offline detection hook | `mobile/src/hooks/useOffline.ts` |

---

## Integration Points

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| Firestore | User document storage | Persist user data |
| expo-secure-store | Secure token storage | Mobile credential security |
| NestJS Passport | Auth strategies | JWT validation |

---

## Key Files

- `backend/src/auth/auth.module.ts` - Auth module registration
- `backend/src/auth/auth.controller.ts` - HTTP endpoints
- `backend/src/auth/auth.service.ts` - Business logic
- `backend/src/auth/strategies/jwt.strategy.ts` - JWT validation
- `backend/src/auth/strategies/local.strategy.ts` - Login validation
- `mobile/src/contexts/AuthContext.tsx` - Auth state management
- `mobile/src/services/authService.ts` - API calls

---

## Change History

| Date | Version | Change | Reference |
|------|---------|--------|-----------|
| 2025 | 1.0.0 | Initial implementation | Backend + Mobile |
| 2026-01-14 | - | Retroactive specification created | This document |
