# Big Fam Festival - Project Constitution

<!-- 
Version: 1.2.0
Generated: 2026-02-09
Last Audit: 2026-02-10
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
- NOT store passwords (Firebase Auth manages credentials externally)
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

### Multi-Tenancy

The application supports multi-tenant (multi-festival) operation:

- `TenantMiddleware` is applied globally to all routes (except `/health`)
- Each request is scoped to a festival via `FESTIVAL_ID` configuration
- Tenant context MUST be derived from configuration, not from user input
- Health endpoints MUST remain tenant-agnostic for orchestrator probes

### HTTP Security Headers

All backend deployments MUST use `helmet` middleware for HTTP security headers:

- `helmet()` MUST be applied globally in `main.ts`
- Default helmet configuration provides: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, X-XSS-Protection, and more
- Custom CSP rules MAY be added as needed for specific endpoints

## VII. Firebase Authentication & Authorization

Authentication MUST use Firebase Authentication:

**Token Structure** (Firebase ID Token):
- `uid`: User ID (matches Firestore document ID)
- `email`: User email
- Custom claims: `role` (ADMIN, ATTENDEE)

**Token Management (Mobile)**:
- Firebase SDK handles token storage and automatic refresh
- ID tokens retrieved via `getIdToken()` are short-lived (1 hour, auto-refreshed)
- Tokens MUST be sent via `Authorization: Bearer <token>` header

**Route Protection**:
- All routes are protected by default (`FirebaseAuthGuard` at controller level)
- Public routes MUST use `@Public()` decorator explicitly
- Admin routes MUST use `@Roles(Role.ADMIN)` decorator with role from custom claims

**Password Security**:
- Passwords managed by Firebase Authentication
- Password validation MUST require minimum 8 characters (enforced by Firebase)
- Firebase handles password hashing and secure storage
- Password reset via Firebase email flow

Rationale: Firebase Authentication provides secure, managed authentication with built-in token refresh, reducing custom security code.

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

TypeScript strict mode status:
- Mobile (`mobile/tsconfig.json`): `"strict": true` ✅
- Functions (`functions/tsconfig.json`): `"strict": true` ✅
- Backend (`backend/tsconfig.json`): Non-strict (`strictNullChecks: false`, `noImplicitAny: false`). SHOULD be enabled incrementally.

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
- The canonical API client is `services/api.ts` (with retry/backoff)

**Error Tracking**:
- Production builds MUST include Sentry for crash and error reporting
- Sentry is initialized at app startup via `initSentry()`
- PII MUST NOT be included in Sentry events (consistent with §V)

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
- `spec.md`: Feature specification (REQUIRED)
- `plan.md`: Implementation plan (REQUIRED for features entering development; MAY be absent for specs in early discovery or deferred state)

Rationale: Traceability between tickets and specifications enables project management and audit trails.

## XIII. Infrastructure as Code (Terraform)

All Google Cloud Platform infrastructure MUST be managed via Terraform:

**Resource Management**:
- All GCP resources (Cloud Run, Firestore, Storage, IAM) MUST be defined in Terraform
- Terraform state MUST be stored remotely (GCS bucket recommended)
- Resource changes MUST be reviewed via `terraform plan` before applying

**File Organization** (`infrastructure/terraform/`):
- `main.tf`: Provider configuration and core settings
- `variables.tf`: Input variables with descriptions
- `*.tf`: Resource-specific files (cloud-run.tf, firestore.tf, etc.)
- `terraform.tfvars`: Environment-specific values (MUST NOT contain secrets)

**Naming Conventions**:
- Resources MUST include environment prefix (e.g., `bigfam-api-production`)
- Variables MUST have descriptions and default values where sensible

**Security**:
- Secrets MUST NOT be stored in Terraform files
- Use Google Secret Manager for sensitive values
- Service account keys SHOULD be avoided; use workload identity where possible

Rationale: Infrastructure as Code ensures reproducibility, version control, and audit trails for cloud resources.

## XIV. CI/CD & GitHub Actions

All automation MUST use GitHub Actions workflows in `.github/workflows/`:

**Workflow Standards**:
- Workflow files MUST have descriptive names (e.g., `backend-ci.yml`, `mobile-ci.yml`)
- Each workflow MUST define clear trigger conditions (`on:` block)
- Jobs MUST specify appropriate `runs-on` and timeout values
- Sensitive values MUST use GitHub Secrets, never hardcoded

