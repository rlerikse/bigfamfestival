# Big Fam Festival - Project Constitution

<!-- 
Version: 1.0.0
Generated: 2026-02-09
Last Audit: 2026-02-09
Project: Big Fam Festival App (Backend API + Mobile App)
-->

## I. Contract-First API Design

All APIs MUST be designed with Swagger/OpenAPI documentation using NestJS decorators. The API contract serves as the source of truth for:

- Endpoint paths and HTTP methods (`@Get()`, `@Post()`, etc.)
- Request/response schemas via DTOs with `@ApiProperty()` decorators
- Query parameters documented with `@ApiQuery()`
- Error responses documented with `@ApiResponse()`

All controllers MUST include complete Swagger decorators:
```typescript
@ApiTags('domain')
@ApiOperation({ summary: 'Description' })
@ApiResponse({ status: 200, description: 'Success' })
@ApiResponse({ status: 404, description: 'Not found' })
```

Rationale: Contract-first design ensures API consistency, enables proper client generation, and provides self-documenting APIs via Swagger UI at `/api/docs`.

## II. Observability & Logging

Services MUST emit structured logs using Pino (via `nestjs-pino`). All logs MUST:

- Use appropriate log levels (error, warn, info, debug)
- Include contextual information (userId, requestId where available)
- Be structured JSON in production
- Use `pino-pretty` for development readability only

Health checks MUST be implemented via `@nestjs/terminus`:
- `/health` endpoint for liveness checks
- Firestore connectivity health indicator
- All health checks MUST return within 5 seconds

Console.log SHOULD NOT be used in production code. Use `Logger` from `@nestjs/common` or Pino.

Rationale: Structured logging enables efficient debugging in production. Health checks enable proper orchestration and monitoring.

## III. Firestore Data Safety & Access Patterns

All Firestore operations MUST be encapsulated through `FirestoreService`. Direct Firestore SDK calls outside this service are PROHIBITED.

Data access patterns:
- Services MUST define collection names as class constants
- All reads MUST handle document-not-found gracefully (throw `NotFoundException`)
- All writes MUST validate data before persistence
- Queries MUST avoid unbounded reads (use limits or pagination)

Document schema changes:
- NoSQL schema is flexible, but field additions SHOULD be backward-compatible
- Field removals MUST ensure no code references the removed field
- Data migrations SHOULD be handled via Cloud Functions or scripts, not inline

Collection naming: lowercase, plural (e.g., `events`, `users`, `campsites`)

Rationale: Centralized data access prevents inconsistent patterns and enables easier testing, caching, and audit logging.

## IV. Documentation & Data Model Discipline

All features and changes MUST be accompanied by up-to-date documentation:

- New API endpoints MUST have Swagger documentation
- New features MUST have a specification in `specs/` directory
- Data models (interfaces) MUST include JSDoc comments describing each field
- README files MUST be updated when setup steps change

Specifications MUST follow the template structure in `.specify/templates/`.

Rationale: Clear documentation ensures maintainability, onboarding, and safe evolution of the system.

## V. PII Data Handling & Logging

Personally Identifiable Information (PII) MUST NOT be logged:
- Email addresses
- Phone numbers
- Passwords (even hashed)
- Location data
- Push notification tokens

PII fields MUST be clearly identified in interfaces with comments.

User data in Firestore MUST:
- Store passwords only as bcrypt hashes (cost factor ≥ 10)
- Be deletable upon user request (GDPR/CCPA compliance)

Rationale: Logging PII risks privacy breaches and regulatory violations.

## VI. NestJS Architecture Patterns

All backend code MUST follow NestJS conventions:

**Module Structure**:
- One module per domain (`EventsModule`, `AuthModule`, etc.)
- Modules MUST declare imports, controllers, providers, and exports explicitly
- Cross-module dependencies MUST be through exported services

**Dependency Injection**:
- Services MUST use constructor injection with `private readonly`
- Services MUST be decorated with `@Injectable()`
- Circular dependencies are PROHIBITED

**Controller Patterns**:
- Controllers handle HTTP concerns ONLY (no business logic)
- All business logic MUST be in services
- Controllers MUST use appropriate HTTP status codes

**Guard & Decorator Usage**:
- `@Public()` decorator for unauthenticated routes
- `@Roles(Role.ADMIN)` for admin-only routes
- Guards applied at controller level, not method level (unless necessary)

Rationale: Consistent NestJS patterns improve maintainability and enable proper testing.

## VII. JWT Authentication & Authorization

Authentication MUST use JWT tokens with Passport.js:

**Token Structure**:
- `sub`: User ID
- `email`: User email
- `role`: User role (ADMIN, ATTENDEE)

**Token Storage (Mobile)**:
- Access tokens MUST be stored in `expo-secure-store` (encrypted)
- Tokens MUST be sent via `Authorization: Bearer <token>` header

**Route Protection**:
- All routes are protected by default (`JwtAuthGuard` at controller level)
- Public routes MUST use `@Public()` decorator explicitly
- Admin routes MUST use `@Roles(Role.ADMIN)` decorator

**Password Security**:
- Passwords MUST be hashed with bcrypt (minimum 10 rounds)
- Password validation MUST require minimum 8 characters
- Failed login attempts SHOULD NOT reveal whether email exists

