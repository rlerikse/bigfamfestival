---
description: Migrate an existing repository to Spec-Kit with complete infrastructure setup, feature discovery, and retroactive documentation.
---

# /speckit.migrate - Migrate Repository to Spec-Kit

**Purpose**: Migrate an existing repository to the Spec-Kit framework, including infrastructure setup, retroactive feature documentation, and workspace integration.

---

## 📋 What This Command Does

**Purpose**: Complete Spec-Kit installation and setup for existing repositories.

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md#migration-guide)):
- **Infrastructure setup**: Install constitution, templates, prompts, scripts
- **Feature discovery**: Analyze code to identify existing features
- **Retroactive documentation**: Generate specs for implemented features
- **Workspace integration**: Update context files (if monorepo)

**This command will**:
1. **Analyze repository** (detect project type, language, features)
2. **Install infrastructure** (constitution, templates, prompts, scripts)
3. **Customize configuration** (tech stack-specific settings)
4. **Discover features** (scan controllers/routes/components)
5. **Generate retroactive specs** (document existing features)
6. **Update workspace context** (if monorepo: all-specs.md, repo-index.json)
7. **Validate installation** (run /speckit.validate)

**Why use this?**
- ✅ Complete setup in one command (vs manual file creation)
- ✅ Tech stack detection (auto-customizes for Node.js/React/etc.)
- ✅ Retroactive documentation (specs for existing code)
- ✅ Portable infrastructure (repos work standalone)
- ✅ Workspace integration (monorepo context updated)

**What happens next**: Start using Spec-Kit commands (/speckit.specify for new features, /speckit.patch for fixes).

---

## Trigger

```
/speckit.migrate [repository-name]
```

**Examples**:
- `/speckit.migrate` - Migrate all repositories in workspace
- `/speckit.migrate fsr-dealer-settings-service` - Migrate specific repository
- `/speckit.migrate dealer-settings-ui` - Migrate UI repository

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🚀 SPEC-KIT MIGRATION WORKFLOW                              │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Analyzing repository structure and technology             │
│ • Installing Spec-Kit infrastructure (portable setup)       │
│ • Discovering existing features from code                   │
│ • Generating retroactive documentation                      │
│ • Updating workspace context (if monorepo)                  │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • One-command setup → faster than manual installation       │
│ • Portable infrastructure → repos work when opened alone    │
│ • Retroactive specs → document what exists                  │
│ • Workspace integration → monorepo context synchronized     │
│                                                              │
│ MIGRATION PHASES:                                           │
│ Phase 0: Pre-migration analysis (detect type, features)     │
│ Phase 1: Infrastructure setup (constitution, templates)     │
│ Phase 2: Feature discovery (scan code for endpoints)        │
│ Phase 3: Retroactive documentation (generate specs)         │
│ Phase 4: Workspace integration (update context files)       │
│ Phase 5: Validation (run /speckit.validate)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Trigger

```
/speckit.migrate [repository-name]
```

**Examples**:
- `/speckit.migrate` - Migrate all repositories in workspace
- `/speckit.migrate fsr-dealer-settings-service` - Migrate specific repository
- `/speckit.migrate dealer-settings-ui` - Migrate UI repository

---

## Context Required

Before executing, load:
1. **Workspace Structure**: Identify all repositories in workspace
2. **Constitution Template**: `.specify/memory/constitution.md` (workspace or reference repo)
3. **Templates**: `.specify/templates/` (workspace or reference repo)
4. **Prompts**: `.github/prompts/speckit.*.prompt.md` (workspace level)
5. **Scripts**: `.specify/scripts/bash/` (workspace level)
6. **Target Repository**: Analyze structure to determine project type

---

## Execution Flow

### Phase 0: Pre-Migration Analysis

> **What's Happening**: Analyzing repository to determine migration strategy  
> **Why**: Different project types need different infrastructure setup  
> **Output**: Migration plan with detected features and tech stack

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PHASE 0: PRE-MIGRATION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyzing repository structure and existing features...

WHAT'S HAPPENING:
• Detecting project type (backend/frontend/mobile)
• Identifying language/framework (Node.js/React/Swift)
• Scanning for existing features (controllers/routes/components)
• Checking current Spec-Kit infrastructure (if any)

