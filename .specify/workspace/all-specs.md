# Aggregated Specifications

> **Generated**: 2026-02-10T05:48:32Z
> **Source**: [es-spec-kit-context](https://github.com/rlerikse/es-spec-kit-context)

This file contains **11 specifications** from **1 repositories** from connected repositories.

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
