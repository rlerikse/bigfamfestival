# Data Model: Firebase Auth Migration

**Feature**: BFF-50  
**Last Updated**: 2026-02-10

---

## Overview

This document describes the data model changes required for Firebase Auth migration. The primary change is removing the `password` field from the User interface, as Firebase Auth handles credential storage.

---

## User Entity Changes

### Before Migration

```typescript
// backend/src/users/interfaces/user.interface.ts
import { Role } from '../../auth/enums/role.enum';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;           // ❌ REMOVE - Will be handled by Firebase Auth
  phone?: string;
  role: Role;
  profilePictureUrl?: string;
  shareMyCampsite: boolean;
  shareMyLocation: boolean;
  ticketType: string;
  expoPushToken?: string;
  notificationsEnabled?: boolean;
  userGroups?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

### After Migration

```typescript
// backend/src/users/interfaces/user.interface.ts
import { Role } from '../../auth/enums/role.enum';

export interface User {
  id: string;                  // ✅ Same as Firebase UID
  name: string;
  email: string;               // ✅ Synced from Firebase Auth
  // password: REMOVED         // Firebase Auth handles credentials
  phone?: string;
  role: Role;                  // ✅ Also stored as Firebase custom claim
  profilePictureUrl?: string;
  shareMyCampsite: boolean;
  shareMyLocation: boolean;
  ticketType: string;
  expoPushToken?: string;
  notificationsEnabled?: boolean;
  userGroups?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

---

## Firebase Auth User Record

Firebase Auth stores additional user information that we previously managed:

```typescript
// Firebase Auth User Record (read-only from app perspective)
interface FirebaseUserRecord {
  uid: string;                 // Same as Firestore document ID
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  customClaims?: {
    role: 'attendee' | 'staff' | 'admin';
  };
}
```

---

## Custom Claims Structure

Firebase custom claims are used for role-based access control:

```typescript
// Set via Firebase Admin SDK
interface CustomClaims {
  role: 'attendee' | 'staff' | 'admin';
}

// Usage in backend
const decodedToken = await getAuth().verifyIdToken(token);
const role = decodedToken.role; // From custom claims
```

**Note**: Custom claims have a 1000-byte limit. Role string is well within this limit.

---

## Firestore Collection: `users`

### Document Structure (After Migration)

```javascript
// Firestore: users/{userId}
{
  "name": "John Doe",
  "email": "john@example.com",
  // "password": REMOVED
  "phone": "+1234567890",
  "role": "attendee",
  "profilePictureUrl": "https://...",
  "shareMyCampsite": false,
  "shareMyLocation": false,
  "ticketType": "general",
  "expoPushToken": "ExponentPushToken[xxx]",
  "notificationsEnabled": true,
  "userGroups": ["vip", "early-bird"],
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### Document ID
- **Before**: Random Firestore document ID
- **After**: Must match Firebase Auth UID

**Migration Note**: Existing document IDs will be preserved and used as Firebase UIDs during import.

---

## DTO Changes

### RegisterDto

```typescript
// BEFORE: Still accepts password for validation
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;  // Passed to Firebase, not stored in Firestore

  @IsOptional()
  @IsString()
  phone?: string;
}
```

**Note**: RegisterDto still includes password for Firebase user creation, but the password is passed directly to Firebase and never stored in Firestore.

### LoginDto

```typescript
// DEPRECATED: Login happens via Firebase SDK directly
// Backend no longer needs to receive passwords
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

**Note**: LoginDto will be deprecated. Mobile app calls Firebase `signInWithEmailAndPassword()` directly.

---

## Role Enum (Unchanged)

```typescript
// backend/src/auth/enums/role.enum.ts
export enum Role {
  ATTENDEE = 'attendee',
  STAFF = 'staff',
  ADMIN = 'admin',
}
```

---

## Migration Script Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Firestore User Document                                     │
├─────────────────────────────────────────────────────────────┤
│ {                                                           │
│   id: "abc123",                                             │
│   email: "user@example.com",                                │
│   password: "$2b$10$hash...",  ◄── Extract for import       │
│   role: "attendee",                                         │
│   ...                                                       │
│ }                                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Firebase Auth importUsers()                                 │
├─────────────────────────────────────────────────────────────┤
│ {                                                           │
│   uid: "abc123",           ◄── Preserve Firestore doc ID    │
│   email: "user@example.com",                                │
│   passwordHash: Buffer.from("$2b$10$hash..."),              │
│   displayName: "User Name",                                 │
│ }                                                           │
│                                                             │
│ Hash Algorithm: { algorithm: 'BCRYPT' }                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Firebase Auth setCustomUserClaims()                         │
├─────────────────────────────────────────────────────────────┤
│ {                                                           │
│   role: "attendee"         ◄── Copy from Firestore          │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Backward Compatibility

### During Transition Period

The `password` field remains in Firestore documents but is not used:
- New registrations: Password stored in Firebase Auth only
- Existing users: Password hash in Firestore (for emergency rollback)
- After transition: Password field can be deleted via migration script

### ID Consistency

User IDs remain consistent:
- Firestore document ID = Firebase Auth UID
- No foreign key updates required
- References to user IDs in other collections unchanged

---

## Affected Components

| Component | Change Required |
|-----------|-----------------|
| `user.interface.ts` | Remove `password` field |
| `create-user.dto.ts` | Remove `password` field |
| `auth.service.ts` | Remove password hashing/comparison |
| `users.service.ts` | Remove password from create/update |
| `AuthContext.tsx` | Use Firebase user object |
| `authService.ts` | Remove password transmission |

---

## Validation Rules

### Email
- Must be unique (Firebase enforces)
- Must be valid email format
- Case-insensitive comparison

### Password (Firebase-managed)
- Minimum 6 characters (Firebase default)
- No maximum enforced
- Stored securely by Firebase (never in Firestore)

### Role
- Must be one of: `attendee`, `staff`, `admin`
- Default: `attendee` for new users
- Stored in both custom claims and Firestore (claims authoritative)
