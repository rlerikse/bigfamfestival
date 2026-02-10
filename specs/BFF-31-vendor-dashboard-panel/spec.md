# Feature Specification: Vendor Dashboard Panel

**Jira**: [BFF-31](https://eriksensolutions.atlassian.net/browse/BFF-31)  
**Feature Branch**: `BFF-31-vendor-dashboard-panel`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-15 (Role-Specific Panels)

---

## Overview

Specialized panel for vendors to manage their booth operations and view sales insights at the festival.

### Current State
- No vendor-specific features
- Vendors use same app interface as attendees

### Target State
- Dedicated vendor dashboard
- Booth info and hours management
- Menu/product display
- Basic analytics (if POS integration available)

---

## Constitution Compliance Checklist

- [ ] **Contract Compliance**: Vendor API endpoints documented in OpenAPI
- [ ] **Security**: Vendor role required for dashboard access
- [ ] **Testing**: Vendor dashboard screens and data flows tested
- [ ] **Documentation**: Vendor data model documented

---

## User Scenarios & Testing

### User Story 1 - View Vendor Dashboard (Priority: P1)

As a vendor, I want a dedicated dashboard, so that I can see all my booth-related information at a glance.

**Why this priority**: Entry point to all vendor features.

**Independent Test**: Log in as vendor role, verify dashboard displays booth info.

**Acceptance Criteria** (from Jira):
1. **Given** user has vendor role, **When** they open app, **Then** vendor dashboard is accessible
2. **Given** vendor dashboard, **When** viewed, **Then** shows booth info, hours, menu

---

### User Story 2 - Manage Hours of Operation (Priority: P2)

As a vendor, I want to update my booth hours, so that attendees know when I'm open.

**Acceptance Criteria**:
1. **Given** vendor on dashboard, **When** editing hours, **Then** can set open/close times per day
2. **Given** hours updated, **When** attendees view booth, **Then** new hours display

---

### User Story 3 - Display Menu/Products (Priority: P2)

As a vendor, I want to show my menu or product list, so that attendees know what I offer.

**Acceptance Criteria**:
1. **Given** vendor dashboard, **When** viewing menu section, **Then** product list displays
2. **Given** product list, **When** vendor adds item, **Then** item appears in list

---

### User Story 4 - View Announcements (Priority: P3)

As a vendor, I want to see festival announcements targeted at vendors, so that I stay informed.

**Acceptance Criteria**:
1. **Given** vendor dashboard, **When** announcement exists for vendors, **Then** it displays in feed

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide vendor dashboard for users with vendor role
- **FR-002**: System MUST display booth information (name, location, description)
- **FR-003**: System MUST allow vendors to manage hours of operation
- **FR-004**: System MUST display menu/product list
- **FR-005**: System MUST show vendor-targeted announcement feed
- **FR-006**: System SHOULD show basic sales analytics if POS integrated

### Key Entities

- **Vendor**: userId, boothName, boothLocation, description, hoursOfOperation
- **VendorProduct**: vendorId, name, description, price, category, isAvailable

### Technical Notes (from Jira)

- Vendor role in user model
- VendorDashboardScreen.tsx
- Backend: GET /api/vendor/profile, PUT /api/vendor/hours

---

## Success Criteria

- **SC-001**: Vendor dashboard loads within 2 seconds
- **SC-002**: Hours updates reflect within 30 seconds for attendees
- **SC-003**: 90% of vendors successfully update their hours on first attempt
