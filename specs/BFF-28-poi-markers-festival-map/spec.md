# Feature Specification: POI Markers on Festival Map

**Jira**: [BFF-28](https://eriksensolutions.atlassian.net/browse/BFF-28)  
**Feature Branch**: `BFF-28-poi-markers-festival-map`  
**Created**: 2026-02-10  
**Status**: ✅ Implemented (verified 2026-08-09 — was “Draft”)  
**Epic**: BFF-24 (Interactive Map & POI)  
**Verified**: 2026-08-09 — Jira link above is broken (space closed); this spec is the last point of reference.

> **⚠️ Verification note (2026-08-09):** Re-verified against the live codebase. **Actual status: ✅ Implemented.** `backend/src/map/map.service.ts` + `map.controller.ts` (`GET /map/pois`); `mobile/src/screens/MapScreen.tsx` renders `mapPOIs`. The category taxonomy was **widened** to 5 marker types (stage / food / beverage / shop / staff-medical) vs the 7 categories listed below. Original content preserved as-is.

> **⚠️ Drift note (2026-08-09, via `/blue.drift`):** Beyond the taxonomy widening noted above, the platform also gained **admin-uploadable per-POI custom marker images** (`markerAsset`), which SC-001 below ("7 categories have custom icons") does not cover — this is a per-POI capability, not per-category. See the new **Dynamic Per-POI Marker Assets** section below.

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

---

## Dynamic Per-POI Marker Assets _(added 2026-08-09 via `/blue.drift`)_

Added 2026-08 to let admins give an individual POI (e.g. the festival's front-gate/logo marker) a custom image, beyond the fixed per-category icon set in SC-001. Not present in the original 2026-02-10 spec text above.

### Behavior

- Each POI carries an optional `markerAsset`: a full HTTPS URL to a custom marker image. When set, the map renders that image instead of the category's default emoji/color icon.
- Falls back to the category emoji icon (`icon` field) when `markerAsset` is absent.
- Admins upload the marker image via the admin panel's POI manager; the mobile client and backend POI contract both carry `markerAsset` alongside `category`/`type`.

### Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-005 | POI contract supports an optional per-POI custom marker image URL | ✅ | `backend/src/map/interfaces/poi.interface.ts` (`markerAsset`) |
| FR-006 | Map renders `markerAsset` image when present, else falls back to category icon | ✅ | `mobile/src/screens/MapScreen.tsx` |
| FR-007 | Admin can upload/attach a marker image per POI | ✅ | `admin/src/components/POIManager.tsx` (image-upload UI) |

**Implementation**: `backend/src/map/interfaces/poi.interface.ts`, `mobile/src/screens/MapScreen.tsx`, `admin/src/components/POIManager.tsx`.