WHY THIS MATTERS:
• Project type → determines which templates to customize
• Detected features → enables retroactive documentation
• Existing infrastructure → upgrade vs fresh install
```

1. **Identify Target Repositories**:
   - If `[repository-name]` provided: Validate repository exists
   - If no argument: List all repositories in workspace (exclude `.git`, `node_modules`, etc.)
   - Confirm with user if migrating multiple repositories

2. **Analyze Repository Structure**:
   - Detect project type: `backend`, `frontend`, `mobile`, `monorepo`
   - Identify language/framework: Node.js/TypeScript, React, Swift, etc.
   - Find source directories: `src/`, `app/`, `packages/`, etc.
   - Check for existing specs: Look for `specs/`, `features/`, `docs/specs/`
   - Detect controllers/routes/components for feature discovery

3. **Detect Workspace Context**:
   - **Monorepo**: Multiple repositories under workspace root (e.g., `ford/fsr-dealer-settings-service/`, `ford/dealer-settings-ui/`)
   - **Standalone**: Single repository opened directly (e.g., just `fsr-dealer-settings-service/`)
   - Check for workspace-level `.specify/` at parent directories
   - Important: **Always create repo-level infrastructure** so repos work when opened individually

4. **Check Existing Spec-Kit Infrastructure**:
   - `.specify/` directory exists in repository?
   - Constitution file exists in repository?
   - Templates available in repository?
   - Spec directories present?
   - Determine migration strategy: fresh install vs. upgrade

---

### Phase 1: Infrastructure Setup

For each target repository:

#### 1.1 Create Directory Structure

```bash
mkdir -p .specify/memory
mkdir -p .specify/templates
mkdir -p .specify/scripts/bash
mkdir -p specs
mkdir -p .github/prompts
```

#### 1.2 Install Constitution

**CRITICAL: Always create repository-level constitution for portability**

**Scenario 1: Monorepo with Workspace Constitution**
```bash
# Check if workspace constitution exists
if [ -f ../../.specify/memory/constitution.md ]; then
    # Copy workspace constitution to repository
    cp ../../.specify/memory/constitution.md .specify/memory/constitution.md
    
    # Optionally extend with repo-specific sections
    # Example: Add Section IX for frontend-specific rules
fi
```

**Scenario 2: Monorepo without Workspace Constitution**
```bash
# Download from canonical source
curl -s -o .specify/memory/constitution.md \
  https://raw.githubusercontent.com/ford-innersource/fsr-onboarding/speckit/speckit/memory/constitution.md

# Customize for detected technology stack
```

**Scenario 3: Standalone Repository**
```bash
# Download from canonical source
curl -s -o .specify/memory/constitution.md \
  https://raw.githubusercontent.com/ford-innersource/fsr-onboarding/speckit/speckit/memory/constitution.md

# Customize for detected technology stack
```

**Constitution Source Priority**:
1. **Workspace constitution exists**: Copy from `../../.specify/memory/constitution.md`
2. **No workspace constitution**: Download from canonical GitHub source
   - URL: `https://raw.githubusercontent.com/ford-innersource/fsr-onboarding/speckit/speckit/memory/constitution.md`
3. **Customize**: Update for detected technology stack (Node.js/React/Python/etc.)
**CRITICAL: Always create repository-level templates for portability**

Create templates in `.specify/templates/`:
- `spec-template.md` - Feature specification template
- `plan-template.md` - Implementation plan template  
- `tasks-template.md` - Task breakdown template
- `checklist-template.md` - Quality checklist template
- `agent-file-template.md` - AI agent context template

**Template Source Priority**:
1. **Workspace templates exist**: Copy from `../../.specify/templates/` to `.specify/templates/`
2. **No workspace templates**: Create from Spec-Kit defaults
3. **Repository-specific**: Customize for detected technology stack
**Repository-Level Scripts** (install in `.specify/scripts/bash/`):
- `common.sh` - Shared utility functions
- `create-new-feature.sh` - Initialize feature directories
- `check-prerequisites.sh` - Validate spec completeness
- `update-agent-context.sh` - Update AI context files

**Workspace-Level Scripts** (install in `[workspace-root]/scripts/` if monorepo):
- `update-workspace-context.sh` - Generate cross-repo index (only for monorepo)
- `install-workspace-hooks.sh` - Git hooks across all repos (only for monorepo)
- `watch-workspace.sh` - Monitor all repos (only for monorepo)

