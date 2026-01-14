# Personal Schedule System - Retroactive Specification

**Feature ID**: 003  
**Status**: ✅ Implemented (Retroactive Documentation)  
**Created**: 2026-01-14  
**Source Analysis**: `backend/src/schedule/`, `mobile/src/screens/MyScheduleScreen.tsx`, `mobile/src/services/scheduleService.ts`

---

## Overview

Personal schedule management allowing authenticated users to save events to their personal schedule. Implemented with Firestore subcollections per user and optimistic UI updates on mobile. Schedule items sync across devices via user ID.

---

## User Stories

### User Story 1 - Add Event to Schedule (Priority: P0 - Implemented)

**As an** authenticated user,  
**I want to** add events to my personal schedule,  
**So that** I can track which performances I plan to attend.

**Acceptance Criteria** (Verified in Implementation):
- [x] Authenticated users can add events to schedule
- [x] Guest users prompted to log in
- [x] Duplicate additions handled gracefully
- [x] Optimistic UI update on mobile

**Implementation Reference**: `backend/src/schedule/schedule.service.ts:L20-L60`

---

### User Story 2 - Remove Event from Schedule (Priority: P0 - Implemented)

**As a** user,  
**I want to** remove events from my schedule,  
**So that** I can adjust my plans.

**Acceptance Criteria** (Verified in Implementation):
- [x] Remove event from personal schedule
- [x] Immediate UI feedback
- [x] Revert on API failure

**Implementation Reference**: `backend/src/schedule/schedule.service.ts:L62-L82`

---

### User Story 3 - View My Schedule (Priority: P0 - Implemented)

**As a** user,  
**I want to** view all events in my schedule,  
**So that** I can see my personalized festival plan.

**Acceptance Criteria** (Verified in Implementation):
- [x] Display all scheduled events
- [x] Events sorted chronologically
- [x] Full event details shown

**Implementation Reference**: `backend/src/schedule/schedule.service.ts:L84-L111`

---

## Functional Requirements

### Schedule Management

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Add event to user schedule | ✅ | `schedule.service.ts:L20-L60` |
| FR-002 | Remove event from schedule | ✅ | `schedule.service.ts:L62-L82` |
| FR-003 | Get user's full schedule | ✅ | `schedule.service.ts:L84-L111` |
| FR-004 | Validate event exists before adding | ✅ | `schedule.service.ts:L28` |
| FR-005 | Handle duplicate additions | ✅ | `schedule.service.ts:L35-L48` |

### Mobile Client

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-006 | Toggle schedule state from event card | ✅ | `HomeScreen.tsx:L63-L82` |
| FR-007 | Optimistic UI updates | ✅ | `HomeScreen.tsx:L67-L71` |
| FR-008 | Revert on API failure | ✅ | `HomeScreen.tsx:L74-L79` |
| FR-009 | Require authentication for schedule | ✅ | `HomeScreen.tsx:L56-L62` |

---

## Data Model

### Schedule Item Interface

```typescript
// From backend/src/schedule/interfaces/schedule.interface.ts
interface ScheduleItem {
  id: string;
  userId: string;
  eventId: string;
  createdAt: Date;
}

interface CreateScheduleItemDto {
  event_id: string;
}

interface RemoveScheduleItemDto {
  event_id: string;
}
```

**Firestore Structure**:
```
schedules/
  {userId}/
    items/
      {eventId}/
        - userId: string
        - eventId: string
        - createdAt: timestamp
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/schedule/add` | JWT | Add event to schedule |
| POST | `/schedule/remove` | JWT | Remove event from schedule |
| GET | `/schedule` | JWT | Get user's schedule |

---

## Success Criteria

| ID | Criterion | Measurement | Status |
|----|-----------|-------------|--------|
| SC-001 | Users can add/remove events | Toggle works | ✅ Met |
| SC-002 | Schedule persists across sessions | Data in Firestore | ✅ Met |
| SC-003 | Schedule syncs across devices | Same user, different device | ✅ Met |
| SC-004 | Guest users cannot modify schedule | Login prompt shown | ✅ Met |

---

## Edge Cases & Error Handling

| Scenario | Handling | Location |
|----------|----------|----------|
| Event not found | NotFoundException | `schedule.service.ts:L28` |
| User not authenticated | 401 + Login prompt | `HomeScreen.tsx:L56-L62` |
| Duplicate add attempt | Return existing item | `schedule.service.ts:L35-L48` |
| Remove non-existent item | NotFoundException | `schedule.service.ts:L72-L76` |
| API failure on toggle | Revert optimistic update | `HomeScreen.tsx:L74-L79` |

---

## Integration Points

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| Events service | Event validation | Verify event exists |
| Auth context | User ID | Identify schedule owner |
| Notification service | Schedule notifications | Alert user before events |

---

## Key Files

- `backend/src/schedule/schedule.module.ts` - Module registration
- `backend/src/schedule/schedule.controller.ts` - HTTP endpoints
- `backend/src/schedule/schedule.service.ts` - Business logic
- `mobile/src/screens/MyScheduleScreen.tsx` - Schedule display
- `mobile/src/services/scheduleService.ts` - API calls
- `mobile/src/screens/HomeScreen.tsx` - Schedule toggle UI

---

## Change History

| Date | Version | Change | Reference |
|------|---------|--------|-----------|
| 2025 | 1.0.0 | Initial implementation | Backend + Mobile |
| 2026-01-14 | - | Retroactive specification created | This document |
