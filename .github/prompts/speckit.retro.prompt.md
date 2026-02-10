---
description: Generate retroactive specification documentation for already-implemented features by analyzing existing code. Includes convention extraction and batch discovery.
---

# /speckit.retro - Create Retroactive Specification

**Purpose**: Generate a specification document for an already-implemented feature by analyzing existing code. Also handles batch feature discovery, convention extraction, and rollback.

**IMPORTANT**: All specs require a Jira ticket (Constitution Section IX).

---

## Arguments

| Argument | Description |
|----------|-------------|
| `"feature description"` | Feature to document |
| `--jira <JIRA-ID>` | Use specific Jira ticket (skips search) |
| `--all` | Batch mode - discover and document all undocumented features |
| `--interactive` | With `--all`, confirm each feature before documenting |
| `--dry-run` | Preview mode - show what would be created |
| `--coverage` | Include test coverage mapping in spec |
| `--boundaries` | Interactive mode to define feature boundaries |
| `--explore` | Exploration mode: implement first, document after |
| `--conventions` | Extract coding conventions and generate style guides |
| `--rollback` | Undo retroactive spec creation |
| `--rollback specs` | Remove generated specs only |
| `--rollback conventions` | Remove convention files only |
| `--skip-conventions` | With `--all`, skip convention extraction |

**Examples**:
- `/speckit.retro "authentication system"`
- `/speckit.retro --jira PROJ-557 "opcodes API"`
- `/speckit.retro --all --dry-run`
- `/speckit.retro --all --conventions` - Full discovery + convention extraction
- `/speckit.retro --conventions` - Convention extraction only (no specs)
- `/speckit.retro --rollback` - Undo all retroactive work
- `/speckit.retro --explore "payment integration"`

---

## Exploration Mode (`--explore`)

For experimental development where you implement first and document after:

```
🧪 **Exploration Mode**

This mode supports experimental development:
1. Start with a rough idea
2. Implement freely (no spec required)
3. Track changes as you go
4. Generate formal spec when done
```

### Starting Exploration

```
/speckit.retro --explore "payment integration experiment"
```

**Creates**:
- `.specify/explore/{session-id}.json` (session state)
- `.specify/explore/{session-id}.log` (decision log)

**Available Commands During Exploration**:
- `/speckit.retro --explore log "decision note"` - Log a decision
- `/speckit.retro --explore checkpoint "milestone"` - Save checkpoint
- `/speckit.retro --explore done` - Generate spec from exploration
- `/speckit.retro --explore abort` - Cancel session

### Finishing Exploration

When `--explore done` is called:

1. Analyze all commits and file changes since session start
2. Review logged decisions
3. Infer requirements from implementation
4. Generate formal spec with exploration context

```markdown
## Exploration Summary

| Metric | Value |
|--------|-------|
| Duration | 2h 15m |
| Commits | 12 |
| Files | 24 |
| Decisions | 7 |

### Key Decisions (from exploration log)
| # | Decision | Rationale | Timestamp |
|---|----------|-----------|-----------|
| 1 | Use Stripe over PayPal | Better API | 14:45 |
```

---

## Convention Extraction (`--conventions`)

Extract coding conventions and architectural patterns from existing code to guide future development:

```
/speckit.retro --conventions                    # Convention extraction only
/speckit.retro --all --conventions              # Full discovery + conventions
/speckit.retro --all --skip-conventions         # Discovery without conventions
```

### What Gets Extracted

1. **Tech Stack Analysis** - Dependencies, frameworks, versions from package.json/requirements.txt
2. **File Categorization** - Taxonomy of file types (components, hooks, services, controllers, utils)
3. **Architectural Domains** - Domain constraints, boundaries, and patterns
4. **Style Guides** - Per-category coding conventions extracted from actual code
5. **AI Instructions** - Synthesized guidance for consistent code generation

### Convention Output Location

