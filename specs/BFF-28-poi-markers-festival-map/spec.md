# Feature Specification: POI Markers on Festival Map

**Jira**: [BFF-28](https://eriksensolutions.atlassian.net/browse/BFF-28)  
**Feature Branch**: `BFF-28-poi-markers-festival-map`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-24 (Interactive Map & POI)

---

## Overview

Add Points of Interest (POI) markers on the interactive festival map for stages, vendors, amenities, and other key locations.

### Current State
- Basic map view without POI markers
- Users cannot easily locate amenities

### Target State
- Interactive POI markers for all key locations
- Category filtering for easy navigation
- Tap-to-view detail cards

---

## Constitution Compliance Checklist

- [ ] **Contract Compliance**: POI API endpoints documented in OpenAPI
- [ ] **Security**: POI data publicly accessible (no auth required for read)
- [ ] **Testing**: POI marker rendering and filtering tested
- [ ] **Documentation**: POI categories and icon specifications documented

---

## User Scenarios & Testing

### User Story 1 - View POI Markers (Priority: P1)

As a festival attendee, I want to see markers for stages, food vendors, and amenities on the map, so that I can navigate the grounds.

**Why this priority**: Core map functionality for wayfinding.

**Independent Test**: Load map, verify markers appear for all POI categories.

**Acceptance Criteria** (from Jira):
1. **Given** user opens map, **When** map loads, **Then** POI markers display for all categories
2. **Given** POI marker exists, **When** tapped, **Then** detail card shows POI info

---

### User Story 2 - Filter by Category (Priority: P2)

As a user looking for restrooms, I want to filter the map to show only restrooms, so that I can find one quickly.

**Why this priority**: Important UX improvement for specific needs.

**Acceptance Criteria**:
1. **Given** map with all POIs, **When** user selects "Restrooms" filter, **Then** only restroom markers show
2. **Given** filter applied, **When** user clears filter, **Then** all POIs return

---

### User Story 3 - Tap Marker Detail (Priority: P1)

As a user, I want to tap a marker to see details about that location, so that I know what's there.

**Why this priority**: Essential interaction pattern for maps.

**Acceptance Criteria**:
1. **Given** POI marker, **When** tapped, **Then** detail card displays name, category, description
2. **Given** detail card open, **When** tapped outside, **Then** card dismisses

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST display POI markers for: Stages, Food, Restrooms, Medical, Info, Water, ATM
- **FR-002**: System MUST support filtering POIs by category
- **FR-003**: System MUST show detail card when marker is tapped
- **FR-004**: System MUST use custom marker icons per category

### Key Entities

- **POI**: id, name, category, description, coordinates, iconType, isActive

### Technical Notes (from Jira)

- Create POI Firestore collection
- Backend API: GET /api/pois, GET /api/pois/:id
- Frontend: POI layer on Mapbox

---

## Success Criteria

- **SC-001**: All 7 POI categories have custom icons
- **SC-002**: Markers load within 2 seconds of map open
- **SC-003**: Filter toggle responds within 200ms
