---
description: Patch an existing feature with bug fixes or minor enhancements (<2 hours), automatically updating documentation and context.
---

# Spec-Kit Patch Prompt

**Command**: `/speckit.patch <spec-id> "<patch description>"`

**Purpose**: Automate documentation and optional implementation of small bug fixes or minor enhancements to existing features.

---

## 📋 What This Command Does

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md#evolving-existing-features)):
- **Standard approach**: Manually add "Patches" section to `plan.md`, implement fix, document PR number
- **This automation**: Handles documentation automatically + optionally delegates to `/speckit.implement`

**This command will**:
1. **Validate** the patch is appropriate (< 2 hours, existing spec)
2. **Document** the patch in `plan.md` (structured format)
3. **Update context** (specs/README.md, all-specs.md, copilot-instructions.md)
4. **Optionally implement** by creating minimal tasks and running standard `/speckit.implement` workflow

**Why use this instead of manual approach?**
- ✅ Ensures consistent patch documentation format
- ✅ Automatically updates all context files
- ✅ Tracks version history in spec.md
- ✅ Optionally handles implementation via standard workflow

**When to Use**:
- Bug fixes < 2 hours implementation time
- Minor enhancements that don't change core functionality
- Hot fixes that need proper documentation

**When NOT to Use**:
- New capabilities → Use `/speckit.specify "Add [feature]"` instead
- Major revisions → Version the spec (spec-v2.md)
- Changes > 2 hours → Use `/speckit.specify "Fix [issue]"` (creates focused spec)

---

## Phase 0: Validation

> **What's Happening**: Checking if this patch is appropriate for the quick-fix workflow vs full Spec-Kit cycle.

### Step 1: Parse Arguments

Extract spec ID and patch description from command:
```
/speckit.patch 002-guest-settings "Fix race condition in audio preload"
                ^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                SPEC_ID          PATCH_DESCRIPTION
```

**Required**:
- SPEC_ID must exist in `specs/` directory
- PATCH_DESCRIPTION must be clear and specific

┌─────────────────────────────────────────────────────────────┐
│ 📋 PATCH SCOPE ASSESSMENT                                   │
├─────────────────────────────────────────────────────────────┤
│ Spec: specs/$SPEC_ID                                        │
│ Description: "$PATCH_DESCRIPTION"                           │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Determining if this is a quick fix (< 2 hours)            │
│ • Or if it requires full Spec-Kit workflow (new spec)       │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • Quick fixes: Simple patch documentation in plan.md        │
│ • Large changes: Need full spec/plan/tasks for quality      │
├─────────────────────────────────────────────────────────────┤
│ DECISION GUIDE:                                             │
│ ✅ Use /speckit.patch for:                                  │
│    • Bug fixes < 2 hours                                    │
│    • Minor tweaks to existing behavior                      │
│    • Hot fixes with proper documentation                    │
│                                                              │
│ ⚠️  Use /speckit.specify instead for:                       │
│    • New capabilities or features                           │
│    • Major architectural changes                            │
│    • Fixes requiring > 2 hours                              │
└─────────────────────────────────────────────────────────────┘

**Estimated Implementation Time**: [Ask user: "< 30 min", "< 1 hour", "< 2 hours", "> 2 hours"]
```

**If "> 2 hours"**:
```markdown
⚠️  RECOMMENDATION: This change is too large for a quick patch.

**Why**: Spec-Kit standards require full specification workflow for changes > 2 hours
**What to do instead**:
  
  /speckit.specify "Fix [$PATCH_DESCRIPTION] in $SPEC_ID"
  
This will:
  1. Create new focused spec (specs/[next-number]-[description]/)
  2. Reference original spec as dependency
  3. Generate full plan/tasks for quality assurance
  4. Keep specs small and maintainable
> **What's Happening**: Creating structured patch documentation in `plan.md`  
> **Why**: Maintains change history, enables auditing, follows Spec-Kit standards  
> **Where**: `specs/$SPEC_ID/plan.md` (Patches section)

### Step 1: Generate Patch Entry

**Show user**:
```
🔧 PHASE 1: DOCUMENTING PATCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creating patch entry in plan.md...
```
**Still want to proceed with patch?** (yes/no)
```

**If "< 2 hours"**:
```markdown
✅ PROCEEDING WITH PATCH WORKFLOW