```
.specify/conventions/
├── tech-stack.md              # Dependencies, frameworks, versions
├── file-categories.md         # File type taxonomy
├── architectural-domains.md   # Domain constraints and patterns
├── style-guides/
│   ├── components.md          # React/Vue component patterns
│   ├── hooks.md               # Custom hook conventions
│   ├── services.md            # Service layer patterns
│   ├── controllers.md         # API controller patterns
│   └── utils.md               # Utility function conventions
└── ai-instructions.md         # Synthesized guide for code generation
```

### Convention Extraction Output

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ CONVENTIONS EXTRACTED                                    │
├─────────────────────────────────────────────────────────────┤
│ Tech Stack Identified:                                      │
│ • React 18.2.0 with TypeScript                              │
│ • Vite for build tooling                                    │
│ • TanStack Query for data fetching                          │
│ • Zod for schema validation                                 │
│                                                              │
│ File Categories Found:                                      │
│ • Components (42 files)                                     │
│ • Hooks (18 files)                                          │
│ • Services (12 files)                                       │
│ • Utils (8 files)                                           │
│                                                              │
│ Architectural Patterns:                                     │
│ • Feature-based directory structure                         │
│ • Custom hooks for data fetching                            │
│ • Zod schemas colocated with types                          │
│ • Barrel exports (index.ts) per feature                     │
│                                                              │
│ Location: .specify/conventions/                             │
│                                                              │
│ These conventions will guide future code generation via     │
│ /speckit.implement                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Rollback (`--rollback`)

Undo retroactive spec creation and/or convention extraction:

```
/speckit.retro --rollback                  # Undo all retroactive work
/speckit.retro --rollback specs            # Remove generated specs only
/speckit.retro --rollback conventions      # Remove convention files only
```

### Rollback State Tracking

Retro operations create a state file at `.specify/.retro-state.json`:

```json
{
  "version": "1.0",
  "lastRunAt": "2026-01-15T10:30:00Z",
  "gitCommitBefore": "abc123",
  "specsCreated": [
    "specs/PROJ-123-authentication/",
    "specs/PROJ-456-user-management/"
  ],
  "conventionsCreated": [
    ".specify/conventions/"
  ],
  "checkpointCommit": "def456"
}
```

### Rollback UI

```
┌─────────────────────────────────────────────────────────────┐
│ ⏪ RETROACTIVE SPEC ROLLBACK                                │
├─────────────────────────────────────────────────────────────┤
│ Last retro run: Jan 15, 2026 10:30 AM                       │
│                                                              │
│ Created in that session:                                    │
│ • 5 retroactive specs (specs/)                              │
│ • Convention files (.specify/conventions/)                  │
│                                                              │
│ Pre-retro commit: abc123                                    │
│                                                              │
│ ROLLBACK OPTIONS:                                           │
│ [1] Full rollback - Remove specs AND conventions            │
│ [2] Specs only - Remove specs, keep conventions             │
│ [3] Conventions only - Remove conventions, keep specs       │
│ [4] Cancel - Don't rollback                                 │
│                                                              │
│ Enter choice [1/2/3/4]:                                     │
└─────────────────────────────────────────────────────────────┘
```

### Rollback Execution

**If [1] Full rollback**:
```bash
# Confirm with user (destructive operation)
echo "⚠️  This will remove:"
echo "   • specs/PROJ-123-authentication/"
echo "   • specs/PROJ-456-user-management/"
echo "   • .specify/conventions/ (entire directory)"
echo ""
read -p "Type 'ROLLBACK' to confirm: " confirm

if [ "$confirm" == "ROLLBACK" ]; then
  git reset --hard $GIT_COMMIT_BEFORE
  rm -f .specify/.retro-state.json
  echo "✓ Rolled back to commit $GIT_COMMIT_BEFORE"
fi
```

---

## Large Codebase Handling

### `.speckit-ignore` File

For large repositories, create `.speckit-ignore` at repository root to exclude paths from feature discovery:

