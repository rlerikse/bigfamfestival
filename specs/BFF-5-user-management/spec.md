# User Management - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-5](https://eriksensolutions.atlassian.net/browse/BFF-5)  
**Created**: 2026-02-09  

---

## Overview

User Management provides profile viewing, updating, push token management, and notification preferences. It includes role-based access control for admin/staff operations and integrates with the notification system.

---

## User Stories

### User Story 1 - View Profile
**As a** logged-in user,  
**I want to** view my profile information,  
**So that** I can see my account details.

**Acceptance Criteria** (Verified):
- [x] User can retrieve their profile via GET /users/profile
- [x] Profile includes name, email, phone, role, ticket type
- [x] Password is never returned in profile response

**Implementation**: `backend/src/users/users.controller.ts:L30-L35`

### User Story 2 - Update Profile
**As a** logged-in user,  
**I want to** update my profile information,  
**So that** I can keep my details current.

**Acceptance Criteria** (Verified):
- [x] User can update name, phone, and sharing preferences
- [x] Updates are persisted to Firestore
- [x] Cannot update email or role (security)

**Implementation**: `backend/src/users/users.controller.ts:L37-L42`

### User Story 3 - Push Token Management
**As a** mobile app user,  
**I want** my push notification token to be registered,  
**So that** I can receive festival announcements.

**Acceptance Criteria** (Verified):
- [x] User can update their Expo push token
- [x] Token is stored with user record
- [x] Enables push notification delivery

**Implementation**: `backend/src/users/users.controller.ts:L44-L49`

### User Story 4 - Notification Preferences
**As a** user,  
**I want to** enable or disable push notifications,  
**So that** I can control what alerts I receive.

**Acceptance Criteria** (Verified):
- [x] User can toggle notifications on/off
- [x] Preference is persisted
- [x] Backend respects preference when sending

**Implementation**: `backend/src/users/users.controller.ts:L51-L60`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Get current user profile | ✅ | `users.controller.ts:L30-L35` |
| FR-002 | Update user profile | ✅ | `users.controller.ts:L37-L42` |
| FR-003 | Update push notification token | ✅ | `users.controller.ts:L44-L49` |
| FR-004 | Toggle notification preferences | ✅ | `users.controller.ts:L51-L60` |
| FR-005 | Get user by ID (admin/staff) | ✅ | `users.controller.ts:L62-L78` |
| FR-006 | List all users (admin only) | ✅ | `users.controller.ts:L80-L87` |
| FR-007 | Update any user (admin only) | ✅ | `users.controller.ts:L89-L98` |

---

## API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/users/profile` | JWT | Any | Get current user profile |
| PUT | `/users/profile` | JWT | Any | Update current user profile |
| PUT | `/users/push-token` | JWT | Any | Update push notification token |
| PUT | `/users/notifications` | JWT | Any | Toggle notifications |
| GET | `/users/:id` | JWT | Admin, Staff, Self | Get user by ID |
| GET | `/users` | JWT | Admin | List all users |
| PUT | `/users/:id` | JWT | Admin | Update any user |

---

## Data Model

### User Interface
```typescript
interface User {
  id: string;
  email: string;
  password: string;          // bcrypt hashed, never returned
  name: string;
  phone?: string;
  role: Role;                // ATTENDEE | STAFF | ADMIN
  shareMyCampsite: boolean;
  shareMyLocation: boolean;
  ticketType: string;        // 'need-ticket' | 'general' | 'vip'
  expoPushToken?: string;
  notificationsEnabled?: boolean;
  profilePictureUrl?: string;
}
```

### UpdateUserDto
```typescript
interface UpdateUserDto {
  name?: string;
  phone?: string;
  shareMyCampsite?: boolean;
  shareMyLocation?: boolean;
  ticketType?: string;
  profilePictureUrl?: string;
}
```

### Role Enum
```typescript
enum Role {
  ATTENDEE = 'attendee',
  STAFF = 'staff',
  ADMIN = 'admin',
}
```

---

## Authorization Rules

| Operation | ATTENDEE | STAFF | ADMIN |
|-----------|----------|-------|-------|
| View own profile | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| View other user | ❌ | ✅ | ✅ |
| List all users | ❌ | ❌ | ✅ |
| Update any user | ❌ | ❌ | ✅ |

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| User not found | NotFoundException (404) | `users.service.ts:L36` |
| Unauthorized access to other user | UnauthorizedException (401) | `users.controller.ts:L72-L77` |
| Invalid update data | Validation error (400) | DTO validation |

---

## File Structure

```
backend/src/users/
├── users.controller.ts    # HTTP endpoints
├── users.module.ts        # Module definition
├── users.service.ts       # Business logic
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
└── interfaces/
    └── user.interface.ts

mobile/src/
├── screens/ProfileScreen.tsx
└── services/userService.ts
```

---

## Related Specifications

- [BFF-4 Authentication](../BFF-4-authentication/spec.md) - User creation and login
- [BFF-8 Push Notifications](../BFF-8-push-notifications/spec.md) - Uses push tokens
