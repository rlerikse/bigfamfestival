---
description: Create or update the feature specification from a natural language feature description.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

**Supported Flags**:
- `--draft` - Preview spec before committing (no branch/file creation)
- `--update JIRA-ID-name` - Update existing spec instead of creating new
- `--figma <url>` - Include Figma design context in specification
- `--epic PROJ-XXX` - Link this story spec to a parent epic in the central context repo

**MANDATORY**: All specs require a Jira ticket ID (Constitution Section IX).

---

## 📋 What This Command Does

**Purpose**: Transform natural language feature description into structured Spec-Kit specification.

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md#the-spec-kit-workflow)):
- **Phase 0**: Specification creation (WHAT the feature does, WHY it's needed)
- **No implementation details**: Focus on user needs, not technical solutions
- **Outputs**: spec.md, requirements checklist, feature branch

**This command will**:
1. **Require Jira ticket** (Constitution Section IX - No Jira, No Spec)
2. **Create feature branch** (Jira-first naming, e.g., PROJ-1234-user-auth)
3. **Generate spec.md** (requirements, user stories, acceptance criteria)
4. **Validate quality** (completeness check, clarification questions if needed)
5. **Create checklist** (requirements validation checklist)

**Naming Convention** (Constitution Section IX):
- **Spec Directory**: `specs/{JIRA-ID}-{short-description}/`
- **Branch Name**: `{JIRA-ID}-{short-description}`
- **Examples**: `PROJ-2554-speckit-jira-integration`, `PROJ-43-guest-visibility-epic`
- **No Sequential Numbers**: Do NOT use `001-`, `002-`, etc. prefixes

**Draft Mode** (`--draft`):
- Generates spec in memory only
- Shows full preview before any changes
- User can edit/approve before committing
- No branch created, no files written

**Why use this?**
- ✅ Direct Jira traceability (click ticket → find spec instantly)
- ✅ Consistent specification structure across features
- ✅ No implementation details leak into requirements
- ✅ Independent user stories (MVP-first delivery)
- ✅ Quality validation before planning begins

**What happens next**: After spec complete, run `/speckit.plan` to generate implementation design.

---

## Outline

The text the user typed after `/speckit.specify` in the triggering message **is** the feature description OR Jira ticket ID. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

---

## Step 0: Input Validation (MUST RUN FIRST)

**Before any other step**, validate the input:

### 0.0 Check for Draft Mode

```bash
DRAFT_MODE=false
if [[ "$ARGUMENTS" == *"--draft"* ]]; then
  DRAFT_MODE=true
  ARGUMENTS="${ARGUMENTS//--draft/}"  # Remove flag from description
fi
```

**If draft mode enabled**, show:
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 DRAFT MODE ENABLED                                       │
├─────────────────────────────────────────────────────────────┤
│ Spec will be generated in preview mode:                     │
│ • No branch will be created                                 │
│ • No files will be written                                  │
│ • Full spec shown for review before committing              │
│                                                              │
│ You can edit the draft before finalizing.                   │
└─────────────────────────────────────────────────────────────┘
```

### 0.0a Check for Jira Ticket (MANDATORY - Constitution Section IX)

**CRITICAL**: All specs require a Jira ticket. This is non-negotiable.

```bash
# Check if input is a Jira ticket ID (e.g., PROJ-1234, ABC-999)
JIRA_TICKET=$(echo "$ARGUMENTS" | grep -oE '^[A-Z]+-[0-9]+$' || echo "")

# If not a direct Jira ID, check if --jira flag was used (legacy support)
if [ -z "$JIRA_TICKET" ]; then
  JIRA_TICKET=$(echo "$ARGUMENTS" | grep -oE '[A-Z]+-[0-9]+')
fi
```

**If no Jira ticket detected**, show error and STOP:
```
┌─────────────────────────────────────────────────────────────┐
│ ❌ ERROR: Jira ticket ID is required                        │
├─────────────────────────────────────────────────────────────┤
│ All specs require a Jira ticket (Constitution Section IX)  │
│                                                              │
│ Usage:                                                       │
│   /speckit.specify PROJ-1234                                  │
│   /speckit.specify PROJ-43                                    │
│                                                              │
│ Create a Jira ticket first, then run this command with     │
│ the ticket ID.                                              │
│                                                              │
│ Why? Every piece of work must trace to a documented        │
│ requirement for traceability, searchability, and audit.    │
└─────────────────────────────────────────────────────────────┘
```
**STOP HERE** - do not proceed without a valid Jira ticket.

### 0.0b Check for Update Mode

```bash
UPDATE_MODE=false
UPDATE_TARGET=""
if [[ "$ARGUMENTS" == *"--update "* ]]; then
  UPDATE_MODE=true
  # Extract the spec identifier (e.g., "PROJ-1234-user-auth")
  UPDATE_TARGET=$(echo "$ARGUMENTS" | grep -oE '\-\-update [A-Z]+-[0-9]+-[a-zA-Z0-9-]+' | sed 's/--update //')
  ARGUMENTS="${ARGUMENTS/--update $UPDATE_TARGET/}"  # Remove flag and target from description
fi
```

**If update mode enabled**:

1. **Verify spec exists**:
```bash
if [[ ! -d "specs/$UPDATE_TARGET" ]]; then
  echo "❌ Spec not found: specs/$UPDATE_TARGET"
  echo "Available specs:"
  ls -d specs/*/ 2>/dev/null | sed 's|specs/||g' | sed 's|/||g'
  exit 1
fi
```

2. **Show update mode banner**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 UPDATE MODE: [UPDATE_TARGET]                             │
├─────────────────────────────────────────────────────────────┤
│ Updating existing spec instead of creating new.             │
│                                                              │
│ Current spec: specs/[UPDATE_TARGET]/spec.md                 │
│ Amendment description: "[ARGUMENTS]"                        │
│                                                              │
│ UPDATE OPTIONS:                                             │
│ [1] Add requirements - Append new requirements to existing  │
│ [2] Modify section - Update specific section content        │
│ [3] Version bump - Create new version with full rewrite     │
│ [4] View diff - Show what changes would be made             │
│                                                              │
│ Enter choice [1/2/3/4]:                                     │
└─────────────────────────────────────────────────────────────┘
```

**If [1] Add requirements**:
- Read existing spec.md
- Parse amendment description into new requirements
- Append to relevant sections (User Scenarios, Functional Requirements)
- Add "Amendment" section with:
  - Date of amendment
  - Description of changes
  - Link to original requirements
- Update version (e.g., v1.0 → v1.1)

```
┌─────────────────────────────────────────────────────────────┐
│ ➕ ADDING REQUIREMENTS TO: [UPDATE_TARGET]                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ New requirements to add:                                    │
│ • [Parsed requirement 1]                                    │
│ • [Parsed requirement 2]                                    │
│                                                              │
│ Sections that will be modified:                             │
│ • User Scenarios & Testing (+[N] stories)                   │
│ • Functional Requirements (+[N] requirements)               │
│ • Success Criteria (+[N] criteria)                          │
│                                                              │
│ Proceed? [Y/n]:                                             │
└─────────────────────────────────────────────────────────────┘
```

**If [2] Modify section**:
```
Which section would you like to modify?

1. User Scenarios & Testing
2. Functional Requirements
3. Success Criteria
4. Out of Scope
5. Assumptions
6. Open Questions
7. Design Specifications (if present)
8. Related Resources (if present)

Enter section number:
```

- Show current section content
- Accept new/modified content
- Show diff before applying
- Apply changes with amendment note

**If [3] Version bump**:
- Create backup: `spec.md` → `spec.v1.md`
- Generate new spec.md with full rewrite incorporating amendments
- Link to previous version in "Version History" section

**If [4] View diff**:
- Show proposed changes as unified diff
- Return to option selection

**After successful update**:
```
┌─────────────────────────────────────────────────────────────┐
│ ✅ SPEC UPDATED: [UPDATE_TARGET]                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Changes made:                                               │
│ • Version: v1.0 → v1.1                                      │
│ • Added [N] new requirements                                │
│ • Modified [N] sections                                     │
│                                                              │
│ Amendment Log:                                              │
│ ──────────────────────────────────────────────────────────  │
│ ## Amendment 1 - [DATE]                                     │
│ [Brief description of changes]                              │
│                                                              │
│ Files modified:                                             │
│ • specs/[UPDATE_TARGET]/spec.md                             │
│                                                              │
│ NEXT STEPS:                                                 │
│ • Run /speckit.plan to update implementation plan           │
│ • Run /speckit.tasks to regenerate task list                │
│ • Run /speckit.analyze to validate changes                  │
└─────────────────────────────────────────────────────────────┘
```

**STOP** - do not proceed with new spec creation if update mode was used.

### 0.0c Check for Epic Link

```bash
PARENT_EPIC=""
if [[ "$ARGUMENTS" == *"--epic "* ]]; then
  # Extract the epic ID (e.g., "PROJ-43")
  PARENT_EPIC=$(echo "$ARGUMENTS" | grep -oE '\-\-epic [A-Z]+-[0-9]+' | sed 's/--epic //')
  ARGUMENTS="${ARGUMENTS/--epic $PARENT_EPIC/}"  # Remove flag from description
fi
```

**If epic link specified**, show confirmation:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 EPIC LINK: [PARENT_EPIC]                                 │
├─────────────────────────────────────────────────────────────┤
│ This story will be linked to parent epic in Jira.          │
│                                                              │
│ The following will be added to the story spec header:       │
│ **Epic**: [PARENT_EPIC]                                     │
│                                                              │
│ View epic status anytime with: /speckit.epic [PARENT_EPIC] │
└─────────────────────────────────────────────────────────────┘
```

**Store for use in spec generation** - the PARENT_EPIC variable will be used to:
1. Add `**Epic**: [PARENT_EPIC]` field to the story spec header

### 0.1 Check for Empty Input

If `$ARGUMENTS` is empty, blank, or contains only whitespace:

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ ERROR: No Jira ticket ID provided                        │
├─────────────────────────────────────────────────────────────┤
│ Usage: /speckit.specify <JIRA-ID>                           │
│                                                              │
│ Examples:                                                    │
│ • /speckit.specify PROJ-1234                                  │
│ • /speckit.specify PROJ-43                                    │
│ • /speckit.specify ABC-999                                   │
│                                                              │
│ All specs require a Jira ticket (Constitution Section IX)  │
│                                                              │
│ Create a Jira ticket first, then run this command with     │
│ the ticket ID. Spec-Kit will fetch all details from Jira.  │
└─────────────────────────────────────────────────────────────┘
```
**STOP HERE** - do not proceed.

### 0.2 Check for Valid Jira Ticket Format

If input doesn't match Jira ticket pattern (PROJECT-NUMBER):

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ ERROR: Invalid Jira ticket format                        │
├─────────────────────────────────────────────────────────────┤
│ Your input: "[user input]"                                  │
│                                                              │
│ Expected format: PROJECT-NUMBER                             │
│ Examples: PROJ-1234, PROJ-43, ABC-999                          │
│                                                              │
│ All specs require a Jira ticket (Constitution Section IX)  │
│                                                              │
│ Usage:                                                       │
│   /speckit.specify PROJ-1234                                  │
│   /speckit.specify PROJ-43                                    │
│                                                              │
│ Create a Jira ticket first if one doesn't exist.           │
└─────────────────────────────────────────────────────────────┘
```
**STOP HERE** - do not proceed without valid Jira ticket.

### 0.3 Jira Ticket Retrieval (MANDATORY)

All specs require Jira context. Fetch the ticket details:

```bash
JIRA_TICKET=$(echo "$ARGUMENTS" | grep -oE '[A-Z]+-[0-9]+')
# Use Atlassian MCP tools to fetch ticket - this is MANDATORY, not optional
```

**Step A: Retrieve Jira Ticket**

Use `mcp_atlassian` tools if available to fetch **COMPLETE** ticket details:

**CRITICAL: Jira Cloud ID and Custom Fields for FSR Project:**
- **Cloud ID**: `dea4cce7-df36-4b09-894b-8a0df849ecc1` (eriksensolutions.atlassian.net)
- **Acceptance Criteria Field**: `customfield_10039` (MANDATORY - always fetch this field)
- **Notes Field**: `customfield_10040`
- **Story Points Field**: `customfield_10041`

When calling `mcp_atlassian_atl_getJiraIssue`, always include these fields:
```
fields: ["summary", "description", "status", "issuetype", "priority", "assignee", "reporter", "labels", "components", "fixVersions", "created", "updated", "customfield_10039", "customfield_10040", "customfield_10041", "comment"]
```

**CRITICAL: For ALL issue types (Story, Bug, Task, Epic), extract these fields:**
- **Summary** - Use as feature title if user didn't provide one
- **Description** - MANDATORY: Full description text (this is PRIMARY requirements source)
- **Acceptance Criteria** - MANDATORY: Extract ALL acceptance criteria (see Step B for extraction methods)
- **Notes/Additional Notes** - Any custom notes fields
- **Comments** - ALL comments with timestamps and authors (for context and chronological understanding)
- **Issue Type** - Story, Bug, Task, Epic, Sub-task, etc.
- **Status** - Current workflow state
- **Priority** - Priority level
- **Assignee/Reporter** - Who owns it / who created it
- **Labels** - Tags for categorization
- **Components** - Affected components
- **Fix Version/Target Version** - Release planning info
- **Story Points/Estimation** - Complexity estimates
- **Figma Links** - Scan description, comments, and attachments for Figma URLs
- **File Attachments** - Screenshots, mockups, documents, diagrams
- **Custom Fields** - Any project-specific fields (e.g., `customfield_*`)
- **Created Date** - When ticket was created
- **Updated Date** - Last modification date

**If Epic: ALSO retrieve child issues recursively:**
- Get epic description, AC, notes, comments (as above)
- Fetch ALL child issues (stories, tasks, bugs, sub-tasks)
- For EACH child issue, extract the SAME complete field set:
  - Description
  - Acceptance Criteria
  - Notes
  - Comments (with dates)
  - All other fields listed above

**Step B: Parse Ticket Content - Comprehensive Extraction**

Extract structured information with **MANDATORY completeness**:

1. **Description Field** (PRIMARY SOURCE - DO NOT SKIP)
   - Extract the FULL description text from Jira
   - If description is empty, flag as warning but continue
   - Parse markdown/wiki formatting if present
   - Preserve structure (headings, lists, code blocks)
   - **This often contains critical context about what is/isn't in scope**

2. **Acceptance Criteria** (CRITICAL - MULTIPLE SOURCES)
   Extract from ALL of these locations (check all, merge results):
   - **FSR Custom AC field**: `customfield_10039` (PRIMARY SOURCE - ALWAYS check this first)
   - **Generic custom AC fields**: `customfield_10100`, `customfield_12345`, etc.
   - **Description section**: Look for "Acceptance Criteria" heading/section in description
   - **Description patterns**: Look for "AC:", "Given/When/Then", "Should...", "Must..." patterns
   - **Comments**: Search for AC added/clarified in comments (with dates for context)
   - **Notes field**: Check `customfield_10040` for additional AC or notes
   - Format: Preserve Given/When/Then structure if present, or use list format
   - **PRIORITY**: Jira acceptance criteria (especially `customfield_10039`) takes ABSOLUTE precedence over AI-generated criteria

3. **Notes/Additional Context**
   - Extract any "Notes", "Additional Notes", "Technical Notes" custom fields
   - These often contain implementation guidance or constraints

4. **Comments** (WITH TEMPORAL CONTEXT)
   - Extract ALL comments in chronological order
   - Include: Author, date/time, comment text
   - **Sort by date** to understand evolution of requirements
   - Flag latest comments as highest priority (recent clarifications)
   - Identify decision-making threads (where alternatives were discussed)
   - Look for phrases: "Actually...", "Correction:", "Update:", "Clarification:"

5. **Attachments & Links**
   - Figma Links - Extract for design retrieval (triggers Figma step)
   - Screenshots - Visual requirements
   - Mockups - UI/UX expectations
   - Documents - Detailed specs, PRDs, technical docs
   - Diagrams - Architecture, flows, data models

6. **Metadata**
   - Priority, story points, labels, components
   - Workflow status (to understand if requirements are stable)
   - Creation/update dates (to assess freshness)

**VALIDATION CHECK**: Before proceeding, verify:
- ✅ Description field was retrieved (even if empty)
- ✅ Acceptance Criteria was searched in ALL locations (field, description, comments)
- ✅ Comments were retrieved with dates
- ✅ If Epic: Child issues were fetched with FULL details for each
- ❌ If any CRITICAL field is missing, log warning but proceed with available data

**Step C: Handle Epic vs Story/Task/Bug**

**If issue type is Epic**:

```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 EPIC DETECTED: {JIRA_TICKET}                             │
├─────────────────────────────────────────────────────────────┤
│ Summary: [epic summary]                                     │
│ Type: Epic                                                  │
│ Status: [epic status]                                       │
│                                                              │
│ Epics contain multiple stories. Choose approach:           │
│                                                              │
│ OPTIONS:                                                    │
│ [1] Use Epic as umbrella spec (recommended for large work) │
│     → Creates high-level spec linking to child stories      │
│     → Lists all child issues for reference                  │
│     → Suitable for multi-sprint initiatives                │
│                                                              │
│ [2] Import specific child story instead                    │
│     → Shows list of child issues                            │
│     → You select which story to import                      │
│     → Creates detailed spec from that story                 │
│                                                              │
│ [3] Use Epic description directly (not recommended)         │
│     → Treats Epic like a Story                              │
│     → May lack detail for implementation                    │
│     → Only use if Epic has full acceptance criteria         │
│                                                              │
│ Enter choice [1/2/3]:                                       │
└─────────────────────────────────────────────────────────────┘
```

**If [1] Use Epic as umbrella spec**:
- Create spec using Epic description as high-level overview
- **IMPORTANT**: Extract Epic's FULL description, AC, notes, and comments first
- Add "Child Stories" section listing all child issues with:
  - Issue key, type, summary
  - Brief description excerpt (first 100 chars)
  - Status and assignee
  - Link to full Jira ticket
- Add note: "This is an umbrella specification. Create detailed specs for each child story."
- Include Epic-level success criteria from Epic's AC
- Auto-populate "Related Resources" with child story references
- **Extract out-of-scope items** from Epic description to prevent duplicate work

**If [2] Import specific child story**:
- Fetch ALL child issues using Jira API
- For EACH child, retrieve: Description, AC, Notes, Comments (full detail set)
- Display list with enhanced context:
  ```
  ┌─────────────────────────────────────────────────────────────┐
  │ 📋 CHILD ISSUES IN {EPIC_TICKET}                            │
  ├─────────────────────────────────────────────────────────────┤
  │ [1] PROJ-1235 (Story)   - User can login with email         │
  │     Status: To Do | Assignee: rerikse3@ford.com            │
  │     Description: Users should be able to authenticate...    │
  │                                                              │
  │ [2] PROJ-1236 (Story)   - User can reset password           │
  │     Status: In Progress | Assignee: jdoe@ford.com          │
  │     Description: Password reset flow via email link...     │
  │                                                              │
  │ [3] PROJ-1237 (Task)    - Setup OAuth2 provider             │
  │     Status: Done | Assignee: asmith@ford.com               │
  │     Description: Configure OAuth2 with Google provider...  │
  │     ⚠️  Note: Already implemented                           │
  │                                                              │
  │ [4] PROJ-1238 (Bug)     - Fix session timeout issue         │
  │     Status: To Do | Assignee: Unassigned                   │
  │     Description: Sessions expire after 5min instead of...  │
  │                                                              │
  │ Select story number to import [1-4]:                        │
  └─────────────────────────────────────────────────────────────┘
  ```
- Wait for user selection
- Re-run with selected child issue (use FULL details already fetched)
- **Check Epic description** for items marked as out-of-scope to avoid spec'ing excluded work
- Proceed with normal Story/Task/Bug flow using COMPLETE child issue data

**If [3] Use Epic description directly**:
- Show warning:
  ```
  ⚠️  WARNING: Using Epic directly may result in insufficient detail
  for implementation. Consider using option [1] or [2] instead.
  
  Proceed anyway? [Y/n]:
  ```
- If yes, proceed with Epic description as source
- If no, return to option selection

**If issue type is Story/Task/Bug**:

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 JIRA CONTEXT RETRIEVED: {JIRA_TICKET}                    │
├─────────────────────────────────────────────────────────────┤
│ Summary: [ticket summary]                                   │
│ Type: [Story/Bug/Task]                                      │
│ Priority: [priority]                                        │
│ Status: [ticket status]                                     │
│ Assignee: [assignee name]                                   │
│                                                              │
│ Description Preview:                                        │
│ [First 300 chars of description...]                         │
│                                                              │
│ Resources Found:                                            │
│ • Figma Links: [count]                                      │
│ • Attachments: [count] ([file types])                       │
│ • Comments: [count]                                         │
│                                                              │
│ ✓ Jira context will be merged into specification            │
└─────────────────────────────────────────────────────────────┘
```

**Step D: Download Attachments**

If attachments exist:
- Create `specs/NNN-feature/attachments/` directory
- Download all attachments using Atlassian MCP tools
- Save with original filenames
- Generate attachment index for spec reference

**Step E: Analyze Local Implementation Status**

Scan the local workspace to determine what's already implemented and what remains.

**For Epic Tickets**:

1. **Check all child issues** against local workspace:
   ```bash
   # For each child issue in Epic
   for child in "${CHILD_ISSUES[@]}"; do
     # Check if spec exists mentioning this ticket
     grep -r "$child" specs/*/spec.md
     # Check if branch exists
     git branch -a | grep -i "$child"
     # Check if merged (in git log)
     git log --all --grep="$child"
   done
   ```

2. **Categorize child issues**:
   - **Completed**: Spec exists + branch merged + referenced in commits
   - **In Progress**: Spec exists + active branch exists
   - **Not Started**: No spec, no branch

3. **Show Epic Implementation Status**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ 📊 EPIC IMPLEMENTATION STATUS: {EPIC_TICKET}                │
   ├─────────────────────────────────────────────────────────────┤
   │ Total Child Issues: [N]                                     │
   │ ✅ Completed: [N]                                           │
   │ 🔄 In Progress: [N]                                         │
   │ ⏳ Not Started: [N]                                         │
   │                                                              │
   │ COMPLETED WORK:                                             │
   │ ✅ {CHILD-001} - [Summary]                                  │
   │    └─ Spec: specs/005-feature-name/spec.md                  │
   │    └─ Merged: branch 005-feature-name (3 days ago)          │
   │                                                              │
   │ IN PROGRESS:                                                │
   │ 🔄 {CHILD-002} - [Summary]                                  │
   │    └─ Spec: specs/008-another-feature/spec.md               │
   │    └─ Branch: 008-another-feature (active)                  │
   │                                                              │
   │ NOT STARTED:                                                │
   │ ⏳ {CHILD-003} - [Summary]                                  │
   │    └─ Will create: specs/[next-number]-[generated-name]/    │
   │    └─ Repository: your-service/              │
   │                                                              │
   │ ⏳ {CHILD-004} - [Summary]                                  │
   │    └─ Will create: specs/[next-number]-[generated-name]/    │
   │    └─ Repository: your-frontend/ ⚠️  NOT CLONED       │
   │                                                              │
   │ ⏳ {CHILD-005} - [Summary]                                  │
   │    └─ Will create: specs/[next-number]-[generated-name]/    │
   │    └─ Repository: your-mobile-service/                       │
   └─────────────────────────────────────────────────────────────┘
   ```

4. **Check Repository Availability**:
   - Scan workspace for repository directories
   - For each "Not Started" issue, determine target repository based on:
     - Jira component field
     - Labels (frontend, backend, mobile, etc.)
     - Issue description keywords
     - Default to current repository if unclear
   
5. **Handle Missing Repositories**:
   ```
   ⚠️  MISSING REPOSITORIES DETECTED
   
   Some child issues belong to repositories not present in your workspace:
   
   • your-frontend/ - Required for:
     - {CHILD-004}: [Summary]
     - {CHILD-007}: [Summary]
   
   • your-bff/ - Required for:
     - {CHILD-009}: [Summary]
   
   SUGGESTIONS:
   
   Option 1 - Clone missing repos:
   cd /Users/rerikse3/repos/ford
   git clone <repo-url> your-frontend
   git clone <repo-url> your-bff
   
   Option 2 - Skip those stories for now:
   Work on stories in available repositories first.
   Create specs for missing repo stories later.
   
   Option 3 - Proceed anyway (specs will be placeholders):
   Create specs in current repo with notes about proper location.
   
   Would you like to:
   [1] Show clone commands for missing repos
   [2] Continue with available repos only
   [3] Abort and clone repos manually first
   
   Enter choice [1/2/3]:
   ```

**For Story/Task/Bug Tickets**:

1. **Check if already implemented**:
   ```bash
   # Search for ticket reference in specs
   EXISTING_SPEC=$(grep -l "$JIRA_TICKET" specs/*/spec.md 2>/dev/null)
   
   # Check for branches
   EXISTING_BRANCH=$(git branch -a | grep -i "$JIRA_TICKET\|$(echo $DESCRIPTION | sed 's/ /-/g')")
   
   # Check git history for merged work
   MERGED=$(git log --all --grep="$JIRA_TICKET" --oneline | head -1)
   ```

2. **Show Implementation Status**:

   **If already completed**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ✅ ALREADY IMPLEMENTED: {JIRA_TICKET}                       │
   ├─────────────────────────────────────────────────────────────┤
   │ This ticket appears to be already implemented:              │
   │                                                              │
   │ Spec: specs/012-user-login/spec.md                          │
   │ Branch: 012-user-login (merged 5 days ago)                  │
   │ Commits: 3 commits referencing {JIRA_TICKET}                │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] View existing spec                                      │
   │ [2] Update existing spec with --update flag                 │
   │ [3] Create new spec anyway (duplicate work)                 │
   │ [4] Abort                                                   │
   │                                                              │
   │ Enter choice [1/2/3/4]:                                     │
   └─────────────────────────────────────────────────────────────┘
   ```

   **If in progress**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ 🔄 WORK IN PROGRESS: {JIRA_TICKET}                          │
   ├─────────────────────────────────────────────────────────────┤
   │ This ticket is already being worked on:                     │
   │                                                              │
   │ Spec: specs/015-password-reset/spec.md                      │
   │ Branch: 015-password-reset (active, 2 commits)              │
   │ Status: No merge detected yet                               │
   │                                                              │
   │ This may indicate:                                          │
   │ • Someone else is working on this                           │
   │ • You started this previously                               │
   │ • Spec needs updating before implementation                 │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] View existing spec and continue work                    │
   │ [2] Update spec with new information                        │
   │ [3] Abort (avoid duplicate work)                            │
   │                                                              │
   │ Enter choice [1/2/3]:                                       │
   └─────────────────────────────────────────────────────────────┘
   ```

   **If not started**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ⏳ NEW WORK: {JIRA_TICKET}                                  │
   ├─────────────────────────────────────────────────────────────┤
   │ No existing spec or branch found.                           │
   │                                                              │
   │ Target Repository: your-service/ ✅          │
   │ Will create: specs/[next-number]-[feature-name]/            │
   │ Branch: [next-number]-[feature-name]                        │
   │                                                              │
   │ Ready to create new specification.                          │
   └─────────────────────────────────────────────────────────────┘
   ```

3. **Determine Target Repository**:
   - Check Jira ticket's Component field
   - Check Jira ticket's Labels for repo indicators
   - Parse description for repository mentions
   - Use current repository as fallback
   
4. **Verify Repository Exists Locally**:
   ```bash
   # Check if target repo directory exists
   if [ ! -d "$TARGET_REPO" ]; then
     echo "⚠️  Repository $TARGET_REPO not found in workspace"
   fi
   ```

   **If repository missing**:
   ```
   ⚠️  TARGET REPOSITORY NOT FOUND
   
   This ticket belongs to: your-frontend/
   Status: Not present in your workspace
   
   Current workspace repos:
   ✅ your-service/
   ✅ your-mobile-service/
   ❌ your-frontend/ (missing)
   ❌ your-bff/ (missing)
   
   SUGGESTION:
   Clone the repository first:
   
   cd /Users/rerikse3/repos/ford
   git clone <repo-url> your-frontend
   
   Then run the specify command again:
   /speckit.specify --jira {JIRA_TICKET}
   
   OPTIONS:
   [1] Create spec in current repo as placeholder
   [2] Abort and clone repo first
   
   Enter choice [1/2]:
   ```

5. **If proceeding with placeholder in wrong repo**:
   - Add prominent note to spec: "⚠️  THIS SPEC BELONGS IN {TARGET_REPO}"
   - Add to Related Resources section
   - Create spec normally but mark for relocation

**Step F: Repository Mapping Strategy**

Determine which repository based on Jira metadata:

1. **Check Component field**:
   - "Dealer Settings UI" → your-frontend/
   - "Dealer Settings Service" → your-service/
   - "Mobile Service" → your-mobile-service/
   - "Experience BFF" → your-bff/

2. **Check Labels**:
   - "frontend", "ui", "react" → your-frontend/
   - "backend", "api", "service" → your-service/
   - "mobile", "ios", "android" → your-mobile-service/
   - "bff", "graphql" → your-bff/

3. **Parse Description keywords**:
   - Mentions of "API endpoint", "backend" → service repos
   - Mentions of "UI", "component", "page" → UI repos
   - Mentions of "mobile app" → mobile repos

4. **Default**: Use current repository if unclear

#### Figma Design Integration

If `--figma` flag provided OR Figma links detected in Jira ticket:

**Step A: Validate Figma URLs**

Extract and validate Figma URLs:
```bash
FIGMA_URLS=$(echo "$ARGUMENTS $JIRA_DESCRIPTION" | grep -oE 'https://(www\.)?figma\.com/(file|design)/[a-zA-Z0-9]+')
```

Accepted formats:
- `https://www.figma.com/file/{key}/{name}`
- `https://figma.com/design/{key}/{name}`
- `https://figma.com/file/{key}/{name}?node-id={nodeId}`