**Script Source Priority**:
1. **Monorepo with workspace scripts**: Copy from workspace to repository
2. **Standalone or no workspace scripts**: Create from defaults

**Important**: Ensure scripts support numeric branch names (e.g., `001-feature-name`)
**Constitution Content** (customize for detected stack):
- Core principles: Contract-first design, Observability, Data safety, Documentation, PII handling, Versioning, Architecture patterns, Input validation
- Technology stack: Language, framework, database, libraries
- Architectural patterns: CSR, dependency injection, state management
- Repository-specific rules: Existing patterns found in codebase

#### 1.3 Install Templates

Copy or create templates in `.specify/templates/`:
- `spec-template.md` - Feature specification template
- `plan-template.md` - Implementation plan template  
- `tasks-template.md` - Task breakdown template
- `checklist-template.md` - Quality checklist template
- `agent-file-template.md` - AI agent context template

**Customization**:
- Adjust templates for project type (backend/frontend/mobile)
- Include project-specific sections (e.g., component props for React)

#### 1.4 Install Scripts

Copy bash automation scripts to `.specify/scripts/bash/`:
- `common.sh` - Shared utility functions
- `create-new-feature.sh` - Initialize feature directories
- `check-prerequisites.sh` - Validate spec completeness
- `update-agent-context.sh` - Update AI context files
- `update-workspace-context.sh` - Generate cross-repo index (workspace level)

**Ensure scripts support numeric branch names** (e.g., `001-feature-name`).

#### 1.5 Install Spec-Kit Prompts

**CRITICAL: Always download prompts from canonical GitHub source**

Download all prompts to `.github/prompts/`:

```bash
# Base URL for prompts
PROMPTS_BASE="https://raw.githubusercontent.com/ford-innersource/fsr-onboarding/speckit/speckit/prompts"

# Create prompts directory
mkdir -p .github/prompts

# Download all Spec-Kit prompts
for prompt in specify clarify plan tasks analyze implement patch context validate migrate retro; do
  curl -f -s -o ".github/prompts/speckit.$prompt.prompt.md" \
    "$PROMPTS_BASE/speckit.$prompt.prompt.md" || \
    echo "⚠ Failed to download speckit.$prompt.prompt.md"
done
```

**Prompts installed** (11 total):
- `speckit.specify.prompt.md` - Feature specification workflow
- `speckit.clarify.prompt.md` - Clarification workflow
- `speckit.plan.prompt.md` - Implementation planning workflow
- `speckit.tasks.prompt.md` - Task breakdown workflow
- `speckit.analyze.prompt.md` - Constitution validation workflow
- `speckit.implement.prompt.md` - Implementation workflow
- `speckit.patch.prompt.md` - Bug fix/minor enhancement workflow
- `speckit.context.prompt.md` - Context synchronization workflow
- `speckit.validate.prompt.md` - Infrastructure validation workflow
- `speckit.migrate.prompt.md` - Migration workflow (self-replicating)
- `speckit.retro.prompt.md` - Retroactive documentation workflow

**Why Download from GitHub**:
- ✅ Always latest version from canonical source
- ✅ Consistent with constitution download approach
- ✅ No dependency on workspace structure
- ✅ Repos remain portable and self-contained

**Why Repository-Level Prompts are Required**:
- ✅ `/speckit.*` commands work when repo opened individually
- ✅ Repos portable between workspaces
- ✅ Team members can work on single repo
- ✅ CI/CD can use Spec-Kit commands (if needed)

#### 1.6 Create GitHub Copilot Instructions

Create `.github/copilot-instructions.md`:
```markdown
# [Repository Name] - GitHub Copilot Instructions

**Spec-Kit Managed Repository**

## Constitution

See: `.specify/memory/constitution.md` for non-negotiable quality gates.

## Workflow

1. `/speckit.specify` - Create specification
2. `/speckit.plan` - Generate implementation plan
3. `/speckit.tasks` - Break down into tasks
4. `/speckit.analyze` - Validate against constitution
5. `/speckit.implement` - Execute implementation

## Templates

- Spec: `.specify/templates/spec-template.md`
- Plan: `.specify/templates/plan-template.md`
- Tasks: `.specify/templates/tasks-template.md`

## Current Specifications

[Auto-updated by scripts - see specs/ directory]
```

