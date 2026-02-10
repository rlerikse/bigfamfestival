---
description: Validate Spec-Kit infrastructure health (constitution, templates, prompts, workflows) and identify missing components.
---

# /speckit.validate - Validate Spec-Kit Infrastructure

**Purpose**: Validate that Spec-Kit infrastructure is correctly installed and configured for a repository or workspace, identifying missing components and providing recommendations.

---

## Arguments

| Argument | Description |
|----------|-------------|
| (none) | Full validation with report |
| `--fix` | Auto-remediate missing/broken components |
| `--fix --dry-run` | Preview what would be fixed |
| `--check-version` | Compare local vs canonical versions |
| `--check-version --upgrade` | Upgrade outdated components |
| `--json` | Output results as JSON (for CI) |
| `--quiet` | Minimal output (pass/fail only) |

**Examples**:
- `/speckit.validate` - Full validation
- `/speckit.validate --fix` - Fix missing components automatically
- `/speckit.validate --check-version` - Check for updates
- `/speckit.validate --check-version --upgrade` - Update outdated components

---

## What Gets Validated

| Component | Location | Expected Count |
|-----------|----------|----------------|
| Constitution | `.specify/memory/constitution.md` | 1 file |
| Templates | `.specify/templates/` | 4 files |
| Prompts | `.github/prompts/` | 13 active commands |
| Workflows | `.github/workflows/` | 1 sync workflow |
| Copilot Config | `.github/copilot-instructions.md` | 1 file |

### Template Files (4 Required)

1. `spec-template.md` - Feature specification template
2. `plan-template.md` - Implementation plan template  
3. `tasks-template.md` - Task breakdown template (includes checklists section)
4. `checklist-template.md` - Quality checklist template

### Prompts (13 Active)

| Command | Description |
|---------|-------------|
| `/speckit.analyze` | Validate against constitution |
| `/speckit.checklist` | Generate validation checklists |
| `/speckit.clarify` | Extract ambiguities for clarification |
| `/speckit.constitution` | Manage project constitution |
| `/speckit.epic` | Epic status dashboard (queries Jira) |
| `/speckit.implement` | Execute implementation with safety |
| `/speckit.plan` | Generate implementation plans |
| `/speckit.quickstart` | Create minimal spec quickly |
| `/speckit.report` | Generate status reports |
| `/speckit.retro` | Retroactive specs + convention extraction |
| `/speckit.specify` | Create full specifications |
| `/speckit.tasks` | Generate task breakdowns |
| `/speckit.validate` | Validate infrastructure |

---

## Validation Report Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 SPEC-KIT INFRASTRUCTURE VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Repository: your-repo-name
Type: Single Repository
Date: 2026-02-03

## Constitution
✅ .specify/memory/constitution.md
   Version: v0.8.0
   Lines: 245

## Templates
✅ .specify/templates/spec-template.md
✅ .specify/templates/plan-template.md
✅ .specify/templates/tasks-template.md
✅ .specify/templates/checklist-template.md

## Prompts (13 Active)
✅ speckit.analyze.prompt.md
✅ speckit.checklist.prompt.md
✅ speckit.clarify.prompt.md
✅ speckit.constitution.prompt.md
✅ speckit.epic.prompt.md
✅ speckit.implement.prompt.md
✅ speckit.plan.prompt.md
✅ speckit.quickstart.prompt.md
✅ speckit.report.prompt.md
✅ speckit.retro.prompt.md
✅ speckit.specify.prompt.md
✅ speckit.tasks.prompt.md
✅ speckit.validate.prompt.md

## Workflows
✅ .github/workflows/sync-spec-context.yml

## GitHub Copilot
✅ .github/copilot-instructions.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEALTH SCORE: 100/100 ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Component Checklists

### Constitution Validation

**Check**: `.specify/memory/constitution.md`

- [ ] File exists
- [ ] File is not empty (minimum 100 lines expected)
- [ ] Contains version marker (search for "Version" or "v0.")
- [ ] Contains core sections:
  - Contract-first API design
  - Observability requirements
  - Database/data safety
  - PII handling
  - Architecture patterns
  - Input validation

**Issues to report**:
- ❌ Constitution missing
- ⚠️ Constitution exists but incomplete (< 100 lines)
- ⚠️ Missing version number

### Templates Validation

**Check**: `.specify/templates/`

Expected templates:
- [ ] `spec-template.md` - Feature specification template
- [ ] `plan-template.md` - Implementation plan template
- [ ] `tasks-template.md` - Task breakdown template
- [ ] `checklist-template.md` - Quality checklist template

**Issues to report**:
- ❌ `.specify/templates/` directory missing
- ⚠️ Missing required templates (list which ones)

### Prompts Validation

**Check**: `.github/prompts/`

Expected prompts (13 active):
- [ ] `speckit.analyze.prompt.md` - Constitution validation + pre-PR review
- [ ] `speckit.checklist.prompt.md` - Quality checklist workflow
- [ ] `speckit.clarify.prompt.md` - Clarification workflow
- [ ] `speckit.constitution.prompt.md` - Constitution management
- [ ] `speckit.epic.prompt.md` - Epic status dashboard (queries Jira)
- [ ] `speckit.implement.prompt.md` - Implementation workflow
- [ ] `speckit.plan.prompt.md` - Planning workflow
- [ ] `speckit.quickstart.prompt.md` - Full pre-implementation workflow
- [ ] `speckit.report.prompt.md` - Implementation reporting
- [ ] `speckit.retro.prompt.md` - Retroactive documentation + conventions
- [ ] `speckit.specify.prompt.md` - Specification workflow
- [ ] `speckit.tasks.prompt.md` - Task breakdown workflow
- [ ] `speckit.validate.prompt.md` - Validation workflow (this file)

