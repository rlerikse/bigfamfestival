---
description: Validate Spec-Kit infrastructure health (constitution, templates, prompts, scripts) and identify missing components.
---

# /speckit.validate - Validate Spec-Kit Infrastructure

**Purpose**: Validate that Spec-Kit infrastructure is correctly installed and configured for a repository or workspace, identifying missing components, configuration issues, and providing recommendations.

---

## 📋 What This Command Does

**Purpose**: Comprehensive health check of Spec-Kit installation across repositories.

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md)):
- **Infrastructure validation**: Check constitution, templates, prompts, scripts
- **Configuration validation**: Verify proper setup for standalone/monorepo use
- **Completeness check**: Identify missing/incomplete components

**This command will**:
1. **Detect context** (standalone repo vs monorepo workspace)
2. **Validate constitution** (exists, complete, versioned)
3. **Check templates** (all 5 required templates present)
4. **Verify prompts** (all 11 Spec-Kit commands available)
5. **Inspect scripts** (bash automation present and executable)
6. **Analyze specs** (existing feature documentation)
7. **Generate report** (pass/fail with remediation guidance)

**Why use this?**
- ✅ Ensures complete installation (no missing components)
- ✅ Detects configuration issues (broken symlinks, outdated versions)
- ✅ Validates portability (repos work standalone)
- ✅ Provides remediation steps (fix broken infrastructure)

**What happens next**: Fix any CRITICAL issues, then use Spec-Kit commands normally.

---

## Trigger

```
/speckit.validate
```

**Examples**:
- `/speckit.validate` - Validate current repository or entire workspace

---

## Context Required

Before executing, load:
1. **Current Directory Context**: Determine if in standalone repo or monorepo workspace
2. **Repository Structure**: Identify all repositories (if monorepo)
3. **Spec-Kit Components**: Check for `.specify/`, `.github/prompts/`, `specs/`

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ ✅ SPEC-KIT VALIDATION WORKFLOW                             │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Detecting repository context (standalone/monorepo)        │
│ • Scanning Spec-Kit infrastructure components               │
│ • Validating configuration and completeness                 │
│ • Generating health report with remediation steps           │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • Missing components → Spec-Kit commands fail               │
│ • Outdated files → Inconsistent behavior                    │
│ • Broken portability → Repos don't work standalone          │
│ • Early detection → Fix before it blocks development        │
│                                                              │
│ VALIDATION SCOPE:                                           │
│ • Constitution (version, completeness)                      │
│ • Templates (5 required files)                              │
│ • Prompts (11 Spec-Kit commands)                            │
│ • Scripts (bash automation)                                 │
│ • Specs (existing features)                                 │
│ • Configuration (proper setup)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Execution Flow

### Phase 0: Context Detection