```gitignore
# Exclude test files from feature discovery
**/*.test.ts
**/*.spec.ts
__tests__/
test/

# Exclude generated/build files
dist/
build/
.next/

# Exclude infrastructure code (not features)
src/utils/
src/lib/
src/helpers/
src/config/

# Exclude vendor/third-party
vendor/
third_party/
```

### Large Codebase Detection

```bash
# Count total source files
FILE_COUNT=$(find . -type f \( -name "*.ts" -o -name "*.js" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" | wc -l)
```

**Size thresholds**:
- Small (<100 files): Full discovery, no chunking
- Medium (100-500 files): Progress indicator, warn about time
- Large (500-2000 files): Chunked discovery, option to limit scope
- Very Large (>2000 files): Require explicit scope selection

**If Large or Very Large codebase**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 LARGE CODEBASE DETECTED                                  │
├─────────────────────────────────────────────────────────────┤
│ Source files: [FILE_COUNT] files                            │
│ Estimated discovery time: [estimate] minutes                │
│                                                              │
│ OPTIONS:                                                    │
│ [1] Full discovery (may take 5-15 minutes)                  │
│ [2] Limit to specific directories (faster)                  │
│ [3] Discover only entry points (routes, controllers)        │
│ [4] Skip discovery, add features manually                   │
│                                                              │
│ Enter choice [1/2/3/4]:                                     │
└─────────────────────────────────────────────────────────────┘
```

### Progress Indicator

```
🔍 Scanning codebase...
[████████████████░░░░░░░░░░░░░░░░░░░░░░░░] 42% (420/1000 files)
Current directory: src/features/payments/

Discovered so far: 8 potential features
Time elapsed: 2m 15s
Estimated remaining: 3m 00s
```

---

## Polyglot Repository Detection

For repositories with multiple programming languages:

```
┌─────────────────────────────────────────────────────────────┐
│ 🌐 POLYGLOT REPOSITORY DETECTED                             │
├─────────────────────────────────────────────────────────────┤
│ Multiple programming languages found:                        │
│                                                              │
│ LANGUAGES DETECTED:                                         │
│ • TypeScript (245 files) - src/, packages/frontend/         │
│ • Python (89 files) - backend/, scripts/                    │
│ • Go (12 files) - tools/                                    │
│                                                              │
│ FEATURE DISCOVERY APPROACH:                                 │
│ [1] Combined - Treat as unified repo, discover all          │
│ [2] Separate - Create specs per language area               │
│ [3] Primary only - Focus on [largest language] only         │
│                                                              │
│ Enter choice [1/2/3]:                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Legacy Codebase Detection

Check for modern tooling presence:

