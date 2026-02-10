---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Multi-PR Strategy & Task Dependencies

**Execution Approaches**:

### Sequential (Traditional)
- Tasks execute one at a time
- Each task merges to `main` before next starts
- Lower risk, slower velocity
- Best for: Complex features with tight coupling

### Stacked (Aggressive Velocity)
- Tasks with dependencies branch from parent task branches
- Multiple PRs in flight simultaneously
- Higher velocity, requires rebase management
- Best for: Well-defined features with clear task boundaries

**Dependency Notation**:
- `[D:T###]` - Depends on Task ###
- `[P]` - Parallelizable (no dependencies)
- `[B:T###]` - Blocks Task ### (this must complete first)

**Example**:
```markdown
- [ ] T001 [P] Create database schema
- [ ] T002 [P] Create Zod validation schemas
- [ ] T003 [D:T001,T002] Implement service layer (depends on T001 and T002)
- [ ] T004 [D:T003] Implement controller (depends on T003)
```

**Branch Strategy**:
- **Independent tasks**: Branch from `main`
  - `git checkout -b feat/JIRA-ID-1_task-name`
- **Dependent tasks** (stacked): Branch from parent task
  - `git checkout -b feat/JIRA-ID-2_task-name origin/feat/JIRA-ID-1_parent-task`

**Merge Order**:
1. Independent tasks merge first (any order)
2. Dependent tasks merge after dependencies
3. Stacked PRs rebase onto `main` after parent merges

## Format: `[ID] [Flags] [Story] Description`

