---
description: Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## 📋 What This Command Does

**Purpose**: Interactive Q&A to resolve ambiguities in specification BEFORE planning begins.

**According to Spec-Kit Standards** ([SPECKIT.md](../SPECKIT.md#the-spec-kit-workflow)):
- **Optional Phase**: Between specification and planning
- **After /speckit.specify**: Spec created with some unknowns
- **Before /speckit.plan**: Must resolve critical ambiguities

**This command will**:
1. **Scan specification** for ambiguous/underspecified areas
2. **Prioritize unknowns** (by impact on implementation)
3. **Ask targeted questions** (max 10, one at a time, interactive)
4. **Update spec.md** with your answers (eliminates [NEEDS CLARIFICATION] markers)
5. **Validate completeness** (ensure all critical decisions made)

**Why use this?**
- ✅ Reduces planning rework (resolves unknowns before architecture)
- ✅ Interactive Q&A (AI suggests options, you decide)
- ✅ Prioritized questions (most impactful first)
- ✅ Spec updated automatically (answers encoded directly)

**When to skip**:
- Spec has no [NEEDS CLARIFICATION] markers
- Exploratory spike (accept rework risk)
- Clarifications can wait until planning (non-blocking)

**What happens next**: After clarification complete, run `/speckit.plan` to generate implementation design.

---

## Process Improvement Insight (PROJ-1367)

**Lesson Learned**: Detailed Acceptance Criteria in Jira reduces clarification needs.

When the clarify phase discovers critical missing requirements (like partial validation behavior in PROJ-1367), 
it indicates the original Jira ticket lacked sufficient detail. After completing clarification:

**Suggest to user**:
```
💡 JIRA IMPROVEMENT SUGGESTION

This clarification uncovered a critical requirement that wasn't in the original Jira ticket:

"[clarification summary]"

RECOMMENDATION: Update Jira [TICKET-ID] with this requirement to:
• Create audit trail of discovered requirements
• Help future features with similar patterns
• Improve AC quality for the team

Would you like me to suggest Jira AC text to add? (yes/no)
```

**If user says yes**, generate concise AC text suitable for Jira:
```
Suggested Acceptance Criteria for Jira:

AC: [Clear, testable acceptance criterion]
- Given [context]
- When [action]  
- Then [expected outcome]
```

This feedback loop improves future Jira ticket quality, reducing clarification needs over time.

---

## Outline

**Show user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 💬 SPEC-KIT CLARIFICATION WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│ WHAT'S HAPPENING:                                           │
│ • Scanning specification for ambiguous areas                │
│ • Prioritizing questions by implementation impact           │
│ • Interactive Q&A (you decide, AI suggests options)         │
│ • Updating spec.md with your answers                        │
│                                                              │
│ WHY THIS MATTERS:                                           │
│ • Ambiguities in spec → wrong architecture in plan          │
│ • Resolving now → prevents costly rework later              │
│ • Interactive format → you maintain control                 │
│ • Spec updated → planning has clear requirements            │
│                                                              │
│ PROCESS OVERVIEW:                                           │
│ 1. Scan spec for 10 ambiguity categories                    │
│ 2. Prioritize top 5-10 questions by impact                  │
│ 3. Ask ONE question at a time (interactive)                 │
│ 4. Encode your answer into spec.md                          │
│ 5. Repeat until all critical questions resolved             │
│ 6. Validate spec completeness                               │
└─────────────────────────────────────────────────────────────┘
```

Goal: Detect and reduce ambiguity or missing decision points in the active feature specification and record the clarifications directly in the spec file.

Note: This clarification workflow is expected to run (and be completed) BEFORE invoking `/speckit.plan`. If the user explicitly states they are skipping clarification (e.g., exploratory spike), you may proceed, but must warn that downstream rework risk increases.

Execution steps:

**Show user**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 STEP 1: SCANNING SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Loading spec.md and identifying ambiguous areas...

WHAT'S HAPPENING:
• Scanning 10 ambiguity categories (scope, data model, UX, etc.)
• Marking areas as Clear / Partial / Missing
• Building prioritized question queue

WHY THIS MATTERS:
• Different categories have different implementation impact
• Prioritization ensures most critical questions asked first
• Scan identifies gaps you might not notice manually
```

1. **Detect feature context** from current directory or user input:
   - Look for `specs/*/` directories containing spec.md
   - If in a feature directory (contains spec.md), use that as FEATURE_DIR
   - Set FEATURE_SPEC = FEATURE_DIR/spec.md
   - Optionally capture IMPL_PLAN = FEATURE_DIR/plan.md if exists
   - If no feature found, abort and instruct user to run `/speckit.specify` first

2. Load the current spec file. Perform a structured ambiguity & coverage scan using this taxonomy. For each category, mark status: Clear / Partial / Missing. Produce an internal coverage map used for prioritization (do not output raw map unless no questions will be asked).

   Functional Scope & Behavior:
   - Core user goals & success criteria
   - Explicit out-of-scope declarations
   - User roles / personas differentiation

   Domain & Data Model:
   - Entities, attributes, relationships
   - Identity & uniqueness rules
   - Lifecycle/state transitions
   - Data volume / scale assumptions

   Interaction & UX Flow:
   - Critical user journeys / sequences
   - Error/empty/loading states
   - Accessibility or localization notes

   Non-Functional Quality Attributes:
   - Performance (latency, throughput targets)
   - Scalability (horizontal/vertical, limits)
   - Reliability & availability (uptime, recovery expectations)
   - Observability (logging, metrics, tracing signals)
   - Security & privacy (authN/Z, data protection, threat assumptions)
   - Compliance / regulatory constraints (if any)

   Integration & External Dependencies:
   - External services/APIs and failure modes
   - Data import/export formats
   - Protocol/versioning assumptions

   Edge Cases & Failure Handling:
   - Negative scenarios
   - Rate limiting / throttling
   - Conflict resolution (e.g., concurrent edits)

   Constraints & Tradeoffs:
   - Technical constraints (language, storage, hosting)
   - Explicit tradeoffs or rejected alternatives

   Terminology & Consistency:
   - Canonical glossary terms
   - Avoided synonyms / deprecated terms

   Completion Signals:
   - Acceptance criteria testability
   - Measurable Definition of Done style indicators

   Misc / Placeholders:
   - TODO markers / unresolved decisions
   - Ambiguous adjectives ("robust", "intuitive") lacking quantification

   For each category with Partial or Missing status, add a candidate question opportunity unless:
   - Clarification would not materially change implementation or validation strategy
   - Information is better deferred to planning phase (note internally)

3. Generate (internally) a prioritized queue of candidate clarification questions (maximum 5). Do NOT output them all at once. Apply these constraints:
    - Maximum of 10 total questions across the whole session.
    - Each question must be answerable with EITHER:
       - A short multiple‑choice selection (2–5 distinct, mutually exclusive options), OR
       - A one-word / short‑phrase answer (explicitly constrain: "Answer in <=5 words").
    - Only include questions whose answers materially impact architecture, data modeling, task decomposition, test design, UX behavior, operational readiness, or compliance validation.
    - Ensure category coverage balance: attempt to cover the highest impact unresolved categories first; avoid asking two low-impact questions when a single high-impact area (e.g., security posture) is unresolved.
    - Exclude questions already answered, trivial stylistic preferences, or plan-level execution details (unless blocking correctness).
    - Favor clarifications that reduce downstream rework risk or prevent misaligned acceptance tests.
    - If more than 5 categories remain unresolved, select the top 5 by (Impact * Uncertainty) heuristic.

4. Sequential questioning loop (interactive):
    - Present EXACTLY ONE question at a time.
    - For multiple‑choice questions:
       - **Analyze all options** and determine the **most suitable option** based on:
          - Best practices for the project type
          - Common patterns in similar implementations
          - Risk reduction (security, performance, maintainability)
          - Alignment with any explicit project goals or constraints visible in the spec
       - Present your **recommended option prominently** at the top with clear reasoning (1-2 sentences explaining why this is the best choice).
       - Format as: `**Recommended:** Option [X] - <reasoning>`
       - Then render all options as a Markdown table:

       | Option | Description |
       |--------|-------------|
       | A | <Option A description> |
       | B | <Option B description> |
       | C | <Option C description> (add D/E as needed up to 5) |
       | Short | Provide a different short answer (<=5 words) (Include only if free-form alternative is appropriate) |
       | **Skip** | "I don't know" - defer this decision |

       - After the table, add: `You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or "recommended", say "skip" or "don't know" to defer, or provide your own short answer.`

    - **Handling "I don't know" responses** (EC-011):
      If user responds with "skip", "don't know", "not sure", "idk", "defer", or similar:
      ```
      ┌─────────────────────────────────────────────────────────────┐
      │ 📌 DEFERRING DECISION                                       │
      ├─────────────────────────────────────────────────────────────┤
      │ No problem! This decision can be deferred.                  │
      │                                                              │
      │ OPTIONS:                                                    │
      │ [1] Use recommended default (can be changed later)          │
      │ [2] Mark as [NEEDS DECISION] in spec (flag for later)       │
      │ [3] Ask stakeholder (provide question to share)             │
      │ [4] Skip entirely (accept risk of planning ambiguity)       │
      │                                                              │
      │ Enter choice [1/2/3/4]:                                     │
      └─────────────────────────────────────────────────────────────┘
      ```
      
      **If [1] Use recommended default**:
      - Apply the AI's recommended option
      - Add note: `(default - can be revisited)`
      - Continue to next question

      **If [2] Mark as NEEDS DECISION**:
      - Add to spec: `[NEEDS DECISION: <question summary>]`
      - Record in Clarifications: `- Q: <question> → A: DEFERRED (needs stakeholder input)`
      - Continue to next question

      **If [3] Ask stakeholder**:
      - Generate shareable question with context:
        ```
        📋 DECISION NEEDED
        
        Question: <formatted question>
        Context: <1-2 sentences from spec>
        Options:
        A. <option A>
        B. <option B>
        ...
        
        Please reply with your choice or preferred approach.
        ```
      - Mark as PENDING in spec
      - Continue to next question

      **If [4] Skip entirely**:
      - Do not record anything
      - Log internally as "Skipped - user accepted ambiguity risk"
      - Continue to next question

    - For short‑answer style (no meaningful discrete options):
       - Provide your **suggested answer** based on best practices and context.
       - Format as: `**Suggested:** <your proposed answer> - <brief reasoning>`
       - Then output: `Format: Short answer (<=5 words). You can accept the suggestion by saying "yes" or "suggested", say "skip" to defer this decision, or provide your own answer.`
    - After the user answers:
       - If the user replies with "yes", "recommended", or "suggested", use your previously stated recommendation/suggestion as the answer.
       - Otherwise, validate the answer maps to one option or fits the <=5 word constraint.
       - If ambiguous, ask for a quick disambiguation (count still belongs to same question; do not advance).
       - Once satisfactory, record it in working memory (do not yet write to disk) and move to the next queued question.
    - Stop asking further questions when:
       - All critical ambiguities resolved early (remaining queued items become unnecessary), OR
       - User signals completion ("done", "good", "no more"), OR
       - You reach 5 asked questions.
    - Never reveal future queued questions in advance.
    - If no valid questions exist at start, immediately report no critical ambiguities.

5. Integration after EACH accepted answer (incremental update approach):
    - Maintain in-memory representation of the spec (loaded once at start) plus the raw file contents.
    - For the first integrated answer in this session:
       - Ensure a `## Clarifications` section exists (create it just after the highest-level contextual/overview section per the spec template if missing).
       - Under it, create (if not present) a `### Session YYYY-MM-DD` subheading for today.
    - Append a bullet line immediately after acceptance: `- Q: <question> → A: <final answer>`.
    
    - **Contradiction Detection** (EC-012):
      Before applying the clarification, check if the answer contradicts existing spec content:
      ```
      CONTRADICTION_PATTERNS:
      - New answer says "X" but spec says "not X" or "Y instead of X"
      - New answer adds requirement that conflicts with stated constraint
      - New answer removes/changes explicitly stated behavior
      - New answer sets limit/threshold different from existing value
      ```
      
      **If contradiction detected**:
      ```
      ┌─────────────────────────────────────────────────────────────┐
      │ ⚠️  POTENTIAL CONTRADICTION DETECTED                        │
      ├─────────────────────────────────────────────────────────────┤
      │ Your answer appears to conflict with existing spec content: │
      │                                                              │
      │ YOUR ANSWER:                                                │
      │   "[user's answer]"                                         │
      │                                                              │
      │ EXISTING SPEC SAYS:                                         │
      │   "[conflicting line from spec]"                            │
      │   (Line [N] in [section name])                              │
      │                                                              │
      │ OPTIONS:                                                    │
      │ [1] Update spec - Replace old with new (your answer wins)   │
      │ [2] Keep existing - Discard this answer (spec wins)         │
      │ [3] Both are true - Add nuance (explain how both apply)     │
      │ [4] Clarify - Let me rephrase my answer                     │
      │                                                              │
      │ Enter choice [1/2/3/4]:                                     │
      └─────────────────────────────────────────────────────────────┘
      ```
      
      **If [1] Update spec**:
      - Remove or update the conflicting line
      - Apply the new answer
      - Add note in Clarifications: `(supersedes previous: "[old text]")`

      **If [2] Keep existing**:
      - Do not apply the answer
      - Note in Clarifications: `- Q: <question> → A: Kept existing: "[spec text]"`

      **If [3] Both are true**:
      - Ask user to explain: "How do both apply? (1-2 sentences)"
      - Add nuanced explanation to spec
      - Both statements remain with clarifying context

      **If [4] Clarify**:
      - Allow user to rephrase
      - Re-check for contradictions
      - Continue

    - Then immediately apply the clarification to the most appropriate section(s):
       - Functional ambiguity → Update or add a bullet in Functional Requirements.
       - User interaction / actor distinction → Update User Stories or Actors subsection (if present) with clarified role, constraint, or scenario.
       - Data shape / entities → Update Data Model (add fields, types, relationships) preserving ordering; note added constraints succinctly.
       - Non-functional constraint → Add/modify measurable criteria in Non-Functional / Quality Attributes section (convert vague adjective to metric or explicit target).
       - Edge case / negative flow → Add a new bullet under Edge Cases / Error Handling (or create such subsection if template provides placeholder for it).
       - Terminology conflict → Normalize term across spec; retain original only if necessary by adding `(formerly referred to as "X")` once.
    - If the clarification invalidates an earlier ambiguous statement, replace that statement instead of duplicating; leave no obsolete contradictory text.
    - Save the spec file AFTER each integration to minimize risk of context loss (atomic overwrite).
    - Preserve formatting: do not reorder unrelated sections; keep heading hierarchy intact.
    - Keep each inserted clarification minimal and testable (avoid narrative drift).

6. Validation (performed after EACH write plus final pass):
   - Clarifications session contains exactly one bullet per accepted answer (no duplicates).
   - Total asked (accepted) questions ≤ 5.
   - Updated sections contain no lingering vague placeholders the new answer was meant to resolve.
   - No contradictory earlier statement remains (scan for now-invalid alternative choices removed).
   - Markdown structure valid; only allowed new headings: `## Clarifications`, `### Session YYYY-MM-DD`.
   - Terminology consistency: same canonical term used across all updated sections.

7. Write the updated spec back to `FEATURE_SPEC`.

8. Report completion (after questioning loop ends or early termination):
   - Number of questions asked & answered.
   - Path to updated spec.
   - Sections touched (list names).
   - Coverage summary table listing each taxonomy category with Status: Resolved (was Partial/Missing and addressed), Deferred (exceeds question quota or better suited for planning), Clear (already sufficient), Outstanding (still Partial/Missing but low impact).
   - If any Outstanding or Deferred remain, recommend whether to proceed to `/speckit.plan` or run `/speckit.clarify` again later post-plan.
   - Suggested next command.

Behavior rules:

- If no meaningful ambiguities found (or all potential questions would be low-impact), respond: "No critical ambiguities detected worth formal clarification." and suggest proceeding.
- If spec file missing, instruct user to run `/speckit.specify` first (do not create a new spec here).
- Never exceed 5 total asked questions (clarification retries for a single question do not count as new questions).
- Avoid speculative tech stack questions unless the absence blocks functional clarity.
- Respect user early termination signals ("stop", "done", "proceed").
- If no questions asked due to full coverage, output a compact coverage summary (all categories Clear) then suggest advancing.
- If quota reached with unresolved high-impact categories remaining, explicitly flag them under Deferred with rationale.

**User-Initiated Questions** (EC-025):

If spec has no detected ambiguities but user wants to ask questions anyway:
```
┌─────────────────────────────────────────────────────────────┐
│ ✅ SPEC LOOKS COMPLETE                                      │
├─────────────────────────────────────────────────────────────┤
│ No critical ambiguities detected in your specification.     │
│                                                              │
│ However, if you have questions or want to discuss:          │
│ • Type your question and I'll help clarify                  │
│ • Say "proceed" to continue to /speckit.plan                │
│ • Say "review [section]" to examine a specific section      │
│                                                              │
│ Your question (or "proceed"):                               │
└─────────────────────────────────────────────────────────────┘
```

If user asks a question:
- Answer conversationally (don't force into Q&A format)
- If answer reveals a spec update, offer to add it
- Allow unlimited user-initiated questions (don't count toward 5 limit)

**Mid-Session Recovery** (EC-026):

Before each question, save session state to allow recovery:
```bash
# Session state file
SESSION_FILE="$FEATURE_DIR/.clarify-session.json"

# Save after each answer
{
  "session_id": "$(date +%s)",
  "started": "2026-01-15T10:30:00Z",
  "questions_asked": 2,
  "questions_answered": 2,
  "pending_questions": ["Q3 text", "Q4 text"],
  "answers": [
    {"q": "Question 1", "a": "Answer 1", "applied": true},
    {"q": "Question 2", "a": "Answer 2", "applied": true}
  ],
  "spec_backup": "spec.md.clarify-backup"
}
```

If user abandons mid-session (closes chat, says "stop", etc.):
- Session state is preserved
- Answers already given ARE applied to spec
- Remaining questions saved for next session

On next `/speckit.clarify` invocation, check for existing session:
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 PREVIOUS CLARIFICATION SESSION FOUND                     │
├─────────────────────────────────────────────────────────────┤
│ You have an incomplete clarification session:               │
│                                                              │
│ Started: [timestamp]                                        │
│ Questions answered: 2/5                                     │
│ Pending questions: 3                                        │
│                                                              │
│ OPTIONS:                                                    │
│ [1] Resume - Continue from question 3                       │
│ [2] Restart - Begin fresh analysis                          │
│ [3] Discard - Delete session, proceed to planning           │
│                                                              │
│ Enter choice [1/2/3]:                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Auto-Detect Complex Specs (Proactive Clarification)

Before scanning for ambiguities, analyze spec complexity to determine if clarification is REQUIRED vs optional:

### Complexity Scoring

Calculate complexity score based on these indicators:

| Indicator | Weight | Detection |
|-----------|--------|-----------|
| Multiple user roles | +2 | >1 distinct persona mentioned |
| Data relationships | +2 | >2 entities with relationships |
| External integrations | +3 | API, webhook, third-party services |
| Security requirements | +3 | Auth, encryption, PII handling |
| Real-time features | +2 | Websockets, live updates, sync |
| Multi-step workflows | +2 | >3 sequential user actions |
| Compliance/regulatory | +4 | GDPR, HIPAA, PCI, SOC2 mentions |
| Ambiguous adjectives | +1 each | "robust", "scalable", "intuitive", etc. |
| [NEEDS CLARIFICATION] markers | +2 each | Explicit markers in spec |
| Cross-repo scope | +3 | Multiple repos affected |

### Complexity Thresholds

```
Score 0-4:   SIMPLE   → Clarification optional, recommend skipping
Score 5-10:  MODERATE → Clarification recommended
Score 11+:   COMPLEX  → Clarification REQUIRED before planning
```

### Auto-Detection Output

**Before starting clarification**, show complexity analysis:

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 SPEC COMPLEXITY ANALYSIS                                 │
├─────────────────────────────────────────────────────────────┤
│ Feature: [FEATURE_NAME]                                     │
│                                                              │
│ COMPLEXITY SCORE: [N] ([SIMPLE/MODERATE/COMPLEX])           │
│                                                              │
│ Factors detected:                                           │
│ • [N] user roles (admin, customer, vendor)           +[X]   │
│ • [N] entity relationships                           +[X]   │
│ • [N] external integrations (Stripe, SendGrid)       +[X]   │
│ • Security requirements (OAuth2, encryption)         +[X]   │
│ • [N] [NEEDS CLARIFICATION] markers                  +[X]   │
│ • [N] ambiguous terms ("scalable", "robust")         +[X]   │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ TOTAL: [N] points                                           │
└─────────────────────────────────────────────────────────────┘
```

**If SIMPLE (0-4 points)**:
```
┌─────────────────────────────────────────────────────────────┐
│ ✅ SIMPLE SPEC - Clarification Optional                     │
├─────────────────────────────────────────────────────────────┤
│ This spec has low complexity and few ambiguities.           │
│                                                              │
│ OPTIONS:                                                    │
│ [1] Skip clarification → Proceed to /speckit.plan           │
│ [2] Quick review → Ask [N] minor questions anyway           │
│ [3] Continue → Full clarification workflow                  │
│                                                              │
│ Recommended: Skip and proceed to planning.                  │
│                                                              │
│ Enter choice [1/2/3]:                                       │
└─────────────────────────────────────────────────────────────┘
```

**If MODERATE (5-10 points)**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🟡 MODERATE SPEC - Clarification Recommended                │
├─────────────────────────────────────────────────────────────┤
│ This spec has some areas that would benefit from clarity.   │
│                                                              │
│ Areas needing attention:                                    │
│ • [Category 1]: [Brief description]                         │
│ • [Category 2]: [Brief description]                         │
│                                                              │
│ Estimated questions: [N]                                    │
│ Estimated time: [N] minutes                                 │
│                                                              │
│ OPTIONS:                                                    │
│ [1] Proceed with clarification (recommended)                │
│ [2] Skip and accept rework risk                             │
│                                                              │
│ Enter choice [1/2]:                                         │
└─────────────────────────────────────────────────────────────┘
```

**If COMPLEX (11+ points)**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 COMPLEX SPEC - Clarification REQUIRED                    │
├─────────────────────────────────────────────────────────────┤
│ This spec has significant complexity and ambiguities that   │
│ MUST be resolved before planning to avoid costly rework.    │
│                                                              │
│ Critical areas requiring clarification:                     │
│ • [Category 1]: [Impact description]                        │
│ • [Category 2]: [Impact description]                        │
│ • [Category 3]: [Impact description]                        │
│                                                              │
│ Estimated questions: [N]                                    │
│ Estimated time: [N] minutes                                 │
│                                                              │
│ ⚠️  Skipping clarification is NOT recommended for specs     │
│    with this complexity level. Proceed anyway?              │
│                                                              │
│ OPTIONS:                                                    │
│ [1] Proceed with clarification (strongly recommended)       │
│ [2] Skip anyway (high rework risk)                          │
│                                                              │
│ Enter choice [1/2]:                                         │
└─────────────────────────────────────────────────────────────┘
```

**If user selects Skip on COMPLEX spec**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  PROCEEDING WITHOUT CLARIFICATION                        │
├─────────────────────────────────────────────────────────────┤
│ You've chosen to skip clarification on a complex spec.      │
│                                                              │
│ Acknowledged risks:                                         │
│ • Architecture may need significant revision                │
│ • Task estimates may be inaccurate                          │
│ • Implementation may not meet unstated requirements         │
│                                                              │
│ Proceeding to /speckit.plan with current spec.              │
│                                                              │
│ TIP: You can run /speckit.clarify later if issues arise.    │
└─────────────────────────────────────────────────────────────┘
```

---

Context for prioritization: $ARGUMENTS
