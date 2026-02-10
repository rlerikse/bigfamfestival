---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## 📋 What This Command Does

**Purpose**: Execute all tasks from tasks.md to build the feature following the implementation plan.

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md#the-spec-kit-workflow)):
- **Phase 4**: Implementation (tasks.md → working code)
- **After /speckit.tasks**: Tasks defined, ready for execution
- **Quality gates**: Checklist validation, constitution compliance, test requirements

**This command will**:
1. **Validate checklists** (if incomplete, ask permission to proceed)
2. **Load context** (tasks.md, plan.md, data-model.md, contracts/)
3. **Initialize checkpoint** (create recovery point, track progress)
4. **Verify project setup** (create/update .gitignore, .dockerignore based on tech stack)
5. **Execute tasks** (phase-by-phase, mark completed, checkpoint after each phase)
6. **Run validation** (after each phase: tests pass, linting clean, type checks)
7. **Report completion** (summary with next steps, cleanup checkpoint)

**Why use this?**
- ✅ Automatic checklist validation (quality gate before coding)
- ✅ **Checkpoint/resume** (recover from interruptions, rollback on failure)
- ✅ Phase-by-phase execution with validation
- ✅ Constitution compliance enforced throughout
- ✅ Progress tracking (tasks marked complete)
- ✅ Contract compliance verified against OpenAPI specs
- ✅ **Rollback capability** (revert to last checkpoint on critical failure)

**What happens next**: After implementation complete, create PR and request code review.

**Resume/Rollback Commands**:
- To resume interrupted implementation: `/speckit.implement --resume`
- To rollback to last checkpoint: `/speckit.implement --rollback`
- To start fresh (ignore checkpoint): `/speckit.implement --fresh`
- To auto-create PR after completion: `/speckit.implement --auto-pr`

---

## Outline

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️  SPEC-KIT IMPLEMENTATION WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Validating quality checklists (if exist)                   │
│ • Loading implementation context                            │
│ • Initializing checkpoint for recovery/rollback             │
│ • Executing tasks phase-by-phase                            │
│ • Validating after each phase (tests, linting, types)       │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • Checklist validation → quality gate before coding         │
│ • Checkpoint system → recover from interruptions            │
│ • Phase-by-phase → catch issues early                       │
│ • Constitution compliance → no technical debt               │
│ • Contract matching → APIs work as documented              │
│                                                              │
│ EXECUTION FLOW:                                             │
│ 0. Check for analysis block (CRITICAL issues block impl)    │
│ 1. Check for existing checkpoint (offer resume/rollback)    │
│ 2. Checklist validation (ask if incomplete)                 │
│ 3. Project setup (ignore files, dependencies)               │
│ 4. Execute phases (Setup → Foundational → User Stories)    │
│ 5. Checkpoint after each phase (save progress)              │
│ 6. Validate each phase (tests, linting)                     │
│ 7. Report completion (summary + next steps)                 │
│                                                              │
│ RECOVERY OPTIONS:                                           │
│ • --resume  : Continue from last checkpoint                 │
│ • --rollback: Revert to last clean checkpoint               │
│ • --fresh   : Ignore checkpoint, start over                 │
│ • --force   : Bypass analysis block (NOT RECOMMENDED)       │
└─────────────────────────────────────────────────────────────┘
```

1. **Check for analysis block** (CRITICAL issues from /speckit.analyze):

   **Block file location**: `FEATURE_DIR/.analysis-block`

   **If block file exists AND --force NOT provided**:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚫 IMPLEMENTATION BLOCKED BY ANALYSIS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   /speckit.analyze found CRITICAL issues that must be resolved.
   
   CRITICAL ISSUES:
   [List critical_issues from block file]
   
   TO PROCEED:
   1. Fix the CRITICAL issues listed above
   2. Run /speckit.analyze to verify fixes
   3. Block will be removed when no CRITICAL issues remain
   
   TO FORCE (NOT RECOMMENDED):
   /speckit.implement --force
   ⚠️  Warning: Forcing may result in constitution violations
   ```
   **STOP execution. Do not proceed.**

   **If block file exists AND --force provided**:
   ```
   ⚠️  FORCING IMPLEMENTATION DESPITE CRITICAL ISSUES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   You are bypassing the analysis block. This may result in:
   • Constitution violations in the final code
   • Incomplete feature implementation
   • Technical debt requiring future rework
   
   Are you sure you want to proceed? (yes/no)
   ```
   **Wait for explicit "yes" before continuing.**

   **If no block file**: Proceed to step 2.

