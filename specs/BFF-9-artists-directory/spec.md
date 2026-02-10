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
