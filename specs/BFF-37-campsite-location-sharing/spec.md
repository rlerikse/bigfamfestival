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