---

### Phase 2: Retroactive Feature Discovery

**Execute retroactive specification workflow** for each repository:

#### 2.1 Discover Implemented Features

**Backend (Node.js/TypeScript)**:
- Scan `src/controllers/`, `src/routes/`, `src/handlers/`
- Identify endpoint patterns (Express, NestJS, Fastify)
- Group by domain/feature (authentication, user management, payments, etc.)

**Frontend (React/Vue/Angular)**:
- Scan `src/components/`, `src/pages/`, `src/features/`
- Identify feature modules and user flows
- Group by user-facing capabilities

**Mobile (Swift/Kotlin)**:
- Scan `ViewControllers/`, `Views/`, `Screens/`
- Identify feature modules and navigation flows
- Group by user journeys

**API Integration**:
- Find OpenAPI/Swagger specs
- Parse API documentation
- Extract endpoints and group by resource

#### 2.2 Create Retroactive Specifications

For each discovered feature:

1. **Create spec directory**: `specs/[NNN]-[feature-slug]/`
2. **Generate spec.md** following retroactive template:
   - Mark as "✅ Implemented (Retroactive Documentation)"
   - Extract user stories from code behavior
   - Document functional requirements with implementation references
   - Map data models (interfaces, types, schemas)
   - Document API endpoints with examples
   - Capture edge cases and error handling
   - Note integration points
   - List architecture decisions (inferred from code)
   - Include key file references with line numbers

3. **Validate specification quality**:
   - All requirements traced to actual code
   - File references include line numbers
   - No prescriptive "should" language (describe reality)
   - Data models match actual TypeScript/code definitions
   - API examples match actual implementation

4. **Number specifications sequentially**:
   - Check existing `specs/` for highest number
   - Use next sequential number (001, 002, 003, etc.)

#### 2.3 Feature Discovery Examples

**Example: Authentication Feature (Backend)**
```
Source files detected:
- src/controllers/auth.controller.ts
- src/services/auth.service.ts
- src/routes/auth.routes.ts
- src/middleware/jwt.middleware.ts

Generated: specs/001-authentication/spec.md
User stories: Login, Signup, Token refresh, Password reset
Endpoints: POST /auth/login, POST /auth/signup, POST /auth/refresh, POST /auth/reset-password
```

**Example: Dashboard Component (Frontend)**
```
Source files detected:
- src/components/Dashboard/Dashboard.tsx
- src/hooks/useDashboardData.ts
- src/services/dashboardApi.ts

Generated: specs/001-dashboard/spec.md
User stories: View metrics, Filter data, Export reports
Components: Dashboard, MetricCard, DataTable, FilterPanel
```

---

### Phase 3: Workspace Integration

#### 3.1 Update Workspace Context

Run workspace context update script:
```bash
cd [workspace-root]
bash scripts/update-workspace-context.sh
```

This generates:
- `.specify/workspace/all-specs.md` - Cross-repo specification index
- `.specify/workspace/repo-index.json` - Structured metadata

#### 3.2 Update Repository Index

Add migrated repository to workspace repo index:
```json
{
  "repositories": [
    {
      "name": "[repo-name]",
      "path": "[repo-path]",
      "type": "backend|frontend|mobile",
      "language": "TypeScript",
      "framework": "NestJS",
      "specCount": 5,
      "migrated": "2026-01-13",
      "constitution": "v0.7.0"
    }
  ]
}
```

#### 3.3 Create Migration Summary

Generate `SPEC-KIT-MIGRATION.md` in repository root:
```markdown
# Spec-Kit Migration Report

**Repository**: [name]
**Migration Date**: [date]
**Migration Type**: [fresh|upgrade]

## Infrastructure Installed

- ✅ Constitution (v0.7.0)
- ✅ Templates (5 files)
- ✅ Scripts (5 bash utilities)
- ✅ GitHub Copilot instructions

## Features Documented

Total retroactive specifications created: [count]

1. [001-feature-name] - [Brief description]
2. [002-feature-name] - [Brief description]
...

## Next Steps

1. Review retroactive specifications for accuracy
2. Create new features: `/speckit.specify "feature description"`
3. Update existing features: Create spec-v2.md or patches
4. Ensure all team members have access to Spec-Kit commands

## Workspace Integration

- Repository added to workspace context
- Cross-repo specification index updated
- GitHub Copilot enabled for all specs
```

