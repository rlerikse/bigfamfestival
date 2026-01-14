---
description: Generate retroactive specification documentation for already-implemented features by analyzing existing code.
---

# /speckit.retro - Create Retroactive Specification

**Purpose**: Generate a specification document for an already-implemented feature by analyzing existing code.

---

## Trigger

```
/speckit.retro "Feature name or description"
```

**Examples**:
- `/speckit.retro "authentication system"`
- `/speckit.retro "music player"`
- `/speckit.retro "shopping cart and checkout"`

---

## Context Required

Before executing, load:
1. **Constitution**: `.specify/memory/constitution.md`
2. **Spec Template**: `.specify/templates/spec-template.md` (if exists)
3. **Existing Specs**: `specs/*/spec.md` (for numbering and format reference)
4. **Type Definitions**: `src/types/index.ts` or equivalent

---

## Execution Flow

### Phase 1: Feature Discovery

1. **Identify relevant source files** based on the feature description:
   - Search for related components, hooks, stores, services
   - Find associated types/interfaces
   - Locate API endpoints or Cloud Functions
   - Identify related configuration files

2. **Map the feature boundary**:
   - What components belong to this feature?
   - What state management does it use?
   - What external services does it integrate with?
   - What data models does it operate on?

### Phase 2: Code Analysis

For each identified file, extract:

1. **Functional capabilities** - What does the code actually DO?
2. **User interactions** - What can users accomplish?
3. **Data flow** - How does data move through the system?
4. **Edge cases handled** - What error states and boundaries exist?
5. **Integration points** - What other features/services does it connect to?

### Phase 3: Specification Generation

Create `specs/[NNN]-[feature-slug]/spec.md` with:

```markdown
# [Feature Name] - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)
**Created**: [DATE]
**Source Analysis**: [List of primary files analyzed]

---

## Overview

[2-3 sentence description of what this feature does, derived from code analysis]

---

## User Stories

### User Story 1 - [Primary Capability] (Priority: P0 - Implemented)

**As a** [user type],
**I want to** [action derived from code],
**So that** [benefit inferred from functionality].

**Acceptance Criteria** (Verified in Implementation):
- [x] [Criterion derived from actual code behavior]
- [x] [Criterion derived from actual code behavior]

**Implementation Reference**: `[file path]`

[Repeat for each major capability discovered]

---

## Functional Requirements

### [Category]

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | [Requirement derived from code] | ✅ Implemented | `[file:line]` |
| FR-002 | [Requirement derived from code] | ✅ Implemented | `[file:line]` |

[Group requirements by logical category]

---

## Data Model

[Document actual TypeScript interfaces/types used]

```typescript
// From src/types/index.ts (or relevant file)
interface [TypeName] {
  // Actual interface definition
}
```

**Firestore Collections** (if applicable):
- `[collection_name]`: [Description of document structure]

---

## Success Criteria

| ID | Criterion | Measurement | Status |
|----|-----------|-------------|--------|
| SC-001 | [Measurable outcome] | [How to verify] | ✅ Met |

---

## Edge Cases & Error Handling

[Document error handling patterns found in code]

| Scenario | Handling | Location |
|----------|----------|----------|
| [Edge case] | [How code handles it] | `[file:line]` |

---

## Integration Points

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| [Firebase Auth, Stripe, etc.] | [How integrated] | [Why] |

---

## Implementation Notes

### Architecture Decisions (Inferred)
- [Decision evident from code structure]
- [Pattern choices made]

### Key Files
- `[path/to/file.ts]` - [Purpose]
- `[path/to/file.ts]` - [Purpose]

### Dependencies
- [npm packages or internal modules this feature requires]

---

## Change History

| Date | Version | Change | Reference |
|------|---------|--------|-----------|
| [Original implementation date if known] | 1.0.0 | Initial implementation | Retroactive spec |
| [DATE] | - | Retroactive specification created | This document |
```

### Phase 4: Validation

1. **Cross-reference with existing specs** - Avoid duplicating already-documented features
2. **Verify file paths** - Ensure all referenced files exist
3. **Check type accuracy** - Confirm interfaces match actual code
4. **Constitution compliance** - Verify documented behavior follows principles

---

## Output Requirements

### Directory Structure
```
specs/
  [NNN]-[feature-slug]/
    spec.md              ← Retroactive specification (ONLY this file)
```

**Note**: Retroactive specs create ONLY `spec.md`. Do NOT create:
- `plan.md` (architecture already decided)
- `tasks.md` (implementation complete)
- `contracts/` (unless API documentation needed)

### Numbering Convention
- Check existing `specs/` directories for highest number
- Use next sequential number (e.g., if `008-*` exists, use `009-*`)
- Slug format: lowercase, hyphens, descriptive (e.g., `009-user-notifications`)

### File References
- Use relative paths from repo root
- Include line numbers for specific implementations: `src/hooks/useAudio.ts:L45-L67`
- Link to actual code, not hypothetical locations

---

## Critical Principles

### Document Reality, Don't Prescribe

```
✅ CORRECT: "The player uses useRef to persist the Audio element across renders"
   (Describes what the code actually does)

❌ WRONG: "The player should use useRef to persist the Audio element"
   (Prescriptive - sounds like a requirement, not documentation)
```

### Preserve Working Code

Retroactive specs document existing behavior. They do NOT:
- Suggest refactoring existing code
- Identify "technical debt" to fix
- Propose alternative implementations

If improvements are needed, create a NEW spec:
```
/speckit.specify "Improve [feature] with [enhancement]"
```

### Be Specific About Sources

Every requirement and capability MUST trace to actual code:

```
✅ CORRECT:
| FR-001 | User can pause playback | ✅ | `src/hooks/useAudio.ts:L89` |

❌ WRONG:
| FR-001 | User can pause playback | ✅ | useAudio hook |
```

---

## Example Invocation

**Input**: `/speckit.retro "authentication system"`

**AI Actions**:
1. Search for auth-related files: `useAuthStore`, `Login.tsx`, `SignUp.tsx`, `RequireAuth`
2. Read Firebase Auth configuration
3. Analyze Cloud Functions for auth operations
4. Extract user types from `src/types/index.ts`
5. Document OAuth providers, session management, role-based access
6. Generate `specs/001-authentication-system/spec.md`

**Output**: Complete retroactive specification documenting:
- Firebase Auth integration
- Login/signup flows
- Session persistence
- Role-based access control (RBAC)
- Protected route patterns

---

## Post-Execution

After creating the retroactive spec:

1. **Update specs index** (if `specs/README.md` exists):
   ```markdown
   | 009 | [Feature Name] | ✅ Implemented | Retroactive | [Link] |
   ```

2. **Inform user**:
   ```
   ✅ Created retroactive specification: specs/009-feature-name/spec.md
   
   This documents the existing implementation. To evolve this feature:
   - Quick fixes (<2hrs): Add "Patches" section to plan.md
   - New capabilities: /speckit.specify "Add [enhancement] to [feature]"
   - Major revision: Create spec-v2.md
   ```

3. **Do NOT proceed to `/speckit.plan`** - The feature is already implemented.

---

## When NOT to Use This Command

| Situation | Use Instead |
|-----------|-------------|
| Feature not yet built | `/speckit.specify` |
| Partial implementation | `/speckit.specify` with existing code as reference |
| Want to redesign feature | `/speckit.specify "Redesign [feature]"` |
| Bug fix needed | Patch in existing spec's plan.md OR `/speckit.specify "Fix [issue]"` |
| Adding to existing feature | `/speckit.specify "Add [capability] to [feature]"` |

---

**Version**: 1.0.0
**Last Updated**: January 13, 2026