2. **Check for checkpoint and handle arguments**:

   **Parse user arguments**:
   - `--resume`: Continue from last checkpoint (skip completed phases)
   - `--rollback`: Revert all changes since last checkpoint, then stop
   - `--fresh`: Delete checkpoint file, start from beginning
   - `--force`: Bypass analysis block (requires confirmation)
   - (no args): Check for checkpoint, offer options if exists

   **Checkpoint file location**: `FEATURE_DIR/.checkpoint.json`

   **Checkpoint structure**:
   ```json
   {
     "feature": "feature-name",
     "started_at": "2026-01-14T10:30:00Z",
     "last_updated": "2026-01-14T11:45:00Z",
     "current_phase": "Core Development",
     "completed_phases": ["Setup", "Tests"],
     "completed_tasks": ["TASK-001", "TASK-002", "TASK-003"],
     "failed_tasks": [],
     "files_created": ["src/models/user.ts", "src/services/auth.ts"],
     "files_modified": ["package.json", "tsconfig.json"],
     "git_commit_before": "abc123def",
     "last_checkpoint_commit": "def456ghi"
   }
   ```

   **If checkpoint exists AND no arguments**:
   ```
   ⚠️  EXISTING CHECKPOINT DETECTED
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Feature: [feature-name]
   Started: [started_at]
   Last Updated: [last_updated]
   
   Progress:
   • Current Phase: [current_phase]
   • Completed Phases: [completed_phases count]/[total phases]
   • Completed Tasks: [completed_tasks count]/[total tasks]
   • Files Created: [files_created count]
   • Files Modified: [files_modified count]
   
   OPTIONS:
   1. Resume (continue from last checkpoint)
   2. Rollback (revert changes, delete checkpoint)
   3. Fresh start (delete checkpoint, start over)
   
   What would you like to do? (resume/rollback/fresh)
   ```
   
   **STOP and wait for user response**.

   **If --resume**: Load checkpoint, skip to current_phase, continue execution
   **If --rollback**: Execute rollback procedure (see step 14), then stop
   **If --fresh**: Delete checkpoint file, proceed with normal flow

3. **Detect feature context** from current directory or user input:
   - Look for `specs/*/` directories containing spec.md, plan.md, tasks.md
   - If in a feature directory (contains spec.md), use that as FEATURE_DIR
   - Otherwise, prompt user to specify which feature
   - Scan FEATURE_DIR to build AVAILABLE_DOCS list (spec.md, plan.md, tasks.md, data-model.md, contracts/)
   - All paths must be absolute
   - Verify tasks.md exists (required for implement)

