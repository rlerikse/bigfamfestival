# Authentication System - Implementation Plan (Retroactive)

**Status**: ✅ Implemented  
**Jira**: [BFF-4](https://eriksensolutions.atlassian.net/browse/BFF-4)

---

## Architecture Summary

### Tech Stack
- **Language**: TypeScript
- **Backend Framework**: NestJS 10.x
- **Authentication**: Passport.js with JWT + Local strategies
- **Password Hashing**: bcrypt
- **Database**: Firebase Firestore
- **Mobile**: React Native + Expo

### File Structure
```
backend/src/auth/
├── auth.controller.ts
├── auth.module.ts
├── auth.service.ts
├── decorators/
├── dto/
├── enums/
├── guards/
└── strategies/

mobile/src/
├── contexts/AuthContext.tsx
├── screens/auth/
└── services/authService.ts
```

### Key Design Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| JWT over sessions | Stateless, scales horizontally | Token revocation requires additional logic |
| bcrypt for passwords | Industry standard, built-in salt | Slower than alternatives (but more secure) |
| SecureStore on mobile | Encrypted storage on device | iOS Keychain / Android Keystore backed |
| Role in JWT payload | Reduces DB lookups for authorization | Role changes require re-login |
| Local + JWT strategies | Separation of auth vs token validation | Two strategies to maintain |

---

## Implementation Approach

### Authentication Flow

```
┌─────────────┐    POST /auth/register    ┌─────────────┐
│   Mobile    │ ─────────────────────────▶│   Backend   │
│    App      │                           │   NestJS    │
└─────────────┘                           └─────────────┘
      │                                          │
      │                                          ▼
      │                              ┌─────────────────────┐
      │                              │  1. Validate DTO    │
      │                              │  2. Check email     │
      │                              │  3. Hash password   │
      │                              │  4. Create user     │
      │                              │  5. Generate JWT    │
      │                              └─────────────────────┘
      │                                          │
      │◀─────────────────────────────────────────┘
      │           { user, token }
      ▼
┌─────────────────────────────────────────┐
│  Store token in SecureStore             │
│  Update AuthContext state               │
│  Navigate to Home                       │
└─────────────────────────────────────────┘
```

### Authorization Flow

```
┌─────────────┐    GET /schedule          ┌─────────────┐
│   Mobile    │ ─────────────────────────▶│   Backend   │
│    App      │  Authorization: Bearer    │   NestJS    │
└─────────────┘  <token>                  └─────────────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────┐
                                    │   JwtAuthGuard      │
                                    │   1. Extract token  │
                                    │   2. Verify JWT     │
                                    │   3. Attach user    │
                                    └─────────────────────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────┐
                                    │   RolesGuard        │
                                    │   (if @Roles used)  │
                                    └─────────────────────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────┐
                                    │   Controller        │
                                    │   req.user = {...}  │
                                    └─────────────────────┘
```

---

## Module Dependencies

```
AuthModule
├── imports
│   ├── UsersModule (user CRUD)
│   ├── PassportModule
│   ├── JwtModule (async config)
│   └── ConfigModule
├── providers
│   ├── AuthService
│   ├── LocalStrategy
│   └── JwtStrategy
└── exports
    └── AuthService
```

---

## Configuration

### JWT Configuration
```typescript
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '7d' },
  }),
  inject: [ConfigService],
})
```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `JWT_EXPIRATION` | Token expiration time | No (default: 7d) |

---

## Testing Considerations

### Unit Tests
- AuthService.register() - user creation, duplicate handling
- AuthService.validateUser() - credential validation
- AuthService.login() - token generation

### Integration Tests
- POST /auth/register - full registration flow
- POST /auth/login - full login flow
- Protected route access with valid/invalid tokens

---

## Future Enhancements (Not Implemented)

1. **Refresh Tokens** - Currently tokens expire after 7 days with no refresh
2. **Password Reset** - No forgot password flow implemented
3. **Email Verification** - Emails not verified on registration
4. **Social Login** - No OAuth providers (Google, Apple, etc.)
5. **Rate Limiting** - No brute force protection on login endpoint
