# Authentication System - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-4](https://eriksensolutions.atlassian.net/browse/BFF-4)  
**Created**: 2026-02-09  

---

## Overview

The Authentication System provides user registration, login, and session management for the Big Fam Festival app. It uses JWT-based authentication with bcrypt password hashing and integrates with Firebase/Firestore for user persistence.

---

## User Stories

### User Story 1 - User Registration
**As a** festival attendee,  
**I want to** create an account with my email and password,  
**So that** I can access personalized features like my schedule and notifications.

**Acceptance Criteria** (Verified):
- [x] User can register with name, email, password, and optional phone
- [x] Email must be unique (duplicate registration throws ConflictException)
- [x] Password is hashed with bcrypt before storage
- [x] User receives JWT token upon successful registration
- [x] Default role is ATTENDEE

**Implementation**: `backend/src/auth/auth.service.ts:L24-L52`

### User Story 2 - User Login
**As a** registered user,  
**I want to** log in with my credentials,  
**So that** I can access my account and saved data.

**Acceptance Criteria** (Verified):
- [x] User can login with email and password
- [x] Invalid credentials return UnauthorizedException
- [x] Successful login returns JWT token and sanitized user data
- [x] Token is stored securely on mobile device (SecureStore)

**Implementation**: `backend/src/auth/auth.service.ts:L57-L85`

### User Story 3 - Protected Route Access
**As an** authenticated user,  
**I want** my requests to be automatically authenticated,  
**So that** I can access protected endpoints seamlessly.

**Acceptance Criteria** (Verified):
- [x] JWT is validated on protected routes via JwtAuthGuard
- [x] Token contains user ID, email, and role
- [x] Expired/invalid tokens return 401 Unauthorized

**Implementation**: `backend/src/auth/guards/jwt-auth.guard.ts`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Register user with email/password | ✅ | `auth.service.ts:L24-L52` |
| FR-002 | Validate email uniqueness | ✅ | `auth.service.ts:L26-L29` |
| FR-003 | Hash passwords with bcrypt | ✅ | `auth.service.ts:L32` |
| FR-004 | Generate JWT on registration | ✅ | `auth.service.ts:L45` |
| FR-005 | Validate login credentials | ✅ | `auth.service.ts:L57-L73` |
| FR-006 | Generate JWT on login | ✅ | `auth.service.ts:L78-L84` |
| FR-007 | Protect routes with JWT guard | ✅ | `jwt-auth.guard.ts` |
| FR-008 | Role-based access control | ✅ | `roles.guard.ts` |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login user |
| GET | `/auth/profile` | JWT | Get current user profile |

---

## Data Model

### RegisterDto
```typescript
interface RegisterDto {
  name: string;        // Required, non-empty string
  email: string;       // Required, valid email format
  password: string;    // Required, min 8 characters
  phone?: string;      // Optional, phone format validation
}
```

### LoginDto
```typescript
interface LoginDto {
  email: string;       // Required, valid email format
  password: string;    // Required, min 8 characters
}
```

### JWT Payload
```typescript
interface JwtPayload {
  sub: string;         // User ID
  email: string;       // User email
  role: Role;          // User role (ATTENDEE, STAFF, ADMIN)
}
```

### User (stored in Firestore)
```typescript
interface User {
  id: string;
  email: string;
  password: string;    // bcrypt hashed
  name: string;
  phone?: string;
  role: Role;
  shareMyCampsite: boolean;
  shareMyLocation: boolean;
  ticketType: string;
  expoPushToken?: string;
  notificationsEnabled?: boolean;
}
```

---

## Security Considerations

| Concern | Mitigation | Location |
|---------|------------|----------|
| Password storage | bcrypt hashing with salt | `auth.service.ts:L32` |
| Token security | JWT with expiration | `auth.module.ts` |
| Mobile token storage | Expo SecureStore | `AuthContext.tsx:L68` |
| Password in response | Sanitized before return | `auth.service.ts:sanitizeUser()` |

---

## Mobile Integration

### AuthContext
The mobile app uses React Context for authentication state management:
- Persists token in SecureStore
- Auto-loads user on app start
- Provides login, register, logout, guest login functions
- Schedules push notifications on login

**Implementation**: `mobile/src/contexts/AuthContext.tsx`

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Duplicate email registration | ConflictException (409) | `auth.service.ts:L28` |
| Invalid credentials | UnauthorizedException (401) | `auth.service.ts:L64,L70` |
| Expired JWT token | 401 with token refresh attempt | `apiClient.ts:L72-L95` |
| Network error on login | User-friendly error message | `AuthContext.tsx:L107-L110` |

---

## File Structure

```
backend/src/auth/
├── auth.controller.ts      # HTTP endpoints
├── auth.module.ts          # Module definition
├── auth.service.ts         # Business logic
├── decorators/
│   ├── public.decorator.ts # Mark routes as public
│   └── roles.decorator.ts  # Role-based access
├── dto/
│   ├── login.dto.ts        # Login validation
│   └── register.dto.ts     # Registration validation
├── enums/
│   └── role.enum.ts        # User roles
├── guards/
│   ├── jwt-auth.guard.ts   # JWT validation
│   ├── local-auth.guard.ts # Local strategy guard
│   └── roles.guard.ts      # Role checking
└── strategies/
    ├── jwt.strategy.ts     # JWT passport strategy
    └── local.strategy.ts   # Local passport strategy

mobile/src/
├── contexts/AuthContext.tsx    # Auth state management
├── screens/auth/
│   ├── LoginScreen.tsx         # Login UI
│   └── RegisterScreen.tsx      # Registration UI
└── services/authService.ts     # API calls
```

---

## Dependencies

### Backend
- `@nestjs/jwt` - JWT token generation
- `@nestjs/passport` - Authentication strategies
- `bcrypt` - Password hashing
- `passport-jwt` - JWT strategy
- `passport-local` - Local strategy

### Mobile
- `expo-secure-store` - Secure token storage
- `axios` - HTTP client

---

## Related Specifications

- [BFF-5 User Management](../BFF-5-user-management/spec.md) - User profile operations
- [BFF-8 Push Notifications](../BFF-8-push-notifications/spec.md) - Notification scheduling on login
