# Feature Specification: Staff/Volunteer Shift Management

**Jira**: [BFF-29](https://eriksensolutions.atlassian.net/browse/BFF-29)  
**Feature Branch**: `BFF-29-staff-volunteer-shift-management`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-15 (Role-Specific Panels)

---

## Overview

Allow volunteers and staff to view and check-in to assigned shifts. Managers can assign shifts and track attendance.

### Current State
- No shift management in app
- Staff coordination via external tools (spreadsheets, text messages)

### Target State
- In-app shift viewing for staff/volunteers
- Location-verified check-in/check-out
- Manager assignment and tracking

---

## Constitution Compliance Checklist

- [ ] **Contract Compliance**: Shift API endpoints documented in OpenAPI
- [ ] **Security**: Role-based access (staff, volunteer, manager roles)
- [ ] **Observability**: Check-in events logged with location
- [ ] **Testing**: Shift assignment and check-in flows tested

---

## User Scenarios & Testing

### User Story 1 - View Upcoming Shifts (Priority: P1)

As a volunteer, I want to see my upcoming shifts, so that I know when and where to report.

**Why this priority**: Basic shift visibility required before check-in.

**Independent Test**: Assign shift to test user, verify it appears in shift list.

**Acceptance Criteria** (from Jira):
1. **Given** user is a volunteer, **When** they open shifts, **Then** upcoming shifts display
2. **Given** shift exists, **When** viewed, **Then** shows date, time, location, role

---

### User Story 2 - Check-In to Shift (Priority: P1)

As a volunteer at my shift location, I want to check in, so that my attendance is recorded.

**Why this priority**: Core tracking functionality.

**Acceptance Criteria**:
1. **Given** shift start time approached, **When** user at location, **Then** check-in button enabled
2. **Given** user checks in, **When** location verified, **Then** attendance recorded

---

### User Story 3 - Check-Out from Shift (Priority: P2)

As a volunteer ending my shift, I want to check out, so that my hours are logged.

**Acceptance Criteria**:
1. **Given** user is checked in, **When** they check out, **Then** shift duration is logged

---

### User Story 4 - Manager Shift Assignment (Priority: P2)

As a shift manager, I want to assign volunteers to shifts, so that coverage is ensured.

**Acceptance Criteria**:
1. **Given** manager role, **When** viewing shift, **Then** can assign volunteers
2. **Given** volunteer assigned, **When** they view shifts, **Then** new shift appears

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST show upcoming shifts for staff/volunteers
- **FR-002**: System MUST verify location for check-in (within 100m of shift location)
- **FR-003**: System MUST record check-in and check-out timestamps
- **FR-004**: System MUST allow managers to assign shifts
- **FR-005**: System MUST show shift history

### Key Entities

- **Shift**: id, location, startTime, endTime, roleRequired, assignedUsers[]
- **ShiftCheckin**: shiftId, userId, checkinTime, checkoutTime, locationCoords

### Technical Notes (from Jira)

- Shifts Firestore collection
- Backend: GET /api/shifts, POST /api/shifts/checkin
- ShiftManagementScreen.tsx

---

## Success Criteria

- **SC-001**: Volunteers see shifts within 3 seconds of opening screen
- **SC-002**: Check-in location verification completes within 5 seconds
- **SC-003**: 95% of shift check-ins are within 5 minutes of shift start
