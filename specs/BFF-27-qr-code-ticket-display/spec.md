# Feature Specification: QR Code Ticket Display

**Jira**: [BFF-27](https://eriksensolutions.atlassian.net/browse/BFF-27)  
**Feature Branch**: `BFF-27-qr-code-ticket-display`  
**Created**: 2026-02-10  
**Status**: On Hold  
**Epic**: BFF-17 (Ticketing & Entry)

---

## Overview

Display QR code for user's ticket for entry gate scanning. This enables digital ticket presentation at festival entry points.

### Current State
- No ticket QR code display in app
- Users rely on external ticket provider PDFs

### Target State
- In-app QR code display on TicketScreen
- Offline-capable with local ticket storage
- Brightness boost for easier scanning

---

## Constitution Compliance Checklist

- [ ] **Security**: Ticket data securely generated and stored
- [ ] **Observability**: QR display events logged
- [ ] **Testing**: QR generation and scanning validated
- [ ] **Documentation**: Ticket data schema documented

---

## User Scenarios & Testing

### User Story 1 - Display Ticket QR Code (Priority: P1)

As a festival attendee, I want to view my ticket as a QR code in the app, so that I can scan in at entry gates.

**Why this priority**: Core functionality - users need to enter the festival.

**Independent Test**: Generate QR for test ticket, display on TicketScreen, scan with external scanner to verify data.

**Acceptance Criteria** (from Jira):
1. **Given** a user with valid ticket, **When** they open TicketScreen, **Then** QR code is generated from ticket data
2. **Given** QR code displayed, **When** scanned at gate, **Then** ticket validates successfully

---

### User Story 2 - Brightness Boost (Priority: P2)

As a user at the entry gate, I want the screen to brighten when showing my QR code, so that it scans reliably in various lighting.

**Why this priority**: Improves scanning reliability in outdoor conditions.

**Acceptance Criteria**:
1. **Given** QR code screen is shown, **When** displayed, **Then** screen brightness increases temporarily

---

### User Story 3 - Offline Ticket Access (Priority: P1)

As a user without cell signal at the venue, I want to access my ticket offline, so that I can still enter.

**Why this priority**: Festival venues often have poor connectivity.

**Acceptance Criteria**:
1. **Given** ticket was previously loaded, **When** user is offline, **Then** QR code still displays from local storage

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST generate QR code from ticket data (userId, ticketType, validDates, uniqueId)
- **FR-002**: System MUST link ticket to user's Firebase Auth UID
- **FR-003**: System MUST store ticket locally for offline access
- **FR-004**: System MUST increase screen brightness when QR is displayed

### Technical Notes (from Jira)

- Package: `react-native-qrcode-svg`
- Ticket data includes: userId, ticketType, validDates, uniqueId
- Link to user's Firebase Auth UID

---

## Success Criteria

- **SC-001**: QR code displays within 1 second of opening TicketScreen
- **SC-002**: 100% of valid tickets scan successfully at entry gates
- **SC-003**: Offline access works for tickets loaded within last 30 days