---

### Phase 4: Git Commit & Branch Management

#### 4.1 Create Migration Branch (Optional)

```bash
git checkout -b speckit-migration
```

#### 4.2 Stage Changes

```bash
git add .specify/
gi**Always create repo-level constitution/templates/scripts**
- Discover and document all implemented features
- Create comprehensive retroactive specifications
- Full workspace integration (if monorepo)

### Mode 2: Upgrade Migration (Existing Spec-Kit)

- Update constitution to latest version
- Add missing templates
- Upgrade scripts to support new features
- **Ensure repo-level infrastructure exists** (not just workspace-level)
- Retroactively document undocumented features only
- Update workspace context (if monorepo)

### Mode 3: Partial Migration (Some Specs Exist)

- Preserve existing specifications
- Add missing infrastructure
- **Validate repo-level infrastructure exists**
- Document only undocumented features
- Number new specs sequentially after existing ones

### Mode 4: Monorepo → Standalone Conversion

If a repository was previously part of monorepo but now needs to work standalone:
- Copy workspace-level constitution to repository (`.specify/memory/`)
- Copy workspace-level templates to repository (`.specify/templates/`)
- Copy workspace-level prompts to repository (`.github/prompts/`)
- Copy necessary workspace scripts to repository (`.specify/scripts/bash/`)
- Ensure `.github/copilot-instructions.md` doesn't reference workspace paths
- Test: Open repository alone and verify `/speckit.*` commands work
- Documented [list key features]
- All specs include implementation references and data models
- Total lines of documentation: [count]

Workspace Integration:
- Added to workspace specification index
- Cross-repo context updated
- Repository metadata recorded

Ready for: /speckit.specify for new features"
```

---

## Migration Modes

### Mode 1: Fresh Migration (No Existing Specs)

- Install all infrastructure from scratch
- Discover and document all implemented features
- Create comprehensive retroactive specifications
- Full workspace integration

### Mode 2: Upgrade Migration (Existing Spec-Kit)

- Update constitution to latest version
- Add missing templates
- Upgrade scripts to support new features
- Retroactively document undocumented features only
- Update workspace context

### Mode 3: Partial Migration (Some Specs Exist)

- Preserve existing specifications
- Add missing infrastructure
- Document only undocumented features
- Number new specs sequentially after existing ones

---Determined context: monorepo vs. standalone
- [ ] User confirmed migration scope (all repos or specific one)

### Post-Migration Validation - Repository Level

**CRITICAL: These MUST exist in each repository for portability**:
- [ ] Constitution file exists at `.specify/memory/constitution.md` in repository
- [ ] All 5 templates installed in `.specify/templates/` in repository
- [ ] All 10 Spec-Kit prompts installed in `.github/prompts/` in repository
- [ ] Repository scripts exist in `.specify/scripts/bash/` in repository
- [ ] Scripts are executable (`chmod +x .specify/scripts/bash/*.sh`)
- [ ] At least one retroactive spec created (or empty specs/ dir if no features)
- [ ] GitHub Copilot instructions created at `.github/copilot-instructions.md`
- [ ] Migration summary document created

**Test Repository Portability**:
- [ ] Open repository alone in VS Code (without workspace)
- [ ] Verify `/speckit.specify` command works (loads prompt from `.github/prompts/`)
- [ ] Verify `/speckit.plan` command works
- [ ] Verify constitution is accessible
- [ ] Verify templates are loadable

### Post-Migration Validation - Workspace Level (If Monorepo)

- [ ] Workspace context updated (`.specify/workspace/all-specs.md`)
- [ ] Repository added to index (`.specify/workspace/repo-index.json`)
- [ ] Workspace scripts installed in `[workspace-root]/scripts/`
**Constitution Focus**: API contracts, database safety, observability, PII handling

### Frontend Detection

**Indicators**:
- `src/components/`, `src/pages/`, `src/views/`
- `package.json` with React, Vue, Angular, Svelte
- Component libraries (shadcn/ui, Material-UI, etc.)
- State management (Redux, Zustand, Pinia)