**Step B: Retrieve Design Context**

Use `mcp_com_figma_mcp` tools if available:

1. **Get Design Metadata** (`get_metadata`):
   - File name and structure
   - Page names
   - Component hierarchy
   - Node IDs for specific elements

2. **Extract Component Code** (`get_design_context`):
   - React/HTML component code
   - Component props and variants
   - Interactive states (hover, focus, disabled)
   - Responsive breakpoints

3. **Generate Screenshots** (`get_screenshot`):
   - Full design screenshots
   - Component-level images
   - State variations

4. **Get Design Tokens** (`get_variable_defs`):
   - Color palette with hex values
   - Spacing scale (margins, padding)
   - Typography (fonts, sizes, weights)
   - Border radius, shadows, effects

5. **Read Annotations**:
   - Designer notes and comments
   - Measurement specifications
   - Interaction descriptions
   - Implementation guidance

**Step C: Show Figma Context**

```
┌─────────────────────────────────────────────────────────────┐
│ 🎨 FIGMA DESIGN CONTEXT RETRIEVED                           │
├─────────────────────────────────────────────────────────────┤
│ File: [Design file name]                                    │
│ URL: [figma-url]                                            │
│                                                              │
│ Design Structure:                                           │
│ • Pages: [count]                                            │
│ • Components: [count]                                       │
│ • Frames: [count]                                           │
│                                                              │
│ Extracted Resources:                                        │
│ • Component Code: [count] components                        │
│ • Screenshots: [count] images                               │
│ • Design Tokens:                                            │
│   - Colors: [count]                                         │
│   - Typography: [count] styles                              │
│   - Spacing: [count] values                                 │
│ • Annotations: [count] notes                                │
│                                                              │
│ ✓ Design specifications will be included in spec            │
└─────────────────────────────────────────────────────────────┘
```

