# Big Fam Festival - GitHub Copilot Instructions

**Spec-Kit Managed Repository**

This repository uses Spec-Kit for specification-driven development.

## Constitution

See: `.specify/memory/constitution.md` for non-negotiable quality gates.

All code MUST comply with the constitution.

## Specifications

See: `specs/` directory for feature specifications.

## Creating New Features

Use Spec-Kit workflow:

1. `/speckit.specify` - Create specification
2. `/speckit.plan` - Generate implementation plan
3. `/speckit.tasks` - Break down into tasks
4. `/speckit.analyze` - Validate against constitution
5. `/speckit.implement` - Execute implementation

## Templates

- Spec: `.specify/templates/spec-template.md`
- Plan: `.specify/templates/plan-template.md`
- Tasks: `.specify/templates/tasks-template.md`

## Technology Stack

### Backend
- **Framework**: NestJS 10
- **Language**: TypeScript (strict)
- **Database**: Google Cloud Firestore
- **Auth**: JWT with Passport.js
- **Logging**: Pino (nestjs-pino)
- **Validation**: class-validator, class-transformer

### Mobile
- **Framework**: Expo / React Native
- **Navigation**: React Navigation

### Infrastructure
- **Cloud**: Google Cloud Platform
- **IaC**: Terraform

## Project Structure

```
bigfamfestival/
├── backend/
│   └── src/
│       ├── auth/         # Authentication module
│       ├── events/       # Events module
│       ├── artists/      # Artists module
│       ├── users/        # Users module
│       ├── schedule/     # Schedule module
│       └── campsites/    # Campsites module
├── mobile/               # Expo React Native app
└── infrastructure/
    └── terraform/        # GCP infrastructure
```
