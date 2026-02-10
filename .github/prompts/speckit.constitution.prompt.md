---
description: Manage project constitution - view, audit, generate, or update based on project conventions
---

# /speckit.constitution - Constitution Management

**Purpose**: Manage the project constitution by viewing, auditing against conventions, generating from project analysis, or updating with interactive fixes.

---

## Arguments

| Argument | Description |
|----------|-------------|
| (none) | View current constitution with summary |
| `--audit` | Compare constitution vs current conventions, show drift |
| `--generate` | Generate constitution from project conventions (interactive) |
| `--update` | Apply fixes interactively, re-audit to confirm |
| `--diff` | Show differences between constitution and detected conventions |

**Examples**:
- `/speckit.constitution` - View current constitution
- `/speckit.constitution --audit` - Audit constitution against codebase
- `/speckit.constitution --generate` - Generate new constitution from conventions
- `/speckit.constitution --update` - Fix drift interactively

---

## 📋 What This Command Does

**Purpose**: Ensure constitution accurately reflects and enforces project conventions.

**Why constitution matters**:
- Constitution defines non-negotiable quality gates
- `/speckit.analyze` and `/speckit.validate` check against constitution
- Drift between constitution and reality causes false positives/negatives
- Constitution should evolve WITH the project, not be static

**This command will**:
1. **View mode**: Display current constitution with section summary
2. **Audit mode**: Analyze codebase, compare to constitution, show gaps
3. **Generate mode**: Create constitution from detected conventions
4. **Update mode**: Interactive fixes for detected drift

---

## Execution Flow

### Mode 1: View (Default - No Arguments)

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📜 PROJECT CONSTITUTION                                     │
├─────────────────────────────────────────────────────────────┤
│ Location: .specify/memory/constitution.md                   │
│ Version: 0.8.0                                              │
│ Last Modified: [date from git]                              │
├─────────────────────────────────────────────────────────────┤
│ SECTIONS:                                                   │
│ I.   Contract-First API Design                              │
│ II.  Observability & Tracing                                │
│ III. Postgres Safety & Data Contracts                       │
│ IV.  Documentation & Data Model Discipline                  │
│ V.   PII Data Handling & Logging                            │
│ VI.  [Additional sections...]                               │
├─────────────────────────────────────────────────────────────┤
│ COMMANDS:                                                   │
│ • /speckit.constitution --audit    Check for drift          │
│ • /speckit.constitution --generate Create from conventions  │
│ • /speckit.constitution --update   Fix drift interactively  │
└─────────────────────────────────────────────────────────────┘
```

**If no constitution exists**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  NO CONSTITUTION FOUND                                   │
├─────────────────────────────────────────────────────────────┤
│ Location checked: .specify/memory/constitution.md           │
│                                                              │
│ A constitution defines your project's quality gates.        │
│ Without one, /speckit.analyze and /speckit.validate         │
│ cannot enforce standards.                                   │
│                                                              │
│ OPTIONS:                                                    │
│ [1] Generate from project conventions (recommended)         │
│ [2] Install base template (customize manually)              │
│                                                              │
│ Enter choice [1/2]:                                         │
└─────────────────────────────────────────────────────────────┘
```

If [1]: Run `--generate` flow
If [2]: Download base template from central repo

---

### Mode 2: Audit (`--audit`)

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 CONSTITUTION AUDIT                                       │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Analyzing codebase for actual conventions                 │
│ • Comparing detected patterns to constitution               │
│ • Identifying gaps and drift                                │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • Constitution drift causes incorrect /speckit.analyze      │
│ • Rules that don't match reality get ignored                │
│ • Missing rules let bad patterns slip through               │
└─────────────────────────────────────────────────────────────┘
```

**Step 1: Detect Project Conventions**

Run convention detection (similar to `/speckit.retro --conventions`):

```bash
# Detect tech stack
TECH_STACK=()

