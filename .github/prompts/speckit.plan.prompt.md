---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

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

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

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

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

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
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