```
┌─────────────────────────────────────────────────────────────┐
│ 🏚️  LEGACY CODEBASE INDICATORS                              │
├─────────────────────────────────────────────────────────────┤
│ This codebase appears to lack modern tooling:               │
│                                                              │
│ MISSING:                                                    │
│ ❌ Test framework/directory                                 │
│ ❌ Type annotations (TypeScript/Flow/Python types)          │
│ ✓ CI/CD configuration                                       │
│ ❌ Linting/formatting rules                                 │
│                                                              │
│ IMPLICATIONS:                                               │
│ • Feature discovery may be less accurate                   │
│ • Fewer signals for feature boundaries                     │
│                                                              │
│ OPTIONS:                                                    │
│ [1] Proceed as-is (accept limitations)                      │
│ [2] Minimal specs (document only clear features)            │
│                                                              │
│ Enter choice [1/2]:                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Custom Path Configuration

For non-standard project structures, create `.speckit-config.json`:

```json
{
  "version": "1.0",
  "paths": {
    "source": ["lib/", "packages/"],
    "specs": "documentation/specs/",
    "tests": ["test/", "__tests__/"],
    "exclude": ["vendor/", "third_party/", "generated/"]
  },
  "discovery": {
    "entryPoints": ["lib/api/", "lib/handlers/"],
    "featurePatterns": ["*Handler.ts", "*Controller.ts", "*Module.ts"],
    "ignorePatterns": ["*.test.ts", "*.spec.ts", "*.mock.ts"]
  },
  "project": {
    "type": "backend",
    "language": "typescript",
    "framework": "custom"
  }
}
```

**If `.speckit-config.json` exists**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📁 CUSTOM CONFIGURATION DETECTED                            │
├─────────────────────────────────────────────────────────────┤
│ Found: .speckit-config.json                                 │
│                                                              │
│ Custom Paths Configured:                                    │
│ • Source code:   lib/, packages/                            │
│ • Specs:         documentation/specs/                       │
│ • Tests:         test/, __tests__/                          │
│ • Excluded:      vendor/, third_party/                      │
│                                                              │
│ [1] Use custom configuration                                │
│ [2] Ignore and use auto-detection                           │
│                                                              │
│ Enter choice [1/2]:                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Batch Mode (`--all`)

Automatically discover and document all undocumented features:

```
/speckit.retro --all
/speckit.retro --all --interactive  # Confirm each feature
/speckit.retro --all --dry-run      # Preview only
/speckit.retro --all --conventions  # Also extract conventions
```

### Feature Discovery Strategies

**Multi-Signal Detection** (use ALL signals, not just one):

1. **Directory Structure Analysis**:
   - Feature folders: `src/features/`, `src/modules/`, `app/`
   - Domain folders: auth/, users/, payments/
   - Page/Screen folders: `pages/`, `screens/`, `views/`

2. **Export Analysis**:
   - Main exports from `index.ts`/`index.js` files
   - Public API surface area
   - Re-exported modules

3. **Route/Endpoint Analysis**:
   - Express: `router.get()`, `router.post()`, `app.use()`
   - NestJS: `@Controller()`, `@Get()`, `@Post()` decorators
   - React Router: `<Route path=...>` components
   - Next.js: `pages/` directory structure

4. **Component Hierarchy Analysis**:
   - Top-level components that compose others
   - Page-level components
   - Feature entry points

**Backend (Node.js/TypeScript)**:
```
Primary locations to scan:
├── src/controllers/     → Each controller = potential feature
├── src/routes/          → Route groups = potential features
├── src/handlers/        → Handler groups = potential features
├── src/modules/         → Module directories = features (NestJS)
├── src/features/        → Explicit feature directories
└── src/api/             → API resource groups
```

**Frontend (React/Vue/Angular)**:
```
Primary locations to scan:
├── src/pages/           → Page = user-facing feature
├── src/screens/         → Screen = user-facing feature
├── src/features/        → Explicit feature directories
├── pages/               → Next.js pages = features
└── app/                 → App directory structure
```

### Interactive Feature Confirmation

**ALWAYS present discovered features for user confirmation** (unless `--dry-run`):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DISCOVERED FEATURES (Pending Confirmation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| # | Feature Name      | Confidence | Key Files                    | Action    |
|---|-------------------|------------|------------------------------|-----------|
| 1 | Authentication    | HIGH       | auth.controller.ts, auth.service.ts | ✓ Include |
| 2 | User Management   | HIGH       | users.controller.ts, user.entity.ts | ✓ Include |
| 3 | Dashboard         | MEDIUM     | Dashboard.tsx, useDashboard.ts      | ? Review  |
| 4 | Utility Helpers   | LOW        | utils.ts, helpers.ts                | ✗ Skip    |
| 5 | API Client        | LOW        | apiClient.ts, http.ts               | ✗ Skip    |

Confidence Levels:
• HIGH = Multiple strong signals (routes + services + clear domain)
• MEDIUM = Some signals present (may be feature or infrastructure)
• LOW = Few signals (likely infrastructure, not a feature)

ACTIONS:
• Type numbers to toggle include/skip (e.g., "3" to include Dashboard)
• Type "all" to include all HIGH and MEDIUM confidence
• Type "done" when selection is complete
• Type "add [name]" to manually add a feature not detected

What would you like to do?
```

### Feature Detection Safeguards

