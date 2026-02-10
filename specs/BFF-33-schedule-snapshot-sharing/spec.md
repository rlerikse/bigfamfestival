# Feature Specification: Schedule Snapshot Social Sharing

**Jira**: [BFF-33](https://eriksensolutions.atlassian.net/browse/BFF-33)  
**Feature Branch**: `BFF-33-schedule-snapshot-sharing`  
**Created**: 2026-02-10  
**Status**: Draft  
**Epic**: BFF-21 (Schedule Snapshot Sharing)

---

## Overview

Generate shareable images of personal festival schedule for social media sharing.

### Current State
- Personal schedule viewable in-app only
- No sharing capability

### Target State
- Generate branded schedule snapshot as image
- Share to social media platforms
- Option for full festival or single day

---

## Constitution Compliance Checklist

- [ ] **Security**: User schedule data only visible with their consent
- [ ] **Branding**: Festival branding included in generated images
- [ ] **Testing**: Image generation and share flow tested on iOS/Android
- [ ] **Documentation**: Share template specifications documented

---

## User Scenarios & Testing

### User Story 1 - Generate Schedule Snapshot (Priority: P1)

As a user, I want to generate an image of my personal schedule, so that I can share it.

**Why this priority**: Core functionality for social sharing.

**Independent Test**: Create personal schedule, generate snapshot, verify image created.

**Acceptance Criteria** (from Jira):
1. **Given** user has personal schedule, **When** they tap share, **Then** schedule image is generated
2. **Given** image generated, **When** displayed, **Then** includes festival branding

---

### User Story 2 - Share to Social Media (Priority: P1)

As a user with schedule image, I want to share it to Instagram, Twitter, or Facebook, so that my friends know my plans.

**Why this priority**: Primary use case for the feature.

**Acceptance Criteria**:
1. **Given** schedule image generated, **When** user taps share, **Then** native share sheet opens
2. **Given** share sheet open, **When** user selects platform, **Then** image posts successfully

---

### User Story 3 - Select Day or Full Festival (Priority: P2)

As a user, I want to choose whether to share one day or my full schedule, so that I control what I share.

**Acceptance Criteria**:
1. **Given** share initiated, **When** options shown, **Then** can select specific day or full festival
2. **Given** day selected, **When** image generated, **Then** only that day's events included

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST generate schedule as shareable image
- **FR-002**: System MUST include festival branding in generated image
- **FR-003**: System MUST support sharing to Instagram, Twitter, Facebook
- **FR-004**: System MUST allow selection of specific day or full festival
- **FR-005**: System MUST use native OS share sheet

### Technical Notes (from Jira)

- Package: react-native-view-shot
- Share API: react-native-share
- Template component: ScheduleShareCard.tsx

---

## Success Criteria

- **SC-001**: Image generation completes within 3 seconds
- **SC-002**: Share success rate > 95%
- **SC-003**: Image displays correctly on all target platforms
