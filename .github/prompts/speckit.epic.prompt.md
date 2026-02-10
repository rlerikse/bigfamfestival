# `/speckit.epic` - Epic Status Dashboard

## Purpose

Query and display the status of a **Jira Epic** and its child stories across all repositories. This is a **read-only command** that aggregates information from Jira and the workspace context.

**Why no epic spec files?**
- Jira already tracks epics (that's its purpose)
- Epic scope is fluid (stories get added/removed)
- Avoids sync complexity between developers
- Single source of truth = Jira

---

## Inputs

**Required**:
- `<epic-id>` - Epic ticket ID (e.g., `PROJ-43`)

**Optional Flags**:
- `--json` - Output as JSON for scripting
- `--stories-only` - List only child stories without epic details

---

## Workflow

### Phase 1: Fetch Epic from Jira

Use Atlassian MCP to retrieve epic details:

```javascript
// Get epic details
const epic = await mcp_atlassian.getJiraIssue({
  cloudId: "dea4cce7-df36-4b09-894b-8a0df849ecc1",
  issueIdOrKey: "PROJ-43"
});

// Get child issues
const children = await mcp_atlassian.searchJiraIssuesUsingJql({
  cloudId: "dea4cce7-df36-4b09-894b-8a0df849ecc1",
  jql: `"Epic Link" = PROJ-43 OR parent = PROJ-43`
});
```

### Phase 2: Cross-Reference with Workspace Specs

Read `.specify/workspace/all-specs.md` to find specs linked to this epic:

```bash
# Search for specs mentioning this epic
grep -r "Epic.*PROJ-43" repos/*/specs/*/spec.md
```

### Phase 3: Display Epic Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 EPIC: PROJ-43 - Guest Visibility                          │
├─────────────────────────────────────────────────────────────┤
│ Status: In Progress                                         │
│ Owner: [assignee]                                           │
│ Target: Q1 2026                                             │
│                                                              │
│ Description:                                                │
│ Enable guest mode visibility across all dealer platforms    │
│ with configurable settings per dealer.                      │
├─────────────────────────────────────────────────────────────┤
│ CHILD STORIES                              Status    Spec   │
├─────────────────────────────────────────────────────────────┤
│ PROJ-1367  Guest Toggle API      service-a  Done   ✅  │
│ PROJ-1368  Guest Permissions     service-a  Done   ✅  │
│ PROJ-1369  Guest UI Component    frontend    In Prog ✅ │
│ PROJ-1370  Guest Analytics       analytics-svc    To Do  ⬜  │
│ PROJ-1371  Guest Notifications   notif-svc    To Do  ⬜  │
├─────────────────────────────────────────────────────────────┤
│ Progress: 2/5 complete (40%)                                │
│ Specs Created: 3/5 (60%)                                    │
└─────────────────────────────────────────────────────────────┘
```

**Legend**:
- ✅ = Spec exists in workspace context
- ⬜ = No spec found (story not yet specified)
- 🔄 = Spec in draft/WIP status

---

## Story Status Mapping

| Jira Status | Display |
|-------------|---------|
| To Do | ⬜ To Do |
| In Progress | 🔄 In Prog |
| In Review | 🔍 Review |
| Done | ✅ Done |

---

## Linking Stories to Epics

When creating story specs, use the `--epic` flag to add the epic reference:

```bash
/speckit.specify PROJ-1367 --epic PROJ-43
```

This adds to the story spec header:
```markdown
**Epic**: PROJ-43
```

The epic dashboard will then show this story's spec status.

---

## Example Usage

### Basic Epic Query

```
/speckit.epic PROJ-43
```

Output: Full dashboard with all child stories and spec status.

### Stories Only

```
/speckit.epic PROJ-43 --stories-only
```

Output:
```
PROJ-43 Child Stories:
  PROJ-1367 - Guest Toggle API (service-a) ✅ Done
  PROJ-1368 - Guest Permissions (service-a) ✅ Done
  PROJ-1369 - Guest UI Component (frontend) 🔄 In Prog
  PROJ-1370 - Guest Analytics (analytics-svc) ⬜ To Do
  PROJ-1371 - Guest Notifications (notif-svc) ⬜ To Do
```

### JSON Output

```
/speckit.epic PROJ-43 --json
```

Output:
```json
{
  "epic": {
    "id": "PROJ-43",
    "title": "Guest Visibility",
    "status": "In Progress",
    "progress": { "done": 2, "total": 5, "percent": 40 }
  },
  "stories": [
    {
      "id": "PROJ-1367",
      "title": "Guest Toggle API",
      "repo": "your-service",
      "jiraStatus": "Done",
      "hasSpec": true,
      "specPath": "repos/your-service/main/PROJ-1367-guest-toggle"
    }
  ]
}
```

---

## Error Handling

### Epic Not Found

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ ERROR: Epic PROJ-999 not found in Jira                    │
├─────────────────────────────────────────────────────────────┤
│ Verify the epic ID is correct and you have access.         │
│                                                              │
│ Check: https://eriksensolutions.atlassian.net/browse/PROJ-999        │
└─────────────────────────────────────────────────────────────┘
```

### Not an Epic

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  WARNING: PROJ-1367 is a Story, not an Epic               │
├─────────────────────────────────────────────────────────────┤
│ This command is for viewing Epic status.                   │
│                                                              │
│ For story specs, use: /speckit.specify PROJ-1367            │
│                                                              │
│ Parent Epic: PROJ-43 - Guest Visibility                     │
│ View epic instead? Run: /speckit.epic PROJ-43               │
└─────────────────────────────────────────────────────────────┘
```

### No Child Stories

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 EPIC: PROJ-100 - New Initiative                           │
├─────────────────────────────────────────────────────────────┤
│ Status: Open                                                │
│                                                              │
│ ⚠️  No child stories found                                  │
│                                                              │
│ This epic has no linked stories in Jira.                   │
│ Add stories to the epic in Jira first.                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Notes

- This is a **query-only** command - it does not create files
- Epic information comes from Jira (single source of truth)
- Spec status comes from workspace context (`all-specs.md`)
- Use `/speckit.specify PROJ-XXX --epic PROJ-YY` to link stories to epics