# Language detection
[ -f "tsconfig.json" ] && TECH_STACK+=("TypeScript")
[ -f "package.json" ] && TECH_STACK+=("Node.js")
[ -f "requirements.txt" ] || [ -f "pyproject.toml" ] && TECH_STACK+=("Python")
[ -f "go.mod" ] && TECH_STACK+=("Go")
[ -f "pom.xml" ] || [ -f "build.gradle" ] && TECH_STACK+=("Java")

# Framework detection
grep -q '"express"' package.json 2>/dev/null && TECH_STACK+=("Express.js")
grep -q '"@nestjs/core"' package.json 2>/dev/null && TECH_STACK+=("NestJS")
grep -q '"react"' package.json 2>/dev/null && TECH_STACK+=("React")
grep -q '"fastapi"' requirements.txt 2>/dev/null && TECH_STACK+=("FastAPI")

# Database detection
grep -q '"pg"' package.json 2>/dev/null && TECH_STACK+=("PostgreSQL")
grep -q '"mysql2"' package.json 2>/dev/null && TECH_STACK+=("MySQL")
grep -q '"mongodb"' package.json 2>/dev/null && TECH_STACK+=("MongoDB")
grep -q '"redis"' package.json 2>/dev/null && TECH_STACK+=("Redis")

# Testing detection
[ -f "jest.config.js" ] || [ -f "jest.config.ts" ] && TECH_STACK+=("Jest")
[ -f "vitest.config.ts" ] && TECH_STACK+=("Vitest")
[ -f "pytest.ini" ] || [ -f "pyproject.toml" ] && TECH_STACK+=("Pytest")

# API style detection
[ -d "src/controllers" ] || [ -d "src/routes" ] && TECH_STACK+=("REST API")
grep -q '"@nestjs/graphql"' package.json 2>/dev/null && TECH_STACK+=("GraphQL")
[ -f "*.proto" ] && TECH_STACK+=("gRPC")

