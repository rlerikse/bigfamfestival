---
description: Create or update the feature specification from a natural language feature description.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## 📋 What This Command Does

**Purpose**: Transform natural language feature description into structured Spec-Kit specification.

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md#the-spec-kit-workflow)):
- **Phase 0**: Specification creation (WHAT the feature does, WHY it's needed)
- **No implementation details**: Focus on user needs, not technical solutions
- **Outputs**: spec.md, requirements checklist, feature branch

**This command will**:
1. **Create feature branch** (auto-numbered, e.g., 002-user-auth)
2. **Generate spec.md** (requirements, user stories, acceptance criteria)
3. **Validate quality** (completeness check, clarification questions if needed)
4. **Create checklist** (requirements validation checklist)

**Why use this?**
- ✅ Consistent specification structure across features
- ✅ No implementation details leak into requirements
- ✅ Independent user stories (MVP-first delivery)
- ✅ Quality validation before planning begins

**What happens next**: After spec complete, run `/speckit.plan` to generate implementation design.

---

## Outline

The text the user typed after `/speckit.specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

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

Given that feature description, do this:

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 STEP 1: BRANCH SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyzing feature description to generate branch name...
```

1. **Generate a concise short name** (2-4 words) for the branch:
   - Analyze the feature description and extract the most meaningful keywords
   - Create a 2-4 word short name that captures the essence of the feature
   - Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
   - Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)
   - Keep it concise but descriptive enough to understand the feature at a glance
   - Examples:
     - "I want to add user authentication" → "user-auth"
     - "Implement OAuth2 integration for the API" → "oauth2-api-integration"
     - "Create a dashboard for analytics" → "analytics-dashboard"
     - "Fix payment processing timeout bug" → "fix-payment-timeout"

**Show user**:
```
✅ Generated short name: [short-name]
```

2. **Check for existing branches before creating new one**:
   
**Show user**:
```
🔍 Checking for existing branches with this name...
```
   
   a. First, fetch all remote branches to ensure we have the latest information:
      ```bash
      git fetch --all --prune
      ```
   
   b. Find the highest feature number across all sources for the short-name:
      - Remote branches: `git ls-remote --heads origin | grep -E 'refs/heads/[0-9]+-<short-name>$'`
      - Local branches: `git branch | grep -E '^[* ]*[0-9]+-<short-name>$'`
      - Specs directories: Check for directories matching `specs/[0-9]+-<short-name>`
   
   c. Determine the next available number:
      - Extract all numbers from all three sources
      - Find the highest number N
      - Use N+1 for the new branch number
   
   d. Run the script `.specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS"` with the calculated number and short-name:
      - Pass `--number N+1` and `--short-name "your-short-name"` along with the feature description
      - Bash example: `.specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS" --json --number 5 --short-name "user-auth" "Add user authentication"`
      - PowerShell example: `.specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS" -Json -Number 5 -ShortName "user-auth" "Add user authentication"`
   
   **IMPORTANT**:
   - Check all three sources (remote branches, local branches, specs directories) to find the highest number
   - Only match branches/directories with the exact short-name pattern
   - If no existing branches/directories found with this short-name, start with number 1
   - You must only ever run this script once per feature
   - The JSON is provided in the terminal as output - always refer to it to get the actual content you're looking for
   - The JSON output will contain BRANCH_NAME and SPEC_FILE paths
   - For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot")

**Show user**:
```
✅ Step 1 Complete: Branch Created

**Branch**: [branch-name]
**Spec Directory**: specs/[number]-[short-name]/
**Spec File**: specs/[number]-[short-name]/spec.md

**Next**: Generating specification content...
```

3. Load `.specify/templates/spec-template.md` to understand required sections.

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

5. Write the specification to SPEC_FILE using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) while preserving section order and headings.

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

7. **Update workspace context**: After spec is successfully created, run `/speckit.context` to update workspace context files for GitHub Copilot awareness.

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
