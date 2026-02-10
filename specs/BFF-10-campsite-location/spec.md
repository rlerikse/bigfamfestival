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