4. **Load project conventions** (if available):

   **Check for conventions file**: `.specify/conventions/ai-instructions.md`

   **If conventions exist**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ 📚 PROJECT CONVENTIONS DETECTED                             │
   ├─────────────────────────────────────────────────────────────┤
   │ Loading coding conventions to ensure consistent             │
   │ implementation following established project patterns.      │
   │                                                              │
   │ Conventions cover:                                          │
   │ • File naming and structure patterns                        │
   │ • Architectural constraints and required services           │
   │ • Technology-specific style guides                          │
   │ • Project-unique patterns and practices                     │
   │                                                              │
   │ All generated code will follow these conventions.           │
   └─────────────────────────────────────────────────────────────┘
   ```

   **Load and parse**:
   - Read `.specify/conventions/ai-instructions.md`
   - Parse tech stack, architectural domains, style guides
   - Note required patterns and constraints
   - Store for reference during code generation

   **Show extracted constraints**:
   ```
   🔒 ARCHITECTURAL CONSTRAINTS LOADED:
   
   UI Domain:
   ✅ MUST use CSS Modules (.module.css)
   ✅ MUST import from design system
   ❌ NEVER use inline styles
   
   Data Layer:
   ✅ MUST use apiClient.ts for HTTP requests
   ✅ MUST use React Query for data fetching
   ❌ NEVER use fetch() directly
   
   State Management:
   ✅ MUST use Zustand for global state
   ✅ MUST use React Hook Form for forms
   ❌ NEVER use Redux
   
   All code generation will comply with these constraints.
   ```

   **If conventions missing**:
   ```
   ⚠️  NO PROJECT CONVENTIONS FOUND
   
   This repository doesn't have extracted coding conventions yet.
   
   RECOMMENDATION:
   Run /speckit.retro --conventions to extract project-specific patterns.
   This ensures new code follows established conventions.
   
   OPTIONS:
   [1] Run /speckit.retro --conventions now (recommended)
   [2] Continue without conventions (may introduce inconsistencies)
   
   Enter choice [1/2]:
   ```

   **If user chooses [1]**: Run `/speckit.retro --conventions`, then resume implementation
   **If user chooses [2]**: Continue with warning that code may not match existing patterns

5. **Check for conflicting changes** (before starting or each phase):

   **Run conflict detection**:
   ```bash
   # Fetch latest from remote
   git fetch origin
   
   # Check if our branch is behind
   BEHIND=$(git rev-list --count HEAD..origin/$(git branch --show-current) 2>/dev/null || echo "0")
   
   # Check for uncommitted changes in files we'll modify
   PLAN_FILES=$(grep -oE 'src/[^ ]+|lib/[^ ]+' plan.md 2>/dev/null | sort -u)
   MODIFIED=$(git diff --name-only 2>/dev/null)
   CONFLICTS=""
   for file in $PLAN_FILES; do
     if echo "$MODIFIED" | grep -q "$file"; then
       CONFLICTS="$CONFLICTS $file"
     fi
   done
   ```

   **If branch is behind remote**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ⚠️  REMOTE CHANGES DETECTED                                 │
   ├─────────────────────────────────────────────────────────────┤
   │ Your branch is [N] commits behind origin/[branch-name].    │
   │                                                              │
   │ This means someone else has pushed changes that might       │
   │ conflict with your implementation.                          │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] Pull & rebase (recommended)                             │
   │ [2] Pull & merge                                            │
   │ [3] Continue anyway (may cause conflicts later)             │
   │ [4] Abort                                                   │
   │                                                              │
   │ Enter choice [1/2/3/4]:                                     │
   └─────────────────────────────────────────────────────────────┘
   ```
   
   If [1]: Run `git pull --rebase origin $(git branch --show-current)`
   If [2]: Run `git pull origin $(git branch --show-current)`
   If [3]: Continue with warning logged
   If [4]: Stop execution

   **POST-MERGE VALIDATION (CRITICAL - PROJ-1367 Lesson Learned)**:
   
   After any pull/rebase/merge operation, MUST run validation before continuing:
   
   ```bash
   # Check for unresolved conflict markers
   if grep -rn "<<<<<<< HEAD\|>>>>>>>" src/ test/ 2>/dev/null; then
     echo "❌ Conflict markers found - resolve before continuing"
     exit 1
   fi
   
   # Run lint to catch parsing errors from bad merge resolution
   npm run lint
   if [ $? -ne 0 ]; then
     echo "❌ Lint errors detected - likely merge resolution issue"
     echo "Common causes:"
     echo "  • Duplicate class definitions"
     echo "  • Duplicate initialization blocks"
     echo "  • Incomplete statements"
     echo "  • Wrong constructor parameters"
     exit 1
   fi
   
   # Run typecheck
   npm run typecheck 2>/dev/null || npx tsc --noEmit
   ```

   **If merge validation fails**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ❌ POST-MERGE VALIDATION FAILED                             │
   ├─────────────────────────────────────────────────────────────┤
   │ Merge resolution introduced errors that must be fixed:      │
   │                                                              │
   │ [error details from lint/typecheck]                         │
   │                                                              │
   │ COMMON MERGE ISSUES (from PROJ-1367 lessons):                │
   │ • Duplicate class definitions (both branches had changes)   │
   │ • Duplicate code blocks (initialization, handlers)          │
   │ • Wrong constructor parameters (dependency changes)         │
   │ • Unused imports (kept from both branches)                  │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] Fix errors now (recommended - use Copilot Agent Mode)   │
   │ [2] Abort and rollback merge                                │
   │                                                              │
   │ Enter choice [1/2]:                                         │
   └─────────────────────────────────────────────────────────────┘
   ```

   If [1]: Pause for user to fix, then re-run validation
   If [2]: Run `git merge --abort` or `git rebase --abort`

   **IMPORTANT**: This validation catches 100% of preventable merge issues.
   Skipping this step cost 2.75 hours in PROJ-1367 post-merge debugging.

   **If uncommitted changes exist in files we'll modify**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ⚠️  UNCOMMITTED CHANGES IN TARGET FILES                     │
   ├─────────────────────────────────────────────────────────────┤
   │ You have uncommitted changes in files that will be          │
   │ modified during implementation:                             │
   │                                                              │
   │ [list of conflicting files]                                 │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] Stash changes (git stash, continue, pop after)          │
   │ [2] Commit changes now (enter commit message)               │
   │ [3] Continue anyway (changes may be overwritten)            │
   │ [4] Abort                                                   │
   │                                                              │
   │ Enter choice [1/2/3/4]:                                     │
   └─────────────────────────────────────────────────────────────┘
   ```

