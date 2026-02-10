---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
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
| (none) | Full analysis of all categories |
| `--focus constitution` | Analyze only constitution compliance |
| `--focus coverage` | Analyze only requirement→task coverage |
| `--focus consistency` | Analyze only cross-artifact consistency |
| `--focus terminology` | Analyze only terminology drift |
| `--auto-fix` | Automatically fix MEDIUM/LOW severity issues |
| `--auto-fix --severity medium` | Fix only MEDIUM severity |
| `--auto-fix --severity low` | Fix only LOW severity |
| `--dry-run` | Show what would be fixed without applying |
| `--ci` | CI mode: exit 1 if CRITICAL issues found |
| `--pre-pr` | Pre-PR review: check AC completion + generate PR description |
| `--history` | Show analysis history for this spec |
| `--history --compare <run-id>` | Compare current with previous run |
| `--history --trend` | Show issue trend over time |

**Examples**:
- `/speckit.analyze` - Full analysis
- `/speckit.analyze --focus constitution` - Only check constitution
- `/speckit.analyze --focus coverage` - Only check task coverage
- `/speckit.analyze --auto-fix` - Fix MEDIUM/LOW issues automatically
- `/speckit.analyze --auto-fix --dry-run` - Preview auto-fixes
- `/speckit.analyze --pre-pr` - Pre-PR review with PR description generation

---

## Focused Analysis Mode (`--focus`)

When `--focus <category>` is specified, analyze only that category:

### `--focus constitution`

```
🏛️ **Constitution Compliance Analysis**

Checking against: .specify/memory/constitution.md

| Principle | Status | Details |
|-----------|--------|---------|
| I. Contract-First API | ✅ PASS | contracts/api.yaml exists |
| II. Observability | ✅ PASS | Logging documented in plan |
| III. Postgres Safety | ⚠️ WARN | No retry logic documented |
| V. PII Handling | ❌ FAIL | Email logged at plan.md:L89 |

**Summary**: 1 CRITICAL issue, 1 warning
```

### `--focus coverage`

```
📊 **Requirement Coverage Analysis**

| Requirement | Tasks | Status |
|-------------|-------|--------|
| FR-001: User login | T012, T013, T014 | ✅ Covered |
| FR-002: Password reset | T018 | ✅ Covered |
| FR-003: OAuth login | - | ❌ No tasks |
| FR-004: Session management | T015 | ✅ Covered |

**Summary**: 3/4 requirements covered (75%)
**Missing coverage**: FR-003 (OAuth login)
```

### `--focus consistency`

```
🔗 **Cross-Artifact Consistency Analysis**

Checking: spec.md ↔ plan.md ↔ tasks.md

| Check | Status | Details |
|-------|--------|---------|
| User story count match | ✅ | 3 stories in spec, 3 in tasks |
| Entity names consistent | ⚠️ | "User" vs "UserAccount" mismatch |
| Endpoint paths match | ✅ | All 5 endpoints consistent |
| File paths exist/will exist | ✅ | All referenced paths valid |

**Summary**: 1 inconsistency found
```

### `--focus terminology`

```
📝 **Terminology Analysis**

Scanning for inconsistent terms across artifacts...

| Term Group | Variants Found | Recommendation |
|------------|----------------|----------------|
| User entity | User, UserAccount, Account | Use "User" consistently |
| Auth token | token, authToken, jwt, accessToken | Use "accessToken" |
| Database | db, database, postgres, pg | Use "database" |

**Summary**: 3 terminology inconsistencies
```

---

## Auto-Fix Mode (`--auto-fix`)

When `--auto-fix` is specified, automatically apply fixes for MEDIUM and LOW severity issues:

```
🔧 **Auto-Fix Mode**

Analyzing artifacts for fixable issues...

**Fixable Issues Found**:

| # | Severity | Issue | Auto-Fix |
|---|----------|-------|----------|
| 1 | MEDIUM | Terminology: "User" vs "UserAccount" | Replace all "UserAccount" → "User" |
| 2 | MEDIUM | Missing task coverage for FR-003 | Add task T025 [US2] [M] Implement OAuth |
| 3 | LOW | Inconsistent capitalization | Standardize to sentence case |
| 4 | LOW | Missing file path in T018 | Add path: src/services/password.ts |

**Not Auto-Fixable** (require manual review):
- CRITICAL: PII in logs (constitution violation)
- HIGH: Conflicting requirements (needs decision)

**Apply these fixes?** [Y/n/preview]
```

### Auto-Fix Actions

| Severity | Issue Type | Auto-Fix Action |
|----------|------------|-----------------|
| MEDIUM | Terminology inconsistency | Replace all variants with canonical term |
| MEDIUM | Missing task coverage | Generate task stub for uncovered requirement |
| MEDIUM | Missing file path in task | Infer path from similar tasks |
| LOW | Inconsistent formatting | Standardize to template format |
| LOW | Typos in task descriptions | Correct obvious typos |
| LOW | Missing size marker | Infer from task complexity |

### Dry-Run Mode

When `--auto-fix --dry-run` is specified:

```
📋 **Auto-Fix Preview (Dry Run)**

Would apply the following changes:

**spec.md**:
```diff
- The UserAccount can log in with email
+ The User can log in with email
```

**tasks.md**:
```diff
+ - [ ] T025 [US2] [M] Implement OAuth login handler in src/controllers/auth.controller.ts
```

**plan.md**:
```diff
- terminology: UserAccount
+ terminology: User
```

**Summary**: 3 files, 5 changes

Run without --dry-run to apply these changes.
```

---

## Analysis History (`--history`)

Track analysis findings over time to monitor improvement trends.

### View History (`--history`)

```
📊 **Analysis History for 001-user-auth**

| Run | Date | CRIT | HIGH | MED | LOW | Total | Status |
|-----|------|------|------|-----|-----|-------|--------|
| #5  | 2026-01-15 10:30 | 0 | 1 | 3 | 2 | 6 | ✅ Pass |
| #4  | 2026-01-14 16:45 | 0 | 2 | 5 | 3 | 10 | ✅ Pass |
| #3  | 2026-01-14 14:20 | 1 | 3 | 4 | 2 | 10 | ❌ Blocked |
| #2  | 2026-01-14 11:00 | 2 | 5 | 6 | 4 | 17 | ❌ Blocked |
| #1  | 2026-01-13 09:15 | 3 | 8 | 10 | 5 | 26 | ❌ Blocked |

**Trend**: ↓ 77% reduction in issues since first run
**Time to unblock**: 2 runs (Run #1 → Run #4)

**Options**:
[1] Compare two runs (e.g., #3 vs #5)
[2] Show trend chart
[3] Export history to CSV
```

### Compare Runs (`--history --compare <run-id>`)

```
🔍 **Comparing Run #3 → Run #5**

**Resolved Issues** (4 fixed):
| ID | Category | Issue | Resolved In |
|----|----------|-------|-------------|
| C1 | Constitution | PII in logs | Run #4 |
| H1 | Coverage | Missing FR-003 tasks | Run #4 |
| H2 | Consistency | Entity name mismatch | Run #5 |
| M1 | Terminology | Inconsistent "User" | Run #5 |

**New Issues** (0 introduced):
(none)

**Persistent Issues** (6 remaining):
| ID | Category | Severity | Since | Description |
|----|----------|----------|-------|-------------|
| H3 | Security | HIGH | Run #2 | Input validation missing |
| M2 | Coverage | MEDIUM | Run #1 | Edge case EC-005 uncovered |
...

**Progress**: 4 resolved, 0 new, 6 remaining
```

### Trend View (`--history --trend`)

