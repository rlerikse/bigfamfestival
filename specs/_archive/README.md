# Archived Specs

These BFF specs were archived on **2026-08-09** following the verification pass in
[`docs/2026-08-09-spec-status-report.md`](../../docs/2026-08-09-spec-status-report.md).
They were **not implemented** in the codebase and are parked here to preserve their content
(user scenarios, data schemas, design notes) as a restart point. The original Atlassian Jira
space is closed, so these files remain the last point of reference for each story.

| Spec | Feature | Reason archived |
|------|---------|-----------------|
| BFF-27 | QR Code Ticket Display | Unstarted — `TicketsModule` is commented out in `backend/src/app.module.ts`; no QR packages. Paired with BFF-38. |
| BFF-38 | QR Scanner Gate Entry | Unstarted — no camera/scanner packages; blocked by disabled ticketing (BFF-27). |
| BFF-31 | Vendor Dashboard Panel | Only a mock admin UI shell exists (`admin/src/pages/VendorsPage.tsx` shows placeholder data); no backend/collection/mobile. |
| BFF-32 | What3Words Navigation | Never built — only a mock `getWhat3WordsAddress()` returning random words; no package or API key. De-scoped. |
| BFF-33 | Schedule Snapshot Sharing | No code — no view-shot/share packages, no share UI. |

**To revive a spec:** move its folder back to `specs/`, re-verify the technical notes against the
current stack (package names/APIs may have changed), and set an accurate `**Status**`.

> Note: **BFF-36 (Medical Emergency)** was intentionally **not** archived. It is unbuilt but
> safety-critical — if revived it should get a fresh spec. It remains under `specs/`.