5. **Initialize checkpoint** (if not resuming):
   - Record current git commit hash as `git_commit_before`
   - Create checkpoint file with initial state
   - Initialize empty arrays for completed_tasks, files_created, files_modified

6. **Check checklists status** (if FEATURE_DIR/checklists/ exists):

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ STEP 1: CHECKLIST VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Validating quality checklists before implementation...

WHAT'S HAPPENING:
• Checking all checklists in FEATURE_DIR/checklists/
• Counting completed vs incomplete items
• Determining if quality gates are met

WHY THIS MATTERS:
• Checklists ensure requirements complete before coding
• Prevents building incomplete features
• Quality gate similar to PR approval process
```

   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     - Completed items: Lines matching `- [X]` or `- [x]`
     - Incomplete items: Lines matching `- [ ]`
   - Create a status table:

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```

   - Calculate overall status:
     - **PASS**: All checklists have 0 incomplete items
     - **FAIL**: One or more checklists have incomplete items

   - **If any checklist is incomplete**:
     - Display the table with incomplete item counts
     - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     - Wait for user response before continuing
     - If user says "no" or "wait" or "stop", halt execution
     - If user says "yes" or "proceed" or "continue", proceed to step 6

   - **If all checklists are complete**:
     - Display the table showing all checklists passed
     - Automatically proceed to step 6

6. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios

7. **Project Setup Verification**:
   - **REQUIRED**: Create/verify ignore files based on actual project setup:

   **Detection & Creation Logic**:
   - Check if the following command succeeds to determine if the repository is a git repo (create/verify .gitignore if so):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Check if Dockerfile* exists or Docker in plan.md → create/verify .dockerignore
   - Check if .eslintrc*or eslint.config.* exists → create/verify .eslintignore
   - Check if .prettierrc* exists → create/verify .prettierignore
   - Check if .npmrc or package.json exists → create/verify .npmignore (if publishing)
   - Check if terraform files (*.tf) exist → create/verify .terraformignore
   - Check if .helmignore needed (helm charts present) → create/verify .helmignore

   **If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
   **If ignore file missing**: Create with full pattern set for detected technology

