---
description: Full pre-implementation workflow - runs specify, clarify, plan, tasks, and analyze in sequence.
---

# /speckit.quickstart - Complete Pre-Implementation Workflow

**Purpose**: Execute the full Spec-Kit workflow from Jira ticket to implementation-ready state in one command. Runs: specify → clarify → plan → tasks → analyze.

**Output**: Feature branch with complete spec, plan, and tasks - ready for `/speckit.implement`.

---

## Arguments

| Argument | Description |
|----------|-------------|
| `<JIRA-ID>` | Jira ticket ID (required) |
| `--skip-clarify` | Skip clarification phase if ACs are already complete |
| `--dry-run` | Preview what would be created without writing files |

**Examples**:
- `/speckit.quickstart PROJ-1234`
- `/speckit.quickstart PROJ-1234 --skip-clarify`

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ SPEC-KIT QUICKSTART                                      │
├─────────────────────────────────────────────────────────────┤
│ This command runs the FULL pre-implementation workflow:     │
│                                                              │
│ Phase 1: SPECIFY  → Create spec.md from Jira ticket         │
│ Phase 2: CLARIFY  → Identify gaps, suggest AC improvements  │
│ Phase 3: PLAN     → Generate implementation plan            │
│ Phase 4: TASKS    → Break down into implementation tasks    │
│ Phase 5: ANALYZE  → Validate against constitution           │
│                                                              │
│ OUTPUT:                                                     │
│ • Feature branch: {JIRA-ID}-{feature-slug}                  │
│ • specs/{JIRA-ID}-{slug}/spec.md                            │
│ • specs/{JIRA-ID}-{slug}/plan.md                            │
│ • specs/{JIRA-ID}-{slug}/tasks.md                           │
│ • Analysis report (pass/fail)                               │
│                                                              │
│ NEXT STEP: /speckit.implement                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: SPECIFY

**Goal**: Create specification from Jira ticket.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PHASE 1: SPECIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fetching Jira ticket and creating specification...
```

**Actions** (from speckit.specify):

1. **Fetch Jira Ticket**:
   - Get ticket details via Jira MCP tools
   - Extract: title, description, acceptance criteria, epic link

2. **Create Feature Branch**:
   ```bash
   git checkout -b {JIRA-ID}-{feature-slug}
   mkdir -p specs/{JIRA-ID}-{feature-slug}
   ```

3. **Generate spec.md**:
   - Overview from Jira description
   - User stories from acceptance criteria
   - Functional requirements extracted from ACs
   - Non-functional requirements (if mentioned)
   - Out of scope section

**Output**:
```
✅ Phase 1 Complete
   • Branch: PROJ-1234-guest-visibility
   • Created: specs/PROJ-1234-guest-visibility/spec.md
   • User Stories: 3
   • Acceptance Criteria: 12
```

---

## Phase 2: CLARIFY

**Goal**: Identify gaps and ambiguities in requirements.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PHASE 2: CLARIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyzing specification for gaps and ambiguities...
```

**Actions** (from speckit.clarify):

1. **Analyze Acceptance Criteria Quality**:
   - Check for SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)
   - Identify vague language ("should work", "fast", "user-friendly")
   - Flag missing edge cases

2. **Generate Clarifying Questions**:
   - Group by category: Technical, Business, UX, Edge Cases
   - Prioritize by impact on implementation

3. **Suggest AC Improvements**:
   - Rewrite vague ACs with specific, testable criteria
   - Add missing ACs for discovered edge cases

**If gaps found**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  CLARIFICATION NEEDED                                    │
├─────────────────────────────────────────────────────────────┤
│ Found 3 gaps in acceptance criteria:                        │
│                                                              │
│ 1. AC2.1: "Guest can view inventory" - What fields?         │
│ 2. AC3.2: Missing error handling for network failures       │
│ 3. No AC for data pagination                                │
│                                                              │
│ SUGGESTED IMPROVEMENTS:                                     │
│ [Shows specific rewrites]                                   │
│                                                              │
│ [A] Accept suggestions and continue                         │
│ [E] Edit manually before continuing                         │
│ [S] Skip clarify phase                                      │
└─────────────────────────────────────────────────────────────┘
```

**Output**:
```
✅ Phase 2 Complete
   • Gaps identified: 3
   • ACs improved: 2
   • Questions for stakeholder: 1 (logged in spec.md)
```

---

## Phase 3: PLAN

**Goal**: Generate implementation plan with technical approach.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️  PHASE 3: PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generating implementation plan...
```