**Flags**:
- **[P]**: Parallelizable (no dependencies, can run simultaneously with other [P] tasks)
- **[D:T###]**: Depends on Task ### (must wait for completion)
- **[B:T###]**: Blocks Task ### (other tasks waiting on this)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

**Best Practices**:
- Include exact file paths in descriptions
- Mark all dependencies explicitly
- Group by user story for independent delivery
- Estimate Copilot time (30-60 min per task ideal)

---

## GitHub Copilot Integration

**When creating GitHub issues from these tasks, include**:

### Required Reading (in order):
1. **Constitution**: `.specify/memory/constitution.md` (quality gates, PII handling)
2. **Feature Spec**: `specs/[###-feature-name]/spec.md` (requirements, acceptance criteria)
3. **Implementation Plan**: `specs/[###-feature-name]/plan.md` (architecture, tech stack)
4. **This Task List**: `specs/[###-feature-name]/tasks.md` (specific task details)
5. **API Contract** (SOURCE OF TRUTH): `specs/[###-feature-name]/contracts/*.yaml`
6. **Data Model**: `specs/[###-feature-name]/data-model.md` (database schema)

### Code Pattern References:
Point Copilot to existing implementations as examples:
- Controller pattern: `src/controllers/v1/*.controller.ts`
- Service pattern: `src/services/*/*.service.ts`
- Schema validation: `src/schemas/*.schema.ts`
- Unit tests: `src/**/*.spec.ts`
- E2E tests: `src/**/*.e2e-spec.ts`

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->


## Phase 0: Documentation & Constitution Compliance (Mandatory for Every Feature)

- [ ] T001 Verify OpenAPI contract exists and matches implementation requirements
- [ ] T002 Ensure API implementation follows contract-first design principles

## Retry Logic

- Only API calls require retry logic. Database interactions should not implement retry unless explicitly required for transactional integrity or error handling.


## Phase 0.1: Production Readiness Gates (Mandatory for Release)

<!--
  IMPORTANT: These gates should match your project's constitution.
  The /speckit.tasks command will populate this section based on your constitution.
-->

- [ ] T003 Contract Validation: API implementation matches OpenAPI contract exactly
- [ ] T004 Observability: [Logging/tracing requirements per your constitution]
- [ ] T005 Security: [Security scan requirements per your constitution]
- [ ] T006 [Project-Specific Gate]: [Add gates from your constitution]

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Dependencies**: None (all parallelizable)

- [ ] T010 [P] Create project structure per implementation plan
  - Branch: `feat/JIRA-ID-1_project-structure`
  - Base: `main`
  - Files: `src/`, `tests/`, `package.json`, `tsconfig.json`
  
- [ ] T011 [P] Initialize [language] project with [framework] dependencies
  - Branch: `feat/JIRA-ID-2_dependencies`
  - Base: `main`
  - Files: `package.json`, `package-lock.json`
  
- [ ] T012 [P] Configure linting and formatting tools
  - Branch: `feat/JIRA-ID-3_linting`
  - Base: `main`
  - Files: `eslint.config.js`, `.prettierrc`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Dependencies**: Depends on Phase 1 completion

**Blocks**: All Phase 3+ tasks (user story implementation)

Examples of foundational tasks (adjust based on your project):

- [ ] T020 [D:T010] [B:T030,T040] Setup database schema and migrations framework
  - Branch: `feat/JIRA-ID-4_database-schema`
  - Base: `main` (if T010 merged) OR `feat/JIRA-ID-1_project-structure` (stacked)
  - Files: `prisma/schema.prisma`, migrations
  
- [ ] T021 [P] [B:T030+] Implement authentication/authorization framework
  - Branch: `feat/JIRA-ID-5_auth`
  - Base: `main`
  - Files: `src/middleware/auth.middleware.ts`
  
- [ ] T006 [P] [B:T010+] Setup API routing and middleware structure
  - Branch: `feat/JIRA-ID-6_routing`
  - Base: `main`
  - Files: `src/routes/`, `src/middleware/`
  
- [ ] T007 [D:T004] [B:T010+] Create base models/entities that all stories depend on
  - Branch: `feat/JIRA-ID-7_base-models`
  - Base: `feat/JIRA-ID-4_database-schema` (stacked on T004)
  - Files: `src/models/base.model.ts`
  
- [ ] T008 [P] [B:T010+] Configure error handling and logging infrastructure
  - Branch: `feat/JIRA-ID-8_error-handling`
  - Base: `main`
  - Files: `src/middleware/error-handler.ts`, `src/utils/logger.ts`
  
- [ ] T009 [P] [B:T010+] Setup environment configuration management
  - Branch: `feat/JIRA-ID-9_env-config`
  - Base: `main`
  - Files: `.env.example`, `src/config/`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

**Merge Strategy**: 
- Sequential: Merge T004-T009 to `main` before starting Phase 3
- Stacked: Create Phase 3 branches from Phase 2 branches, rebase after Phase 2 merges

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

**Dependencies**: Requires Phase 2 complete (T004-T009)

**Blocks**: None (independent story)

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [D:Phase2] [US1] Contract test for [endpoint] in tests/contract/test_[name].py
  - Branch: `feat/JIRA-ID-10_us1-contract-tests`
  - Base: `main` (after Phase 2) OR `feat/JIRA-ID-6_routing` (stacked)
  - Copilot time: 30-45 min
  
- [ ] T011 [P] [D:Phase2] [US1] Integration test for [user journey] in tests/integration/test_[name].py
  - Branch: `feat/JIRA-ID-11_us1-integration-tests`
  - Base: `main` (after Phase 2) OR `feat/JIRA-ID-6_routing` (stacked)
  - Copilot time: 30-45 min

### Implementation for User Story 1

- [ ] T012 [P] [D:Phase2] [B:T014] [US1] Create [Entity1] model in src/models/[entity1].py
  - Branch: `feat/JIRA-ID-12_entity1-model`
  - Base: `main` (after Phase 2) OR `feat/JIRA-ID-7_base-models` (stacked)
  - Copilot time: 20-30 min
  
- [ ] T013 [P] [D:Phase2] [B:T014] [US1] Create [Entity2] model in src/models/[entity2].py
  - Branch: `feat/JIRA-ID-13_entity2-model`
  - Base: `main` (after Phase 2) OR `feat/JIRA-ID-7_base-models` (stacked)
  - Copilot time: 20-30 min
  
- [ ] T014 [D:T012,T013] [B:T015] [US1] Implement [Service] in src/services/[service].py
  - Branch: `feat/JIRA-ID-14_service`
  - Base: `feat/JIRA-ID-12_entity1-model` (stacked on T012, assumes T013 merged)
  - Copilot time: 45-60 min
  
- [ ] T015 [D:T014] [B:T016] [US1] Implement [endpoint/feature] in src/[location]/[file].py
  - Branch: `feat/JIRA-ID-15_endpoint`
  - Base: `feat/JIRA-ID-14_service` (stacked on T014)
  - Copilot time: 30-45 min
  
- [ ] T016 [D:T015] [US1] Add validation and error handling
  - Branch: `feat/JIRA-ID-16_validation`
  - Base: `feat/JIRA-ID-15_endpoint` (stacked on T015)
  - Copilot time: 20-30 min
  
- [ ] T017 [D:T015] [US1] Add logging for user story 1 operations
  - Branch: `feat/JIRA-ID-17_logging`
  - Base: `feat/JIRA-ID-15_endpoint` (stacked on T015, parallel with T016)
  - Copilot time: 15-20 min

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

**Stacked PR Strategy**:
- T010, T011 can start immediately (parallel)
- T012, T013 can start immediately (parallel)
- T014 stacks on T012 (or wait for T012+T013 merge)
- T015 stacks on T014
- T016, T017 stack on T015 (parallel)

**Merge Order**: T010→T011→T012→T013→T014→T015→(T016+T017 parallel)

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T019 [P] [US2] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create [Entity] model in src/models/[entity].py
- [ ] T021 [US2] Implement [Service] in src/services/[service].py
- [ ] T022 [US2] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T023 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T025 [P] [US3] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create [Entity] model in src/models/[entity].py
- [ ] T027 [US3] Implement [Service] in src/services/[service].py
- [ ] T028 [US3] Implement [endpoint/feature] in src/[location]/[file].py

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

## Caching Strategy [OPTIONAL]

<!--
  Include this section if the feature involves caching.
  Remove if not applicable.
-->

- Which API endpoints or data should be cached?
- What is the expected cache duration (TTL) for each cached item?
- Are there any cache invalidation or refresh requirements?
- Caching tool: [Per project conventions]

## Retry Logic [OPTIONAL]

<!--
  Include this section if the feature involves external API calls.
  Remove if not applicable.
-->

- Which API endpoints or operations require retry logic?
- What are the recommended retry parameters (max attempts, backoff strategy, delay)?
- Suggested strategy: Exponential backoff (1s, 2s, 4s, max 3 retries)
- Should retries be applied for specific error types only (e.g., network, 5xx, rate limit)?
- Are there any idempotency or side-effect concerns with retries?

---

## Custom Checklists (Optional)

Use this section for ad-hoc validation checklists generated by `/speckit.checklist`.

**Note**: Checklists are "unit tests for requirements" - they validate spec quality, not implementation correctness.

### [CHECKLIST TYPE] - [DATE]

**Purpose**: [Brief description of what this checklist validates]

| ID | Check | Status |
|----|-------|--------|
| CHK001 | [First checklist item with clear validation criteria] | [ ] |
| CHK002 | [Second checklist item] | [ ] |
| CHK003 | [Third checklist item] |

**Compliance Notes**:
- [Constitution requirements per your project]