> **What's Happening**: Determining repository structure and validation scope  
> **Why**: Standalone repos and monorepos have different validation requirements  
> **Output**: List of repositories to validate

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PHASE 0: CONTEXT DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyzing repository structure...
```

1. **Determine Repository Context**:
   - Check current directory structure
   - Look for workspace root indicators (multiple repos in parent directory)
   - Identify if standalone repository or monorepo
   
2. **Identify Repositories to Validate**:
   - **Standalone**: Single repository only
   - **Monorepo**: All repositories under workspace root
   - Exclude: `.git/`, `node_modules/`, build outputs

---

### Phase 1: Repository-Level Validation

For each repository, validate the following components:

#### 1.1 Constitution Validation

**Check**: `.specify/memory/constitution.md`

- [ ] File exists
- [ ] File is not empty (minimum 100 lines expected)
- [ ] Contains version marker (search for "Version" or "v0.")
- [ ] Contains core sections:
  - Contract-first API design
  - Observability requirements
  - Database/data safety
  - PII handling
  - Versioning strategy
  - Architecture patterns
  - Input validation
- [ ] Technology stack documented

**Issues to report**:
- ❌ Constitution missing
- ⚠️ Constitution exists but incomplete (< 100 lines)
- ⚠️ Missing version number
- ⚠️ Missing core sections

#### 1.2 Templates Validation

**Check**: `.specify/templates/`

Expected templates:
- [ ] `spec-template.md` - Feature specification template
- [ ] `plan-template.md` - Implementation plan template
- [ ] `tasks-template.md` - Task breakdown template
- [ ] `checklist-template.md` - Quality checklist template
- [ ] `agent-file-template.md` - AI agent context template (optional)

**Issues to report**:
- ❌ `.specify/templates/` directory missing
- ⚠️ Missing templates (list which ones)
- ℹ️ Extra templates found (non-standard, list them)

#### 1.3 Prompts Validation

**Check**: `.github/prompts/`

Expected prompts:
- [ ] `speckit.specify.prompt.md` - Specification workflow
- [ ] `speckit.clarify.prompt.md` - Clarification workflow
- [ ] `speckit.plan.prompt.md` - Planning workflow
- [ ] `speckit.tasks.prompt.md` - Task breakdown workflow
- [ ] `speckit.analyze.prompt.md` - Constitution validation workflow
- [ ] `speckit.implement.prompt.md` - Implementation workflow
- [ ] `speckit.checklist.prompt.md` - Quality checklist workflow
- [ ] `speckit.constitution.prompt.md` - Constitution management workflow
- [ ] `speckit.retro.prompt.md` - Retroactive documentation workflow
- [ ] `speckit.migrate.prompt.md` - Migration workflow
- [ ] `speckit.validate.prompt.md` - Validation workflow (this file)

**Issues to report**:
- ❌ `.github/prompts/` directory missing
- ⚠️ Missing prompts (list which ones)
- ⚠️ Prompts exist only at workspace level (portability issue)
- ℹ️ Extra prompts found (custom, list them)

#### 1.4 Scripts Validation

**Check**: `.specify/scripts/bash/`

Expected scripts:
- [ ] `common.sh` - Shared utility functions
- [ ] `create-new-feature.sh` - Initialize feature directories
- [ ] `check-prerequisites.sh` - Validate spec completeness
- [ ] `update-agent-context.sh` - Update AI context files

**Validation**:
- Check if scripts are executable (`chmod +x`)
- Check if scripts contain `#!/bin/bash` or `#!/usr/bin/env bash`
- Check for syntax errors (basic validation)

**Issues to report**:
- ❌ `.specify/scripts/bash/` directory missing
- ⚠️ Missing scripts (list which ones)
- ⚠️ Scripts not executable (list which ones need `chmod +x`)
- ⚠️ Scripts missing shebang line

#### 1.5 Specifications Validation

**Check**: `specs/` directory

**Analysis**:
- Count total spec directories
- Check naming convention (NNN-feature-slug format)
- Validate each spec has `spec.md` file
- Check for orphaned directories (no spec.md)
- Identify spec status (✅ Implemented, 📝 Planned, etc.)
- Check for duplicate spec numbers

**Issues to report**:
- ℹ️ `specs/` directory empty (no specs yet)
- ⚠️ Spec directories missing `spec.md` file
- ⚠️ Spec numbering gaps (e.g., 001, 002, 004 - missing 003)
- ⚠️ Duplicate spec numbers
- ⚠️ Non-standard naming (not NNN-feature-slug format)

#### 1.6 GitHub Copilot Instructions Validation

**Check**: `.github/copilot-instructions.md`

**Validation**:
- File exists
- Contains Spec-Kit references
- References constitution path
- Lists Spec-Kit commands
- Doesn't contain broken references (for standalone repos, shouldn't reference `../../`)

**Issues to report**:
- ❌ `.github/copilot-instructions.md` missing
- ⚠️ File exists but doesn't mention Spec-Kit
- ⚠️ Contains workspace-relative paths (portability issue for standalone use)

#### 1.7 Portability Validation

**Test**: Can repository work when opened standalone?

**Checks**:
- All required files exist in repository (not just workspace)
- Constitution exists in repo (not just `../../.specify/memory/`)
- Templates exist in repo (not just `../../.specify/templates/`)
- Prompts exist in repo (not just `../../.github/prompts/`)
- Scripts exist in repo
- No broken references to workspace-level paths

