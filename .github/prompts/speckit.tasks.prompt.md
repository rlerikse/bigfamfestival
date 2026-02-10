---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## Arguments

| Argument | Description |
|----------|-------------|
| (none) | Generate tasks from spec/plan |
| `--template <type>` | Use task template pattern |
| `--validate` | Validate existing tasks.md without regenerating |
| `--dry-run` | Preview tasks without writing |

**Template Types** (`--template`):
- `crud` - CRUD operations for an entity
- `api-endpoint` - REST API endpoint pattern
- `react-component` - React component with tests
- `service` - Service class pattern
- `migration` - Database migration pattern

**Examples**:
- `/speckit.tasks` - Generate from spec/plan
- `/speckit.tasks --template crud` - Use CRUD template pattern
- `/speckit.tasks --template api-endpoint` - Use API endpoint pattern
- `/speckit.tasks --validate` - Check existing tasks.md

---

## Task Templates

When `--template <type>` is specified, use predefined task patterns:

### `--template crud` (CRUD Operations)

For entity-based features with Create, Read, Update, Delete operations:

```markdown
## Phase 3: User Story 1 - [Entity] Management (P1)

### Story Goal
Users can create, view, update, and delete [entities].

### Independent Test Criteria
- [ ] Can POST /[entities] → 201 + new [entity]
- [ ] Can GET /[entities] → 200 + list
- [ ] Can GET /[entities]/:id → 200 + single [entity]
- [ ] Can PUT /[entities]/:id → 200 + updated [entity]
- [ ] Can DELETE /[entities]/:id → 204

### Implementation Tasks

#### Models
- [ ] T010 [P] [US1] [S] Create [Entity] interface in src/types/[entity].ts
- [ ] T011 [P] [US1] [S] Create [Entity] validation schema in src/schemas/[entity].schema.ts
- [ ] T012 [US1] [M] Create [Entity] model in src/models/[entity].model.ts

#### Repository
- [ ] T013 [US1] [M] Create [Entity]Repository interface in src/repositories/[entity].repository.ts
- [ ] T014 [US1] [L] Implement [Entity]Repository with CRUD methods

#### Service
- [ ] T015 [US1] [M] Create [Entity]Service in src/services/[entity].service.ts
- [ ] T016 [US1] [M] Implement create[Entity]() method
- [ ] T017 [P] [US1] [M] Implement get[Entity]ById() method
- [ ] T018 [P] [US1] [M] Implement getAll[Entities]() method
- [ ] T019 [P] [US1] [M] Implement update[Entity]() method
- [ ] T020 [P] [US1] [M] Implement delete[Entity]() method

#### Controller/Routes
- [ ] T021 [US1] [M] Create [Entity]Controller in src/controllers/[entity].controller.ts
- [ ] T022 [US1] [S] Implement POST /[entities] handler
- [ ] T023 [P] [US1] [S] Implement GET /[entities] handler
- [ ] T024 [P] [US1] [S] Implement GET /[entities]/:id handler
- [ ] T025 [P] [US1] [S] Implement PUT /[entities]/:id handler
- [ ] T026 [P] [US1] [S] Implement DELETE /[entities]/:id handler
```

### `--template api-endpoint` (Single API Endpoint)

For adding a new API endpoint:

```markdown
## Phase 3: User Story 1 - [Action] Endpoint (P1)

### Story Goal
[Description of what the endpoint does]

### Independent Test Criteria
- [ ] Can [METHOD] /[path] with valid data → [expected response]
- [ ] Handles invalid input → 400 with error details
- [ ] Handles not found → 404
- [ ] Handles unauthorized → 401

### Implementation Tasks

#### Contract
- [ ] T010 [US1] [S] Add endpoint to contracts/[api].yaml
- [ ] T011 [US1] [S] Define request schema in contracts/[api].yaml
- [ ] T012 [US1] [S] Define response schema in contracts/[api].yaml

#### Validation
- [ ] T013 [US1] [M] Create request validation in src/validators/[endpoint].validator.ts

#### Service Logic
- [ ] T014 [US1] [L] Implement business logic in src/services/[service].ts

#### Controller
- [ ] T015 [US1] [M] Add route handler in src/controllers/[controller].ts
- [ ] T016 [US1] [S] Add error handling for edge cases

#### Integration
- [ ] T017 [US1] [S] Register route in src/routes/index.ts
- [ ] T018 [US1] [M] Add integration test in tests/integration/[endpoint].test.ts
```