7.5 **External Dependency Verification** (BEFORE Phase Execution):

   **Check network connectivity**:
   ```bash
   # Test network availability
   if ! curl -s --connect-timeout 5 https://registry.npmjs.org > /dev/null 2>&1; then
     NETWORK_AVAILABLE=false
   else
     NETWORK_AVAILABLE=true
   fi
   ```

   **Identify external dependencies from plan.md/tasks.md**:
   ```bash
   # Extract package managers and registries needed
   PACKAGE_MANAGERS=()
   if grep -qE "npm install|yarn add|pnpm add" tasks.md; then
     PACKAGE_MANAGERS+=("npm:https://registry.npmjs.org")
   fi
   if grep -qE "pip install|poetry add" tasks.md; then
     PACKAGE_MANAGERS+=("pip:https://pypi.org")
   fi
   if grep -qE "cargo add|cargo install" tasks.md; then
     PACKAGE_MANAGERS+=("cargo:https://crates.io")
   fi
   if grep -qE "go get|go mod" tasks.md; then
     PACKAGE_MANAGERS+=("go:https://proxy.golang.org")
   fi
   
   # Test each registry
   for pm in "${PACKAGE_MANAGERS[@]}"; do
     name="${pm%%:*}"
     url="${pm##*:}"
     if ! curl -s --connect-timeout 5 "$url" > /dev/null 2>&1; then
       UNAVAILABLE_REGISTRIES+=("$name")
     fi
   done
   ```

   **If network unavailable or registries down**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ⚠️  EXTERNAL DEPENDENCY UNAVAILABLE                         │
   ├─────────────────────────────────────────────────────────────┤
   │ The following external resources are not accessible:        │
   │                                                              │
   │ [LIST UNAVAILABLE - e.g., npm registry, pypi.org]           │
   │                                                              │
   │ This may affect:                                            │
   │ • Package installation (npm install, pip install, etc.)     │
   │ • Dependency resolution                                     │
   │ • Build processes that require downloads                    │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] Continue with cached packages (may work if deps cached) │
   │ [2] Skip dependency installation tasks (partial impl)       │
   │ [3] Offline mode (skip all network-requiring tasks)         │
   │ [4] Abort and retry when network available                  │
   │                                                              │
   │ Enter choice [1/2/3/4]:                                     │
   └─────────────────────────────────────────────────────────────┘
   ```

   **If [1] Continue with cached**:
   - Attempt installation, checkpoint before each attempt
   - If fails, offer options 2, 3, or 4
   - Add warning to implementation report

   **If [2] Skip dependency tasks**:
   - Mark dependency-related tasks as SKIPPED
   - Create `.dependency-pending` file listing skipped packages
   - Continue with remaining tasks
   - Add "⚠️ PENDING DEPENDENCIES" to final report

   **If [3] Offline mode**:
   - Set `OFFLINE_MODE=true` in checkpoint
   - Skip ALL tasks containing: `npm install`, `pip install`, `curl`, `wget`, `fetch`, `download`
   - Mark tasks as OFFLINE_DEFERRED
   - Implementation continues with local-only work
   - Generate `.offline-tasks.json` for later completion

   **If [4] Abort**:
   - Save checkpoint with current progress
   - Exit with message to retry later

   **On mid-implementation dependency failure**:
   ```
   ❌ DEPENDENCY INSTALLATION FAILED
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Task: [TASK-ID] - Install [package-name]
   Error: [npm/pip/etc error message]
   
   Checkpoint saved: [commit-hash]
   
   OPTIONS:
   1. Retry installation
   2. Skip this dependency and continue
   3. Rollback to last checkpoint
   4. Abort (keep current state)
   
   What would you like to do? (retry/skip/rollback/abort)
   ```

   **Dependency failure recovery**:
   - Track failed dependencies in checkpoint: `failed_dependencies: []`
   - On retry, only attempt failed installations
   - On skip, add to `.dependency-pending` for manual resolution

   **Common Patterns by Technology** (from plan.md tech stack):
   - **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `Makefile`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Swift**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
   - **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Tool-Specific Patterns**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

8. Parse tasks.md structure and extract:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements
   - **If resuming**: Skip phases listed in checkpoint's `completed_phases`

9. Execute implementation following the task plan:
   - **Phase-by-phase execution**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together  
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   - **Follow conventions**: If conventions loaded, generate code matching documented patterns
   - **Validation checkpoints**: Verify each phase completion before proceeding
   - **CHECKPOINT AFTER EACH PHASE**: Update checkpoint file with progress (see step 10)

   **Code Generation with Conventions**:
   
   When generating any code file, if conventions loaded:
   
   a. **Determine file category**:
      - Check file path against patterns in `file-categorization.json`
      - Example: `src/components/Button.tsx` → `react-components` category
      - Example: `src/hooks/useAuth.ts` → `hooks` category
   
   b. **Load relevant style guide**:
      - Reference `.specify/conventions/style-guides/[category].md`
      - Extract naming conventions, structure patterns, import organization
   
   c. **Apply architectural constraints**:
      - Check `architectural-domains.json` for required patterns
      - Example: If data-layer domain requires apiClient, use it
      - Example: If UI domain requires CSS Modules, create .module.css file
   
   d. **Follow unique project patterns**:
      - Match naming conventions from style guide
      - Follow file structure templates from examples
      - Use consistent import organization
      - Apply project-specific practices (not generic best practices)
   
   e. **Generate compliant code**:
      ```
      📝 GENERATING: src/components/AppointmentCard.tsx
      
      Category: react-components
      Style Guide: .specify/conventions/style-guides/react-components.md
      
      Applying conventions:
      ✓ File naming: PascalCase matching component name
      ✓ Component structure: Function expression with TypeScript
      ✓ Imports: External → Internal → Types → Styles
      ✓ Styling: CSS Module (.module.css colocated)
      ✓ Props: Single interface with optional props using ?
      ✓ State: Hooks first, then event handlers, then render
      
      Architectural constraints:
      ✓ UI Domain: Using CSS Modules (not inline styles)
      ✓ UI Domain: Importing from @ford/design-system
      ✓ State: Using Zustand store for global state
      
      Generating code...
      ```
   
   f. **Verify compliance after generation**:
      - Check generated code matches style guide patterns
      - Verify no architectural constraint violations
      - Confirm file structure matches documented conventions
   
   **If conventions not loaded**:
   - Generate code following plan.md tech stack guidance
   - Use framework best practices
   - Warn user that code may not match existing patterns
   
   **Example**: Creating a new React component with conventions:
   
   Based on conventions in `.specify/conventions/style-guides/react-components.md`:
   
   ```typescript
   // src/components/AppointmentCard.tsx
   
   // 1. Imports (external, internal, types, styles)
   import { useState } from 'react';
   import { useAppointments } from '@/hooks/useAppointments';
   import type { Appointment } from '@/types/appointment';
   import styles from './AppointmentCard.module.css';
   
   // 2. Type definitions
   interface AppointmentCardProps {
     appointment: Appointment;
     onSelect?: (id: string) => void;
   }
   
   // 3. Component (following documented pattern)
   export const AppointmentCard: React.FC<AppointmentCardProps> = ({
     appointment,
     onSelect
   }) => {
     // 4. Hooks first
     const [isExpanded, setIsExpanded] = useState(false);
     
     // 5. Event handlers
     const handleClick = () => {
       setIsExpanded(prev => !prev);
       onSelect?.(appointment.id);
     };
     
     // 6. Render
     return (
       <div className={styles.card} onClick={handleClick}>
         {/* Implementation */}
       </div>
     );
   };
   ```
   
   And colocated:
   - `src/components/AppointmentCard.module.css` (CSS Module)
   - `src/components/AppointmentCard.test.tsx` (Test file)

10. **Checkpoint updates** (after each phase completion):
   - Update `current_phase` to next phase name
   - Add completed phase to `completed_phases` array
   - Add completed task IDs to `completed_tasks` array
   - Track all created files in `files_created` array
   - Track all modified files in `files_modified` array
   - Update `last_updated` timestamp
   - **Commit checkpoint**: Create git commit with message `checkpoint: [phase-name] complete`
   - Update `last_checkpoint_commit` with new commit hash

   **Show user after each phase**:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💾 CHECKPOINT SAVED: [phase-name]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   • Completed Tasks: [count]/[total]
   • Files Created: [count]
   • Files Modified: [count]
   • Git Commit: [short-hash]
   
   ✓ You can safely stop here and resume later with:
     /speckit.implement --resume
   ```

