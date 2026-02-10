# Feature Specification: [FEATURE NAME]

<!--
  INSTRUCTIONS: Fill out every section. All documentation gates below are mandatory for every feature unless marked as [OPTIONAL].
  See constitution for rationale and compliance requirements.
-->

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Epic**: [EPIC-ID] *(optional - if linked via --epic flag)*  
**Input**: User description: "$ARGUMENTS"

---

## Constitution Compliance Checklist

<!--
  IMPORTANT: These items are derived from your project's constitution at `.specify/memory/constitution.md`.
  The /speckit.specify command will populate this section based on your constitution.
  If generating manually, review your constitution and add relevant gates.
-->

- [ ] **Contract Compliance**: OpenAPI contract file exists and implementation matches contract exactly
- [ ] **Security**: Authentication, authorization, and secret handling reviewed per constitution
- [ ] **Observability**: Logging, metrics, and tracing requirements documented per constitution
- [ ] **Testing**: Unit, integration, and contract test requirements listed
- [ ] **Documentation**: All gates above completed
- [ ] **[Project-Specific Gate]**: [Add gates from your constitution]

> **Note**: Run `/speckit.constitution --audit` to verify your constitution is current.

---

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
  For each story, specify acceptance criteria and how it will be tested.
  
  JIRA INTEGRATION: If this spec was created with /speckit.specify from a Jira ticket,
  acceptance criteria are automatically extracted from:
  1. customfield_10041 (Acceptance Criteria field)
  2. Description section with "Acceptance Criteria" heading
  3. Comments containing criteria
  Jira criteria take precedence - do not modify unless updating in Jira first.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Criteria**:
<!-- Auto-populated from Jira if ticket has acceptance criteria -->
1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Criteria**:
<!-- Auto-populated from Jira if ticket has acceptance criteria -->
1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Criteria**:
<!-- Auto-populated from Jira if ticket has acceptance criteria -->
1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]  
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]

## Caching Strategy [OPTIONAL]

<!--
  Include this section if the feature involves caching.
  Caching tool should be specified in your constitution or project conventions.
-->

- Which API endpoints or data should be cached to improve performance or reduce load?
- What is the expected cache duration (TTL) for each cached item?
- Are there any cache invalidation or refresh requirements?
- Caching tool: [Specify per project conventions - e.g., Redis, Memcached, CDN]

## Retry Logic [OPTIONAL]

<!--
  Include this section if the feature involves external API calls or distributed operations.
-->

- Which API endpoints or operations require retry logic?
- What are the recommended retry parameters (max attempts, backoff strategy, delay)?
- Suggested strategy: Use exponential backoff with a delay (e.g., start with 1-2 seconds, double each time, up to a max).
- Should retries be applied for specific error types only (e.g., network, 5xx, rate limit)?
- Are there any idempotency or side-effect concerns with retries?

> **Note**: Database interactions typically should NOT implement retry unless explicitly required for transactional integrity.

## Design Specifications [CONDITIONAL]

<!--
  INCLUDE THIS SECTION ONLY IF: Figma design context was retrieved via --figma flag or Jira ticket contained Figma links.
  OMIT OTHERWISE.
-->

**Design Source**: [Figma File Name](figma-url)

### Visual Components

**Component Inventory**:
- [Component 1 Name] - [Brief description]
- [Component 2 Name] - [Brief description]
- [Component 3 Name] - [Brief description]

**Screenshots**:
- Full Design: `design/screenshots/full-design.png`
- Component Details: See `design/screenshots/` directory

### Design Tokens

**Colors**:
```
Primary:   #XXXXXX (--color-primary)
Secondary: #XXXXXX (--color-secondary)
Accent:    #XXXXXX (--color-accent)
Error:     #XXXXXX (--color-error)
Success:   #XXXXXX (--color-success)
```

**Typography**:
```
Heading 1: [Font Family], [Size]px, [Weight]
Heading 2: [Font Family], [Size]px, [Weight]
Body:      [Font Family], [Size]px, [Weight]
Caption:   [Font Family], [Size]px, [Weight]
```

**Spacing Scale**:
```
Base unit:     Xpx
Small:         Xpx
Medium:        Xpx
Large:         Xpx
Extra Large:   Xpx
```

**Effects**:
```
Border Radius: Xpx
Box Shadow:    [shadow spec]
Transitions:   [timing spec]
```

### Component Specifications

**[Component Name]**:
- **States**: Default, Hover, Active, Disabled, Focus
- **Variants**: [List variant names]
- **Props/Attributes**: [List configurable properties]
- **Responsive Behavior**: [Mobile, Tablet, Desktop breakpoints]
- **Code**: See `design/components/[ComponentName].tsx`

### Designer Notes & Annotations

**Implementation Guidance**:
- [Designer note 1 from Figma annotations]
- [Designer note 2 from Figma annotations]
- [Measurement specification or constraint]

**Accessibility Considerations**:
- [ARIA labels, roles, keyboard navigation from design]
- [Color contrast requirements]
- [Focus indicators]

**Interaction Details**:
- [Animation/transition specifications]
- [Gesture/click behavior]
- [Loading states]

**Design Constraints**:
- **Match Exact Styling**: Borders, padding, fonts, colors, spacing must match Figma pixel-perfect
- **No Extra Elements**: Only implement UI elements visually present in design
- **Respect Hierarchy**: Maintain exact visual structure and spacing from Figma
- **Use Raw HTML if Needed**: If design system components don't match, use raw elements

## Related Resources [CONDITIONAL]

<!--
  INCLUDE THIS SECTION ONLY IF: External resources (Jira, Figma, attachments) were used.
  OMIT OTHERWISE.
-->

**External References**:
- **Jira Ticket**: [{TICKET}](jira-ticket-url) - [Ticket summary]
- **Figma Design**: [Design File Name](figma-url)
- **Attachments**: See `attachments/` directory ([count] files)
  - [filename1.ext] - [Brief description]
  - [filename2.ext] - [Brief description]

**Context Sources**:
- Jira ticket imported: [timestamp]
- Figma design retrieved: [timestamp]
- Last updated: [timestamp]

## Child Stories [CONDITIONAL - EPIC ONLY]

<!--
  INCLUDE THIS SECTION ONLY IF: Imported from Jira Epic using "umbrella spec" option.
  This is a high-level coordination spec for a multi-story initiative.
  Create detailed specs for each child story separately.
-->

**Epic**: [{EPIC_TICKET}](epic-url) - [Epic summary]

**Child Issues**:

| Ticket | Type | Summary | Status | Spec |
|--------|------|---------|--------|------|
| [{CHILD-001}](url) | Story | [Summary of child story 1] | [Status] | [Link to spec when created] |
| [{CHILD-002}](url) | Story | [Summary of child story 2] | [Status] | [Link to spec when created] |
| [{CHILD-003}](url) | Task | [Summary of child task] | [Status] | [Link to spec when created] |
| [{CHILD-004}](url) | Bug | [Summary of child bug] | [Status] | [Link to spec when created] |

**Implementation Strategy**:
- [Order/sequence for implementing child stories]
- [Dependencies between child issues]
- [Release/sprint planning considerations]

**Note**: This umbrella specification provides Epic-level context. Create detailed specifications for each child story using `/speckit.specify --jira {CHILD_TICKET}` before implementation.

## Feature Flags [OPTIONAL]

<!--
  Include this section if the feature uses feature flags.
  Feature flag tooling should be specified in your constitution or project conventions.
-->

- [ ] Feature flag defined in [feature flag system per project conventions]
- [ ] Rollout strategy documented
- [ ] Kill switch available for emergency disable
