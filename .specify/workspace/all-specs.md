# Aggregated Specifications

> **Generated**: 2026-02-10T15:35:10Z
> **Source**: [es-spec-kit-context](https://github.com/rlerikse/es-spec-kit-context)

This file contains **35 specifications** from **2 repositories** from connected repositories.

---


## [bigfamfestival] BFF-9-artists-directory

# Artists Directory - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-9](https://eriksensolutions.atlassian.net/browse/BFF-9)  
**Created**: 2026-02-09  

---

## Overview

Artists Directory provides information about festival performers, allowing attendees to browse and discover artists. The system stores artist profiles with biographical information and links to their performances.

---

## User Stories

### User Story 1 - Browse All Artists
**As a** festival attendee,  
**I want to** see all artists performing at the festival,  
**So that** I can discover new music.

**Acceptance Criteria** (Verified):
- [x] User can retrieve all artists via GET /artists
- [x] Returns list of artist profiles

**Implementation**: `backend/src/artists/artists.controller.ts:L14-L17`

### User Story 2 - View Artist Details
**As a** festival attendee,  
**I want to** view details about a specific artist,  
**So that** I can learn more about them.

**Acceptance Criteria** (Verified):
- [x] User can retrieve artist by ID via GET /artists/:id
- [x] Returns 404 if artist not found

**Implementation**: `backend/src/artists/artists.controller.ts:L19-L26`

### User Story 3 - Create Artist (Admin)
**As an** admin,  
**I want to** add new artists to the directory,  
**So that** the lineup is complete and up-to-date.

**Acceptance Criteria** (Verified):
- [x] Admin can create artist via POST /artists
- [x] Timestamps are automatically added

**Implementation**: `backend/src/artists/artists.controller.ts:L28-L33`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | List all artists | ✅ | `artists.service.ts:L31-L33` |
| FR-002 | Get artist by ID | ✅ | `artists.service.ts:L35-L41` |
| FR-003 | Find artist by name | ✅ | `artists.service.ts:L43-L52` |
| FR-004 | Create new artist | ✅ | `artists.service.ts:L13-L29` |
| FR-005 | Auto-generate timestamps | ✅ | `artists.service.ts:L15-L19` |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/artists` | Public | List all artists |
| GET | `/artists/:id` | Public | Get artist by ID |
| POST | `/artists` | Public* | Create new artist |

*Note: POST endpoint lacks role protection in current implementation

---

## Data Model

### Artist Interface
```typescript
interface Artist {
  id: string;
  name: string;
  bio?: string;
  genre?: string;
  imageUrl?: string;
  socialLinks?: {
    instagram?: string;
    spotify?: string;
    website?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Artist not found | NotFoundException (404) | `artists.service.ts:L38` |
| Artist name not found | Returns null | `artists.service.ts:L50` |

---

## File Structure

```
backend/src/artists/
├── artists.controller.ts    # HTTP endpoints
├── artists.module.ts        # Module definition
├── artists.service.ts       # Business logic
└── interfaces/
    └── artist.interface.ts  # Type definitions
```

---

## Firestore Collection

### Collection: `artists`
```javascript
{
  "name": "DJ Example",
  "bio": "Electronic music producer from...",
  "genre": "electronic",
  "imageUrl": "https://...",
  "socialLinks": {
    "instagram": "@djexample",
    "spotify": "spotify:artist:xxx"
  },
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

---

## Related Specifications

- [BFF-6 Events & Schedule Browser](../BFF-6-events-schedule/spec.md) - Events reference artists

---

## [bigfamfestival] BFF-8-push-notifications

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

---

## [bigfamfestival] BFF-7-personal-schedule

# Personal Schedule - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-7](https://eriksensolutions.atlassian.net/browse/BFF-7)  
**Created**: 2026-02-09  

---

## Overview

Personal Schedule allows authenticated users to save events to their personal schedule, creating a customized festival itinerary. Users can add, remove, and view their scheduled events, as well as share schedules with other users.

---

## User Stories

### User Story 1 - Add Event to Schedule
**As a** logged-in attendee,  
**I want to** add an event to my personal schedule,  
**So that** I can keep track of what I plan to attend.

**Acceptance Criteria** (Verified):
- [x] User can add event by event ID
- [x] Event existence is validated before adding
- [x] Duplicate adds return existing item (idempotent)
- [x] Schedule item includes timestamp

**Implementation**: `backend/src/schedule/schedule.service.ts:L20-L61`

### User Story 2 - Remove Event from Schedule
**As a** logged-in attendee,  
**I want to** remove an event from my schedule,  
**So that** I can update my plans.

**Acceptance Criteria** (Verified):
- [x] User can remove event by event ID
- [x] Returns 404 if event not in schedule
- [x] Only removes from requesting user's schedule

**Implementation**: `backend/src/schedule/schedule.service.ts:L63-L82`

### User Story 3 - View My Schedule
**As a** logged-in attendee,  
**I want to** view my saved schedule,  
**So that** I can see all events I plan to attend.

**Acceptance Criteria** (Verified):
- [x] Returns list of full event objects (not just IDs)
- [x] Events are enriched with full details from events collection

**Implementation**: `backend/src/schedule/schedule.service.ts:L84-L100`

### User Story 4 - View Another User's Schedule
**As a** logged-in attendee,  
**I want to** view my friend's schedule,  
**So that** we can coordinate our plans.

**Acceptance Criteria** (Verified):
- [x] Can view any user's schedule by user ID
- [x] Returns same format as own schedule

**Implementation**: `backend/src/schedule/schedule.controller.ts:L43-L46`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Add event to schedule | ✅ | `schedule.service.ts:L20-L61` |
| FR-002 | Validate event exists | ✅ | `schedule.service.ts:L28` |
| FR-003 | Handle duplicate adds | ✅ | `schedule.service.ts:L37-L48` |
| FR-004 | Remove event from schedule | ✅ | `schedule.service.ts:L63-L82` |
| FR-005 | Get own schedule | ✅ | `schedule.controller.ts:L38-L41` |
| FR-006 | Get other user's schedule | ✅ | `schedule.controller.ts:L43-L46` |
| FR-007 | Return full event details | ✅ | `schedule.service.ts:L84-L100` |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/schedule` | JWT | Add event to schedule |
| DELETE | `/schedule/:eventId` | JWT | Remove event from schedule |
| GET | `/schedule` | JWT | Get current user's schedule |
| GET | `/schedule/:userId` | JWT | Get another user's schedule |

### Request/Response Examples

**POST /schedule**
```json
// Request
{ "event_id": "event123" }

// Response
{
  "id": "event123",
  "userId": "user456",
  "eventId": "event123",
  "createdAt": "2026-02-09T10:30:00Z"
}
```

**GET /schedule**
```json
// Response - Array of full Event objects
[
  {
    "id": "event123",
    "title": "Main Stage Headliner",
    "artist": "DJ Example",
    "stage": "Main Stage",
    "date": "2026-06-15",
    "startTime": "21:00",
    "endTime": "23:00"
  }
]
```

---

## Data Model

### ScheduleItem Interface
```typescript
interface ScheduleItem {
  id: string;          // Same as eventId
  userId: string;      // Owner of the schedule item
  eventId: string;     // Reference to event
  createdAt: Date;     // When added to schedule
}
```

### CreateScheduleItemDto
```typescript
interface CreateScheduleItemDto {
  event_id: string;
}
```

### RemoveScheduleItemDto
```typescript
interface RemoveScheduleItemDto {
  event_id: string;
}
```

---

## Firestore Data Structure

### Collection: `schedules`
```
schedules/
├── {userId}/              # Document for each user
│   └── items/             # Subcollection of schedule items
│       ├── {eventId}/     # Document ID = event ID
│       │   ├── userId
│       │   ├── eventId
│       │   └── createdAt
│       └── ...
└── ...
```

This structure:
- Groups all items by user (efficient user queries)
- Uses eventId as document ID (prevents duplicates)
- Allows direct access to specific schedule items

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Event doesn't exist | NotFoundException thrown by EventsService | `schedule.service.ts:L28` |
| Event already in schedule | Returns existing item (idempotent) | `schedule.service.ts:L37-L48` |
| Event not in schedule (remove) | NotFoundException (404) | `schedule.service.ts:L77-L80` |
| Missing userId | Error thrown | `schedule.service.ts:L24` |

---

## Mobile Integration

### MyScheduleScreen
- Displays user's saved events
- Allows removal of events
- Shows event details with navigation to full event view

### ScheduleService
- `addToSchedule(eventId)` - Add event
- `removeFromSchedule(eventId)` - Remove event
- `getMySchedule()` - Fetch user's schedule

---

## File Structure

```
backend/src/schedule/
├── schedule.controller.ts    # HTTP endpoints
├── schedule.module.ts        # Module definition
├── schedule.service.ts       # Business logic
└── interfaces/
    └── schedule.interface.ts # DTOs and interfaces

mobile/src/
├── screens/MyScheduleScreen.tsx
└── services/scheduleService.ts
```

---

## Related Specifications

- [BFF-6 Events & Schedule Browser](../BFF-6-events-schedule/spec.md) - Browse events to add
- [BFF-8 Push Notifications](../BFF-8-push-notifications/spec.md) - Notifications for scheduled events

---

## [bigfamfestival] BFF-6-events-schedule

# Events & Schedule Browser - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-6](https://eriksensolutions.atlassian.net/browse/BFF-6)  
**Created**: 2026-02-09  

---

## Overview

The Events & Schedule Browser allows festival attendees to browse all events, filter by stage or date, and view event details including artists, genres, and timing. All event endpoints are publicly accessible (no authentication required).

---

## User Stories

### User Story 1 - Browse All Events
**As a** festival attendee,  
**I want to** see all events at the festival,  
**So that** I can plan what to attend.

**Acceptance Criteria** (Verified):
- [x] User can retrieve all events via GET /events
- [x] Events are sorted by date, then by start time
- [x] No authentication required

**Implementation**: `backend/src/events/events.controller.ts:L36-L51`

### User Story 2 - Filter by Stage
**As a** festival attendee,  
**I want to** filter events by stage,  
**So that** I can see what's playing at a specific location.

**Acceptance Criteria** (Verified):
- [x] User can filter events by stage query parameter
- [x] Only events at that stage are returned

**Implementation**: `backend/src/events/events.service.ts:L69-L75`

### User Story 3 - Filter by Date
**As a** festival attendee,  
**I want to** filter events by date,  
**So that** I can see what's happening on a specific day.

**Acceptance Criteria** (Verified):
- [x] User can filter events by date query parameter (YYYY-MM-DD)
- [x] Only events on that date are returned

**Implementation**: `backend/src/events/events.service.ts:L76-L82`

### User Story 4 - View Stages List
**As a** festival attendee,  
**I want to** see all available stages,  
**So that** I can understand the festival layout.

**Acceptance Criteria** (Verified):
- [x] User can retrieve unique stages via GET /events/stages
- [x] Returns deduplicated list of stage names

**Implementation**: `backend/src/events/events.controller.ts:L53-L58`

### User Story 5 - View Genres
**As a** festival attendee,  
**I want to** see all music genres at the festival,  
**So that** I can find events matching my taste.

**Acceptance Criteria** (Verified):
- [x] User can retrieve all genres via GET /events/genres
- [x] Returns list of genre objects with id and tag

**Implementation**: `backend/src/events/events.controller.ts:L60-L77`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | List all events | ✅ | `events.service.ts:L58-L100` |
| FR-002 | Filter events by stage | ✅ | `events.service.ts:L69-L75` |
| FR-003 | Filter events by date | ✅ | `events.service.ts:L76-L82` |
| FR-004 | Filter by stage AND date | ✅ | `events.service.ts:L63-L68` |
| FR-005 | Sort events by date/time | ✅ | `events.service.ts:L86-L100` |
| FR-006 | List unique stages | ✅ | `events.service.ts:getUniqueStages()` |
| FR-007 | List all genres | ✅ | `events.service.ts:getAllGenres()` |
| FR-008 | Create event (admin) | ✅ | `events.controller.ts:L79-L87` |
| FR-009 | Update event (admin) | ✅ | `events.controller.ts:L89-L104` |
| FR-010 | Delete event (admin) | ✅ | `events.controller.ts:L106-L120` |

---

## API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/events` | Public | - | List all events (with optional filters) |
| GET | `/events/stages` | Public | - | List unique stages |
| GET | `/events/genres` | Public | - | List all genres |
| GET | `/events/:id` | Public | - | Get event by ID |
| POST | `/events` | JWT | Admin | Create event |
| PUT | `/events/:id` | JWT | Admin | Update event |
| DELETE | `/events/:id` | JWT | Admin | Delete event |

### Query Parameters (GET /events)

| Parameter | Type | Description |
|-----------|------|-------------|
| `stage` | string | Filter by stage name |
| `date` | string | Filter by date (YYYY-MM-DD) |

---

## Data Model

### Event Interface
```typescript
interface Event {
  id: string;
  title: string;
  description?: string;
  artist: string;
  artistId?: string;
  stage: string;
  date: string;           // YYYY-MM-DD format
  startTime: string;      // HH:mm format
  endTime: string;        // HH:mm format
  genre?: string;
  imageUrl?: string;
  isFeatured?: boolean;
}
```

### Genre Interface
```typescript
interface Genre {
  id: string;
  tag: string;
}
```

---

## Sorting Logic

Events are sorted by:
1. **Date** (ascending) - Earlier dates first
2. **Start Time** (ascending) - Earlier times first within same date

```typescript
events.sort((a, b) => {
  const dateComparison = a.date.localeCompare(b.date);
  if (dateComparison !== 0) return dateComparison;
  return a.startTime.localeCompare(b.startTime);
});
```

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Event not found | NotFoundException (404) | `events.service.ts:L35` |
| Invalid date format | Returns empty array | Query filter |
| Missing date/time fields | Safe sort with fallback | `events.service.ts:L89-L99` |
| Non-admin create/update | ForbiddenException (403) | RolesGuard |

---

## File Structure

```
backend/src/events/
├── events.controller.ts    # HTTP endpoints
├── events.module.ts        # Module definition
├── events.service.ts       # Business logic
├── event.interface.ts      # Type definitions
├── events.controller.spec.ts  # Controller tests
└── events.service.spec.ts     # Service tests

mobile/src/
├── screens/
│   ├── ScheduleScreen.tsx  # Event browsing UI
│   └── HomeScreen.tsx      # Featured events
└── services/
    └── scheduleService.ts  # Event API calls
```

---

## Firestore Collections

### Collection: `events`
```javascript
{
  "title": "Main Stage Headliner",
  "artist": "DJ Example",
  "artistId": "artist123",
  "stage": "Main Stage",
  "date": "2026-06-15",
  "startTime": "21:00",
  "endTime": "23:00",
  "genre": "electronic",
  "description": "Festival headliner performance",
  "imageUrl": "https://...",
  "isFeatured": true
}
```

### Collection: `genres`
```javascript
{
  "tag": "electronic"
}
```

---

## Related Specifications

- [BFF-7 Personal Schedule](../BFF-7-personal-schedule/spec.md) - Save events to personal schedule
- [BFF-9 Artists Directory](../BFF-9-artists-directory/spec.md) - Artist information

---

## [bigfamfestival] BFF-52-custom-smtp-email-deliverability

# Feature Specification: Custom SMTP for Firebase Email Deliverability

**Jira**: [BFF-52](https://eriksensolutions.atlassian.net/browse/BFF-52)  
**Feature Branch**: `BFF-52-custom-smtp-email-deliverability`  
**Created**: 2025-07-11  
**Status**: Draft  

---

## Overview

Configure a custom SMTP provider for Firebase Authentication emails to ensure password resets, email verifications, and other transactional emails land in users' inboxes rather than spam folders.

### Current State
- **Email Sender**: Default Firebase `noreply@*.firebaseapp.com`
- **Deliverability**: Emails flagged as spam by Gmail, Outlook, Yahoo, iCloud
- **Templates**: Generic Firebase branding, no customization
- **DNS Auth**: No SPF, DKIM, or DMARC records for sender domain
- **Impact**: Users requesting password resets may never see the email

### Target State
- **Email Sender**: Branded address (e.g., `noreply@bigfamfestival.com`)
- **Deliverability**: Emails arrive in inbox for all major providers
- **Templates**: Big Fam Festival branded email templates
- **DNS Auth**: SPF, DKIM, and DMARC records configured and passing
- **SMTP Provider**: SendGrid (free tier: 100 emails/day) or equivalent

### Context

Discovered during [BFF-50](https://eriksensolutions.atlassian.net/browse/BFF-50) (Firebase Auth Migration) testing — the password reset flow works functionally, but emails go to spam with the default Firebase sender address.

---

## Constitution Compliance Checklist

- [ ] **Security**: SMTP credentials stored securely in Firebase Console (not in code)
- [ ] **Observability**: Email delivery metrics available via SMTP provider dashboard
- [ ] **Testing**: Verified delivery to Gmail, Outlook, Yahoo, and iCloud
- [ ] **Documentation**: DNS record requirements and SMTP configuration documented

---

## User Scenarios & Testing

### User Story 1 - Password Reset Email Delivery (Priority: P1)

As a user who forgot my password, I want the reset email to arrive in my inbox (not spam), so that I can regain access to my account reliably.

**Why this priority**: Core deliverability — if reset emails go to spam, users can't recover accounts without admin intervention.

**Independent Test**: Trigger password reset for test accounts on Gmail, Outlook, Yahoo, and iCloud. Verify email arrives in inbox within 2 minutes.

**Acceptance Criteria**:
1. **Given** a user requests a password reset, **When** Firebase sends the email via custom SMTP, **Then** the email arrives in the user's inbox (not spam)
2. **Given** a password reset email, **When** the user inspects the sender, **Then** it shows the branded domain (e.g., `noreply@bigfamfestival.com`)

---

### User Story 2 - Branded Email Templates (Priority: P2)

As a user receiving emails from the app, I want them to look professional and match the festival branding, so that I trust the email is legitimate.

**Why this priority**: Branding builds trust and reduces users marking emails as spam.

**Independent Test**: Trigger each email type (password reset, email verification, email change) and verify branding matches Big Fam Festival design.

**Acceptance Criteria**:
1. **Given** any Firebase Auth email, **When** the user opens it, **Then** it displays Big Fam Festival branding (logo, colors, styling)
2. **Given** a password reset email, **When** the user reads it, **Then** the copy is clear, branded, and includes festival-relevant messaging

---

### User Story 3 - DNS Authentication (Priority: P1)

As a system administrator, I want proper DNS records configured, so that emails pass authentication checks and aren't flagged as spam.

**Why this priority**: Without SPF/DKIM/DMARC, even custom SMTP emails may be flagged.

**Independent Test**: Use mail-tester.com or MXToolbox to verify SPF, DKIM, and DMARC records pass for the sending domain.

**Acceptance Criteria**:
1. **Given** the sending domain, **When** checked via MXToolbox, **Then** SPF record passes validation
2. **Given** the sending domain, **When** checked via MXToolbox, **Then** DKIM record passes validation
3. **Given** the sending domain, **When** checked via MXToolbox, **Then** DMARC record passes validation

---

### Edge Cases

- What happens if the SMTP provider (SendGrid) goes down? Firebase falls back to default sender.
- What happens if the free tier sending limit (100/day) is exceeded? Emails may be delayed or rejected.
- How does the system handle emails to addresses with strict corporate spam filters?

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST send all Firebase Auth emails via a custom SMTP provider
- **FR-002**: System MUST use a branded sender address (e.g., `noreply@bigfamfestival.com`)
- **FR-003**: System MUST have SPF, DKIM, and DMARC DNS records configured for the sender domain
- **FR-004**: Email templates MUST be customized with Big Fam Festival branding
- **FR-005**: Password reset emails MUST arrive in inbox (not spam) for Gmail, Outlook, Yahoo, and iCloud
- **FR-006**: SMTP credentials MUST be configured only in Firebase Console (never in source code)

### Implementation Tasks

1. **Choose SMTP Provider**: SendGrid free tier (100 emails/day) recommended
2. **Create SendGrid Account**: Sign up, verify sender domain, generate API key
3. **Firebase Console → Authentication → Templates**: 
   - Configure custom SMTP settings (host, port, username, password)
   - Set custom sender name and email address
4. **DNS Configuration** (via domain registrar):
   - Add SPF record: `v=spf1 include:sendgrid.net ~all`
   - Add DKIM record: CNAME records provided by SendGrid
   - Add DMARC record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@bigfamfestival.com`
5. **Email Template Customization**:
   - Password reset template
   - Email address verification template
   - Email address change template
6. **Testing**: Verify delivery to major providers

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Password reset emails arrive in inbox (not spam) for 95%+ of recipients across Gmail, Outlook, Yahoo, iCloud
- **SC-002**: Email sender shows branded domain in all Firebase Auth emails
- **SC-003**: SPF, DKIM, and DMARC all pass validation on MXToolbox or mail-tester.com
- **SC-004**: Zero support tickets related to "didn't receive password reset email" after implementation

---

## Related Resources

**External References**:
- **Jira Ticket**: [BFF-52](https://eriksensolutions.atlassian.net/browse/BFF-52) - Configure Custom SMTP for Firebase Email Deliverability
- **Related Ticket**: [BFF-50](https://eriksensolutions.atlassian.net/browse/BFF-50) - Firebase Auth Migration (where this issue was discovered)
- **Firebase Docs**: [Customize email handler](https://firebase.google.com/docs/auth/custom-email-handler)
- **Firebase Docs**: [Use custom SMTP server](https://firebase.google.com/docs/auth/email-custom-smtp)
- **SendGrid**: [Free tier](https://sendgrid.com/pricing/) - 100 emails/day

---

## [bigfamfestival] BFF-50-firebase-auth-migration

# Feature Specification: Firebase Auth Migration

**Jira**: [BFF-50](https://eriksensolutions.atlassian.net/browse/BFF-50)  
**Feature Branch**: `BFF-50-firebase-auth-migration`  
**Created**: 2026-02-10  
**Status**: Draft  

---

## Overview

Migrate the Big Fam Festival app from custom NestJS JWT-based authentication to Firebase Authentication. This aligns with the Detroit Dub Collective (DDC) architecture pattern, reduces maintenance burden, and provides built-in features like password reset and automatic token refresh.

### Current State
- **Backend**: Custom auth (bcrypt + JWT) with NestJS Passport strategies
- **Mobile**: React Context + SecureStore + axios interceptors for token refresh
- **Users**: 151 total, 150 with bcrypt password hashes
- **Code burden**: ~500+ lines across auth service, guards, strategies, interceptors

### Target State
- **Auth Provider**: Firebase Authentication (managed by Google)
- **Backend**: Firebase Admin SDK for ID token verification
- **Mobile**: Firebase Auth SDK via react-native-firebase
- **Code reduction**: ~70% less auth code to maintain

---

## Constitution Compliance Checklist

- [ ] **Security**: Firebase Auth handles credential storage, token management
- [ ] **Observability**: Authentication events logged via Firebase
- [ ] **Testing**: Migration script tested with subset before full import
- [ ] **Documentation**: Migration runbook and rollback procedure documented

---

## User Scenarios & Testing

### User Story 1 - Existing User Login (Priority: P1)

As an existing Big Fam user with a password, I want to log in after the migration without resetting my password, so that my experience is seamless.

**Why this priority**: Core functionality - if existing users can't log in, migration fails.

**Independent Test**: Import test user with bcrypt hash, verify login with original password works.

**Acceptance Criteria** (from Jira):
1. **Given** existing users with bcrypt passwords, **When** imported to Firebase Auth, **Then** users can log in with existing credentials
2. **Given** a migrated user attempts login, **When** they enter correct password, **Then** they are authenticated and receive a valid session

---

### User Story 2 - Automatic Token Refresh (Priority: P1)

As a mobile app user, I want my session to persist without manual re-login, so that I have uninterrupted access to the app.

**Why this priority**: Firebase Auth SDK handles this automatically - key benefit of migration.

**Independent Test**: Let app remain open for 1 hour, verify API calls still work without 401s.

**Acceptance Criteria**:
1. **Given** a mobile app user, **When** they log in, **Then** Firebase handles token refresh automatically
2. **Given** an expired access token, **When** the SDK detects it, **Then** it refreshes silently without user action

---

### User Story 3 - Password Reset (Priority: P2)

As a user who forgot my password, I want to request a password reset email, so that I can regain access to my account.

**Why this priority**: Built-in Firebase feature - enables support-free recovery.

**Independent Test**: Request reset for test user, verify email arrives, use link to set new password, login with new password.

**Acceptance Criteria**:
1. **Given** a user who forgot password, **When** they request reset, **Then** Firebase sends reset email
2. **Given** a reset email link, **When** user sets new password, **Then** they can login with new credentials

---

### User Story 4 - Backend Token Validation (Priority: P1)

As a backend service, I want to validate Firebase ID tokens on protected endpoints, so that only authenticated users access sensitive data.

**Why this priority**: Backend must trust Firebase tokens - core security requirement.

**Independent Test**: Call protected endpoint with valid Firebase token (should succeed) and invalid token (should return 401).

**Acceptance Criteria**:
1. **Given** an API request with Firebase ID token, **When** backend validates, **Then** user is authenticated properly
2. **Given** migration is complete, **When** old JWT tokens are used, **Then** they are rejected gracefully (401 with clear error)

---

### User Story 5 - New User Registration (Priority: P2)

As a new user, I want to create an account with email and password, so that I can access the app features.

**Why this priority**: Must work for new users after migration.

**Independent Test**: Register new user, verify user appears in Firebase Console, verify login works.

**Acceptance Criteria**:
1. **Given** a new visitor, **When** they register with email/password, **Then** Firebase creates the account
2. **Given** successful registration, **When** user logs in, **Then** they have access to protected features

---

### Edge Cases

- What happens when user with duplicate email exists in Firestore but not Firebase Auth?
  - Migration script should handle: import all users, flag duplicates for manual review
- How does the app handle users mid-session during deployment?
  - Rolling deployment: new code validates both JWT and Firebase tokens during transition
- What if bcrypt hash format is incompatible?
  - Firebase supports standard bcrypt, but verification pass should confirm before production

---

## Requirements

### Functional Requirements

- **FR-001**: Migration script MUST import all 150 users with bcrypt hashes to Firebase Auth preserving UIDs
- **FR-002**: Mobile app MUST replace custom AuthContext with Firebase Auth SDK integration
- **FR-003**: Backend MUST replace JwtAuthGuard with Firebase token verification
- **FR-004**: System MUST support password reset via Firebase's built-in flow
- **FR-005**: API client MUST remove custom token refresh interceptors (Firebase SDK handles this)
- **FR-006**: System MUST reject old JWT tokens with appropriate error messages post-migration
- **FR-007**: Firestore user documents MUST remove password field after successful migration
- **FR-008**: Backend MUST maintain backward compatibility during rolling deployment (accept both token types temporarily)

### Key Entities

- **Firebase User**: UID (same as Firestore doc ID), email, passwordHash (managed by Firebase)
- **Firestore User Document**: id, email, name, phone, role, ticketType, shareMyCampsite, shareMyLocation, expoPushToken (password field removed)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of existing 150 users can log in with their current passwords after migration
- **SC-002**: Zero password reset emails are required as part of migration
- **SC-003**: Backend auth code reduced by at least 60% (from ~500 lines to <200)
- **SC-004**: Token refresh happens automatically with no user-visible session expirations
- **SC-005**: Password reset flow works end-to-end (email sent within 30 seconds, link valid, password updateable)
- **SC-006**: Migration completes with zero downtime (rolling deployment)

---

## Out of Scope

- Social login providers (Google, Apple) - future enhancement
- Email verification enforcement - can be added later
- Multi-factor authentication (MFA)
- OTA updates during migration window
- User profile updates (name change, avatar) - existing flows remain unchanged

---

## Assumptions

1. Firebase Auth bcrypt import supports our hash format ($2b$ prefix)
2. User UIDs in Firestore can be preserved as Firebase UIDs
3. Mobile app can be updated before backend changes (ship new app version first)
4. Rolling deployment is acceptable (brief window where both auth methods work)
5. DDC implementation patterns are directly applicable

---

## Dependencies

- Firebase project: `bigfamfestival` (already configured)
- Firebase Admin SDK (already installed for Firestore)
- react-native-firebase package for mobile
- Service account with Firebase Auth admin permissions

---

## Related Specifications

- [BFF-4 Authentication](../BFF-4-authentication/spec.md) - Current auth implementation (to be replaced)
- [DDC-1 Authentication](https://github.com/rlerikse/es-spec-kit-context) - Reference implementation pattern

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-10 | Spec-Kit | Initial specification |

---

## [bigfamfestival] BFF-5-user-management

# User Management - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-5](https://eriksensolutions.atlassian.net/browse/BFF-5)  
**Created**: 2026-02-09  

---

## Overview

User Management provides profile viewing, updating, push token management, and notification preferences. It includes role-based access control for admin/staff operations and integrates with the notification system.

---

## User Stories

### User Story 1 - View Profile
**As a** logged-in user,  
**I want to** view my profile information,  
**So that** I can see my account details.

**Acceptance Criteria** (Verified):
- [x] User can retrieve their profile via GET /users/profile
- [x] Profile includes name, email, phone, role, ticket type
- [x] Password is never returned in profile response

**Implementation**: `backend/src/users/users.controller.ts:L30-L35`

### User Story 2 - Update Profile
**As a** logged-in user,  
**I want to** update my profile information,  
**So that** I can keep my details current.

**Acceptance Criteria** (Verified):
- [x] User can update name, phone, and sharing preferences
- [x] Updates are persisted to Firestore
- [x] Cannot update email or role (security)

**Implementation**: `backend/src/users/users.controller.ts:L37-L42`

### User Story 3 - Push Token Management
**As a** mobile app user,  
**I want** my push notification token to be registered,  
**So that** I can receive festival announcements.

**Acceptance Criteria** (Verified):
- [x] User can update their Expo push token
- [x] Token is stored with user record
- [x] Enables push notification delivery

**Implementation**: `backend/src/users/users.controller.ts:L44-L49`

### User Story 4 - Notification Preferences
**As a** user,  
**I want to** enable or disable push notifications,  
**So that** I can control what alerts I receive.

**Acceptance Criteria** (Verified):
- [x] User can toggle notifications on/off
- [x] Preference is persisted
- [x] Backend respects preference when sending

**Implementation**: `backend/src/users/users.controller.ts:L51-L60`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Get current user profile | ✅ | `users.controller.ts:L30-L35` |
| FR-002 | Update user profile | ✅ | `users.controller.ts:L37-L42` |
| FR-003 | Update push notification token | ✅ | `users.controller.ts:L44-L49` |
| FR-004 | Toggle notification preferences | ✅ | `users.controller.ts:L51-L60` |
| FR-005 | Get user by ID (admin/staff) | ✅ | `users.controller.ts:L62-L78` |
| FR-006 | List all users (admin only) | ✅ | `users.controller.ts:L80-L87` |
| FR-007 | Update any user (admin only) | ✅ | `users.controller.ts:L89-L98` |

---

## API Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/users/profile` | JWT | Any | Get current user profile |
| PUT | `/users/profile` | JWT | Any | Update current user profile |
| PUT | `/users/push-token` | JWT | Any | Update push notification token |
| PUT | `/users/notifications` | JWT | Any | Toggle notifications |
| GET | `/users/:id` | JWT | Admin, Staff, Self | Get user by ID |
| GET | `/users` | JWT | Admin | List all users |
| PUT | `/users/:id` | JWT | Admin | Update any user |

---

## Data Model

### User Interface
```typescript
interface User {
  id: string;
  email: string;
  password: string;          // bcrypt hashed, never returned
  name: string;
  phone?: string;
  role: Role;                // ATTENDEE | STAFF | ADMIN
  shareMyCampsite: boolean;
  shareMyLocation: boolean;
  ticketType: string;        // 'need-ticket' | 'general' | 'vip'
  expoPushToken?: string;
  notificationsEnabled?: boolean;
  profilePictureUrl?: string;
}
```

### UpdateUserDto
```typescript
interface UpdateUserDto {
  name?: string;
  phone?: string;
  shareMyCampsite?: boolean;
  shareMyLocation?: boolean;
  ticketType?: string;
  profilePictureUrl?: string;
}
```

### Role Enum
```typescript
enum Role {
  ATTENDEE = 'attendee',
  STAFF = 'staff',
  ADMIN = 'admin',
}
```

---

## Authorization Rules

| Operation | ATTENDEE | STAFF | ADMIN |
|-----------|----------|-------|-------|
| View own profile | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| View other user | ❌ | ✅ | ✅ |
| List all users | ❌ | ❌ | ✅ |
| Update any user | ❌ | ❌ | ✅ |

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| User not found | NotFoundException (404) | `users.service.ts:L36` |
| Unauthorized access to other user | UnauthorizedException (401) | `users.controller.ts:L72-L77` |
| Invalid update data | Validation error (400) | DTO validation |

---

## File Structure

```
backend/src/users/
├── users.controller.ts    # HTTP endpoints
├── users.module.ts        # Module definition
├── users.service.ts       # Business logic
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
└── interfaces/
    └── user.interface.ts

mobile/src/
├── screens/ProfileScreen.tsx
└── services/userService.ts
```

---

## Related Specifications

- [BFF-4 Authentication](../BFF-4-authentication/spec.md) - User creation and login
- [BFF-8 Push Notifications](../BFF-8-push-notifications/spec.md) - Uses push tokens

---

## [bigfamfestival] BFF-4-authentication

# Authentication System - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-4](https://eriksensolutions.atlassian.net/browse/BFF-4)  
**Created**: 2026-02-09  

---

## Overview

The Authentication System provides user registration, login, and session management for the Big Fam Festival app. It uses JWT-based authentication with bcrypt password hashing and integrates with Firebase/Firestore for user persistence.

---

## User Stories

### User Story 1 - User Registration
**As a** festival attendee,  
**I want to** create an account with my email and password,  
**So that** I can access personalized features like my schedule and notifications.

**Acceptance Criteria** (Verified):
- [x] User can register with name, email, password, and optional phone
- [x] Email must be unique (duplicate registration throws ConflictException)
- [x] Password is hashed with bcrypt before storage
- [x] User receives JWT token upon successful registration
- [x] Default role is ATTENDEE

**Implementation**: `backend/src/auth/auth.service.ts:L24-L52`

### User Story 2 - User Login
**As a** registered user,  
**I want to** log in with my credentials,  
**So that** I can access my account and saved data.

**Acceptance Criteria** (Verified):
- [x] User can login with email and password
- [x] Invalid credentials return UnauthorizedException
- [x] Successful login returns JWT token and sanitized user data
- [x] Token is stored securely on mobile device (SecureStore)

**Implementation**: `backend/src/auth/auth.service.ts:L57-L85`

### User Story 3 - Protected Route Access
**As an** authenticated user,  
**I want** my requests to be automatically authenticated,  
**So that** I can access protected endpoints seamlessly.

**Acceptance Criteria** (Verified):
- [x] JWT is validated on protected routes via JwtAuthGuard
- [x] Token contains user ID, email, and role
- [x] Expired/invalid tokens return 401 Unauthorized

**Implementation**: `backend/src/auth/guards/jwt-auth.guard.ts`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Register user with email/password | ✅ | `auth.service.ts:L24-L52` |
| FR-002 | Validate email uniqueness | ✅ | `auth.service.ts:L26-L29` |
| FR-003 | Hash passwords with bcrypt | ✅ | `auth.service.ts:L32` |
| FR-004 | Generate JWT on registration | ✅ | `auth.service.ts:L45` |
| FR-005 | Validate login credentials | ✅ | `auth.service.ts:L57-L73` |
| FR-006 | Generate JWT on login | ✅ | `auth.service.ts:L78-L84` |
| FR-007 | Protect routes with JWT guard | ✅ | `jwt-auth.guard.ts` |
| FR-008 | Role-based access control | ✅ | `roles.guard.ts` |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login user |
| GET | `/auth/profile` | JWT | Get current user profile |

---

## Data Model

### RegisterDto
```typescript
interface RegisterDto {
  name: string;        // Required, non-empty string
  email: string;       // Required, valid email format
  password: string;    // Required, min 8 characters
  phone?: string;      // Optional, phone format validation
}
```

### LoginDto
```typescript
interface LoginDto {
  email: string;       // Required, valid email format
  password: string;    // Required, min 8 characters
}
```

### JWT Payload
```typescript
interface JwtPayload {
  sub: string;         // User ID
  email: string;       // User email
  role: Role;          // User role (ATTENDEE, STAFF, ADMIN)
}
```

### User (stored in Firestore)
```typescript
interface User {
  id: string;
  email: string;
  password: string;    // bcrypt hashed
  name: string;
  phone?: string;
  role: Role;
  shareMyCampsite: boolean;
  shareMyLocation: boolean;
  ticketType: string;
  expoPushToken?: string;
  notificationsEnabled?: boolean;
}
```

---

## Security Considerations

| Concern | Mitigation | Location |
|---------|------------|----------|
| Password storage | bcrypt hashing with salt | `auth.service.ts:L32` |
| Token security | JWT with expiration | `auth.module.ts` |
| Mobile token storage | Expo SecureStore | `AuthContext.tsx:L68` |
| Password in response | Sanitized before return | `auth.service.ts:sanitizeUser()` |

---

## Mobile Integration

### AuthContext
The mobile app uses React Context for authentication state management:
- Persists token in SecureStore
- Auto-loads user on app start
- Provides login, register, logout, guest login functions
- Schedules push notifications on login

**Implementation**: `mobile/src/contexts/AuthContext.tsx`

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Duplicate email registration | ConflictException (409) | `auth.service.ts:L28` |
| Invalid credentials | UnauthorizedException (401) | `auth.service.ts:L64,L70` |
| Expired JWT token | 401 with token refresh attempt | `apiClient.ts:L72-L95` |
| Network error on login | User-friendly error message | `AuthContext.tsx:L107-L110` |

---

## File Structure

```
backend/src/auth/
├── auth.controller.ts      # HTTP endpoints
├── auth.module.ts          # Module definition
├── auth.service.ts         # Business logic
├── decorators/
│   ├── public.decorator.ts # Mark routes as public
│   └── roles.decorator.ts  # Role-based access
├── dto/
│   ├── login.dto.ts        # Login validation
│   └── register.dto.ts     # Registration validation
├── enums/
│   └── role.enum.ts        # User roles
├── guards/
│   ├── jwt-auth.guard.ts   # JWT validation
│   ├── local-auth.guard.ts # Local strategy guard
│   └── roles.guard.ts      # Role checking
└── strategies/
    ├── jwt.strategy.ts     # JWT passport strategy
    └── local.strategy.ts   # Local passport strategy

mobile/src/
├── contexts/AuthContext.tsx    # Auth state management
├── screens/auth/
│   ├── LoginScreen.tsx         # Login UI
│   └── RegisterScreen.tsx      # Registration UI
└── services/authService.ts     # API calls
```

---

## Dependencies

### Backend
- `@nestjs/jwt` - JWT token generation
- `@nestjs/passport` - Authentication strategies
- `bcrypt` - Password hashing
- `passport-jwt` - JWT strategy
- `passport-local` - Local strategy

### Mobile
- `expo-secure-store` - Secure token storage
- `axios` - HTTP client

---

## Related Specifications

- [BFF-5 User Management](../BFF-5-user-management/spec.md) - User profile operations
- [BFF-8 Push Notifications](../BFF-8-push-notifications/spec.md) - Notification scheduling on login

---

## [bigfamfestival] BFF-39-mobile-deployment

# BFF-39: Mobile Deployment & Release

**Epic**: [BFF-39](https://eriksensolutions.atlassian.net/browse/BFF-39)  
**Status**: 60% Complete  
**Created**: 2026-02-10  
**Version**: 1.0  

---

## Overview

End-to-end mobile application deployment pipeline for the Big Fam Festival app, enabling releases to iOS App Store and Android Google Play Store with build automation, credential management, and beta testing workflows.

## Business Context

### Problem Statement
The Big Fam Festival mobile app requires a robust, repeatable deployment process to:
- Release updates to iOS and Android app stores
- Manage signing credentials securely
- Enable beta testing before production releases
- Automate builds to reduce manual effort and errors

### Goals
1. Establish working iOS and Android build/submission pipelines
2. Document all processes for team knowledge transfer
3. Enable automated submissions where possible
4. Support beta testing for pre-release validation

### Success Criteria
- [ ] Production builds successfully upload to both app stores
- [ ] iOS app passes App Store Review
- [ ] Android app passes Google Play policy review
- [ ] Beta testers can install and test pre-release builds
- [ ] CI/CD pipeline triggers builds on release branches

---

## Scope

### In Scope
| Area | Description |
|------|-------------|
| EAS Configuration | Build profiles for development, preview, and production |
| iOS Distribution | App Store Connect setup, signing, submission via Transporter |
| Android Distribution | Google Play Console setup, signing, submission |
| Beta Testing | TestFlight (iOS) and Internal Testing (Android) workflows |
| CI/CD | GitHub Actions workflow for automated builds |
| Documentation | Release guides and checklists |

### Out of Scope
- OTA updates via EAS Update (future enhancement)
- Automated rollback strategies
- A/B testing framework
- App monetization/in-app purchases

---

## User Scenarios & Stories

### Completed Stories ✅

#### M.1: EAS Build Configuration ([BFF-40](https://eriksensolutions.atlassian.net/browse/BFF-40))
Configure Expo Application Services for multi-environment builds.

**Implementation:**
- `mobile/eas.json` with development, preview, and production profiles
- Auto-increment build numbers enabled
- Node version pinned to 20.19.4
- Platform-specific configurations (iOS m-medium resource, Android app-bundle)

#### M.2: iOS Developer Account & Signing ([BFF-41](https://eriksensolutions.atlassian.net/browse/BFF-41))
Apple Developer Program enrollment and code signing setup.

**Implementation:**
- Apple Developer Program enrolled
- Bundle ID: `com.eriksensolutions.bigfam`
- App Store Connect listing (ASC ID: 6752632634)
- Team ID: XQ353QHFF7
- EAS-managed signing credentials

#### M.3: Android Developer Account & Signing ([BFF-42](https://eriksensolutions.atlassian.net/browse/BFF-42))
Google Play Developer account and app signing configuration.

**Implementation:**
- Google Play Developer account created
- Package name: `com.eriksensolutions.bigfam`
- Play App Signing enrolled
- EAS-managed signing credentials

#### M.4: Manual iOS Submission Workflow ([BFF-43](https://eriksensolutions.atlassian.net/browse/BFF-43))
Documented workflow for iOS App Store submissions.

**Implementation:**
- Build via `eas build --platform ios --profile production`
- Download .ipa from Expo dashboard
- Upload via Transporter app (macOS)
- Submit for App Review in App Store Connect

#### M.5: Manual Android Submission Workflow ([BFF-44](https://eriksensolutions.atlassian.net/browse/BFF-44))
Documented workflow for Google Play Store submissions.

**Implementation:**
- Build via `eas build --platform android --profile production`
- Download .aab from Expo dashboard
- Upload via Google Play Console
- Create release in Production or Closed testing track

---

### Remaining Stories ⏳

#### M.6: Android Closed Testing Completion ([BFF-45](https://eriksensolutions.atlassian.net/browse/BFF-45))
Complete Google Play's mandatory 14-day closed testing requirement.

**Requirements:**
- [ ] Create/verify closed testing track
- [ ] Add 20+ testers
- [ ] Wait 14 continuous days
- [ ] Verify production access unlocked

#### M.7: Google Play Service Account ([BFF-46](https://eriksensolutions.atlassian.net/browse/BFF-46))
Enable automated Android submissions via `eas submit`.

**Requirements:**
- [ ] Create service account in Google Cloud Console
- [ ] Generate JSON key file
- [ ] Configure Play Console API access
- [ ] Add to .gitignore
- [ ] Test automated submission

#### M.8: Environment Configuration Files ([BFF-47](https://eriksensolutions.atlassian.net/browse/BFF-47))
Create environment-specific configuration for staging and production.

**Requirements:**
- [ ] Create `.env.staging` with staging API/Firebase config
- [ ] Create `.env.production` with production API/Firebase config
- [ ] Update build profiles to reference env files

#### M.9: Beta Testing Workflow ([BFF-48](https://eriksensolutions.atlassian.net/browse/BFF-48))
Establish beta testing processes for both platforms.

**Requirements:**
- [ ] Configure TestFlight for iOS beta testing
- [ ] Configure Internal Testing track for Android
- [ ] Document beta tester onboarding
- [ ] Test EAS preview builds for quick distribution

#### M.10: CI/CD Build Automation ([BFF-49](https://eriksensolutions.atlassian.net/browse/BFF-49))
Automate mobile builds via GitHub Actions.

**Requirements:**
- [ ] Create `.github/workflows/mobile-build.yml`
- [ ] Run tests before builds
- [ ] Trigger EAS builds on release branches
- [ ] Configure required secrets (EXPO_TOKEN, etc.)

---

## Technical Architecture

### Build Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Source Code   │────▶│    EAS Build    │────▶│  App Stores     │
│   (GitHub)      │     │  (Expo Cloud)   │     │  (iOS/Android)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │               ┌─────────────────┐             │
        │               │   Artifacts     │             │
        │               │  (.ipa/.aab)    │             │
        │               └─────────────────┘             │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  CI/CD Tests    │     │  Manual/Auto    │     │  Store Review   │
│  (npm test)     │     │   Submit        │     │  (Apple/Google) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Configuration Files

| File | Purpose |
|------|---------|
| `mobile/eas.json` | EAS build & submit configuration |
| `mobile/app.json` | Expo app configuration |
| `mobile/.env.*` | Environment-specific variables |
| `.github/workflows/mobile-build.yml` | CI/CD automation |

### Credentials Management

| Platform | Credential | Storage |
|----------|-----------|---------|
| iOS | Distribution Certificate | EAS Managed |
| iOS | Provisioning Profile | EAS Managed |
| iOS | Apple ID | `eas.json` |
| Android | Upload Key | EAS Managed |
| Android | Service Account | `google-play-service-account.json` (gitignored) |

---

## Implementation Summary

### Completed Components

| Component | Location | Description |
|-----------|----------|-------------|
| EAS Config | `mobile/eas.json` | Build profiles for all environments |
| iOS Credentials | EAS/Apple | Signing managed via EAS |
| Android Credentials | EAS/Google | Signing managed via EAS |
| Release Guide | `docs/MOBILE_RELEASE_GUIDE.md` | Complete release documentation |
| Checklist | `docs/RELEASE_CHECKLIST.md` | Pre-release validation |

### Pending Implementation

| Component | Story | Priority |
|-----------|-------|----------|
| Android Closed Testing | BFF-45 | P1 - Blocking production |
| Service Account | BFF-46 | P2 - Enables automation |
| Environment Files | BFF-47 | P2 - Required for multi-env |
| Beta Testing | BFF-48 | P2 - Pre-release validation |
| CI/CD | BFF-49 | P3 - Automation enhancement |

---

## Related Documentation

- [MOBILE_RELEASE_GUIDE.md](../../docs/MOBILE_RELEASE_GUIDE.md) - Complete release workflow
- [RELEASE_CHECKLIST.md](../../docs/RELEASE_CHECKLIST.md) - Pre-release validation
- [DEVELOPMENT_SETUP.md](../../mobile/DEVELOPMENT_SETUP.md) - Local development setup

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-10 | AI Assistant | Initial spec created from existing implementation |

---

## [bigfamfestival] BFF-38-qr-scanner-gate-entry

# Feature Specification: QR Scanner for Gate Entry Staff

**Jira**: [BFF-38](https://eriksensolutions.atlassian.net/browse/BFF-38)  
**Feature Branch**: `BFF-38-qr-scanner-gate-entry`  
**Created**: 2026-02-10  
**Status**: On Hold  
**Epic**: BFF-17 (Ticketing & Entry)

---

## Overview

Staff-facing QR scanner for validating tickets at festival entry gates. Companion feature to BFF-27 (QR Code Ticket Display).

### Current State
- No in-app QR scanning for staff
- External scanning hardware required

### Target State
- Camera-based QR scanning in staff app
- Backend ticket validation
- Valid/invalid status display with details
- Audit trail for all scans
- Offline validation with sync

---

## Constitution Compliance Checklist

- [ ] **Security**: Staff role required for scanner access
- [ ] **Observability**: All scans logged for audit trail
- [ ] **Offline**: Validation works offline with later sync
- [ ] **Testing**: Scanning accuracy and validation flow tested

---

## User Scenarios & Testing

### User Story 1 - Scan Ticket QR Code (Priority: P1)

As gate staff, I want to scan attendee QR codes with my phone camera, so that I can validate tickets.

**Why this priority**: Core functionality for gate entry.

**Independent Test**: Display test QR, scan with staff app, verify validation result.

**Acceptance Criteria** (from Jira):
1. **Given** staff opens scanner, **When** camera active, **Then** QR codes are detected
2. **Given** QR detected, **When** scanned, **Then** ticket validated against backend

---

### User Story 2 - Display Validation Result (Priority: P1)

As gate staff, I want to see clear valid/invalid status with details, so that I know whether to admit the attendee.

**Acceptance Criteria**:
1. **Given** ticket scanned, **When** valid, **Then** green checkmark with ticket details shown
2. **Given** ticket scanned, **When** invalid, **Then** red X with reason shown

---

### User Story 3 - Audit Trail (Priority: P1)

As festival management, I want all scans logged, so that I have a record for security and analytics.

**Acceptance Criteria**:
1. **Given** ticket scanned, **When** logged, **Then** includes: timestamp, staff ID, ticket ID, result
2. **Given** audit log, **When** queried, **Then** all scans retrievable

---

### User Story 4 - Offline Validation (Priority: P2)

As gate staff without cell signal, I want to continue scanning, so that entry isn't blocked by connectivity.

**Acceptance Criteria**:
1. **Given** offline, **When** scanning, **Then** validation uses cached ticket data
2. **Given** connection restored, **When** syncing, **Then** offline scans uploaded

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide camera-based QR scanning
- **FR-002**: System MUST validate ticket against backend
- **FR-003**: System MUST show valid/invalid status with ticket details
- **FR-004**: System MUST log all scans for audit trail
- **FR-005**: System MUST support offline validation with sync
- **FR-006**: System MUST require staff role to access scanner

### Key Entities

- **ScanLog**: id, ticketId, staffId, timestamp, result, syncStatus

### Technical Notes (from Jira)

- Package: expo-camera or react-native-camera
- Backend: POST /api/tickets/validate
- Staff role required
- ScannerScreen.tsx

---

## Success Criteria

- **SC-001**: QR detection within 1 second
- **SC-002**: Validation response within 2 seconds (online)
- **SC-003**: 100% scan accuracy for valid QR codes
- **SC-004**: Offline cache supports 10,000+ tickets

---

## [bigfamfestival] BFF-37-campsite-location-sharing

# Feature Specification: Campsite Location Sharing with Friends

**Jira**: [BFF-37](https://eriksensolutions.atlassian.net/browse/BFF-37)  
**Feature Branch**: `BFF-37-campsite-location-sharing`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-25 (Friends & Campsite)

---

## Overview

Allow users to share their campsite location with approved friends, making it easy to find each other at the festival.

### Current State
- Users can set their campsite location (BFF-10)
- No sharing capability with friends
- No visibility of friends' campsites

### Target State
- Toggle campsite visibility (private/friends)
- View friends' campsites on map
- Navigate to friend's campsite
- Real-time location updates

---

## Constitution Compliance Checklist

- [ ] **Security**: Campsite location only visible to accepted friends
- [ ] **Privacy**: Users control visibility via toggle
- [ ] **Testing**: Permission model and real-time updates tested
- [ ] **Documentation**: Privacy controls documented

---

## User Scenarios & Testing

### User Story 1 - Set Campsite Visibility (Priority: P1)

As a user, I want to control who can see my campsite location, so that I maintain privacy.

**Why this priority**: Privacy foundation for feature.

**Independent Test**: Toggle visibility, verify friends can/cannot see campsite.

**Acceptance Criteria** (from Jira):
1. **Given** campsite set, **When** toggling visibility, **Then** can choose private or friends
2. **Given** set to friends, **When** friend views map, **Then** campsite visible to them

---

### User Story 2 - View Friends' Campsites on Map (Priority: P1)

As a user, I want to see my friends' campsites on the map, so that I can find them.

**Acceptance Criteria**:
1. **Given** friend shared campsite, **When** viewing map, **Then** friend's campsite marker shows
2. **Given** multiple friends, **When** viewing map, **Then** all shared campsites display

---

### User Story 3 - Navigate to Friend's Campsite (Priority: P2)

As a user, I want to navigate to a friend's campsite, so that I can find their location.

**Acceptance Criteria**:
1. **Given** friend's campsite marker, **When** tapping, **Then** can start navigation
2. **Given** navigation started, **When** following, **Then** arrives at friend's campsite

---

### User Story 4 - Real-Time Location Updates (Priority: P3)

As a user, I want friends' campsite locations to update in real-time (if they move), so that I have current info.

**Acceptance Criteria**:
1. **Given** friend updates campsite, **When** I view map, **Then** new location shows
2. **Given** map open, **When** friend moves campsite, **Then** marker updates without refresh

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow toggling campsite visibility (private/friends)
- **FR-002**: System MUST show friends' campsites on map when shared
- **FR-003**: System MUST support navigation to friend's campsite
- **FR-004**: System MUST update friend's campsite location in real-time
- **FR-005**: System MUST show friend markers with profile pictures

### Technical Notes (from Jira)

- Extend campsites collection with visibility field
- Backend: GET /api/campsites/friends
- Show friend markers on MapScreen with profile pics

---

## Success Criteria

- **SC-001**: Friends' campsite markers load within 3 seconds
- **SC-002**: Location updates reflect within 30 seconds
- **SC-003**: Navigation to campsite accurate within 10 meters

---

## [bigfamfestival] BFF-36-medical-emergency-request

# Feature Specification: Medical Emergency Request System

**Jira**: [BFF-36](https://eriksensolutions.atlassian.net/browse/BFF-36)  
**Feature Branch**: `BFF-36-medical-emergency-request`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-15 (Role-Specific Panels)

---

## Overview

Allow attendees to request medical assistance through the app, with automatic location sharing and priority levels.

### Current State
- No in-app medical assistance request
- Attendees must find medical station or call staff

### Target State
- Emergency button on home screen
- Location sent with request automatically
- Priority levels (urgent/non-urgent)
- Status tracking for requestor
- Push notification to medical staff

---

## Constitution Compliance Checklist

- [ ] **Security**: Medical requests protected data, role-based access
- [ ] **Observability**: All medical requests logged with full audit trail
- [ ] **Reliability**: High availability required (critical feature)
- [ ] **Testing**: End-to-end request flow tested including push notifications

---

## User Scenarios & Testing

### User Story 1 - Request Medical Assistance (Priority: P1)

As a festival attendee experiencing a medical issue, I want to request help through the app, so that medical staff can find me.

**Why this priority**: Critical safety feature.

**Independent Test**: Submit test request, verify request appears in medical staff queue.

**Acceptance Criteria** (from Jira):
1. **Given** user on home screen, **When** they tap emergency button, **Then** medical request form opens
2. **Given** request submitted, **When** sent, **Then** medical staff notified via push

---

### User Story 2 - Automatic Location Sharing (Priority: P1)

As a user requesting medical help, I want my location sent automatically, so that staff can find me quickly.

**Acceptance Criteria**:
1. **Given** request submitted, **When** sent, **Then** current GPS coordinates included
2. **Given** location sent, **When** staff views request, **Then** location shows on their map

---

### User Story 3 - Priority Level Selection (Priority: P2)

As a user, I want to indicate if my situation is urgent or non-urgent, so that staff can prioritize appropriately.

**Acceptance Criteria**:
1. **Given** request form open, **When** selecting priority, **Then** can choose urgent or non-urgent
2. **Given** urgent selected, **When** submitted, **Then** request flagged as high priority

---

### User Story 4 - Status Tracking (Priority: P2)

As a user who requested help, I want to see the status of my request, so that I know help is coming.

**Acceptance Criteria**:
1. **Given** request submitted, **When** viewing status, **Then** shows: pending, en route, arrived
2. **Given** staff updates status, **When** viewed by user, **Then** new status displays

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide emergency button on home screen
- **FR-002**: System MUST send current GPS location with request
- **FR-003**: System MUST support priority levels: urgent, non-urgent
- **FR-004**: System MUST track request status
- **FR-005**: System MUST send push notification to medical staff
- **FR-006**: System MUST log all medical requests for audit trail

### Key Entities

- **MedicalRequest**: id, userId, location, priority, status, description, createdAt, assignedStaffId

### Technical Notes (from Jira)

- MedicalRequests Firestore collection
- Backend: POST /api/medical/request
- Push notification to medical staff
- MedicalRequestScreen.tsx

---

## Success Criteria

- **SC-001**: Medical staff notified within 10 seconds of request
- **SC-002**: Location accuracy within 10 meters
- **SC-003**: 99.9% uptime for medical request feature

---

## [bigfamfestival] BFF-35-mapbox-here-interactive-map

# Feature Specification: Mapbox/HERE SDK Interactive Map

**Jira**: [BFF-35](https://eriksensolutions.atlassian.net/browse/BFF-35)  
**Feature Branch**: `BFF-35-mapbox-here-interactive-map`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-24 (Interactive Map & POI)

---

## Overview

Integrate Mapbox/HERE SDK to replace static map image with an interactive, zoomable map of the festival grounds.

### Current State
- Static map image in MapScreen.tsx
- No pan/zoom capability
- No custom styling

### Target State
- Interactive map with Mapbox/HERE SDK
- Pan and zoom functionality
- Custom festival-themed map style
- Map bounded to festival venue

---

## Constitution Compliance Checklist

- [ ] **Security**: API keys for Mapbox/HERE secured
- [ ] **Performance**: Map tiles cached for offline use
- [ ] **Testing**: Map rendering tested on iOS and Android
- [ ] **Documentation**: Map style and bounds documented

---

## User Scenarios & Testing

### User Story 1 - View Interactive Map (Priority: P1)

As a festival attendee, I want an interactive map of the grounds, so that I can explore and orient myself.

**Why this priority**: Foundation for all map features.

**Independent Test**: Open MapScreen, verify map loads with pan/zoom capability.

**Acceptance Criteria** (from Jira):
1. **Given** user opens map, **When** map loads, **Then** interactive map of festival grounds displays
2. **Given** map displayed, **When** user zooms, **Then** map scales smoothly

---

### User Story 2 - Pan and Zoom (Priority: P1)

As a user, I want to pan around the map and zoom in/out, so that I can view different areas at different detail levels.

**Acceptance Criteria**:
1. **Given** map displayed, **When** user drags, **Then** map pans in that direction
2. **Given** map displayed, **When** user pinches, **Then** map zooms in/out

---

### User Story 3 - Festival Bounds (Priority: P2)

As a user, I want the map bounded to the festival venue, so that I don't accidentally navigate away from relevant areas.

**Acceptance Criteria**:
1. **Given** map displayed, **When** user pans too far, **Then** map snaps back to venue bounds
2. **Given** map zoomed out max, **When** displayed, **Then** entire venue visible

---

### User Story 4 - Custom Map Style (Priority: P2)

As a user, I want the map to match the festival theme, so that the experience feels cohesive.

**Acceptance Criteria**:
1. **Given** map displayed, **When** viewed, **Then** custom festival colors and styling applied

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST use Mapbox or HERE SDK for map rendering
- **FR-002**: System MUST support pan and zoom gestures
- **FR-003**: System MUST bound map to festival venue coordinates
- **FR-004**: System MUST apply custom map style matching festival theme
- **FR-005**: System MUST initialize SDK with API key from festival config

### Technical Notes (from Jira)

- Decision 7 selected Mapbox/HERE hybrid approach
- Package: `@rnmapbox/maps` or `react-native-here-explore`
- Replace current static image in MapScreen.tsx

---

## Success Criteria

- **SC-001**: Map loads within 3 seconds on LTE connection
- **SC-002**: Smooth 60fps pan/zoom performance
- **SC-003**: Map renders correctly offline after initial load

---

## [bigfamfestival] BFF-34-social-login-sso

# Feature Specification: Social Login (Google/Apple SSO)

**Jira**: [BFF-34](https://eriksensolutions.atlassian.net/browse/BFF-34)  
**Feature Branch**: `BFF-34-social-login-sso`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-22 (Auth & User Profile)

---

## Overview

Support Google and Apple SSO for streamlined login, reducing friction for new users.

### Current State
- Email/password authentication only (via Firebase Auth)
- Users must create and remember password

### Target State
- Sign in with Google option
- Sign in with Apple option
- Link existing accounts to social logins
- First-time profile completion flow

---

## Constitution Compliance Checklist

- [ ] **Security**: Social provider tokens validated server-side
- [ ] **Privacy**: Minimal data collected from social providers
- [ ] **Platform Requirements**: Apple Sign-In required for iOS
- [ ] **Testing**: Social login flows tested on iOS and Android

---

## User Scenarios & Testing

### User Story 1 - Sign In with Google (Priority: P1)

As a new user, I want to sign in with my Google account, so that I can quickly access the app.

**Why this priority**: Most popular social login provider.

**Independent Test**: Tap Google sign-in, complete OAuth flow, verify account created.

**Acceptance Criteria** (from Jira):
1. **Given** login screen, **When** user taps Sign in with Google, **Then** Google OAuth flow starts
2. **Given** Google auth complete, **When** returning to app, **Then** user is logged in

---

### User Story 2 - Sign In with Apple (Priority: P1)

As an iOS user, I want to sign in with my Apple ID, so that I can use a familiar login method.

**Why this priority**: Required for iOS app store compliance.

**Acceptance Criteria**:
1. **Given** login screen on iOS, **When** user taps Sign in with Apple, **Then** Apple OAuth flow starts
2. **Given** Apple auth complete, **When** returning to app, **Then** user is logged in

---

### User Story 3 - Link Existing Account (Priority: P2)

As an existing user, I want to link my Google/Apple account to my existing profile, so that I can use social login going forward.

**Acceptance Criteria**:
1. **Given** logged in user, **When** in settings, **Then** can link social account
2. **Given** social account linked, **When** logging in later, **Then** can use either method

---

### User Story 4 - First-Time Profile Completion (Priority: P2)

As a new user via social login, I want to complete my profile with additional info, so that I can use all app features.

**Acceptance Criteria**:
1. **Given** new social login user, **When** first login complete, **Then** profile completion screen shows
2. **Given** profile completed, **When** submitting, **Then** account is fully set up

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST support Sign in with Google
- **FR-002**: System MUST support Sign in with Apple (required for iOS)
- **FR-003**: System MUST allow linking social accounts to existing email accounts
- **FR-004**: System MUST prompt new social users to complete profile
- **FR-005**: System MUST handle account linking conflicts gracefully

### Technical Notes (from Jira)

- Firebase Auth providers (Google, Apple)
- Package: expo-auth-session or @react-native-google-signin/google-signin
- Update AuthContext.tsx

---

## Success Criteria

- **SC-001**: Social login completes within 10 seconds
- **SC-002**: 100% of iOS users see Apple Sign-In option
- **SC-003**: Account linking conflicts handled without data loss

---

## [bigfamfestival] BFF-33-schedule-snapshot-sharing

# Feature Specification: Schedule Snapshot Social Sharing

**Jira**: [BFF-33](https://eriksensolutions.atlassian.net/browse/BFF-33)  
**Feature Branch**: `BFF-33-schedule-snapshot-sharing`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-21 (Schedule Snapshot Sharing)

---

## Overview

Generate shareable images of personal festival schedule for social media sharing.

### Current State
- Personal schedule viewable in-app only
- No sharing capability

### Target State
- Generate branded schedule snapshot as image
- Share to social media platforms
- Option for full festival or single day

---

## Constitution Compliance Checklist

- [ ] **Security**: User schedule data only visible with their consent
- [ ] **Branding**: Festival branding included in generated images
- [ ] **Testing**: Image generation and share flow tested on iOS/Android
- [ ] **Documentation**: Share template specifications documented

---

## User Scenarios & Testing

### User Story 1 - Generate Schedule Snapshot (Priority: P1)

As a user, I want to generate an image of my personal schedule, so that I can share it.

**Why this priority**: Core functionality for social sharing.

**Independent Test**: Create personal schedule, generate snapshot, verify image created.

**Acceptance Criteria** (from Jira):
1. **Given** user has personal schedule, **When** they tap share, **Then** schedule image is generated
2. **Given** image generated, **When** displayed, **Then** includes festival branding

---

### User Story 2 - Share to Social Media (Priority: P1)

As a user with schedule image, I want to share it to Instagram, Twitter, or Facebook, so that my friends know my plans.

**Why this priority**: Primary use case for the feature.

**Acceptance Criteria**:
1. **Given** schedule image generated, **When** user taps share, **Then** native share sheet opens
2. **Given** share sheet open, **When** user selects platform, **Then** image posts successfully

---

### User Story 3 - Select Day or Full Festival (Priority: P2)

As a user, I want to choose whether to share one day or my full schedule, so that I control what I share.

**Acceptance Criteria**:
1. **Given** share initiated, **When** options shown, **Then** can select specific day or full festival
2. **Given** day selected, **When** image generated, **Then** only that day's events included

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST generate schedule as shareable image
- **FR-002**: System MUST include festival branding in generated image
- **FR-003**: System MUST support sharing to Instagram, Twitter, Facebook
- **FR-004**: System MUST allow selection of specific day or full festival
- **FR-005**: System MUST use native OS share sheet

### Technical Notes (from Jira)

- Package: react-native-view-shot
- Share API: react-native-share
- Template component: ScheduleShareCard.tsx

---

## Success Criteria

- **SC-001**: Image generation completes within 3 seconds
- **SC-002**: Share success rate > 95%
- **SC-003**: Image displays correctly on all target platforms

---

## [bigfamfestival] BFF-32-what3words-navigation

# Feature Specification: What3Words Navigation Integration

**Jira**: [BFF-32](https://eriksensolutions.atlassian.net/browse/BFF-32)  
**Feature Branch**: `BFF-32-what3words-navigation`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-26 (Navigation & Wayfinding)

---

## Overview

Turn-by-turn navigation within festival grounds using What3Words for precise location addressing.

### Current State
- Basic map view without navigation
- No precise location addressing for festival areas

### Target State
- Walking navigation from user location to any POI
- What3Words address support for precise festival locations
- Step-by-step walking directions with ETA

---

## Constitution Compliance Checklist

- [ ] **Security**: API keys for What3Words and navigation services secured
- [ ] **Observability**: Navigation requests logged
- [ ] **Testing**: Navigation accuracy tested on venue map
- [ ] **Documentation**: What3Words zones documented

---

## User Scenarios & Testing

### User Story 1 - Navigate to POI (Priority: P1)

As a festival attendee, I want walking directions to a stage or vendor, so that I can find my way.

**Why this priority**: Core navigation functionality.

**Independent Test**: Request navigation to known POI, verify directions display.

**Acceptance Criteria** (from Jira):
1. **Given** user on map, **When** they select navigate to POI, **Then** walking directions display
2. **Given** directions displayed, **When** user at destination, **Then** navigation completes

---

### User Story 2 - What3Words Address Support (Priority: P2)

As a user, I want to enter a What3Words address to navigate to a specific spot, so that I can find exact locations like my campsite.

**Acceptance Criteria**:
1. **Given** user enters What3Words address, **When** resolved, **Then** location shown on map
2. **Given** location resolved, **When** user starts navigation, **Then** directions to that spot display

---

### User Story 3 - ETA Display (Priority: P1)

As a user navigating, I want to see my estimated arrival time, so that I know how long the walk will take.

**Acceptance Criteria**:
1. **Given** navigation active, **When** displayed, **Then** ETA shows based on walking speed
2. **Given** user progresses, **When** ETA changes, **Then** display updates

---

### User Story 4 - Step-by-Step Instructions (Priority: P2)

As a user navigating, I want step-by-step walking instructions, so that I know which turns to take.

**Acceptance Criteria**:
1. **Given** navigation active, **When** next turn approaches, **Then** instruction displayed
2. **Given** user reaches turn point, **When** passed, **Then** next instruction shows

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide walking navigation from current location to selected POI
- **FR-002**: System MUST resolve What3Words addresses to coordinates
- **FR-003**: System MUST display ETA based on walking speed (~4 km/h)
- **FR-004**: System MUST show step-by-step walking instructions
- **FR-005**: System MUST NOT provide vehicle directions (walking only)

### Technical Notes (from Jira)

- Mapbox Navigation SDK or HERE Routing API
- What3Words API for location conversion
- NavigationView.tsx overlay

---

## Success Criteria

- **SC-001**: What3Words address resolves within 2 seconds
- **SC-002**: Navigation route calculates within 3 seconds
- **SC-003**: ETA accuracy within 2 minutes for festival grounds

---

## [bigfamfestival] BFF-31-vendor-dashboard-panel

# Feature Specification: Vendor Dashboard Panel

**Jira**: [BFF-31](https://eriksensolutions.atlassian.net/browse/BFF-31)  
**Feature Branch**: `BFF-31-vendor-dashboard-panel`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-15 (Role-Specific Panels)

---

## Overview

Specialized panel for vendors to manage their booth operations and view sales insights at the festival.

### Current State
- No vendor-specific features
- Vendors use same app interface as attendees

### Target State
- Dedicated vendor dashboard
- Booth info and hours management
- Menu/product display
- Basic analytics (if POS integration available)

---

## Constitution Compliance Checklist

- [ ] **Contract Compliance**: Vendor API endpoints documented in OpenAPI
- [ ] **Security**: Vendor role required for dashboard access
- [ ] **Testing**: Vendor dashboard screens and data flows tested
- [ ] **Documentation**: Vendor data model documented

---

## User Scenarios & Testing

### User Story 1 - View Vendor Dashboard (Priority: P1)

As a vendor, I want a dedicated dashboard, so that I can see all my booth-related information at a glance.

**Why this priority**: Entry point to all vendor features.

**Independent Test**: Log in as vendor role, verify dashboard displays booth info.

**Acceptance Criteria** (from Jira):
1. **Given** user has vendor role, **When** they open app, **Then** vendor dashboard is accessible
2. **Given** vendor dashboard, **When** viewed, **Then** shows booth info, hours, menu

---

### User Story 2 - Manage Hours of Operation (Priority: P2)

As a vendor, I want to update my booth hours, so that attendees know when I'm open.

**Acceptance Criteria**:
1. **Given** vendor on dashboard, **When** editing hours, **Then** can set open/close times per day
2. **Given** hours updated, **When** attendees view booth, **Then** new hours display

---

### User Story 3 - Display Menu/Products (Priority: P2)

As a vendor, I want to show my menu or product list, so that attendees know what I offer.

**Acceptance Criteria**:
1. **Given** vendor dashboard, **When** viewing menu section, **Then** product list displays
2. **Given** product list, **When** vendor adds item, **Then** item appears in list

---

### User Story 4 - View Announcements (Priority: P3)

As a vendor, I want to see festival announcements targeted at vendors, so that I stay informed.

**Acceptance Criteria**:
1. **Given** vendor dashboard, **When** announcement exists for vendors, **Then** it displays in feed

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide vendor dashboard for users with vendor role
- **FR-002**: System MUST display booth information (name, location, description)
- **FR-003**: System MUST allow vendors to manage hours of operation
- **FR-004**: System MUST display menu/product list
- **FR-005**: System MUST show vendor-targeted announcement feed
- **FR-006**: System SHOULD show basic sales analytics if POS integrated

### Key Entities

- **Vendor**: userId, boothName, boothLocation, description, hoursOfOperation
- **VendorProduct**: vendorId, name, description, price, category, isAvailable

### Technical Notes (from Jira)

- Vendor role in user model
- VendorDashboardScreen.tsx
- Backend: GET /api/vendor/profile, PUT /api/vendor/hours

---

## Success Criteria

- **SC-001**: Vendor dashboard loads within 2 seconds
- **SC-002**: Hours updates reflect within 30 seconds for attendees
- **SC-003**: 90% of vendors successfully update their hours on first attempt

---

## [bigfamfestival] BFF-30-friend-request-system

# Feature Specification: Friend Request System

**Jira**: [BFF-30](https://eriksensolutions.atlassian.net/browse/BFF-30)  
**Feature Branch**: `BFF-30-friend-request-system`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-25 (Friends & Campsite)

---

## Overview

Allow users to send/accept friend requests and manage a friends list for social features at the festival.

### Current State
- No friend system in app
- Users cannot connect with others in-app

### Target State
- User search and friend requests
- Friends list management
- Foundation for friend-based features (campsite sharing, etc.)

---

## Constitution Compliance Checklist

- [ ] **Contract Compliance**: Friends API endpoints documented in OpenAPI
- [ ] **Security**: Users can only view accepted friends' data
- [ ] **Privacy**: Friend list visible only to the user
- [ ] **Testing**: Request flow and edge cases tested

---

## User Scenarios & Testing

### User Story 1 - Search and Send Friend Request (Priority: P1)

As a user, I want to search for other users and send them a friend request, so that I can connect with people I know.

**Why this priority**: Core functionality to initiate friendships.

**Independent Test**: Search for test user, send request, verify request appears in their pending list.

**Acceptance Criteria** (from Jira):
1. **Given** user searches by username/name, **When** results appear, **Then** can send friend request
2. **Given** request sent, **When** recipient views pending, **Then** request is visible

---

### User Story 2 - Accept/Decline Friend Request (Priority: P1)

As a user with a pending request, I want to accept or decline it, so that I control my connections.

**Why this priority**: Users must be able to respond to requests.

**Acceptance Criteria**:
1. **Given** pending request, **When** user accepts, **Then** both users are now friends
2. **Given** pending request, **When** user declines, **Then** request is removed

---

### User Story 3 - View Friends List (Priority: P1)

As a user, I want to see my friends list, so that I know who I'm connected with.

**Acceptance Criteria**:
1. **Given** user has friends, **When** opening friends list, **Then** all accepted friends display

---

### User Story 4 - Remove Friend (Priority: P2)

As a user, I want to remove someone from my friends, so that I can manage my connections.

**Acceptance Criteria**:
1. **Given** friend in list, **When** user removes them, **Then** friendship is deleted for both users

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow searching users by username or name
- **FR-002**: System MUST allow sending friend requests
- **FR-003**: System MUST allow accepting/declining friend requests
- **FR-004**: System MUST display friends list
- **FR-005**: System MUST allow removing friends

### Key Entities

- **Friend**: id, userId, friendId, status (pending/accepted/blocked), createdAt

### Technical Notes (from Jira)

- Friends Firestore collection with status (pending/accepted/blocked)
- Backend API: POST /api/friends/request, GET /api/friends, DELETE /api/friends/:id
- FriendsScreen.tsx, AddFriendScreen.tsx

---

## Success Criteria

- **SC-001**: User search returns results within 2 seconds
- **SC-002**: Friend request delivery within 5 seconds
- **SC-003**: Friends list loads within 2 seconds

---

## [bigfamfestival] BFF-29-staff-volunteer-shift-management

# Feature Specification: Staff/Volunteer Shift Management

**Jira**: [BFF-29](https://eriksensolutions.atlassian.net/browse/BFF-29)  
**Feature Branch**: `BFF-29-staff-volunteer-shift-management`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-15 (Role-Specific Panels)

---

## Overview

Allow volunteers and staff to view and check-in to assigned shifts. Managers can assign shifts and track attendance.

### Current State
- No shift management in app
- Staff coordination via external tools (spreadsheets, text messages)

### Target State
- In-app shift viewing for staff/volunteers
- Location-verified check-in/check-out
- Manager assignment and tracking

---

## Constitution Compliance Checklist

- [ ] **Contract Compliance**: Shift API endpoints documented in OpenAPI
- [ ] **Security**: Role-based access (staff, volunteer, manager roles)
- [ ] **Observability**: Check-in events logged with location
- [ ] **Testing**: Shift assignment and check-in flows tested

---

## User Scenarios & Testing

### User Story 1 - View Upcoming Shifts (Priority: P1)

As a volunteer, I want to see my upcoming shifts, so that I know when and where to report.

**Why this priority**: Basic shift visibility required before check-in.

**Independent Test**: Assign shift to test user, verify it appears in shift list.

**Acceptance Criteria** (from Jira):
1. **Given** user is a volunteer, **When** they open shifts, **Then** upcoming shifts display
2. **Given** shift exists, **When** viewed, **Then** shows date, time, location, role

---

### User Story 2 - Check-In to Shift (Priority: P1)

As a volunteer at my shift location, I want to check in, so that my attendance is recorded.

**Why this priority**: Core tracking functionality.

**Acceptance Criteria**:
1. **Given** shift start time approached, **When** user at location, **Then** check-in button enabled
2. **Given** user checks in, **When** location verified, **Then** attendance recorded

---

### User Story 3 - Check-Out from Shift (Priority: P2)

As a volunteer ending my shift, I want to check out, so that my hours are logged.

**Acceptance Criteria**:
1. **Given** user is checked in, **When** they check out, **Then** shift duration is logged

---

### User Story 4 - Manager Shift Assignment (Priority: P2)

As a shift manager, I want to assign volunteers to shifts, so that coverage is ensured.

**Acceptance Criteria**:
1. **Given** manager role, **When** viewing shift, **Then** can assign volunteers
2. **Given** volunteer assigned, **When** they view shifts, **Then** new shift appears

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST show upcoming shifts for staff/volunteers
- **FR-002**: System MUST verify location for check-in (within 100m of shift location)
- **FR-003**: System MUST record check-in and check-out timestamps
- **FR-004**: System MUST allow managers to assign shifts
- **FR-005**: System MUST show shift history

### Key Entities

- **Shift**: id, location, startTime, endTime, roleRequired, assignedUsers[]
- **ShiftCheckin**: shiftId, userId, checkinTime, checkoutTime, locationCoords

### Technical Notes (from Jira)

- Shifts Firestore collection
- Backend: GET /api/shifts, POST /api/shifts/checkin
- ShiftManagementScreen.tsx

---

## Success Criteria

- **SC-001**: Volunteers see shifts within 3 seconds of opening screen
- **SC-002**: Check-in location verification completes within 5 seconds
- **SC-003**: 95% of shift check-ins are within 5 minutes of shift start

---

## [bigfamfestival] BFF-28-poi-markers-festival-map

# Feature Specification: POI Markers on Festival Map

**Jira**: [BFF-28](https://eriksensolutions.atlassian.net/browse/BFF-28)  
**Feature Branch**: `BFF-28-poi-markers-festival-map`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-24 (Interactive Map & POI)

---

## Overview

Add Points of Interest (POI) markers on the interactive festival map for stages, vendors, amenities, and other key locations.

### Current State
- Basic map view without POI markers
- Users cannot easily locate amenities

### Target State
- Interactive POI markers for all key locations
- Category filtering for easy navigation
- Tap-to-view detail cards

---

## Constitution Compliance Checklist

- [ ] **Contract Compliance**: POI API endpoints documented in OpenAPI
- [ ] **Security**: POI data publicly accessible (no auth required for read)
- [ ] **Testing**: POI marker rendering and filtering tested
- [ ] **Documentation**: POI categories and icon specifications documented

---

## User Scenarios & Testing

### User Story 1 - View POI Markers (Priority: P1)

As a festival attendee, I want to see markers for stages, food vendors, and amenities on the map, so that I can navigate the grounds.

**Why this priority**: Core map functionality for wayfinding.

**Independent Test**: Load map, verify markers appear for all POI categories.

**Acceptance Criteria** (from Jira):
1. **Given** user opens map, **When** map loads, **Then** POI markers display for all categories
2. **Given** POI marker exists, **When** tapped, **Then** detail card shows POI info

---

### User Story 2 - Filter by Category (Priority: P2)

As a user looking for restrooms, I want to filter the map to show only restrooms, so that I can find one quickly.

**Why this priority**: Important UX improvement for specific needs.

**Acceptance Criteria**:
1. **Given** map with all POIs, **When** user selects "Restrooms" filter, **Then** only restroom markers show
2. **Given** filter applied, **When** user clears filter, **Then** all POIs return

---

### User Story 3 - Tap Marker Detail (Priority: P1)

As a user, I want to tap a marker to see details about that location, so that I know what's there.

**Why this priority**: Essential interaction pattern for maps.

**Acceptance Criteria**:
1. **Given** POI marker, **When** tapped, **Then** detail card displays name, category, description
2. **Given** detail card open, **When** tapped outside, **Then** card dismisses

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST display POI markers for: Stages, Food, Restrooms, Medical, Info, Water, ATM
- **FR-002**: System MUST support filtering POIs by category
- **FR-003**: System MUST show detail card when marker is tapped
- **FR-004**: System MUST use custom marker icons per category

### Key Entities

- **POI**: id, name, category, description, coordinates, iconType, isActive

### Technical Notes (from Jira)

- Create POI Firestore collection
- Backend API: GET /api/pois, GET /api/pois/:id
- Frontend: POI layer on Mapbox

---

## Success Criteria

- **SC-001**: All 7 POI categories have custom icons
- **SC-002**: Markers load within 2 seconds of map open
- **SC-003**: Filter toggle responds within 200ms

---

## [bigfamfestival] BFF-27-qr-code-ticket-display

# Feature Specification: QR Code Ticket Display

**Jira**: [BFF-27](https://eriksensolutions.atlassian.net/browse/BFF-27)  
**Feature Branch**: `BFF-27-qr-code-ticket-display`  
**Created**: 2026-02-10  
**Status**: On Hold  
**Epic**: BFF-17 (Ticketing & Entry)

---

## Overview

Display QR code for user's ticket for entry gate scanning. This enables digital ticket presentation at festival entry points.

### Current State
- No ticket QR code display in app
- Users rely on external ticket provider PDFs

### Target State
- In-app QR code display on TicketScreen
- Offline-capable with local ticket storage
- Brightness boost for easier scanning

---

## Constitution Compliance Checklist

- [ ] **Security**: Ticket data securely generated and stored
- [ ] **Observability**: QR display events logged
- [ ] **Testing**: QR generation and scanning validated
- [ ] **Documentation**: Ticket data schema documented

---

## User Scenarios & Testing

### User Story 1 - Display Ticket QR Code (Priority: P1)

As a festival attendee, I want to view my ticket as a QR code in the app, so that I can scan in at entry gates.

**Why this priority**: Core functionality - users need to enter the festival.

**Independent Test**: Generate QR for test ticket, display on TicketScreen, scan with external scanner to verify data.

**Acceptance Criteria** (from Jira):
1. **Given** a user with valid ticket, **When** they open TicketScreen, **Then** QR code is generated from ticket data
2. **Given** QR code displayed, **When** scanned at gate, **Then** ticket validates successfully

---

### User Story 2 - Brightness Boost (Priority: P2)

As a user at the entry gate, I want the screen to brighten when showing my QR code, so that it scans reliably in various lighting.

**Why this priority**: Improves scanning reliability in outdoor conditions.

**Acceptance Criteria**:
1. **Given** QR code screen is shown, **When** displayed, **Then** screen brightness increases temporarily

---

### User Story 3 - Offline Ticket Access (Priority: P1)

As a user without cell signal at the venue, I want to access my ticket offline, so that I can still enter.

**Why this priority**: Festival venues often have poor connectivity.

**Acceptance Criteria**:
1. **Given** ticket was previously loaded, **When** user is offline, **Then** QR code still displays from local storage

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST generate QR code from ticket data (userId, ticketType, validDates, uniqueId)
- **FR-002**: System MUST link ticket to user's Firebase Auth UID
- **FR-003**: System MUST store ticket locally for offline access
- **FR-004**: System MUST increase screen brightness when QR is displayed

### Technical Notes (from Jira)

- Package: `react-native-qrcode-svg`
- Ticket data includes: userId, ticketType, validDates, uniqueId
- Link to user's Firebase Auth UID

---

## Success Criteria

- **SC-001**: QR code displays within 1 second of opening TicketScreen
- **SC-002**: 100% of valid tickets scan successfully at entry gates
- **SC-003**: Offline access works for tickets loaded within last 30 days

---

## [bigfamfestival] BFF-14-api-client-infrastructure

# API Client Infrastructure - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-14](https://eriksensolutions.atlassian.net/browse/BFF-14)  
**Created**: 2026-02-09  

---

## Overview

API Client Infrastructure provides centralized HTTP client configuration for the mobile app, including base URL management, authentication header injection, request/response interceptors, and error handling standardization.

---

## User Stories

### User Story 1 - Centralized API Configuration
**As a** mobile developer,  
**I want** a centralized API client,  
**So that** all API calls use consistent configuration.

**Acceptance Criteria** (Verified):
- [x] Single axios instance with base URL
- [x] Default headers (Content-Type)
- [x] Request timeout configuration

**Implementation**: `mobile/src/services/apiClient.ts:L13-L19`

### User Story 2 - Automatic Authentication
**As a** mobile developer,  
**I want** auth tokens automatically added to requests,  
**So that** I don't have to manually add them.

**Acceptance Criteria** (Verified):
- [x] Request interceptor adds Bearer token
- [x] Token retrieved from AsyncStorage
- [x] Works for all authenticated endpoints

**Implementation**: `mobile/src/services/apiClient.ts:L44-L53`

### User Story 3 - Token Refresh
**As a** user,  
**I want** my session to refresh automatically,  
**So that** I don't get logged out unexpectedly.

**Acceptance Criteria** (Verified):
- [x] 401 responses trigger token refresh
- [x] Original request is retried with new token
- [x] Only attempts refresh once per request

**Implementation**: `mobile/src/services/apiClient.ts:L72-L95`

### User Story 4 - Error Handling
**As a** mobile developer,  
**I want** standardized error handling,  
**So that** errors are consistent across the app.

**Acceptance Criteria** (Verified):
- [x] Network errors return clean error object
- [x] Response data is automatically unwrapped
- [x] Errors include helpful messages

**Implementation**: `mobile/src/services/apiClient.ts:L55-L100`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Centralized axios instance | ✅ | `apiClient.ts:L13-L19` |
| FR-002 | Auto-inject auth token | ✅ | `apiClient.ts:L44-L53` |
| FR-003 | Response data unwrapping | ✅ | `apiClient.ts:L57-L59` |
| FR-004 | Token refresh on 401 | ✅ | `apiClient.ts:L72-L95` |
| FR-005 | Network error handling | ✅ | `apiClient.ts:L62-L70` |
| FR-006 | Android emulator URL fix | ✅ | `apiClient.ts:L21-L38` |
| FR-007 | Request timeout | ✅ | `apiClient.ts:L18` |

---

## Configuration

### Base URL
```typescript
const apiClient = axios.create({
  baseURL: 'https://bigfam-api-production-292369452544.us-central1.run.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds
});
```

### Android Emulator Fix
For development, localhost needs to be replaced with `10.0.2.2` for Android emulator:

```typescript
if (Platform.OS === 'android' && API_URL.includes('localhost')) {
  const newUrl = API_URL.replace('localhost', '10.0.2.2');
  apiClient.defaults.baseURL = newUrl;
}
```

---

## Interceptor Flow

### Request Interceptor
```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  API Call    │────▶│  Request Interceptor │────▶│   Server     │
└──────────────┘     │  + Add Bearer Token  │     └──────────────┘
                     └─────────────────────┘
```

### Response Interceptor (Success)
```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Server     │────▶│  Response Interceptor│────▶│  API Caller  │
└──────────────┘     │  Unwrap response.data│     └──────────────┘
```

### Response Interceptor (401 Error)
```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Server     │────▶│  Response Interceptor│────▶│  Refresh     │
│   (401)      │     │  Detect 401          │     │  Token       │
└──────────────┘     └─────────────────────┘     └──────────────┘
                                                        │
                     ┌─────────────────────┐            │
                     │  Retry Original     │◀───────────┘
                     │  Request            │
                     └─────────────────────┘
```

---

## Error Response Format

### Network Error
```typescript
{
  message: 'Unable to connect to the server. Please check your internet connection.',
  isNetworkError: true,
  originalError: AxiosError
}
```

### API Error
```typescript
{
  message: 'Error message from server',
  status: 400,
  data: { /* error details */ }
}
```

---

## File Structure

```
mobile/src/services/
├── apiClient.ts      # Axios instance and interceptors
└── api.ts            # API endpoint definitions (optional)

mobile/src/config/
└── constants.ts      # API_URL and other constants
```

---

## Storage Keys Used

| Key | Description |
|-----|-------------|
| `accessToken` | JWT access token |
| `refreshToken` | Refresh token (if implemented) |

---

## Related Specifications

- [BFF-4 Authentication](../BFF-4-authentication/spec.md) - Token management
- All API-consuming features depend on this infrastructure

---

## [bigfamfestival] BFF-13-health-monitoring

# Health Check & Monitoring - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-13](https://eriksensolutions.atlassian.net/browse/BFF-13)  
**Created**: 2026-02-09  

---

## Overview

Health Check & Monitoring provides endpoints for infrastructure monitoring, including API health status and Firestore connectivity checks. These endpoints support load balancer health checks and service observability.

---

## User Stories

### User Story 1 - Health Check Endpoint
**As a** DevOps engineer,  
**I want** a health check endpoint,  
**So that** load balancers can verify service health.

**Acceptance Criteria** (Verified):
- [x] GET /health returns health status
- [x] Includes Firestore connectivity check
- [x] Returns graceful response even if Firestore fails

**Implementation**: `backend/src/health/health.controller.ts:L15-L42`

### User Story 2 - Readiness Check
**As a** DevOps engineer,  
**I want** a simple readiness endpoint,  
**So that** I can check if the service is accepting requests.

**Acceptance Criteria** (Verified):
- [x] GET /health/ready returns basic status
- [x] Does not depend on external services
- [x] Includes uptime information

**Implementation**: `backend/src/health/health.controller.ts:L44-L52`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Health check endpoint | ✅ | `health.controller.ts:L15-L42` |
| FR-002 | Firestore connectivity check | ✅ | `firestore.health.ts` |
| FR-003 | Readiness endpoint | ✅ | `health.controller.ts:L44-L52` |
| FR-004 | Graceful degradation | ✅ | Try-catch in health check |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | Full health check with dependencies |
| GET | `/health/ready` | Public | Simple readiness check |

### Response Examples

**GET /health** (Healthy)
```json
{
  "status": "ok",
  "info": {
    "firestore": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "firestore": {
      "status": "up"
    }
  }
}
```

**GET /health** (Degraded)
```json
{
  "status": "ok",
  "info": {
    "firestore": {
      "status": "down",
      "message": "Firestore check failed but service is starting"
    }
  },
  "error": {},
  "details": {
    "firestore": {
      "status": "down",
      "message": "Connection timeout"
    }
  }
}
```

**GET /health/ready**
```json
{
  "status": "ready",
  "timestamp": "2026-02-09T15:30:00.000Z",
  "uptime": 3600.5
}
```

---

## Implementation Details

### NestJS Terminus Integration
Uses `@nestjs/terminus` for standardized health checks:

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private firestoreHealth: FirestoreHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.firestoreHealth.isHealthy('firestore'),
    ]);
  }
}
```

### Firestore Health Indicator
```typescript
@Injectable()
export class FirestoreHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // Attempt a simple Firestore operation
    // Return health status
  }
}
```

---

## File Structure

```
backend/src/health/
├── health.controller.ts        # HTTP endpoints
├── health.module.ts            # Module definition
└── firestore.health.ts         # Firestore health indicator
```

---

## Infrastructure Integration

### Cloud Run Health Checks
```yaml
# Configure in Cloud Run
startupProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /health
    port: 3000
  periodSeconds: 30
```

---

## Related Specifications

- Infrastructure/Terraform configuration uses these endpoints

---

## [bigfamfestival] BFF-12-app-settings-theme

# App Settings & Theme - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-12](https://eriksensolutions.atlassian.net/browse/BFF-12)  
**Created**: 2026-02-09  

---

## Overview

App Settings & Theme provides user preference management including theme switching (light/dark mode), debug mode toggle, and persistent settings storage on the mobile device.

---

## User Stories

### User Story 1 - Toggle Dark Mode
**As a** festival attendee,  
**I want to** switch between light and dark themes,  
**So that** I can use the app comfortably at night.

**Acceptance Criteria** (Verified):
- [x] User can toggle dark mode in settings
- [x] Theme persists across app restarts
- [x] All screens respect theme setting

**Implementation**: `mobile/src/contexts/ThemeContext.tsx`

### User Story 2 - Debug Mode Toggle
**As a** developer,  
**I want to** enable debug mode in the app,  
**So that** I can see additional diagnostic information.

**Acceptance Criteria** (Verified):
- [x] Debug mode can be toggled in settings
- [x] Debug mode shows additional UI/logs

**Implementation**: `mobile/src/contexts/DebugContext.tsx`

### User Story 3 - Persistent Settings
**As a** user,  
**I want** my settings to persist,  
**So that** I don't have to reconfigure on each app launch.

**Acceptance Criteria** (Verified):
- [x] Settings are stored in AsyncStorage
- [x] Settings are loaded on app start

**Implementation**: `mobile/src/contexts/AppSettingsContext.tsx`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Theme toggle (light/dark) | ✅ | `ThemeContext.tsx` |
| FR-002 | Persist theme preference | ✅ | AsyncStorage |
| FR-003 | Debug mode toggle | ✅ | `DebugContext.tsx` |
| FR-004 | Settings screen UI | ✅ | `SettingsScreen.tsx` |

---

## Data Model

### App Settings
```typescript
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  debugMode: boolean;
  // Future settings...
}
```

### Theme Context
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isDarkMode: boolean;
}
```

### Debug Context
```typescript
interface DebugContextType {
  isDebugMode: boolean;
  toggleDebugMode: () => void;
}
```

---

## Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `@app_theme` | string | 'light' or 'dark' |
| `@debug_mode` | boolean | Debug mode enabled |

---

## File Structure

```
mobile/src/
├── contexts/
│   ├── AppSettingsContext.tsx   # Settings aggregation
│   ├── ThemeContext.tsx         # Theme state management
│   └── DebugContext.tsx         # Debug mode management
└── screens/
    └── SettingsScreen.tsx       # Settings UI
```

---

## Theme Colors

### Light Theme
```typescript
const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#6200EE',
  // ...
};
```

### Dark Theme
```typescript
const darkTheme = {
  background: '#121212',
  text: '#FFFFFF',
  primary: '#BB86FC',
  // ...
};
```

---

## Related Specifications

- No backend dependencies (mobile-only feature)

---

## [bigfamfestival] BFF-11-admin-notifications

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

---

## [bigfamfestival] BFF-10-campsite-location

# Campsite Location - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-10](https://eriksensolutions.atlassian.net/browse/BFF-10)  
**Created**: 2026-02-09  

---

## Overview

Campsite Location allows festival attendees to save and retrieve the GPS coordinates of their campsite, making it easier to find their way back after exploring the festival grounds.

---

## User Stories

### User Story 1 - Save Campsite Location
**As a** festival attendee,  
**I want to** save my campsite's GPS location,  
**So that** I can find my way back later.

**Acceptance Criteria** (Verified):
- [x] User can save/update location via POST /campsites
- [x] Location includes latitude and longitude
- [x] Optional name/description for the campsite
- [x] Upsert behavior (create or update)

**Implementation**: `backend/src/campsites/campsites.controller.ts:L22-L30`

### User Story 2 - Retrieve Campsite Location
**As a** festival attendee,  
**I want to** retrieve my saved campsite location,  
**So that** I can navigate back to it.

**Acceptance Criteria** (Verified):
- [x] User can get location via GET /campsites
- [x] Returns 404 if no campsite saved

**Implementation**: `backend/src/campsites/campsites.controller.ts:L32-L43`

### User Story 3 - Delete Campsite Location
**As a** festival attendee,  
**I want to** delete my campsite location,  
**So that** I can clear outdated information.

**Acceptance Criteria** (Verified):
- [x] User can delete via DELETE /campsites
- [x] Returns 404 if no campsite exists

**Implementation**: `backend/src/campsites/campsites.controller.ts:L45-L52`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Create/update campsite location | ✅ | `campsites.service.ts:L13-L38` |
| FR-002 | Get user's campsite | ✅ | `campsites.service.ts:L40-L55` |
| FR-003 | Delete campsite | ✅ | `campsites.service.ts:L57-L68` |
| FR-004 | Auto-generate timestamps | ✅ | `campsites.service.ts:L17-L25` |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/campsites` | JWT | Create/update campsite location |
| GET | `/campsites` | JWT | Get current user's campsite |
| DELETE | `/campsites` | JWT | Delete current user's campsite |

### Request/Response Examples

**POST /campsites**
```json
// Request
{
  "latitude": 41.8781,
  "longitude": -87.6298,
  "name": "Blue Tent near Food Court",
  "notes": "Next to the big oak tree"
}

// Response
{
  "id": "user123",
  "userId": "user123",
  "latitude": 41.8781,
  "longitude": -87.6298,
  "name": "Blue Tent near Food Court",
  "notes": "Next to the big oak tree",
  "createdAt": "2026-06-15T10:30:00Z",
  "updatedAt": "2026-06-15T10:30:00Z"
}
```

---

## Data Model

### Campsite Interface
```typescript
interface Campsite {
  id: string;           // Same as userId
  userId: string;
  latitude: number;
  longitude: number;
  name?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### CreateCampsiteDto
```typescript
interface CreateCampsiteDto {
  latitude: number;
  longitude: number;
  name?: string;
  notes?: string;
}
```

---

## Firestore Data Structure

### Collection: `campsites`
- Document ID = User ID (one campsite per user)

```javascript
{
  "userId": "user123",
  "latitude": 41.8781,
  "longitude": -87.6298,
  "name": "Blue Tent near Food Court",
  "notes": "Next to the big oak tree",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| No campsite exists (GET) | NotFoundException (404) | `campsites.controller.ts:L39` |
| No campsite exists (DELETE) | NotFoundException (404) | `campsites.service.ts:L62` |
| Firestore error | InternalServerErrorException (500) | `campsites.service.ts` |

---

## Mobile Integration

### MapScreen
- Displays map with campsite marker
- Uses expo-location for GPS
- Allows setting campsite on map tap

---

## File Structure

```
backend/src/campsites/
├── campsites.controller.ts    # HTTP endpoints
├── campsites.module.ts        # Module definition
├── campsites.service.ts       # Business logic
├── dto/
│   └── create-campsite.dto.ts
└── interfaces/
    └── campsite.interface.ts

mobile/src/
├── screens/MapScreen.tsx
└── services/mapService.ts
```

---

## Related Specifications

- [BFF-5 User Management](../BFF-5-user-management/spec.md) - shareMyCampsite preference

---

## [detroitdubcollective] DDC-9-rewards-economy

# DDC-9: DDC Points Rewards Economy - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [DDC-9](https://eriksensolutions.atlassian.net/browse/DDC-9)  
**Created**: February 10, 2026

---

## Overview

The DDC Points Rewards Economy is a loyalty system that incentivizes user engagement by allowing users to earn points through USD purchases and redeem them as an alternative payment method across the platform. This dual-currency approach creates a closed-loop economy that rewards repeat customers while maintaining USD payment options.

### Key Capabilities

- **Point Earning**: Users earn 10 DDC Points for every $1 USD spent via Stripe
- **Point Spending**: 100 DDC Points = $1 USD purchasing power
- **Dual Currency Display**: All products show both USD and Points pricing
- **Real-time Balance**: User's DDC balance displayed prominently in navigation
- **Transaction History**: Complete record of earning and spending activity
- **Atomic Operations**: All balance changes use Firestore transactions for consistency

---

## User Stories

### US-1: Earn Points on Purchase
**As a** user making a USD purchase  
**I want to** automatically earn DDC Points  
**So that** I can redeem them for future purchases

**Acceptance Criteria** (Verified):
- [x] Points awarded after successful Stripe payment webhook
- [x] Earn rate: 10 points per $1 USD spent
- [x] Points added to user's `ddc_balance` atomically
- [x] 'earn' transaction record created with `source: 'purchase'`
- [x] Points awarded field recorded on purchase transaction

**Implementation**: [stripeWebhook](functions/src/index.ts#L275-L467)

---

### US-2: View Points Balance
**As a** logged-in user  
**I want to** see my current DDC Points balance  
**So that** I know how much I can spend

**Acceptance Criteria** (Verified):
- [x] Balance displayed in header navigation (desktop: gold badge, mobile: dropdown)
- [x] Balance displayed on Profile page overview tab
- [x] Balance formatted with thousands separator and ✪ symbol
- [x] Balance updates immediately after transactions

**Implementation**: 
- [MainLayout.tsx](src/components/organisms/MainLayout.tsx#L263-L303)
- [Profile.tsx](src/pages/Profile.tsx#L112-L113)

---

### US-3: Spend Points at Checkout
**As a** user with sufficient points  
**I want to** pay with DDC Points instead of USD  
**So that** I can use my earned rewards

**Acceptance Criteria** (Verified):
- [x] Currency toggle available in cart and checkout
- [x] Conversion rate: 100 points = $1 value
- [x] Balance displayed in Points checkout view
- [x] Insufficient balance shows error with difference needed
- [x] Payment button disabled when balance insufficient
- [x] Points deducted atomically on successful payment
- [x] 'purchase' transaction record created with `currency: 'DDC'`

**Implementation**: 
- [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L191-L294)
- [processPointsPayment](functions/src/index.ts#L125-L268)

---

### US-4: View Dual Pricing
**As a** user browsing products  
**I want to** see both USD and Points prices  
**So that** I can compare payment options

**Acceptance Criteria** (Verified):
- [x] Product cards show primary price based on selected currency
- [x] Alternative price shown as secondary
- [x] Currency toggle persists across browsing session
- [x] Cart shows totals in both currencies

**Implementation**: 
- [CartPanel.tsx](src/components/organisms/CartPanel.tsx#L143-L194)
- [EventDetail.tsx](src/pages/EventDetail.tsx#L175-L199)

---

### US-5: View Transaction History
**As a** user  
**I want to** see my complete transaction history  
**So that** I can track my earning and spending

**Acceptance Criteria** (Verified):
- [x] Transactions displayed on Profile page "Transactions" tab
- [x] Each transaction shows: type badge (Earned/Spent), amount, date/time
- [x] Earned transactions show positive amount in green
- [x] Spent transactions show negative amount
- [x] USD purchase transactions show "points awarded" detail
- [x] Links to purchased items/events included

**Implementation**: [TransactionsSection.tsx](src/components/molecules/TransactionsSection.tsx#L1-L171)

---

### US-6: Admin Transaction Monitoring
**As an** admin  
**I want to** view all platform transactions  
**So that** I can monitor the points economy

**Acceptance Criteria** (Verified):
- [x] View last 100 transactions (newest first)
- [x] Filter by type (all/purchase/earn)
- [x] Filter by currency (all/USD/DDC)
- [x] Show transaction type badge (Earned/Spent)
- [x] Artists see only transactions involving their items

**Implementation**: [AdminTransactions.tsx](src/components/organisms/AdminTransactions.tsx#L50-L100)

---

## Functional Requirements

| ID | Requirement | Implementation |
|----|-------------|----------------|
| FR-1 | Points earned at 10 per $1 USD spent | [functions/src/index.ts](functions/src/index.ts#L24) `POINTS_REWARD_PER_DOLLAR = 10` |
| FR-2 | Points spend rate 100 per $1 value | [constants.ts](src/lib/constants.ts#L10) `POINTS_PER_DOLLAR = 100` |
| FR-3 | Balance stored in `User.ddc_balance` | [types/index.ts](src/types/index.ts#L35) |
| FR-4 | Stripe webhook awards points on payment success | [functions/src/index.ts](functions/src/index.ts#L350-L467) |
| FR-5 | Points payment uses atomic Firestore transaction | [functions/src/index.ts](functions/src/index.ts#L145-L268) |
| FR-6 | Balance validated before points payment | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L224-L230) |
| FR-7 | Dual transaction records for USD purchases (purchase + earn) | [functions/src/index.ts](functions/src/index.ts#L429-L457) |
| FR-8 | Currency type enum: 'USD' \| 'DDC' | [types/index.ts](src/types/index.ts#L9) |
| FR-9 | Transaction type enum: 'purchase' \| 'earn' | [types/index.ts](src/types/index.ts#L10) |
| FR-10 | Transaction record includes `points_awarded` for USD purchases | [types/index.ts](src/types/index.ts#L151) |
| FR-11 | Balance displayed with ✪ symbol | [MainLayout.tsx](src/components/organisms/MainLayout.tsx#L263) |
| FR-12 | Insufficient balance error shows difference needed | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L786-L789) |

---

## Data Model

### User Balance Field
```typescript
interface User {
  uid: string
  // ... other fields
  ddc_balance: number  // Current points balance (default: 0)
}
```

### Transaction Record
```typescript
interface Transaction {
  id: string
  user_id: string
  amount: number                    // Points or USD amount
  currency: 'USD' | 'DDC'          // Currency type
  type: 'purchase' | 'earn'        // Transaction type
  timestamp: number                 // Unix timestamp
  description?: string              // Human-readable description
  items?: Array<{                   // Purchased items
    id: string
    type: 'track' | 'merch'
    quantity: number
  }>
  stripe_payment_intent_id?: string // For USD purchases
  points_awarded?: number           // Points earned (USD purchases)
  source?: string                   // 'purchase' for earned points
  purchase_transaction_id?: string  // Links earn tx to purchase tx
}
```

### Constants
```typescript
// Spending: 100 points = $1 USD value
export const POINTS_PER_DOLLAR = 100

// Earning: 10 points per $1 USD spent
export const POINTS_REWARD_PER_DOLLAR = 10
```

---

## Points Economy Flow

### Earning Flow (USD Purchase)
```
User completes Stripe checkout ($10 USD)
         ↓
Stripe webhook: payment_intent.succeeded
         ↓
Calculate points: $10 × 10 = 100 points
         ↓
Firestore Transaction (atomic):
  1. Update user.ddc_balance += 100
  2. Add items to user.inventory
  3. Create 'purchase' transaction (currency: 'USD', points_awarded: 100)
  4. Create 'earn' transaction (currency: 'DDC', amount: 100, source: 'purchase')
```

### Spending Flow (Points Purchase)
```
User selects Points at checkout (need 1000 points)
         ↓
Client validates: user.ddc_balance >= 1000
         ↓
Client calls processPointsPayment Cloud Function
         ↓
Firestore Transaction (atomic):
  1. Verify balance >= cost
  2. Update user.ddc_balance -= 1000
  3. Add items to user.inventory
  4. Create 'purchase' transaction (currency: 'DDC')
         ↓
Return success with new balance
```

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Insufficient points balance | Toast error with current vs required | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L224-L230) |
| Points payment disabled if balance low | Button disabled state | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L798) |
| User document not found | HttpsError thrown | [functions/src/index.ts](functions/src/index.ts#L160-L165) |
| Concurrent balance modification | Firestore transaction rollback | [functions/src/index.ts](functions/src/index.ts#L145) |
| No transactions found | Empty state with call-to-action | [TransactionsSection.tsx](src/components/molecules/TransactionsSection.tsx#L23-L34) |
| Stripe webhook signature invalid | 400 error, payment not processed | [functions/src/index.ts](functions/src/index.ts#L335-L340) |

---

## Integration Points

| System | Type | Purpose |
|--------|------|---------|
| Firebase Auth | Authentication | User identity for balance lookup |
| Firestore | Database | User balance, transaction records |
| Stripe | Payment Processing | USD payments, webhook for point awarding |
| Cloud Functions | Backend | Secure point operations |
| Zustand Auth Store | State | Real-time balance in UI |

---

## Component Architecture

```
Points Economy Components
├── Display Layer
│   ├── MainLayout.tsx          → Header balance badge
│   ├── CartPanel.tsx           → Dual pricing display
│   ├── CheckoutModal.tsx       → Currency selection, balance check
│   ├── TransactionsSection.tsx → Transaction history
│   └── Profile.tsx             → Balance + transaction tab
├── Cloud Functions
│   ├── processPointsPayment    → DDC point checkout
│   └── stripeWebhook           → Point awarding on USD purchase
├── Constants
│   └── constants.ts            → Conversion rates
└── Types
    └── types/index.ts          → Transaction, Currency types
```

---

## Related Specifications

- [DDC-1: Authentication](../DDC-1-authentication/spec.md) - User profile with balance
- [DDC-5: E-commerce](../DDC-5-ecommerce/spec.md) - Checkout with dual currency
- [DDC-6: Admin Dashboard](../DDC-6-admin-dashboard/spec.md) - Transaction monitoring

---

**Version**: 1.0.0  
**Last Updated**: February 10, 2026

---

## [detroitdubcollective] DDC-8-marketing-pages

# DDC-8: Marketing Pages

**Status:** ✅ Implemented (Retroactive Documentation)  
**Jira:** [DDC-8](https://eriksensolutions.atlassian.net/browse/DDC-8)  
**Created:** 2026-02-10

---

## Overview

Static marketing and informational pages that communicate Detroit Dub Collective's identity, values, mission, and artist-first approach. These pages serve as the public-facing content that differentiates DDC from traditional record labels, explains the collective's philosophy, and provides information for prospective artists.

### Purpose
- Communicate DDC's mission and core values to visitors
- Explain the artist-first cooperative model
- Differentiate DDC from traditional record labels
- Provide FAQs and detailed information for prospective artists
- Establish brand identity through consistent messaging and design

---

## User Stories

### US-1: View Homepage Welcome Message
**As a** visitor  
**I want to** see a welcoming introduction to DDC  
**So that** I understand what the collective is about at a glance

**Acceptance Criteria:**
- [x] Display collective name prominently
- [x] Show concise tagline describing DDC's mission
- [x] Responsive layout for all screen sizes

### US-2: Learn About DDC Background
**As a** visitor  
**I want to** understand the history and context of deep dubstep culture  
**So that** I appreciate DDC's cultural roots and purpose

**Acceptance Criteria:**
- [x] Explain deep dubstep / 140 music origins
- [x] Describe sound system culture significance
- [x] Connect Detroit's identity to the collective's philosophy
- [x] Reference influential artists and communities

### US-3: Understand DDC Mission
**As a** visitor  
**I want to** read DDC's mission statement  
**So that** I understand the collective's goals and vision

**Acceptance Criteria:**
- [x] Display mission statement with key principles emphasized
- [x] Highlight artist empowerment, culture protection, and transparency
- [x] Explain the cooperative, artist-first ecosystem model

### US-4: Learn DDC Values
**As a** visitor  
**I want to** see the core values and principles  
**So that** I understand what DDC stands for

**Acceptance Criteria:**
- [x] Display 7 core values with descriptions
- [x] Values include: Artist Ownership, Transparency, Fair Compensation, Quality Over Quantity, Underground Integrity, Community-Driven Growth, Detroit Mentality
- [x] Each value has explanatory text

### US-5: Understand Why to Join DDC
**As a** prospective artist  
**I want to** understand the benefits of joining DDC  
**So that** I can decide if it's right for me

**Acceptance Criteria:**
- [x] List key benefits for artists
- [x] Explain ownership retention model
- [x] Describe transparent revenue model
- [x] Detail artist-favored merch economics
- [x] Explain built-in tools and dashboards
- [x] Emphasize collaborative culture

### US-6: Compare DDC to Traditional Labels
**As a** prospective artist  
**I want to** see a direct comparison between DDC and traditional labels  
**So that** I understand the concrete differences

**Acceptance Criteria:**
- [x] Display comparison table with 14 categories
- [x] Show DDC advantages with checkmarks
- [x] Show traditional label drawbacks with X marks
- [x] Categories include: ownership, contracts, revenue, merch, creative control, exclusivity

### US-7: View How DDC is Different
**As a** visitor  
**I want to** understand what sets DDC apart  
**So that** I appreciate the unique value proposition

**Acceptance Criteria:**
- [x] Explain artist-favored economics
- [x] Describe radical transparency approach
- [x] Highlight no ownership traps policy
- [x] Emphasize community over clout philosophy
- [x] Connect to underground roots

### US-8: Read Artist FAQ
**As a** prospective artist  
**I want to** find answers to common questions  
**So that** I can address my concerns before joining

**Acceptance Criteria:**
- [x] Display 11 FAQ questions with detailed answers
- [x] Cover topics: ownership, payouts, merch, shows, exclusivity, exit process
- [x] Emphasize transparency and artist autonomy
- [x] Provide clear, direct answers

### US-9: Navigate Between Marketing Pages
**As a** visitor  
**I want to** easily navigate between all marketing pages  
**So that** I can explore all information about DDC

**Acceptance Criteria:**
- [x] All pages accessible via "ABOUT" dropdown menu in navigation
- [x] Dropdown available on desktop navigation
- [x] Mobile navigation includes all marketing pages
- [x] Consistent layout across all pages

---

## Functional Requirements

| Requirement | Description | Implementation Reference |
|-------------|-------------|-------------------------|
| FR-1 | Homepage displays welcome message and tagline | [Home.tsx](src/pages/Home.tsx#L1-L13) |
| FR-2 | Background page explains dubstep culture and DDC origins | [Background.tsx](src/pages/Background.tsx#L1-L47) |
| FR-3 | Mission page displays mission statement with emphasis on key concepts | [Mission.tsx](src/pages/Mission.tsx#L1-L27) |
| FR-4 | Values page displays 7 core values with descriptions | [Values.tsx](src/pages/Values.tsx#L1-L58) |
| FR-5 | WhyJoin page lists benefits for artists with detailed explanations | [WhyJoin.tsx](src/pages/WhyJoin.tsx#L1-L88) |
| FR-6 | DDCvsTraditional page shows comparison table with 14 categories | [DDCvsTraditional.tsx](src/pages/DDCvsTraditional.tsx#L3-L205) |
| FR-7 | HowWereDifferent page explains DDC's unique approach | [HowWereDifferent.tsx](src/pages/HowWereDifferent.tsx#L1-L72) |
| FR-8 | ArtistFAQ page displays 11 Q&A sections | [ArtistFAQ.tsx](src/pages/ArtistFAQ.tsx#L1-L175) |
| FR-9 | Navigation dropdown provides access to all marketing pages | [MainLayout.tsx](src/components/organisms/MainLayout.tsx#L168-L214) |
| FR-10 | All pages use lazy loading for performance | [App.tsx](src/App.tsx#L11-L18) |
| FR-11 | Consistent container and typography styling across pages | All page files |

---

## Page Inventory

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home.tsx` | Landing page with welcome message and collective tagline |
| `/background` | `Background.tsx` | Deep dubstep culture history, sound system culture, Detroit connection |
| `/mission` | `Mission.tsx` | Mission statement emphasizing artist empowerment and transparency |
| `/values` | `Values.tsx` | 7 core values: Artist Ownership, Transparency, Fair Compensation, Quality Over Quantity, Underground Integrity, Community-Driven Growth, Detroit Mentality |
| `/why-join` | `WhyJoin.tsx` | Benefits for artists: ownership retention, transparent money, merch profits, built-in tools, collaborative culture |
| `/ddc-vs-traditional` | `DDCvsTraditional.tsx` | Side-by-side comparison table (14 categories) contrasting DDC with traditional labels |
| `/how-were-different` | `HowWereDifferent.tsx` | Differentiators: artist-favored economics, radical transparency, no ownership traps, community focus |
| `/artist-faq` | `ArtistFAQ.tsx` | 11 FAQ sections covering ownership, payouts, merch, shows, exclusivity, exit process, governance |

---

## Navigation Structure

### Desktop Navigation
- **ABOUT** dropdown menu in main header
- Contains links to all 7 marketing pages
- Dropdown appears on hover/click

### Dropdown Menu Items
1. Background
2. Mission Statement
3. How We're Different
4. Values / Principles
5. Why Join DDC?
6. Artist FAQ
7. DDC VS TRADITIONAL

### Routing Configuration
All marketing pages are:
- Public (no authentication required)
- Wrapped in `MainLayout` component
- Lazy-loaded for performance optimization

---

## Content Themes

### Key Messaging Pillars
1. **Artist Ownership** - Artists retain control of music, name, and identity
2. **Transparency** - Clear revenue splits, visible metrics, open communication
3. **Fair Compensation** - Artist-favored economics, real value for work
4. **Community** - Collaborative over competitive, collective growth
5. **Underground Integrity** - Sound system culture roots, authenticity over trends
6. **Detroit Mentality** - Gritty, honest, self-made, pressure creates diamonds

### Visual Design
- Dark theme consistent with main app (`bg-dub-black`)
- Accent color: `neon-acid` for headings and emphasis
- Typography: `font-display` for headings, `font-body` for content
- Bold text (`<strong>`) used for emphasis on key concepts
- Container max-width: `max-w-4xl` for readability

---

## File Structure

```
src/
├── pages/
│   ├── Home.tsx              # Landing page
│   ├── Background.tsx        # Culture/history page
│   ├── Mission.tsx           # Mission statement
│   ├── Values.tsx            # Core values (7 items)
│   ├── WhyJoin.tsx           # Artist benefits
│   ├── HowWereDifferent.tsx  # Differentiators
│   ├── DDCvsTraditional.tsx  # Comparison table
│   └── ArtistFAQ.tsx         # FAQ (11 questions)
├── components/
│   └── organisms/
│       └── MainLayout.tsx    # Navigation with ABOUT dropdown
└── App.tsx                   # Route definitions
```

---

## Technical Implementation

### Lazy Loading
All marketing pages are lazy-loaded using React's `lazy()`:
```tsx
const Home = lazy(() => import('./pages/Home'))
const Background = lazy(() => import('./pages/Background'))
const Mission = lazy(() => import('./pages/Mission'))
// ... etc
```

### Styling Patterns
- Container: `container mx-auto px-4 py-12`
- Content wrapper: `max-w-4xl mx-auto`
- Headings: `text-5xl font-display text-white mb-8 uppercase`
- Section headings: `text-2xl font-display text-neon-acid mb-3 uppercase`
- Body text: `text-text-primary font-body text-lg leading-relaxed`
- Emphasis: `<strong className="font-bold">`

### No External Dependencies
Marketing pages are purely static React components with:
- No API calls
- No state management
- No authentication requirements
- No dynamic data fetching

---

## Related Specifications

- [DDC-1: Authentication](../DDC-1-authentication/spec.md) - Login/SignUp pages use similar layout
- [DDC-6: Admin Dashboard](../DDC-6-admin-dashboard/spec.md) - Protected routes contrast with public marketing pages

---

## Future Considerations

1. **CMS Integration** - Content could be moved to a headless CMS for easier updates
2. **SEO Optimization** - Add meta tags, structured data for better search visibility
3. **Analytics** - Track page views and engagement metrics
4. **Localization** - Multi-language support if DDC expands internationally
5. **A/B Testing** - Test different messaging variations

---

*Generated by /speckit.retro --all*  
*Version 1.0.0*

---

## [detroitdubcollective] DDC-7-analytics

# DDC-7: Analytics & Tracking System

## Metadata
| Field | Value |
|-------|-------|
| **Status** | ✅ Implemented (Retroactive Documentation) |
| **Priority** | High |
| **Jira** | [DDC-7](https://eriksensolutions.atlassian.net/browse/DDC-7) |
| **Created** | 2026-02-10 |
| **Last Updated** | 2026-02-10 |

---

## 1. Overview

The Analytics system provides comprehensive tracking for user interactions across the Detroit Dub Collective platform. It captures page views, track plays, user engagement events (likes, downloads, shares), and geographic location data. The system uses a dual-tracking approach: **Firebase Analytics** for general event tracking and **Firestore** for detailed track-specific analytics with real-time aggregation capabilities.

### Key Capabilities
- **Page View Tracking**: Automatic tracking on route changes
- **Track Play Analytics**: Per-track play counts with user and location data
- **User Engagement**: Likes, unlikes, downloads, comments, reposts
- **Geographic Analytics**: City and country-level listener distribution
- **Real-time Updates**: Live analytics dashboard via Firestore onSnapshot
- **Data Export**: CSV and JSON export functionality
- **Testing Tools**: Development panel for event verification

---

## 2. User Stories

### US-7.1: Page View Tracking
**As a** platform administrator  
**I want** automatic page view tracking  
**So that** I can analyze user navigation patterns

**Acceptance Criteria:**
- [x] Page views tracked automatically on route changes
- [x] Page path and title captured with each view
- [x] Duplicate tracking prevented for same pathname
- [x] Works with dynamic routes (tracks, events, artists)

### US-7.2: Track Play Analytics
**As an** artist or administrator  
**I want** to see detailed play statistics for tracks  
**So that** I can understand listener engagement

**Acceptance Criteria:**
- [x] Play events logged when track starts playing
- [x] Each play session tracked only once per track
- [x] User ID associated with play events
- [x] Geographic location captured (city, country)
- [x] Monthly play aggregation available

### US-7.3: Like/Unlike Tracking
**As a** platform administrator  
**I want** to track user favorites  
**So that** I can measure content popularity

**Acceptance Criteria:**
- [x] Like events logged when user favorites a track
- [x] Unlike events logged when favorite removed
- [x] Net likes calculated (likes - unlikes)
- [x] Location metadata attached to events

### US-7.4: Download Tracking
**As an** artist  
**I want** to know when users download my tracks  
**So that** I can understand content distribution

**Acceptance Criteria:**
- [x] Download events logged on track download
- [x] Works from order confirmation page
- [x] Works from order detail page
- [x] User and track IDs captured

### US-7.5: Real-time Analytics Dashboard
**As an** administrator  
**I want** live updating analytics  
**So that** I can monitor engagement in real-time

**Acceptance Criteria:**
- [x] Dashboard updates automatically without refresh
- [x] Toggle between real-time and cached data
- [x] Date range filtering (today through all-time)
- [x] Top listeners list with user details
- [x] Top locations by city and country

### US-7.6: Analytics Export
**As an** administrator  
**I want** to export analytics data  
**So that** I can perform external analysis

**Acceptance Criteria:**
- [x] CSV export with summary, monthly, listener, and location data
- [x] JSON export with complete analytics object
- [x] Filename includes track title and export date
- [x] Export includes date range context

### US-7.7: Development Testing
**As a** developer  
**I want** a testing panel for analytics events  
**So that** I can verify event tracking during development

**Acceptance Criteria:**
- [x] Test panel visible only in development mode
- [x] Can fire all event types manually
- [x] Console logging confirms event sent

---

## 3. Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-7.1 | Track page views on route changes | ✅ | [PageViewTracker.tsx](src/components/atoms/PageViewTracker.tsx#L1-L40) |
| FR-7.2 | Prevent duplicate page tracking | ✅ | [PageViewTracker.tsx](src/components/atoms/PageViewTracker.tsx#L21-L26) |
| FR-7.3 | Log play events with location | ✅ | [useAudio.ts](src/hooks/useAudio.ts#L92-L98) |
| FR-7.4 | Log like/unlike events | ✅ | [firestore.ts](src/lib/firebase/firestore.ts#L1129-L1144) |
| FR-7.5 | Log download events | ✅ | [OrderConfirmation.tsx](src/pages/OrderConfirmation.tsx#L92), [OrderDetail.tsx](src/pages/OrderDetail.tsx#L92) |
| FR-7.6 | Aggregate track analytics | ✅ | [firestore.ts](src/lib/firebase/firestore.ts#L1270-L1300) |
| FR-7.7 | Real-time analytics subscription | ✅ | [useRealtimeAnalytics.ts](src/hooks/useRealtimeAnalytics.ts#L40-L45) |
| FR-7.8 | Geographic location detection | ✅ | [useLocation.ts](src/hooks/useLocation.ts#L19-L140) |
| FR-7.9 | Dual tracking (Firebase + Firestore) | ✅ | [firestore.ts](src/lib/firebase/firestore.ts#L1196-L1210) |
| FR-7.10 | Date range filtering | ✅ | [TrackAnalytics.tsx](src/components/organisms/TrackAnalytics.tsx#L24-L48) |
| FR-7.11 | Export to CSV | ✅ | [TrackAnalytics.tsx](src/components/organisms/TrackAnalytics.tsx#L183-L240) |
| FR-7.12 | Export to JSON | ✅ | [TrackAnalytics.tsx](src/components/organisms/TrackAnalytics.tsx#L168-L182) |
| FR-7.13 | Error handling for analytics failures | ✅ | [useAnalytics.ts](src/hooks/useAnalytics.ts#L43-L60) |
| FR-7.14 | Disable analytics on config errors | ✅ | [useAnalytics.ts](src/hooks/useAnalytics.ts#L48-L55) |
| FR-7.15 | Development test panel | ✅ | [AnalyticsTestPanel.tsx](src/components/atoms/AnalyticsTestPanel.tsx#L1-L107) |

---

## 4. Data Model

### 4.1 Analytics Event Types

```typescript
type AnalyticsEventType = 'play' | 'like' | 'unlike' | 'download' | 'comment' | 'repost'
```

### 4.2 TrackAnalyticsEvent (Firestore Document)

```typescript
interface TrackAnalyticsEvent {
  id: string                    // Document ID (auto-generated)
  track_id: string              // Reference to catalog item
  user_id: string               // Reference to user
  event_type: AnalyticsEventType
  timestamp: number             // Unix timestamp
  metadata?: {
    location?: string           // Legacy: "Detroit, United States"
    city?: string               // Structured: "Detroit"
    region?: string             // Structured: "Michigan"
    country?: string            // Structured: "United States"
    countryCode?: string        // Structured: "US"
    user_agent?: string
    duration?: number           // For play events - time played
  }
}
```

**Firestore Collection**: `track_analytics`

### 4.3 TrackAnalytics (Aggregated)

```typescript
interface TrackAnalytics {
  track_id: string
  total_plays: number
  total_likes: number           // Net: likes - unlikes
  total_downloads: number
  total_comments: number
  total_reposts: number
  monthly_plays: Array<{
    month: string               // "Jan", "Feb", etc.
    year: number
    plays: number
  }>
  top_listeners: Array<{
    user_id: string
    username?: string
    avatar_url?: string
    plays: number
    followers?: number
    tracks?: number
  }>
  top_locations: Array<{
    location: string
    flag?: string               // Emoji flag
    plays: number
  }>
  top_cities?: Array<{
    location: string
    flag?: string
    plays: number
  }>
  top_countries?: Array<{
    location: string
    flag?: string
    plays: number
  }>
}
```

### 4.4 UserLocation

```typescript
interface UserLocation {
  city?: string
  region?: string
  country?: string
  countryCode?: string
}
```

---

## 5. Analytics Events

| Event Name | Trigger | Data Captured | Storage |
|------------|---------|---------------|---------|
| `page_view` | Route change | `page_path`, `page_title` | Firebase Analytics |
| `play` | Track starts playing | `track_id`, `user_id`, `location` | Firestore + Firebase |
| `like` | User favorites track | `track_id`, `user_id`, `location` | Firestore + Firebase |
| `unlike` | User unfavorites track | `track_id`, `user_id`, `location` | Firestore + Firebase |
| `download` | User downloads track | `track_id`, `user_id`, `location` | Firestore + Firebase |
| `comment` | User comments on track | `track_id`, `user_id` | Firestore |
| `repost` | User reposts track | `track_id`, `user_id` | Firestore |
| `sign_up` | User registration | `method` (email/google) | Firebase Analytics |
| `login` | User login | `method` (email/google) | Firebase Analytics |
| `purchase` | Checkout complete | `value`, `currency`, `items[]` | Firebase Analytics |
| `add_to_cart` | Item added to cart | `item_id`, `item_name`, `price` | Firebase Analytics |
| `search` | Search performed | `search_term` | Firebase Analytics |
| `share` | Content shared | `content_type`, `item_id`, `method` | Firebase Analytics |
| `file_download` | Track downloaded | `content_type`, `item_id`, `item_name` | Firebase Analytics |

---

## 6. Integration Points

| System | Integration Type | Purpose | Configuration |
|--------|-----------------|---------|---------------|
| Firebase Analytics | SDK | General event tracking | `VITE_FIREBASE_*` env vars |
| Firestore | SDK | Track-specific analytics storage | `track_analytics` collection |
| BigDataCloud API | HTTP | Reverse geocoding (coordinates → location) | Public API, no auth |
| ipapi.co | HTTP | IP-based geolocation fallback | Public API, no auth |
| Browser Geolocation | API | Primary location detection | User permission required |

---

## 7. File Structure

```
src/
├── hooks/
│   ├── useAnalytics.ts          # Firebase Analytics hook (page views, general events)
│   ├── useRealtimeAnalytics.ts  # Firestore real-time subscription hook
│   ├── useLocation.ts           # Geographic location detection
│   └── useFirestore.ts          # useTrackAnalytics query hook
├── components/
│   ├── atoms/
│   │   ├── PageViewTracker.tsx      # Automatic page view tracking component
│   │   └── AnalyticsTestPanel.tsx   # Development testing panel
│   └── organisms/
│       └── TrackAnalytics.tsx       # Analytics dashboard UI
├── lib/
│   └── firebase/
│       ├── config.ts            # Firebase Analytics initialization
│       └── firestore.ts         # logTrackAnalyticsEvent, getTrackAnalytics
├── types/
│   └── index.ts                 # TrackAnalytics, TrackAnalyticsEvent types
└── pages/
    ├── OrderConfirmation.tsx    # Download tracking on purchase
    └── OrderDetail.tsx          # Download tracking from order history

docs/
├── ANALYTICS_TESTING.md         # Testing guide and verification checklist
├── ANALYTICS_TROUBLESHOOTING.md # Error resolution guide
└── VIEWING_ANALYTICS.md         # Firebase Console navigation guide
```

---

## 8. Configuration

### Environment Variables

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=detroitdubcollective-7228b
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=G-707Z2FP033  # Optional, for explicit measurement ID
```

### Firestore Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "track_analytics",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "track_id", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 9. Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Analytics not initialized | Skip event, log warning if ready | [useAnalytics.ts](src/hooks/useAnalytics.ts#L35-L41) |
| Firebase config error (400) | Disable analytics, suppress future errors | [useAnalytics.ts](src/hooks/useAnalytics.ts#L48-L55) |
| Firestore write failure | Log error, don't throw (non-blocking) | [firestore.ts](src/lib/firebase/firestore.ts#L1211-L1222) |
| Location fetch failure | Silently fail, location is optional | [useLocation.ts](src/hooks/useLocation.ts#L121-L124) |
| GA tracking failure | Silently fail, secondary to Firestore | [firestore.ts](src/lib/firebase/firestore.ts#L1257-L1259) |

---

## 10. Performance Considerations

1. **Request Deduplication**: Location fetch uses global promise deduplication
2. **Session Caching**: Location cached in sessionStorage for 24 hours
3. **Play Tracking Debounce**: Uses ref to track played track ID per session
4. **React Query Caching**: Analytics data cached with 10-minute stale time
5. **Real-time Toggle**: User can disable real-time for reduced API calls
6. **Non-blocking**: All analytics events fire without awaiting, using `.catch()`

---

## 11. Testing

### Development Console Output

```
✅ Firebase Analytics initialized
📊 Analytics event tracked: page_view {page_path: "/music", page_title: "Music | DDC"}
📊 [Firestore] Logging analytics event... {trackId: "...", userId: "...", eventType: "play"}
✅ [Firestore] Analytics event logged successfully
```

### Verification Checklist

See [ANALYTICS_TESTING.md](docs/ANALYTICS_TESTING.md) for complete testing guide.

---

## 12. Future Enhancements

- [ ] Heatmap visualization for location data
- [ ] Artist-level analytics aggregation
- [ ] Conversion funnel tracking
- [ ] A/B testing integration
- [ ] Custom event builder in admin

---

## 13. Related Specifications

- [DDC-6: Admin Dashboard](../DDC-6-admin-dashboard/spec.md) - Analytics display in admin
- [DDC-2: Music Player](../DDC-2-music-player/spec.md) - Play event triggering
- [DDC-5: E-commerce](../DDC-5-ecommerce/spec.md) - Purchase tracking

---

<footer>

**Generated by**: `/speckit.retro --all`  
**Version**: 1.0.0  
**Template**: `.specify/templates/spec-template.md`

</footer>

---

## [detroitdubcollective] DDC-6-admin-dashboard

# DDC-6: Admin Dashboard

**Status:** ✅ Implemented (Retroactive Documentation)  
**Jira:** [DDC-6](https://eriksensolutions.atlassian.net/browse/DDC-6)  
**Created:** 2026-02-10

---

## 1. Overview

The Admin Dashboard provides comprehensive administrative capabilities for managing the Detroit Dub Collective platform. It includes role-based access control with distinct views for administrators and artists, featuring content management, user administration, transaction monitoring, order fulfillment, and analytics visualization.

### Key Capabilities

- **Dashboard Overview**: Revenue metrics, analytics charts, KPIs
- **User Management**: View users, modify roles (admin only)
- **Content Management**: CRUD operations for artists, music, merch, events
- **Transaction Monitoring**: View and filter all platform transactions
- **Order Management**: Track orders, update statuses, add shipping info
- **Role-Based Access**: Admins see all data; artists see only their content

---

## 2. User Stories

### US-1: Admin Dashboard Access
**As an** admin/artist  
**I want to** access a dashboard with tabbed navigation  
**So that** I can manage platform content and view metrics  

**Acceptance Criteria:**
- [x] Dashboard accessible at `/admin` route
- [x] Shows "Admin Dashboard" for admins, "Artist Dashboard" for artists
- [x] Tabbed navigation: Overview, Users (admin only), Content, Transactions, Orders
- [x] Artists automatically redirected away from Users tab
- [x] Double-check role authorization before rendering

### US-2: Dashboard Overview Metrics
**As an** admin/artist  
**I want to** view key performance metrics  
**So that** I can understand platform/personal revenue performance  

**Acceptance Criteria:**
- [x] Display total revenue in USD and DDC points
- [x] Show points awarded from purchases
- [x] Display total plays, favorites, comments, downloads
- [x] Show live/scheduled events count
- [x] Display total tracks and merch count
- [x] Show open orders count (pending/processing/shipped)
- [x] Time period filter: today, 7/30 days, 3/6/12 months, all time
- [x] Artists see only their own metrics

### US-3: Revenue Charts
**As an** admin/artist  
**I want to** visualize revenue over time  
**So that** I can identify trends  

**Acceptance Criteria:**
- [x] Line chart showing cumulative revenue over time
- [x] Admins see revenue by top 5 artists
- [x] Artists see their own revenue with music/merch breakdown
- [x] Charts use Recharts library with responsive containers

### US-4: User Management
**As an** admin  
**I want to** view and manage users  
**So that** I can administer platform access  

**Acceptance Criteria:**
- [x] Display list of all users with avatar, name, email
- [x] Show user role, DDC balance, inventory count
- [x] Inline role editing with dropdown (user/artist/admin)
- [x] Save/Cancel buttons for role changes
- [x] Loading and error states with retry option
- [x] User management hidden from artist role

### US-5: Content Management
**As an** admin/artist  
**I want to** manage platform content (artists, music, merch, events)  
**So that** I can maintain the catalog  

**Acceptance Criteria:**
- [x] Sub-tabs for Artists (admin only), Music, Merch, Events
- [x] Grid display with item cards showing image, title, artist
- [x] Edit button opens modal for modifying items
- [x] Delete button with two-step confirmation requiring name match
- [x] "Add New" button creates new items
- [x] Artists see only their own music/merch/events
- [x] Navigate to detail pages on card click

### US-6: Add Catalog Items
**As an** admin/artist  
**I want to** add new tracks or merchandise  
**So that** I can expand the catalog  

**Acceptance Criteria:**
- [x] Modal with form fields: title, slug, description, artists
- [x] Auto-generate slug from title
- [x] Image upload with crop functionality
- [x] Audio upload for tracks with drag-and-drop support
- [x] Multi-track support for EPs/albums
- [x] Price fields (USD and points with auto-calculation)
- [x] Sale price support
- [x] Visibility settings (public/private/scheduled)
- [x] Stock quantity/size stock for merch
- [x] Collection assignment for merch
- [x] Release date picker

### US-7: Edit Catalog Items
**As an** admin/artist  
**I want to** edit existing catalog items  
**So that** I can update content details  

**Acceptance Criteria:**
- [x] Pre-populate form with existing item data
- [x] Support changing all fields including slug
- [x] Upload new images/audio while preserving existing
- [x] Reorder tracks via drag-and-drop
- [x] Remove individual tracks from multi-track releases
- [x] Update sale status and pricing

### US-8: Transaction Monitoring
**As an** admin/artist  
**I want to** view all transactions  
**So that** I can monitor platform activity  

**Acceptance Criteria:**
- [x] Display last 100 transactions (newest first)
- [x] Filter by type (all/purchase/earn)
- [x] Filter by currency (all/USD/DDC)
- [x] Show transaction type badge (Earned/Spent)
- [x] Display user ID, description, date/time
- [x] Show items involved in transaction
- [x] Artists see only transactions involving their items

### US-9: Order Management
**As an** admin/artist  
**I want to** manage orders  
**So that** I can fulfill customer purchases  

**Acceptance Criteria:**
- [x] Display orders with status filter (all/pending/processing/shipped/delivered/cancelled/closed)
- [x] Show order ID, status, user email, date, item count, total
- [x] Inline status change dropdown
- [x] Add/update tracking number and carrier
- [x] Display shipping address and tracking info
- [x] Preview order items (first 3) with images
- [x] "View Details" link to order detail page
- [x] Artists see only orders containing their items

---

## 3. Functional Requirements

| ID | Requirement | Implementation | File Reference |
|----|-------------|----------------|----------------|
| FR-1 | Role-based dashboard access | Check user role (admin/artist) before rendering | [AdminDashboard.tsx](src/pages/AdminDashboard.tsx#L23-L25) |
| FR-2 | Dynamic tab filtering | Artists don't see Users tab | [AdminDashboard.tsx](src/pages/AdminDashboard.tsx#L69-L72) |
| FR-3 | Artist ID resolution | Auto-lookup artist_id by user_id if missing | [AdminDashboard.tsx](src/pages/AdminDashboard.tsx#L29-L62) |
| FR-4 | Revenue metrics calculation | Filter transactions by artist items | [AdminOverview.tsx](src/components/organisms/AdminOverview.tsx#L162-L193) |
| FR-5 | Time period filtering | Calculate date ranges for metric filtering | [AdminOverview.tsx](src/components/organisms/AdminOverview.tsx#L60-L77) |
| FR-6 | Analytics event aggregation | Fetch and filter track_analytics collection | [AdminOverview.tsx](src/components/organisms/AdminOverview.tsx#L79-L106) |
| FR-7 | User role updates | Update Firestore user document with new role | [AdminUsers.tsx](src/components/organisms/AdminUsers.tsx#L49-L56) |
| FR-8 | Content CRUD operations | Create/update/delete via Firestore functions | [AdminContent.tsx](src/components/organisms/AdminContent.tsx#L76-L148) |
| FR-9 | Two-step delete confirmation | Require name match before deletion | [AdminContent.tsx](src/components/organisms/AdminContent.tsx#L84-L109) |
| FR-10 | Transaction filtering | Filter by type, currency, artist | [AdminTransactions.tsx](src/components/organisms/AdminTransactions.tsx#L50-L73) |
| FR-11 | Order status management | Update order status and tracking info | [AdminOrders.tsx](src/components/organisms/AdminOrders.tsx#L73-L130) |
| FR-12 | Image upload with cropping | Validate file, show crop UI, upload to Storage | [AddCatalogItemModal.tsx](src/components/molecules/AddCatalogItemModal.tsx#L186-L220) |
| FR-13 | Audio upload with progress | Upload multiple tracks with progress tracking | [AddCatalogItemModal.tsx](src/components/molecules/AddCatalogItemModal.tsx#L62-L72) |
| FR-14 | Slug auto-generation | Generate URL-friendly slug from title | [AddCatalogItemModal.tsx](src/components/molecules/AddCatalogItemModal.tsx#L96-L110) |
| FR-15 | Points price calculation | Auto-calculate points from USD price | [AddCatalogItemModal.tsx](src/components/molecules/AddCatalogItemModal.tsx#L129-L136) |
| FR-16 | Catalog item editing | Pre-populate form, update Firestore | [EditCatalogItemModal.tsx](src/components/molecules/EditCatalogItemModal.tsx#L88-L177) |
| FR-17 | Artist-scoped content filtering | Query items by artist_id/artist_ids | [AdminContent.tsx](src/components/organisms/AdminContent.tsx#L52-L65) |
| FR-18 | Order artist filtering | Filter orders containing artist's items | [AdminOrders.tsx](src/components/organisms/AdminOrders.tsx#L26-L38) |
| FR-19 | Revenue chart visualization | Recharts LineChart with cumulative data | [AdminOverview.tsx](src/components/organisms/AdminOverview.tsx#L310-L400) |
| FR-20 | Query cache invalidation | Invalidate React Query cache after mutations | [AdminContent.tsx](src/components/organisms/AdminContent.tsx#L99-L100) |

---

## 4. Data Model

### User
```typescript
interface User {
  uid: string
  email: string
  role: 'admin' | 'artist' | 'user'
  ddc_balance: number
  inventory: Map<string, number | { timestamp: number; quantity: number; size?: string }>
  tickets: Map<string, TicketData>
  favorites?: Map<string, number>
  stripe_cust_id?: string
  avatar_url?: string
  display_name?: string
  artist_id?: string  // Link to artist profile
  saved_addresses?: ShippingAddress[]
}
```

### Order
```typescript
interface Order {
  id: string
  user_id: string
  user_email?: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'closed'
  items: OrderItem[]
  shipping_address?: ShippingAddress
  subtotal_usd: number
  subtotal_points: number
  shipping_cost_usd?: number
  shipping_cost_points?: number
  total_usd: number
  total_points: number
  currency: 'USD' | 'DDC'
  payment_method: 'stripe' | 'points'
  stripe_payment_intent_id?: string
  transaction_id?: string
  tracking_number?: string
  carrier?: string
  shipped_at?: number
  delivered_at?: number
  created_at: number
  updated_at: number
  notes?: string
  cancelled_at?: number
  cancellation_reason?: string
}
```

### Transaction
```typescript
interface Transaction {
  id: string
  user_id: string
  amount: number
  currency: 'USD' | 'DDC'
  type: 'purchase' | 'earn'
  timestamp: number
  item_id?: string  // Legacy single item
  items?: Array<{ id: string; type: 'track' | 'merch'; quantity: number }>
  event_id?: string
  description?: string
  stripe_payment_intent_id?: string
  points_awarded?: number
  source?: string
}
```

### CatalogItem (Admin-relevant fields)
```typescript
interface CatalogItem {
  id: string
  slug?: string
  type: 'track' | 'merch'
  title: string
  description?: string
  price_usd: number
  price_points: number
  sale_price_usd?: number
  sale_price_points?: number
  is_on_sale?: boolean
  artist_id?: string  // Legacy
  artist_ids?: string[]  // Multi-artist support
  visibility?: 'public' | 'private' | 'scheduled'
  scheduled_publish_date?: number
  stock_qty?: number
  size_stock?: { one_size?: number; s?: number; m?: number; l?: number; xl?: number; '2xl'?: number; '3xl'?: number; '4xl'?: number }
  is_one_size?: boolean
}
```

---

## 5. Edge Cases & Error Handling

| Scenario | Handling | File Reference |
|----------|----------|----------------|
| Artist missing artist_id | Auto-lookup by user_id, update user document | [AdminDashboard.tsx](src/pages/AdminDashboard.tsx#L29-L62) |
| No artist found for lookup | Log warning, set resolvedArtistId to undefined | [AdminDashboard.tsx](src/pages/AdminDashboard.tsx#L51-L55) |
| Artist accesses Users tab | Redirect to Overview tab | [AdminDashboard.tsx](src/pages/AdminDashboard.tsx#L77-L80) |
| Delete confirmation mismatch | Show error toast, prevent deletion | [AdminContent.tsx](src/components/organisms/AdminContent.tsx#L91-L93) |
| Transaction fetch error | Display error message with retry button | [AdminTransactions.tsx](src/components/organisms/AdminTransactions.tsx#L89-L100) |
| User fetch error | Display error message with retry button | [AdminUsers.tsx](src/components/organisms/AdminUsers.tsx#L62-L73) |
| Order update failure | Show error toast with message | [AdminOrders.tsx](src/components/organisms/AdminOrders.tsx#L95-L102) |
| Image validation failure | Show error toast, reject upload | [AddCatalogItemModal.tsx](src/components/molecules/AddCatalogItemModal.tsx#L192-L199) |
| Audio validation failure | Show error toast, reject upload | [AddCatalogItemModal.tsx](src/components/molecules/AddCatalogItemModal.tsx) |
| Empty tracking number | Show error toast, prevent update | [AdminOrders.tsx](src/components/organisms/AdminOrders.tsx#L105-L112) |
| No transactions found | Display "No transactions found" message | [AdminTransactions.tsx](src/components/organisms/AdminTransactions.tsx#L198-L202) |
| No orders found | Display "No orders found" message | [AdminOrders.tsx](src/components/organisms/AdminOrders.tsx#L145-L147) |
| Artist with no content | Display empty state messages | [AdminContent.tsx](src/components/organisms/AdminContent.tsx#L523-L541) |

---

## 6. Integration Points

| Integration | Purpose | Files |
|-------------|---------|-------|
| Firebase Firestore | Data persistence for all entities | `src/lib/firebase/firestore.ts` |
| Firebase Storage | Image and audio file uploads | `src/lib/firebase/storage.ts` |
| React Query | Data fetching, caching, mutations | `src/hooks/useFirestore.ts` |
| Zustand (useAuthStore) | Current user authentication state | `src/stores/useAuthStore.ts` |
| Zustand (useToastStore) | Toast notifications for feedback | `src/stores/useToastStore.ts` |
| Zustand (usePlayerStore) | Audio preview playback | `src/stores/usePlayerStore.ts` |
| React Router | Navigation and routing | `AdminDashboard.tsx`, `AdminContent.tsx` |
| Recharts | Revenue and analytics visualization | `AdminOverview.tsx` |
| clsx | Conditional CSS class composition | All component files |
| date-fns | Date formatting in transactions | `AdminTransactions.tsx` |

---

## 7. File Structure

```
src/
├── pages/
│   └── AdminDashboard.tsx          # Main dashboard page with tab navigation
├── components/
│   ├── organisms/
│   │   ├── AdminOverview.tsx       # Metrics, charts, KPIs (2185 lines)
│   │   ├── AdminUsers.tsx          # User management (admin only)
│   │   ├── AdminContent.tsx        # Content CRUD (832 lines)
│   │   ├── AdminTransactions.tsx   # Transaction monitoring
│   │   └── AdminOrders.tsx         # Order management (387 lines)
│   └── molecules/
│       ├── AddCatalogItemModal.tsx # Create tracks/merch (2392 lines)
│       ├── EditCatalogItemModal.tsx # Edit tracks/merch (2023 lines)
│       ├── AddArtistModal.tsx      # Create artist profiles
│       ├── EditArtistModal.tsx     # Edit artist profiles
│       ├── AddEventModal.tsx       # Create events
│       ├── EditEventModal.tsx      # Edit events
│       ├── EditMusicModal.tsx      # Legacy track editing (533 lines)
│       ├── EditMerchModal.tsx      # Legacy merch editing (227 lines)
│       └── ImageCrop.tsx           # Image cropping utility
├── types/
│   └── index.ts                    # TypeScript interfaces (280 lines)
├── hooks/
│   └── useFirestore.ts             # React Query hooks for data fetching
├── lib/
│   └── firebase/
│       ├── firestore.ts            # Firestore CRUD operations
│       ├── storage.ts              # Storage upload/delete operations
│       └── config.ts               # Firebase configuration
└── stores/
    ├── useAuthStore.ts             # Authentication state
    └── useToastStore.ts            # Toast notification state
```

---

## 8. Security Considerations

### Role-Based Access Control
| Feature | Admin | Artist | User |
|---------|-------|--------|------|
| Dashboard Access | ✅ | ✅ | ❌ |
| Overview Metrics | All data | Own data only | ❌ |
| User Management | ✅ | ❌ | ❌ |
| Content CRUD | All content | Own content only | ❌ |
| Transaction View | All transactions | Own item transactions | ❌ |
| Order Management | All orders | Own item orders | ❌ |

### Implementation Details
- **Route Protection**: `RequireAuth` component wraps admin routes, checking `role === 'admin' || role === 'artist'`
- **Double Authorization**: AdminDashboard re-validates role before rendering ([AdminDashboard.tsx#L23-L25](src/pages/AdminDashboard.tsx#L23-L25))
- **Artist Data Isolation**: Artist ID filtering applied to all queries ([AdminContent.tsx#L52-L65](src/components/organisms/AdminContent.tsx#L52-L65))
- **Tab Restriction**: Users tab programmatically hidden and redirected for artists ([AdminDashboard.tsx#L69-L80](src/pages/AdminDashboard.tsx#L69-L80))
- **Firestore Rules**: Backend rules should validate user role for admin collections

### Security Recommendations
1. Ensure Firestore security rules enforce role-based access at database level
2. Validate artist_id ownership in backend rules before allowing content modifications
3. Consider rate limiting for admin API operations
4. Audit logging for sensitive admin actions (role changes, deletions)

---

## 9. Related Specifications

- [DDC-1: Authentication](../DDC-1-authentication/spec.md) - User authentication and role management
- [DDC-5: E-Commerce](../DDC-5-ecommerce/spec.md) - Order and transaction processing
- [DDC-7: Analytics](../DDC-7-analytics/spec.md) - Track analytics integration

---

**Generated by:** `/speckit.retro --all`  
**Version:** 1.0.0

---

## [detroitdubcollective] DDC-5-ecommerce

# DDC-5: E-commerce (Merchandise)

**Status:** ✅ Implemented (Retroactive Documentation)  
**Jira:** [DDC-5](https://eriksensolutions.atlassian.net/browse/DDC-5)  
**Created:** 2026-02-10

---

## Overview

The E-commerce feature provides a complete merchandise browsing, shopping cart, and checkout experience for the Detroit Dub Collective platform. Users can browse physical merchandise (apparel, accessories), add items to a persistent cart with size/quantity selection, and complete purchases using either USD (via Stripe) or DDC Points. The system supports order tracking, shipping address management, and integrates with the existing authentication and user inventory systems.

### Key Capabilities

- **Product Catalog:** Browse merchandise with images, descriptions, and dual pricing (USD/Points)
- **Shopping Cart:** Persistent cart with quantity controls, size selection, and currency toggle
- **Dual Payment:** Stripe integration for USD payments, DDC Points for loyalty program
- **Order Management:** Track orders through pending → processing → shipped → delivered lifecycle
- **Shipping:** Address collection, validation, and saved address management
- **Digital Downloads:** Track purchases include immediate download access via order confirmation

---

## User Stories

### US-1: Browse Merchandise
**As a** visitor  
**I want to** browse available merchandise  
**So that** I can discover products I want to purchase

**Acceptance Criteria:**
- [x] Merchandise grid displays all merch items with images
- [x] Each product card shows title, artist, and dual pricing (USD/Points)
- [x] Loading state shows spinner while fetching data
- [x] Error state displays message if fetch fails
- [x] Empty state shows "No merchandise available" message

### US-2: View Product Details
**As a** visitor  
**I want to** view detailed product information  
**So that** I can make informed purchase decisions

**Acceptance Criteria:**
- [x] Product detail page shows full-size image with support images gallery
- [x] Size selector appears for multi-size items (S, M, L, XL, 2XL, 3XL, 4XL)
- [x] One-size items skip size selection
- [x] Quantity selector with +/- buttons and direct input
- [x] Stock validation prevents selecting unavailable sizes
- [x] Sale pricing displays strikethrough original price
- [x] Artist name links to artist profile page
- [x] Back navigation returns to merch listing

### US-3: Manage Shopping Cart
**As a** customer  
**I want to** add/remove items from my cart  
**So that** I can build my order before checkout

**Acceptance Criteria:**
- [x] Add to cart button adds item with selected size/quantity
- [x] Cart icon in header shows item count badge
- [x] Cart panel slides in from right side
- [x] Cart displays item image, title, size, quantity, and price
- [x] Quantity can be adjusted with +/- buttons
- [x] Remove button deletes item from cart
- [x] Clear cart button removes all items
- [x] Cart persists across page refreshes (localStorage)
- [x] Toast notification confirms add/remove actions with undo option

### US-4: Toggle Payment Currency
**As a** customer  
**I want to** choose between USD and Points  
**So that** I can pay with my preferred method

**Acceptance Criteria:**
- [x] Currency toggle shows USD and Points options
- [x] Selecting currency updates all displayed prices
- [x] Cart total recalculates based on selected currency
- [x] Alternative currency total shown for reference

### US-5: Checkout with Stripe (USD)
**As a** authenticated user  
**I want to** pay with my credit card  
**So that** I can complete my purchase with USD

**Acceptance Criteria:**
- [x] Checkout modal opens when clicking checkout button
- [x] Stripe Payment Element renders with dark theme styling
- [x] Card details collected securely via Stripe
- [x] Processing state prevents double-submission
- [x] Success redirects to order confirmation page
- [x] Error displays user-friendly message
- [x] Points reward earned on USD purchase (10 points per $1)

### US-6: Checkout with DDC Points
**As a** authenticated user with sufficient points  
**I want to** pay with my DDC Points balance  
**So that** I can redeem my loyalty rewards

**Acceptance Criteria:**
- [x] Points balance displayed in checkout
- [x] Insufficient balance shows error message
- [x] Points deducted from user balance on success
- [x] Order created with payment_method: 'points'
- [x] Success redirects to order confirmation page

### US-7: Enter Shipping Address
**As a** customer purchasing merchandise  
**I want to** enter my shipping address  
**So that** my order can be delivered

**Acceptance Criteria:**
- [x] Shipping address form appears for merch orders only
- [x] Required fields: full name, address line 1, city, state, postal code, country
- [x] Optional fields: address line 2, phone
- [x] Address autocomplete via AddressAutocomplete component
- [x] Validation prevents submission with missing required fields
- [x] New addresses saved to user profile for future orders

### US-8: Use Saved Addresses
**As a** returning customer  
**I want to** select from my saved addresses  
**So that** I can checkout faster

**Acceptance Criteria:**
- [x] Dropdown shows saved addresses with summary
- [x] Selecting address populates form fields
- [x] "Add New Address" option shows fresh form
- [x] "Use Saved Address" returns to dropdown

### US-9: View Order Confirmation
**As a** customer  
**I want to** see my order confirmation  
**So that** I know my purchase was successful

**Acceptance Criteria:**
- [x] Success checkmark animation displays
- [x] Order ID shown with truncated format
- [x] Order date and status displayed
- [x] All purchased items listed with images
- [x] Order total and payment method shown
- [x] Shipping address displayed for merch orders
- [x] Track purchases include download buttons
- [x] Track-only orders auto-close status

### US-10: View Order History
**As a** authenticated user  
**I want to** see my past orders  
**So that** I can track and review my purchases

**Acceptance Criteria:**
- [x] Order list shows all user orders
- [x] Each order displays ID, date, status, and total
- [x] Preview shows first 3 items with "+X more" indicator
- [x] Tracking number displayed when available
- [x] Clicking order navigates to full detail page
- [x] Download buttons available for track purchases

### US-11: View Order Details
**As a** authenticated user  
**I want to** see full order details  
**So that** I can track shipping and access digital purchases

**Acceptance Criteria:**
- [x] Full order information displayed
- [x] Item list with images, sizes, quantities, and prices
- [x] Status timeline shows order progress
- [x] Shipping address editable for pending orders
- [x] Download buttons for track items
- [x] Admin can update order status and add tracking

---

## Functional Requirements

| ID | Requirement | File Reference |
|----|-------------|----------------|
| FR-1 | Fetch merchandise items from Firestore by type='merch' | [Merch.tsx](src/pages/Merch.tsx#L5) |
| FR-2 | Display products in responsive grid (1/2/3 columns) | [ProductGrid.tsx](src/components/organisms/ProductGrid.tsx#L18-L21) |
| FR-3 | Product card shows dual pricing (USD and Points) | [ProductCard.tsx](src/components/molecules/ProductCard.tsx#L1-L150) |
| FR-4 | Fetch single item by slug for detail page | [MerchDetail.tsx](src/pages/MerchDetail.tsx#L19) |
| FR-5 | Size stock management with per-size inventory | [MerchDetail.tsx](src/pages/MerchDetail.tsx#L33-L51) |
| FR-6 | Cart state managed with Zustand + localStorage persistence | [useCartStore.ts](src/stores/useCartStore.ts#L34-L168) |
| FR-7 | Cart items keyed by itemId:size for size variants | [useCartStore.ts](src/stores/useCartStore.ts#L13-L15) |
| FR-8 | Stripe Payment Element integration | [StripeCheckoutForm.tsx](src/components/molecules/StripeCheckoutForm.tsx#L1-L125) |
| FR-9 | Create PaymentIntent via Cloud Function | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L102-L123) |
| FR-10 | Process points payment via Cloud Function | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L191-L230) |
| FR-11 | Create order document in Firestore | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L232-L273) |
| FR-12 | Shipping address validation with required fields | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L144-L180) |
| FR-13 | Saved addresses stored in user document | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L303-L310) |
| FR-14 | Order status lifecycle management | [OrderDetail.tsx](src/pages/OrderDetail.tsx#L315-L332) |
| FR-15 | Digital download with progress and abort | [OrderConfirmation.tsx](src/pages/OrderConfirmation.tsx#L28-L150) |
| FR-16 | Album downloads bundled as ZIP | [OrderHistory.tsx](src/components/molecules/OrderHistory.tsx#L97-L130) |
| FR-17 | Order history query by user_id | [OrderHistory.tsx](src/components/molecules/OrderHistory.tsx#L195) |
| FR-18 | Points balance validation before payment | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L200-L208) |
| FR-19 | Sale price display with strikethrough | [MerchDetail.tsx](src/pages/MerchDetail.tsx#L113-L116) |
| FR-20 | One-size vs multi-size item handling | [MerchDetail.tsx](src/pages/MerchDetail.tsx#L36-L38) |

---

## Data Model

### CatalogItem (type: 'merch')

```typescript
interface CatalogItem {
  id: string
  slug?: string
  type: 'track' | 'merch'
  title: string
  description?: string
  price_usd: number
  price_points: number
  sale_price_usd?: number
  sale_price_points?: number
  is_on_sale?: boolean
  artist_id?: string
  artist_ids?: string[]
  artist_name?: string
  artist_names?: string[]
  image_url?: string
  image_filename?: string
  support_images?: string[]
  support_image_filenames?: string[]
  stock_qty?: number  // Legacy - use size_stock
  size_stock?: {
    one_size?: number
    s?: number
    m?: number
    l?: number
    xl?: number
    '2xl'?: number
    '3xl'?: number
    '4xl'?: number
  }
  is_one_size?: boolean
  release_date?: number
}
```

### CartItem (Client State)

```typescript
interface CartItem {
  item: CatalogItem
  quantity: number
  size?: string  // For merch items with multiple sizes
}
```

### ShippingAddress

```typescript
interface ShippingAddress {
  full_name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
}
```

### OrderItem

```typescript
interface OrderItem {
  item_id: string
  item_type: 'track' | 'merch'
  title: string
  quantity: number
  size?: string
  price_usd: number
  price_points: number
  image_url?: string
}
```

### Order

```typescript
interface Order {
  id: string
  user_id: string
  user_email?: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'closed'
  items: OrderItem[]
  shipping_address?: ShippingAddress
  subtotal_usd: number
  subtotal_points: number
  shipping_cost_usd?: number
  shipping_cost_points?: number
  total_usd: number
  total_points: number
  currency: 'USD' | 'DDC'
  payment_method: 'stripe' | 'points'
  stripe_payment_intent_id?: string
  transaction_id?: string
  tracking_number?: string
  carrier?: string
  shipped_at?: number
  delivered_at?: number
  created_at: number
  updated_at: number
  notes?: string
  cancelled_at?: number
  cancellation_reason?: string
}
```

### Currency Type

```typescript
type Currency = 'USD' | 'DDC'
```

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Item out of stock | Disable Add to Cart button, show "Sold Out" | [MerchDetail.tsx](src/pages/MerchDetail.tsx#L395-L396) |
| Size not selected | Toast error "Please select a size" | [MerchDetail.tsx](src/pages/MerchDetail.tsx#L80-L87) |
| Insufficient points balance | Toast error with current/required balance | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L200-L208) |
| Stripe payment failed | Display error message, allow retry | [StripeCheckoutForm.tsx](src/components/molecules/StripeCheckoutForm.tsx#L83-L87) |
| Missing required address field | Toast error for specific field | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L147-L179) |
| Order not found | Display "Order not found" with back link | [OrderDetail.tsx](src/pages/OrderDetail.tsx#L363-L374) |
| Firestore fetch error | Display error message with error details | [Merch.tsx](src/pages/Merch.tsx#L18-L25) |
| Download aborted | Clear progress, reset state | [OrderHistory.tsx](src/components/molecules/OrderHistory.tsx#L32-L36) |
| Download failed | Toast error, reset state, allow retry | [OrderHistory.tsx](src/components/molecules/OrderHistory.tsx#L143-L156) |
| Empty cart | Show "Your cart is empty" message | [CartPanel.tsx](src/components/organisms/CartPanel.tsx#L63-L65) |
| User not authenticated | Error "Please log in" on checkout attempt | [CheckoutModal.tsx](src/components/organisms/CheckoutModal.tsx#L184-L190) |
| Invalid quantity input | Clamp to valid range (1 to maxQuantity) | [MerchDetail.tsx](src/pages/MerchDetail.tsx#L309-L318) |

---

## Integration Points

| System | Integration Type | Details |
|--------|-----------------|---------|
| **Stripe** | Payment processing | PaymentIntent creation via Cloud Functions, Payment Element for secure card collection |
| **Firebase Auth** | User authentication | Order ownership verification, protected checkout |
| **Firestore** | Data persistence | CatalogItem, Order, User documents; real-time queries |
| **Cloud Functions** | Server-side logic | `createPaymentIntent`, `processPointsPayment` |
| **Firebase Storage** | File downloads | Track audio files download with abort support |
| **TanStack Query** | Data fetching | Caching, invalidation, optimistic updates |
| **Zustand** | State management | Cart state with localStorage persistence |
| **JSZip** | File bundling | Album downloads as ZIP archives |

---

## File Structure

```
src/
├── pages/
│   ├── Merch.tsx                    # Merchandise listing page
│   ├── MerchDetail.tsx              # Product detail page
│   ├── OrderConfirmation.tsx        # Post-checkout confirmation
│   └── OrderDetail.tsx              # Full order details page
├── components/
│   ├── atoms/
│   │   └── CartIcon.tsx             # Cart icon with badge
│   ├── molecules/
│   │   ├── ProductCard.tsx          # Product card component
│   │   ├── StripeCheckoutForm.tsx   # Stripe Payment Element form
│   │   └── OrderHistory.tsx         # Order list component
│   └── organisms/
│       ├── ProductGrid.tsx          # Responsive product grid
│       ├── CartPanel.tsx            # Slide-out cart panel
│       └── CheckoutModal.tsx        # Checkout flow modal
├── stores/
│   └── useCartStore.ts              # Zustand cart state
├── lib/
│   ├── constants.ts                 # POINTS_PER_DOLLAR = 100
│   ├── stripe/
│   │   └── config.ts                # Stripe initialization
│   └── firebase/
│       ├── functions.ts             # Cloud Function calls
│       └── firestore.ts             # Order CRUD operations
└── types/
    └── index.ts                     # TypeScript interfaces
```

---

## Configuration

### Environment Variables

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
```

### Constants

```typescript
// src/lib/constants.ts
export const POINTS_PER_DOLLAR = 100      // 100 points = $1 USD (spending)
export const POINTS_REWARD_PER_DOLLAR = 10 // Earn 10 points per $1 spent
```

### Stripe Theme

```typescript
// Dark theme configuration for Stripe Elements
{
  theme: 'night',
  variables: {
    colorPrimary: '#39FF14',      // neon-acid
    colorBackground: '#0a0a0a',   // dub-black
    colorText: '#ffffff',
    colorDanger: '#FF2A2A',       // signal-red
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '8px',
  }
}
```

---

## Future Enhancements

- [ ] Shipping cost calculation based on address
- [ ] Discount/coupon code support
- [ ] Wishlist functionality
- [ ] Inventory low-stock alerts
- [ ] Order email notifications
- [ ] Tax calculation by region
- [ ] International shipping support
- [ ] Return/refund workflow

---

*Generated by /speckit.retro --all*  
*Version 1.0.0*

---

## [detroitdubcollective] DDC-4-events-management

# DDC-4: Events Management

**Status:** ✅ Implemented (Retroactive Documentation)  
**Jira:** [DDC-4](https://eriksensolutions.atlassian.net/browse/DDC-4)  
**Created:** 2026-02-10

---

## Overview

The Events Management feature enables the Detroit Dub Collective platform to showcase live and upcoming events. Users can browse events with status filtering, view event details with artist lineups and ticket pricing, and purchase tickets using USD (Stripe) or DDC Points. Admins can create, edit, and delete events through the Admin Dashboard content management interface.

### Key Capabilities

- **Public Event Browsing**: Users view events in a responsive grid with status badges (Live, Upcoming, Past)
- **Event Filtering & Sorting**: Filter by status (All, Live, Scheduled, Ended) with smart sorting (Live first, then chronological)
- **Event Detail View**: Full event information with artist lineup, pricing, and ticket purchase options
- **Dual Currency Support**: Tickets purchasable in USD via Stripe or DDC Points
- **Admin CRUD Operations**: Create, edit, and delete events with image upload and crop functionality
- **Artist Relationship**: Events linked to multiple performing artists via artist_ids array

---

## User Stories

### US-1: Browse Events
**As a** visitor  
**I want to** browse all events on the platform  
**So that** I can discover upcoming live streams and performances

**Acceptance Criteria:**
- [x] Events page displays all events in a responsive grid layout
- [x] Grid shows 1 column on mobile, 2 columns on tablet, 3 columns on desktop
- [x] Each event card shows image, title, artists, date/time, and ticket prices
- [x] Status badges display for Live (red, pulsing), Upcoming (green), Ended (gray)
- [x] Loading spinner shown while events are fetching
- [x] Error message displayed if events fail to load
- [x] Empty state message shown when no events exist

### US-2: Filter Events by Status
**As a** user  
**I want to** filter events by their status  
**So that** I can find live streams or plan for upcoming events

**Acceptance Criteria:**
- [x] Filter buttons available for: All, Live, Upcoming (Scheduled), Past (Ended)
- [x] Active filter button is visually highlighted
- [x] Events automatically sorted: Live first, then Scheduled by date (ascending), then Ended by date (descending)
- [x] Empty state shown when no events match the selected filter

### US-3: View Event Details
**As a** user  
**I want to** view detailed information about an event  
**So that** I can learn about the artists, timing, and ticket pricing

**Acceptance Criteria:**
- [x] Event detail page displays full event image with status badge overlay
- [x] Event title, description, and date/time are prominently displayed
- [x] Performing artists shown with links to their profiles
- [x] Back navigation link to events list
- [x] Redirects to events list if event not found

### US-4: Purchase Event Tickets
**As a** user  
**I want to** purchase tickets for an event  
**So that** I can access the live stream

**Acceptance Criteria:**
- [x] Currency toggle allows switching between USD and Points pricing
- [x] Price displayed in both currencies with equivalent shown below
- [x] "Buy Ticket" button for scheduled events
- [x] "Join Live Stream" button for live events
- [x] Processing state shown during ticket purchase
- [x] Past events show "This event has ended" message instead of purchase button

### US-5: Manage Events (Admin)
**As an** admin  
**I want to** create, edit, and delete events  
**So that** I can manage the event calendar

**Acceptance Criteria:**
- [x] Events tab in Admin Dashboard Content Management section
- [x] "Add New" button opens Add Event modal
- [x] Event cards in admin show edit (pencil) and delete (trash) icons
- [x] Edit modal pre-populates all event fields
- [x] Delete requires two-step confirmation with name typing
- [x] Toast notifications for success/error on all operations
- [x] Query cache invalidated after mutations for immediate UI updates

### US-6: Create Event with Image Upload
**As an** admin  
**I want to** upload and crop event images  
**So that** events have consistent, properly-sized artwork

**Acceptance Criteria:**
- [x] Image upload accepts JPEG, PNG, WebP, GIF formats
- [x] Image validation enforces file type and size limits
- [x] Crop interface allows adjusting image before upload
- [x] Image preview shown after cropping
- [x] Ability to remove image and upload a different one
- [x] Uploading indicator shown during image upload

---

## Functional Requirements

| ID | Requirement | Implementation | File Reference |
|----|-------------|----------------|----------------|
| FR-1 | Display events in responsive grid (1/2/3 columns) | CSS Grid with Tailwind responsive classes | [EventGrid.tsx](src/components/organisms/EventGrid.tsx#L17-L20) |
| FR-2 | Filter events by status | useMemo hook filters allEvents by status | [Events.tsx](src/pages/Events.tsx#L11-L14) |
| FR-3 | Sort events (live first, then by date) | Custom sort algorithm in useMemo | [Events.tsx](src/pages/Events.tsx#L17-L32) |
| FR-4 | Display status badges with appropriate styling | Conditional rendering with status-based classes | [EventCard.tsx](src/components/molecules/EventCard.tsx#L58-L75) |
| FR-5 | Show event detail with full information | useEvent hook + artist resolution | [EventDetail.tsx](src/pages/EventDetail.tsx#L13-L22) |
| FR-6 | Support dual currency pricing display | Currency toggle state with price calculation | [EventDetail.tsx](src/pages/EventDetail.tsx#L157-L187) |
| FR-7 | Fetch all events from Firestore | React Query with useEvents hook | [useFirestore.ts](src/hooks/useFirestore.ts#L240-L247) |
| FR-8 | Fetch single event by ID | getEvent function with document lookup | [firestore.ts](src/lib/firebase/firestore.ts#L878-L891) |
| FR-9 | Create new event document | createEvent with Timestamp conversion | [firestore.ts](src/lib/firebase/firestore.ts#L910-L935) |
| FR-10 | Update event document | updateEvent with partial data support | [firestore.ts](src/lib/firebase/firestore.ts#L974-L997) |
| FR-11 | Delete event with image cleanup | deleteEvent with storage deletion | [firestore.ts](src/lib/firebase/firestore.ts#L941-L972) |
| FR-12 | Admin event management interface | Events tab in AdminContent | [AdminContent.tsx](src/components/organisms/AdminContent.tsx#L437-L498) |
| FR-13 | Image upload with crop functionality | ImageCrop component integration | [AddEventModal.tsx](src/components/molecules/AddEventModal.tsx#L68-L98) |
| FR-14 | Two-step delete confirmation | confirmStep state with name verification | [AdminContent.tsx](src/components/organisms/AdminContent.tsx#L143-L172) |
| FR-15 | Artist filtering for artist role | Filter events by artist_ids.includes() | [AdminContent.tsx](src/components/organisms/AdminContent.tsx#L77-L80) |

---

## Data Model

### Event Type

```typescript
// src/types/index.ts

export type EventStatus = 'scheduled' | 'live' | 'ended'

export interface Event {
  id: string                    // Firestore document ID
  title: string                 // Event title (required)
  description?: string          // Event description (optional)
  date: number                  // Unix timestamp in milliseconds
  is_live: boolean              // Whether event is currently streaming
  status: EventStatus           // 'scheduled' | 'live' | 'ended'
  hms_room_id?: string          // 100ms.live room ID for streaming
  ticket_price_points: number   // Price in DDC Points (required)
  ticket_price_usd?: number     // Price in USD (optional, falls back to points/100)
  image_url?: string            // Event artwork URL
  image_filename?: string       // Original uploaded filename
  artist_ids: string[]          // Array of performing artist IDs
}
```

### Firestore Collection

- **Collection:** `events`
- **Document ID:** Auto-generated
- **Date Storage:** Stored as Firestore Timestamp, converted to/from milliseconds on read/write

---

## Edge Cases & Error Handling

| Scenario | Behavior | Location |
|----------|----------|----------|
| Event not found | Redirect to /events with Navigate component | [EventDetail.tsx](src/pages/EventDetail.tsx#L33-L35) |
| Events fetch error | Display error message with error details | [Events.tsx](src/pages/Events.tsx#L44-L52) |
| No events in filter | Show "No events found" message | [EventGrid.tsx](src/components/organisms/EventGrid.tsx#L15-L19) |
| Image upload fails | Toast error, cancel submission | [AddEventModal.tsx](src/components/molecules/AddEventModal.tsx#L112-L124) |
| Invalid image file | Toast error with validation message | [AddEventModal.tsx](src/components/molecules/AddEventModal.tsx#L51-L59) |
| Delete confirmation mismatch | Toast error "name does not match" | [AdminContent.tsx](src/components/organisms/AdminContent.tsx#L150-L152) |
| Image deletion fails | Log warning, continue (document already deleted) | [firestore.ts](src/lib/firebase/firestore.ts#L963-L968) |
| Missing USD price | Calculate from points ÷ 100 | [EventCard.tsx](src/components/molecules/EventCard.tsx#L93) |
| No artists found for event | Display "Unknown Artists" | [EventCard.tsx](src/components/molecules/EventCard.tsx#L27) |
| Past event | Disable ticket purchase, show "event has ended" | [EventDetail.tsx](src/pages/EventDetail.tsx#L217-L222) |

---

## Integration Points

| System | Integration Type | Purpose | Reference |
|--------|------------------|---------|-----------|
| Firebase Firestore | Database | Event CRUD operations | [firestore.ts](src/lib/firebase/firestore.ts#L864-L997) |
| Firebase Storage | File Storage | Event image upload/delete | [AddEventModal.tsx](src/components/molecules/AddEventModal.tsx#L107-L119) |
| React Query | State Management | Caching and query invalidation | [useFirestore.ts](src/hooks/useFirestore.ts#L240-L268) |
| 100ms.live | Streaming | Live event room integration (hms_room_id) | [types/index.ts](src/types/index.ts#L115) |
| Stripe | Payments | USD ticket purchases | [EventDetail.tsx](src/pages/EventDetail.tsx#L49-L67) |
| Artists Collection | Relationship | Event artist lineup resolution | [EventCard.tsx](src/components/molecules/EventCard.tsx#L20-L33) |
| Toast Store | Notifications | Success/error feedback | [AddEventModal.tsx](src/components/molecules/AddEventModal.tsx#L141-L145) |
| date-fns | Date Formatting | Event date display | [EventCard.tsx](src/components/molecules/EventCard.tsx#L6) |

---

## File Structure

```
src/
├── pages/
│   ├── Events.tsx              # Events listing page with filtering
│   └── EventDetail.tsx         # Single event detail page
├── components/
│   ├── molecules/
│   │   ├── EventCard.tsx       # Event card component
│   │   ├── AddEventModal.tsx   # Create event modal (458 lines)
│   │   └── EditEventModal.tsx  # Edit event modal (280 lines)
│   └── organisms/
│       ├── EventGrid.tsx       # Responsive event grid layout
│       └── AdminContent.tsx    # Admin CRUD interface (events section)
├── hooks/
│   └── useFirestore.ts         # React Query hooks: useEvents, useEvent, useEventsByStatus
├── lib/
│   └── firebase/
│       └── firestore.ts        # Firestore functions: getEvents, getEvent, createEvent, updateEvent, deleteEvent
├── types/
│   └── index.ts                # Event, EventStatus type definitions
└── stores/
    └── useCartStore.ts         # Currency selection state (selectedCurrency)
```

### Route Configuration

```typescript
// src/App.tsx
<Route path="events" element={<Events />} />
<Route path="events/:eventId" element={<EventDetail />} />
```

---

## Query Keys

```typescript
// src/hooks/useFirestore.ts
export const queryKeys = {
  events: {
    all: ['events'] as const,
    item: (id: string) => ['events', id] as const,
    byStatus: (status: string) => ['events', 'status', status] as const,
  },
}
```

---

## UI Components

### EventCard Props
```typescript
interface EventCardProps {
  event: Event
}
```

### EventGrid Props
```typescript
interface EventGridProps {
  events: Event[]
}
```

### AddEventModal Props
```typescript
interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}
```

### EditEventModal Props
```typescript
interface EditEventModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}
```

---

## Stale Time Configuration

| Hook | Stale Time | Rationale |
|------|------------|-----------|
| useEvents | 2 minutes | Events change more frequently (status updates) |
| useEvent | 2 minutes | Individual event details may update |
| useEventsByStatus | 2 minutes | Status filtering needs fresh data |

---

## Related Specifications

- [DDC-1: Authentication](../DDC-1-authentication/spec.md) - User roles for admin access
- [DDC-3: Artists Management](../DDC-3-artists-management/spec.md) - Artist profiles linked to events
- [DDC-5: E-Commerce](../DDC-5-ecommerce/spec.md) - Ticket purchase flow

---

*Generated by /speckit.retro --all*  
*Version 1.0.0*

---

## [detroitdubcollective] DDC-3-artists-management

# DDC-3: Artists Management

**Status:** ✅ Implemented (Retroactive Documentation)  
**Jira:** [DDC-3](https://eriksensolutions.atlassian.net/browse/DDC-3)  
**Created:** 2026-02-10

---

## Overview

The Artists Management feature provides comprehensive functionality for displaying, browsing, and managing artist profiles within the Detroit Dub Collective platform. The feature enables:

- **Public Artist Directory**: A responsive grid display of all collective artists with images, bios, and track counts
- **Artist Detail Pages**: Individual artist pages showing bio, profile image, music catalog, and merchandise
- **Admin CRUD Operations**: Full create, read, update, and delete capabilities for artist profiles in the admin dashboard
- **User-Artist Linking**: Association between user accounts and artist profiles for dashboard access
- **Artist FAQ Page**: Informational page explaining collective membership, payouts, and artist benefits

---

## User Stories

### US-1: Browse Artist Directory
**As a** visitor  
**I want to** browse all artists in the collective  
**So that** I can discover new music and learn about the artists

**Acceptance Criteria:**
- [x] Artists are displayed in a responsive grid (1 column mobile, 2 tablet, 3 desktop)
- [x] Each artist card shows image, name, bio preview, and track count
- [x] Loading state shows spinner while fetching artists
- [x] Empty state shows "No artists available yet" message
- [x] Error state displays error message if fetch fails
- [x] Clicking artist card navigates to artist detail page

### US-2: View Artist Profile
**As a** visitor  
**I want to** view an artist's full profile  
**So that** I can learn more about them and explore their catalog

**Acceptance Criteria:**
- [x] Artist profile shows name, bio, and image
- [x] Music section displays all tracks by the artist
- [x] Merchandise section displays all merch by the artist
- [x] Track count and merch count stats are displayed
- [x] Back navigation returns to artists directory
- [x] Non-existent artist redirects to artists directory
- [x] Loading state shown while fetching data

### US-3: Create Artist Profile (Admin)
**As an** admin  
**I want to** create new artist profiles  
**So that** new collective members appear on the platform

**Acceptance Criteria:**
- [x] Add Artist modal accessible from admin dashboard
- [x] Form requires artist name and URL-friendly slug
- [x] Bio field is optional
- [x] Image upload with validation (type, size)
- [x] Image cropping interface for uploaded images
- [x] Optional user account association via search
- [x] Slug auto-generates from name
- [x] Duplicate slug validation prevents conflicts
- [x] Success toast on creation
- [x] Artist list auto-refreshes after creation

### US-4: Edit Artist Profile (Admin)
**As an** admin  
**I want to** edit existing artist profiles  
**So that** I can update artist information and images

**Acceptance Criteria:**
- [x] Edit modal pre-populates with existing data
- [x] All fields (name, slug, bio, image) are editable
- [x] Image can be replaced or removed
- [x] Old image is deleted when replaced
- [x] User association can be changed
- [x] Success toast on update
- [x] Artist list auto-refreshes after update

### US-5: Delete Artist Profile (Admin)
**As an** admin  
**I want to** delete artist profiles  
**So that** I can remove artists who leave the collective

**Acceptance Criteria:**
- [x] Delete requires two-step confirmation
- [x] Second step requires typing artist name exactly
- [x] Associated image is deleted from storage
- [x] Success toast on deletion
- [x] Artist list auto-refreshes after deletion
- [x] Delete prevented while operation in progress

### US-6: View Artist FAQ
**As a** prospective artist  
**I want to** read the Artist FAQ  
**So that** I understand how the collective works

**Acceptance Criteria:**
- [x] FAQ page accessible at `/artist-faq` route
- [x] Page explains ownership, payouts, merch, events
- [x] Page explains non-exclusive membership
- [x] Page explains governance and transparency

---

## Functional Requirements

| Req ID | Requirement | Implementation | File Reference |
|--------|-------------|----------------|----------------|
| FR-01 | Display artists in responsive grid | ArtistGrid component with Tailwind responsive classes | [src/components/organisms/ArtistGrid.tsx](src/components/organisms/ArtistGrid.tsx#L14-L25) |
| FR-02 | Show artist card with image, name, bio, stats | ArtistCard component with Image atom | [src/components/molecules/ArtistCard.tsx](src/components/molecules/ArtistCard.tsx#L14-L88) |
| FR-03 | Fetch all artists from Firestore | getArtists() function with collection query | [src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts#L299-L318) |
| FR-04 | Fetch single artist by ID | getArtist() function with doc reference | [src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts#L323-L349) |
| FR-05 | Get artist by user_id reverse lookup | getArtistByUserId() query with where clause | [src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts#L351-L389) |
| FR-06 | Create artist with slug as document ID | createArtist() with setDoc and validation | [src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts#L391-L423) |
| FR-07 | Update artist partial data | updateArtist() with updateDoc | [src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts#L426-L445) |
| FR-08 | Delete artist and cleanup image | deleteArtist() with deleteDoc and deleteImage | [src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts#L448-L480) |
| FR-09 | React Query hooks for data fetching | useArtists() and useArtist() with staleTime config | [src/hooks/useFirestore.ts](src/hooks/useFirestore.ts#L302-L324) |
| FR-10 | Display artist catalog items | useCatalogItemsByArtist() hook filtering by artist_id | [src/pages/ArtistDetail.tsx](src/pages/ArtistDetail.tsx#L9-L10) |
| FR-11 | Image upload with cropping | AddArtistModal/EditArtistModal with ImageCrop component | [src/components/molecules/AddArtistModal.tsx](src/components/molecules/AddArtistModal.tsx#L130-L159) |
| FR-12 | User search with debounce | searchUsers() with 300ms debounce timeout | [src/components/molecules/AddArtistModal.tsx](src/components/molecules/AddArtistModal.tsx#L57-L80) |
| FR-13 | Auto-generate slug from name | useEffect watching name with regex transformation | [src/components/molecules/AddArtistModal.tsx](src/components/molecules/AddArtistModal.tsx#L45-L54) |
| FR-14 | Two-step delete confirmation | confirmStep state with name matching verification | [src/components/organisms/AdminContent.tsx](src/components/organisms/AdminContent.tsx#L76-L107) |
| FR-15 | Query cache invalidation on mutations | queryClient.invalidateQueries with queryKeys | [src/components/molecules/AddArtistModal.tsx](src/components/molecules/AddArtistModal.tsx#L213) |

---

## Data Model

### Artist Interface

```typescript
// Source: src/types/index.ts (lines 15-24)

/**
 * Artist document from Firestore
 * Represents an artist profile separate from user accounts
 */
export interface Artist {
  id: string
  slug: string // URL-friendly identifier, used as document ID
  name: string
  bio?: string
  image_url?: string
  image_filename?: string // Original filename of the uploaded image
  user_id?: string // Optional link to user account
}
```

### Firestore Collection Structure

```
artists/
  └── {slug}  (document ID = slug)
      ├── name: string (required)
      ├── slug: string (required, matches doc ID)
      ├── bio: string (optional)
      ├── image_url: string (optional, Firebase Storage URL)
      ├── image_filename: string (optional, for deletion reference)
      └── user_id: string (optional, links to users/{uid})
```

### Storage Structure

```
artists/
  └── {uuid}_{filename}.jpg  (uploaded artist images)
```

---

## Edge Cases & Error Handling

| Scenario | Behavior | Implementation |
|----------|----------|----------------|
| No artists in database | Shows "No artists available yet" message | [src/pages/Artists.tsx](src/pages/Artists.tsx#L30-L32) |
| Artist not found (invalid ID) | Redirects to /artists with Navigate component | [src/pages/ArtistDetail.tsx](src/pages/ArtistDetail.tsx#L21-L23) |
| Artist has no image | Shows initials fallback (first 2 chars of name) | [src/components/molecules/ArtistCard.tsx](src/components/molecules/ArtistCard.tsx#L45-L52) |
| Artist has no tracks/merch | Shows "No items available" message | [src/pages/ArtistDetail.tsx](src/pages/ArtistDetail.tsx#L120-L125) |
| Duplicate slug on create | Throws "An artist with this slug already exists" | [src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts#L401-L405) |
| Image upload fails | Shows error toast, prevents form submission | [src/components/molecules/AddArtistModal.tsx](src/components/molecules/AddArtistModal.tsx#L193-L202) |
| Invalid image file type/size | Shows validation error toast | [src/components/molecules/AddArtistModal.tsx](src/components/molecules/AddArtistModal.tsx#L115-L123) |
| Delete confirmation name mismatch | Shows "Artist name does not match" toast | [src/components/organisms/AdminContent.tsx](src/components/organisms/AdminContent.tsx#L90-L93) |
| Network error fetching artists | Shows error message with error.message | [src/pages/Artists.tsx](src/pages/Artists.tsx#L18-L24) |
| Image deletion fails on artist delete | Logs warning, continues (document already deleted) | [src/lib/firebase/firestore.ts](src/lib/firebase/firestore.ts#L470-L476) |

---

## Integration Points

| System | Integration | Description |
|--------|-------------|-------------|
| Firebase Firestore | Collection: `artists` | Stores all artist profile documents |
| Firebase Storage | Folder: `artists/` | Stores artist profile images |
| React Query | Cache keys: `['artists']`, `['artists', id]` | Client-side caching with 5-minute staleTime |
| User Accounts | Field: `user_id` on Artist, `artist_id` on User | Bidirectional link for artist dashboard access |
| Catalog Items | Field: `artist_id`, `artist_ids[]` on CatalogItem | Links tracks/merch to artists |
| Events | Field: `artist_ids[]` on Event | Links events to performing artists |
| Admin Dashboard | AdminContent organism | CRUD interface for artists (admin role only) |
| Toast System | useToastStore | Success/error notifications |

---

## File Structure

```
src/
├── pages/
│   ├── Artists.tsx              # Artist directory page
│   ├── ArtistDetail.tsx         # Individual artist profile page
│   └── ArtistFAQ.tsx            # Artist FAQ informational page
├── components/
│   ├── molecules/
│   │   ├── ArtistCard.tsx       # Artist card for grid display
│   │   ├── AddArtistModal.tsx   # Create artist form modal
│   │   └── EditArtistModal.tsx  # Edit artist form modal
│   └── organisms/
│       ├── ArtistGrid.tsx       # Responsive artist grid layout
│       └── AdminContent.tsx     # Admin CRUD interface (includes artists)
├── hooks/
│   └── useFirestore.ts          # useArtists, useArtist hooks
├── lib/
│   └── firebase/
│       ├── firestore.ts         # CRUD functions: getArtists, createArtist, etc.
│       └── storage.ts           # uploadImage, deleteImage functions
├── types/
│   └── index.ts                 # Artist interface definition
└── stores/
    └── useToastStore.ts         # Toast notification state
```

---

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/artists` | Artists.tsx | Artist directory with grid |
| `/artists/:artistId` | ArtistDetail.tsx | Individual artist profile |
| `/artist-faq` | ArtistFAQ.tsx | Artist FAQ page |
| `/admin` | AdminDashboard.tsx → AdminContent | Admin CRUD (artists tab) |

---

## Related Specifications

- [DDC-2: Music Player](../DDC-2-music-player/spec.md) - Artists linked to tracks
- [DDC-4: Events Management](../DDC-4-events-management/spec.md) - Artists linked to events
- [DDC-6: Admin Dashboard](../DDC-6-admin-dashboard/spec.md) - Artist CRUD interface

---

*Generated by `/speckit.retro --all`*  
*Version 1.0.0*

---

## [detroitdubcollective] DDC-2-music-player

# Music Player - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [DDC-2](https://eriksensolutions.atlassian.net/browse/DDC-2)  
**Created**: 2026-02-10  

---

## Overview

The Music Player provides audio playback functionality for the Detroit Dub Collective platform, allowing users to browse, stream, and queue music from the collective's catalog. The player uses the HTML5 Audio API via a custom React hook, with state management handled by Zustand.

---

## User Stories

### User Story 1 - Play Music (Priority: P1)

**As a** visitor or member,  
**I want to** play tracks from the music catalog,  
**So that** I can listen to Detroit Dub Collective artists.

**Acceptance Criteria** (Verified):
- [x] User can click on a track to start playback
- [x] Play/pause button toggles audio playback
- [x] Progress bar shows current playback position
- [x] Track title, artist, and artwork are displayed
- [x] Playback continues across page navigation

**Implementation**: [`src/components/organisms/MusicPlayer.tsx`](../../src/components/organisms/MusicPlayer.tsx)

---

### User Story 2 - Playback Controls (Priority: P1)

**As a** listener,  
**I want to** control audio playback (pause, skip, seek, volume),  
**So that** I have full control over my listening experience.

**Acceptance Criteria** (Verified):
- [x] Play/pause toggle works correctly
- [x] Skip to next track (from queue or random)
- [x] Skip to previous track (from history)
- [x] Click/drag on progress bar to seek
- [x] Keyboard navigation for progress (arrow keys)
- [x] Volume slider with mute toggle
- [x] Time display shows current/total duration

**Implementation**: [`src/hooks/useAudio.ts`](../../src/hooks/useAudio.ts)

---

### User Story 3 - Queue Management (Priority: P2)

**As a** listener,  
**I want to** manage a playback queue,  
**So that** I can control what plays next.

**Acceptance Criteria** (Verified):
- [x] Add tracks to queue
- [x] View current queue via modal
- [x] Remove tracks from queue
- [x] Reorder queue items via drag-and-drop
- [x] Clear entire queue
- [x] Auto-play random track when queue is empty

**Implementation**: [`src/stores/usePlayerStore.ts`](../../src/stores/usePlayerStore.ts)

---

### User Story 4 - Browse Music (Priority: P1)

**As a** visitor,  
**I want to** browse the music catalog with filtering options,  
**So that** I can discover tracks that interest me.

**Acceptance Criteria** (Verified):
- [x] Grid display of available tracks/releases
- [x] Filter by album type (single, EP, album, mix)
- [x] Filter by artist
- [x] Option to show/hide unreleased tracks
- [x] Click to navigate to track detail page

**Implementation**: [`src/pages/Music.tsx`](../../src/pages/Music.tsx)

---

### User Story 5 - Track Detail (Priority: P2)

**As a** listener,  
**I want to** view detailed track/release information,  
**So that** I can learn more about the music and artists.

**Acceptance Criteria** (Verified):
- [x] Display track artwork, title, and artist(s)
- [x] Show release date and duration
- [x] Track list for multi-track releases (EP/album)
- [x] Play individual tracks from the list
- [x] Add to queue functionality
- [x] Purchase/add to cart option
- [x] Countdown timer for scheduled releases

**Implementation**: [`src/pages/TrackDetail.tsx`](../../src/pages/TrackDetail.tsx)

---

### User Story 6 - Favorites (Priority: P3)

**As a** logged-in user,  
**I want to** mark tracks as favorites,  
**So that** I can easily find music I like.

**Acceptance Criteria** (Verified):
- [x] Heart icon to toggle favorite status
- [x] Favorite state persists in user profile
- [x] Analytics tracked for favorites

**Implementation**: [`src/components/organisms/MusicPlayer.tsx:L107-L120`](../../src/components/organisms/MusicPlayer.tsx#L107-L120)

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Audio playback via HTML5 Audio API | ✅ | [`src/hooks/useAudio.ts:L54-L60`](../../src/hooks/useAudio.ts#L54-L60) |
| FR-002 | Player state synchronized via Zustand | ✅ | [`src/stores/usePlayerStore.ts`](../../src/stores/usePlayerStore.ts) |
| FR-003 | Time updates via requestAnimationFrame | ✅ | [`src/hooks/useAudio.ts:L28-L50`](../../src/hooks/useAudio.ts#L28-L50) |
| FR-004 | Queue management with add/remove/reorder | ✅ | [`src/stores/usePlayerStore.ts:L73-L84`](../../src/stores/usePlayerStore.ts#L73-L84) |
| FR-005 | Playback history for previous button | ✅ | [`src/stores/usePlayerStore.ts:L51-L66`](../../src/stores/usePlayerStore.ts#L51-L66) |
| FR-006 | Random track selection (no repeats) | ✅ | [`src/stores/usePlayerStore.ts:L86-L110`](../../src/stores/usePlayerStore.ts#L86-L110) |
| FR-007 | Volume control with mute toggle | ✅ | [`src/stores/usePlayerStore.ts`](../../src/stores/usePlayerStore.ts) |
| FR-008 | Track analytics logging | ✅ | [`src/hooks/useAudio.ts:L84-L94`](../../src/hooks/useAudio.ts#L84-L94) |

---

## Data Model

### CatalogItem (Track Type)

```typescript
interface CatalogItem {
  id: string
  slug?: string
  type: 'track'
  title: string
  description?: string
  price_usd: number
  price_points: number
  artist_id?: string
  artist_ids?: string[]
  artist_name?: string
  artist_names?: string[]
  image_url?: string
  audio_url?: string // Legacy single track
  audio_urls?: string[] // Multi-track releases
  audio_filenames?: string[]
  audio_preview_url?: string
  album_type?: 'single' | 'EP' | 'album' | 'mix'
  release_date?: number
  duration?: number
  visibility?: 'public' | 'private' | 'scheduled'
  scheduled_publish_date?: number
}
```

**Location**: [`src/types/index.ts:L56-L100`](../../src/types/index.ts#L56-L100)

### PlayerState

```typescript
interface PlayerState {
  isPlaying: boolean
  currentTrack: CatalogItem | null
  volume: number // 0-1
  isMuted: boolean
  queue: CatalogItem[]
  history: CatalogItem[]
  sessionHistory: Set<string>
  allTracks: CatalogItem[]
  currentTime: number
  duration: number
  // Actions omitted for brevity
}
```

**Location**: [`src/stores/usePlayerStore.ts:L4-L33`](../../src/stores/usePlayerStore.ts#L4-L33)

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Audio load error | Skip to next track | [`src/hooks/useAudio.ts:L77-L81`](../../src/hooks/useAudio.ts#L77-L81) |
| Track end | Auto-play next from queue or random | [`src/hooks/useAudio.ts:L72-L76`](../../src/hooks/useAudio.ts#L72-L76) |
| Empty queue | Play random unplayed track | [`src/stores/usePlayerStore.ts:L112-L150`](../../src/stores/usePlayerStore.ts#L112-L150) |
| All tracks played | Reset session history and continue | [`src/stores/usePlayerStore.ts:L99-L107`](../../src/stores/usePlayerStore.ts#L99-L107) |
| No track selected | Player component not rendered | [`src/components/organisms/MusicPlayer.tsx:L122-L124`](../../src/components/organisms/MusicPlayer.tsx#L122-L124) |
| Autoplay blocked | Wait for user interaction | Browser policy handling |
| Scheduled track | Show countdown, block full playback | [`src/pages/TrackDetail.tsx:L82-L115`](../../src/pages/TrackDetail.tsx#L82-L115) |

---

## Integration Points

| System | Type | Purpose |
|--------|------|---------|
| HTML5 Audio API | Browser API | Audio playback |
| Zustand | State Management | Player state synchronization |
| Firebase Firestore | Database | Track metadata and catalog |
| TanStack Query | Data Fetching | Catalog data caching |
| Firebase Analytics | Tracking | Play/favorite events |

---

## File Structure

```
src/
├── pages/
│   ├── Music.tsx           # Music catalog listing
│   └── TrackDetail.tsx     # Individual track/release page
├── hooks/
│   ├── useAudio.ts         # HTML5 Audio wrapper hook
│   └── useFirestore.ts     # Catalog data fetching
├── stores/
│   └── usePlayerStore.ts   # Zustand player state
├── components/
│   ├── molecules/
│   │   ├── TrackListItem.tsx   # Track row in lists
│   │   └── QueueModal.tsx      # Queue management modal
│   └── organisms/
│       └── MusicPlayer.tsx     # Fixed player bar
└── types/
    └── index.ts            # CatalogItem type
```

---

## Analytics Events

| Event | Trigger | Implementation |
|-------|---------|----------------|
| `track_play` | Track playback starts | [`src/hooks/useAudio.ts:L87-L93`](../../src/hooks/useAudio.ts#L87-L93) |
| `track_favorite` | Track favorited | [`src/components/organisms/MusicPlayer.tsx:L107-L120`](../../src/components/organisms/MusicPlayer.tsx#L107-L120) |

---

## UI/UX Details

- **Player Position**: Fixed to bottom of viewport
- **Glassmorphism**: `backdrop-blur-xl bg-dub-black/25`
- **Desktop Layout**: Track info (left), controls (center), queue/volume (right)
- **Mobile Layout**: Compact with expandable controls
- **Progress Bar**: Clickable with keyboard navigation (arrow keys ±5s)

---

**Generated by**: `/speckit.retro --all`  
**Version**: 1.0.0

---

## [detroitdubcollective] DDC-1-authentication

# Authentication System - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [DDC-1](https://eriksensolutions.atlassian.net/browse/DDC-1)  
**Created**: 2026-02-10  

---

## Overview

The Authentication System provides user account management for the Detroit Dub Collective platform using Firebase Authentication as the identity provider and Zustand for client-side state management. Users can create accounts, sign in with email/password, reset passwords, and manage their profiles.

---

## User Stories

### User Story 1 - User Registration (Priority: P1)

**As a** visitor,  
**I want to** create an account with my email and password,  
**So that** I can access member-only features and track my purchases.

**Acceptance Criteria** (Verified):
- [x] User can enter display name (optional), email, and password
- [x] Password confirmation is required and validated
- [x] Minimum password length of 6 characters is enforced
- [x] User-friendly error messages are displayed for common issues
- [x] User is redirected to home page after successful registration

**Implementation**: [`src/pages/SignUp.tsx`](../../src/pages/SignUp.tsx)

---

### User Story 2 - User Login (Priority: P1)

**As a** registered user,  
**I want to** sign in with my email and password,  
**So that** I can access my account and personalized features.

**Acceptance Criteria** (Verified):
- [x] User can enter email and password to sign in
- [x] Loading state is shown during authentication
- [x] User-friendly error messages for invalid credentials
- [x] User is redirected to originally requested page after login
- [x] Login state persists across page refreshes

**Implementation**: [`src/pages/Login.tsx`](../../src/pages/Login.tsx)

---

### User Story 3 - Password Reset (Priority: P2)

**As a** user who forgot their password,  
**I want to** request a password reset email,  
**So that** I can regain access to my account.

**Acceptance Criteria** (Verified):
- [x] Toggle between login and password reset modes
- [x] Password reset email is sent via Firebase
- [x] Confirmation message is displayed after sending

**Implementation**: [`src/pages/Login.tsx:L30-L45`](../../src/pages/Login.tsx#L30-L45)

---

### User Story 4 - Profile Management (Priority: P2)

**As a** logged-in user,  
**I want to** view and manage my profile information,  
**So that** I can see my account details, inventory, and order history.

**Acceptance Criteria** (Verified):
- [x] Profile page shows user avatar, name, and email
- [x] Tabbed interface for overview, inventory, transactions, orders, addresses
- [x] DDC balance is displayed prominently
- [x] Deep-linking to specific tabs via URL parameter

**Implementation**: [`src/pages/Profile.tsx`](../../src/pages/Profile.tsx)

---

### User Story 5 - Protected Routes (Priority: P1)

**As a** site administrator,  
**I want to** protect certain routes based on authentication and user roles,  
**So that** only authorized users can access sensitive areas.

**Acceptance Criteria** (Verified):
- [x] Unauthenticated users are redirected to login page
- [x] Original URL is preserved and restored after login
- [x] Role-based access control (admin, artist, user roles)
- [x] Unauthorized users are redirected to an unauthorized page
- [x] Loading state is shown while checking authentication

**Implementation**: [`src/components/organisms/RequireAuth.tsx`](../../src/components/organisms/RequireAuth.tsx)

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Users can create accounts with email/password | ✅ | [`src/lib/firebase/auth.ts:L24-L50`](../../src/lib/firebase/auth.ts#L24-L50) |
| FR-002 | Users can sign in with email/password | ✅ | [`src/lib/firebase/auth.ts:L52-L98`](../../src/lib/firebase/auth.ts#L52-L98) |
| FR-003 | Users can request password reset | ✅ | [`src/lib/firebase/auth.ts`](../../src/lib/firebase/auth.ts) |
| FR-004 | Auth state persists across sessions | ✅ | [`src/stores/useAuthStore.ts:L45-L80`](../../src/stores/useAuthStore.ts#L45-L80) |
| FR-005 | User document is synced from Firestore | ✅ | [`src/stores/useAuthStore.ts:L100-L130`](../../src/stores/useAuthStore.ts#L100-L130) |
| FR-006 | Routes can require authentication | ✅ | [`src/components/organisms/RequireAuth.tsx`](../../src/components/organisms/RequireAuth.tsx) |
| FR-007 | Routes can require specific roles | ✅ | [`src/components/organisms/RequireAuth.tsx:L31-L33`](../../src/components/organisms/RequireAuth.tsx#L31-L33) |

---

## Data Model

### User Type

```typescript
interface User {
  uid: string
  email: string
  role: 'admin' | 'artist' | 'user'
  ddc_balance: number
  inventory: Map<string, number | { timestamp: number; quantity: number; size?: string }>
  tickets: Map<string, TicketData>
  favorites?: Map<string, number>
  stripe_cust_id?: string
  avatar_url?: string
  display_name?: string
  artist_id?: string
  saved_addresses?: ShippingAddress[]
}
```

**Location**: [`src/types/index.ts:L30-L50`](../../src/types/index.ts#L30-L50)

### Auth State

```typescript
interface AuthState {
  firebaseUser: FirebaseUser | null
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  userUnsubscribe: Unsubscribe | null
  
  // Actions
  initialize: () => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  setError: (error: string | null) => void
}
```

**Location**: [`src/stores/useAuthStore.ts:L8-L23`](../../src/stores/useAuthStore.ts#L8-L23)

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Email already in use | Friendly error message displayed | [`src/lib/firebase/auth.ts:L37-L38`](../../src/lib/firebase/auth.ts#L37-L38) |
| Invalid email format | Validation error shown | [`src/lib/firebase/auth.ts:L39-L40`](../../src/lib/firebase/auth.ts#L39-L40) |
| Weak password | Prompt for stronger password | [`src/lib/firebase/auth.ts:L41-L42`](../../src/lib/firebase/auth.ts#L41-L42) |
| Network failure | Network error message shown | [`src/lib/firebase/auth.ts:L45-L46`](../../src/lib/firebase/auth.ts#L45-L46) |
| User not found on login | Suggest creating account | [`src/lib/firebase/auth.ts:L91`](../../src/lib/firebase/auth.ts#L91) |
| Wrong password | Invalid credentials message | Firebase Auth built-in |
| Auth timeout | 3s timeout with graceful fallback | [`src/stores/useAuthStore.ts:L65-L75`](../../src/stores/useAuthStore.ts#L65-L75) |
| Password mismatch on signup | Client-side validation error | [`src/pages/SignUp.tsx:L22-L26`](../../src/pages/SignUp.tsx#L22-L26) |

---

## Integration Points

| System | Type | Purpose |
|--------|------|---------|
| Firebase Auth | Identity Provider | User authentication and session management |
| Firestore | Database | User profile data persistence |
| Zustand | State Management | Client-side auth state synchronization |
| React Router | Navigation | Protected routes and redirects |

---

## File Structure

```
src/
├── pages/
│   ├── Login.tsx           # Login page with password reset
│   ├── SignUp.tsx          # User registration page
│   ├── Profile.tsx         # User profile management
│   └── Unauthorized.tsx    # Access denied page
├── stores/
│   └── useAuthStore.ts     # Zustand auth state store
├── components/
│   ├── atoms/
│   │   └── UserAvatar.tsx  # User avatar display
│   └── organisms/
│       └── RequireAuth.tsx # Protected route wrapper
├── lib/
│   └── firebase/
│       └── auth.ts         # Firebase Auth service functions
└── types/
    └── index.ts            # User and auth type definitions
```

---

## Analytics Events

| Event | Trigger | Implementation |
|-------|---------|----------------|
| `login` | Successful login | [`src/pages/Login.tsx:L45`](../../src/pages/Login.tsx#L45) |
| `sign_up` | Successful registration | [`src/pages/SignUp.tsx:L35`](../../src/pages/SignUp.tsx#L35) |

---

## Security Considerations

- Passwords are never stored client-side; Firebase Auth handles all credential management
- Session tokens are managed by Firebase Auth SDK
- Role-based access control is enforced client-side via RequireAuth component
- User documents in Firestore are protected by Firestore Security Rules
- Password requirements: minimum 6 characters (Firebase default)

---

**Generated by**: `/speckit.retro --all`  
**Version**: 1.0.0

---