11. Implementation execution rules:
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish and validation**: Unit tests, performance optimization, documentation

12. Progress tracking and error handling:
   - Report progress after each completed task
   - **On task failure**: Update checkpoint, offer rollback option
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** For completed tasks, make sure to mark the task off as [X] in the tasks file.

   **On critical failure**, show user:
   ```
   ❌ CRITICAL FAILURE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Task [TASK-ID] failed: [error description]
   
   Current State:
   • Last Checkpoint: [phase-name] at [commit-hash]
   • Tasks Completed: [count]/[total]
   
   OPTIONS:
   1. Rollback to last checkpoint (revert to [phase-name])
   2. Abort (keep current state, fix manually)
   3. Retry (attempt task again)
   
   What would you like to do? (rollback/abort/retry)
   ```


13. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original specification
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary of completed work
   
   **CRITICAL: Update checkpoint to mark completion before cleanup**:
   - Update checkpoint file `.checkpoint.json` with final state:
     ```json
     {
       "current_phase": "Complete",
       "completed_phases": ["Setup", "Tests", "Core", "Integration", "Polish"],
       "completed_tasks": ["ALL_TASK_IDS"],
       "completion_status": "success",
       "completed_at": "2026-01-21T12:00:00Z",
       "files_created": [...],
       "files_modified": [...],
       "last_checkpoint_commit": "abc123"
     }
     ```
   - Commit final checkpoint: `git commit -m "checkpoint: implementation complete"`
   - Update `last_checkpoint_commit` with final commit hash
   - **Then delete checkpoint file** (implementation complete, no recovery needed)
   
   **Show user**:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💾 FINAL CHECKPOINT SAVED
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   • Status: Implementation Complete
   • All Phases: Complete  
   • All Tasks: [total] of [total] (100%)
   • Files Created: [count]
   • Files Modified: [count]
   • Final Commit: [short-hash]
   
   ✓ Checkpoint marked as complete and cleaned up
   ```


14. **Rollback procedure** (when user requests --rollback or chooses rollback on failure):

   **Show user**:
   ```
   ⏪ ROLLBACK IN PROGRESS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Rolling back to checkpoint: [last_checkpoint_commit]
   
   This will:
   • Revert all changes since last checkpoint
   • Remove [files_created count] newly created files
   • Restore [files_modified count] modified files to previous state
   • Reset task completion markers in tasks.md
   
   Proceed with rollback? (yes/no)
   ```

   **If user confirms**:
   1. Run `git reset --hard [last_checkpoint_commit]` to revert code changes
   2. Update tasks.md to unmark tasks completed after checkpoint
   3. Delete the checkpoint file
   4. Report rollback complete

   **After rollback**:
   ```
   ✓ ROLLBACK COMPLETE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Reverted to: [commit-hash] ([phase-name])
   
   Next steps:
   • Fix the issue that caused the failure
   • Run /speckit.implement to restart from beginning
   • Or run /speckit.implement --resume if checkpoint exists
   ```

15. **Update workspace context**: After implementation is complete, push changes to trigger the sync workflow which updates workspace context files reflecting the completed feature.

16. **Generate PR Description**: Automatically create a comprehensive pull request description from the spec.

   **Auto-generate** the following file: `specs/[NNN]-[short-name]/PR_DESCRIPTION.md`

   **PR description template**:
   ```markdown
   ## Summary
   [One-sentence summary from spec.md Description section]

   ## Feature: [Feature Name from spec.md]
   [2-3 sentence overview from spec.md Business Context]

   ## Changes

   ### Files Created ([count])
   [List from checkpoint.files_created, grouped by type]
   - **Components**: `src/components/...`
   - **Services**: `src/services/...`
   - **Tests**: `tests/...`

   ### Files Modified ([count])
   [List from checkpoint.files_modified]

   ## Spec Compliance

   ### User Stories Implemented
   - [x] US-1: [Title] - [Status]
   - [x] US-2: [Title] - [Status]
   [From spec.md User Stories section]

   ### Acceptance Criteria
   | Criterion | Status | Evidence |
   |-----------|--------|----------|
   | [AC-1] | ✅ | [Test file or behavior] |
   | [AC-2] | ✅ | [Test file or behavior] |
   [From spec.md Acceptance Criteria section]

   ### Constitution Compliance
   - [x] [ARCH-001] - [Rule satisfied]
   - [x] [TEST-001] - [Test coverage met]
   [From constitution.md cross-referenced with implementation]

   ## Testing
   
   **Test Coverage**: [X]% (target: [Y]%)
   
   **Test Commands**:
   ```bash
   [Test command from plan.md or package.json]
   ```

   ## Linked Spec
   - Specification: `specs/[NNN]-[short-name]/spec.md`
   - Implementation Plan: `specs/[NNN]-[short-name]/plan.md`
   - Task Breakdown: `specs/[NNN]-[short-name]/tasks.md`

   ## Reviewers
   @[reviewer from constitution.md or plan.md]
   ```

   **Show user**:
   ```
   ✅ IMPLEMENTATION COMPLETE
   ════════════════════════════════════════════════════════════
   
   📝 PR Description Generated:
      specs/[NNN]-[short-name]/PR_DESCRIPTION.md
   
   NEXT STEPS:
   1. Review the generated PR description
   2. Create PR with: gh pr create --body-file specs/[NNN]/PR_DESCRIPTION.md
   3. Or copy PR_DESCRIPTION.md content to GitHub PR form
   
   ════════════════════════════════════════════════════════════
   ```

   **If `--auto-pr` flag is set**:
   ```bash
   # Check if gh CLI is available
   if command -v gh &> /dev/null; then
     gh pr create \
       --title "feat: [Feature Name from spec.md]" \
       --body-file specs/[NNN]-[short-name]/PR_DESCRIPTION.md \
       --base main
   else
     echo "⚠️  GitHub CLI (gh) not installed. PR description saved to:"
     echo "   specs/[NNN]-[short-name]/PR_DESCRIPTION.md"
   fi
   ```

---

## Edge Case Handling

### Untyped JavaScript Codebase (EC-034)

If project uses JavaScript without TypeScript/Flow types:

**Detection**:
```bash
# Check for type system
HAS_TYPES=false
[ -f "tsconfig.json" ] && HAS_TYPES=true
[ -f ".flowconfig" ] && HAS_TYPES=true
[ -f "jsconfig.json" ] && grep -q "checkJs" jsconfig.json && HAS_TYPES=true
```

**If no types detected**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  UNTYPED CODEBASE DETECTED (EC-034)                      │
├─────────────────────────────────────────────────────────────┤
│ This project uses JavaScript without type annotations.      │
│                                                              │
│ IMPACT ON IMPLEMENTATION:                                   │
│ • Type inference limited to JSDoc comments                  │
│ • Refactoring suggestions may be less accurate              │
│ • Some constitution checks (contract types) harder to verify│
│                                                              │
│ OPTIONS:                                                    │
│ [1] Proceed as-is (add JSDoc comments where possible)       │
│ [2] Add TypeScript for new files only (*.ts)                │
│ [3] Create type stubs (*.d.ts) for existing code            │
│ [4] Enable checkJs in jsconfig.json (basic type checking)   │
│                                                              │
│ Enter choice [1/2/3/4]:                                     │
└─────────────────────────────────────────────────────────────┘
```