**Step D: Save Design Assets**

Create design asset structure:
```
specs/NNN-feature/
├── spec.md
├── design/
│   ├── screenshots/
│   │   ├── full-design.png
│   │   ├── component-button.png
│   │   └── component-card.png
│   ├── components/
│   │   ├── Button.tsx (or .jsx, .html)
│   │   └── Card.tsx
│   ├── tokens.json
│   └── design-notes.md
└── attachments/ (if Jira attachments exist)
```

#### Context Merge Strategy

**Combine all sources with MANDATORY completeness**:
1. User's typed description (highest priority for intent)
2. **Jira Description** (CRITICAL - PRIMARY requirements context)
3. **Jira Acceptance Criteria** (CRITICAL - defines success)
4. **Jira Notes/Additional Notes** (implementation guidance)
5. **Jira Comments** (chronological clarifications with dates - recent comments prioritized)
6. Figma design specifications and constraints
7. Jira attachments (mockups, diagrams, docs)

**Enrichment Priority**:
- If user provided description: Jira/Figma **supplement** user intent
- If only `--jira` flag: Jira ticket **is** the primary source
- **CRITICAL**: Jira Description and AC MUST be used even when user provides description
- If conflicts: Ask user to clarify which source is authoritative
- **Out-of-scope detection**: If Jira Description explicitly states items are handled elsewhere (e.g., "XTime features are being handled in separate epic"), DO NOT spec those items