# Code quality detection
[ -f ".eslintrc.js" ] || [ -f "eslint.config.js" ] && TECH_STACK+=("ESLint")
[ -f ".prettierrc" ] && TECH_STACK+=("Prettier")
[ -f ".husky" ] && TECH_STACK+=("Husky (git hooks)")
```

**Step 2: Parse Constitution**

Extract rules from existing constitution:
```javascript
// Parse constitution.md sections
const constitution = fs.readFileSync('.specify/memory/constitution.md', 'utf8');
const sections = constitution.split(/^## /m).slice(1);

const rules = sections.map(section => {
  const [title, ...content] = section.split('\n');
  return {
    title: title.trim(),
    hasMUST: content.join('\n').includes('MUST'),
    hasSHOULD: content.join('\n').includes('SHOULD'),
    technologies: extractTechReferences(content.join('\n'))
  };
});
```

**Step 3: Compare and Show Drift**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CONSTITUTION AUDIT RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETECTED CONVENTIONS:
├── Language: TypeScript, Node.js
├── Framework: NestJS
├── Database: PostgreSQL, Redis
├── Testing: Jest
├── Linting: ESLint, Prettier
└── API Style: REST API

CONSTITUTION COVERAGE:
┌─────────────────────────────────────────────────────────────┐
│ Technology          │ In Constitution? │ Status            │
├─────────────────────────────────────────────────────────────┤
│ TypeScript          │ ✅ Yes          │ Covered           │
│ PostgreSQL          │ ✅ Yes          │ Covered           │
│ Redis               │ ❌ No           │ ⚠️  MISSING        │
│ NestJS              │ ❌ No           │ ⚠️  MISSING        │
│ Jest                │ ✅ Yes          │ Covered           │
└─────────────────────────────────────────────────────────────┘

DRIFT DETECTED:
┌─────────────────────────────────────────────────────────────┐
│ # │ Issue                           │ Severity │ Fix       │
├─────────────────────────────────────────────────────────────┤
│ 1 │ Redis used but no caching rules │ MEDIUM   │ Add rules │
│ 2 │ NestJS patterns not documented  │ LOW      │ Add rules │
│ 3 │ Swagger mentioned but not found │ LOW      │ Remove    │
└─────────────────────────────────────────────────────────────┘

CONSTITUTION RULES NOT IN USE:
• Section III references Swagger/OpenAPI but no swagger.json found
• Consider removing or updating to match actual API documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
• Coverage: 75% (3/4 technologies have rules)
• Drift issues: 3 (1 MEDIUM, 2 LOW)
• Unused rules: 1

NEXT STEPS:
Run /speckit.constitution --update to fix drift interactively
```

---

### Mode 3: Generate (`--generate`)

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🏗️  CONSTITUTION GENERATOR                                  │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Analyzing project structure and dependencies              │
│ • Detecting coding patterns and conventions                 │
│ • Generating constitution rules from findings               │
│ • Presenting for your review and customization              │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • Constitution should reflect YOUR project's standards      │
│ • Auto-detection ensures rules match reality                │
│ • You control what becomes a "rule" vs "suggestion"         │
└─────────────────────────────────────────────────────────────┘
```

**Step 1: Deep Convention Analysis**

```
🔍 Analyzing project conventions...

[████████████████████████████████████████] 100%

DETECTED CONVENTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECH STACK:
├── Language:   TypeScript 5.3.0 (strict mode)
├── Runtime:    Node.js 20.x
├── Framework:  NestJS 10.x
├── Database:   PostgreSQL 14+ (via TypeORM)
├── Cache:      Redis 7.x
├── Testing:    Jest + Supertest
└── API Docs:   OpenAPI 3.0 (via @nestjs/swagger)

FILE PATTERNS:
├── Controllers:  src/**/*.controller.ts (12 files)
├── Services:     src/**/*.service.ts (18 files)
├── Entities:     src/**/*.entity.ts (8 files)
├── DTOs:         src/**/*.dto.ts (24 files)
├── Tests:        src/**/*.spec.ts (45 files)
└── Migrations:   migrations/*.ts (6 files)

ARCHITECTURAL PATTERNS DETECTED:
├── ✅ Repository pattern (entities separate from services)
├── ✅ DTO validation (class-validator decorators)
├── ✅ Dependency injection (NestJS modules)
├── ✅ Layered architecture (controller → service → repository)
└── ✅ Database migrations (TypeORM migrations)

CODE QUALITY:
├── Linting:      ESLint with @typescript-eslint
├── Formatting:   Prettier (tabWidth: 2, singleQuote: true)
├── Git Hooks:    Husky + lint-staged
└── Coverage:     Jest with 80% threshold
```

**Step 2: Interactive Rule Selection**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PROPOSED CONSTITUTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Review each proposed rule. Toggle with number, or:
[A] Accept all  [R] Reject all  [D] Done reviewing

┌─────────────────────────────────────────────────────────────┐
│ # │ Rule                                    │ Include?      │
├─────────────────────────────────────────────────────────────┤
│ 1 │ Contract-First API Design               │ ✅ Yes        │
│   │ All APIs MUST have OpenAPI specs first  │               │
├─────────────────────────────────────────────────────────────┤
│ 2 │ TypeScript Strict Mode                  │ ✅ Yes        │
│   │ All code MUST compile with strict: true │               │
├─────────────────────────────────────────────────────────────┤
│ 3 │ DTO Validation                          │ ✅ Yes        │
│   │ All endpoints MUST validate input DTOs  │               │
├─────────────────────────────────────────────────────────────┤
│ 4 │ Repository Pattern                      │ ✅ Yes        │
│   │ Database access MUST use repository     │               │
├─────────────────────────────────────────────────────────────┤
│ 5 │ Test Coverage 80%                       │ ✅ Yes        │
│   │ All features MUST have ≥80% coverage    │               │
├─────────────────────────────────────────────────────────────┤
│ 6 │ Redis Caching Patterns                  │ ❓ Review     │
│   │ Cache SHOULD use TTL, MUST handle miss  │               │
├─────────────────────────────────────────────────────────────┤
│ 7 │ PII Data Handling                       │ ✅ Yes        │
│   │ PII MUST NOT appear in logs             │               │
├─────────────────────────────────────────────────────────────┤
│ 8 │ Database Migrations                     │ ✅ Yes        │
│   │ Schema changes MUST use migrations      │               │
└─────────────────────────────────────────────────────────────┘

Toggle rule (1-8), [A]ccept all, or [D]one: 
```

**Step 3: Customize Rules**

For each ❓ Review item:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CUSTOMIZE RULE: Redis Caching Patterns
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETECTED USAGE:
• Redis client in: src/cache/redis.service.ts
• Cache decorators in: 3 controllers
• No explicit TTL policy found

PROPOSED RULE:
┌─────────────────────────────────────────────────────────────┐
│ ## Redis Caching                                            │
│                                                             │
│ All Redis cache operations SHOULD specify TTL.             │
│ Cache misses MUST fall back to database gracefully.        │
│ Cache keys MUST follow pattern: {entity}:{id}:{field}      │
└─────────────────────────────────────────────────────────────┘

OPTIONS:
[A] Accept as proposed
[E] Edit rule text
[M] Change SHOULD to MUST (stricter)
[S] Skip this rule (don't include)

Choice: 
```

**Step 4: Generate Constitution File**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CONSTITUTION GENERATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Location: .specify/memory/constitution.md
Sections: 8
Rules: 24 (18 MUST, 6 SHOULD)

SECTIONS CREATED:
I.   Contract-First API Design
II.  TypeScript Standards
III. Database & Repository Pattern
IV.  Caching Strategy
V.   Testing Requirements
VI.  PII & Security
VII. Documentation
VIII. Development Workflow

NEXT STEPS:
1. Review: .specify/memory/constitution.md
2. Edit any rules as needed
3. Commit: git add .specify/ && git commit -m "Add project constitution"
4. Validate: /speckit.constitution --audit (should show 100% coverage)
```

---

### Mode 4: Update (`--update`)

**Prerequisite**: Run `--audit` first (or will run automatically)

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 CONSTITUTION UPDATE                                      │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Running audit to detect current drift                     │
│ • Presenting each issue for your decision                   │
│ • Applying approved fixes                                   │
│ • Re-auditing to confirm resolution                         │
└─────────────────────────────────────────────────────────────┘
```

**Step 1: Show Drift Issues**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 DRIFT ISSUES TO RESOLVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ISSUE 1 of 3: Missing Redis Rules
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Severity: MEDIUM
Problem: Redis is used in codebase but no constitution rules exist

DETECTED USAGE:
• src/cache/redis.service.ts - Redis client wrapper
• src/dealers/dealers.controller.ts - @Cacheable decorator
• src/settings/settings.service.ts - Manual cache.get/set

SUGGESTED FIX:
Add new section to constitution:

┌─────────────────────────────────────────────────────────────┐
│ ## IV. Caching Strategy                                     │
│                                                             │
│ All Redis cache operations MUST specify TTL appropriate     │
│ to the data type. Cache misses MUST fall back to the       │
│ primary data source gracefully without errors.              │
│                                                             │
│ Cache key format: `{service}:{entity}:{identifier}`         │
│                                                             │
│ Rationale: Consistent caching prevents stale data and      │
│ ensures graceful degradation when cache is unavailable.     │
└─────────────────────────────────────────────────────────────┘

OPTIONS:
[A] Apply this fix
[E] Edit before applying
[S] Skip (don't fix this issue)
[V] View full constitution for context

Choice: 
```

**Step 2: Apply Fixes**

For each accepted fix:
```bash
# Insert new section at appropriate location
# Or modify existing section
# Track all changes for summary
```

**Step 3: Re-Audit**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 RE-AUDITING AFTER FIXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running audit on updated constitution...

BEFORE:
• Coverage: 75%
• Drift issues: 3

AFTER:
• Coverage: 100% ✅
• Drift issues: 0 ✅

CHANGES APPLIED:
1. ✅ Added Section IV: Caching Strategy
2. ✅ Added Section V: NestJS Module Patterns
3. ✅ Removed obsolete Swagger reference

CONSTITUTION UPDATED SUCCESSFULLY

Next: Commit changes
  git add .specify/memory/constitution.md
  git commit -m "chore(constitution): Update to match current conventions"
```

---

## Edge Cases

### EC-001: No Codebase (Empty Repo)

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  EMPTY OR MINIMAL CODEBASE                               │
├─────────────────────────────────────────────────────────────┤
│ Cannot detect conventions - not enough code to analyze.     │
│                                                              │
│ OPTIONS:                                                    │
│ [1] Start with base constitution template                   │
│ [2] Answer questions to generate constitution               │
│ [3] Skip constitution for now                               │
└─────────────────────────────────────────────────────────────┘
```

If [2] - Interactive questionnaire:
```
What is your primary language? [typescript/python/go/java]: 
What database will you use? [postgresql/mysql/mongodb/none]:
What API style? [rest/graphql/grpc]:
What testing framework? [jest/vitest/pytest/none]:
```

### EC-002: Existing Constitution Conflict

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  CONSTITUTION ALREADY EXISTS                             │
├─────────────────────────────────────────────────────────────┤
│ Found: .specify/memory/constitution.md                      │
│ Version: 0.8.0                                              │
│ Sections: 8                                                 │
│                                                              │
│ OPTIONS:                                                    │
│ [A] Audit existing (compare to conventions)                 │
│ [M] Merge (keep existing + add detected)                    │
│ [O] Overwrite (replace with generated)                      │
│ [C] Cancel                                                  │
└─────────────────────────────────────────────────────────────┘
```

### EC-003: Polyglot Repository

```
┌─────────────────────────────────────────────────────────────┐
│ 🌐 MULTIPLE LANGUAGES DETECTED                              │
├─────────────────────────────────────────────────────────────┤
│ This repository contains multiple languages:                │
│ • TypeScript (frontend/) - 245 files                        │
│ • Python (backend/) - 89 files                              │
│ • Go (tools/) - 12 files                                    │
│                                                              │
│ APPROACH:                                                   │
│ [1] Single constitution (unified rules)                     │
│ [2] Separate sections per language                          │
│ [3] Focus on primary language (TypeScript)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Constitution Template Structure

Generated constitutions follow this structure:

```markdown
# [Project Name] Constitution

<!-- 
Version: 1.0.0
Generated: [date]
Last Audit: [date]
-->

## I. [First Principle]

[Description of the principle]

[Specific rules with MUST/SHOULD/MAY]

Rationale: [Why this matters]

## II. [Second Principle]

...

---

## Governance

### Amendment Process
1. Propose change via PR to constitution.md
2. Run /speckit.constitution --audit to verify
3. Require 2 maintainer approvals
4. Update version in header

### Audit Schedule
- Run /speckit.constitution --audit quarterly
- Run after major dependency updates
- Run when adding new technologies
```

---

## Integration with Other Commands

| Command | How it uses Constitution |
|---------|-------------------------|
| `/speckit.analyze` | Validates spec/plan against constitution rules |
| `/speckit.validate` | Checks implementation follows constitution |
| `/speckit.implement` | References constitution during code generation |
| `/speckit.retro` | Extracts conventions that could become constitution rules |

---

Note: This command bridges the gap between detected conventions (`/speckit.retro --conventions`) and enforced rules (constitution). Regular audits ensure the constitution stays relevant as the project evolves.
