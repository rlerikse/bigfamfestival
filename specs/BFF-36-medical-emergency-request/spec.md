# Feature Specification: Medical Emergency Request System

**Jira**: [BFF-36](https://eriksensolutions.atlassian.net/browse/BFF-36)  
**Feature Branch**: `BFF-36-medical-emergency-request`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-15 (Role-Specific Panels)

---

## Overview

Allow attendees to request medical assistance through the app, with automatic location sharing and priority levels.

### Current State
- No in-app medical assistance request
- Attendees must find medical station or call staff

### Target State
- Emergency button on home screen
- Location sent with request automatically
- Priority levels (urgent/non-urgent)
- Status tracking for requestor
- Push notification to medical staff

---

## Constitution Compliance Checklist

- [ ] **Security**: Medical requests protected data, role-based access
- [ ] **Observability**: All medical requests logged with full audit trail
- [ ] **Reliability**: High availability required (critical feature)
- [ ] **Testing**: End-to-end request flow tested including push notifications

---

## User Scenarios & Testing

### User Story 1 - Request Medical Assistance (Priority: P1)

As a festival attendee experiencing a medical issue, I want to request help through the app, so that medical staff can find me.

**Why this priority**: Critical safety feature.

**Independent Test**: Submit test request, verify request appears in medical staff queue.

**Acceptance Criteria** (from Jira):
1. **Given** user on home screen, **When** they tap emergency button, **Then** medical request form opens
2. **Given** request submitted, **When** sent, **Then** medical staff notified via push

---

### User Story 2 - Automatic Location Sharing (Priority: P1)

As a user requesting medical help, I want my location sent automatically, so that staff can find me quickly.

**Acceptance Criteria**:
1. **Given** request submitted, **When** sent, **Then** current GPS coordinates included
2. **Given** location sent, **When** staff views request, **Then** location shows on their map

---

### User Story 3 - Priority Level Selection (Priority: P2)

As a user, I want to indicate if my situation is urgent or non-urgent, so that staff can prioritize appropriately.

**Acceptance Criteria**:
1. **Given** request form open, **When** selecting priority, **Then** can choose urgent or non-urgent
2. **Given** urgent selected, **When** submitted, **Then** request flagged as high priority

---

### User Story 4 - Status Tracking (Priority: P2)

As a user who requested help, I want to see the status of my request, so that I know help is coming.

**Acceptance Criteria**:
1. **Given** request submitted, **When** viewing status, **Then** shows: pending, en route, arrived
2. **Given** staff updates status, **When** viewed by user, **Then** new status displays

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide emergency button on home screen
- **FR-002**: System MUST send current GPS location with request
- **FR-003**: System MUST support priority levels: urgent, non-urgent
- **FR-004**: System MUST track request status
- **FR-005**: System MUST send push notification to medical staff
- **FR-006**: System MUST log all medical requests for audit trail

### Key Entities

- **MedicalRequest**: id, userId, location, priority, status, description, createdAt, assignedStaffId

### Technical Notes (from Jira)

- MedicalRequests Firestore collection
- Backend: POST /api/medical/request
- Push notification to medical staff
- MedicalRequestScreen.tsx

---

## Success Criteria

- **SC-001**: Medical staff notified within 10 seconds of request
- **SC-002**: Location accuracy within 10 meters
- **SC-003**: 99.9% uptime for medical request feature
