# Push Notifications - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-8](https://eriksensolutions.atlassian.net/browse/BFF-8)  
**Created**: 2026-02-09  

---

## Overview

Push Notifications enable festival organizers to send announcements to attendees via Expo Push Notifications. The system supports broadcast notifications to all users, targeted notifications by group, and notification history tracking.

---

## User Stories

### User Story 1 - Receive Festival Announcements
**As a** festival attendee,  
**I want to** receive push notifications about important announcements,  
**So that** I stay informed about schedule changes and updates.

**Acceptance Criteria** (Verified):
- [x] Notifications are delivered via Expo Push Notification service
- [x] Notifications appear even when app is backgrounded
- [x] Notification contains title, body, and optional data

**Implementation**: `backend/src/notifications/notifications.service.ts`

### User Story 2 - Send Broadcast Notification (Admin)
**As an** admin,  
**I want to** send a notification to all attendees,  
**So that** I can communicate important festival updates.

**Acceptance Criteria** (Verified):
- [x] Admin can send notification via POST /notifications
- [x] Notification is sent to all users with valid push tokens
- [x] Notification is stored in history
- [x] Returns success/failure counts

**Implementation**: `backend/src/notifications/notifications.controller.ts:L37-L74`

### User Story 3 - Send Targeted Notification (Admin)
**As an** admin,  
**I want to** send notifications to specific groups (e.g., VIP),  
**So that** I can send relevant information to specific attendees.

**Acceptance Criteria** (Verified):
- [x] Can specify receiver groups in notification
- [x] Only users in specified groups receive notification

**Implementation**: `backend/src/notifications/notifications.service.ts` (receiverGroups parameter)

### User Story 4 - View Notification History
**As an** attendee,  
**I want to** see past notifications in the app,  
**So that** I can review announcements I may have missed.

**Acceptance Criteria** (Verified):
- [x] GET /notifications returns notification history
- [x] Notifications are paginated with limit parameter
- [x] Sorted by sent date (newest first)

**Implementation**: `backend/src/notifications/notifications.controller.ts:L76-L90`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Send notification to all users | ✅ | `notifications.service.ts:sendToAllUsers()` |
| FR-002 | Support normal/high priority | ✅ | `notifications.service.ts` |
| FR-003 | Store notification history | ✅ | `notifications.service.ts:storeNotification()` |
| FR-004 | Retrieve notification history | ✅ | `notifications.controller.ts:L76-L90` |
| FR-005 | Count registered push tokens | ✅ | `notifications.service.ts:getTokenCount()` |
| FR-006 | Handle failed token delivery | ✅ | `notifications.service.ts` |
| FR-007 | Support notification categories | ✅ | category field |
| FR-008 | Support receiver groups | ✅ | receiverGroups field |

---

## API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/notifications` | JWT | Admin | Create and send notification |
| GET | `/notifications` | Public | - | Get notification history |
| GET | `/notifications/token-count` | JWT | Admin | Get registered token count |
| GET | `/notifications/fcm-status` | JWT | Admin | Verify FCM configuration |

### Request/Response Examples

**POST /notifications**
```json
// Request
{
  "title": "Schedule Update",
  "body": "Main stage lineup has changed. Check the app for details!",
  "sentBy": "admin123",
  "priority": "high",
  "category": "schedule",
  "data": { "screen": "schedule" }
}

// Response
{
  "success": true,
  "sent": 245,
  "failed": 3,
  "notificationId": "notif123"
}
```

**GET /notifications?limit=20**
```json
[
  {
    "id": "notif123",
    "title": "Schedule Update",
    "body": "Main stage lineup has changed...",
    "sentAt": "2026-02-09T15:30:00Z",
    "sentBy": "admin123",
    "category": "schedule"
  }
]
```

---

## Data Model

### CreateNotificationDto
```typescript
interface CreateNotificationDto {
  title: string;
  body: string;
  data?: Record<string, any>;
  sentBy: string;
  category?: string;
  priority?: 'normal' | 'high';
  receiverGroups?: string[];
}
```

### AdminNotification (Stored)
```typescript
interface AdminNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sentAt: Timestamp;
  sentBy: string;
  category?: string;
  priority?: 'normal' | 'high';
  receiverGroups?: string[];
}
```

---

## Expo Push Notification Integration

### Token Format
```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

### Push Message Structure
```typescript
const message: ExpoPushMessage = {
  to: expoPushToken,
  sound: 'default',
  title: notification.title,
  body: notification.body,
  data: notification.data,
  priority: notification.priority || 'default',
};
```

### Chunked Sending
Expo recommends sending in chunks of 100 messages:
```typescript
const chunks = expo.chunkPushNotifications(messages);
for (const chunk of chunks) {
  await expo.sendPushNotificationsAsync(chunk);
}
```

---

## Token Management

### Token Collection
- Tokens are stored on user documents (`users.expoPushToken`)
- Mobile app registers token on login/app start
- Token is updated when it changes

### Token Validation
- Tokens are validated before sending
- Failed tokens are logged but not automatically removed

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Invalid push token | Logged, continues to next | `notifications.service.ts` |
| No tokens registered | Returns success with 0 sent | Service |
| Expo service error | Logged, returns failure count | Service |
| Non-admin attempts send | ForbiddenException (403) | RolesGuard |

---

## Mobile Integration

### NotificationsScreen
- Displays notification history
- Pull-to-refresh support
- Navigation to relevant screens via notification data

### Push Registration
```typescript
// On app start / login
const token = await Notifications.getExpoPushTokenAsync();
await updatePushToken(token.data);
```

### Notification Handling
```typescript
// Foreground notifications
Notifications.addNotificationReceivedListener(notification => {
  // Show in-app notification
});

// User tapped notification
Notifications.addNotificationResponseReceivedListener(response => {
  // Navigate to relevant screen
});
```

---

## File Structure

```
backend/src/notifications/
├── notifications.controller.ts    # HTTP endpoints
├── notifications.module.ts        # Module definition
└── notifications.service.ts       # Business logic + Expo integration

mobile/src/
├── screens/NotificationsScreen.tsx
└── services/
    ├── notificationService.ts      # API calls
    └── pushNotificationService.ts  # Expo registration
```

---

## Firestore Collections

### Collection: `notifications`
```javascript
{
  "title": "Schedule Update",
  "body": "Main stage lineup has changed...",
  "sentAt": Timestamp,
  "sentBy": "admin123",
  "category": "schedule",
  "priority": "high",
  "data": { "screen": "schedule" }
}
```

---

## Related Specifications

- [BFF-5 User Management](../BFF-5-user-management/spec.md) - Push token storage
- [BFF-11 Admin Notifications](../BFF-11-admin-notifications/spec.md) - Admin UI for sending
