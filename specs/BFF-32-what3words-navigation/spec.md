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
