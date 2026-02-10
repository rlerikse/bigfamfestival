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
