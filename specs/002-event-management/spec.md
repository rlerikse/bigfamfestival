# Event Management System - Retroactive Specification

**Feature ID**: 002  
**Status**: ✅ Implemented (Retroactive Documentation)  
**Created**: 2026-01-14  
**Source Analysis**: `backend/src/events/`, `mobile/src/screens/ScheduleScreen.tsx`, `mobile/src/types/event.ts`

---

## Overview

Complete festival event management system with CRUD operations, filtering by stage/date, and real-time event data. Events are stored in Firestore and served via NestJS REST API. Mobile app displays events in a schedule format with stage and date filtering.

---

## User Stories

### User Story 1 - Browse Events (Priority: P0 - Implemented)

**As a** festival attendee,  
**I want to** browse all scheduled events,  
**So that** I can plan which performances to attend.

**Acceptance Criteria** (Verified in Implementation):
- [x] View all events sorted by date and time
- [x] Filter events by stage
- [x] Filter events by date
- [x] See event details including artist, time, and description

**Implementation Reference**: `backend/src/events/events.service.ts:L57-L86`

---

### User Story 2 - Create Events (Priority: P0 - Implemented)

**As an** admin,  
**I want to** create new events,  
**So that** I can populate the festival schedule.

**Acceptance Criteria** (Verified in Implementation):
- [x] Create event with name, stage, date, times, artists
- [x] Event saved to Firestore with timestamps
- [x] Validation via NestJS ValidationPipe

**Implementation Reference**: `backend/src/events/events.service.ts:L14-L23`

---

### User Story 3 - Update Events (Priority: P1 - Implemented)

**As an** admin,  
**I want to** update existing events,  
**So that** I can correct schedule changes.

**Acceptance Criteria** (Verified in Implementation):
- [x] Update event details (name, time, stage, etc.)
- [x] Partial updates supported
- [x] Updated timestamp tracked

**Implementation Reference**: `backend/src/events/events.service.ts:L130-L148`

---

## Functional Requirements

### Event CRUD

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Create new event | ✅ | `events.service.ts:L14-L23` |
| FR-002 | Get event by ID | ✅ | `events.service.ts:L28-L40` |
| FR-003 | Get all events with filters | ✅ | `events.service.ts:L57-L86` |
| FR-004 | Update event | ✅ | `events.service.ts:L130-L148` |
| FR-005 | Delete event | ✅ | `events.service.ts:L150-L166` |

### Filtering & Sorting

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-006 | Filter by stage | ✅ | `events.service.ts:L68-L73` |
| FR-007 | Filter by date | ✅ | `events.service.ts:L74-L79` |
| FR-008 | Compound filter (stage + date) | ✅ | `events.service.ts:L62-L67` |
| FR-009 | Sort by date and time | ✅ | `events.service.ts:L88-L105` |

---

## Data Model

### Event Interface

```typescript
// From backend/src/events/event.interface.ts
interface Event {
  id: string;
  name: string;
  stage: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  artists: string[]; // Array of artist IDs
  description?: string;
  imageUrl?: string;
  createdBy: string; // Admin user ID
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Mobile Event Type

```typescript
// From mobile/src/types/event.ts
interface Event {
  id: string;
  name: string;
  stage: string;
  genre?: string;
  genres?: string[]; // Populated from artists
  date: string;
  startTime: string;
  endTime: string;
  artists: string[];
  description?: string;
  imageUrl?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

**Firestore Collection**: `events`

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/events` | JWT (Admin) | Create event |
| GET | `/events` | Public | List events (with filters) |
| GET | `/events/:id` | Public | Get event by ID |
| PATCH | `/events/:id` | JWT (Admin) | Update event |
| DELETE | `/events/:id` | JWT (Admin) | Delete event |

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `stage` | string | Filter by stage name |
| `date` | string | Filter by date (YYYY-MM-DD) |

---

## Success Criteria

| ID | Criterion | Measurement | Status |
|----|-----------|-------------|--------|
| SC-001 | Events display in schedule | Mobile app renders | ✅ Met |
| SC-002 | Filtering works correctly | API returns filtered results | ✅ Met |
| SC-003 | Events sorted chronologically | Order verification | ✅ Met |
| SC-004 | CRUD operations functional | API tests pass | ✅ Met |

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Event not found | 404 NotFoundException | `events.service.ts:L36-L38` |
| Invalid date format | ValidationPipe rejection | DTO validation |
| Empty filter results | Return empty array | `events.service.ts:L57-L86` |

---

## Integration Points

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| Firestore | Document storage | Event persistence |
| Artists service | Reference lookup | Artist data for events |
| Schedule service | Event scheduling | User personal schedules |

---

## Key Files

- `backend/src/events/events.module.ts` - Module registration
- `backend/src/events/events.controller.ts` - HTTP endpoints
- `backend/src/events/events.service.ts` - Business logic
- `backend/src/events/event.interface.ts` - Type definitions
- `mobile/src/screens/ScheduleScreen.tsx` - Event display
- `mobile/src/types/event.ts` - Mobile types

---

## Change History

| Date | Version | Change | Reference |
|------|---------|--------|-----------|
| 2025 | 1.0.0 | Initial implementation | Backend + Mobile |
| 2026-01-14 | - | Retroactive specification created | This document |