**Comment Analysis with Temporal Context**:
- Sort comments by date ascending (oldest → newest)
- Identify evolution of requirements over time
- Flag contradictions between early and late comments (use latest as source of truth)
- Look for decision rationale: "We decided to...", "After discussion..."
- Extract clarifications that modify original description/AC

**Epic + Child Story Handling**:
- When processing Epic with children, read Epic Description for:
  - High-level goals and vision
  - **Out-of-scope declarations** (critical to avoid duplicate work)
  - Cross-cutting concerns (auth, logging, monitoring)
  - Dependencies between children
- When processing individual child story:
  - Check parent Epic Description first for context and exclusions
  - Use child's Description + AC as primary detail
  - Merge Epic-level constraints with child-specific requirements
  - Note dependencies on sibling stories

**Show Combined Context**:

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 ENRICHED SPECIFICATION CONTEXT                           │
├─────────────────────────────────────────────────────────────┤
│ Primary Source: [User Input | Jira Ticket]                  │
│                                                              │
│ Context Summary:                                            │
│ • User Description: [brief summary]                         │
│ • Jira Ticket: {TICKET} - [summary]                         │
│ • Figma Design: [file name]                                 │
│ • Attachments: [count] files                                │
│                                                              │
│ The specification will incorporate all context sources.     │
│                                                              │
│ Ready to proceed with spec generation? [Y/n]:               │
└─────────────────────────────────────────────────────────────┘
```

---

### 0.4 Sanitize Special Characters

Check for shell-unsafe characters and handle them:

| Character | Action |
|-----------|--------|
| `"` (double quote) | Escape as `\"` in shell commands |
| `'` (single quote) | Escape as `'\''` in shell commands |
| `` ` `` (backtick) | Remove or replace with `'` |
| `$` (dollar sign) | Escape as `\$` to prevent variable expansion |
| `\` (backslash) | Escape as `\\` |
| `|`, `&`, `;` | Remove (potential command injection) |
| `>`, `<` | Remove (potential redirection) |

**Store sanitized version for shell operations, keep original for spec content.**

### 0.5 Handle Long Descriptions

If description is longer than 200 characters:
1. Extract the 3-5 most important keywords for branch name
2. Use full description in spec content
3. Branch name should be max 50 characters (excluding number prefix)

### 0.6 Cross-Repository Feature Detection (EC-033)

Check if the feature description mentions multiple repos or cross-cutting concerns:

```bash
# Detect cross-repo indicators
CROSS_REPO_SIGNALS=(
  "across.*repos"
  "multiple.*services"
  "frontend.*backend"
  "client.*server"
  "api.*and.*ui"
  "shared.*between"
  "all.*repos"
  "monorepo.*wide"
)

