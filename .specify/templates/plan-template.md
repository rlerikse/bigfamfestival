# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]  
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

---

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

---

## Technical Context

<!--
  ACTION REQUIRED: Replace the placeholders below with your project's technical details.
  Use NEEDS CLARIFICATION for any unclear items.
-->

| Aspect | Value |
|--------|-------|
| **Primary Dependencies** | [e.g., FastAPI, React, NestJS or NEEDS CLARIFICATION] |
| **Storage** | [e.g., PostgreSQL, MongoDB, Redis or N/A] |
| **Testing Framework** | [e.g., Jest, pytest, JUnit or NEEDS CLARIFICATION] |
| **Target Platform** | [e.g., Linux server, Web, iOS 15+ or NEEDS CLARIFICATION] |
| **Project Type** | [single/web/mobile - determines source structure] |

**Performance Goals**: [domain-specific, e.g., 1000 req/s, <200ms p95 or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 50 screens or NEEDS CLARIFICATION]

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This plan MUST be checked against the repository constitution at `.specify/memory/constitution.md`.

<!--
  IMPORTANT: The checklist below should be populated based on YOUR project's constitution.
  The /speckit.plan command will extract relevant gates from your constitution.
  If generating manually, review your constitution and add applicable gates.
-->

### Required Documentation Gates

- [ ] API contract (OpenAPI/Swagger spec) exists - implementation MUST match contract exactly
- [ ] Sequence diagram for major flows (if complex interactions)
- [ ] Data model definition (ERD or equivalent) for features involving data
- [ ] Database migration scripts and rationale (if schema changes)

### Constitution Compliance Gates

<!--
  These gates are derived from your project's constitution.
  Run /speckit.constitution --audit to see your current gates.
-->

- [ ] **Contract Compliance**: OpenAPI contract file exists and is authoritative source
- [ ] **Security**: [Security requirements per your constitution]
- [ ] **Observability**: [Logging/tracing requirements per your constitution]
- [ ] **PII Handling**: PII MUST NOT be logged; use dedicated audit mechanisms if needed
- [ ] **[Project-Specific Gate]**: [Add gates from your constitution]

> **Note**: Run `/speckit.analyze` before implementation to validate against constitution.

---

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (alternatives analysis)
├── data-model.md        # Phase 1 output (if data changes)
├── quickstart.md        # Phase 1 output (local dev setup)
├── contracts/           # Phase 1 output (OpenAPI specs)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths. The delivered plan must not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── controllers/
└── utils/

tests/
├── unit/
├── integration/
└── e2e/

# [REMOVE IF UNUSED] Option 2: Web application (frontend + backend)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   └── pages/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [Document the selected structure and reasoning]

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., New database] | [specific need] | [why existing storage insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

---

## Caching Strategy [OPTIONAL]

<!--
  Include this section if the feature involves caching.
-->

| Endpoint/Data | Cache Duration (TTL) | Invalidation Strategy |
|---------------|---------------------|----------------------|
| [endpoint 1] | [e.g., 5 minutes] | [e.g., on update] |
| [endpoint 2] | [e.g., 1 hour] | [e.g., scheduled] |

**Caching Tool**: [Per project conventions - e.g., Redis, CDN, in-memory]

---

## Retry Logic [OPTIONAL]

<!--
  Include this section if the feature involves external API calls.
-->

| Operation | Max Attempts | Backoff Strategy | Retry On |
|-----------|-------------|------------------|----------|
| [API call 1] | 3 | Exponential (1s, 2s, 4s) | 5xx, network errors |
| [API call 2] | 5 | Fixed (500ms) | 429 rate limit |

**Idempotency Concerns**: [Document any operations that should NOT be retried]

> **Note**: Database interactions typically should NOT implement retry unless explicitly required for transactional integrity.

---

## Architecture Decisions

<!--
  Document key technical decisions made during planning.
  This helps future developers understand the "why" behind choices.
-->

### Decision 1: [Brief Title]

**Context**: [What is the issue or situation requiring a decision?]

**Decision**: [What was decided?]

**Rationale**: [Why was this decision made?]

**Alternatives Considered**: [What other options were evaluated?]

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | Low/Medium/High | Low/Medium/High | [Mitigation strategy] |
| [Risk 2] | Low/Medium/High | Low/Medium/High | [Mitigation strategy] |

---

## Dependencies

### External Dependencies

- [Dependency 1]: [What it is, version, why needed]
- [Dependency 2]: [What it is, version, why needed]

### Internal Dependencies

- [Other feature/service]: [How it's related, blocking or parallel]

---

## Next Steps

1. Run `/speckit.tasks` to generate task breakdown
2. Run `/speckit.analyze` to validate against constitution
3. Begin implementation with `/speckit.implement`