**False Positive Prevention**:
- Skip files with names: `utils`, `helpers`, `constants`, `types`, `config`, `index`
- Skip directories named: `shared`, `common`, `lib`, `utils`, `helpers`
- Require minimum 2 signals for HIGH confidence
- Default to SKIP for LOW confidence items

**False Negative Prevention**:
- Always offer "add [name]" option for manual feature addition
- Check README.md for feature list mentions
- Look for feature flags or config that names features

### Batch Output

```
📋 **Discovery Summary**

| # | Feature | Files | Has Spec? | Action |
|---|---------|-------|-----------|--------|
| 1 | Authentication | 12 | ❌ No | Will document |
| 2 | Music Player | 24 | ❌ No | Will document |
| 3 | User Profile | 8 | ✅ Yes | Skip |

**Summary**: 5 features, 4 need documentation
```

For each feature, Phase 1.5 (Jira Association) runs to link or create tickets.

---

## Test Coverage Mapping (`--coverage`)

When `--coverage` is specified, analyze and include test coverage:

```
📊 **Test Coverage Analysis**

| Test File | Tests | Passing | Coverage |
|-----------|-------|---------|----------|
| auth.test.ts | 12 | 12 | 100% |
| auth.service.spec.ts | 8 | 7 | 87% |

**Overall**: 84% line, 76% branch

**Uncovered Code Paths**:
| File | Lines | Description |
|------|-------|-------------|
| auth.service.ts | 45-52 | OAuth error handling |
```

This gets included in the generated spec as a "Test Coverage" section.

---

## Interactive Boundary Definition (`--boundaries`)

Define exactly which files belong to a feature:

```
🎯 **Feature Boundary Definition**

| # | File | Confidence | Reason |
|---|------|------------|--------|
| 1 | auth.service.ts | HIGH | Name match |
| 2 | auth.controller.ts | HIGH | Name match |
| 3 | user.service.ts | MEDIUM | User lookup |
| 4 | api.service.ts | LOW | General API |

[A] Accept all HIGH confidence
[R] Review MEDIUM only
[C] Custom selection (e.g., 1-3, 5)
```

Boundary definitions are saved to `.specify/boundaries/{feature}.json` for reuse.

---

## Execution Flow

### Phase 1: Feature Discovery

1. Search for files related to the feature description
2. Identify components, services, types, tests
3. Map the feature boundary (what belongs to this feature?)

### Phase 1.5: Jira Ticket Association (MANDATORY)

**If `--jira` provided**: Use that ticket directly.

**Otherwise**: Search Jira for related tickets:

```
🔍 **Found Related Jira Tickets**

  [1] PROJ-557 - Opcodes Retrieval API (92% match)
  [2] PROJ-123 - Dealer Service Integration (67% match)
  [N] Create NEW Jira ticket
  [S] Search with different keywords
  [M] Enter ticket ID manually

Select: _
```

If creating new ticket:
- Auto-generate summary from feature name
- Auto-generate description from discovered components
- User confirms before creation

### Phase 2: Code Analysis

For each identified file, extract:
1. **Functional capabilities** - What does the code do?
2. **User interactions** - What can users accomplish?
3. **Data flow** - How does data move through?
4. **Edge cases** - What error handling exists?
5. **Integration points** - External services/APIs

### Phase 3: Specification Generation

Create `specs/{JIRA-ID}-{feature-slug}/spec.md`:

```markdown
# [Feature Name] - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)
**Jira**: [{JIRA-ID}](link)
**Created**: [DATE]

---

## Overview
[Description derived from code analysis]

---

## User Stories

### User Story 1 - [Capability]
**As a** [user type],
**I want to** [action from code],
**So that** [inferred benefit].

**Acceptance Criteria** (Verified):
- [x] [Criterion from actual behavior]

**Implementation**: `[file:line]`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | [From code] | ✅ | `[file:line]` |

---

## Data Model
[Actual TypeScript interfaces]

---

## Edge Cases & Error Handling
| Scenario | Handling | Location |
|----------|----------|----------|
| [Case] | [How handled] | `[file:line]` |

---

## Integration Points
| System | Type | Purpose |
|--------|------|---------|
| [Firebase, etc.] | [How] | [Why] |
```