for signal in "${CROSS_REPO_SIGNALS[@]}"; do
  if echo "$DESCRIPTION" | grep -qiE "$signal"; then
    CROSS_REPO_FEATURE=true
    break
  fi
done
```

**If cross-repo feature detected**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 CROSS-REPOSITORY FEATURE DETECTED (EC-033)               │
├─────────────────────────────────────────────────────────────┤
│ This feature appears to span multiple repositories:         │
│                                                              │
│ Feature: "[DESCRIPTION]"                                    │
│                                                              │
│ Cross-repo features require special coordination:           │
│ • Specs in each affected repo must be synchronized          │
│ • Implementation order matters (dependencies)               │
│ • Testing requires integration across repos                 │
│                                                              │
│ APPROACH OPTIONS:                                           │
│ [1] Primary + References - Main spec here, link to others   │
│ [2] Coordinated Specs - Create linked specs in each repo    │
│ [3] Umbrella Spec - Create workspace-level coordination doc │
│ [4] Not cross-repo - Feature is contained in this repo      │
│                                                              │
│ Enter choice [1/2/3/4]:                                     │
└─────────────────────────────────────────────────────────────┘
```

**If [1] Primary + References**:
- Create main spec in current repo
- Add "## Cross-Repository Dependencies" section
- List affected repos with brief impact description
- Add "Related Specs" links (to be filled when other specs created)