**Constitution Focus**: Component architecture, accessibility, state management, testing

### Mobile Detection

**Indicators**:
- `.xcodeproj`, `android/`, `.swift`, `.kt` files
- Native frameworks (UIKit, SwiftUI, Jetpack Compose)
- Platform-specific directories

**Constitution Focus**: Platform guidelines, performance, offline support, accessibility

### Monorepo Detection

**Indicators**:
- `packages/`, `apps/`, `libs/` directories
- Lerna, Nx, Turborepo config
- Multiple `package.json` files

**Strategy**: Migrate each package independently or as unified workspace

---

## Validation & Quality Gates

### Pre-Migration Validation

- [ ] Repository has committed changes (clean working directory recommended)
- [ ] Workspace-level Spec-Kit infrastructure exists (if multi-repo)
- [ ] User confirmed migration scope (all repos or specific one)

### Post-Migration Validation

- [ ] Constitution file exists and is valid
- [ ] All 5 templates installed
- [ ] Scripts are executable (`chmod +x .specify/scripts/bash/*.sh`)
- [ ] At least one retroactive spec created (or empty specs/ dir if no features)
- [ ] GitHub Copilot instructions created
- [ ] Workspace context updated (for multi-repo)
- [ ] Migration summary document created
- [ ] Git commit successful (if auto-commit enabled)

### Retroactive Spec Quality

For each generated specification:
- [ ] Implementation file references include line numbers
- [ ] Data models match actual code (TypeScript interfaces, Zod schemas)
- [ ] API endpoints documented with request/response examples
- [ ] User stories describe actual behavior (not prescriptive)
- [ ] Edge cases extracted from error handling code
- [ ] Architecture decisions inferred from code patterns
- [ ] No [NEEDS CLARIFICATION] markers (feature already implemented)

---

## Migration Output

### Terminal Output Format

```
🚀 Spec-Kit Migration Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Migration Plan:
   • Target: fsr-dealer-settings-service
   • Type: Backend (Node.js + TypeScript + NestJS)
   • Mode: Fresh Migration
   • Features detected: 6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1: Infrastructure Setup
✓ Created .specify/ directory structure
✓ Installed constitution v0.7.0
✓ Copied 5 templates
✓ Copied 10 Spec-Kit prompts
✓ Installed 4 repository scripts
✓ Created GitHub Copilot instructions

Phase 2: Retroactive Feature Discovery
Discovering features...
✓ Found: Authentication System (src/controllers/auth.controller.ts)
✓ Found: User Management (src/controllers/user.controller.ts)
✓ Found: Payment Processing (src/controllers/payment.controller.ts)
...

Creating specifications...
✓ 001-authentication - Authentication System
✓ 002-user-management - User Management  
✓ 003-payment-processing - Payment Processing
...

Phase 3: Workspace Integration
✓ Updated workspace context (6 specs total)
✓ Added repository to index
✓ Generated migration summary

Phase 4: Git Commit
✓ Staged changes (42 files)
✓ Committed: "feat(speckit): Migrate repository to Spec-Kit framework"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Migration Complete!

Repository: fsr-dealer-settings-service
Specifications: 6 retroactive specs created
Documentation: 4,250 lines added
Branch: speckit-migration

Next steps:
1. Review: SPEC-KIT-MIGRATION.md
2. Verify: specs/ directory
3. Test: /speckit.specify "new feature"
4. Merge: git push origin speckit-migration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Multi-Repository Migration

When migrating all repositories in workspace:

### Sequential Processing

```
Processing repositories:
1. fsr-dealer-settings-service (Backend)
2. dealer-settings-ui (Frontend)  
3. fsr-mobile-service (Backend)
4. fsr-onboarding (Mobile)

[For each repository, execute all 4 phases]

Final workspace update:
✓ 4 repositories migrated
✓ 24 total specifications created
✓ Workspace context regenerated
✓ All repositories indexed
```

### Parallel Processing (Advanced)

For large workspaces with 10+ repositories, offer parallel migration with progress tracking.

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Repository not found | Invalid repo name | List available repos, ask user to confirm |
| No features detected | Empty or non-code repository | Skip retroactive discovery, install infrastructure only |
| Constitution conflict | Existing constitution differs | Ask user: keep existing, replace, or merge |
| Git conflict | Uncommitted changes | Recommend `git stash`, retry, or force flag |
| Permission denied | Script not executable | Run `chmod +x` on scripts |

### Rollback Strategy

If migration fails mid-process:

```bash
# Undo changes
git checkout -- .specify/ .github/ specs/
git clean -fd .specify/ specs/