```
📈 **Issue Trend Over Time**

Issues
  30 │ ████                                    
  25 │ ████                                    
  20 │ ████ ████                              
  15 │ ████ ████ ████                          
  10 │ ████ ████ ████ ████                    
   5 │ ████ ████ ████ ████ ████              
   0 │─────┴─────┴─────┴─────┴─────┴─────
       #1    #2    #3    #4    #5    Now

Legend: ■ CRITICAL  ■ HIGH  ■ MEDIUM  ■ LOW

**Insights**:
• CRITICAL issues eliminated by Run #4
• HIGH issues reduced 88% (8 → 1)
• Average improvement: 5 issues/run
• Estimated runs to zero: 2 more
```

### History Storage

Analysis history is stored in the feature directory:

```
specs/001-user-auth/
  └── .analysis-history.json
```

**Format**:
```json
{
  "specId": "001-user-auth",
  "runs": [
    {
      "id": 5,
      "timestamp": "2026-01-15T10:30:00Z",
      "duration_ms": 1250,
      "findings": {
        "critical": 0,
        "high": 1,
        "medium": 3,
        "low": 2,
        "total": 6
      },
      "status": "pass",
      "issues": [
        {
          "id": "H3",
          "category": "security",
          "severity": "HIGH",
          "location": "spec.md:L45",
          "summary": "Input validation missing",
          "firstSeen": 2
        }
      ],
      "artifacts": {
        "spec_hash": "abc123",
        "plan_hash": "def456",
        "tasks_hash": "ghi789"
      }
    }
  ],
  "metadata": {
    "firstRun": "2026-01-13T09:15:00Z",
    "totalRuns": 5,
    "timeToUnblock": 2
  }
}
```

### Auto-Recording

Every analysis run automatically:
1. Records findings to `.analysis-history.json`
2. Computes file hashes to detect artifact changes
3. Links issues across runs (by ID matching)
4. Calculates trend metrics

---

## 📋 What This Command Does

**Purpose**: Validate consistency and quality across spec, plan, and tasks BEFORE implementation.

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md#the-spec-kit-workflow)):
- **Phase 3**: Analysis (quality gate before implementation)
- **After /speckit.tasks**: Tasks generated, ready for validation
- **Before /speckit.implement**: Must validate no CRITICAL issues

**This command will**:
1. **Detect duplications** (conflicting/redundant requirements)
2. **Find ambiguities** (terminology drift, unclear references)
3. **Check coverage** (all requirements mapped to tasks)
4. **Validate constitution** (PII, contracts, observability, retry logic)
5. **Report findings** (CRITICAL/HIGH/MEDIUM/LOW severity)
6. **Offer remediation** (optional fixes, user must approve)

**Why use this?**
- ✅ Catches constitution violations BEFORE coding
- ✅ Identifies missing task coverage (prevents incomplete features)
- ✅ Finds duplicate/conflicting requirements (saves rework)
- ✅ Non-destructive (read-only, offers suggestions)

**What happens next**: Fix CRITICAL issues, then run `/speckit.implement` to start coding.

**CRITICAL**: Constitution is NON-NEGOTIABLE. If plan violates constitution, plan must change (not constitution).

---

