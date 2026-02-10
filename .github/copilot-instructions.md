# GitHub Copilot Instructions - bigfamfestival

This repository uses Spec-Kit for specification-driven development.

## Critical: Prompt Execution Rules

**BEFORE executing ANY `/speckit.*` command:**

1. **STOP** - Do not proceed based on general knowledge
2. **READ** - Open and read the entire `.github/prompts/speckit.{command}.prompt.md` file
3. **FOLLOW** - Execute the prompt's workflow EXACTLY as written, step by step
4. **DO NOT** batch, skip, or combine steps that the prompt defines as sequential/interactive

**Violations to avoid:**
- Improvising workflows instead of reading the prompt
- Batching steps that should be interactive (per-feature, per-item)
- Presenting custom options when the prompt defines specific options
- Assuming you know the workflow without reading the prompt file

**If a prompt says "for each X, do Y" - that means STOP after each X and wait for user input before proceeding to the next X.**

## Critical Constraint: User Decision Approval

**NEVER assume user decisions - ALWAYS prompt for confirmation.**

IF there is EVER a decision required to be made by the user:
- DO NOT assume what the user wants
- ALWAYS prompt the user with clear options
- WAIT for explicit user response before proceeding
- Feel free to suggest your recommendation
- But NEVER proceed without user confirmation

This applies to ALL decisions including:
- Which files to modify or create
- Implementation approach choices
- Technology/library selections
- Architecture decisions
- Configuration changes
- Feature scope interpretations

## Enterprise Context

For specifications across all repositories, reference:
- **All Specs**: https://github.com/rlerikse/es-spec-kit-context/blob/sync/context/workspace/all-specs.md
- **Conventions**: https://github.com/rlerikse/es-spec-kit-context/blob/sync/context/workspace/all-conventions.md
- **Repo Index**: https://github.com/rlerikse/es-spec-kit-context/blob/sync/context/workspace/repo-index.json

When asked about features in other repositories, check the enterprise context first.

## Cross-Repository Context (IMPORTANT)

**Before implementing any feature**, check cross-repo specs:

- `.specify/workspace/all-specs.md` - Index of all specs across ALL repositories
- `.specify/workspace/all-conventions.md` - Aggregated coding conventions
- `.specify/workspace/repo-index.json` - Structured repo/spec metadata

When a requested feature resembles an existing spec in another repo, reference that implementation for consistency.

**Multi-Repository Features**:
Features spanning multiple repositories (frontend + backend + BFF) will have MULTIPLE SPECS:
- Each repository maintains its own spec documenting its layer (UI spec, API spec, BFF spec)
- Specs reference each other via "Related Specifications" section
- Specs may share the same Jira ticket but serve different purposes
- DO NOT merge specs from different repos - they are complementary, not duplicates

To refresh cross-repo context: Push changes to trigger sync workflow (sync-spec-context.yml)

## Constitution

See: `.specify/memory/constitution.md` for non-negotiable quality gates.

All code MUST comply with the constitution.

## Local Specifications

See: `specs/` directory for this repository's feature specifications.

## Creating New Features

Use Spec-Kit workflow (13 commands available):

**Quick Start (simple features)**:
- `/speckit.quickstart` - Combined spec+plan+tasks in one step

**Full Workflow (complex features)**:
1. `/speckit.specify` - Create specification
2. `/speckit.clarify` - Resolve ambiguities
3. `/speckit.plan` - Generate implementation plan
4. `/speckit.tasks` - Break down into tasks
5. `/speckit.analyze` - Validate against constitution (includes pre-PR check)
6. `/speckit.implement` - Execute implementation

**Constitution & Quality**:
- `/speckit.constitution` - View, audit, generate, or update constitution
- `/speckit.validate` - Validate spec structure and implementation

**Utilities**:
- `/speckit.epic` - Epic status dashboard (queries Jira)
- `/speckit.retro` - Retroactive documentation + convention extraction
- `/speckit.checklist` - Generate quality checklists
- `/speckit.report` - Generate status reports

## Templates

- Spec: `.specify/templates/spec-template.md`
- Plan: `.specify/templates/plan-template.md`
- Tasks: `.specify/templates/tasks-template.md`