**If [1] Proceed as-is**:
- Add JSDoc annotations to new functions
- Note type uncertainties in implementation comments

**If [2] TypeScript for new files**:
- Create minimal tsconfig.json with `allowJs: true`
- New files use .ts extension
- Gradually improves type coverage

### Large Implementation Context Window (EC-035)

Before starting implementation, check context size:

```bash
# Estimate tokens needed
SPEC_SIZE=$(wc -w < spec.md)
PLAN_SIZE=$(wc -w < plan.md)
TASKS_SIZE=$(wc -w < tasks.md)
TOTAL_WORDS=$((SPEC_SIZE + PLAN_SIZE + TASKS_SIZE))

# Rough token estimate (words * 1.3)
ESTIMATED_TOKENS=$((TOTAL_WORDS * 13 / 10))
```

**If implementation may exceed context window** (>100k estimated tokens):
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  LARGE IMPLEMENTATION DETECTED (EC-035)                  │
├─────────────────────────────────────────────────────────────┤
│ This implementation may exceed AI context limits:           │
│                                                              │
│ CONTEXT SIZE ESTIMATE:                                      │
│ • spec.md: ~[SPEC_SIZE] words                              │
│ • plan.md: ~[PLAN_SIZE] words                              │
│ • tasks.md: ~[TASKS_SIZE] words ([TASK_COUNT] tasks)       │
│ • Estimated total: ~[ESTIMATED_TOKENS] tokens              │
│                                                              │
│ RECOMMENDED APPROACH:                                       │
│ [1] Chunked implementation (process by user story)          │
│ [2] Minimal context (load only current phase)               │
│ [3] Proceed with full context (may lose early context)      │
│                                                              │
│ Enter choice [1/2/3]:                                       │
└─────────────────────────────────────────────────────────────┘
```

**If [1] Chunked implementation**:
- Implement one user story at a time
- After each story: checkpoint, clear context, reload fresh
- Prevents context overflow mid-implementation
- Each chunk is independently testable

**If [2] Minimal context**:
- Load only: current phase tasks, relevant plan section, constitution
- Don't load full spec/plan into context
- Reference files on-demand as needed
- Trade comprehension for context space

**Checkpoint after each user story** (for large implementations):
```
✅ User Story 1 Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks completed: 12/45
Context usage: ~40k tokens

Saving checkpoint before continuing to User Story 2...
This prevents context overflow on large implementations.

Continue to User Story 2? (yes/pause)
```

---

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/speckit.tasks` first to regenerate the task list.