**Issues to report**:
- ❌ `.github/prompts/` directory missing
- ⚠️ Missing prompts (list which ones)

### Workflows Validation

**Check**: `.github/workflows/`

Expected workflows:
- [ ] `sync-spec-context.yml` - Auto-sync specs to central repo

**Issues to report**:
- ⚠️ Missing sync workflow (context won't sync automatically)

---

## Auto-Remediation Mode (`--fix`)

When `--fix` is specified, automatically download missing components:

```
🔧 **Auto-Remediation Mode**

Scanning for missing Spec-Kit components...

**Missing Components**:

| Component | Status | Action |
|-----------|--------|--------|
| .specify/memory/constitution.md | ❌ Missing | Will download from canonical |
| .specify/templates/spec-template.md | ❌ Missing | Will download from canonical |
| .github/prompts/speckit.analyze.prompt.md | ❌ Missing | Will download from canonical |

**Actions to perform**:
1. Download 3 missing files from rlerikse/es-spec-kit-context

**Proceed?** [Y/n]
```

### Auto-Fix Actions

| Issue Type | Auto-Fix Action |
|------------|-----------------|
| Missing constitution | Download from canonical source |
| Missing template | Download from canonical source |
| Missing prompt | Download from canonical source |
| Missing workflow | Download from canonical source |
| Missing directory | Create directory structure |

---

## Version Checking Mode (`--check-version`)

Compare local files against canonical source:

```
🔄 **Version Check**

Comparing local Spec-Kit installation against canonical source...
Source: rlerikse/es-spec-kit-context (main branch)

| Component | Local | Canonical | Status |
|-----------|-------|-----------|--------|
| constitution.md | v0.7.0 | v0.8.0 | ⚠️ Outdated |
| spec-template.md | 2026-01-12 | 2026-01-29 | ⚠️ Outdated |
| speckit.specify.prompt.md | hash:abc123 | hash:abc123 | ✅ Current |
| speckit.quickstart.prompt.md | - | hash:def456 | ❌ Missing |

**Summary**:
- 1 component current ✅
- 2 components outdated ⚠️
- 1 component missing ❌

**Upgrade available**: Run `/speckit.validate --check-version --upgrade` to update
```

---

## Health Score Calculation

| Component | Weight | Scoring |
|-----------|--------|---------|
| Constitution | 30% | Present + v0.8.0+ = 30, present but outdated = 20, missing = 0 |
| Templates | 20% | All 4 required = 20, missing any = proportional (5 per template) |
| Prompts | 30% | All 13 active = 30, missing any = proportional (~2.3 per prompt) |
| Workflows | 10% | sync-spec-context.yml present = 10 |
| Copilot Config | 10% | copilot-instructions.md present = 10 |

**Health Score Interpretation**:
- 90-100: ✅ Healthy - Fully configured
- 70-89: ⚠️ Needs Attention - Missing optional components
- 50-69: 🔶 Degraded - Missing important components
- <50: ❌ Critical - Major infrastructure missing

---

## JSON Output (for CI)

```json
{
  "timestamp": "2026-02-03T10:00:00Z",
  "repository": "your-repo-name",
  "type": "single_repo",
  "healthScore": 100,
  "status": "healthy",
  "components": {
    "constitution": {"status": "pass", "version": "v0.8.0"},
    "templates": {"status": "pass", "count": 4, "missing": []},
    "prompts": {"status": "pass", "count": 13, "missing": []},
    "workflows": {"status": "pass", "files": ["sync-spec-context.yml"]},
    "copilot": {"status": "pass"}
  },
  "issues": {
    "critical": 0,
    "warnings": 0,
    "info": 0
  }
}
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Constitution missing | Not initialized | Run `/speckit.validate --fix` or `speckit.sh` |
| Templates incomplete | Partial copy (need 4) | Run `/speckit.validate --fix` - all 4 required |
| Prompts incomplete | Partial copy (need 13) | Run `/speckit.validate --fix` - all 13 active required |
| Outdated constitution | New version released | Run `/speckit.validate --check-version --upgrade` |
| No sync workflow | Repo not integrated | Copy `sync-spec-context.yml` from canonical |
| Low health score post-migration | Incomplete installation | Run count verification (see below) |
| Repo fails standalone | Missing files when opened alone | Test portability: open repo without workspace |

### Count Verification Commands

**CRITICAL**: Always verify counts after installation or validation:

```bash
# Prompts: expect exactly 13 active
ls -1 .github/prompts/speckit.*.prompt.md | wc -l
# Expected: 13

# Templates: expect exactly 4
ls -1 .specify/templates/*.md | wc -l  
# Expected: 4

# Constitution: expect exactly 1
ls -1 .specify/memory/constitution.md 2>/dev/null && echo "1" || echo "0"
# Expected: 1
```

**If counts don't match**: Run `/speckit.validate --fix` or manually copy missing files from canonical source.

---

## Integration with Other Commands

**After Validation**:
- Run `speckit.sh` to fix missing infrastructure
- Push changes to trigger sync workflow for cross-repo context updates

**Before Other Commands**:
Run `/speckit.validate` before major operations to ensure infrastructure is ready.

---

**Version**: 2.0.0  
**Last Updated**: February 3, 2026  
**Related Commands**: `/speckit.retro`
