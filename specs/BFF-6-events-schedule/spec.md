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
