# Big Fam Festival Platform Constitution

**Version**: 1.0.0  
**Last Updated**: January 14, 2026  
**Scope**: Big Fam Festival API and Mobile Application  
**Authority**: Non-negotiable principles for feature development

---

## I. Contract-First API Design

All APIs MUST be designed according to OpenAPI/Swagger specifications. The NestJS Swagger module provides authoritative contract documentation.

**Implementation MUST match contracts exactly**:
- Endpoint paths and HTTP methods
- Request/response schemas (DTOs)
- Query parameters and validation rules
- Error response formats and status codes

**DTO Requirements**:
- Use `class-validator` decorators for runtime validation
- Use `class-transformer` for payload transformation
- DTOs in `dto/` directories within each module

**Rationale**: Contract-first design enables proper client generation and prevents implementation drift.

---

## II. NestJS Module Architecture

All backend features MUST follow NestJS conventions:

- **Modules**: One module per domain (auth, events, artists, users)
- **Controllers**: HTTP request handling, input validation
- **Services**: Business logic, data transformation
- **Interfaces**: TypeScript types for domain entities

**Module Structure**:
```
src/
├── [domain]/
│   ├── [domain].module.ts
│   ├── [domain].controller.ts
│   ├── [domain].service.ts
│   ├── dto/
│   ├── interfaces/
│   └── guards/ (if needed)
```

**Rationale**: Consistent module structure improves discoverability and testability.

---

## III. Firestore Data Safety

All Firestore operations MUST follow these principles:

- **Firebase Admin SDK**: Server-side operations only
- **Type Safety**: All documents MUST have TypeScript interfaces
- **Transactions**: Use transactions for atomic operations
- **Validation**: Validate data before writes

**Protected Operations**:
- User role changes MUST be admin-only
- Ticket assignments MUST be transactional
- Event modifications MUST be authorized

**Rationale**: Firestore operations require strict validation to prevent data corruption.

---

## IV. Authentication & Authorization

All protected routes MUST use proper guards:

- **JWT Authentication**: `@nestjs/jwt` with Passport strategies
- **Guards**: Custom guards for route protection
- **Decorators**: Custom decorators for user context

**Auth Modules**:
- `auth.module.ts`: JWT and local strategies
- `guards/`: JWT and role-based guards
- `strategies/`: Passport strategies

**Rationale**: Festival apps handle sensitive user data requiring proper access control.

---

## V. Observability & Logging

All services MUST implement proper logging:

- **Pino Logger**: Use `nestjs-pino` for structured logging
- **Request Logging**: Log all HTTP requests with correlation IDs
- **Error Logging**: Log errors with full context (no PII)

**Never Log**:
- Email addresses, phone numbers
- Full names or addresses
- Payment information

**Rationale**: Structured logging enables debugging while protecting user privacy.

---

## VI. Mobile (Expo/React Native)

Mobile app MUST follow these patterns:

- **Expo Managed Workflow**: Use Expo SDK for cross-platform features
- **Navigation**: React Navigation for screen management
- **State**: React Query or Context for state management
- **Offline Support**: Handle offline scenarios gracefully

**Rationale**: Expo simplifies cross-platform development for festival attendees.

---

## VII. Testing Requirements

All features MUST include appropriate tests:

- **Unit Tests**: Jest for service and controller logic
- **Integration Tests**: Test API endpoints end-to-end
- **Coverage**: Maintain reasonable test coverage

**Test Files**:
- `*.spec.ts` for unit tests
- `*.e2e-spec.ts` for integration tests

**Rationale**: Festival apps must be reliable during high-traffic events.

---

## VIII. Infrastructure (Terraform)

All cloud resources MUST be managed via Terraform:

- **Google Cloud**: GCP as primary cloud provider
- **Infrastructure as Code**: All resources in `infrastructure/terraform/`
- **Environment Separation**: Dev, staging, production environments

**Rationale**: Infrastructure as Code ensures reproducible deployments.

---

## Additional Constraints

- **Backend Language**: TypeScript (strict mode)
- **Backend Framework**: NestJS 10
- **Database**: Google Cloud Firestore
- **Auth**: JWT with Passport.js
- **Mobile**: Expo / React Native
- **Cloud**: Google Cloud Platform
- **IaC**: Terraform

---

**Version**: 1.0.0 | **Ratified**: 2026-01-14
