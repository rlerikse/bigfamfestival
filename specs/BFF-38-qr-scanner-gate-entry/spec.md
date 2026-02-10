# Feature Specification: QR Scanner for Gate Entry Staff

**Jira**: [BFF-38](https://eriksensolutions.atlassian.net/browse/BFF-38)  
**Feature Branch**: `BFF-38-qr-scanner-gate-entry`  
**Created**: 2026-02-10  
**Status**: On Hold  
**Epic**: BFF-17 (Ticketing & Entry)

---

## Overview

Staff-facing QR scanner for validating tickets at festival entry gates. Companion feature to BFF-27 (QR Code Ticket Display).

### Current State
- No in-app QR scanning for staff
- External scanning hardware required

### Target State
- Camera-based QR scanning in staff app
- Backend ticket validation
- Valid/invalid status display with details
- Audit trail for all scans
- Offline validation with sync

---

## Constitution Compliance Checklist

- [ ] **Security**: Staff role required for scanner access
- [ ] **Observability**: All scans logged for audit trail
- [ ] **Offline**: Validation works offline with later sync
- [ ] **Testing**: Scanning accuracy and validation flow tested

---

## User Scenarios & Testing

### User Story 1 - Scan Ticket QR Code (Priority: P1)

As gate staff, I want to scan attendee QR codes with my phone camera, so that I can validate tickets.

**Why this priority**: Core functionality for gate entry.

**Independent Test**: Display test QR, scan with staff app, verify validation result.

**Acceptance Criteria** (from Jira):
1. **Given** staff opens scanner, **When** camera active, **Then** QR codes are detected
2. **Given** QR detected, **When** scanned, **Then** ticket validated against backend

---

### User Story 2 - Display Validation Result (Priority: P1)

As gate staff, I want to see clear valid/invalid status with details, so that I know whether to admit the attendee.

**Acceptance Criteria**:
1. **Given** ticket scanned, **When** valid, **Then** green checkmark with ticket details shown
2. **Given** ticket scanned, **When** invalid, **Then** red X with reason shown

---

### User Story 3 - Audit Trail (Priority: P1)

As festival management, I want all scans logged, so that I have a record for security and analytics.

**Acceptance Criteria**:
1. **Given** ticket scanned, **When** logged, **Then** includes: timestamp, staff ID, ticket ID, result
2. **Given** audit log, **When** queried, **Then** all scans retrievable

---

### User Story 4 - Offline Validation (Priority: P2)

As gate staff without cell signal, I want to continue scanning, so that entry isn't blocked by connectivity.

**Acceptance Criteria**:
1. **Given** offline, **When** scanning, **Then** validation uses cached ticket data
2. **Given** connection restored, **When** syncing, **Then** offline scans uploaded

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide camera-based QR scanning
- **FR-002**: System MUST validate ticket against backend
- **FR-003**: System MUST show valid/invalid status with ticket details
- **FR-004**: System MUST log all scans for audit trail
- **FR-005**: System MUST support offline validation with sync
- **FR-006**: System MUST require staff role to access scanner

### Key Entities

- **ScanLog**: id, ticketId, staffId, timestamp, result, syncStatus

### Technical Notes (from Jira)

- Package: expo-camera or react-native-camera
- Backend: POST /api/tickets/validate
- Staff role required
- ScannerScreen.tsx

---

## Success Criteria

- **SC-001**: QR detection within 1 second
- **SC-002**: Validation response within 2 seconds (online)
- **SC-003**: 100% scan accuracy for valid QR codes
- **SC-004**: Offline cache supports 10,000+ tickets
