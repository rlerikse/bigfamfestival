# User Management - Implementation Plan (Retroactive)

**Status**: ✅ Implemented  
**Jira**: [BFF-5](https://eriksensolutions.atlassian.net/browse/BFF-5)

---

## Architecture Summary

### Tech Stack
- **Language**: TypeScript
- **Backend Framework**: NestJS 10.x
- **Database**: Firebase Firestore
- **Authorization**: Role-based guards

### File Structure
```
backend/src/users/
├── users.controller.ts
├── users.module.ts
├── users.service.ts
├── dto/
└── interfaces/

mobile/src/
├── screens/ProfileScreen.tsx
└── services/userService.ts
```

### Key Design Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Firestore document per user | Simple 1:1 mapping | No relational queries |
| Role in JWT | Reduces DB lookups | Role changes need re-login |
| Push token on user doc | Simple association | One token per user |
| Soft permissions check | Better UX for staff | Complex authorization logic |

---

## Data Flow

### Profile Update Flow
```
┌─────────────┐    PUT /users/profile     ┌─────────────┐
│   Mobile    │ ─────────────────────────▶│   Backend   │
│    App      │  { name, phone, ... }     │   NestJS    │
└─────────────┘                           └─────────────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────┐
                                    │  1. JwtAuthGuard    │
                                    │  2. Extract user ID │
                                    │  3. Validate DTO    │
                                    │  4. Update Firestore│
                                    │  5. Return updated  │
                                    └─────────────────────┘
```

---

## Module Dependencies

```
UsersModule
├── imports
│   └── FirestoreModule
├── providers
│   └── UsersService
├── controllers
│   └── UsersController
└── exports
    └── UsersService (used by AuthModule)
```

---

## Firestore Collection

### Collection: `users`
```javascript
{
  // Document ID is user ID
  "email": "user@example.com",
  "password": "$2b$10$...",  // bcrypt hash
  "name": "John Doe",
  "phone": "123-456-7890",
  "role": "attendee",
  "shareMyCampsite": false,
  "shareMyLocation": false,
  "ticketType": "general",
  "expoPushToken": "ExponentPushToken[...]",
  "notificationsEnabled": true,
  "profilePictureUrl": "https://..."
}
```

---

## Security Implementation

### Guards Stack
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
```

### Role Checking
```typescript
@Roles(Role.ADMIN)
async getAllUsers() { ... }
```

### Self-Access Check
```typescript
if (req.user.id !== id && 
    req.user.role !== Role.ADMIN && 
    req.user.role !== Role.STAFF) {
  throw new UnauthorizedException();
}
```

---

## Future Enhancements (Not Implemented)

1. **Profile Pictures** - URL field exists but upload not implemented
2. **Email Change** - Would require verification flow
3. **Account Deletion** - Soft delete with data retention policy
4. **Activity Logging** - Audit trail for profile changes