**Actions** (from speckit.plan):

1. **Analyze Codebase**:
   - Identify relevant existing files
   - Map dependencies and integration points
   - Check for similar patterns in codebase

2. **Generate Technical Approach**:
   - High-level architecture decisions
   - Component breakdown
   - Data flow design

3. **Create plan.md**:
   - Implementation approach
   - Files to create/modify
   - Dependencies and prerequisites
   - Testing strategy
   - Risk assessment

**Output**:
```
✅ Phase 3 Complete
   • Created: specs/PROJ-1234-guest-visibility/plan.md
   • Files to modify: 8
   • New files: 3
   • Test files: 2
```

---

## Phase 4: TASKS

**Goal**: Break down plan into implementation tasks.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PHASE 4: TASKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Breaking down plan into implementation tasks...
```

**Actions** (from speckit.tasks):

1. **Generate Task Breakdown**:
   - One task per logical unit of work
   - Include file paths and specific changes
   - Add acceptance criteria per task

2. **Estimate Effort**:
   - T-shirt sizing (XS, S, M, L, XL)
   - Identify dependencies between tasks

3. **Create tasks.md**:
   - Ordered task list with checkboxes
   - Agent-compatible format
   - Clear success criteria per task

**Output**:
```
✅ Phase 4 Complete
   • Created: specs/PROJ-1234-guest-visibility/tasks.md
   • Total tasks: 12
   • Estimated effort: M (4-6 hours)
```

---

## Phase 5: ANALYZE

**Goal**: Validate everything against constitution before implementation.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔬 PHASE 5: ANALYZE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Validating against constitution...
```

**Actions** (from speckit.analyze):

1. **Constitution Compliance**:
   - Check spec against all constitution rules
   - Validate plan follows architectural guidelines
   - Ensure tasks include required patterns (tests, error handling)

2. **Coverage Check**:
   - All ACs have corresponding tasks
   - All tasks map to spec requirements
   - Test coverage planned for each component

3. **Generate Report**:
   - PASS/FAIL status
   - Issues by severity (CRITICAL, HIGH, MEDIUM, LOW)
   - Recommendations

**If issues found**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  ANALYSIS FOUND ISSUES                                   │
├─────────────────────────────────────────────────────────────┤
│ CRITICAL: 0 | HIGH: 1 | MEDIUM: 2 | LOW: 1                  │
│                                                              │
│ HIGH-001: Missing error handling task for API calls         │
│ MEDIUM-001: No task for input validation                    │
│ MEDIUM-002: Test task missing for edge case AC3.2           │
│                                                              │
│ [F] Fix issues and re-analyze                               │
│ [P] Proceed anyway (not recommended)                        │
│ [R] View full report                                        │
└─────────────────────────────────────────────────────────────┘
```

**Output**:
```
✅ Phase 5 Complete
   • Constitution: COMPLIANT
   • Coverage: 100% (12/12 ACs covered)
   • Issues: 0 CRITICAL, 0 HIGH
```

---

## Final Summary

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ QUICKSTART COMPLETE - READY FOR IMPLEMENTATION           │
├─────────────────────────────────────────────────────────────┤
│ Jira: PROJ-1234                                              │
│ Branch: PROJ-1234-guest-visibility                           │
│                                                              │
│ CREATED FILES:                                              │
│ • specs/PROJ-1234-guest-visibility/spec.md                   │
│ • specs/PROJ-1234-guest-visibility/plan.md                   │
│ • specs/PROJ-1234-guest-visibility/tasks.md                  │
│                                                              │
│ SUMMARY:                                                    │
│ • User Stories: 3                                           │
│ • Acceptance Criteria: 12                                   │
│ • Implementation Tasks: 12                                  │
│ • Estimated Effort: M (4-6 hours)                           │
│ • Constitution: ✅ COMPLIANT                                │
│                                                              │
│ NEXT STEP:                                                  │
│ Run /speckit.implement to begin implementation              │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### Jira Ticket Not Found
```
❌ Could not fetch Jira ticket PROJ-9999
   • Verify ticket ID is correct
   • Check Jira MCP connection
   • Run: /speckit.quickstart PROJ-XXXX with correct ID
```

### Analysis Fails with CRITICAL Issues
```
❌ BLOCKED - Cannot proceed to implementation

CRITICAL issues must be resolved:
• CRIT-001: [Description]

Run /speckit.analyze after fixing to re-validate.
```

---

## Context

```xml
$JIRA_CONTEXT
$WORKSPACE_CONTEXT
$CONSTITUTION_CONTEXT
```