### `--template react-component` (React Component)

For React/Next.js UI components:

```markdown
## Phase 3: User Story 1 - [Component] UI (P1)

### Story Goal
Users can [interaction description].

### Independent Test Criteria
- [ ] Component renders without errors
- [ ] [Key interaction] works correctly
- [ ] Handles loading state
- [ ] Handles error state
- [ ] Accessible (keyboard navigation, screen reader)

### Implementation Tasks

#### Types
- [ ] T010 [P] [US1] [S] Create component props interface in src/types/[component].ts
- [ ] T011 [P] [US1] [S] Create component state types (if needed)

#### Component
- [ ] T012 [US1] [M] Create [Component] in src/components/[Component]/index.tsx
- [ ] T013 [US1] [S] Add component styles in src/components/[Component]/styles.ts
- [ ] T014 [US1] [M] Implement component logic and state
- [ ] T015 [US1] [S] Add loading state handling
- [ ] T016 [US1] [S] Add error state handling

#### Hooks (if needed)
- [ ] T017 [US1] [M] Create use[Component] hook in src/hooks/use[Component].ts

#### Tests
- [ ] T018 [US1] [M] Create unit tests in src/components/[Component]/__tests__/index.test.tsx
- [ ] T019 [US1] [S] Add accessibility tests

#### Integration
- [ ] T020 [US1] [S] Export from src/components/index.ts
- [ ] T021 [US1] [M] Integrate into parent page/component
```

### `--template service` (Service Class)

For backend service implementations:

```markdown
## Phase 3: User Story 1 - [Service] Implementation (P1)

### Story Goal
System can [service capability description].

### Independent Test Criteria
- [ ] Service instantiates correctly
- [ ] [Primary method] returns expected result
- [ ] Handles errors gracefully
- [ ] Logging and observability in place

### Implementation Tasks

#### Interface
- [ ] T010 [US1] [S] Define I[Service] interface in src/interfaces/[service].interface.ts
- [ ] T011 [US1] [S] Define input/output types

#### Implementation
- [ ] T012 [US1] [M] Create [Service] class in src/services/[service].service.ts
- [ ] T013 [US1] [S] Implement constructor with dependency injection
- [ ] T014 [US1] [L] Implement primary business method
- [ ] T015 [P] [US1] [M] Implement helper methods
- [ ] T016 [US1] [M] Add error handling and logging

#### Tests
- [ ] T017 [US1] [M] Create unit tests in src/services/__tests__/[service].test.ts
- [ ] T018 [US1] [S] Add mock implementations for dependencies

#### Registration
- [ ] T019 [US1] [S] Register in DI container / module
```

### `--template migration` (Database Migration)

For database schema changes:

```markdown
## Phase 2: Database Migration (Foundational)

### Goal
Update database schema to support [feature].

### Pre-Migration Checklist
- [ ] Backup strategy documented
- [ ] Rollback plan defined
- [ ] Tested on staging

### Implementation Tasks

#### Migration Files
- [ ] T005 [M] Create migration file: migrations/[timestamp]_[name].ts
- [ ] T006 [M] Define up() migration (schema changes)
- [ ] T007 [M] Define down() migration (rollback)

#### Schema Updates
- [ ] T008 [S] Add new table(s) / column(s)
- [ ] T009 [S] Add indexes for query optimization
- [ ] T010 [S] Add foreign key constraints

#### Seed Data (if needed)
- [ ] T011 [M] Create seed file: seeds/[name].ts
- [ ] T012 [S] Add test data for development

#### Validation
- [ ] T013 [M] Test migration up on local DB
- [ ] T014 [M] Test migration down (rollback)
- [ ] T015 [S] Update data-model.md with changes
```

