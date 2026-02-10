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
