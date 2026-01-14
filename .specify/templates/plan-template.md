# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

**Retry Logic**: Only API calls require retry logic. Database interactions (Postgres) should not implement retry unless explicitly required for transactional integrity or error handling.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This plan MUST be checked against the repository constitution at `.specify/memory/constitution.md`.


At minimum, the following gates (derived from the constitution) MUST be verified and documented here:

  - API contract (OpenAPI/Swagger spec) - implementation MUST match contract exactly
  - Sequence diagram for major flows
  - Data model definition (ERD or equivalent)
  - Database migration scripts and rationale
  - For features involving new or updated data storage, documentation MUST include explicit details for Postgres on GCP Cloud SQL (schema, migration plan, access patterns)
[ ] Feature specification must be stored in `/features` folder in Gherkin format for automation.
[ ] Contract Compliance: OpenAPI contract file exists and is the authoritative source for API design
[ ] Audit Logging: All APIs must implement audit logging before release

[ ] PII Data: PII MUST NOT be logged. If PII is required for audit, it MUST be sent to a dedicated audit table with documented access controls and rationale.
[ ] Distributed Tracing: All APIs must propagate the x-trace-id header before release
[Gates determined based on constitution file]
[ ] 42Crunch API security scan must be performed before release; minimum audit security score required: 80%.

[ ] Feature flags must be managed using Flagsmith; document flag usage and rollout strategy for each feature.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Caching Strategy Clarification

- Which API endpoints or data should be cached to improve performance or reduce load?
- What is the expected cache duration (TTL) for each cached item?
- Are there any cache invalidation or refresh requirements?
- Caching tool: Redis

## Retry Logic Clarification

- Which API endpoints or operations require retry logic?
- What are the recommended retry parameters (max attempts, backoff strategy, delay)?
- Suggested strategy: Use exponential backoff with a delay (e.g., start with 1-2 seconds, double each time, up to a max).
- Should retries be applied for specific error types only (e.g., network, 5xx, rate limit)?
- Are there any idempotency or side-effect concerns with retries?
