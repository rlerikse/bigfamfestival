---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
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
| (none) | Generate full plan (all sections) |
| `--only data-model` | Generate only data-model.md |
| `--only contracts` | Generate only contracts/*.yaml |
| `--only quickstart` | Generate only quickstart.md |
| `--only research` | Generate only research.md |
| `--skip data-model` | Skip data-model.md generation |
| `--skip contracts` | Skip contracts/ generation |
| `--force` | Replace existing plan without prompting |
| `--diff` | Show what would change (don't write) |

**Examples**:
- `/speckit.plan` - Full plan generation
- `/speckit.plan --only contracts` - Just regenerate API contracts
- `/speckit.plan --only data-model` - Just regenerate data model
- `/speckit.plan --skip contracts --skip quickstart` - Plan without contracts/quickstart
- `/speckit.plan --diff` - Preview changes without modifying files

---

## Modular Generation Mode

When `--only <section>` is specified, generate only that section:

### `--only data-model`

```
🗄️ **Generating Data Model Only**

Loading: spec.md, constitution.md
Generating: data-model.md

This will create/update ONLY the data model document.
Other plan sections will remain unchanged.
```

**Output**: `data-model.md` with:
- Entity definitions
- Relationships and cardinality
- Migration plan
- Query patterns
- Indexing strategy

### `--only contracts`

```
📜 **Generating API Contracts Only**

Loading: spec.md, plan.md (for tech context)
Generating: contracts/*.yaml

This will create/update ONLY the OpenAPI contracts.
Other plan sections will remain unchanged.
```

**Output**: `contracts/` directory with:
- OpenAPI 3.0 specifications
- Request/response schemas
- Error response formats
- Security definitions

### `--only quickstart`

```
🚀 **Generating Quickstart Only**

Loading: spec.md, plan.md, data-model.md
Generating: quickstart.md

This will create/update ONLY the quickstart guide.
Other plan sections will remain unchanged.
```

**Output**: `quickstart.md` with:
- Local development setup
- Test data seeding
- Debugging tips
- Common tasks

### `--only research`

```
🔬 **Generating Research Only**

Loading: spec.md, constitution.md
Generating: research.md

This will create/update ONLY the research document.
Other plan sections will remain unchanged.
```

**Output**: `research.md` with:
- Technical decisions
- Alternatives considered
- Best practices research
- Architecture patterns

### Combined Flags

Multiple `--skip` flags can be combined:

```
/speckit.plan --skip contracts --skip quickstart
```

This generates: plan.md, research.md, data-model.md (skips contracts/ and quickstart.md)

---

## 📋 What This Command Does

**Purpose**: Transform specification (WHAT) into implementation plan (HOW).

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md#the-spec-kit-workflow)):
- **Phase 1**: Planning (architecture, tech stack, data model, API contracts)
- **After /speckit.specify**: Spec defines user needs, plan defines technical approach
- **Before /speckit.tasks**: Must have complete technical design

**This command will**:
1. **Research unknowns** (resolve technical questions via research agents)
2. **Generate plan.md** (architecture, tech stack, file structure, constitution check)
3. **Create data-model.md** (if database changes: entities, relationships, migrations)
4. **Generate API contracts** (OpenAPI 3.0 specifications, request/response schemas)
5. **Create quickstart.md** (local development setup, testing guide)
6. **Update AI context** (copilot-instructions.md with new tech stack)

**Why use this?**
- ✅ Resolves all technical unknowns before coding
- ✅ Constitution compliance enforced (PII, contracts, observability)
- ✅ Contract-first API design (OpenAPI before implementation)
- ✅ AI assistants auto-updated with new technology context

**What happens next**: After plan complete, run `/speckit.tasks` to break down into executable steps.

---

## Outline

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🏗️  SPEC-KIT PLANNING WORKFLOW                             │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Loading specification and constitution                    │
│ • Researching technical decisions                           │
│ • Generating implementation plan and architecture           │
│ • Creating API contracts (contract-first design)            │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • Plan defines HOW to build WHAT spec describes             │
│ • Constitution ensures quality from the start               │
│ • Contract-first prevents implementation drift              │
│ • Research resolves unknowns before coding                  │
│                                                              │
│ PROCESS OVERVIEW:                                           │
│ Phase 0: Research unknowns and technical decisions          │
│ Phase 1: Generate plan, data model, contracts, quickstart   │
│ Phase 2: Update AI assistant context files                  │
│ Report:  Completion summary with next steps                 │
└─────────────────────────────────────────────────────────────┘
```

1. **Setup**: Detect feature context from current directory or user input:
   - Look for `specs/*/spec.md` files in the repository
   - If in a feature directory (contains spec.md), use that
   - Otherwise, prompt user to specify which feature
   - Set FEATURE_SPEC, IMPL_PLAN (plan.md in same dir), SPECS_DIR, BRANCH (current git branch)

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 SETUP COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Spec File:    [FEATURE_SPEC path]
Plan File:    [IMPL_PLAN path]
Specs Dir:    [SPECS_DIR path]
Branch:       [BRANCH name]

Next: Loading specification and constitution...
```

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