**If [2] Coordinated Specs**:
```
Which repositories should have linked specs?
Available repos in workspace:
1. [ ] backend-service
2. [ ] frontend-app  
3. [ ] shared-lib
4. [x] current-repo (primary)

Select repos (comma-separated numbers): ___

After this spec is created, I'll help create linked specs in:
• backend-service: specs/[NNN]-[name]-backend/
• frontend-app: specs/[NNN]-[name]-frontend/

Each will reference this primary spec.
```

**If [3] Umbrella Spec**:
- Create `.specify/workspace/cross-repo/[feature-name]/` at workspace root
- Generate coordination document with:
  - Overall feature description
  - Per-repo responsibilities
  - Implementation sequence
  - Integration testing strategy
- Then create sub-specs in each repo referencing umbrella

---

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📝 SPEC-KIT SPECIFICATION WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Creating feature branch and spec directory                │
│ • Generating structured specification from your description │
│ • Validating quality and completeness                       │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • Specs ensure clear requirements before coding             │
│ • Prevents scope creep and implementation drift             │
│ • Enables AI-assisted development (99% success rate)        │
│                                                              │
│ PROCESS OVERVIEW:                                           │
│ 1. Parse feature description                                │
│ 2. Generate short name and branch                           │
│ 3. Create specification (user stories, requirements)        │
│ 4. Validate quality (completeness check)                    │
│ 5. Resolve clarifications (if needed)                       │
│ 6. Report completion                                        │
└─────────────────────────────────────────────────────────────┘
```

Given the Jira ticket content, do this:

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 STEP 1: BRANCH SETUP (Jira-First Naming)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Using Jira ticket {JIRA_TICKET} as primary identifier...
```

1. **Generate a concise short name** (2-4 words) from the Jira ticket summary:
   - Analyze the ticket summary and extract the most meaningful keywords
   - Create a 2-4 word short name that captures the essence of the feature
   - Use action-noun format when possible (e.g., "user-auth", "payment-timeout")
   - Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)
   - Keep it concise but descriptive enough to understand the feature at a glance
   - **Maximum 50 characters** for branch short name
   - Examples (Jira-first format):
     - PROJ-1234 "Add user authentication" → `PROJ-1234-user-auth`
     - PROJ-43 "Guest Visibility Epic" → `PROJ-43-guest-visibility-epic`
     - PROJ-2554 "Spec-Kit Jira Integration" → `PROJ-2554-speckit-jira-integration`

**Show user**:
```
✅ Generated branch name: {JIRA_TICKET}-[short-name]
```

2. **Check if spec already exists for this Jira ticket**:

**Show user**:
```
🔍 Checking for existing spec for {JIRA_TICKET}...
```

   a. List all existing spec directories:
      ```bash
      ls -d specs/*/  2>/dev/null | grep -E "^specs/${JIRA_TICKET}-"
      ```
   
   b. **If spec already exists for this Jira ticket**, show error:
      ```
      ┌─────────────────────────────────────────────────────────────┐
      │ ⚠️  SPEC ALREADY EXISTS FOR THIS JIRA TICKET                │
      ├─────────────────────────────────────────────────────────────┤
      │ Jira Ticket: {JIRA_TICKET}                                  │
      │ Existing Spec: specs/{JIRA_TICKET}-[name]/spec.md           │
      │                                                              │
      │ Options:                                                    │
      │ [1] View existing spec                                       │
      │ [2] Update existing spec (use --update flag)                 │
      │ [3] Abort                                                    │
      └─────────────────────────────────────────────────────────────┘
      ```
   
   c. If no existing spec found for this Jira ticket, proceed.

3. **Create branch with Jira-first naming**:
   
**Show user**:
```
🔍 Creating feature branch...
```
   
   a. Create the branch and spec directory directly:
      ```bash
      # Create branch with Jira-first naming
      git checkout -b "{JIRA_TICKET}-{short-name}"
      
      # Create spec directory
      mkdir -p "specs/{JIRA_TICKET}-{short-name}"
      ```
   
   **IMPORTANT**:
   - Branch naming: `{JIRA_TICKET}-{short-name}` (e.g., `PROJ-1234-user-auth`)
   - Spec directory: `specs/{JIRA_TICKET}-{short-name}/`
   - No sequential numbers are used (Constitution Section IX)
   - Set variables: BRANCH_NAME, SPEC_DIR, SPEC_FILE (spec.md path)