**Required Workflows**:
- `backend-ci.yml`: Lint, typecheck, test backend on PR; build Docker image and deploy to Cloud Run on merge to main
- `mobile-ci.yml`: Lint, typecheck, test mobile on PR; trigger EAS build on merge
- `sync-spec-context.yml`: Sync specification context to central repo

**Best Practices**:
- Use caching for `node_modules` to speed up builds
- Run linting and type checking before tests
- Use matrix builds for multiple Node versions only when needed
- Keep workflows focused (one purpose per workflow)

Rationale: Consistent CI/CD ensures code quality gates and reliable deployments.

## XV. Mobile Deployment (EAS)

Mobile app builds and submissions MUST use Expo Application Services (EAS):

**Build Configuration** (`mobile/eas.json`):
- `development`: Development client builds with hot reload
- `preview`: Internal distribution builds (APK for Android, simulator for iOS)
- `production`: App store builds with auto-incrementing version numbers

**Build Requirements**:
- Production builds MUST use `app-bundle` for Android (not APK)
- iOS builds MUST use managed signing (EAS credentials)
- Node version MUST be pinned to ensure reproducibility
- Build profiles MUST specify explicit environment variables

**Submission Workflow**:
- iOS: Build via EAS, submit via Transporter or `eas submit`
- Android: Build via EAS, submit via Play Console or `eas submit`
- Both platforms MUST pass store review before production release

**Credentials Management**:
- EAS SHOULD manage iOS signing certificates and provisioning profiles
- Android upload key SHOULD be managed by EAS
- Google Play service account JSON MUST be gitignored if present

**Documentation**:
- Release process MUST be documented in `docs/MOBILE_RELEASE_GUIDE.md`
- Pre-release checklist MUST be maintained in `docs/RELEASE_CHECKLIST.md`

Rationale: Standardized mobile deployment ensures reliable, reproducible app releases.

## XVI. Firebase Cloud Functions

Firebase Cloud Functions MUST follow these patterns:

**Project Structure** (`functions/`):
- `src/index.ts`: Main exports for all functions
- Functions SHOULD be organized by domain/feature
- Shared utilities SHOULD be in separate modules

**Function Patterns**:
- Functions MUST have clear, descriptive names
- HTTP functions MUST validate input
- Scheduled functions MUST log execution start/end
- All functions MUST handle errors gracefully

**Deployment**:
- Functions deploy via `firebase deploy --only functions`
- CI/CD workflow (`deploy-functions.yml`) handles automated deployment
- Function environment variables set via Firebase console or CLI

**Integration with Backend**:
- Functions complement (not replace) the NestJS backend
- Use functions for: scheduled tasks, event triggers, lightweight webhooks
- Use backend for: complex business logic, user-facing APIs

Rationale: Firebase Functions provide serverless capabilities for event-driven and scheduled tasks.

---

## Additional Constraints

### Tech Stack (Enforced)

**Backend**:
- Runtime: Node.js 20.x
- Framework: NestJS 10.x
- Language: TypeScript 5.x
- Database: Google Cloud Firestore
- Auth: Firebase Authentication (firebase-admin SDK)
- Docs: Swagger/OpenAPI via @nestjs/swagger
- Logging: Pino via nestjs-pino
- Hosting: Google Cloud Run

**Mobile**:
- Framework: React Native 0.81.x
- Platform: Expo SDK 54
- Language: TypeScript 5.x
- Navigation: React Navigation 6.x
- State: TanStack React Query 5.x + React Context
- Auth: @react-native-firebase/auth
- Storage: AsyncStorage (cache)

**Cloud Functions**:
- Runtime: Node.js 20
- Framework: Firebase Functions

### Testing Requirements

- Backend: Jest for unit and integration tests
- Mobile: Jest + React Native Testing Library
- Coverage threshold: Not strictly enforced (SHOULD aim for critical paths)
- E2E tests: Scaffolded (`backend/test/`) but not yet comprehensive

### Security Requirements

- HTTPS required for all API communication
- HTTP security headers enforced via `helmet` middleware
- Firebase Auth manages token lifecycle and expiry
- Firebase Auth manages password hashing and storage
- No PII in logs
- Rate limiting via @nestjs/throttler
- CORS MUST be restricted to known origins in production (not `*`)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|| 1.2.0 | 2026-02-10 | Constitution audit: Added multi-tenancy, security headers, Sentry, strict mode status; updated CI/CD workflows, spec requirements, CORS policy || 1.1.0 | 2026-02-10 | Added Sections XIII-XVI: Terraform, CI/CD, EAS Deployment, Firebase Functions |
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