Rationale: Secure authentication protects user data and prevents unauthorized access.

## VIII. Input Validation & Type Safety

All external data MUST be validated using `class-validator` decorators in DTOs:

**DTO Requirements**:
- All request bodies MUST have corresponding DTO classes
- DTOs MUST use validation decorators (`@IsString()`, `@IsEmail()`, etc.)
- DTOs MUST include `@ApiProperty()` for Swagger documentation
- Optional fields MUST use `@IsOptional()` decorator

**Validation Locations**:
- API requests: Validated via NestJS ValidationPipe (global)
- Environment variables: Validated at startup via Joi schema
- Firestore responses: Type assertions with runtime checks for critical fields

TypeScript strict mode is NOT currently enforced but SHOULD be enabled incrementally.

Rationale: Runtime validation prevents type coercion bugs, injection attacks, and data corruption.

## IX. Mobile Development Standards (React Native + Expo)

Mobile code MUST follow these patterns:

**Component Architecture**:
- Screens are thin orchestrators (business logic in hooks/services)
- Reusable components MUST use `React.memo` for performance
- Event handlers MUST use `useCallback` to prevent re-renders
- Styles MUST use `StyleSheet.create()` outside component body

**State Management**:
- Server state: TanStack React Query
- Client state: React Context (AuthContext, ThemeContext, etc.)
- Local component state: `useState`

**Context Providers**:
- Contexts MUST export both Provider and custom hook (`useAuth`, `useTheme`)
- Custom hooks MUST throw if used outside provider
- Providers MUST be composed at app root in `App.tsx`

**Service Layer**:
- API calls MUST be in service files (`*Service.ts`)
- Services are pure functions (not classes)
- Services handle token retrieval internally

Rationale: Consistent mobile patterns improve performance and maintainability.

## X. Offline Support & Caching

Mobile app MUST handle offline scenarios gracefully:

**Network Detection**:
- Use `@react-native-community/netinfo` for connectivity status
- Display appropriate UI when offline

**Data Caching**:
- Critical data (schedule, events) MUST be cached in `AsyncStorage`
- Cache MUST be refreshed when coming back online
- Stale cache is acceptable for read operations when offline

**TanStack Query Configuration**:
- `staleTime`: 5 minutes for most queries
- `retry`: 2 attempts for failed requests
- Automatic refetch on reconnection

Rationale: Festival attendees may have poor connectivity; offline support ensures app usability.

## XI. Push Notifications

Push notifications MUST follow these patterns:

**Backend (Expo Server SDK)**:
- Notifications sent via `expo-server-sdk`
- Push tokens stored in Firestore user documents
- Failed sends MUST be logged but not retried indefinitely

**Mobile (expo-notifications)**:
- Permission MUST be requested before registering for push
- Token registration MUST happen after successful login
- Local notifications for schedule reminders

**Notification Types**:
- Broadcast: Admin sends to all users
- Targeted: Specific user notifications
- Scheduled: Event reminders (local)

Rationale: Push notifications are core to festival communication but must be implemented carefully to avoid spam and battery drain.

## XII. Specification Requirements (Jira Integration)

All specifications MUST be linked to a Jira ticket:

- **No Ticket = No Spec**: Every spec MUST have a ticket ID
- **Naming Convention**: `specs/{TICKET-ID}-{short-description}/`
- **Project Key**: BFF (Big Fam Festival)
- **Examples**: `specs/BFF-4-authentication/`, `specs/BFF-6-events-schedule/`

Spec directories MUST contain:
- `spec.md`: Feature specification
- `plan.md`: Implementation plan

Rationale: Traceability between tickets and specifications enables project management and audit trails.

---

## Additional Constraints

### Tech Stack (Enforced)

**Backend**:
- Runtime: Node.js 20.x
- Framework: NestJS 10.x
- Language: TypeScript 5.x
- Database: Google Cloud Firestore
- Auth: Passport.js + JWT
- Docs: Swagger/OpenAPI via @nestjs/swagger
- Logging: Pino via nestjs-pino
- Hosting: Google Cloud Run

**Mobile**:
- Framework: React Native 0.81.x
- Platform: Expo SDK 54
- Language: TypeScript 5.x
- Navigation: React Navigation 6.x
- State: TanStack React Query 5.x + React Context
- Storage: AsyncStorage (cache) + SecureStore (tokens)

**Cloud Functions**:
- Runtime: Node.js 20
- Framework: Firebase Functions

### Testing Requirements

- Backend: Jest for unit and integration tests
- Mobile: Jest + React Native Testing Library
- Coverage threshold: Not strictly enforced (SHOULD aim for critical paths)
- E2E tests: Not currently implemented

### Security Requirements

- HTTPS required for all API communication
- JWT tokens expire (configurable)
- Passwords hashed with bcrypt
- No PII in logs
- Rate limiting via @nestjs/throttler

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-09 | Initial constitution generated from codebase conventions |

---

## Governance

### Amendment Process
1. Propose change via PR to this file
2. Run `/speckit.constitution --audit` to verify alignment
3. Require maintainer approval
4. Update version in header

### Audit Schedule
- Run `/speckit.constitution --audit` after major features
- Run after dependency updates
- Run quarterly at minimum