### Phase 4: Lightweight Plan Generation

Also create `specs/{JIRA-ID}-{feature-slug}/plan.md`:

```markdown
# [Feature Name] - Implementation Plan (Retroactive)

**Status**: ✅ Implemented

## Architecture Summary

### Tech Stack
- **Language**: [From analysis]
- **Framework**: [From analysis]
- **Key Libraries**: [From package.json]

### File Structure
[Actual file tree]

### Key Design Decisions
| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| [Pattern] | [Inferred] | [Limitations] |
```

### Phase 5: Validation

1. Cross-reference with existing specs (avoid duplicates)
2. Verify all file paths exist
3. Check type accuracy against actual code
4. Constitution compliance check

### Phase 6: State Tracking (for rollback support)

Create/update `.specify/.retro-state.json` to enable rollback:

```json
{
  "version": "1.0",
  "lastRunAt": "2026-01-15T10:30:00Z",
  "gitCommitBefore": "abc123",
  "specsCreated": [
    "specs/PROJ-123-authentication/",
    "specs/PROJ-456-user-management/"
  ],
  "conventionsCreated": [
    ".specify/conventions/"
  ],
  "checkpointCommit": "def456"
}
```

**Checkpoint creation** (after spec generation):
```bash
git add specs/ .specify/
git commit -m "retro: generated retroactive specs for [N] features"
# Update .retro-state.json with checkpoint commit hash
```

---

## Output

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ RETROACTIVE SPEC CREATED                                 │
├─────────────────────────────────────────────────────────────┤
│ Feature: Authentication System                              │
│ Jira: PROJ-123                                               │
│                                                              │
│ Created:                                                    │
│ • specs/PROJ-123-authentication/spec.md                      │
│ • specs/PROJ-123-authentication/plan.md                      │
│                                                              │
│ Analyzed: 12 files, 450 lines                               │
│ Requirements: 8 extracted                                   │
│ Test coverage: 84% (if --coverage)                          │
│ Rollback available: /speckit.retro --rollback               │
│                                                              │
│ Next: To evolve this feature, run:                          │
│ /speckit.specify "Add [enhancement] to [feature]"           │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Principles

### Document Reality, Don't Prescribe

```
✅ CORRECT: "The player uses useRef to persist the Audio element"
   (Describes what code does)

❌ WRONG: "The player should use useRef to persist the Audio element"
   (Prescriptive - sounds like a requirement)
```

### Be Specific About Sources

Every requirement MUST trace to actual code:

```
✅ CORRECT: FR-001 | User can pause | ✅ | `src/hooks/useAudio.ts:L89`
❌ WRONG:  FR-001 | User can pause | ✅ | useAudio hook
```

### Don't Suggest Refactoring

Retroactive specs document existing behavior. For improvements, create a NEW spec:
```
/speckit.specify "Improve [feature] with [enhancement]"
```

---

## When NOT to Use

| Situation | Use Instead |
|-----------|-------------|
| Feature not yet built | `/speckit.specify` |
| Partial implementation | `/speckit.specify` with existing code reference |
| Want to redesign | `/speckit.specify "Redesign [feature]"` |
| Adding to existing | `/speckit.specify "Add [capability] to [feature]"` |
| Need infrastructure setup | Run `speckit.sh` first |

---

## Integration with Other Commands

**Before Retro**:
- Run `speckit.sh` to install Spec-Kit infrastructure (if not already installed)

**After Retro**:
- `/speckit.specify` - Create new feature specifications
- `/speckit.plan` - Generate implementation plans for enhancements
- `/speckit.analyze` - Validate generated specs against constitution

---

**Version**: 2.0.0  
**Last Updated**: February 3, 2026  
**Related Commands**: `/speckit.specify`, `/speckit.analyze`

---

## Context

```xml
$JIRA_CONTEXT
$WORKSPACE_CONTEXT
$CONSTITUTION_CONTEXT
```
