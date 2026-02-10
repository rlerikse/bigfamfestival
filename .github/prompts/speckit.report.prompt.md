---
description: Generate a comprehensive implementation report with measurable metrics, ROI analysis, and leadership-ready documentation
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## 📋 What This Command Does

**Purpose**: Generate a detailed implementation report showing the complete journey from requirements to deployed code, with measurable ROI metrics for leadership review.

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md#the-spec-kit-workflow)):
- **Post-Implementation**: After feature completion, create comprehensive documentation
- **Metrics Collection**: Track time, cost, quality improvements
- **Traceability**: Map Acceptance Criteria to implementation evidence
- **ROI Analysis**: Demonstrate Spec-Kit value with concrete data

**This command will**:
1. **Parse input** (Jira ticket ID, spec directory, or feature name)
2. **Locate spec artifacts** (spec.md, plan.md, tasks.md, .checkpoint.json, commits)
3. **Extract implementation data** (files created/modified, test coverage, AC compliance)
4. **Calculate metrics** (time saved, token usage, cost analysis, ROI)
5. **Document blockers** (issues encountered, resolutions, improvements made)
6. **Generate report** (comprehensive markdown with charts, tables, evidence)
7. **Validate completeness** (ensure all claims are verifiable with references)

**Why use this?**
- ✅ Demonstrate Spec-Kit ROI with concrete metrics
- ✅ Leadership-ready documentation (time saved, cost savings)
- ✅ Complete traceability (Jira → AC → Code → Tests → PR)
- ✅ Process improvement insights (blockers, edge cases discovered)
- ✅ Team knowledge sharing (implementation journey documented)

**What happens next**: Share report with leadership, use for process improvement, archive for future reference.

---