2.5 **Pre-Planning Validation** (before proceeding):

**A. Specification Completeness Check** (EC-013):

   Scan spec.md for minimum viable content:
   ```bash
   ISSUES=()
   
   # Check for required sections (at least summary content)
   if ! grep -qE "## (Overview|Summary|Description)" spec.md; then
     ISSUES+=("Missing Overview/Summary section")
   fi
   if ! grep -qE "## (Functional|Requirements|Features)" spec.md; then
     ISSUES+=("Missing Functional Requirements section")
   fi
   
   # Check for vague/incomplete markers
   VAGUE_COUNT=$(grep -cE "\[TBD\]|\[TODO\]|\[NEEDS.*\]|\?\?\?|PLACEHOLDER" spec.md || echo "0")
   
   # Check for minimum content
   WORD_COUNT=$(wc -w < spec.md | tr -d ' ')
   
   # Check for empty user stories
   EMPTY_STORIES=$(grep -cE "^-\s*$|^\*\s*$" spec.md || echo "0")
   ```

   **If spec has critical issues**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ⚠️  SPECIFICATION TOO VAGUE FOR PLANNING                    │
   ├─────────────────────────────────────────────────────────────┤
   │ The spec requires more detail before a plan can be created: │
   │                                                              │
   │ ISSUES FOUND:                                               │
   │ [• List each issue from ISSUES array]                       │
   │ • [VAGUE_COUNT] unresolved placeholders found               │
   │ • Spec is only [WORD_COUNT] words (min recommended: 200)    │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] Run /speckit.clarify first (resolve ambiguities)        │
   │ [2] Edit spec manually (I'll update it now)                 │
   │ [3] Proceed anyway (plan may be incomplete/incorrect)       │
   │ [4] Abort                                                   │
   │                                                              │
   │ Enter choice [1/2/3/4]:                                     │
   └─────────────────────────────────────────────────────────────┘
   ```

   **If [1] Run clarify**: Stop and suggest `/speckit.clarify`
   **If [2] Edit manually**: Wait for user to signal completion
   **If [3] Proceed anyway**: Add warning to plan header:
     `⚠️ Generated from incomplete spec - review carefully`
   **If [4] Abort**: Stop execution

   **Vagueness scoring**:
   - 0 placeholders, >200 words, all sections present → PASS
   - 1-3 placeholders OR 100-200 words → WARN (offer clarify)
   - >3 placeholders OR <100 words OR missing sections → BLOCK (require action)

**B. Existing Plan Check** (EC-014):

   ```bash
   if [ -f "plan.md" ] && [ -s "plan.md" ]; then
     EXISTING_PLAN=true
     PLAN_SIZE=$(wc -l < plan.md)
   fi
   ```

   **If plan.md already exists**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ 📋 EXISTING PLAN DETECTED                                  │
   ├─────────────────────────────────────────────────────────────┤
   │ A plan.md already exists in this feature directory:        │
   │                                                              │
   │ File: [IMPL_PLAN path]                                      │
   │ Size: [PLAN_SIZE] lines                                     │
   │ Modified: [last modified date]                              │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] Update - Keep existing, update changed sections         │
   │ [2] Replace - Generate completely new plan (backup old)     │
   │ [3] Diff - Show what would change                           │
   │ [4] View - Show me the existing plan first                  │
   │ [5] Abort - Keep existing plan, cancel planning             │
   │                                                              │
   │ Enter choice [1/2/3/4/5]:                                   │
   └─────────────────────────────────────────────────────────────┘
   ```

   **If [1] Update**:
   - Load existing plan
   - Compare with spec for changes
   - Only regenerate sections affected by spec changes
   - Add `## Changelog` entry: `[DATE] - Updated [sections] due to spec changes`

   **If [2] Replace**:
   - Backup: `cp plan.md plan.md.backup-[timestamp]`
   - Generate completely new plan
   - Show backup location

   **If [3] Diff** (Plan Diff Capability):
   - Generate new plan in memory (do not write)
   - Compare against existing plan section-by-section
   - Show diff report:
   
   ```
   📊 **Plan Diff Report**
   
   Comparing existing plan.md with what would be generated from current spec.md:
   
   | Section | Status | Change Summary |
   |---------|--------|----------------|
   | ## Tech Stack | ✅ No change | Identical |
   | ## Architecture | ⚠️ Minor changes | 2 new components added |
   | ## Data Model | 🔄 Major changes | 3 new entities, 2 modified |
   | ## API Contracts | 🔄 Major changes | 2 new endpoints |
   | ## Constitution Check | ✅ No change | All gates still passing |
   
   **Detailed Changes**:
   
   ### ## Architecture
   ```diff
   - Components: AuthService, UserRepository
   + Components: AuthService, UserRepository, PaymentService, WebhookHandler
   ```
   
   ### ## Data Model
   ```diff
   + interface Payment {
   +   id: string;
   +   amount: number;
   +   status: PaymentStatus;
   + }
   ```
   
   **Summary**: 4 sections unchanged, 2 sections with changes
   
   [1] Apply these changes (update plan)
   [2] Replace entirely (regenerate full plan)
   [3] View full diff
   [4] Cancel (keep existing)
   ```
   
   - If user selects [1], apply only the changed sections
   - If user selects [2], regenerate full plan
   - If user selects [3], show complete side-by-side diff
   - If user selects [4], abort

   **If [4] View**:
   - Display existing plan summary (first 50 lines or headers)
   - Then ask [1/2/3/5] again

   **If [5] Abort**:
   - Exit with "Keeping existing plan. Run /speckit.plan --force to replace."

**C. Constitution Pre-Check**:

   Before proceeding with plan generation, validate spec against constitution:

   ```bash
   CONSTITUTION=".specify/memory/constitution.md"
   if [ -f "$CONSTITUTION" ]; then
     # Run constitution pre-check
     echo "Validating spec against constitution..."
   fi
   ```

   **Load constitution and extract mandatory requirements**:
   - Technology constraints (required languages, frameworks)
   - Security requirements (auth methods, encryption standards)
   - Compliance gates (GDPR, PCI, SOC2, HIPAA)
   - Architecture patterns (microservices, monolith, serverless)
   - Data handling rules (PII, retention, encryption)

   **Compare spec against constitution gates**:

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ 🔐 CONSTITUTION PRE-CHECK                                   │
   ├─────────────────────────────────────────────────────────────┤
   │ Validating spec.md against constitution requirements...     │
   │                                                              │
   │ Constitution: .specify/memory/constitution.md               │
   │ Spec: [FEATURE_SPEC]                                        │
   │                                                              │
   │ Gate Validation:                                            │
   │ ┌───────────────────────────────────────────────────────┐  │
   │ │ Gate              │ Required  │ Spec Status │ Result  │  │
   │ ├───────────────────────────────────────────────────────┤  │
   │ │ Authentication    │ OAuth2    │ Mentioned   │ ✅ PASS │  │
   │ │ Data Encryption   │ AES-256   │ Not stated  │ ⚠️ WARN │  │
   │ │ PII Handling      │ Required  │ Not stated  │ 🔴 FAIL │  │
   │ │ API Contracts     │ OpenAPI   │ Compatible  │ ✅ PASS │  │
   │ │ Observability     │ Required  │ Not stated  │ ⚠️ WARN │  │
   │ └───────────────────────────────────────────────────────┘  │
   │                                                              │
   │ Summary: 2 PASS | 2 WARN | 1 FAIL                           │
   └─────────────────────────────────────────────────────────────┘
   ```

   **If any FAIL gates**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ 🔴 CONSTITUTION VIOLATIONS DETECTED                         │
   ├─────────────────────────────────────────────────────────────┤
   │ The spec violates required constitution gates:              │
   │                                                              │
   │ 1. PII Handling (REQUIRED)                                  │
   │    Constitution says: "All features handling user data      │
   │    must specify PII classification and handling approach"   │
   │    Spec says: [nothing about PII handling]                  │
   │                                                              │
   │ These MUST be resolved before planning can proceed.         │
   │                                                              │
   │ OPTIONS:                                                    │
   │ [1] Update spec - Add missing sections via /speckit.clarify │
   │ [2] Request exemption - Document why rule doesn't apply     │
   │ [3] View constitution - Show full requirements              │
   │ [4] Proceed anyway - Generate plan with violations flagged  │
   │                                                              │
   │ Enter choice [1/2/3/4]:                                     │
   └─────────────────────────────────────────────────────────────┘
   ```

   **If [2] Request exemption**:
   - User must provide justification for each violated gate
   - Exemption logged in plan.md under "Constitution Exemptions" section
   - Warning banner added to plan

   **If [4] Proceed anyway**:
   - Add prominent warning to plan.md:
     `🔴 CONSTITUTION VIOLATIONS: This plan does not fully comply with constitution requirements. See "Constitution Check" section.`

   **If only WARN gates**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ ⚠️ CONSTITUTION WARNINGS                                    │
   ├─────────────────────────────────────────────────────────────┤
   │ These constitution requirements are not explicitly addressed │
   │ in the spec. They will be added to the plan automatically:  │
   │                                                              │
   │ • Data Encryption: Will default to AES-256 per constitution │
   │ • Observability: Will add logging/metrics per constitution  │
   │                                                              │
   │ Continue with planning? [Y/n]:                              │
   └─────────────────────────────────────────────────────────────┘
   ```

   **If all PASS**:
   ```
   ✅ Constitution Pre-Check: All gates passing
   ```

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design

4. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

> **What's Happening**: Researching technical unknowns before making design decisions  
> **Why**: Prevents uninformed architectural choices, finds best practices, evaluates alternatives  
> **Output**: research.md with all [NEEDS CLARIFICATION] resolved

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 PHASE 0: RESEARCH & TECHNICAL DECISIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Identifying unknowns from specification...

WHAT'S HAPPENING:
• Extracting technical questions from spec
• Launching research agents for each unknown
• Evaluating alternatives and best practices
• Making informed architectural decisions

WHY THIS MATTERS:
• No guesswork on critical tech choices
• Learn from industry best practices
• Document rationale for future reference
• Constitution compliance from the start
```

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   **Research Agent Workflow**:
   
   A "research agent" is a focused sub-task that uses available tools to gather information.
   For each research task, you (the AI assistant) will:
   
   a. **Define the research question** clearly (what exactly needs to be answered)
   b. **Search existing codebase** using semantic_search for similar patterns or prior art
   c. **Check workspace files** for existing conventions, README.md, package.json, or config files
   d. **Fetch external documentation** using fetch_webpage for official docs when needed
   e. **Evaluate alternatives** by comparing at least 2-3 options with pros/cons
   f. **Make a recommendation** with clear rationale

   **Offline Mode Handling**:
   
   If network is unavailable (fetch_webpage fails):
   ```
   ⚠️ OFFLINE MODE: Cannot fetch external documentation
   
   Research will be limited to:
   ✅ Existing codebase patterns (semantic_search works)
   ✅ Workspace files (README, package.json, configs)
   ✅ Constitution and existing specs
   
   ❌ External docs unavailable - marking as assumption
   
   Recommendations will note: "Based on codebase patterns only - 
   verify against official docs when online."
   ```
   
   When offline:
   - Prioritize existing codebase patterns
   - Mark external research items as "TODO: Verify online"
   - Make conservative recommendations based on what's already in codebase
   - Note uncertainty in decision rationale

   **Research Agent Template**:
   ```markdown
   ## Research: [Topic]
   
   ### Question
   [Clear statement of what needs to be decided]
   
   ### Context
   - Feature: [relevant feature context]
   - Constraints: [from constitution or existing architecture]
   - Existing patterns: [what's already used in codebase]
   
   ### Investigation
   1. **Codebase search**: [findings from semantic_search]
   2. **Documentation review**: [findings from fetch_webpage or file reads]
      - [If offline: "⚠️ External docs unavailable - using codebase patterns"]
   3. **Alternatives evaluated**:
      - Option A: [description] - Pros: [...] Cons: [...]
      - Option B: [description] - Pros: [...] Cons: [...]
      - Option C: [description] - Pros: [...] Cons: [...]
   
   ### Decision
   **Chosen**: [Option X]
   **Rationale**: [Why this option best fits the context]
   **Trade-offs accepted**: [Known downsides we're accepting]
   **Confidence**: [HIGH if verified, MEDIUM if offline-based]
   ```

   **Execute research in parallel when possible**:
   - Independent technical questions can be researched simultaneously
   - Dependent questions (e.g., "which database" before "which ORM") must be sequential
   - Group related questions to reduce redundant searches

   **Research scope guidelines**:
   - Focus on decisions that impact architecture or are hard to change later
   - Skip research for well-established patterns already in the codebase
   - Always check constitution for mandated technology choices first

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update**:
   - Update `.github/copilot-instructions.md` with new technology stack
   - Add only new technology from current plan under "Active Technologies" section
   - Preserve manual additions and existing content
   - Format: `- Technology Name (component) (feature-reference)`

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