**What happens next**:
  Phase 1: Document patch in plan.md (structured format)
  Phase 2: Update context files (specs/README.md, all-specs.md, etc.)
  Phase 3: Optional implementation (you'll be asked)
  Phase 4: Validation & report
```

If user confirms
```

### Step 2: Assess Patch Scope

**Present to user**:
```markdown
## Patch Scope Assessment

**Spec**: specs/$SPEC_ID
**Description**: "$PATCH_DESCRIPTION"

**Guidelines**:
- ✅ Use /speckit.patch for: Bug fixes < 2 hours, minor tweaks
- ⚠️  Consider new spec for: New capabilities, major changes, > 2 hours

**Estimated Implementation Time**: [Ask user: "< 30 min", "< 1 hour", "< 2 hours", "> 2 hours"]

If "> 2 hours": Recommend creating new focused spec instead:
  → /speckit.specify "Fix [$PATCH_DESCRIPTION] in $SPEC_ID"
```

If user confirms patch is appropriate, proceed to Phase 1.

---

## Phase 1: Create Patch Documentation

### Step 1: Generate Patch Entry

**Template**:
```markdown
### Patch YYYY-MM-DD: [Brief Title]
**Issue**: [What was wrong or missing]
**Solution**: [How it's being fixed]
**Files**: [List of files modified with line ranges if known]
**Constitution Check**: [Any relevant principles - PII, retry logic, etc.]
**Show user**:
```
📝 Updating version history in spec.md...
```

**PR**: [PR number - leave blank, fill after implementation]
**Implemented**: [Date - leave blank, fill after implementation]
```

**Fill in**:
- Date: Use current date (2026-01-13)
- Title: Extract from PATCH_DESCRIPTION (concise, 3-7 words)
- Issue: Expand description into problem statement
- Solution: Ask user or infer from description
- Files: Ask user which files will be modified
- Constitution Check: Analyze if patch affects PII, observability, contracts, etc.

**Example Output**:
```markdown
### Patch 2026-01-13: Fix audio preload race condition
**Issue**: Audio element preloads before track metadata loads, causing playback errors
**Solution**: Add `loadedmetadata` event listener before setting `src` attribute
**Files**: `src/hooks/useAudio.ts` (lines 45-52)
**Constitution Check**: ✅ No PII, observability, or contract violations
**PR**: _[To be filled]_
**Implemented**: _[To be filled]_
**Show completion**:
```
✅ Phase 1 Complete: Patch Documented

**Files Updated**:
• specs/$SPEC_ID/plan.md (Patches section added/updated)
• specs/$SPEC_ID/spec.md (Change History updated)

**Version**: $OLD_VERSION → $NEW_VERSION (patch increment)
```

---

## Phase 2: Update Context Files

> **What's Happening**: Synchronizing all context files so AI assistants know about this change  
> **Why**: Keeps .specify/workspace/, specs/README.md, and copilot-instructions.md current  
> **Impact**: GitHub Copilot will be aware of this patch in future interactions

**Show user**:
```
📚 PHASE 2: UPDATING CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Synchronizing context files...
```

### Step 2: Update plan.md

**Read existing plan.md**:
```bash
# Check if Patches section exists
if grep -q "## Patches" "specs/$SPEC_ID/plan.md"; then
    PATCHES_EXIST=true
else
    PATCHES_EXIST=false
fi
```

**If Patches section exists**:
- Append new patch entry at the TOP of the Patches section (most recent first)

**If Patches section does NOT exist**:
- Add new section at END of plan.md, before any "Appendices" or "Notes" sections

**Implementation**:
```markdown
## Patches

_Small bug fixes and minor enhancements applied after initial implementation. For major changes, create a new spec._

[NEW PATCH ENTRY HERE]

[EXISTING PATCHES...]
```

### Step 3: Update Patch History Table

**Check if "Change History" section exists in spec.md**:
**Show completion**:
```
✅ Phase 2 Complete: Context Synchronized

**Files Updated**:
• specs/README.md (version updated)
• .specify/workspace/all-specs.md (if monorepo)
• .github/copilot-instructions.md (recent changes noted)

**Impact**: All AI assistants now aware of this patch
```

---

## Phase 3: Implementation (Optional)

> **What's Happening**: Asking if you want automatic implementation  
> **Why**: You can document now, implement later OR let AI implement immediately  
> **How**: If yes, this delegates to standard `/speckit.implement` workflow with minimal tasks

**Ask user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🤔 IMPLEMENTATION DECISION                                  │
├─────────────────────────────────────────────────────────────┤
│ ✅ Patch documentation complete!                            │
│                                                              │
│ WHAT'S BEEN DONE:                                           │
│ • Patch documented in specs/$SPEC_ID/plan.md                │
│ • Version history updated in spec.md                        │
│ • Context files synchronized                                │
│ • All changes committed to documentation                    │
│                                                              │
│ WHAT HAPPENS NEXT (Your Choice):                            │
│                                                              │
│ Option A: IMPLEMENT NOW (Automated)                         │
│   → Creates minimal tasks (3-8 tasks)                       │
│   → Runs standard /speckit.implement workflow               │
│   → Updates patch entry with PR number after completion     │
│   → Estimated time: [based on earlier assessment]           │
│                                                              │
│ Option B: IMPLEMENT MANUALLY LATER                          │
│   → You implement the fix yourself                          │
│   → You create PR with "Patch: [title]" format             │
│   → You update plan.md with PR number after merge           │
│   → Full guidance provided below                            │
└─────────────────────────────────────────────────────────────┘

**Would you like me to implement this patch now?** (yes/no)
- Patches: Increment PATCH (1.0.0 → 1.0.1 → 1.0.2)
- Minor enhancements: Increment MINOR (1.0.0 → 1.1.0)
- Breaking changes: MAJOR version (create new spec instead)

---

## Phase 2: Update Context Files

### Step 1: Update specs/README.md (Repository-Level)

**Read existing specs/README.md**:
```bash
# Find the spec's entry
grep -n "^- \[.*\](.*/$SPEC_ID/)" specs/README.md
```

**Update entry** to reflect patch (if not already versioned):
```how user**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️  AUTOMATED IMPLEMENTATION STARTING                       │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Creating minimal task breakdown (3-8 tasks)               │
│ • Delegating to standard /speckit.implement workflow        │
│ • Following same quality gates as full features             │
│                                                              │
│ WHY THIS APPROACH:                                          │
│ • Ensures constitution compliance (PII, contracts, tests)   │
│ • Maintains task tracking for auditing                      │
│ • Uses proven implementation workflow                       │
│ • You'll see each task execute in real-time                 │
│                                                              │
│ WHAT YOU'LL SEE:                                            │
│ 1. Task breakdown (3-8 tasks)                               │
│ 2. Standard /speckit.implement execution                    │
│ 3. Progress updates as tasks complete                       │
│ 4. Final validation report                                  │
└─────────────────────────────────────────────────────────────┘
```

**Step 1: Create Implementation Tasks**

**Show user**:
```
📝 Creating minimal task breakdown...
```

Generate minimal task list (3-8 tasks) and save to temporary variable (NOT to tasks.md file):
```markdown
## Patch Implementation Tasks (Temporary - for /speckit.implement)

- [ ] P1: Read current implementation in [file]
- Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 MANUAL IMPLEMENTATION GUIDANCE                           │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S BEEN DONE:                                           │
│ ✅ Patch documented in specs/$SPEC_ID/plan.md              │
│ ✅ Version history updated in spec.md                       │
│ ✅ Context files synchronized                               │
│                                                              │
│ WHAT YOU NEED TO DO:                                        │
│                                                              │
│ Step 1: IMPLEMENT THE FIX                                   │
│   Files to modify:                                          │
│   • [List files from patch entry]                           │
│                                                              │
│   Changes needed:                                           │
│   • [Solution from patch entry]                             │
│                                                              │
│ Step 2: WRITE/UPDATE TESTS                                  │
│   Test scenario:                                            │
│   • Verify: [specific test for the fix]                     │
│   • Regression: [ensure existing functionality works]       │
│                                                              │
│ Step 3: VERIFY CONSTITUTION COMPLIANCE                      │
│   [List relevant principles from patch Constitution Check]  │
│   • No PII in logs                                          │
│   • Observability maintained (x-trace-id headers)           │
│   • Contract compliance (if API changed)                    │
│                                                              │
│ Step 4: CREATE PULL REQUEST                                 │
│   PR title format:                                          │
│   → "Patch: [patch title from plan.md]"                     │
│                                                              │
---

## Phase 4: Validation & Reporting

> **What's Happening**: Final validation and comprehensive report  
> **Why**: Ensures all documentation complete and constitution compliant  
> **Output**: Detailed summary of what was done and next steps

**Show user**:
```
🔍 PHASE 4: VALIDATION & REPORTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running final validation checks...
```                            │
│   → Link to specs/$SPEC_ID/plan.md (Patches section)        │
│   → Reference to patch entry                                │
│   → Constitution compliance confirmation                    │
│                                                              │
│ Step 5: UPDATE DOCUMENTATION AFTER MERGE                    │
│   Edit specs/$SPEC_ID/plan.md:                              │
│   → Update "PR:" field with PR number                       │
│   → Update "Implemented:" field with merge date             │
│                                                              │
│ WHY THESE STEPS:                                            │
│ • Maintains traceability (PR → patch → spec)                │
│ • Ensures quality gates (tests, constitution)               │
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ✅ PATCH APPLIED SUCCESSFULLY                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📋 SUMMARY
──────────────────────────────────────────────────────────────
Spec:         specs/$SPEC_ID
Patch:        [Patch Title]
Version:      $OLD_VERSION → $NEW_VERSION
Date:         [Today's date]
Status:       [✅ Implemented | 📝 Documentation Only]

📝 DOCUMENTATION UPDATED
──────────────────────────────────────────────────────────────
✅ specs/$SPEC_ID/plan.md (Patches section)
   • Structured patch entry created
   • Issue, solution, files documented
   • Constitution check performed

✅ specs/$SPEC_ID/spec.md (Change History)
   • Version incremented: $OLD_VERSION → $NEW_VERSION
   • Change logged in history table

✅ specs/README.md (Repository index)
   • Version info updated
   • Patch count added

✅ .specify/workspace/all-specs.md [if monorepo]
   • Workspace context synchronized
   • Patch reflected in global index

✅ .github/copilot-instructions.md
   • Recent changes noted
   • AI assistants now aware of patch

⚙️  IMPLEMENTATION STATUS
──────────────────────────────────────────────────────────────
[If implemented:]
✅ IMPLEMENTATION COMPLETE

**What was done**:
• Created minimal task breakdown (3-8 tasks)
• Executed via standard /speckit.implement workflow
• All tasks completed and validated
• Tests passing, linting clean
• Constitution compliance verified

**Code changes**:
• Files modified: [list from patch]
• Tests added/updated: [test files]
• No constitution violations introduced

**Patch entry updated**:
• PR: #[number]
• Implemented: [date]

[If documentation only:]
📝 DOCUMENTATION ONLY

**What was done**:
• Patch documented in plan.md
• Context files synchronized
• Implementation guidance provided

**What you need to do**:
• Implement fix in: [files from patch]
• Write/update tests
• Create PR: "Patch: [patch title]"
• Update plan.md with PR number after merge

🎯 NEXT STEPS
──────────────────────────────────────────────────────────────
[If implemented:]
  1. Review the changes:
     → Check modified files listed above
     → Verify tests are passing
     → Confirm no unintended side effects

  2. Create Pull Request:
     → Title: "Patch: [patch title]"
     → Description: Link to specs/$SPEC_ID/plan.md (Patches section)
     → Include: Constitution compliance confirmation

  3. Update documentation after merge:
     → Edit specs/$SPEC_ID/plan.md
     → Fill in PR number in patch entry
     → Commit documentation update

  4. Request code review from team

[If documentation only:]
  1. Implement the fix:
     → Follow guidance in "Implementation Guidance" above
     → Modify files: [list from patch]
     → Verify constitution compliance

  2. Write/update tests:
     → Test the specific fix
     → Add regression tests
     → Ensure coverage maintained

  3. Create Pull Request:
     → Title: "Patch: [patch title]"
     → Link to specs/$SPEC_ID/plan.md

  4. After PR merged:
     → Update specs/$SPEC_ID/plan.md
     → Fill in PR: #[number]
     → Fill in Implemented: [date]

📚 REFERENCE
──────────────────────────────────────────────────────────────
• Patch documentation: specs/$SPEC_ID/plan.md (Patches section)
• Spec-Kit guide: SPECKIT.md#evolving-existing-features
• Constitution: .specify/memory/constitution.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 DELEGATING TO /speckit.implement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Why we use /speckit.implement**:
This is the standard Spec-Kit implementation workflow that:
• Loads full context (spec.md, plan.md, patch entry)
• Executes tasks sequentially with validation
• Runs tests after each change
• Verifies constitution compliance
• Marks tasks as completed
• Provides detailed progress tracking

**You'll see the same workflow as any feature implementation below.**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Execute standard `/speckit.implement` workflow**:
1. Load context:
   - specs/$SPEC_ID/spec.md
   - specs/$SPEC_ID/plan.md (including new patch entry)
   - specs/$SPEC_ID/contracts/ (if exists)
   - .specify/memory/constitution.md
2. Execute tasks from temporary task list (NOT from tasks.md)
3. Mark completed tasks in output (show user progress)
4. Validate after each task:
   - Tests pass
   - Linting clean
   - Type checks pass
   - Constitution compliance maintained
5. Show detailed progress as tasks complete

**Step 3: Update Patch Entry**

After successful implementation:

**Show user**:
```
✅ Implementation Complete - Updating Documentation
```

Update patch entry in plan.mdx.json` (metadata)

**If standalone repo**:
- Skip this step

### Step 3: Update .github/copilot-instructions.md

**Add patch note** to relevant section (if exists):
```markdown
## Recent Changes

- 2026-01-13: Patched 002-guest-settings - Fix audio preload race condition
```

**Or update existing feature description**:
```markdown
## Features Implemented

- **002-guest-settings** (v1.0.1): Guest settings management
  - Patches: 1 applied (audio preload fix)
```

---

## Phase 3: Implementation (Optional)

**Ask user**:
```
✅ Patch documentation created successfully!

**Files updated**:
- specs/$SPEC_ID/plan.md (Patches section)
- specs/$SPEC_ID/spec.md (Change History)
- specs/README.md (version info)
- .specify/workspace/all-specs.md (if monorepo)
- .github/copilot-instructions.md (recent changes)

**Would you like me to implement this patch now?** (yes/no)

If yes:
  → Proceed to implementation
If no:
  → Provide implementation guidance and exit
```

### If User Chooses "Yes" (Implement Now)

**Step 1: Create Implementation Tasks**

Generate minimal task list (3-8 tasks):
```markdown
## Patch Implementation Tasks

- [ ] P1: Read current implementation in [file]
- [ ] P2: Implement fix: [specific change]
- [ ] P3: Update tests to cover race condition
- [ ] P4: Verify constitution compliance (no new violations)
- [ ] P5: Update PR number in plan.md after creating PR
```

**Step 2: Execute Tasks**

Follow same pattern as `/speckit.implement`:
1. Load context (spec.md, plan.md, patch entry)
2. Execute tasks sequentially
3. Mark completed tasks
4. Validate after each task (tests pass, linting, type checks)

**Step 3: Update Patch Entry**

After successful implementation:
```markdown
### Patch 2026-01-13: Fix audio preload race condition
**Issue**: Audio element preloads before track metadata loads, causing playback errors
**Solution**: Add `loadedmetadata` event listener before setting `src` attribute
**Files**: `src/hooks/useAudio.ts` (lines 45-52)
**Constitution Check**: ✅ No PII, observability, or contract violations
**PR**: #456  ← FILLED IN
**Implemented**: 2026-01-13  ← FILLED IN
```

### If User Chooses "No" (Documentation Only)

**Provide guidance**:
```markdown
## Implementation Guidance

**Patch documented in**: specs/$SPEC_ID/plan.md

**Next steps**:
1. Implement fix in: [files listed in patch]
2. Write/update tests to cover the issue
3. Create PR with title: "Patch: [patch title]"
4. Link PR in specs/$SPEC_ID/plan.md (update "PR:" field)
5. After merge, update "Implemented:" field with date

**Constitution checks**:
[List any relevant principles to verify during implementation]

**Testing guidance**:
- Verify: [specific test scenario for the fix]
- Regression: [ensure existing functionality still works]
```

---

## Phase 4: Validation & Reporting

### Step 1: Validate Patch Documentation

**Check completeness**:
```bash
# Verify patch entry exists in plan.md
grep -A 10 "## Patches" "specs/$SPEC_ID/plan.md"

# Verify Change History updated in spec.md
grep -A 5 "## Change History" "specs/$SPEC_ID/spec.md"

# Verify context files updated
grep "$SPEC_ID" specs/README.md
```

**Constitution Check**:
- [ ] No PII introduced in logging/error messages
- [ ] Observability maintained (x-trace-id, audit logging)
- [ ] Contract compliance (if API changes, update contract first)
- [ ] No new database retries without justification

### Step 2: Generate Report

**Success Report**:
```markdown
✅ Patch Applied Successfully!

**Spec**: specs/$SPEC_ID
**Patch**: [Patch Title]
**Version**: [New version, e.g., 1.0.1]

**Documentation Updated**:
- ✅ specs/$SPEC_ID/plan.md (Patches section)
- ✅ specs/$SPEC_ID/spec.md (Change History)
- ✅ specs/README.md (version info)
- ✅ .specify/workspace/all-specs.md (if monorepo)
- ✅ .github/copilot-instructions.md

**Implementation Status**: [Implemented / Documentation Only]

**Next Steps**:
[If implemented:]
  1. Review changes and test thoroughly
  2. Create PR: "Patch: [patch title]"
  3. Update PR number in specs/$SPEC_ID/plan.md
  4. Request code review

[If documentation only:]
  1. Implement fix in files listed in patch
  2. Create PR: "Patch: [patch title]"
  3. Update PR number and Implemented date in plan.md after merge
```

**Error Handling**:
- If spec not found → List available specs
- If plan.md missing → Suggest creating with /speckit.plan
- If scope too large → Recommend new spec approach
- If constitution violation → STOP and report issue

---

## Constitution Compliance

**This prompt enforces**:
- ✅ Documentation discipline (patches properly recorded)
- ✅ Version tracking (semantic versioning for patches)
- ✅ Constitution check (verify no new violations)
- ✅ Context synchronization (all context files updated)

**Patches MUST NOT**:
- ❌ Introduce PII in logs
- ❌ Break existing contracts
- ❌ Skip constitution validation
- ❌ Bypass testing requirements

---

## Example Usage

**Scenario 1: Quick bug fix**
```bash
/speckit.patch 002-guest-settings "Fix null pointer in audio cleanup"

# User prompted:
Estimated implementation time: "< 30 min"

# Result:
✅ Patch documented in plan.md
✅ Context updated
✅ Implementation completed
✅ Version: 1.0.1
```

**Scenario 2: Documentation-only patch**
```bash
/speckit.patch 001-opcodes-api "Add caching to reduce DB load"

# User prompted:
Estimated implementation time: "< 2 hours"
Implement now? no

# Result:
✅ Patch documented with implementation guidance
✅ Context updated
📝 Ready for developer to implement
```

**Scenario 3: Scope too large**
```bash
/speckit.patch 003-notifications "Add SMS provider support"

# User prompted:
Estimated implementation time: "> 2 hours"

# Result:
⚠️  This change is too large for a patch.
Recommended approach:
  /speckit.specify "Add SMS provider support to notifications (depends on 003)"
```

---

## Integration with Other Commands

**Auto-triggered after**:
- Manual implementation of bug fixes

**Triggers**:
- `/speckit.context` (updates all context files)

**Related commands**:
- `/speckit.specify` (for larger changes)
- `/speckit.validate` (verify patch compliance)
- `/speckit.context` (refresh all context)

---

## Notes

- Patches preserve spec history (no overwriting original spec.md)
- Multiple patches accumulate in plan.md (chronological record)
- Version numbers follow semantic versioning (MAJOR.MINOR.PATCH)
- Constitution checks ensure patches don't introduce technical debt
- Context files stay synchronized automatically