**Issues to report**:
- ❌ Repository depends on workspace-level infrastructure (won't work standalone)
- ⚠️ Mixed: Some infrastructure in repo, some only in workspace
- ✅ Fully portable (all infrastructure in repository)

---

### Phase 2: Workspace-Level Validation (Monorepo Only)

If monorepo context detected:

#### 2.1 Workspace Context Validation

**Check**: `.specify/workspace/`

Expected files:
- [ ] `all-specs.md` - Cross-repo specification index
- [ ] `repo-index.json` - Structured repository metadata

**Validation**:
- Files exist
- Files are up-to-date (check if spec counts match actual specs)
- All repositories indexed
- No references to deleted repositories

**Issues to report**:
- ❌ Workspace context missing
- ⚠️ Workspace context out of date (run `bash scripts/update-workspace-context.sh`)
- ⚠️ Repositories missing from index

#### 2.2 Workspace Scripts Validation

**Check**: `[workspace-root]/scripts/`

Expected scripts:
- [ ] `update-workspace-context.sh` - Generate cross-repo index
- [ ] `install-workspace-hooks.sh` - Git hooks across repos (optional)
- [ ] `watch-workspace.sh` - Monitor all repos (optional)
- [ ] `validate-spec.sh` - Spec validation (optional)

**Issues to report**:
- ⚠️ Workspace scripts missing
- ℹ️ Some optional scripts not present

#### 2.3 Cross-Repository Consistency

**Check**: Compare configurations across repositories

**Analysis**:
- Constitution versions (all repos should use same version)
- Template consistency (detect divergence)
- Prompt consistency (all repos have all prompts)
- Naming conventions (consistent spec numbering patterns)

**Issues to report**:
- ⚠️ Inconsistent constitution versions across repos
- ⚠️ Some repos missing prompts that others have
- ℹ️ Template customizations vary by repo (may be intentional)

---

## Validation Report Format

Generate comprehensive markdown report:

```markdown
# Spec-Kit Validation Report

**Generated**: [timestamp]
**Context**: [Standalone Repository | Monorepo Workspace]
**Repositories Validated**: [count]

---

## Executive Summary

✅ **PASS**: [count] checks passed
⚠️ **WARNING**: [count] issues need attention
❌ **FAIL**: [count] critical issues blocking Spec-Kit usage

**Overall Status**: [HEALTHY | NEEDS ATTENTION | CRITICAL ISSUES]

---

## Repository Validation Results

### [Repository Name 1]

**Location**: `[path]`
**Type**: [Backend | Frontend | Mobile]
**Spec Count**: [N] specifications

#### Constitution
- ✅ File exists (`.specify/memory/constitution.md`)
- ✅ Version: v0.7.0
- ✅ Contains all core sections
- ⚠️ Technology stack section incomplete

#### Templates
- ✅ All 5 templates present
- Templates: spec, plan, tasks, checklist, agent

#### Prompts
- ❌ **CRITICAL**: Prompts missing (`.github/prompts/` not found)
- Missing: All 11 Spec-Kit prompts
- **Impact**: `/speckit.*` commands will not work when repository opened standalone
- **Fix**: Run `/speckit.migrate [repo-name]` to install prompts

#### Scripts
- ✅ All 4 scripts present
- ⚠️ Script `create-new-feature.sh` not executable
- **Fix**: Run `chmod +x .specify/scripts/bash/*.sh`

#### Specifications
- ✅ 6 specifications found
- Specs: 001-opcodes-api, 002-guest-settings, 003-transportation-settings, 004-pdl-settings, 005-geofences, 006-geocoding
- ✅ All specs have spec.md file
- ✅ Sequential numbering (no gaps)

#### GitHub Copilot Instructions
- ✅ File exists (`.github/copilot-instructions.md`)
- ✅ References Spec-Kit workflow
- ✅ No workspace-relative paths

#### Portability
- ⚠️ **PARTIAL**: Repository partially portable
- ❌ Missing repo-level prompts (depends on workspace)
- ✅ Constitution exists in repo
- ✅ Templates exist in repo
- ✅ Scripts exist in repo
- **Risk**: Won't work if opened outside workspace (prompts missing)

**Repository Status**: ⚠️ NEEDS ATTENTION

---

### [Repository Name 2]

[Repeat structure for each repository]

---

## Workspace Validation Results

*(Only for monorepo context)*

#### Workspace Context
- ✅ `all-specs.md` exists and up-to-date
- ✅ `repo-index.json` exists
- ✅ All 4 repositories indexed
- Last updated: 2026-01-13 18:53:49

#### Workspace Scripts
- ✅ `update-workspace-context.sh` present
- ℹ️ Optional scripts not present (watch-workspace.sh, install-workspace-hooks.sh)

#### Cross-Repository Consistency
- ✅ All repositories use constitution v0.7.0
- ⚠️ Repository `dealer-settings-ui` missing prompts
- ⚠️ Repository `fsr-mobile-service` missing prompts
- ✅ Template consistency maintained

---

## Issues Summary

### Critical Issues (❌)

1. **`dealer-settings-ui`**: Prompts directory missing
   - **Impact**: Spec-Kit commands non-functional when repo opened standalone
   - **Fix**: `cd dealer-settings-ui && /speckit.migrate dealer-settings-ui`

2. **`fsr-mobile-service`**: Prompts directory missing
   - **Impact**: Spec-Kit commands non-functional when repo opened standalone
   - **Fix**: `cd fsr-mobile-service && /speckit.migrate fsr-mobile-service`

### Warnings (⚠️)

1. **`fsr-dealer-settings-service`**: Script permissions incorrect
   - **Impact**: Automation scripts cannot execute
   - **Fix**: `chmod +x fsr-dealer-settings-service/.specify/scripts/bash/*.sh`

2. **Workspace**: Some repositories have incomplete portability
   - **Impact**: Repositories may not work when opened individually
   - **Fix**: Run `/speckit.migrate` for each affected repository

### Informational (ℹ️)

1. **Workspace**: Optional scripts not present
   - Not required for basic Spec-Kit functionality
   - Can add later if needed for enhanced workflows

---

## Recommendations

### Immediate Actions Required

1. **Install missing prompts** in all repositories:
   ```bash
   # From workspace root
   /speckit.migrate dealer-settings-ui
   /speckit.migrate fsr-mobile-service
   ```

2. **Fix script permissions**:
   ```bash
   chmod +x fsr-dealer-settings-service/.specify/scripts/bash/*.sh
   ```

### Optional Improvements

1. **Update workspace context**:
   ```bash
   bash scripts/update-workspace-context.sh
   ```

2. **Add optional workspace scripts** for enhanced workflow:
   - `watch-workspace.sh` - Auto-update context on file changes
   - `install-workspace-hooks.sh` - Git hooks for spec validation

3. **Standardize templates** if intentional customization not needed

---

## Next Steps

1. ✅ Fix critical issues (prompts installation)
2. ⚠️ Address warnings (permissions, portability)
3. ℹ️ Consider optional improvements
4. 🔄 Re-run `/speckit.validate` to confirm fixes

---

## Spec-Kit Health Score

**Infrastructure**: 75/100
- Constitution: 100% ✅
- Templates: 100% ✅
- Prompts: 50% ⚠️ (2 of 4 repos missing)
- Scripts: 90% ⚠️ (permission issues)

**Specifications**: 95/100
- Total specs: 8 across 3 repositories
- All specs have spec.md ✅
- Sequential numbering ✅
- No orphaned directories ✅

**Portability**: 60/100
- 2 of 4 repos fully portable ⚠️
- 2 of 4 repos depend on workspace ❌

**Overall Health**: 77/100 - **NEEDS ATTENTION**

---

**Legend**:
- ✅ PASS - Component working correctly
- ⚠️ WARNING - Issue needs attention but not blocking
- ❌ FAIL - Critical issue blocking functionality
- ℹ️ INFO - Informational note, no action required

```

---

## Validation Checklist

### Complete Infrastructure Validation

For each repository:
- [ ] Constitution exists and is valid
- [ ] All required templates present
- [ ] All required prompts present
- [ ] All required scripts present and executable
- [ ] Spec directories follow conventions
- [ ] GitHub Copilot instructions configured
- [ ] Repository is portable (works standalone)

For workspace (monorepo only):
- [ ] Workspace context files exist
- [ ] Workspace context is up-to-date
- [ ] All repositories indexed
- [ ] Workspace scripts present
- [ ] Cross-repo consistency maintained

---

## Error Handling

### Common Issues and Resolutions

| Issue | Cause | Resolution |
|-------|-------|------------|
| Prompts missing | Migration didn't copy prompts | Run `/speckit.migrate [repo]` |
| Scripts not executable | Permissions not set | Run `chmod +x .specify/scripts/bash/*.sh` |
| Workspace context outdated | Specs added but context not updated | Run `bash scripts/update-workspace-context.sh` |
| Constitution missing | Fresh repo never migrated | Run `/speckit.migrate [repo]` |
| Portability issues | Infrastructure only at workspace level | Run `/speckit.migrate [repo]` to copy to repo level |
| Spec numbering gaps | Specs deleted but not renumbered | Intentional or renumber sequentially |

---

## Advanced Validation Options

### Deep Validation Modes (Optional)

**Constitution Deep Scan**:
- Parse constitution markdown
- Validate all required sections present
- Check for version compatibility
- Detect custom extensions

**Template Deep Scan**:
- Compare templates across repositories
- Detect customizations vs. standard
- Validate template structure

**Spec Deep Scan**:
- Parse all spec.md files
- Validate spec structure (user stories, FRs, data models, etc.)
- Check for broken file references
- Validate constitution compliance claims

**Cross-Repo Dependency Analysis**:
- Parse all specs for integration points
- Build dependency graph
- Identify missing cross-repo specs

---

## Output Options

### Interactive Mode

Present validation results interactively:
1. Show summary first
2. Ask if user wants details on specific repository
3. Offer to fix issues automatically (where possible)

### CI/CD Mode (Exit Codes)

```bash
# Exit codes for automation
0 - All checks passed
1 - Warnings present (non-blocking)
2 - Critical issues present (blocking)
```

### JSON Output (Machine-Readable)

```json
{
  "timestamp": "2026-01-13T19:00:00Z",
  "context": "monorepo",
  "repositories": [
    {
      "name": "fsr-dealer-settings-service",
      "path": "fsr-dealer-settings-service",
      "type": "backend",
      "specCount": 6,
      "issues": {
        "critical": 0,
        "warnings": 1,
        "info": 0
      },
      "status": "needs_attention",
      "constitution": {"status": "pass", "version": "v0.7.0"},
      "templates": {"status": "pass", "count": 5},
      "prompts": {"status": "fail", "missing": 11},
      "scripts": {"status": "warning", "executable": false},
      "portable": false
    }
  ],
  "summary": {
    "totalRepos": 4,
    "healthScore": 77,
    "status": "needs_attention",
    "criticalIssues": 2,
    "warnings": 3,
    "info": 1
  }
}
```

---

## Integration with Other Commands

**After Validation**:
- `/speckit.migrate [repo]` - Fix missing infrastructure
- `/speckit.constitution` - Update constitution version
- `bash scripts/update-workspace-context.sh` - Update workspace context

**Before Other Commands**:
Run `/speckit.validate` before major operations to ensure infrastructure is ready.

---

## Examples

### Example 1: Validate Standalone Repository

```
User: /speckit.validate

AI Actions:
1. Detect: Standalone repository (fsr-dealer-settings-service)
2. Check: Constitution (✅), Templates (✅), Prompts (❌), Scripts (⚠️), Specs (✅)
3. Generate report with 1 critical issue (prompts missing)
4. Provide fix: "/speckit.migrate fsr-dealer-settings-service"
```

### Example 2: Validate Entire Monorepo

```
User: /speckit.validate

AI Actions:
1. Detect: Monorepo workspace with 4 repositories
2. Validate each repository individually
3. Validate workspace-level infrastructure
4. Check cross-repo consistency
5. Generate comprehensive report
6. Health score: 77/100 - NEEDS ATTENTION
7. List actionable fixes for all issues
```

### Example 3: Post-Migration Validation

```
User: /speckit.validate

AI Actions:
1. Detect: Repository just migrated
2. Validate: All infrastructure present ✅
3. Check: Scripts executable ✅
4. Test: Portability ✅
5. Generate report: 100% health score
6. Confirm: "Spec-Kit fully configured and ready"
```

---

**Version**: 1.0.0  
**Last Updated**: January 13, 2026  
**Related Commands**: `/speckit.migrate`, `/speckit.constitution`
