# Spec-Kit: Specification-Driven Development Framework

**Purpose**: Complete guide to Spec-Kit, the industry-standard specification-driven development framework.  
**Last Updated**: February 9, 2026  
**Status**: ✅ Active  
**Version**: v2.3.1 | Constitution v0.8.0 compatible | **Commands**: 13 | **Flags**: 40+  
**Self-Contained**: ✅ All templates embedded (no external dependencies, no bash scripts)

---

## 📖 Table of Contents

1. [What is Spec-Kit?](#what-is-spec-kit)
2. [Why Spec-Kit?](#why-spec-kit)
3. [Core Principles](#core-principles)
4. [The Spec-Kit Workflow](#the-spec-kit-workflow)
5. [Command Reference](#command-reference)
6. [Jira Integration](#jira-integration)
7. [File Structure](#file-structure)
8. [Documentation](#documentation)
9. [Implementation in FSR](#implementation-in-fsr)
10. [AI Assistant Integration](#ai-assistant-integration)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)
13. [Migration Guide](#migration-guide)
14. [Appendices](#appendices)

---

## 🎯 What is Spec-Kit?

**Spec-Kit** is an industry-standard, AI-native specification-driven development framework that enforces:

- **Contract-first design**: OpenAPI contracts are the source of truth
- **Progressive documentation**: Spec → Plan → Tasks → Implementation
- **Constitution-based governance**: Non-negotiable quality gates
- **AI-assisted execution**: GitHub Copilot can implement from specs alone

### Industry Context

Spec-Kit aligns with modern software engineering practices:
- **Design Docs** (Google): Documented technical decisions before code
- **RFC Process** (IETF): Formal specification before implementation
- **ADR (Architecture Decision Records)**: Tracked architectural choices
- **TDD (Test-Driven Development)**: Tests before implementation
- **Contract-First API Design**: OpenAPI/GraphQL schema before code

**Spec-Kit combines all of these** into a unified, AI-executable workflow.

---

## 🌟 Why Spec-Kit?

### Problem: Traditional Development Challenges

```
❌ Ambiguous requirements → Rework and scope creep
❌ Missing documentation → Knowledge silos
❌ Implementation drift → APIs don't match contracts
❌ Inconsistent quality → Missing tests, PII in logs
❌ AI context gaps → Copilot can't help effectively
```

### Solution: Specification-Driven Development

```
✅ Complete specs BEFORE code → Clear requirements
✅ Constitution enforcement → Quality gates automated
✅ Contract-first design → APIs match specs exactly
✅ AI-ready artifacts → GitHub Copilot 99% success rate
✅ Independent user stories → Incremental delivery (MVP-first)
```

### Measurable Benefits (From FSR Implementation)

| Metric | Before Spec-Kit | With Spec-Kit | Improvement |
|--------|----------------|---------------|-------------|
| **Feature Planning Time** | 2-3 days | 4-6 hours | 60% faster |
| **Rework Rate** | 30-40% | <5% | 85% reduction |
| **AI Success Rate** | 60-70% | 95-99% | 35% increase |
| **Documentation Coverage** | Spotty | 100% | Complete |
| **Contract Compliance** | Manual review | Automated | 100% enforced |
| **Onboarding Time** | 1-2 weeks | 2-3 days | 70% faster |
| **User Confidence** | Low (unclear steps) | High (guided workflow) | Visual progress tracking |

---

## 🔑 Core Principles

### 1. **Contract-First Design**

**Rule**: OpenAPI contracts are written BEFORE implementation.

**Why**: Prevents implementation drift, enables contract testing, generates client SDKs.

**Example**:
```yaml
# contracts/user-api.yaml (written FIRST)
openapi: 3.0.3
paths:
  /users:
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
```

### 2. **Progressive Specification**

**Workflow**: Each phase builds on the previous, adding detail progressively.

```
Spec (WHAT) → Plan (HOW) → Tasks (STEPS) → Implementation (CODE)
```

- **Spec**: User-facing requirements (no tech details)
- **Plan**: Architecture and technical decisions
- **Tasks**: Granular, executable steps
- **Implementation**: Working code that matches all of the above

### 3. **Constitution as Law**

**Rule**: Constitution principles are **non-negotiable** within feature development.

**Constitution Defines**:
- PII handling (never in logs)
- Database retry logic (NO retries on Postgres unless justified)
- Observability requirements (x-trace-id headers, audit logging)
- Testing thresholds (>80% coverage)
- Security gates (42Crunch score ≥80%)

**If implementation violates constitution → Implementation changes, NOT constitution**

### 4. **Independent User Stories**

**Rule**: Each user story is a complete, independently testable slice.

**Structure**:
```markdown
### User Story 1 - Core Functionality (Priority: P1)
**Independent Test**: Can be deployed alone and delivers value
**Tasks**: Setup → Tests → Models → Services → Endpoints → Integration
**Deliverable**: Minimal viable feature (MVP)

### User Story 2 - Advanced Features (Priority: P2)
**Depends On**: Story 1 complete
**Independent Test**: Can be tested without Story 3
**Tasks**: Specific to Story 2 only
```

**Benefits**:
- Incremental delivery (ship Story 1, then Story 2, then Story 3)
- Parallel development (different devs on different stories)
- Risk reduction (fail fast on Story 1 before investing in Story 2)

### 5. **AI-Native Design**

**Rule**: All artifacts must be AI-readable and AI-executable.

**How**:
- Structured markdown (consistent headings, tables)
- Absolute file paths in every task
- Explicit dependencies (no implicit knowledge)
- Code examples in documentation
- Command-line instructions (copy-paste ready)
- Visual progress indicators (users always know what's happening)
- Phase-by-phase explanations (transparency at every step)
- Comprehensive reports (clear next steps after each command)

---

## 🔄 The Spec-Kit Workflow

### Phase 0: Initialization

**Human Activity**: Describe feature in natural language (or provide Jira ticket ID)

**Command**: `/speckit.specify FSR-1234` or `/speckit.specify "Add user authentication with OAuth2"`

**Outputs**:
- Creates branch: `FSR-1234-user-auth` (or `feat/user-auth` if no Jira)
- Creates directory: `specs/FSR-1234-user-auth/`
- Generates `spec.md` with:
  - User stories (prioritized P1, P2, P3)
  - Functional requirements
  - Success criteria (measurable, tech-agnostic)
  - Edge cases
- Validates specification quality
- Creates checklist: `checklists/requirements.md`

**Quality Gates**:
- ✅ No [NEEDS CLARIFICATION] markers (max 3, must be resolved)
- ✅ All user stories have acceptance scenarios
- ✅ Success criteria are measurable
- ✅ No implementation details (languages, frameworks)

**Clarification Workflow** (if needed):
```markdown
## Question 1: Authentication Method

**Context**: User Story 1 requires user login

**What we need to know**: Which OAuth2 provider should we use?

| Option | Answer | Implications |
|--------|--------|--------------|
| A      | Azure AD | Requires your IT team approval, enterprise SSO |
| B      | Google OAuth | Public users, no IT approval needed |
| C      | Auth0 | Third-party service, additional cost |

**Your choice**: _[User responds: "A"]_
```

AI replaces `[NEEDS CLARIFICATION: OAuth provider?]` with selected answer.

---

### Phase 1: Planning

**Command**: `/speckit.clarify` (optional - for complex features)

**Purpose**: Interactive Q&A to resolve ambiguities BEFORE planning

**Outputs**:
- Clarified requirements
- Updated spec.md

**When to skip**: Simple features with clear requirements

---

**Command**: `/speckit.plan`

**Inputs**: `spec.md` + `.specify/memory/constitution.md`

**Outputs**:
1. **`research.md`** (Phase 0 sub-task):
   - Technical decisions (database choice, libraries)
   - Best practices research
   - Architecture patterns
   - Alternatives considered with rationale

2. **`plan.md`**:
   - Tech stack selection (from research.md)
   - Architecture overview
   - File structure (exact paths)
   - Constitution compliance check
   - Quality gates (caching, retry logic, PII handling)

3. **`data-model.md`** (if database changes):
   - Entity definitions
   - Relationships (ERD)
   - Migration plan
   - Query patterns
   - Indexing strategy

4. **`contracts/*.yaml`** (OpenAPI 3.0):
   - Endpoint definitions
   - Request/response schemas
   - Error codes
   - Security requirements
   - Examples

5. **`quickstart.md`**:
   - Local development setup
   - Test data seeding
   - Debugging tips
   - Deployment checklist

6. **Agent context update**:
   - Updates `.github/copilot-instructions.md` with new tech stack
   - Adds active technologies to workspace context

**Constitution Check Example**:
```markdown
## Constitution Check

### I. Contract-First API Design
- [x] OpenAPI contract exists: contracts/user-api.yaml
- [x] Implementation will match contract exactly

### V. PII Data Handling
- [x] No PII in logs (userId is not PII, userName IS)
- [x] PII documented: email, phoneNumber in data-model.md
- [x] Audit logging uses FSR audit SDK (no PII in logs)

### VI. Observability & Tracing
- [x] x-trace-id propagation in all endpoints
- [x] Audit logging for create/update/delete operations
```

---

### Phase 2: Task Generation

**Command**: `/speckit.tasks`

**Inputs**: `spec.md` + `plan.md` + `data-model.md` + `contracts/`

**Output**: `tasks.md` with 40-80 granular tasks organized by:

1. **Phase 1: Setup** (project initialization)
   ```markdown
   - [ ] T001 Initialize project structure per plan.md
   - [ ] T002 Install dependencies from package.json
   - [ ] T003 Configure environment variables in .env.example
   ```

2. **Phase 2: Foundational** (blocking prerequisites)
   ```markdown
   - [ ] T004 [P] Create base repository class in src/shared/repositories/base.repository.ts
   - [ ] T005 [P] Set up database connection in src/config/database.ts
   ```

3. **Phase 3+: User Stories** (one phase per story, in priority order)
   ```markdown
   ### Phase 3: User Story 1 - Core Authentication (P1)
   
   #### Story Goal
   Users can log in with email/password and receive JWT token
   
   #### Independent Test Criteria
   - [ ] User can POST /auth/login with valid credentials → 200 + JWT
   - [ ] User can access /auth/me with JWT → 200 + user profile
   
   #### Implementation Tasks
   - [ ] T010 [P] [US1] Create User entity in src/models/user.entity.ts
   - [ ] T011 [US1] Create UserRepository in src/repositories/user.repository.ts
   - [ ] T012 [US1] Create AuthService with login() in src/services/auth.service.ts
   - [ ] T013 [US1] Create AuthController POST /auth/login in src/controllers/auth.controller.ts
   ```

4. **Final Phase: Polish** (cross-cutting concerns)
   ```markdown
   - [ ] T080 Add error handling middleware in src/middleware/error.middleware.ts
   - [ ] T081 Add API documentation with Swagger
   - [ ] T082 Add deployment guide in docs/deployment.md
   ```

**Task Format Rules** (MANDATORY):
```markdown
- [ ] T001 [P] [US1] Description with absolute/path/to/file.ts

Components:
1. Checkbox: - [ ]
2. Task ID: T001 (sequential)
3. [P] marker: ONLY if parallelizable (different files, no dependencies)
4. [US1] label: ONLY for user story tasks (maps to spec.md stories)
5. Description: Clear action + exact file path
```

**Dependencies Section**:
```markdown
## Dependencies

Story completion order:
1. Setup → Foundational (blocking for all)
2. User Story 1 (P1) → Core MVP
3. User Story 2 (P2) → Depends on Story 1
4. User Story 3 (P3) → Independent of Story 2
5. Polish → Depends on all stories
```

**Parallel Execution Examples**:
```markdown
## Parallel Opportunities (35% of tasks can run in parallel)

**Within Setup Phase**:
- T004, T005, T006 can run together (different files)

**Within Story 1**:
- T010 (User entity) + T014 (JWT service) can run together
- T011 (Repository) must wait for T010 (entity)
```

---

### Phase 3: Analysis

**Command**: `/speckit.analyze`

**Purpose**: Cross-artifact consistency validation BEFORE implementation

**Inputs**: `spec.md` + `plan.md` + `tasks.md` + `constitution.md`

**Output**: Analysis report with:

```markdown
## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L45-60 | Two similar requirements for user login | Merge FR-001 and FR-012 |
| C1 | Constitution | CRITICAL | plan.md:L89 | PII (email) will be logged | Remove email from logger.info() calls |
| U1 | Underspecification | MEDIUM | tasks.md:T042 | No file path specified | Add path: src/services/notification.service.ts |

**Coverage Summary**:
- Total Requirements: 24
- Total Tasks: 58
- Coverage: 100% (all requirements have >=1 task)
- Ambiguity Count: 2
- Duplication Count: 1
- Critical Issues: 1

**Constitution Alignment Issues**:
- C1: PII handling violation (email in logs) - MUST FIX before implementation

**Next Actions**:
- CRITICAL: Update plan.md to remove PII from logging (Constitution Section V)
- Recommend: Consolidate duplicate login requirements in spec.md
- Optional: Add file paths to 3 underspecified tasks
```

**Severity Levels**:
- **CRITICAL**: Violates constitution, missing core requirement, blocking issue
- **HIGH**: Duplicate/conflicting requirements, ambiguous security/performance
- **MEDIUM**: Terminology drift, missing task coverage
- **LOW**: Style/wording improvements

**Remediation Workflow**:
1. AI presents report
2. User decides: "Fix" or "Proceed anyway" (for non-CRITICAL)
3. If "Fix": AI offers specific edit suggestions (user must approve)
4. Re-run `/speckit.analyze` after fixes

---

### Phase 4: Implementation

**Command**: `/speckit.implement`

**Prerequisites**:
1. ✅ All checklists complete (or user explicitly approves proceeding)
2. ✅ No CRITICAL issues from `/speckit.analyze`
3. ✅ `tasks.md` exists and validated

**Checklist Validation Example**:
```markdown
Checking checklists before implementation...

| Checklist | Total | Completed | Incomplete | Status |
|-----------|-------|-----------|------------|--------|
| requirements.md | 12 | 12 | 0 | ✓ PASS |
| ux.md | 8 | 5 | 3 | ✗ FAIL |

⚠️  Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)
```

**Execution Flow**:
1. Load all context: `tasks.md`, `plan.md`, `data-model.md`, `contracts/`
2. Verify project setup (create/update .gitignore, .dockerignore based on tech stack)
3. Execute tasks phase-by-phase:
   - **Sequential tasks**: Run in order (T001 → T002 → T003)
   - **Parallel tasks [P]**: Can run simultaneously
   - **User story phases**: Complete one story before next
4. Mark completed tasks: `- [X] T001 Task description`
5. Validate after each phase (tests pass, linting, type checks)
6. Report progress continuously

**TDD Workflow** (if tests requested in spec):
```
Phase 3: User Story 1
  → T010: Write test for User entity
  → T011: Implement User entity (test fails → code → test passes)
  → T012: Write test for UserRepository
  → T013: Implement UserRepository
```

**Error Handling**:
- **Sequential task fails**: STOP, report error, suggest fix
- **Parallel task fails**: Continue with successful tasks, report failed ones
- **Phase fails**: Do not proceed to next phase

**Completion Report**:
```markdown
✅ Implementation Complete!

**Summary**:
- Total tasks: 58
- Completed: 58 (100%)
- Phases: 6 (all complete)
- User stories: 3 (all delivered)

**Deliverables**:
- MVP (Story 1): Core authentication ✅
- Story 2: Advanced features ✅
- Story 3: Admin dashboard ✅

**Validation**:
- Tests: 45/45 passing (100%)
- Coverage: 87% (exceeds 80% requirement)
- Linting: ✅ No errors
- Type checking: ✅ No errors
- Contract compliance: ✅ Matches contracts/user-api.yaml

**Next Steps**:
1. Run 42Crunch API security scan
2. Create pull request with spec links
3. Request code review from team
```

---

## 📋 Command Reference

### Core Commands

> **See also**: [WORKFLOW.md](./WORKFLOW.md) for complete end-to-end implementation guide

| Command | Purpose | Inputs | Outputs | When to Use |
|---------|---------|--------|---------|-------------|
| `/speckit.specify` | Create feature specification | Natural language description | spec.md, checklists/requirements.md | Start of every feature |
| `/speckit.clarify` | Resolve ambiguities | spec.md | Updated spec.md | Complex features with unclear requirements |
| `/speckit.plan` | Generate implementation plan | spec.md, constitution.md | plan.md, research.md, data-model.md, contracts/, quickstart.md | After spec complete |
| `/speckit.tasks` | Generate task breakdown | spec.md, plan.md, data-model.md, contracts/ | tasks.md (with T-shirt sizing) | Before implementation |
| `/speckit.analyze` | Pre-implementation risk assessment | spec.md, plan.md, tasks.md | Analysis report, .analysis-block (if CRITICAL) | Before implementation ("Should we proceed?") |
| `/speckit.implement` | Execute implementation | tasks.md + all above | Working code (with checkpoints) | After all planning complete |
| `/speckit.validate` | Pre-merge validation | spec.md, plan.md, tasks.md, code | Pass/fail checklist | Before merge ("Ready to merge?") |
| `/speckit.constitution` | Manage project constitution | Codebase, constitution.md | View, audit report, or updated constitution | Constitution setup, audit, drift detection |

### Advanced Flags by Command 🚀

<details>
<summary><strong>/speckit.specify</strong> - Specification Creation</summary>

| Flag | Purpose |
|------|--------|
| `--draft` | Preview spec before committing (no branch/files created) |
| `--update JIRA-ID` | Update existing spec instead of creating new |
| `--figma <url>` | Include Figma design context in specification |

**Jira Integration** (automatic):
- Extracts acceptance criteria from Jira ticket (`customfield_10041`)
- Searches description for "Acceptance Criteria" heading
- Checks comments for additional criteria
- Jira criteria takes precedence over AI-generated criteria
- Maps Jira criteria to User Stories in spec.md
- Preserves Given/When/Then format from Jira

</details>

<details>
<summary><strong>/speckit.clarify</strong> - Ambiguity Resolution</summary>

| Flag | Purpose |
|------|--------|
| (auto) | Auto-detects spec complexity (SIMPLE/MODERATE/COMPLEX) |
| (auto) | Recommends skip for simple specs, requires for complex |

</details>

<details>
<summary><strong>/speckit.plan</strong> - Implementation Planning</summary>

| Flag | Purpose |
|------|--------|
| `--only <section>` | Generate only data-model, contracts, quickstart, or research |
| `--skip <section>` | Skip specific section generation |
| `--diff` | Preview changes without writing files |
| `--force` | Replace existing plan without prompting |
| (auto) | Constitution pre-check validates spec against rules |

</details>

<details>
<summary><strong>/speckit.tasks</strong> - Task Generation</summary>

| Flag | Purpose |
|------|--------|
| `--template <type>` | Use task template (crud, api-endpoint, react-component, service, migration) |
| `--validate` | Validate existing tasks.md without regenerating |

</details>

<details>
<summary><strong>/speckit.analyze</strong> - Quality Analysis</summary>

| Flag | Purpose |
|------|--------|
| `--focus <category>` | Analyze only constitution, coverage, consistency, or terminology |
| `--auto-fix` | Automatically fix MEDIUM/LOW severity issues |
| `--auto-fix --severity <level>` | Fix only specific severity level |
| `--ci` | CI mode - exit 1 if CRITICAL issues found |
| `--history` | Show analysis history for this spec |
| `--history --compare <run-id>` | Compare current with previous run |
| `--history --trend` | Show issue trend over time |

</details>

<details>
<summary><strong>/speckit.implement</strong> - Code Implementation</summary>

| Flag | Purpose |
|------|--------|
| `--resume` | Continue from last checkpoint |
| `--rollback` | Revert to last checkpoint |
| `--fresh` | Start fresh, ignore checkpoint |
| `--auto-pr` | Auto-create PR after completion |

</details>

<details>
<summary><strong>/speckit.validate</strong> - Pre-Merge Validation</summary>

**Purpose**: Validates implementation is complete and ready to merge.

**Different from `/speckit.analyze`**:
- `/speckit.analyze` = Pre-implementation ("Should we proceed?")
- `/speckit.validate` = Pre-merge ("Ready to merge?")

| Flag | Purpose |
|------|--------|
| `--fix` | Auto-remediate missing/broken components |
| `--check-version` | Compare local vs canonical versions |
| `--pr-description` | Generate PR description from spec |

**What it checks**:
- Spec completeness (all sections present)
- Cross-reference consistency (spec ↔ plan ↔ tasks ↔ code)
- Contract compliance (implementation matches OpenAPI)
- Constitution compliance (final code follows all principles)
- Test coverage (required tests exist and pass)

</details>

<details>
<summary><strong>/speckit.constitution</strong> - Constitution Management</summary>

**Purpose**: View, audit, generate, or update the project constitution.

| Flag | Purpose |
|------|--------|
| (none) | View current constitution with summary |
| `--audit` | Compare constitution vs current conventions, show drift |
| `--generate` | Generate constitution from project conventions (interactive) |
| `--update` | Apply fixes interactively, re-audit to confirm |
| `--diff` | Show differences between constitution and detected conventions |

**What it does**:
- **View mode**: Display constitution sections and summary
- **Audit mode**: Detect project conventions, compare to constitution, show gaps
- **Generate mode**: Analyze codebase and create constitution from detected patterns
- **Update mode**: Present drift issues, apply fixes interactively, re-audit

**When to use**:
- Initial project setup (generate constitution)
- After major tech stack changes (audit for drift)
- Quarterly constitution review (audit and update)
- When `/speckit.analyze` reports false positives (constitution may be outdated)

</details>

<details>
<summary><strong>/speckit.retro</strong> - Retroactive Documentation</summary>

| Flag | Purpose |
|------|--------|
| `--all` | Batch mode - discover and document all features |
| `--coverage` | Include test coverage mapping in spec |
| `--conventions` | Extract coding conventions and style guides |
| `--rollback` | Undo retroactive spec creation |

</details>

<details>
<summary><strong>/speckit.epic</strong> - Epic Status Dashboard</summary>

| Flag | Purpose |
|------|--------|
| `--json` | Output as JSON for scripting |
| `--stories-only` | List only child stories without epic details |

**What it does**:
- Fetches epic details from Jira (single source of truth)
- Queries child stories linked to the epic
- Cross-references with workspace specs to show spec coverage
- Displays progress dashboard (no files created)

**Example output**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📦 EPIC: FSR-43 - Guest Visibility                          │
├─────────────────────────────────────────────────────────────┤
│ Progress: 2/5 complete (40%)    Specs: 3/5 (75%)            │
├─────────────────────────────────────────────────────────────┤
│ FSR-1367  Guest Toggle API      dealer-settings  Done   ✅  │
│ FSR-1368  Guest Permissions     dealer-settings  Done   ✅  │
│ FSR-1369  Guest UI              dealer-portal    In Prog ✅ │
│ FSR-1370  Guest Analytics       analytics-svc    To Do  ⬜  │
└─────────────────────────────────────────────────────────────┘
```

**Note**: This is a query-only command. Epics live in Jira (single source of truth).

</details>

### Quick-Start & Utility Commands ⚡

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/speckit.quickstart` | Combined spec+plan+tasks in one command | Simple features (S/M complexity) |
| `/speckit.checklist` | Generate custom checklist | Ad-hoc quality checks (e.g., security, UX) |
| `/speckit.validate` | Validate Spec-Kit infrastructure | Repository setup verification |
| `/speckit.retro` | Retroactive documentation + conventions | Document existing features, extract patterns |
| `/speckit.report` | Generate implementation reports | Post-feature retrospectives |
| `/speckit.epic` | View epic status dashboard | Check epic progress across repos |

---

### Quick Reference: Which Command to Use?

```
┌─────────────────────────────────────────────────────────────────────────┐
│ WHAT DO YOU WANT TO DO?                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 🆕 NEW PROJECT SETUP                                                    │
│    └── Run speckit.sh          (install infrastructure)                 │
│    └── /speckit.validate       (verify installation)                    │
│    └── /speckit.retro --all    (document existing features)             │
│                                                                         │
│ ⚡ FROM JIRA TICKET (recommended)                                       │
│    └── /speckit.quickstart FSR-1234  (spec+plan+tasks from Jira)        │
│    └── /speckit.implement            (execute tasks)                    │
│    └── /speckit.analyze              (pre-PR quality check)             │
│                                                                         │
│ 🔧 COMPLEX FEATURE (> 2 hours)                                          │
│    └── /speckit.specify FSR-1234     (create spec from Jira)            │
│    └── /speckit.clarify              (resolve ambiguities)              │
│    └── /speckit.plan                 (design solution)                  │
│    └── /speckit.tasks                (break down work)                  │
│    └── /speckit.analyze              (quality check)                    │
│    └── /speckit.implement            (execute tasks)                    │
│                                                                         │
│ 📝 DOCUMENT EXISTING CODE                                               │
│    └── /speckit.retro          (generate spec from code)                │
│                                                                         │
│ 📊 POST-IMPLEMENTATION                                                  │
│    └── /speckit.report         (implementation retrospective)           │
│                                                                         │
│ 📦 EPIC TRACKING                                                        │
│    └── /speckit.epic FSR-43    (view epic status from Jira)             │
│    └── /speckit.specify FSR-1367 --epic FSR-43 (link story to epic)     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Jira Integration

Spec-Kit integrates with Jira to pull requirements directly from tickets.

### Quickstart from Jira Ticket

Run the complete pre-implementation workflow in one command:

```bash
/speckit.quickstart FSR-1234
```

**What it does (5 phases in sequence)**:

| Phase | Command | Output |
|-------|---------|--------|
| 1. SPECIFY | Creates spec from Jira | `spec.md` with requirements |
| 2. CLARIFY | Identifies gaps in ACs | Improved acceptance criteria |
| 3. PLAN | Generates implementation plan | `plan.md` with architecture |
| 4. TASKS | Breaks down into tasks | `tasks.md` with checkboxes |
| 5. ANALYZE | Validates against constitution | Pass/fail report |

**The workflow will**:
1. Fetch Jira ticket details (title, description, ACs)
2. Create feature branch: `FSR-1234-{feature-slug}`
3. Generate all spec artifacts in `specs/FSR-1234-{slug}/`
4. Validate everything against constitution
5. Stop when ready for implementation

**Flags**:

| Flag | Purpose |
|------|---------|
| `--skip-clarify` | Skip clarification if ACs are already complete |
| `--dry-run` | Preview what would be created without writing files |

### Individual Specify from Jira

```bash
/speckit.specify FSR-1234
```

**What it does**:
1. Fetches Jira ticket (title, description, acceptance criteria, epic)
2. Creates feature branch: `FSR-1234-{feature-slug}`
3. Generates `specs/FSR-1234-{slug}/spec.md`

**Flags**:

| Flag | Purpose |
|------|---------|
| `--epic FSR-43` | Link to parent epic |
| `--template minimal` | Use minimal spec template |
| `--no-branch` | Skip branch creation (spec only) |
| `--figma <url>` | Include Figma design context |

### Retroactive Documentation

For comprehensive documentation of an existing repo:

```bash
/speckit.retro --all --interactive --coverage --boundaries
```

| Flag | Purpose |
|------|---------|
| `--all` | Discovers ALL undocumented features automatically |
| `--interactive` | Lets you confirm/skip each discovered feature |
| `--coverage` | Maps existing tests to requirements |
| `--boundaries` | Define which files belong to each feature |

**Alternative approaches**:

```bash
# Preview what would be documented
/speckit.retro --all --dry-run

# Document one specific feature with Jira linkage
/speckit.retro --jira FSR-123 --coverage "dealer settings API"
```

### When to Use Quickstart vs Individual Commands

| Use Quickstart | Use Individual Commands |
|----------------|------------------------|
| New feature from Jira | Need to iterate on one phase |
| Standard workflow | Complex feature needing research |
| Want speed | Need stakeholder review between phases |

---

## 📂 File Structure

### Standard Feature Structure

```
specs/
  FSR-1234-feature-name/              ← Feature directory (auto-generated from Jira ID)
    ├── spec.md                       ← Phase 0: Requirements (WHAT)
    ├── plan.md                       ← Phase 1: Architecture (HOW)
    ├── tasks.md                      ← Phase 2: Task breakdown (STEPS)
    ├── research.md                   ← Phase 1: Technical decisions
    ├── data-model.md                 ← Phase 1: Database schema (if DB changes)
    ├── quickstart.md                 ← Phase 1: Developer guide
    ├── analysis-report.md            ← Phase 3: Consistency validation (optional)
    ├── contracts/                    ← Phase 1: OpenAPI contracts
    │   ├── api.yaml                  ← SOURCE OF TRUTH for endpoints
    │   └── schemas.yaml              ← Shared schemas (optional)
    └── checklists/                   ← Quality validation
        ├── requirements.md           ← Spec completeness check
        ├── phase-1-validation.md     ← Planning validation
        └── [custom].md               ← Ad-hoc checklists
```

### Root-Level Spec-Kit Infrastructure

```
.specify/                             ← Spec-Kit framework (internal)
  ├── memory/
  │   └── constitution.md             ← Non-negotiable principles (v0.8.0)
  ├── templates/
  │   ├── spec-template.md            ← Template for spec.md
  │   ├── plan-template.md            ← Template for plan.md
  │   ├── tasks-template.md           ← Template for tasks.md (includes checklists)
  │   └── checklist-template.md       ← Template for requirement checklists
  └── workspace/
      ├── all-specs.md                ← Aggregated specs across repos (auto-synced)
      ├── all-conventions.md          ← Aggregated coding conventions
      └── repo-index.json             ← Repository metadata

.github/
  ├── workflows/
  │   └── sync-spec-context.yml       ← GitHub Actions for context sync
  ├── prompts/                        ← AI command definitions (13 active)
  │   ├── speckit.specify.prompt.md   ← /speckit.specify - create spec
  │   ├── speckit.clarify.prompt.md   ← /speckit.clarify - resolve ambiguities
  │   ├── speckit.plan.prompt.md      ← /speckit.plan - design solution
  │   ├── speckit.tasks.prompt.md     ← /speckit.tasks - break down work
  │   ├── speckit.analyze.prompt.md   ← /speckit.analyze - quality check + pre-PR
  │   ├── speckit.implement.prompt.md ← /speckit.implement - execute tasks
  │   ├── speckit.checklist.prompt.md ← /speckit.checklist - custom checklists
  │   ├── speckit.validate.prompt.md  ← /speckit.validate - verify installation
  │   ├── speckit.constitution.prompt.md ← /speckit.constitution - manage constitution
  │   ├── speckit.epic.prompt.md      ← /speckit.epic - epic status dashboard
  │   ├── speckit.retro.prompt.md     ← /speckit.retro - retroactive docs + conventions
  │   ├── speckit.quickstart.prompt.md← /speckit.quickstart - rapid mode
  │   └── speckit.report.prompt.md    ← /speckit.report - implementation reports
  └── copilot-instructions.md         ← Auto-read by GitHub Copilot
```

---

## 📚 Documentation

### Repository Root (Essential Files Only)

```
/                                     ← Workspace root
├── README.md                         ← Installation, setup, command reference, improvements log
├── SPECKIT.md                        ← Main documentation (this file)
├── STARTER-TEMPLATE.md               ← Template for new workspaces
└── speckit.sh                        ← Installation script
```

### Quick Links

| Need | File |
|------|------|
| **Installation Guide** | [README.md](README.md) |
| **Full Documentation** | [SPECKIT.md](SPECKIT.md) (this file) |
| **Install in New Repo** | [STARTER-TEMPLATE.md](STARTER-TEMPLATE.md) |
| **Improvements Log** | [README.md → Appendix B](README.md#appendix-b-improvements-checklist) |

---

## 🏢 Implementation in FSR

### Current Status

**Active Repository**: `example-backend-service`

**Features Completed with Spec-Kit**:
1. `specs/FSR-1234-opcodes-api/` - Opcodes retrieval API
2. `specs/FSR-1367-guest-settings/` - Guest settings management

**Metrics from FSR-Dealer-Settings-Service**:
- Specification completeness: 100%
- Constitution compliance: 100%
- Task coverage: 100% (every requirement has >=1 task)
- AI success rate: 99% (1 minor issue per 100 tasks)
- Rework rate: <5% (vs 30-40% before Spec-Kit)

### Example: FSR-1234-Opcodes-API

**Input** (Jira ticket or natural language):
```bash
/speckit.quickstart FSR-1234
```

**Spec-Kit Generated**:
```
specs/FSR-1234-opcodes-api/
  ├── spec.md             ← 68 functional requirements, 3 user stories
  ├── plan.md             ← PostgreSQL + Prisma, Controller→Service→Repository pattern
  ├── tasks.md            ← 65 tasks across 6 phases (30 parallelizable)
  ├── research.md         ← Caching strategy (Redis, 24h TTL), retry logic (no DB retries)
  ├── data-model.md       ← fsr.gxpr03_dealer_service table schema
  ├── quickstart.md       ← Local dev with Docker, test data seeding
  ├── contracts/
  │   └── opcodes-api.openapi.yaml  ← OpenAPI 3.0 contract
  └── checklists/
      └── requirements.md ← All items ✓ PASS
```

**Result**: Feature completed in 2 days (vs 5 days before Spec-Kit), zero rework.

---

## 🤖 AI Assistant Integration

### Critical: Prompt Execution Rules

**BEFORE executing ANY `/speckit.*` command:**

1. **STOP** - Do not proceed based on general knowledge
2. **READ** - Open and read the entire `.github/prompts/speckit.{command}.prompt.md` file
3. **FOLLOW** - Execute the prompt's workflow EXACTLY as written, step by step
4. **DO NOT** batch, skip, or combine steps that the prompt defines as sequential/interactive

**Violations to avoid:**
- Improvising workflows instead of reading the prompt
- Batching steps that should be interactive (per-feature, per-item)
- Presenting custom options when the prompt defines specific options
- Assuming you know the workflow without reading the prompt file

**If a prompt says "for each X, do Y" - that means STOP after each X and wait for user input before proceeding to the next X.**

### GitHub Copilot Integration

**How Copilot Uses Spec-Kit**:

1. **Auto-reads** `.github/copilot-instructions.md` (updated by `/speckit.plan`)
2. **Executes enhanced prompts** with comprehensive user guidance:
   - Visual progress indicators ("What's Happening", "Why This Matters")
   - Phase-by-phase explanations
   - Clear next steps and decision points
   - Comprehensive completion reports
3. **References** all spec files in GitHub issues:
   ```markdown
   ## Context for AI
   
   **Read these files first**:
   - Constitution: `.specify/memory/constitution.md`
   - Specification: `specs/FSR-1367-guest-settings/spec.md`
   - Implementation Plan: `specs/FSR-1367-guest-settings/plan.md`
   - Tasks: `specs/FSR-1367-guest-settings/tasks.md`
   - Contract: `specs/FSR-1367-guest-settings/contracts/guest-settings-api.yaml`
   
   **Example Implementation**: `specs/FSR-1234-opcodes-api/` (reference implementation)
   ```

3. **Executes** tasks from `tasks.md` with 99% accuracy because:
   - ✅ Exact file paths specified
   - ✅ Dependencies explicit
   - ✅ Contract as source of truth
   - ✅ Constitution enforces quality
   - ✅ Example implementation to reference

### Other AI Assistants

**Cursor AI**, **Amazon Q Developer**, **Tabnine**:
- Read `.github/copilot-instructions.md` (same format)
- Execute Spec-Kit commands (prompts in `.github/prompts/`)
- Follow same workflow (specify → plan → tasks → implement)

---

## 🌐 Enterprise Context & Feature Branch Tracking

### Cross-Repository Visibility

Spec-Kit aggregates specifications and conventions across all FSR repositories into a central context:

| File | Purpose |
|------|---------|
| `.specify/workspace/all-specs.md` | Human-readable aggregation of all specs |
| `.specify/workspace/all-conventions.md` | Aggregated coding conventions from all repos |
| `.specify/workspace/repo-index.json` | Machine-readable spec metadata |

**How context sync works**:

```
┌──────────────────┐     push to sync    ┌────────────────────────┐
│   Your Repo      │ ─────────────────→  │  Central Context Repo  │
│                  │    branch           │  (es-spec-kit-context)│
│ sync-spec-       │                     │        ↓               │
│ context.yml      │  repository_dispatch│  aggregate-spec-       │
│                  │ ─────────────────→  │  context.yml runs      │
└──────────────────┘  (specs-updated)    │        ↓               │
         ↑                               │  Aggregates all specs  │
         │                               └────────────────────────┘
         │ sync-to-subscribed-repos.yml             │
         │ pushes context back                      ↓
         │                               ┌────────────────────────┐
         └───────────────────────────────│  all-specs.md          │
                                         │  repo-index.json       │
                                         └────────────────────────┘
```

| Action | What Happens |
|--------|--------------|
| `git push` (with spec changes) | `sync-spec-context.yml` pushes specs → central repo's `sync` branch |
| Dispatch event triggered | `repository_dispatch` with `specs-updated` event type |
| Central repo aggregates | `aggregate-spec-context.yml` combines all specs, cleans stale branches |
| `sync-to-subscribed-repos.yml` | Pushes updated context back to your repo |
| `git pull` | You receive fresh context via normal git operations |

**Why full sync?** AI agents cannot authenticate to private GitHub URLs. By syncing complete spec artifacts locally, agents have immediate, unauthenticated access to all context - no fetching required.

### Feature Branch Tracking

Specs are synced from **all branches**, not just main:

- 🌳 **Main branch specs**: Merged, stable specifications
- 🌿 **Feature branch specs**: Work-in-progress, actively being developed

**Storage structure**:
```
repos/
├── dealer-service/
│   ├── main/
│   │   └── spec-metadata.json          # Merged specs
│   └── feat-auth-integration/
│       └── spec-metadata.json          # WIP specs
```

**Benefits**:
- ✅ **Early Discovery**: Find work-in-progress before merge
- ✅ **Avoid Duplication**: "Is anyone working on X?" → Check feature branches
- ✅ **Collaboration**: Coordinate on specs before implementation
- ✅ **Visibility**: See active work across all teams

**Example query**:
> "Is anyone working on authentication?"

**Copilot response** (referencing enterprise context):
> "Yes! There are 2 authentication-related specs:
> - auth-service/FSR-1100-jwt-validation ✅ (main - implemented)
> - api-gateway/FSR-1250-oauth-sso 🚧 (feat/auth-integration - in progress)
> 
> Coordinate with api-gateway team if building auth features."

### Stale Branch Cleanup

When feature branches are deleted (after merge), the aggregation workflow automatically cleans up:

**How it works**:
1. During each aggregation run, the workflow checks GitHub API for live branches
2. Branch directories that no longer exist on GitHub are removed
3. The `.branches.json` tracking file is updated
4. Cleanup is graceful: API failures skip cleanup (don't break aggregation)

**What gets cleaned**:
- `repos/{repo-name}/{deleted-branch}/` directories
- Entries in `.branches.json` for deleted branches

**When it runs**:
- Automatically during every aggregation workflow run
- No manual intervention required

---

## ✅ Best Practices

### 1. **Always Start with `/speckit.specify`**

**❌ DON'T**:
```bash
# Manually create specs/FSR-1234-feature/spec.md
# Copy from old feature
# Skip specification phase
```

**✅ DO**:
```bash
# Let Spec-Kit create structure from Jira ticket
/speckit.specify FSR-1234

# Or with natural language description
/speckit.specify "Add user notification system with email and SMS"
```

**Why**: Ensures consistent structure, Jira linkage, constitution check.

---

### 2. **Resolve All Clarifications Before Planning**

**❌ DON'T**:
```markdown
### User Story 1
[NEEDS CLARIFICATION: Which database?]
```

**✅ DO**:
```bash
# Use interactive clarification
/speckit.clarify

# Or resolve manually in spec.md, then run analyze
/speckit.analyze
```

**Why**: Planning requires technical decisions that depend on clarified requirements.

---

### 3. **Never Modify Contracts to Match Implementation**

**❌ DON'T**:
```yaml
# Implementation returns { result: {...} }
# Update contract to match:
responses:
  200:
    schema:
      result: object  # ← WRONG
```

**✅ DO**:
```yaml
# Contract stays as-is:
responses:
  200:
    schema:
      data: object   # ← Correct (from contract)
      meta: object

# Fix implementation to match contract
```

**Why**: Contract-first means contracts are immutable during implementation.

---

### 4. **Organize Tasks by User Story, Not by Technology**

**❌ DON'T**:
```markdown
### Phase 3: Database Layer
- [ ] T010 Create all entities (User, Post, Comment)
- [ ] T011 Create all repositories

### Phase 4: Service Layer
- [ ] T020 Create all services
```

**✅ DO**:
```markdown
### Phase 3: User Story 1 - User Registration (P1)
- [ ] T010 [US1] Create User entity
- [ ] T011 [US1] Create UserRepository
- [ ] T012 [US1] Create AuthService.register()

### Phase 4: User Story 2 - Post Creation (P2)
- [ ] T020 [US2] Create Post entity
- [ ] T021 [US2] Create PostRepository
```

**Why**: Enables independent implementation, incremental delivery, parallel development.

---

### 5. **Run `/speckit.analyze` Before Implementation**

**❌ DON'T**:
```bash
# Skip analysis, start coding immediately
/speckit.implement
```

**✅ DO**:
```bash
# Validate consistency first
/speckit.analyze

# Fix any CRITICAL issues
# Then implement
/speckit.implement
```

**Why**: Catches constitution violations, duplications, missing coverage BEFORE code.

---

### 6. **Mark Tasks as Completed in tasks.md**

**❌ DON'T**:
```markdown
- [ ] T001 Create User entity
- [ ] T002 Create UserRepository
```
*(Leave unchecked even after implementation)*

**✅ DO**:
```markdown
- [X] T001 Create User entity
- [X] T002 Create UserRepository
- [ ] T003 Create AuthService  ← Currently working on this
```

**Why**: Tracks progress, shows what's left, enables checkpoint recovery.

---

## 🐛 Troubleshooting

### Issue: `/speckit.specify` fails with "No feature description provided"

**Cause**: Empty command invocation

**Solution**:
```bash
# ❌ Wrong
/speckit.specify

# ✅ Correct
/speckit.specify "Add OAuth2 authentication for user login"
```

---

### Issue: `/speckit.plan` fails with "spec.md not found"

**Cause**: Skipped `/speckit.specify` or wrong branch

**Solution**:
```bash
# Check current branch
git branch --show-current  # Should be like "FSR-1234-feature-name"

# If wrong branch, run specify first
/speckit.specify FSR-1234
```

---

### Issue: `/speckit.tasks` generates tasks that don't match user stories

**Cause**: `spec.md` user stories not prioritized or missing [US] labels

**Solution**:
```markdown
# ❌ Wrong (in spec.md)
### User Story 1 - Login
[No priority specified]

# ✅ Correct (in spec.md)
### User Story 1 - Login (Priority: P1)
**Independent Test**: ...
```

Then re-run:
```bash
/speckit.tasks
```

---

### Issue: `/speckit.analyze` reports CRITICAL constitution violation

**Example**:
```
C1: PII handling violation - email logged at plan.md:L89
```

**Solution**:
1. Open `plan.md`, find line 89
2. Remove PII from logging:
   ```typescript
   // ❌ Before
   logger.info('User registered', { email: user.email });
   
   // ✅ After
   logger.info('User registered', { userId: user.id });
   ```
3. Update plan.md to reflect change
4. Re-run `/speckit.analyze` to verify fix

---

### Issue: `/speckit.implement` stops with "Checklist incomplete"

**Example**:
```
| Checklist | Total | Completed | Incomplete | Status |
|-----------|-------|-----------|------------|--------|
| ux.md     | 8     | 5         | 3          | ✗ FAIL |
```

**Options**:

**Option A**: Complete checklist first
```bash
# Open checklist
open specs/002-feature/checklists/ux.md

# Complete missing items
- [X] Item 6
- [X] Item 7
- [X] Item 8

# Re-run implementation
/speckit.implement
```

**Option B**: Proceed anyway (if non-blocking)
```
⚠️  Some checklists are incomplete. Do you want to proceed anyway? (yes/no)

> yes

✅ Proceeding with implementation...
```

---

### Issue: Implementation doesn't match contract

**Example**:
```bash
# Contract says:
POST /users → { data: {...}, meta: {...} }

# Implementation returns:
{ result: {...} }
```

**Root Cause**: Developer changed implementation without checking contract

**Solution**:
```typescript
// ✅ Fix implementation to match contract
return {
  data: user,
  meta: {
    timestamp: new Date().toISOString()
  }
};
```

**Prevention**: Run contract tests (generated from OpenAPI):
```bash
npm run test:contract
```

---

## 🚀 Migration Guide

### For Existing Projects (Without Spec-Kit)

#### Step 1: Install Spec-Kit Infrastructure

**Recommended**: Use the installer script:

```bash
# Run the Spec-Kit installer
curl -fsSL https://raw.githubusercontent.com/rlerikse/es-spec-kit-context/main/context/speckit.sh | bash

# Then document existing features (optional)
/speckit.retro --all
```

**Manual setup** (if preferred):
```bash
# Create directory structure
mkdir -p .specify/memory
mkdir -p .specify/templates
mkdir -p .specify/workspace
mkdir -p .github/prompts
mkdir -p specs

# Copy templates from appendices below
```

#### Step 2: Create Your First Spec-Kit Feature

```bash
# Use Spec-Kit for next feature
/speckit.specify "Add real-time notifications"

# Follow full workflow
/speckit.plan
/speckit.tasks
/speckit.analyze
/speckit.implement
```

#### Step 3: Migrate Existing Features (Optional)

For features already in development, create retroactive specs:

```bash
# Use retroactive documentation command
/speckit.retro

# Or create spec directory manually
mkdir -p specs/FSR-1234-existing-feature

# Generate spec.md from existing code/docs
# Use Spec-Kit template as guide
cp .specify/templates/spec-template.md specs/FSR-1234-existing-feature/spec.md

# Fill in actual requirements (what feature does)
# Document actual implementation (plan.md)
# Extract contract from code → contracts/api.yaml
```

**Note**: Retroactive specs document what exists—don't delete working code to re-implement in "proper" TDD order. But those features CAN and SHOULD evolve via new specs, patches, or version bumps (see [Evolving Existing Features](#evolving-existing-features) below).

---

### For New Projects (Greenfield)

#### Step 1: Initialize Repository with Spec-Kit

```bash
# Create new repo
mkdir my-new-service
cd my-new-service
git init

# Run the Spec-Kit installer
curl -fsSL https://raw.githubusercontent.com/rlerikse/es-spec-kit-context/main/context/speckit.sh | bash

# Or use migrate command for guided setup
# Run the Spec-Kit installer
curl -fsSL https://raw.githubusercontent.com/rlerikse/es-spec-kit-context/main/context/speckit.sh | bash

# Customize constitution for your project
nano .specify/memory/constitution.md
```

#### Step 2: Create First Feature

```bash
# Start with Spec-Kit from day 1
/speckit.specify "Create REST API for product catalog"
/speckit.plan
/speckit.tasks
/speckit.implement
```

#### Step 3: Establish Team Norms

**Document in README.md**:
```markdown
## Development Workflow

All features MUST follow Spec-Kit process:

1. `/speckit.specify` - Create specification
2. `/speckit.plan` - Generate implementation plan
3. `/speckit.tasks` - Break down into tasks
4. `/speckit.analyze` - Validate consistency (quality gate)
5. `/speckit.implement` - Execute implementation

**No feature development without complete specification.**

See: [SPECKIT.md](./SPECKIT.md) for details.
```

---

## � Evolving Existing Features

Specs are **living documents**. Features documented with retroactive specs CAN and SHOULD be modified, fixed, and extended. Use the appropriate approach based on scope:

### Approach by Change Type

| Change Type | Approach | Creates | Example |
|-------------|----------|---------|--------|
| **Bug fix** (< 2hrs) | Add "Patches" section to existing `plan.md` | Inline patch record | Fix race condition in useAudio |
| **Bug fix** (> 2hrs) | `/speckit.specify "Fix [issue]"` | New focused spec | `specs/FSR-1500-fix-queue-persistence/` |
| **New capability** | `/speckit.specify "Add [feature]"` with dependency | New spec referencing original | `specs/FSR-1501-bulk-upload/` → depends on `FSR-1367` |
| **Major revision** | Version the spec (`spec-v2.md`) | Parallel versioned spec | Complete player rewrite |

### Option 1: Patches (Quick Fixes < 2 Hours)

**Approach**: Add a "Patches" section directly to the existing `plan.md`

For small bug fixes, manually add a "Patches" section to the existing `plan.md` and optionally implement the fix:

```markdown
## Patches

### Patch 2026-01-13: Fix audio preload race condition
**Issue**: Audio element preloads before track metadata loads
**Solution**: Add `loadedmetadata` event listener before setting `src`
**Files**: `src/hooks/useAudio.ts` (lines 45-52)
**Constitution Check**: ✅ No violations
**PR**: #123
```

### Option 2: New Focused Spec (Additions & Larger Fixes)

For new capabilities or fixes taking >2 hours, create a new spec that references the original:

```bash
/speckit.specify "Add gapless playback to music player"
```

This creates a small, focused spec:
```
specs/FSR-1600-gapless-playback/
  spec.md          ← 50-80 lines (focused scope)
  plan.md          ← References FSR-1367's architecture
  tasks.md         ← Only 8-12 tasks (not 65)
```

**Benefits of composition over accumulation**:
- Original spec stays clean (historical record)
- New spec is small and focused
- Clear audit trail of what changed when
- No "spec bloat" from accumulated patches

### Option 3: Version the Spec (Major Revisions)

When significantly reworking a feature:

```
specs/
  FSR-1367-music-streaming-player/
    spec.md           ← Original (v1.0, unchanged)
    spec-v2.md        ← Major revision
    plan-v2.md        ← New architecture decisions
    tasks-v2.md       ← Only the DELTA tasks
```

### Tracking Changes in Specs

Add a "Change History" section to track evolution:

```markdown
## Change History

| Date | Version | Change | Spec/Patch |
|------|---------|--------|------------|
| 2026-01-12 | 1.0.0 | Initial implementation | This spec |
| 2026-01-13 | 1.1.0 | Added gapless playback | `specs/FSR-1600-gapless-playback/` |
| 2026-01-15 | 1.0.1 | Fixed queue persistence bug | Patch in plan.md |
```

### Key Insight: Composition Over Accumulation

Instead of one 800-line spec that grows forever:

```
✅ GOOD: Many small, focused specs
specs/FSR-1367-music-streaming-player/   (~400 lines, original)
specs/FSR-1600-gapless-playback/         (~80 lines, depends on FSR-1367)
specs/FSR-1700-offline-mode/             (~120 lines, depends on FSR-1367)

❌ BAD: One giant evolving document
specs/FSR-1367-music-streaming-player/   (~1200 lines, constantly edited)
```

Each spec is independently reviewable, testable, and doesn't bloat the original.

---

## �📚 Additional Resources

### Internal Documentation (FSR)

- **Constitution**: `.specify/memory/constitution.md` (v0.8.0)
- **Example Feature**: `example-backend-service/specs/FSR-1234-opcodes-api/`
- **Copilot Setup**: `example-backend-service/docs/copilot/setup.md`
- **Quick Start**: `example-backend-service/docs/copilot/quickstart-checklist.md`

### External Standards

- **OpenAPI 3.0**: https://swagger.io/specification/
- **Semantic Versioning**: https://semver.org/
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Google Design Docs**: https://www.industrialempathy.com/posts/design-docs-at-google/
- **IETF RFC Process**: https://www.rfc-editor.org/rfc/rfc2026

### FSR Team Contacts

- **Slack**: `#spec-kit-support`
- **Spec-Kit Lead**: [Team Lead Name]
- **Documentation**: [Confluence Link]

---

## 🎓 Learning Path

### Week 1: Understanding Spec-Kit

- [ ] Read this document (SPECKIT.md) completely
- [ ] Review constitution: `.specify/memory/constitution.md`
- [ ] Study example: `example-backend-service/specs/FSR-1234-opcodes-api/`
- [ ] Watch: Spec-Kit workflow demo (if available)

### Week 2: Hands-On Practice

- [ ] Pick a small feature (1-2 day implementation) with a Jira ticket
- [ ] Run `/speckit.quickstart FSR-XXXX` or `/speckit.specify FSR-XXXX`
- [ ] Complete specification with clarifications
- [ ] Run `/speckit.plan` and review outputs
- [ ] Run `/speckit.tasks` and analyze task breakdown
- [ ] Run `/speckit.analyze` to understand quality checks

### Week 3: First Implementation

- [ ] Use Spec-Kit for real feature development
- [ ] Run `/speckit.implement` and track progress
- [ ] Mark tasks as completed in `tasks.md`
- [ ] Create PR with spec references
- [ ] Respond to code review feedback

### Week 4: Advanced Patterns

- [ ] Create custom checklists with `/speckit.checklist`
- [ ] Handle complex features with `/speckit.clarify`
- [ ] Optimize parallel task execution
- [ ] Contribute improvements to constitution

---

## 📊 Success Metrics

Track these metrics to measure Spec-Kit adoption success:

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Specification Coverage** | 100% | % of features with complete specs |
| **Constitution Compliance** | 100% | % of features passing constitution check |
| **Task Coverage** | 100% | % of requirements with >=1 task |
| **Rework Rate** | <10% | % of PRs requiring rework |
| **AI Success Rate** | >90% | % of AI-generated code passing review |
| **Onboarding Time** | <5 days | Days for new dev to ship first feature |
| **Planning Time** | <1 day | Hours from spec to ready-to-implement |

**How to Track**:
```bash
# Specification coverage
find specs -name 'spec.md' | wc -l  # vs total features

# Constitution compliance
grep -r "Constitution Check" specs/*/plan.md | grep "\[x\]" | wc -l

# Task coverage (use /speckit.analyze output)
```

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.3.1 | Feb 4, 2026 | **Sync Branch Fix**: Sync workflow now pushes to `sync` branch (not main), triggers aggregation via `repository_dispatch`. Removed blocked third-party action (`dmnemec/copy_file_to_another_repo_action`) |
| 2.3.0 | Feb 3, 2026 | **Actions-Only Edition**: Removed post-merge hook (redundant), context sync fully via GitHub Actions bidirectionally |
| 2.2.1 | Feb 3, 2026 | **Stale Branch Cleanup**: Aggregate workflow now auto-removes deleted branch directories via GitHub API |
| 2.2.0 | Feb 3, 2026 | Added `/speckit.constitution` command, 4 templates, 13 active prompts |
| 2.1.0 | Feb 3, 2026 | **Migrate Consolidation**: Deprecated `/speckit.migrate`, merged features into `/speckit.retro` (conventions, rollback, large codebase handling, polyglot detection). Infrastructure install handled by `speckit.sh` |
| 2.0.0 | Jan 29, 2026 | **Script-Free Edition**: Removed all bash scripts, merged review→analyze, setup→migrate, deprecated context/constitution (GitHub Actions handles sync), inline AI logic replaces scripts. Removed `/speckit.link` (redundant with Epic=Jira architecture) |
| 1.2.0 | Jan 15, 2026 | Added `/speckit.link` and `/speckit.help`, 60+ advanced flags documented, gap tasks for retroactive specs |
| 1.1.0 | Jan 15, 2026 | Added 6 new commands (review, status, diff, setup, quickstart, ci), enhanced migrate/watch/implement with rollback/offline/checkpoint support |
| 1.0.0 | Jan 12, 2026 | Initial SPECKIT.md creation |
| 0.8.0 | Jan 2026 | Constitution v0.8.0 (added merge conflict safety requirement) |
| 0.7.0 | Nov 2025 | Constitution v0.7.0 (added Input Validation principle) |
| 0.6.1 | Oct 2025 | Constitution v0.6.1 (stable release for FSR) |

---

## 💡 Quick Reference Card

**One-Page Spec-Kit Cheat Sheet**:

```
┌─────────────────────────────────────────────────────────────┐
│ SPEC-KIT WORKFLOW (13 COMMANDS, 40+ FLAGS)                  │
├─────────────────────────────────────────────────────────────┤
│ CORE WORKFLOW (7 commands)                                  │
│ 1. /speckit.specify FSR-1234       → spec.md                │
│    Flags: --draft, --update FSR-XXX                         │
│ 2. /speckit.clarify                → resolve ambiguities    │
│ 3. /speckit.plan                   → plan.md, contracts     │
│    Flags: --only, --skip, --diff, --force                   │
│ 4. /speckit.tasks                  → tasks.md               │
│    Flags: --template, --validate                            │
│ 5. /speckit.analyze                → quality gate + pre-PR  │
│    Flags: --auto-fix, --pre-pr, --ci                        │
│ 6. /speckit.implement              → working code           │
│    Flags: --resume, --rollback, --auto-pr                   │
│ 7. /speckit.report                 → implementation report  │
├─────────────────────────────────────────────────────────────┤
│ UTILITIES (5 commands)                                      │
│ • /speckit.quickstart FSR-1234 → spec+plan+tasks in one     │
│ • /speckit.retro       → retroactive documentation          │
│ • /speckit.retro        → retroactive docs + conventions        │
│ • /speckit.validate    → installation verification          │
│ • /speckit.checklist   → custom quality checklists          │
├─────────────────────────────────────────────────────────────┤
│ KEY PRINCIPLES                                              │
├─────────────────────────────────────────────────────────────┤
│ • Jira-first: Specs created from Jira tickets               │
│ • Contract-first: OpenAPI BEFORE code                       │
│ • Constitution as law: Non-negotiable principles            │
│ • User story slices: Independent, testable increments       │
│ • Progressive detail: Spec → Plan → Tasks → Code            │
│ • AI-native: Structured for 99% AI success                  │
└─────────────────────────────────────────────────────────────┘
```

---

**Last Updated**: January 29, 2026  
**Maintained By**: FSR Platform Team  
**Questions**: #spec-kit-support

---

## 📚 Appendices

All Spec-Kit infrastructure files are embedded below for self-contained setup. No external dependencies required.

### Appendix A: Constitution Template

**File**: `.specify/memory/constitution.md`

```markdown
# FSR Dealer Settings Service Constitution

<!-- Sync Impact Report

Version change: 0.6.1 → 0.7.0
Modified principles:
- Added: VIII. Input Validation & Type Safety
Added sections:
- New principle VIII for Zod-based external data validation
Removed sections: none
Templates requiring updates:
	.specify/templates/plan-template.md ✅ no changes needed
	.specify/templates/spec-template.md ✅ no changes needed
	.specify/templates/tasks-template.md ✅ no changes needed
	.specify/templates/checklist-template.md ✅ no changes needed
Follow-up TODOs: none
-->
## I. Contract-First API Design

All APIs MUST be designed and implemented according to their authoritative OpenAPI/Swagger contract specifications. When contract files exist, they take precedence over detailed design documents or specifications. Implementation MUST match the contract exactly, including:

- Endpoint paths and HTTP methods
- Request/response schemas and data structures
- Query parameters and their validation rules
- Error response formats and status codes

Contract files serve as the single source of truth for API interfaces. Any discrepancies between contracts and other documentation MUST be resolved by updating the implementation to match the contract, not by modifying the contract to match implementation preferences.

Rationale: Contract-first design ensures API consistency, enables proper client generation, and prevents implementation drift from agreed interfaces. OpenAPI contracts provide machine-readable API specifications that enable automated testing, documentation, and client SDK generation.

## II. Observability & Tracing

Services MUST emit structured logs, metrics, and distributed traces. All API request flows MUST include
correlation/trace identifiers, and traces SHOULD be OpenTelemetry-compatible where practicable. Logs must
be sufficiently structured and contextual to support debugging in production.

Rationale: Rapid diagnosis of issues in production requires consistent observability signals. Instrumented
traces and structured logging reduce mean-time-to-repair.

## III. Postgres Safety & Data Contracts

All Postgres access MUST be encapsulated behind a repository layer with typed interfaces and input validation. Data model changes MUST be backward-compatible or accompanied by an explicit migration plan and contract tests. Reads and writes must validate inputs and avoid unbounded queries; request-level limits and pagination are required where applicable.

Rationale: Postgres schema changes are difficult to undo; explicit contracts and validation minimize data corruption and runtime errors.

## IV. Documentation & Data Model Discipline

All features and changes MUST be accompanied by up-to-date documentation, including:

For new or updated data storage, the data model MUST include explicit documentation for Postgres on GCP Cloud SQL, including schema, migration plan, and access patterns. Documentation MUST be reviewed and approved before merge.

Rationale: Clear documentation and data modeling ensure maintainability, onboarding, and safe evolution of APIs and storage. Postgres on GCP Cloud SQL introduces new operational and migration requirements that MUST be tracked and reviewed.

## V. PII Data Handling & Logging

Personally Identifiable Information (PII) MUST NOT be logged in any application logs, error logs, or external monitoring systems. PII MAY be sent to a dedicated audit table, provided that:

- The audit table is explicitly documented in the data model and access patterns.
- Access to audit data is restricted and reviewed regularly.
- All PII fields are clearly identified and tracked in documentation and code.
- Any transmission of PII for auditing MUST comply with applicable privacy requirements.

Rationale: Logging PII risks privacy breaches and regulatory violations. Audit tables allow for traceability and compliance without exposing sensitive data in logs.

## VI. Versioning, Releases & Backwards Compatibility

APIs and the constitution MUST follow semantic versioning. Breaking changes to public APIs or to
governance documents MUST be accompanied by a MAJOR version bump and a migration/communication plan.
Release notes MUST clearly list breaking changes, migration steps, and the required QA checklist.

Rationale: Clear versioning and release notes enable downstream consumers to plan and adapt safely.

## VII. Code Architecture Pattern

All code MUST follow the "Controller, Service, Repository (CSR)" pattern for separation of concerns:

- Controllers handle HTTP request/response and validation
- Services contain business logic
- Repositories encapsulate database access

Rationale: The CSR pattern provides clear separation of concerns, improves testability, and makes the codebase more maintainable and easier to understand.

## VIII. Input Validation & Type Safety

All external data (API requests, database responses, third-party API responses, file uploads, environment variables) MUST be validated using Zod schemas before being used in business logic. Validation MUST occur at system boundaries:

- API request bodies and query parameters validated in controllers
- Database query results validated when retrieved from repositories
- External API responses validated immediately after receipt

Rationale: Runtime validation prevents type coercion bugs, injection attacks, and unexpected data shapes. Zod provides type-safe schemas that serve as both runtime validators and TypeScript type definitions, ensuring compile-time and runtime type safety.

## Additional Constraints

- Primary languages & runtime: Node.js + TypeScript
- Primary datastore: PostgresSQL
- Testing: Jest for unit tests; integration/contract tests as required
- Observability: OpenTelemetry-compatible traces, structured JSON logs, and metrics
- Coding reference: Follow organizational coding standards and best practices
- CI gates: Linting, type checks, unit tests, contract tests, and 42Crunch API security scan (minimum score: 80%) MUST pass before merge
- SonarQube quality gate: Static code quality/security analysis via SonarQube is enforced in CI and SHOULD pass before merge. (Documented but enforced in pipeline.)
- PR requirements: description, testing guidance, and at least one reviewer. (Constitution amendments require two approvals; see Governance section.)

## Development Workflow

- **Jira ID Requirement**: Before creating any new branch, a valid Jira ID MUST be obtained and associated with the work. All feature work, bug fixes, and hotfixes MUST be tracked in Jira. Branches created without a valid Jira ID are prohibited.
- All work is done on short-lived branches. Branch naming MUST follow a simple, consistent convention: use one of the approved types (`feat`, `bug`, `hotfix`, `spec`, `fix`, `docs`, `chore`) and format the branch name as `<type>/<JIRA-ID>-short-description` (for example: `feat/FSR-123-add-dealer-settings-endpoint`, `chore/FSR-43-guest-settings-spec`). This helps traceability to issue trackers and CI policies.
- Pull requests MUST include: links to relevant specs, links to the associated Jira ticket, tests that demonstrate behavior, and upgrade notes for schema or API changes
- Code review: normal PRs require one reviewer and passing CI. Constitution or governance changes require at least two maintainer approvals and a public notice period (see Governance)
- Release process: Prepare release notes, update semantic version, and include a migration plan for any breaking changes

## API Security Gate

- All features must pass 42Crunch API security scan before release.
- Minimum audit security score required: 80%.
- API contracts MUST document security scan results and compliance status.

## Caching Strategy & Retry Logic

- All features must document which APIs or data require caching, expected TTL, and invalidation strategy. Redis is the standard caching tool. Not all features require caching and should only be added if specifically requested.
- All features must document retry logic for applicable APIs/operations, including recommended parameters and exponential backoff strategy. Not all features require retry logic and should only be added if specifically requested.

  
## Feature Flag Management

- All feature flags must be managed using Flagsmith.
- Document flag usage and rollout strategy for each feature.

## Governance

Amendments to this constitution MUST be made via a pull request that includes:

- A clear rationale and summary of the change
- Any migration or rollout plan for breaking changes
- Tests/checklist updates when the amendment affects developer workflow or gates

Approval rules:

- Constitution amendments REQUIRE two maintainer approvals (either two people from the MAINTAINERS list or two designated approvers)
- Non-substantive wording or typo fixes MAY be merged with a single maintainer approval if clearly documented as editorial

Versioning policy: Semantic versioning applies to this constitution:

- MAJOR: Backwards-incompatible governance/principle removals or redefinitions
- MINOR: New principle or material expansion of guidance
- PATCH: Clarifications, wording, typo fixes, or non-semantic refinements

Compliance review: The project MUST perform constitution compliance reviews quarterly, with the first
follow-up review scheduled sooner during initial rollout (recommended: within the first 3 months).

**Version**: 0.7.0 | **Ratified**: 2025-11-04 | **Last Amended**: 2025-12-15
```

---

### Appendix B: Spec Template

**File**: `.specify/templates/spec-template.md`

*Note: This template is used by `/speckit.specify` command. See Appendix F1 for command implementation.*

```markdown
# Feature Specification: [FEATURE NAME]

<!--
  INSTRUCTIONS: Fill out every section. All documentation gates below are mandatory for every feature unless marked as [OPTIONAL].
  See constitution for rationale and compliance requirements.
-->

**Feature Branch**: `[FSR-XXXX-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Jira**: [FSR-XXXX](https://ford-et.atlassian.net/browse/FSR-XXXX)  
**Input**: Jira ticket or user description: "$ARGUMENTS"


---

## Documentation Gates *(mandatory)*

> Example: Attach diagrams as images or link to source files. Migration scripts should be in `/specs/[feature]/migrations/`.

---

## Constitution Compliance Checklist

- [ ] Contract Compliance: OpenAPI contract file exists and implementation matches contract exactly (endpoint paths, schemas, parameters, responses)
- [ ] Security: RBAC, secret handling, and authorization reviewed (All secrets MUST be stored in GCP Secret Manager)
- [ ] Observability: Logging, metrics, and tracing requirements documented (All APIs MUST include audit logging and support the x-trace-id header for distributed tracing before release. Not required for every PR.)
- [ ] Testing: Unit, integration, and contract test requirements listed
- [ ] Documentation: All gates above completed
- [ ] Retry Logic: Only API calls require retry logic. Database interactions (Postgres) should not implement retry unless explicitly required for transactional integrity or error handling.
- [ ] 42Crunch API security scan must be performed before release; minimum audit security score required: 80%.

---

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
  For each story, specify acceptance criteria and how it will be tested.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

---

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]  
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

---

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]

---

## Caching Strategy Clarification [OPTIONAL]

- Which API endpoints or data should be cached to improve performance or reduce load?
- What is the expected cache duration (TTL) for each cached item?
- Are there any cache invalidation or refresh requirements?
- Caching tool: Redis

---

## Retry Logic Clarification [OPTIONAL]

- Which API endpoints or operations require retry logic?
- What are the recommended retry parameters (max attempts, backoff strategy, delay)?
- Suggested strategy: Use exponential backoff with a delay (e.g., start with 1-2 seconds, double each time, up to a max).
- Should retries be applied for specific error types only (e.g., network, 5xx, rate limit)?
- Are there any idempotency or side-effect concerns with retries?

---

- [ ] Feature flags must be managed using Flagsmith; document flag usage and rollout strategy for each feature.
```

---

### Appendix C: Plan Template

**File**: `.specify/templates/plan-template.md`

*Note: This template is used by `/speckit.plan` command. See Appendix F2 for command implementation.*

*Due to length, showing abbreviated version. Full template available in example-backend-service repository.*

---

### Appendix D: Tasks Template

**File**: `.specify/templates/tasks-template.md`

*Note: This template is used by `/speckit.tasks` command.*

*Due to length, showing abbreviated version. Full template available in es-spec-kit-context repository.*

---

### Appendix E: AI Command Prompts

**Note**: These define the `/speckit.*` commands for GitHub Copilot and other AI assistants.

**Active Commands (12 total)**:
- `/speckit.specify` - Create feature specification (from Jira or description)
- `/speckit.clarify` - Resolve ambiguities
- `/speckit.plan` - Generate implementation plan
- `/speckit.tasks` - Break down into tasks
- `/speckit.analyze` - Quality check + pre-PR review
- `/speckit.implement` - Execute implementation
- `/speckit.quickstart` - Rapid spec+plan+tasks (from Jira)
- `/speckit.checklist` - Custom checklists
- `/speckit.validate` - Verify installation
- `/speckit.retro` - Retroactive documentation + convention extraction
- `/speckit.report` - Implementation reports
- `/speckit.epic` - Epic status dashboard

**Note**: migrate was deprecated (use speckit.sh + /speckit.retro). 11 commands were deprecated and removed (archive, ci, diff, link, patch, watch, status, review, setup, context, constitution). Use core workflow instead.

*Full implementations available in es-spec-kit-context repository.*

---

### Appendix F: Installation

**Recommended: Use the installer script**:
```bash
curl -fsSL https://raw.githubusercontent.com/rlerikse/es-spec-kit-context/sync/context/speckit.sh | bash
```

**What it installs**:
- `.specify/` directory with constitution, 4 templates, workspace context
- `.github/prompts/` with all 13 active command prompts
- `.github/copilot-instructions.md` for AI context
- GitHub Actions workflow for syncing specs (bidirectional)

**Manual Setup**:
```bash
# Create directory structure
mkdir -p .specify/memory
mkdir -p .specify/templates
mkdir -p .specify/workspace
mkdir -p .github/prompts
mkdir -p specs

# Copy templates from this repository or appendices above
```

**Customization**:
- Constitution: Update company name, tech stack, specific requirements
- Templates: Adjust section headings for your domain
- Prompts: AI commands work out-of-the-box, no customization needed