# Or reset branch
git reset --hard HEAD
```

---

## Advanced Options

### Flags (Optional)

```
/speckit.migrate [repo] --dry-run           # Preview without changes
/speckit.migrate [repo] --no-retro          # Skip retroactive specs
/speckit.migrate [repo] --no-commit         # Don't auto-commit
/speckit.migrate [repo] --branch <name>     # Custom branch name
/speckit.migrate [repo] --constitution <v>  # Specific constitution version
```

---

## Post-Migration Recommendations

1. **Review Generated Specs**: Verify retroactive specifications accuracy
2. **Update Constitution**: Add repository-specific principles if needed
3. **Train Team**: Share Spec-Kit commands with all developers
4. **Create First Feature**: Test workflow with `/speckit.specify "new feature"`
5. **CI/CD Integration**: Add spec validation to pipeline
6. **Document Exceptions**: Note any features that don't fit Spec-Kit model

---

## 

### Example 4: Ensure Repository Portability

```
Scenario: Repository was migrated in monorepo context, but constitution only exists at workspace level

User: /speckit.migrate fsr-dealer-settings-service

AI Detection:
- Repository: fsr-dealer-settings-service
- Context: Monorepo (workspace root: ford/)
- Issue: No constitution in repository, only in ../../.specify/memory/constitution.md
- Risk: Won't work when opened standalone
workspace prompts to .github/prompts/ in repository (10 files)
4. Copy necessary scripts to .specify/scripts/bash/ in repository
5. Test: Simulate standalone context (ignore workspace paths)
6. Validate: All Spec-Kit commands work without workspace context
   - Test `/speckit.specify` loads prompt from repository
   - Test `/speckit.plan` accesses repository templates
7. Copy workspace templates to .specify/templates/ in repository
3. Copy necessary scripts to .specify/scripts/bash/ in repository
4. Test: Simulate standalone context (ignore workspace paths)
5. Validate: All Spec-Kit commands work without workspace context
6. Commit: "fix(speckit): Add repository-level Spec-Kit infrastructure for portability"

Result: Repository now works both in monorepo AND when opened alone
```Examples

### Example 1: Migrate Single Backend Repository

```
User: /speckit.migrate fsr-dealer-settings-service

AI Actions:
1. Analyze: Detect Node.js/TypeScript/NestJS backend
2. Install: Constitution + templates + scripts
3. Discover: 6 API features in controllers
4. Document: Create 6 retroactive specs
5. Integrate: Update workspace context
6. Commit: Create migration commit
```

### Example 2: Migrate All Repositories

```
User: /speckit.migrate

AI Actions:
1. List: Find 4 repositories in workspace
2. Confirm: "Migrate all 4 repositories? (y/n)"
3. Process: Migrate each repository sequentially
4. Summary: Report total specs created across all repos
5. Update: Regenerate workspace-wide context
```

### Example 3: Upgrade Existing Spec-Kit Repository

```
User: /speckit.migrate dealer-settings-ui

AI Actions:
1. Detect: Existing .specify/ directory (upgrade mode)
2. Analyze: Constitution v0.6.0 → upgrade to v0.7.0
3. Compare: Existing specs (2) vs. implemented features (5)
4. Document: Create 3 new retroactive specs only
5. Update: Merge constitution changes
6. Commit: "chore(speckit): Upgrade Spec-Kit to v0.7.0"
```

---

## Integration with Other Commands

**After Migration**:
- `/speckit.specify` - Create new feature specifications
- `/speckit.retro` - Add retroactive specs for missed features
- `/speckit.plan` - Generate implementation plans
- `/speckit.tasks` - Break down work
- `/speckit.constitution` - Update governance

**Migration enables** full Spec-Kit workflow for repository.

---

**Version**: 1.0.0  
**Last Updated**: January 13, 2026  
**Related Commands**: `/speckit.retro`, `/speckit.specify`, `/speckit.constitution`
