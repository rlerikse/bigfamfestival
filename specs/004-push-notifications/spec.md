# Push Notifications System - Retroactive Specification

**Feature ID**: 004  
**Status**: ✅ Implemented (Retroactive Documentation)  
**Created**: 2026-01-14  
**Source Analysis**: `backend/src/notifications/`, `mobile/src/services/notificationService.ts`, `mobile/src/screens/AdminNotificationsScreen.tsx`

---

## Overview

Push notification system using Expo Push Notifications with Firebase Cloud Messaging backend. Supports admin-sent announcements, targeted group notifications, and automatic event reminders for user schedules. Notifications stored in Firestore for audit trail.

---

## User Stories

### User Story 1 - Receive Push Notifications (Priority: P0 - Implemented)

**As a** festival attendee,  
**I want to** receive push notifications,  
**So that** I stay informed about important announcements.

**Acceptance Criteria** (Verified in Implementation):
- [x] User registers Expo push token on login
- [x] Notifications delivered via Expo Push API
- [x] Notification history viewable in app

**Implementation Reference**: `backend/src/notifications/notifications.service.ts:L115-L200`

---

### User Story 2 - Admin Broadcast Notifications (Priority: P0 - Implemented)

**As an** admin,  
**I want to** send notifications to all users,  
**So that** I can announce important festival information.

**Acceptance Criteria** (Verified in Implementation):
- [x] Admin can compose notification title and body
- [x] Notification sent to all registered tokens
- [x] Notification logged with sender info

**Implementation Reference**: `backend/src/notifications/notifications.service.ts:L202-L280`

---

### User Story 3 - Targeted Notifications (Priority: P1 - Implemented)

**As an** admin,  
**I want to** send notifications to specific user groups,  
**So that** I can target relevant audiences.

**Acceptance Criteria** (Verified in Implementation):
- [x] Filter by user groups (userGroups field)
- [x] Priority levels (normal, high)
- [x] Category tagging for notifications

**Implementation Reference**: `backend/src/notifications/notifications.service.ts:L282-L350`

---

### User Story 4 - Event Reminders (Priority: P1 - Implemented)

**As a** user,  
**I want to** receive reminders for scheduled events,  
**So that** I don't miss performances I planned to attend.

**Acceptance Criteria** (Verified in Implementation):
- [x] Automatic scheduling on event add to schedule
- [x] Reminder sent before event start
- [x] Cancel reminders when event removed

**Implementation Reference**: `mobile/src/services/notificationService.ts`

---

## Functional Requirements

### Notification Delivery

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Register Expo push token | ✅ | `notifications.service.ts:L38-L75` |
| FR-002 | Send to all users | ✅ | `notifications.service.ts:L202-L280` |
| FR-003 | Send to user groups | ✅ | `notifications.service.ts:L282-L350` |
| FR-004 | Batch send (chunks of 100) | ✅ | Expo SDK batch handling |
| FR-005 | Track failed tokens | ✅ | `notifications.service.ts:L352-L400` |

### Admin Features

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-006 | Admin notification screen | ✅ | `AdminNotificationsScreen.tsx` |
| FR-007 | Notification history | ✅ | Firestore `adminNotifications` |
| FR-008 | FCM config verification | ✅ | `notifications.service.ts:L77-L115` |
| FR-009 | Token count diagnostics | ✅ | `notifications.service.ts:L38-L75` |

### Event Reminders

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-010 | Schedule notification on event add | ✅ | `notificationService.ts` |
| FR-011 | Cancel notification on event remove | ✅ | `notificationService.ts` |
| FR-012 | Schedule all events on login | ✅ | `AuthContext.tsx:L108` |

---

## Data Model

### Notification Interfaces

```typescript
// From backend/src/notifications/notifications.service.ts
interface CreateNotificationDto {
  title: string;
  body: string;
  data?: Record<string, any>;
  sentBy: string;
  category?: string;
  priority?: 'normal' | 'high';
  receiverGroups?: string[];
}

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

**Firestore Collections**:
- `adminNotifications` - Notification history
- `users.expoPushToken` - User push tokens

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/notifications/register` | JWT | Register push token |
| POST | `/notifications/send` | JWT (Admin) | Send notification |
| GET | `/notifications/history` | JWT (Admin) | Get notification history |
| GET | `/notifications/debug/tokens` | JWT (Admin) | Get token count |
| GET | `/notifications/debug/fcm` | JWT (Admin) | Verify FCM config |

---

## Success Criteria

| ID | Criterion | Measurement | Status |
|----|-----------|-------------|--------|
| SC-001 | Notifications delivered | Expo receipts | ✅ Met |
| SC-002 | Admin can send broadcasts | UI functional | ✅ Met |
| SC-003 | Event reminders scheduled | Local notifications | ✅ Met |
| SC-004 | Failed tokens tracked | Error logging | ✅ Met |

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Invalid push token | Remove from batch, log | `notifications.service.ts:L352-L400` |
| FCM not configured | Graceful error return | `notifications.service.ts:L77-L115` |
| User disabled notifications | Skip user | Token filtering |
| Expo API rate limit | Batch chunking | Expo SDK |

---

## Integration Points

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| Expo Push | Notification delivery | Send to devices |
| Firebase Admin | FCM backend | Token management |
| Auth context | User registration | Token association |
| Schedule service | Event reminders | Trigger scheduling |

---

## Key Files

- `backend/src/notifications/notifications.module.ts` - Module registration
- `backend/src/notifications/notifications.controller.ts` - HTTP endpoints
- `backend/src/notifications/notifications.service.ts` - Business logic
- `mobile/src/services/notificationService.ts` - Client-side scheduling
- `mobile/src/screens/AdminNotificationsScreen.tsx` - Admin UI
- `mobile/src/screens/NotificationsScreen.tsx` - User notification view

---

## Change History

| Date | Version | Change | Reference |
|------|---------|--------|-----------|
| 2025 | 1.0.0 | Initial implementation | Backend + Mobile |
| 2026-01-14 | - | Retroactive specification created | This document |