---

## 📋 What This Command Does

**Purpose**: Break down implementation plan into granular, executable tasks organized by user story.

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md#the-spec-kit-workflow)):
- **Phase 2**: Task generation (plan → 40-80 specific tasks)
- **After /speckit.plan**: Plan defines architecture, tasks define execution steps
- **Before /speckit.implement**: Must have complete task breakdown

**This command will**:
1. **Load design artifacts** (plan.md, spec.md, data-model.md, contracts/)
2. **Extract user stories** (prioritized from spec.md)
3. **Generate task phases** (Setup → Foundational → User Story 1 → User Story 2 → Polish)
4. **Mark parallelizable tasks** ([P] marker for independent tasks)
5. **Create dependency graph** (story completion order)
6. **Define independent tests** (each story testable separately)

**Why use this?**
- ✅ User story organization enables incremental delivery (MVP-first)
- ✅ Parallel tasks speed up development (35% of tasks can run together)
- ✅ Each story independently testable (ship Story 1 before Story 2 complete)
- ✅ Absolute file paths eliminate ambiguity (AI success rate: 99%)

**What happens next**: After tasks generated, run `/speckit.implement` to execute implementation.

---

## Outline

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 SPEC-KIT TASK GENERATION WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Loading plan, spec, data model, and API contracts         │
│ • Extracting user stories with priorities                   │
│ • Generating 40-80 granular tasks                           │
│ • Organizing by user story (independent slices)             │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • User story organization → incremental delivery            │
│ • Independent tests → ship Story 1 before Story 2           │
│ • Parallel tasks → faster development                       │
│ • Absolute paths → AI can execute without guessing          │
│                                                              │
│ KEY CONCEPTS:                                               │
│ • [P] marker: Task can run in parallel (different files)    │
│ • [US1] label: Task belongs to User Story 1                 │
│ • Independent test: Story deliverable without others        │
│ • MVP scope: Usually just User Story 1 (P1)                 │
└─────────────────────────────────────────────────────────────┘
```

1. **Setup**: Detect feature context from current directory or user input:
   - Look for `specs/*/` directories containing spec.md and plan.md
   - If in a feature directory (contains spec.md), use that as FEATURE_DIR
   - Otherwise, prompt user to specify which feature
   - Scan FEATURE_DIR to build AVAILABLE_DOCS list (spec.md, plan.md, data-model.md, contracts/, research.md, quickstart.md)
   - All paths must be absolute

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories with priorities)
   - **Optional**: data-model.md (entities), contracts/ (API endpoints), research.md (decisions), quickstart.md (test scenarios)
   - Note: Not all projects have all documents. Generate tasks based on what's available.

2.5 **Pre-Task Validation** (before generating tasks):

**A. User Story Extraction** (EC-015):

   Scan spec.md and plan.md for user stories:
   ```bash
   # Look for user story patterns
   STORIES=$(grep -E "^(###?\s*)?(User Story|US|Story)\s*\d|^-\s*\*\*P[0-9]|^-\s*P[0-9]:|Priority:\s*P[0-9]" spec.md plan.md 2>/dev/null | wc -l)
   
   # Also look for acceptance criteria or goals
   CRITERIA=$(grep -iE "acceptance|criteria|goal|objective|user can|user should|must be able" spec.md plan.md 2>/dev/null | wc -l)
   ```

   **If no clear user stories found** (STORIES=0 AND CRITERIA<3):
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ⚠️  NO CLEAR USER STORIES FOUND                             │
   ├─────────────────────────────────────────────────────────────┤
   │ Cannot find user stories or acceptance criteria in spec.   │
   │                                                              │
   │ Task generation requires clear stories to organize tasks    │
   │ and enable independent testing/delivery.                    │
   │                                                              │
   │ SEARCHED FOR:                                               │
   │ • "User Story 1/2/3" or "US1/US2/US3"                      │
   │ • Priority markers (P1, P2, P3)                            │
   │ • Acceptance criteria                                       │
   │ • "User can..." / "User should..." statements              │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] Let me extract stories from the spec (AI inference)    │
   │ [2] Generate flat task list (no user story organization)   │
   │ [3] Edit spec first (add user stories manually)            │
   │ [4] Abort                                                   │
   │                                                              │
   │ Enter choice [1/2/3/4]:                                     │
   └─────────────────────────────────────────────────────────────┘
   ```

   **If [1] AI inference**:
   - Analyze spec for implicit user stories (functional groups)
   - Present extracted stories for confirmation:
     ```
     📋 EXTRACTED USER STORIES (please confirm):
     
     US1 (P1): [inferred story 1 summary]
     US2 (P2): [inferred story 2 summary]
     ...
     
     Does this look correct? (yes/edit/abort)
     ```
   - If user says "yes", proceed with inferred stories
   - If user says "edit", allow refinement

   **If [2] Flat task list**:
   - Generate tasks without [US] labels
   - Add warning: "⚠️ Tasks not organized by user story - incremental delivery limited"

   **If [3] Edit spec**: Stop and wait for user
   **If [4] Abort**: Exit

**B. Dependency Validation** (EC-016 - Circular Dependencies):

   After generating initial task list (before finalizing):
   
   Build dependency graph and check for cycles:
   ```
   GRAPH = {}
   for each task with dependencies:
     GRAPH[task_id] = list_of_dependencies
   
   # Check for cycles using DFS
   CYCLES = detect_cycles(GRAPH)
   ```

   **If circular dependencies detected**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ 🔄 CIRCULAR DEPENDENCY DETECTED                            │
   ├─────────────────────────────────────────────────────────────┤
   │ Found a cycle in task dependencies:                        │
   │                                                              │
   │ [T005] → [T012] → [T008] → [T005] (cycle!)                │
   │                                                              │
   │ Details:                                                    │
   │ • T005: Create UserService (needs UserModel from T012)     │
   │ • T012: Create UserModel (needs validation from T008)      │
   │ • T008: Create validators (needs types from T005)          │
   │                                                              │
   │ RESOLUTION OPTIONS:                                         │
   │ [1] Break cycle at T008 (make validators independent)      │
   │ [2] Merge T005+T012 (combine into single task)             │
   │ [3] Create interface first (abstract dependency)           │
   │ [4] Let me resolve this manually                           │
   │                                                              │
   │ Enter choice [1/2/3/4]:                                     │
   └─────────────────────────────────────────────────────────────┘
   ```

   Apply selected resolution and re-validate.

**C. File Path Validation** (EC-017 - Non-existent files):

   After generating tasks, validate all file paths:
   ```bash
   REFERENCED_FILES=$(grep -oE 'src/[^ ]+|lib/[^ ]+|app/[^ ]+' tasks.md | sort -u)
   
   for file in $REFERENCED_FILES; do
     # Check if it's a "create" task or "modify" task
     TASK_TYPE=$(grep "$file" tasks.md | head -1)
     
     if [[ "$TASK_TYPE" == *"Create"* ]] || [[ "$TASK_TYPE" == *"Add"* ]]; then
       # New file - check parent directory exists
       PARENT_DIR=$(dirname "$file")
       if [ ! -d "$PARENT_DIR" ] && [ ! -d "$(dirname $PARENT_DIR)" ]; then
         PROBLEMATIC+=("$file - parent directory doesn't exist")
       fi
     else
       # Modify task - file should exist OR be created by earlier task
       if [ ! -f "$file" ]; then
         CREATES_BEFORE=$(grep -B100 "$file" tasks.md | grep -E "Create.*$file")
         if [ -z "$CREATES_BEFORE" ]; then
           PROBLEMATIC+=("$file - file doesn't exist and no create task found")
         fi
       fi
     fi
   done
   ```

   **If problematic paths found**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ⚠️  FILE PATH ISSUES DETECTED                               │
   ├─────────────────────────────────────────────────────────────┤
   │ Some task file paths may be problematic:                    │
   │                                                              │
   │ [LIST EACH PROBLEMATIC FILE WITH REASON]                   │
   │ • src/services/user.ts - no create task, doesn't exist     │
   │ • lib/utils/helpers/deep.ts - parent dir doesn't exist     │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] Add directory creation tasks automatically              │
   │ [2] Fix paths manually (I'll update)                        │
   │ [3] Proceed anyway (implementation may fail)                │
   │                                                              │
   │ Enter choice [1/2/3]:                                       │
   └─────────────────────────────────────────────────────────────┘
   ```

   **If [1] Auto-fix**: Insert directory creation tasks in Setup phase
   **If [2] Manual**: Wait for user
   **If [3] Proceed**: Add warning comment above affected tasks

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories with their priorities (P1, P2, P3, etc.)
   - If data-model.md exists: Extract entities and map to user stories
   - If contracts/ exists: Map endpoints to user stories
   - If research.md exists: Extract decisions for setup tasks
   - Generate tasks organized by user story (see Task Generation Rules below)
   - Generate dependency graph showing user story completion order
   - Create parallel execution examples per user story
   - Validate task completeness (each user story has all needed tasks, independently testable)

4. **Generate tasks.md**: Use `.specify.specify/templates/tasks-template.md` as structure, fill with:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks (project initialization)
   - Phase 2: Foundational tasks (blocking prerequisites for all user stories)
   - Phase 3+: One phase per user story (in priority order from spec.md)
   - Each phase includes: story goal, independent test criteria, tests (if requested), implementation tasks
   - Final Phase: Polish & cross-cutting concerns
   - All tasks must follow the strict checklist format (see Task Generation Rules below)
   - Clear file paths for each task
   - Dependencies section showing story completion order
   - Parallel execution examples per story
   - Implementation strategy section (MVP first, incremental delivery)

5. **Report**: Output path to generated tasks.md and summary:
   - Total task count
   - Task count per user story
   - **Time estimate summary**:
     - Small tasks: X (≈ X * 10 min)
     - Medium tasks: X (≈ X * 30 min)
     - Large tasks: X (≈ X * 60 min)
     - XL tasks: X (consider splitting)
     - **Estimated total**: X-Y hours
   - Parallel opportunities identified
   - Independent test criteria for each story
   - Suggested MVP scope (typically just User Story 1)
   - Format validation: Confirm ALL tasks follow the checklist format (checkbox, ID, size, labels, file paths)

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story to enable independent implementation and testing.

**Tests are OPTIONAL**: Only generate test tasks if explicitly requested in the feature specification or if user requests TDD approach.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[Story] label**: REQUIRED for user story phase tasks only
   - Format: [US1], [US2], [US3], etc. (maps to user stories from spec.md)
   - Setup phase: NO story label
   - Foundational phase: NO story label  
   - User Story phases: MUST have story label
   - Polish phase: NO story label
5. **[Size] T-shirt sizing**: Effort estimation using S/M/L/XL
   - `[S]` = Small (< 15 min) - simple file creation, config change
   - `[M]` = Medium (15-45 min) - standard implementation task
   - `[L]` = Large (45-90 min) - complex logic, multiple dependencies
   - `[XL]` = Extra Large (> 90 min) - consider splitting into subtasks
6. **Description**: Clear action with exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 [S] Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] [M] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] [S] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [US1] [L] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID, size, and Story label)
- ❌ WRONG: `T001 [US1] Create model` (missing checkbox)
- ❌ WRONG: `- [ ] [US1] Create User model` (missing Task ID and size)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (missing size and file path)

### Task Organization

1. **From User Stories (spec.md)** - PRIMARY ORGANIZATION:
   - Each user story (P1, P2, P3...) gets its own phase
   - Map all related components to their story:
     - Models needed for that story
     - Services needed for that story
     - Endpoints/UI needed for that story
     - If tests requested: Tests specific to that story
   - Mark story dependencies (most stories should be independent)

2. **From Contracts**:
   - Map each contract/endpoint → to the user story it serves
   - If tests requested: Each contract → contract test task [P] before implementation in that story's phase

3. **From Data Model**:
   - Map each entity to the user story(ies) that need it
   - If entity serves multiple stories: Put in earliest story or Setup phase
   - Relationships → service layer tasks in appropriate story phase

4. **From Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Story-specific setup → within that story's phase

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before user stories)
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Tests (if requested) → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns

---

## Next Steps: GitHub Issue Workflow

After generating tasks.md, create GitHub issues for multi-PR feature implementation.

### Execution Approaches

| Approach | Description | Best For |
|----------|-------------|----------|
| **Sequential** | Tasks execute one at a time, each merges before next starts | Complex features, tight coupling, risk-averse |
| **Stacked** | Dependent tasks branch from parent branches, multiple PRs in flight | Well-defined boundaries, high velocity needed |
| **Hybrid** | Stack within phases, sequential between phases | Balance of risk and velocity |

### Creating GitHub Issues

**For each task in tasks.md, create a GitHub issue with**:

**Title**: `[JIRA-ID] Task: [Task Description]`

**Labels**: 
- `subtask`, `copilot` for independent tasks
- `subtask`, `copilot`, `stacked` for dependent tasks

**Required References for GitHub Copilot**:
```markdown
1. Constitution: `.specify/memory/constitution.md`
2. Feature Spec: `specs/###-feature-name/spec.md`
3. Implementation Plan: `specs/###-feature-name/plan.md`
4. Task List: `specs/###-feature-name/tasks.md`
5. API Contract: `specs/###-feature-name/contracts/*.yaml`
```

### Branch Strategy

**Independent tasks** (marked `[P]`):
```bash
git checkout -b feat/JIRA-ID-1_task-name main
```

**Dependent tasks** (stacked on parent):
```bash
git fetch origin
git checkout -b feat/JIRA-ID-2_task-name origin/feat/JIRA-ID-1_parent-task
```

### Stacked PR Workflow

1. **Create branch from parent**: `git checkout -b feat/child origin/feat/parent`
2. **Implement task**: Code can import/use code from parent
3. **Create PR**: Mark as "Stacked on #<parent-pr-number>"
4. **After parent merges**: Rebase onto main
   ```bash
   git checkout feat/child
   git fetch origin
   git rebase origin/main
   git push --force-with-lease
   ```

### Merge Order

1. **Phase 1 tasks** (parallel) → merge in any order
2. **Phase 2 tasks** (foundational) → merge after Phase 1
3. **User Story tasks** → merge after Phase 2, respecting `[D:T###]` dependencies
4. **Stacked PRs** → parent merges first, then child rebases and merges

### Implementation Checklist (Per Task)

**Code Implementation**:
- [ ] Repository layer (if DB changes)
- [ ] Service layer
- [ ] Controller
- [ ] Validation schemas
- [ ] Error handling
- [ ] OpenAPI annotations
- [ ] No PII in logs

**Quality Gates**:
- [ ] Lint passes
- [ ] Tests pass (if applicable)
- [ ] Constitution compliance verified

### Timeline Comparison

| Approach | 4 Tasks |
|----------|---------|
| Sequential | 4 days (1 task/day) |
| Stacked | 2 days (50% faster) |

**Stacked example**:
```
Day 1 AM:   T001, T002, T003 start in parallel
Day 1 PM:   T001 done → T004 starts (stacked on T001)
Day 2 AM:   T002, T003 done → T004 done → All rebase
Day 2 PM:   All merge
```