**Show user**:
```
✅ Step 1 Complete: Branch Created

**Branch**: [branch-name]
**Spec Directory**: specs/[JIRA_TICKET]-[short-name]/
**Spec File**: specs/[JIRA_TICKET]-[short-name]/spec.md

**Next**: Generating specification content...
```

4. Load `.specify/templates/spec-template.md` to understand required sections.

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 STEP 2: SPECIFICATION GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creating structured specification from your description...

WHAT'S HAPPENING:
• Parsing feature description into user stories
• Generating functional requirements (testable, specific)
• Defining success criteria (measurable outcomes)
• Identifying edge cases and constraints

WHY THIS STRUCTURE:
• User stories enable independent implementation (MVP-first)
• Functional requirements ensure testable outcomes
• Success criteria are business-focused (not technical)
• Edge cases prevent surprise issues during implementation
```

4. Follow this execution flow:

    1. Parse user description from Input
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description
       Identify: actors, actions, data, constraints
    3. For unclear aspects:
       - Make informed guesses based on context and industry standards
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope or user experience
         - Multiple reasonable interpretations exist with different implications
         - No reasonable default exists
       - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
       - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
    4. Fill User Scenarios & Testing section
       If no clear user flow: ERROR "Cannot determine user scenarios"
    5. Generate Functional Requirements
       Each requirement must be testable
       Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
    6. Define Success Criteria
       Create measurable, technology-agnostic outcomes
       Include both quantitative metrics (time, performance, volume) and qualitative measures (user satisfaction, task completion)
       Each criterion must be verifiable without implementation details
    7. Identify Key Entities (if data involved)
    8. Return: SUCCESS (spec ready for planning)

### Draft Mode Preview (if --draft flag set)

**If `DRAFT_MODE=true`**, show full spec preview before any file operations:

```
┌─────────────────────────────────────────────────────────────┐
│ 📝 DRAFT PREVIEW: [SHORT-NAME]                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Branch that would be created: [NNN]-[short-name]            │
│ Directory: specs/[NNN]-[short-name]/                        │
│                                                              │
│ ═══════════════════════════════════════════════════════════ │
│                                                              │
│ [FULL SPEC.MD CONTENT DISPLAYED HERE]                       │
│                                                              │
│ ═══════════════════════════════════════════════════════════ │
│                                                              │
│ DRAFT OPTIONS:                                              │
│ [1] ✅ Approve and create (proceed with branch + files)     │
│ [2] ✏️  Edit description and regenerate                      │
│ [3] 📝 Manually edit spec content                           │
│ [4] ❌ Discard draft                                         │
│                                                              │
│ Enter choice [1/2/3/4]:                                     │
└─────────────────────────────────────────────────────────────┘
```

**If [1] Approve**:
- Set `DRAFT_MODE=false`
- Continue with normal file creation flow
- Create branch, write spec.md, etc.

**If [2] Edit description**:
- Ask user for updated description
- Regenerate spec from new description
- Show preview again

**If [3] Manual edit**:
- Show spec in editable format
- User makes changes
- Validate changes meet quality criteria
- Show preview of edited version
- Return to draft options

**If [4] Discard**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🗑️  DRAFT DISCARDED                                         │
├─────────────────────────────────────────────────────────────┤
│ No changes were made to the repository.                     │
│                                                              │
│ To create a new spec, run:                                  │
│ /speckit.specify [feature description]                      │
│                                                              │
│ To try draft mode again:                                    │
│ /speckit.specify --draft [feature description]              │
└─────────────────────────────────────────────────────────────┘
```
**STOP** - do not proceed with file creation.

---

5. Write the specification to SPEC_FILE using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) while preserving section order and headings.

**Skip this step if `DRAFT_MODE=true` and user hasn't approved yet.**

**Show user**:
```
✅ Specification Content Generated

**Sections Complete**:
• User Scenarios & Testing ([X] user stories with acceptance criteria)
• Functional Requirements ([X] requirements)
• Success Criteria ([X] measurable outcomes)
• Edge Cases ([X] scenarios identified)
• [List other completed sections]

**Next**: Validating quality and completeness...
```

6. **Specification Quality Validation**: After writing the initial spec, validate it against quality criteria:

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 STEP 3: QUALITY VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Checking specification against Spec-Kit quality standards...

WHAT'S BEING VALIDATED:
• No implementation details (no languages, frameworks, APIs)
• Requirements are testable and unambiguous
• Success criteria are measurable
• User scenarios cover primary flows
• All mandatory sections completed

