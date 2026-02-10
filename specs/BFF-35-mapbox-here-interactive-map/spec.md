# Feature Specification: Mapbox/HERE SDK Interactive Map

**Jira**: [BFF-35](https://eriksensolutions.atlassian.net/browse/BFF-35)  
**Feature Branch**: `BFF-35-mapbox-here-interactive-map`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-24 (Interactive Map & POI)

---

## Overview

Integrate Mapbox/HERE SDK to replace static map image with an interactive, zoomable map of the festival grounds.

### Current State
- Static map image in MapScreen.tsx
- No pan/zoom capability
- No custom styling

### Target State
- Interactive map with Mapbox/HERE SDK
- Pan and zoom functionality
- Custom festival-themed map style
- Map bounded to festival venue

---

## Constitution Compliance Checklist

- [ ] **Security**: API keys for Mapbox/HERE secured
- [ ] **Performance**: Map tiles cached for offline use
- [ ] **Testing**: Map rendering tested on iOS and Android
- [ ] **Documentation**: Map style and bounds documented

---

## User Scenarios & Testing

### User Story 1 - View Interactive Map (Priority: P1)

As a festival attendee, I want an interactive map of the grounds, so that I can explore and orient myself.

**Why this priority**: Foundation for all map features.

**Independent Test**: Open MapScreen, verify map loads with pan/zoom capability.

**Acceptance Criteria** (from Jira):
1. **Given** user opens map, **When** map loads, **Then** interactive map of festival grounds displays
2. **Given** map displayed, **When** user zooms, **Then** map scales smoothly

---

### User Story 2 - Pan and Zoom (Priority: P1)

As a user, I want to pan around the map and zoom in/out, so that I can view different areas at different detail levels.

**Acceptance Criteria**:
1. **Given** map displayed, **When** user drags, **Then** map pans in that direction
2. **Given** map displayed, **When** user pinches, **Then** map zooms in/out

---

### User Story 3 - Festival Bounds (Priority: P2)

As a user, I want the map bounded to the festival venue, so that I don't accidentally navigate away from relevant areas.

**Acceptance Criteria**:
1. **Given** map displayed, **When** user pans too far, **Then** map snaps back to venue bounds
2. **Given** map zoomed out max, **When** displayed, **Then** entire venue visible

---

### User Story 4 - Custom Map Style (Priority: P2)

As a user, I want the map to match the festival theme, so that the experience feels cohesive.

**Acceptance Criteria**:
1. **Given** map displayed, **When** viewed, **Then** custom festival colors and styling applied

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST use Mapbox or HERE SDK for map rendering
- **FR-002**: System MUST support pan and zoom gestures
- **FR-003**: System MUST bound map to festival venue coordinates
- **FR-004**: System MUST apply custom map style matching festival theme
- **FR-005**: System MUST initialize SDK with API key from festival config

### Technical Notes (from Jira)

- Decision 7 selected Mapbox/HERE hybrid approach
- Package: `@rnmapbox/maps` or `react-native-here-explore`
- Replace current static image in MapScreen.tsx

---

## Success Criteria

- **SC-001**: Map loads within 3 seconds on LTE connection
- **SC-002**: Smooth 60fps pan/zoom performance
- **SC-003**: Map renders correctly offline after initial load
