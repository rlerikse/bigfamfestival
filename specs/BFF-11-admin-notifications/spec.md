# Admin Notifications Management - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-11](https://eriksensolutions.atlassian.net/browse/BFF-11)  
**Created**: 2026-02-09  

---

## Overview

Admin Notifications Management provides a UI and debugging tools for festival administrators to send and manage push notifications. This includes the AdminNotificationsScreen in the mobile app and debug endpoints for testing notification delivery.

---

## User Stories

### User Story 1 - Send Notification from Mobile
**As an** admin using the mobile app,  
**I want to** compose and send notifications,  
**So that** I can quickly communicate with attendees from anywhere.

**Acceptance Criteria** (Verified):
- [x] Admin sees "Admin Notifications" screen in app
- [x] Can compose notification title and body
- [x] Can send notification to all users
- [x] Shows confirmation of send status

**Implementation**: `mobile/src/screens/AdminNotificationsScreen.tsx`

### User Story 2 - Debug Notification Delivery
**As a** developer,  
**I want to** test notification delivery,  
**So that** I can verify the push notification system works.

**Acceptance Criteria** (Verified):
- [x] Debug endpoint to check token count
- [x] Debug endpoint to verify FCM configuration
- [x] Debug endpoint to send test notification

**Implementation**: `backend/src/debug/notifications-debug.controller.ts`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Admin notification UI | ✅ | `AdminNotificationsScreen.tsx` |
| FR-002 | Token count debug endpoint | ✅ | `notifications-debug.controller.ts` |
| FR-003 | FCM status check | ✅ | `notifications.service.ts:verifyFcmConfig()` |
| FR-004 | Test notification sending | ✅ | Debug controller |

---

## API Endpoints (Debug)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/debug/notifications/token-count` | Public* | Get registered token count |
| GET | `/debug/notifications/fcm-status` | Public* | Verify FCM configuration |
| POST | `/debug/notifications/test` | Public* | Send test notification |

*Debug endpoints - should be protected in production

---

## Mobile Admin UI

### AdminNotificationsScreen Features
- Title input field
- Body/message textarea
- Priority selector (normal/high)
- Send button
- Status feedback (success/error)
- Token count display

---

## File Structure

```
backend/src/debug/
├── debug.module.ts
└── notifications-debug.controller.ts

mobile/src/screens/
└── AdminNotificationsScreen.tsx
```

---

## Security Considerations

| Concern | Current State | Recommendation |
|---------|--------------|----------------|
| Debug endpoint access | Public | Should be protected or disabled in production |
| Admin UI visibility | Role-based in app | Properly gated by role |

---

## Related Specifications

- [BFF-8 Push Notifications](../BFF-8-push-notifications/spec.md) - Core notification system