## Outline

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 SPEC-KIT IMPLEMENTATION REPORT GENERATOR                 │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Locating spec artifacts and implementation evidence       │
│ • Analyzing git history for timeline and changes            │
│ • Calculating metrics (time, cost, tokens, ROI)             │
│ • Mapping Acceptance Criteria to code evidence              │
│ • Documenting blockers and improvements                     │
│ • Generating leadership-ready report                        │
│                                                              │
│ REPORT SECTIONS:                                            │
│ 1. Executive Summary (timeline, outcome, ROI highlight)     │
│ 2. Implementation Journey (phase-by-phase with metrics)     │
│ 3. Blockers & Hindrances (issues, time lost, resolutions)   │
│ 4. Acceptance Criteria Tracking (AC → evidence mapping)     │
│ 5. Spec-Kit Value Metrics (time saved, cost analysis)       │
│ 6. Edge Cases & Improvements (discoveries, enhancements)    │
│ 7. Comparative Analysis (with vs without Spec-Kit)          │
│ 8. Recommendations for Leadership (adoption criteria)       │
│                                                              │
│ OUTPUT:                                                     │
│ • specs/NNN-feature/[JIRA-ID]-IMPLEMENTATION-REPORT.md      │
│ • All claims verifiable with file/commit references         │
└─────────────────────────────────────────────────────────────┘
```

1. **Parse input and locate feature**:

   **Input formats supported**:
   - Jira ticket ID: `PROJ-1367` or `/speckit.report PROJ-1367`
   - Spec directory: `specs/003-diagnosis-dms-validation`
   - Feature name: `diagnosis dms validation`

   **Parse logic**:
   ```bash
   # Extract Jira pattern
   JIRA_ID=$(echo "$ARGUMENTS" | grep -oE '[A-Z]+-[0-9]+')
   
   # If Jira ID provided, find matching spec directory
   if [ -n "$JIRA_ID" ]; then
     FEATURE_DIR=$(grep -l "$JIRA_ID" specs/*/spec.md 2>/dev/null | head -1 | xargs dirname)
   fi
   
   # If spec directory provided directly
   if [[ "$ARGUMENTS" =~ specs/[0-9]+-[a-z-]+ ]]; then
     FEATURE_DIR=$(echo "$ARGUMENTS" | grep -oE 'specs/[0-9]+-[a-z-]+')
   fi
   
   # If feature name, search for matching spec
   if [ -z "$FEATURE_DIR" ]; then
     FEATURE_DIR=$(find specs -name "spec.md" -exec grep -l "$(echo $ARGUMENTS)" {} \; | head -1 | xargs dirname)
   fi
   ```

   **If feature not found**:
   ```
   ❌ FEATURE NOT FOUND
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Could not locate spec for: "$ARGUMENTS"
   
   SUGGESTIONS:
   • Provide Jira ID: /speckit.report PROJ-1367
   • Provide spec path: /speckit.report specs/003-diagnosis-dms-validation
   • List available specs: ls specs/
   ```
   **STOP execution.**

   **If multiple matches found**, show selection:
   ```
   ⚠️  MULTIPLE SPECS FOUND
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [1] specs/002-guest-settings (PROJ-43)
   [2] specs/003-diagnosis-dms-validation (PROJ-1367)
   [3] specs/005-geofences-management (PROJ-892)
   
   Which spec should I generate a report for? [1-3]:
   ```

2. **Detect feature context** from current directory or user input:

   - Look for `specs/*/` directories containing spec.md
   - If in a feature directory (contains spec.md), use that as FEATURE_DIR
   - Set paths: FEATURE_SPEC, IMPL_PLAN, TASKS_FILE relative to FEATURE_DIR
   - Scan for JIRA_ID in spec.md metadata (look for `jira:` or `ticket:` fields)

3. **Collect implementation artifacts**:

   **Check for these files** (relative to FEATURE_DIR):
   ```
   spec.md             (REQUIRED)
   plan.md             (optional)
   tasks.md            (optional)
   data-model.md       (optional)
   .checkpoint.json    (if exists, implementation in progress or recently completed)
   .analysis-block     (if exists, blocked issues)
   PR_DESCRIPTION.md   (if exists, PR was generated)
   contracts/          (OpenAPI specs, if exist)
   IMPLEMENTATION_NOTES.md  (manual notes, if exist)
   ```

   **For each file found**:
   - Record file size: `du -h filename`
   - Record line count: `wc -l filename`
   - Extract key metadata (creation date, last modified)

4. **Analyze git history for implementation timeline**:

   ```bash
   # Find spec creation commit
   SPEC_CREATED=$(git log --diff-filter=A --format="%H|%aI|%an" -- "$FEATURE_SPEC" | tail -1)
   
   # Find all commits related to this feature
   FEATURE_COMMITS=$(git log --all --oneline --grep="$JIRA_ID" 2>/dev/null)
   
   # Find checkpoint commits
   CHECKPOINT_COMMITS=$(git log --all --oneline --grep="checkpoint:" --grep="$JIRA_ID" 2>/dev/null)
   
   # Find implementation complete commit
   COMPLETE_COMMIT=$(git log --all --oneline --grep="checkpoint: implementation complete" --grep="$JIRA_ID" 2>/dev/null | head -1)
   
   # Get list of files created/modified by this feature
   FILES_CHANGED=$(git log --all --name-status --grep="$JIRA_ID" 2>/dev/null | grep -E '^(A|M)' | awk '{print $2}' | sort -u)
   ```

   **Timeline extraction**:
   - Spec created: [timestamp]
   - First commit: [timestamp]
   - Checkpoint commits: [list with timestamps]
   - Implementation complete: [timestamp]
   - Total calendar days: [spec created → complete]
   - Total commits: [count]

5. **Parse checkpoint file** (if exists):

   **Load `.checkpoint.json`**:
   ```json
   {
     "feature": "diagnosis-dms-validation",
     "started_at": "2026-01-15T09:00:00Z",
     "last_updated": "2026-01-17T16:30:00Z",
     "current_phase": "Complete",
     "completed_phases": ["Setup", "Tests", "Core", "Integration", "Polish"],
     "completed_tasks": ["TASK-001", "TASK-002", ...],
     "failed_tasks": [],
     "files_created": ["src/services/dms-validation.service.ts", ...],
     "files_modified": ["package.json", "src/routes/index.ts", ...],
     "completion_status": "success",
     "completed_at": "2026-01-17T16:30:00Z"
   }
   ```

   **Extract metrics**:
   - Implementation duration: `completed_at - started_at`
   - Phases completed: count of `completed_phases`
   - Tasks completed: count of `completed_tasks`
   - Files created: count from `files_created`
   - Files modified: count from `files_modified`
   - Success status: `completion_status`

   **If checkpoint missing**: Use git history and tasks.md to reconstruct timeline

6. **Parse tasks.md for completion status**:

   **Scan for task structure**:
   ```markdown
   ## Tasks by Phase
   
   ### Phase 1: Setup
   - [x] TASK-001: Setup database schema
   - [x] TASK-002: Configure Prisma
   - [ ] TASK-003: Add environment variables
   
   ### Phase 2: Tests
   - [x] TEST-001: Unit tests for DMS validation
   ...
   ```

   **Extract**:
   - Total tasks: [count all tasks]
   - Completed tasks: [count [x] tasks]
   - Incomplete tasks: [count [ ] tasks]
   - Completion percentage: [completed / total * 100]
   - Tasks by phase: [group and count by phase header]

7. **Parse spec.md for Acceptance Criteria**:

   **Locate AC section** (multiple possible formats):
   ```markdown
   ## Acceptance Criteria
   - AC-01: System validates DMS-specific opcode minimums
   - AC-02: API returns 400 for invalid opcode counts
   
   OR
   
   ## User Stories
   ### US-1: Validate DMS Opcodes
   **Acceptance Criteria**:
   - Given dealer has CDK DMS...
   - When opcodes < 8...
   ```

   **Extract all ACs**:
   - AC ID (if labeled, or generate: AC-001, AC-002, ...)
   - AC description/text
   - Related user story (if structured)

8. **Map Acceptance Criteria to implementation evidence**:

   **For each AC**, search for evidence in:
   
   **Test files**:
   ```bash
   # Search test files for AC references
   grep -rn "AC-01\|opcode.*minim" test/ src/**/*.spec.ts src/**/*.test.ts
   
   # Look for test descriptions matching AC
   grep -rn "it('validates.*opcode" test/ src/
   ```

   **Source files**:
   ```bash
   # Search for implementation logic
   grep -rn "validateOpcodes\|DMS_MINIMUMS" src/
   ```

   **Generate evidence table**:
   ```markdown
   | AC ID | Description | Met? | Evidence | Location | Commit |
   |-------|-------------|------|----------|----------|--------|
   | AC-01 | Validates DMS minimums | ✅ | Test: "should reject CDK with <8 opcodes" | dms-validation.service.spec.ts:L45 | abc123 |
   | AC-02 | Returns 400 for invalid | ✅ | Test: "returns 400 when validation fails" | guest-settings.e2e.spec.ts:L89 | def456 |
   ```

   **For each AC**:
   - Search test files for test name matching AC description
   - Get file path and line number: `grep -n "test description"`
   - Get commit introducing this test: `git log -1 --format="%h" -- filepath`
   - Mark as ✅ (met) if test exists, ⚠️ (partial) if logic exists but no test, ❌ (not met) if missing

9. **Calculate Spec-Kit metrics**:

   **Token estimation** (if chat history available):
   - Use actual token counts from conversation
   - If unavailable, estimate:
     ```bash
     SPEC_WORDS=$(wc -w < spec.md)
     PLAN_WORDS=$(wc -w < plan.md)
     TASKS_WORDS=$(wc -w < tasks.md)
     
     # Rough estimate: 1 word ≈ 1.3 tokens
     ESTIMATED_TOKENS=$((($SPEC_WORDS + $PLAN_WORDS + $TASKS_WORDS) * 13 / 10))
     ```

   **Phase breakdown** (typical distribution):
   ```
   Specify: 20% of total tokens
   Clarify: 15% of total tokens
   Plan: 25% of total tokens
   Tasks: 15% of total tokens
   Analyze: 10% of total tokens
   Implement: 45% of total tokens (largest phase)
   ```

   **Cost calculation** (Claude Sonnet 4.5 pricing):
   ```
   Input tokens: $3 per 1M tokens
   Output tokens: $15 per 1M tokens
   
   Assume 70% input, 30% output split
   Total cost = (tokens * 0.7 * $3/1M) + (tokens * 0.3 * $15/1M)
   ```

   **Time savings calculation**:
   ```
   Traditional approach (baseline):
   - Requirements gathering: 4-6 hours
   - Design doc: 3-4 hours
   - Task breakdown: 2-3 hours
   - Implementation planning: 2-3 hours
   - PR description: 1 hour
   Total: 12-17 hours pre-coding
   
   Spec-Kit approach:
   - Specify: 5 min
   - Clarify: 10 min (5 questions)
   - Plan: 8 min
   - Tasks: 6 min
   - Analyze: 4 min
   - Human review: 30 min (optional)
   Total: ~1 hour pre-coding
   
   Time saved: 11-16 hours (73-88% reduction)
   ```

10. **Document blockers and improvements**:

    **Scan commit messages and spec for blockers**:
    ```bash
    # Look for blocker-related commits
    git log --all --grep="fix\|bug\|block\|issue" --grep="$JIRA_ID" --oneline
    
    # Check spec for "Clarifications" section (issues discovered)
    grep -A 50 "## Clarifications" spec.md
    
    # Check for IMPLEMENTATION_NOTES.md
    [ -f IMPLEMENTATION_NOTES.md ] && cat IMPLEMENTATION_NOTES.md
    ```

    **Check for process improvement docs**:
    - Look for files like `JIRA_INTEGRATION_IMPROVEMENTS.md`
    - Check `setup-troubleshooting.md`
    - Scan git history for script changes (setup scripts, tooling fixes)

    **Generate blocker table**:
    ```markdown
    | # | Issue | Phase | Time Lost | Root Cause | Resolution | Preventable? |
    |---|-------|-------|-----------|------------|------------|--------------|
    | 1 | [description] | Setup | [duration] | [cause] | [fix] | Yes/No |
    ```

    **Extract from**:
    - Commit messages with "fix", "resolve", "workaround"
    - Spec clarifications section (Q&A about blockers)
    - Implementation notes
    - Setup troubleshooting docs

11. **Generate report structure**:

    **Report filename**: `[JIRA-ID]-IMPLEMENTATION-REPORT.md`
    **Location**: Save to `$FEATURE_DIR/`

    **Template structure**:
    ```markdown
    # Implementation Report: [Feature Name]
    
    **Jira**: [JIRA-ID]  
    **Status**: ✅ Complete / 🚧 In Progress / ❌ Blocked  
    **Generated**: [timestamp]  
    **Spec Location**: [`specs/NNN-feature/spec.md`](./spec.md)
    
    ---
    
    ## 1. Executive Summary
    
    ### Feature Overview
    [2-3 sentence summary from spec.md]
    
    ### Timeline
    - **Spec Created**: [date]
    - **Implementation Started**: [date]
    - **Implementation Completed**: [date]
    - **Total Duration**: [X] calendar days, [Y] working hours
    
    ### Outcome
    - **Status**: [Complete/Partial/Blocked]
    - **Tasks Completed**: [X]/[Total] ([percentage]%)
    - **Acceptance Criteria Met**: [X]/[Total] ([percentage]%)
    - **Test Coverage**: [X]%
    - **Files Created**: [count]
    - **Files Modified**: [count]
    
    ### ROI Highlight
    **Time Saved**: [11-16] hours in planning overhead (73-88% reduction)  
    **AI Cost**: $[X.XX] for automated spec/plan/tasks generation  
    **ROI**: [700-900]x return on AI investment  
    **Quality**: [X] issues caught pre-coding via analysis phase
    
    ---
    
    ## 2. Implementation Journey
    
    ### Phase-by-Phase Timeline
    
    #### Phase 0: Requirements Gathering
    **Command**: `/speckit.specify --jira [JIRA-ID]`  
    **Duration**: [X] minutes  
    **Input**: Jira ticket [JIRA-ID]  
    **Output**: `spec.md` ([size] KB, [lines] lines)  
    **Human Intervention**: None - fully automated  
    **Tokens**: ~[X,XXX] (estimated)  
    **Cost**: $[X.XX] USD  
    
    **Key Decisions**:
    - Extracted Description, AC, Notes, Comments from Jira
    - Auto-detected Figma links: [count]
    - Identified [X] out-of-scope items
    
    #### Phase 1: Clarification
    **Command**: `/speckit.clarify`  
    **Duration**: [X] minutes  
    **Questions Asked**: [X]  
    **Output**: Clarifications added to `spec.md`  
    **Human Intervention**: Yes - answered [X] questions  
    **Tokens**: ~[X,XXX]  
    **Cost**: $[X.XX] USD  
    
    **Clarifications**:
    1. Q: [question] → A: [answer]
    2. Q: [question] → A: [answer]
    
    #### Phase 2: Planning
    **Command**: `/speckit.plan`  
    **Duration**: [X] minutes  
    **Input**: `spec.md`  
    **Output**: `plan.md` ([size] KB, [lines] lines)  
    **Human Intervention**: None  
    **Tokens**: ~[X,XXX]  
    **Cost**: $[X.XX] USD  
    
    **Sections Generated**:
    - Architecture & Design
    - Data Model
    - API Contracts
    - Testing Strategy
    - Deployment Strategy
    - [X] total sections
    
    #### Phase 3: Task Breakdown
    **Command**: `/speckit.tasks`  
    **Duration**: [X] minutes  
    **Output**: `tasks.md` ([size] KB, [X] tasks across [Y] phases)  
    **Human Intervention**: Minimal - reviewed task dependencies  
    **Tokens**: ~[X,XXX]  
    **Cost**: $[X.XX] USD  
    
    **Task Distribution**:
    - Setup: [X] tasks
    - Tests: [X] tasks
    - Core: [X] tasks
    - Integration: [X] tasks
    - Polish: [X] tasks
    
    #### Phase 4: Constitution Analysis
    **Command**: `/speckit.analyze`  
    **Duration**: [X] minutes  
    **Issues Found**: [X] warnings, [X] critical  
    **Output**: Updated `spec.md` with compliance notes  
    **Human Intervention**: Fixed [X] critical issues before implementation  
    **Tokens**: ~[X,XXX]  
    **Cost**: $[X.XX] USD  
    
    **Issues Detected**:
    - ⚠️  [warning description]
    - ❌ [critical issue] → Fixed before implementation
    
    #### Phase 5: Implementation
    **Command**: `/speckit.implement`  
    **Duration**: [X] hours (spread over [X] days)  
    **Checkpoints**: [X] (one per phase)  
    **Output**: [X] files created, [X] files modified  
    **Human Intervention**: Yes - manual testing, edge case handling  
    **Tokens**: ~[X,XXX]  
    **Cost**: $[X.XX] USD  
    
    **Implementation Phases**:
    - ✅ Setup ([X] tasks, [duration])
    - ✅ Tests ([X] tasks, [duration])
    - ✅ Core ([X] tasks, [duration])
    - ✅ Integration ([X] tasks, [duration])
    - ✅ Polish ([X] tasks, [duration])
    
    **Git Activity**:
    - Total commits: [X]
    - Checkpoint commits: [X]
    - Files changed: [X]
    - Lines added: [+X]
    - Lines deleted: [-X]
    
    ### Total Metrics
    
    | Metric | Value |
    |--------|-------|
    | **Total Time** | [X] hours (automated: [X]hr, manual: [X]hr) |
    | **Total Tokens** | [XXX,XXX] |
    | **Total Cost** | $[XX.XX] USD |
    | **Files Generated** | [X] spec artifacts, [X] code files |
    | **Lines of Spec** | [X,XXX] |
    | **Lines of Code** | [X,XXX] |
    
    ---
    
    ## 3. Blockers & Hindrances
    
    | # | Issue | Phase | Time Lost | Root Cause | Resolution | Preventable? | Reference |
    |---|-------|-------|-----------|------------|------------|--------------|-----------|
    | 1 | [description] | [phase] | [duration] | [cause] | [resolution] | Yes/No | [commit/file] |
    
    **Total Hindrance Impact**: [X] hours lost to setup/tooling issues
    
    **Preventable Issues**: [X]/[Total] ([percentage]%)  
    **Future Improvements**: [list of process changes made]
    
    ### 3.1 Post-Merge Debugging (if applicable)
    
    **Include this section if any merge conflict resolution was required during implementation.**
    
    | Activity | Duration | Files Affected |
    |----------|----------|----------------|
    | Initial merge conflict resolution | [X] min | [X] files |
    | Debugging CI lint failures | [X] min | [X] files |
    | Fixing merge resolution errors | [X] hrs | [X] files |
    | PR feedback reverts | [X] min | [X] files |
    | **Total Time Lost** | **[X] hrs** | **[X] files** |
    
    **Issues Fixed**:
    | Issue Type | File | Description | Time to Fix |
    |------------|------|-------------|-------------|
    | Duplicate class definitions | [file] | Both branches modified class | [X] min |
    | Duplicate code blocks | [file] | Initialization merged incorrectly | [X] min |
    | Wrong constructor params | [file] | Dependency refactoring conflict | [X] min |
    | Unused imports | [file] | Imports from both branches kept | [X] min |
    
    **Lessons Learned**:
    1. Always run `npm run lint` immediately after resolving merge conflicts
    2. Review merge diffs for duplicate code patterns
    3. Validate constructor signatures when merging dependency changes
    4. Use GitHub Copilot Agent Mode for complex multi-file merge fixes
    
    **Prevention**: All issues would have been caught by running lint before commit.
    See `context/checklists/post-merge-validation.md` for complete checklist.
    
    ---
    
    ## 4. Acceptance Criteria Tracking
    
    ### Coverage Summary
    - **Total ACs**: [X]
    - **Met**: [X] (✅)
    - **Partially Met**: [X] (⚠️)
    - **Not Met**: [X] (❌)
    - **Coverage**: [percentage]%
    
    ### Evidence Mapping
    
    | AC ID | Acceptance Criteria | Met? | Evidence | Location | Commit | Phase |
    |-------|---------------------|------|----------|----------|--------|-------|
    | AC-01 | [description] | ✅ | [test name] | [`file.ts:LXX`](./path/to/file.ts#LXX) | [`abc123`](commit-url) | Implement-Tests |
    | AC-02 | [description] | ✅ | [test name] | [`file.ts:LXX`](./path/to/file.ts#LXX) | [`def456`](commit-url) | Implement-Integration |
    
    ### Traceability Chain
    
    Example for AC-01:
    ```
    Jira [PROJ-XXXX]
      ↓
    Spec [spec.md:L123] - "System shall validate DMS opcode minimums"
      ↓
    Plan [plan.md:L456] - "Implement DMS validation service"
      ↓
    Task [tasks.md:TASK-015] - "Create DMS validation logic"
      ↓
    Code [src/services/dms-validation.service.ts:L89] - validateOpcodes()
      ↓
    Test [src/services/dms-validation.service.spec.ts:L45] - "should reject CDK with <8 opcodes"
      ↓
    PR [PR_DESCRIPTION.md] - Listed in "Acceptance Criteria" section
    ```
    
    ---
    
    ## 5. Spec-Kit Value Metrics
    
    ### 5.1 Time Savings Analysis
    
    #### Traditional Waterfall Approach (Baseline)
    
    | Activity | Typical Duration | Notes |
    |----------|------------------|-------|
    | Requirements gathering | 4-6 hours | Meetings, clarifications, back-and-forth |
    | Design document writing | 3-4 hours | Manual documentation |
    | Task breakdown | 2-3 hours | Decomposition, estimation |
    | Implementation planning | 2-3 hours | Architecture decisions, dependencies |
    | PR description writing | 1 hour | Summarizing changes |
    | **TOTAL PRE-CODING** | **12-17 hours** | Before first line of code |
    
    #### Spec-Kit Approach (Actual)
    
    | Phase | Duration | Automation Level |
    |-------|----------|------------------|
    | /speckit.specify | [X] min | 100% automated |
    | /speckit.clarify | [X] min | Guided Q&A (10% manual) |
    | /speckit.plan | [X] min | 100% automated |
    | /speckit.tasks | [X] min | 100% automated |
    | /speckit.analyze | [X] min | 100% automated |
    | Human review/tweaks | [X] min | 100% manual (optional) |
    | **TOTAL PRE-CODING** | **~[X] hour** | 85-90% automated |
    
    #### Savings Calculation
    
    ```
    Traditional:  12-17 hours
    Spec-Kit:     ~1 hour
    ─────────────────────────
    Time Saved:   11-16 hours per feature
    Reduction:    73-88%
    ```
    
    **Annualized Impact** (assuming 20 features/year per team):
    - Time saved: **220-320 hours/year**
    - At $150/hour loaded cost: **$33,000 - $48,000 saved/year per team**
    
    ### 5.2 Cost Analysis
    
    #### Token Usage Breakdown
    
    | Phase | Input Tokens | Output Tokens | Total Tokens | Cost (USD) |
    |-------|--------------|---------------|--------------|------------|
    | Specify | [X,XXX] | [X,XXX] | [XX,XXX] | $X.XX |
    | Clarify | [X,XXX] | [X,XXX] | [XX,XXX] | $X.XX |
    | Plan | [X,XXX] | [X,XXX] | [XX,XXX] | $X.XX |
    | Tasks | [X,XXX] | [X,XXX] | [XX,XXX] | $X.XX |
    | Analyze | [X,XXX] | [X,XXX] | [XX,XXX] | $X.XX |
    | Implement | [XX,XXX] | [XX,XXX] | [XXX,XXX] | $X.XX |
    | **TOTAL** | **[XXX,XXX]** | **[XX,XXX]** | **[XXX,XXX]** | **$XX.XX** |
    
    *Pricing: Claude Sonnet 4.5 - Input: $3/M tokens, Output: $15/M tokens*
    
    #### ROI Calculation
    
    ```
    AI Cost:              $XX.XX
    Engineering Saved:    $1,800-2,400 (12-16 hours × $150/hr)
    ────────────────────────────────────
    ROI:                  700-900x return
    Payback Time:         < 1 minute of engineer time
    ```
    
    ### 5.3 Quality Improvements
    
    #### Artifacts Generated
    
    **Spec-Kit Generated** (would require manual creation otherwise):
    - ✅ Comprehensive `spec.md` with clarifications documented
    - ✅ Technical `plan.md` with architecture decisions explained
    - ✅ Task `tasks.md` with dependency mapping
    - ✅ Constitution compliance analysis (caught [X] violations pre-coding)
    - ✅ Contract validation against OpenAPI specs
    - ✅ `PR_DESCRIPTION.md` with complete traceability
    
    **Lines of Documentation Generated**: [X,XXX] lines
    
    **Estimated Manual Effort Equivalent**: [X] hours to write by hand
    
    #### Defect Prevention
    
    | Category | Count | Phase Detected | Impact |
    |----------|-------|----------------|--------|
    | Constitution violations | [X] | Analyze | Prevented tech debt |
    | Missing requirements | [X] | Clarify | Prevented rework |
    | Out-of-scope items | [X] | Specify | Prevented wasted work |
    | Invalid contracts | [X] | Plan | Prevented API mismatches |
    | Missing test scenarios | [X] | Tasks | Improved coverage |
    | **TOTAL ISSUES** | **[X]** | **Pre-coding** | **[X] hrs rework avoided** |
    
    **Value of Early Detection**: Finding issues in planning costs ~10x less than finding in code review, ~100x less than finding in production.
    
    ---
    
    ## 6. Edge Cases & Improvements Discovered
    
    ### 6.1 Edge Cases Handled
    
    #### Edge Case 1: [Name]
    - **Discovered**: [When/how discovered]
    - **Scenario**: [Description of edge case]
    - **Solution**: [How it was handled]
    - **Test**: [`file.ts:LXX`](path/to/test)
    - **Commit**: [`abc123`](commit-url)
    
    *(Repeat for each edge case)*
    
    ### 6.2 Spec-Kit Process Improvements Made
    
    #### Improvement 1: [Title]
    - **Date**: [YYYY-MM-DD]
    - **Problem**: [Issue description]
    - **Fix**: [What was changed]
    - **Impact**: [Benefit for future features]
    - **Files**: [List of files modified]
    - **Commit**: [`abc123`](commit-url)
    
    *(Repeat for each improvement)*
    
    ### 6.3 Tooling Enhancements
    
    | Tool/Script | Problem Fixed | Impact | Reference |
    |-------------|---------------|--------|-----------|
    | [script name] | [issue] | [benefit] | [`file`](path) |
    
    ---
    
    ## 7. Comparative Analysis
    
    ### Without Spec-Kit (Traditional Waterfall)
    
    **Challenges**:
    - ❌ Requirements gathering: 4-6 hours + meeting scheduling delays
    - ❌ Spec writing: 3-4 hours manual documentation
    - ❌ Missing requirements discovered during code review (late, expensive)
    - ❌ Plan changes require doc rewrites (high friction)
    - ❌ Limited traceability (AC → Code mapping is manual)
    - ❌ PR descriptions often incomplete or rushed
    - ❌ Constitution compliance checked post-hoc (if at all)
    
    **Timeline**:
    ```
    Day 1: Requirements meeting (2 hrs) + followup emails
    Day 2: Write spec doc (3 hrs)
    Day 3: Review spec, clarify (2 hrs)
    Day 4: Create tasks (2 hrs)
    Day 5: Start coding
    ─────────────────────────
    5 days before coding starts
    ```
    
    ### With Spec-Kit
    
    **Benefits**:
    - ✅ Requirements extraction: 5 min (automated from Jira)
    - ✅ Spec generation: 5 min (with guided clarifications)
    - ✅ Missing requirements surfaced upfront (clarify phase)
    - ✅ Plan regenerated instantly if spec changes
    - ✅ Complete traceability (AC → Test → Code → PR)
    - ✅ PR descriptions comprehensive and auto-generated
    - ✅ Constitution compliance enforced before coding
    
    **Timeline**:
    ```
    Hour 1: /speckit.specify + /speckit.clarify (15 min)
             /speckit.plan + /speckit.tasks (15 min)
             /speckit.analyze (5 min)
             Human review (25 min)
    Hour 2: Start coding
    ─────────────────────────
    1 hour before coding starts
    ```
    
    ### Decision Velocity
    
    | Decision Type | Traditional | Spec-Kit | Speedup |
    |---------------|-------------|----------|---------|
    | Clarify requirement | Schedule meeting (24-48 hrs) | Ask AI (2 min) | 720-1440x |
    | Update spec | Manual edit + review (2-4 hrs) | Regenerate (5 min) | 24-48x |
    | Check compliance | Manual review (1-2 hrs) | Auto-analyze (4 min) | 15-30x |
    | Create tasks | Manual breakdown (2-3 hrs) | Auto-generate (6 min) | 20-30x |
    
    ---
    
    ## 8. Recommendations for Leadership
    
    ### Adoption Criteria
    
    **Adopt Spec-Kit Globally If:**
    - ✅ Teams use Jira for feature tracking (automatic import)
    - ✅ Multiple features/epics per sprint (high planning overhead)
    - ✅ Constitution/quality gates exist (or need to be established)
    - ✅ Code review time is a bottleneck (comprehensive PR descriptions help)
    - ✅ Knowledge sharing is important (specs document tribal knowledge)
    - ✅ Teams suffer from "spec drift" (spec → code divergence)
    
    **Red Flags (When NOT to Adopt)**:
    - ❌ Extremely small team (<3 engineers) with very few features
    - ❌ No Jira or issue tracking (manual input required)
    - ❌ Team opposed to AI assistance (cultural resistance)
    
    ### Pilot Program Success Criteria
    
    For a 3-month pilot with 1-2 teams:
    
    | Metric | Target | How to Measure |
    |--------|--------|----------------|
    | Time savings | ≥50% reduction in pre-coding planning | Compare time logs before/after |
    | AC coverage | ≥90% ACs in generated specs | Audit 10 random specs |
    | Constitution compliance | Zero critical violations post-implementation | Review analyze phase reports |
    | Developer satisfaction | ≥4/5 on "would use again" survey | Anonymous survey |
    | Adoption rate | ≥80% of features use Spec-Kit | Track /speckit.* command usage |
    
    ### Estimated Global Impact
    
    **Assumptions**:
    - 10 teams
    - 20 features per team per year
    - Average feature: medium complexity
    
    **Annual Savings**:
    ```
    Time Saved:
    • 11-16 hours/feature × 200 features/year
    • = 2,200-3,200 hours/year
    
    Cost Savings:
    • 2,200-3,200 hrs × $150/hr loaded cost
    • = $330,000 - $480,000/year
    
    AI Costs:
    • 200 features × $25 avg/feature
    • = ~$5,000/year
    
    ────────────────────────────────────
    Net Savings: $325,000 - $475,000/year
    ROI: 65-95x
    Payback Period: < 1 week
    ```
    
    ### Implementation Plan
    
    **Phase 1: Pilot** (Month 1-3)
    - Select 2 teams with high feature velocity
    - Provide training (2-hour workshop)
    - Designate Spec-Kit champions
    - Collect metrics weekly
    
    **Phase 2: Expansion** (Month 4-6)
    - Onboard 4 more teams
    - Share pilot learnings
    - Establish best practices doc
    - Continue metrics collection
    
    **Phase 3: Organization-Wide** (Month 7+)
    - Roll out to all teams
    - Make Spec-Kit default workflow
    - Integrate into onboarding
    - Quarterly metrics review
    
    ### Risk Mitigation
    
    | Risk | Mitigation |
    |------|------------|
    | AI generates incorrect specs | Human review required (already in workflow) |
    | Over-reliance on AI | Constitution ensures quality gates |
    | Token costs scale unexpectedly | Monitor usage, set budgets per team |
    | Resistance to change | Show metrics from pilot, make optional initially |
    
    ---
    
    ## 9. Appendix
    
    ### A. File Inventory
    
    **Spec Artifacts**:
    - `spec.md` - [size] KB, [lines] lines
    - `plan.md` - [size] KB, [lines] lines
    - `tasks.md` - [size] KB, [X] tasks
    - `data-model.md` - [size] KB, [X] tables
    - `.checkpoint.json` - [size] KB
    - `PR_DESCRIPTION.md` - [size] KB
    
    **Implementation Files**:
    *(List of all files created/modified with sizes)*
    
    ### B. Git History
    
    **Commits** ([count] total):
    ```
    [commit-hash] [date] - [message]
    [commit-hash] [date] - [message]
    ...
    ```
    
    **First commit**: [hash] ([date])  
    **Last commit**: [hash] ([date])  
    **Checkpoint commits**: [count]  
    
    ### C. Test Results
    
    **Test Coverage**:
    - Unit tests: [X]% coverage
    - Integration tests: [X]% coverage
    - E2E tests: [X]% coverage
    - Overall: [X]% coverage
    
    **Test Commands**:
    ```bash
    npm run test          # All tests
    npm run test:cov      # With coverage
    npm run test:e2e      # Integration tests
    ```
    
    ### D. References
    
    - **Jira Ticket**: [link]
    - **Spec Directory**: [`specs/NNN-feature/`](./specs/NNN-feature/)
    - **Git Branch**: `feature/[branch-name]`
    - **Pull Request**: [PR link] (if merged)
    - **Related Epics**: [links]
    
    ---
    
    **Report Generated**: [timestamp]  
    **Spec-Kit Version**: [version]  
    **Repository**: [repo-name]
    ```

12. **Validate report completeness**:

    **Check all sections have data**:
    - ✅ Executive Summary populated
    - ✅ Timeline has dates
    - ✅ Metrics calculated (time, cost, tokens)
    - ✅ AC table has evidence links
    - ✅ Blockers documented
    - ✅ Improvements listed
    - ✅ All claims have references (file paths, commits, line numbers)

    **If any section is empty**, note:
    ```
    ⚠️  [Section] incomplete - [reason]
    Example: "Phase 1: Clarify" - No clarifications found in spec.md
    ```

13. **Save report and show summary**:

    **Write to file**: `$FEATURE_DIR/[JIRA-ID]-IMPLEMENTATION-REPORT.md`

    **Show user**:
    ```
    ✅ IMPLEMENTATION REPORT GENERATED
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    📊 Report saved to:
       specs/[NNN]-[feature]/[JIRA-ID]-IMPLEMENTATION-REPORT.md
    
    📈 METRICS SUMMARY:
    • Time Saved: [11-16] hours (73-88% reduction)
    • AI Cost: $[XX.XX]
    • ROI: [700-900]x
    • ACs Met: [X]/[Total] ([percentage]%)
    • Test Coverage: [X]%
    • Files Created: [X]
    • Issues Prevented: [X]
    
    🎯 NEXT STEPS:
    1. Review report for accuracy
    2. Share with leadership (metrics are ready)
    3. Use for retrospective/process improvement
    4. Archive for future reference
    
    📎 QUICK LINKS:
    • Spec: specs/[NNN]-[feature]/spec.md
    • Jira: [JIRA-URL]
    • Git History: git log --grep="[JIRA-ID]"
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ```

---

## Behavior Rules

- **Verifiable Claims Only**: Every metric, timeline, file count must be backed by actual data (file paths, commits, line numbers)
- **Missing Data Handling**: If checkpoint missing, reconstruct from git history + tasks.md
- **Token Estimation**: Use actual counts if available; otherwise estimate from file sizes
- **Cost Accuracy**: Use current Claude Sonnet 4.5 pricing ($3/M input, $15/M output)
- **AC Evidence**: Search tests first (strongest evidence), then source code, then comments
- **Blocker Documentation**: Extract from commits, spec clarifications, troubleshooting docs
- **ROI Calculation**: Be conservative with time savings (use lower bound), transparent with assumptions
- **Chart Generation**: Use ASCII tables/charts for clarity
- **Leadership Focus**: Emphasize measurable outcomes (time, cost, quality) over process details
- **Honesty**: If data unavailable, state clearly and provide estimate methodology

---

## Edge Cases

### EC-1: Implementation In Progress

If checkpoint shows `current_phase != "Complete"`:
```
⚠️  IMPLEMENTATION IN PROGRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Phase: [phase-name]
Tasks Completed: [X]/[Total] ([percentage]%)

Generate report with current progress? (yes/no)
```

If yes, generate report noting "🚧 In Progress" status throughout.

### EC-2: No Checkpoint File

If `.checkpoint.json` missing:
- Reconstruct timeline from git commits
- Parse tasks.md for completion status
- Extract files from git diff against main branch
- Note: "Checkpoint unavailable - metrics reconstructed from git history"

### EC-3: No Jira Integration

If spec.md has no Jira ID:
- Use feature directory name for report filename
- Skip Jira-specific sections
- Note: "Manual spec creation (no Jira ticket)"

### EC-4: Multiple Implementations

If spec has multiple feature branches (parallel work):
```
⚠️  MULTIPLE IMPLEMENTATIONS DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Branch 1: feature/PROJ-1367-main (merged 2026-01-15)
Branch 2: feature/PROJ-1367-hotfix (merged 2026-01-17)

Which implementation should I report on? (1/2/both)
```

---

**Note**: This command generates a **leadership-ready** report with verifiable metrics. All claims about time savings, costs, and ROI are based on conservative estimates and backed by actual implementation data.