WHY THIS MATTERS:
• Quality specs prevent implementation drift
• Testable requirements enable proper validation
• Clear criteria ensure feature delivers value
```

   a. **Create Spec Quality Checklist**: Generate a checklist file at `FEATURE_DIR/checklists/requirements.md` using the checklist template structure with these validation items:

      ```markdown
      # Specification Quality Checklist: [FEATURE NAME]
      
      **Purpose**: Validate specification completeness and quality before proceeding to planning
      **Created**: [DATE]
      **Feature**: [Link to spec.md]
      
      ## Content Quality
      
      - [ ] No implementation details (languages, frameworks, APIs)
      - [ ] Focused on user value and business needs
      - [ ] Written for non-technical stakeholders
      - [ ] All mandatory sections completed
      
      ## Requirement Completeness
      
      - [ ] No [NEEDS CLARIFICATION] markers remain
      - [ ] Requirements are testable and unambiguous
      - [ ] Success criteria are measurable
      - [ ] Success criteria are technology-agnostic (no implementation details)
      - [ ] All acceptance scenarios are defined
      - [ ] Edge cases are identified
      - [ ] Scope is clearly bounded
      - [ ] Dependencies and assumptions identified
      
      ## Feature Readiness
      
      - [ ] All functional requirements have clear acceptance criteria
      - [ ] User scenarios cover primary flows
      - [ ] Feature meets measurable outcomes defined in Success Criteria
      - [ ] No implementation details leak into specification
      
      ## Notes
      
      - Items marked incomplete require spec updates before `/speckit.clarify` or `/speckit.plan`
      ```

   b. **Run Validation Check**: Review the spec against each checklist item:
      - For each item, determine if it passes or fails
      - Document specific issues found (quote relevant spec sections)

   c. **Handle Validation Results**:

      - **If all items pass**: Mark checklist complete and proceed to step 6

      - **If items fail (excluding [NEEDS CLARIFICATION])**:
        1. List the failing items and specific issues
        2. Update the spec to address each issue
        3. Re-run validation until all items pass (max 3 iterations)
        4. If still failing after 3 iterations, document remaining issues in checklist notes and warn user

      - **If [NEEDS CLARIFICATION] markers remain**:
        1. Extract all [NEEDS CLARIFICATION: ...] markers from the spec
        2. **LIMIT CHECK**: If more than 3 markers exist, keep only the 3 most critical (by scope/security/UX impact) and make informed guesses for the rest
        3. **Show user**:
           ```
           ⚠️  CLARIFICATIONS NEEDED
           
           Some requirements need your input to proceed. Maximum 3 questions total
           (most critical issues prioritized).
           
           WHAT'S HAPPENING:
           • Spec has ambiguous requirements
           • Need your decision to proceed accurately
           • Other unclear items resolved with reasonable defaults
           
           WHY THIS MATTERS:
           • Prevents building wrong features
           • Ensures spec matches your intent
           • Avoids costly rework later
           
           Please answer all questions below:
           ```
        4. For each clarification needed (max 3), present options to user in this format:

           ```markdown
           ## Question [N]: [Topic]
           
           **Context**: [Quote relevant spec section]
           
           **What we need to know**: [Specific question from NEEDS CLARIFICATION marker]
           
           **Suggested Answers**:
           
           | Option | Answer | Implications |
           |--------|--------|--------------|
           | A      | [First suggested answer] | [What this means for the feature] |
           | B      | [Second suggested answer] | [What this means for the feature] |
           | C      | [Third suggested answer] | [What this means for the feature] |
           | Custom | Provide your own answer | [Explain how to provide custom input] |
           
           **Your choice**: _[Wait for user response]_
           ```

        5. **CRITICAL - Table Formatting**: Ensure markdown tables are properly formatted:
           - Use consistent spacing with pipes aligned
           - Each cell should have spaces around content: `| Content |` not `|Content|`
           - Header separator must have at least 3 dashes: `|--------|`
           - Test that the table renders correctly in markdown preview
        6. Number questions sequentially (Q1, Q2, Q3 - max 3 total)
        7. Present all questions together before waiting for responses
        8. **Show user**: `Please respond with your choices for all questions (e.g., "Q1: A, Q2: Custom - [details], Q3: B")`
        9. Wait for user to respond with their choices for all questions
        10. Update the spec by replacing each [NEEDS CLARIFICATION] marker with the user's selected or provided answer
        11. **Show user**:
            ```
            ✅ Clarifications Resolved
            
            Updated specification with your answers:
            • Q1: [Answer chosen]
            • Q2: [Answer chosen]
            • Q3: [Answer chosen]
            
            Re-running validation...
            ```
        12. Re-run validation after all clarifications are resolved

   d. **Update Checklist**: After each validation iteration, update the checklist file with current pass/fail status

7. **Update workspace context**: After spec is successfully created, push changes to trigger the sync workflow which updates workspace context files for GitHub Copilot awareness.

8. Report completion with branch name, spec file path, checklist results, and readiness for the next phase (`/speckit.clarify` or `/speckit.plan`).

**Show user**:
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ✅ SPECIFICATION COMPLETE                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📋 SUMMARY
──────────────────────────────────────────────────────────────
Branch:       [branch-name]
Spec File:    specs/[number]-[short-name]/spec.md
Checklist:    specs/[number]-[short-name]/checklists/requirements.md
Status:       ✅ All quality checks passed

📝 SPECIFICATION CONTENT
──────────────────────────────────────────────────────────────
• User Stories: [X] (prioritized P1, P2, P3)
• Functional Requirements: [X]
• Success Criteria: [X] measurable outcomes
• Edge Cases: [X] scenarios
• Clarifications: [All resolved / None needed]

✅ QUALITY VALIDATION
──────────────────────────────────────────────────────────────
• No implementation details: ✅
• Requirements testable: ✅
• Success criteria measurable: ✅
• User scenarios complete: ✅
• All mandatory sections: ✅

🎯 WHAT THIS MEANS
──────────────────────────────────────────────────────────────
Your specification is ready for implementation planning!

• **WHAT defined**: Clear user requirements and acceptance criteria
• **WHY defined**: Business value and success metrics  
• **HOW undefined**: No technical decisions yet (that's next phase)

This spec documents WHAT users need, not HOW to build it.
Technical decisions happen in the planning phase.

🚀 NEXT STEPS
──────────────────────────────────────────────────────────────
Choose your path:

**Option A: Proceed with Planning** (Recommended)
  → Run: /speckit.plan
  → This generates: Implementation plan, architecture, data model,
                     API contracts, development quickstart

**Option B: Clarify Further** (If needed)
  → Run: /speckit.clarify
  → Interactive Q&A to refine requirements before planning

**Option C: Review Spec First**
  → Open: specs/[number]-[short-name]/spec.md
  → Review specification content
  → Run /speckit.plan when ready

📚 REFERENCE
──────────────────────────────────────────────────────────────
• Specification: specs/[number]-[short-name]/spec.md
• Checklist: specs/[number]-[short-name]/checklists/requirements.md
• Spec-Kit guide: SPECKIT.md#the-spec-kit-workflow
• Next command: /speckit.plan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**NOTE:** The script creates and checks out the new branch and initializes the spec file before writing.

## General Guidelines

## Quick Guidelines

- Focus on **WHAT** users need and **WHY**.
- Avoid HOW to implement (no tech stack, APIs, code structure).
- Written for business stakeholders, not developers.
- DO NOT create any checklists that are embedded in the spec. That will be a separate command.

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps
2. **Document assumptions**: Record reasonable defaults in the Assumptions section
3. **Limit clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers - use only for critical decisions that:
   - Significantly impact feature scope or user experience
   - Have multiple reasonable interpretations with different implications
   - Lack any reasonable default
4. **Prioritize clarifications**: scope > security/privacy > user experience > technical details
5. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
6. **Common areas needing clarification** (only if no reasonable default exists):
   - Feature scope and boundaries (include/exclude specific use cases)
   - User types and permissions (if multiple conflicting interpretations possible)
   - Security/compliance requirements (when legally/financially significant)

**Examples of reasonable defaults** (don't ask about these):

- Data retention: Industry-standard practices for the domain
- Performance targets: Standard web/mobile app expectations unless specified
- Error handling: User-friendly messages with appropriate fallbacks
- Authentication method: Standard session-based or OAuth2 for web apps
- Integration patterns: RESTful APIs unless specified otherwise

### Success Criteria Guidelines

Success criteria must be:

1. **Measurable**: Include specific metrics (time, percentage, count, rate)
2. **Technology-agnostic**: No mention of frameworks, languages, databases, or tools
3. **User-focused**: Describe outcomes from user/business perspective, not system internals
4. **Verifiable**: Can be tested/validated without knowing implementation details

**Good examples**:

- "Users can complete checkout in under 3 minutes"
- "System supports 10,000 concurrent users"
- "95% of searches return results in under 1 second"
- "Task completion rate improves by 40%"

**Bad examples** (implementation-focused):

- "API response time is under 200ms" (too technical, use "Users see results instantly")
- "Database can handle 1000 TPS" (implementation detail, use user-facing metric)
- "React components render efficiently" (framework-specific)
- "Redis cache hit rate above 80%" (technology-specific)