## Goal

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 SPEC-KIT ANALYSIS WORKFLOW                               │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Analyzing spec.md, plan.md, tasks.md for issues          │
│ • Checking constitution compliance (non-negotiable)        │
│ • Finding duplications, ambiguities, gaps                   │
│ • Validating task coverage (all requirements mapped)       │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • Constitution violations → MUST fix before coding         │
│ • Missing coverage → incomplete feature                    │
│ • Duplications → wasted effort, confusion                  │
│ • Early detection → saves costly rework                     │
│                                                              │
│ WHAT YOU'LL GET:                                            │
│ • Analysis report (findings table, severity levels)        │
│ • Coverage summary (requirements → tasks mapping)          │
│ • Constitution issues (CRITICAL, must fix)                  │
│ • Remediation suggestions (optional, your choice)          │
│                                                              │
│ SEVERITY LEVELS:                                            │
│ • CRITICAL: Constitution violation, missing core feature   │
│ • HIGH: Duplicate/conflicting requirements, security gap   │
│ • MEDIUM: Terminology drift, missing task coverage         │
│ • LOW: Style/wording improvements                          │
└─────────────────────────────────────────────────────────────┘
```

Identify inconsistencies, duplications, ambiguities, and underspecified items across the three core artifacts (`spec.md`, `plan.md`, `tasks.md`) before implementation. This command MUST run only after `/speckit.tasks` has successfully produced a complete `tasks.md`.

## Operating Constraints

**STRICTLY READ-ONLY**: Do **not** modify any files. Output a structured analysis report. Offer an optional remediation plan (user must explicitly approve before any follow-up editing commands would be invoked manually).

**Constitution Authority**: The project constitution (`.specify/memory/constitution.md`) is **non-negotiable** within this analysis scope. Constitution conflicts are automatically CRITICAL and require adjustment of the spec, plan, or tasks—not dilution, reinterpretation, or silent ignoring of the principle. If a principle itself needs to change, that must occur in a separate, explicit constitution update outside `/speckit.analyze`.

## Execution Steps

### 1. Initialize Analysis Context

**Detect feature context** from current directory or user input:
- Look for `specs/*/` directories containing spec.md, plan.md, tasks.md
- If in a feature directory (contains spec.md), use that as FEATURE_DIR
- Set paths:
  - SPEC = FEATURE_DIR/spec.md
  - PLAN = FEATURE_DIR/plan.md
  - TASKS = FEATURE_DIR/tasks.md
- Abort with an error message if any required file is missing (instruct the user to run missing prerequisite command)

### 1.5 Artifact Completeness Check (EC-018)

Before full analysis, validate artifacts are sufficiently complete:

**Completeness Criteria**:
```bash
# spec.md minimum requirements
SPEC_HAS_OVERVIEW=$(grep -qE "^##\s*(Overview|Summary|Description)" spec.md && echo "yes" || echo "no")
SPEC_HAS_REQUIREMENTS=$(grep -qE "^##\s*(Functional|Requirements)" spec.md && echo "yes" || echo "no")
SPEC_WORD_COUNT=$(wc -w < spec.md | tr -d ' ')
SPEC_PLACEHOLDERS=$(grep -cE "\[TBD\]|\[TODO\]|\[NEEDS.*\]|\?\?\?|PLACEHOLDER" spec.md || echo "0")

# plan.md minimum requirements  
PLAN_HAS_STACK=$(grep -qiE "tech.*stack|architecture|stack|framework|language" plan.md && echo "yes" || echo "no")
PLAN_HAS_STRUCTURE=$(grep -qiE "structure|files|directories|components" plan.md && echo "yes" || echo "no")
PLAN_WORD_COUNT=$(wc -w < plan.md | tr -d ' ')
PLAN_PLACEHOLDERS=$(grep -cE "\[TBD\]|\[TODO\]|\[NEEDS.*\]|\?\?\?|PLACEHOLDER" plan.md || echo "0")

# tasks.md minimum requirements
TASK_COUNT=$(grep -cE "^-\s*\[\s*[xX ]?\s*\]" tasks.md || echo "0")
TASK_HAS_IDS=$(grep -qE "T[0-9]{3}" tasks.md && echo "yes" || echo "no")
TASKS_PLACEHOLDERS=$(grep -cE "\[TBD\]|\[TODO\]|\[NEEDS.*\]|\?\?\?|PLACEHOLDER" tasks.md || echo "0")
```

**Score each artifact** (0-100):
- spec.md: Overview(20) + Requirements(20) + WordCount>200(20) + NoPlaceholders(20) + UserStories(20)
- plan.md: TechStack(25) + Structure(25) + WordCount>300(25) + NoPlaceholders(25)
- tasks.md: TaskCount>10(25) + HasIDs(25) + HasSizes(25) + NoPlaceholders(25)

**If any artifact scores below 50**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  INCOMPLETE ARTIFACTS DETECTED                           │
├─────────────────────────────────────────────────────────────┤
│ Analysis accuracy is reduced due to incomplete artifacts:   │
│                                                              │
│ ARTIFACT COMPLETENESS SCORES:                               │
│ ├── spec.md:   [SCORE]% [✓/⚠️/❌ status]                    │
│ │   └── Issues: [list specific issues]                      │
│ ├── plan.md:   [SCORE]% [✓/⚠️/❌ status]                    │
│ │   └── Issues: [list specific issues]                      │
│ └── tasks.md:  [SCORE]% [✓/⚠️/❌ status]                    │
│     └── Issues: [list specific issues]                      │
│                                                              │
│ STATUS KEY:                                                 │
│ ✓ Ready (>80%)  ⚠️ Partial (50-80%)  ❌ Incomplete (<50%)   │
│                                                              │
│ OPTIONS:                                                    │
│ [1] Proceed with limited analysis (results may be partial)  │
│ [2] Complete artifacts first (recommend for accuracy)       │
│ [3] Analyze only complete artifacts (skip incomplete)       │
│                                                              │
│ Enter choice [1/2/3]:                                       │
└─────────────────────────────────────────────────────────────┘
```

**If [1] Proceed with limited**:
- Run full analysis but add disclaimer to report header:
  ```
  ⚠️ PARTIAL ANALYSIS: Some artifacts incomplete. 
  Results may miss issues. Re-run after completing artifacts.
  
  Incomplete: [list artifacts <80%]
  ```
- Lower confidence on findings from incomplete artifacts

**If [2] Complete first**:
- List exactly what's needed for each artifact:
  ```
  TO COMPLETE SPEC.MD:
  • Add Overview section (currently missing)
  • Resolve 3 [TBD] placeholders
  • Expand from 150 to 200+ words
  
  TO COMPLETE PLAN.MD:
  • Add Tech Stack section
  • Resolve 2 [TODO] placeholders
  
  Commands to run:
  • /speckit.clarify (resolve spec placeholders)
  • /speckit.plan (regenerate or complete plan)
  ```
- Exit analysis

**If [3] Analyze only complete**:
- Skip artifacts below 50% score
- Run partial analysis on remaining
- Note skipped artifacts in report

### 2. Load Artifacts (Progressive Disclosure)

Load only the minimal necessary context from each artifact:

**From spec.md:**

- Overview/Context
- Functional Requirements
- Non-Functional Requirements
- User Stories
- Edge Cases (if present)

**From plan.md:**

- Architecture/stack choices
- Data Model references
- Phases
- Technical constraints

**From tasks.md:**

- Task IDs
- Descriptions
- Phase grouping
- Parallel markers [P]
- Referenced file paths

**From constitution:**

- Load `.specify/memory/constitution.md` for principle validation

### 3. Build Semantic Models

Create internal representations (do not include raw artifacts in output):

- **Requirements inventory**: Each functional + non-functional requirement with a stable key (derive slug based on imperative phrase; e.g., "User can upload file" → `user-can-upload-file`)
- **User story/action inventory**: Discrete user actions with acceptance criteria
- **Task coverage mapping**: Map each task to one or more requirements or stories (inference by keyword / explicit reference patterns like IDs or key phrases)
- **Constitution rule set**: Extract principle names and MUST/SHOULD normative statements

### 4. Detection Passes (Token-Efficient Analysis)

Focus on high-signal findings. Limit to 50 findings total; aggregate remainder in overflow summary.

#### A. Duplication Detection

- Identify near-duplicate requirements within the same spec
- Mark lower-quality phrasing for consolidation

**IMPORTANT**: Do NOT flag specs from different repositories as duplicates even if they reference the same Jira ticket or feature name. Multi-repository features (frontend + backend + BFF) should have multiple complementary specs:
- Each repository documents its own layer (UI spec, API spec, BFF spec)
- Specs should cross-reference each other in "Related Specifications" sections
- Sharing a Jira ticket does NOT mean specs are duplicates - check the repository paths first

#### B. Ambiguity Detection

- Flag vague adjectives (fast, scalable, secure, intuitive, robust) lacking measurable criteria
- Flag unresolved placeholders (TODO, TKTK, ???, `<placeholder>`, etc.)

#### C. Underspecification

- Requirements with verbs but missing object or measurable outcome
- User stories missing acceptance criteria alignment
- Tasks referencing files or components not defined in spec/plan

#### D. Constitution Alignment

- Any requirement or plan element conflicting with a MUST principle
- Missing mandated sections or quality gates from constitution

#### E. Coverage Gaps

- Requirements with zero associated tasks
- Tasks with no mapped requirement/story
- Non-functional requirements not reflected in tasks (e.g., performance, security)

#### F. Inconsistency

- Terminology drift (same concept named differently across files)
- Data entities referenced in plan but absent in spec (or vice versa)
- Task ordering contradictions (e.g., integration tasks before foundational setup tasks without dependency note)
- Conflicting requirements (e.g., one requires Next.js while other specifies Vue)

### 5. Severity Assignment

Use this heuristic to prioritize findings:

- **CRITICAL**: Violates constitution MUST, missing core spec artifact, or requirement with zero coverage that blocks baseline functionality
- **HIGH**: Duplicate or conflicting requirement, ambiguous security/performance attribute, untestable acceptance criterion
- **MEDIUM**: Terminology drift, missing non-functional task coverage, underspecified edge case
- **LOW**: Style/wording improvements, minor redundancy not affecting execution order

### 6. Produce Compact Analysis Report

Output a Markdown report (no file writes) with the following structure:

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L120-134 | Two similar requirements ... | Merge phrasing; keep clearer version |

(Add one row per finding; generate stable IDs prefixed by category initial.)

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|

**Constitution Alignment Issues:** (if any)

**Unmapped Tasks:** (if any)

**Metrics:**

- Total Requirements
- Total Tasks
- Coverage % (requirements with >=1 task)
- Ambiguity Count
- Duplication Count
- Critical Issues Count

### 7. Enforce Blocking for CRITICAL Issues

**If any CRITICAL findings exist**:

1. **Create block file**: `FEATURE_DIR/.analysis-block`
   ```json
   {
     "blocked": true,
     "blocked_at": "2026-01-14T10:30:00Z",
     "critical_count": 3,
     "critical_issues": [
       {"id": "C1", "summary": "Constitution violation: Missing retry logic"},
       {"id": "C2", "summary": "Core requirement has zero task coverage"},
       {"id": "C3", "summary": "Conflicting requirements: Next.js vs Vue"}
     ],
     "unblock_instructions": "Fix all CRITICAL issues, then run /speckit.analyze again"
   }
   ```

2. **Show blocking message**:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚫 IMPLEMENTATION BLOCKED
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [critical_count] CRITICAL issues must be resolved before implementation.
   
   CRITICAL ISSUES:
   • [C1] Constitution violation: Missing retry logic
   • [C2] Core requirement has zero task coverage
   • [C3] Conflicting requirements: Next.js vs Vue
   
   WHAT'S BLOCKED:
   • /speckit.implement will refuse to run while block file exists
   • This protects against building features with constitution violations
   
   HOW TO UNBLOCK:
   1. Fix all CRITICAL issues in spec.md, plan.md, or tasks.md
   2. Run /speckit.analyze again
   3. Block file will be removed when no CRITICAL issues remain
   
   WHY THIS MATTERS:
   • Constitution violations are NON-NEGOTIABLE
   • Building on a broken foundation wastes time
   • Fixing issues now is cheaper than fixing after implementation
   ```

3. **Report remains read-only**: The block file is the ONLY file created

**If no CRITICAL findings**:

1. **Remove block file** (if exists): Delete `FEATURE_DIR/.analysis-block`
2. **Show success message**:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ ANALYSIS PASSED - Implementation Unblocked
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   No CRITICAL issues found. You may proceed with implementation.
   
   [Show HIGH/MEDIUM/LOW summary if any exist]
   
   RECOMMENDED: Address HIGH issues before implementing.
   OPTIONAL: Fix MEDIUM/LOW issues when convenient.
   
   Ready to proceed? Run: /speckit.implement
   ```

### 8. Provide Next Actions

At end of report, output a concise Next Actions block:

- If CRITICAL issues exist: **BLOCKED** - Must resolve before `/speckit.implement`
- If only HIGH issues: Strongly recommend resolving, but not blocked
- If only MEDIUM/LOW: User may proceed; provide improvement suggestions
- Provide explicit command suggestions: e.g., "Run /speckit.specify with refinement", "Run /speckit.plan to adjust architecture", "Manually edit tasks.md to add coverage for 'performance-metrics'"

### 8. Offer Remediation

Ask the user: "Would you like me to suggest concrete remediation edits for the top N issues?" (Do NOT apply them automatically.)

---

## Pre-PR Review Mode (`--pre-pr`)

When `--pre-pr` is specified, perform implementation review before creating a pull request:

```
🔍 **Pre-PR Review Mode**

This mode checks implementation completeness and generates PR description.

WHAT'S HAPPENING:
• Analyzing implementation against specification
• Checking acceptance criteria completion  
• Validating constitution compliance
• Generating PR description with AC mapping
```

### Pre-PR Analysis Steps

1. **Load Implementation Context**:
   - Get all files changed vs main branch
   - Count commits, lines added/removed
   - Identify test files created

2. **Acceptance Criteria Check**:
   - Extract ACs from spec.md
   - Search codebase for evidence of implementation
   - Check for related tests
   - Assign confidence: HIGH (code + test), MEDIUM (code only), LOW (indirect), NOT_FOUND

3. **Generate AC Report**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ✅ ACCEPTANCE CRITERIA REVIEW                               │
   ├─────────────────────────────────────────────────────────────┤
   │ User Story 1: [Name]                                       │
   │ ├─ ✅ AC1.1: [Description]              [HIGH confidence]  │
   │ ├─ ⚠️  AC1.2: [Description]             [MEDIUM confidence]│
   │ └─ ❌ AC1.3: [Description]              [NOT FOUND]        │
   │                                                              │
   │ SUMMARY: X/Y criteria met (Z%)                              │
   └─────────────────────────────────────────────────────────────┘
   ```

4. **Generate PR Description** (save to `PR_DESCRIPTION.md`):
   ```markdown
   ## Summary
   [Feature description from spec.md]
   
   ## Jira
   [JIRA-ID](link)
   
   ## Changes
   - [List of key changes]
   
   ## Acceptance Criteria
   | AC | Description | Status | Evidence |
   |----|-------------|--------|----------|
   | AC1 | [desc] | ✅ | [test/file reference] |
   
   ## Testing
   - [ ] Unit tests passing
   - [ ] Manual testing completed
   
   ## Screenshots (if applicable)
   [Add screenshots here]
   ```

---

## Operating Principles

### Context Efficiency

- **Minimal high-signal tokens**: Focus on actionable findings, not exhaustive documentation
- **Progressive disclosure**: Load artifacts incrementally; don't dump all content into analysis
- **Token-efficient output**: Limit findings table to 50 rows; summarize overflow
- **Deterministic results**: Rerunning without changes should produce consistent IDs and counts

### Analysis Guidelines

- **NEVER modify files** (this is read-only analysis)
- **NEVER hallucinate missing sections** (if absent, report them accurately)
- **Prioritize constitution violations** (these are always CRITICAL)
- **Use examples over exhaustive rules** (cite specific instances, not generic patterns)
- **Report zero issues gracefully** (emit success report with coverage statistics)

## Context

$ARGUMENTS
