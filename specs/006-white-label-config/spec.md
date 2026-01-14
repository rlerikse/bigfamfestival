# White-Label Configuration System - Retroactive Specification

**Feature ID**: 006  
**Status**: ✅ Implemented (Retroactive Documentation)  
**Created**: 2026-01-14  
**Source Analysis**: `mobile/src/config/festival.config.ts`, `backend/src/config/festival.config.ts`, `WHITE_LABEL_GUIDE.md`

---

## Overview

Centralized configuration system enabling the festival app to be white-labeled for different festivals. Configuration loaded from environment variables, app.json, or defaults. Supports customizing festival name, dates, location, theme colors, feature flags, and Firebase settings.

---

## User Stories

### User Story 1 - Configure Festival Identity (Priority: P0 - Implemented)

**As a** festival organizer,  
**I want to** customize the app branding,  
**So that** the app reflects my festival's identity.

**Acceptance Criteria** (Verified in Implementation):
- [x] Festival name configurable
- [x] Custom theme colors (light/dark)
- [x] Festival dates and location
- [x] Bundle identifiers for app stores

**Implementation Reference**: `mobile/src/config/festival.config.ts:L83-L180`

---

### User Story 2 - Feature Toggles (Priority: P1 - Implemented)

**As a** festival organizer,  
**I want to** enable/disable features,  
**So that** I can customize the app capabilities.

**Acceptance Criteria** (Verified in Implementation):
- [x] Toggle map feature
- [x] Toggle notifications
- [x] Toggle schedule feature
- [x] Toggle campsites feature

**Implementation Reference**: `mobile/src/config/festival.config.ts:L76-L81`

---

### User Story 3 - Environment-Based Config (Priority: P1 - Implemented)

**As a** developer,  
**I want to** configure via environment variables,  
**So that** I can deploy different configurations without code changes.

**Acceptance Criteria** (Verified in Implementation):
- [x] Config priority: env vars > app.json > defaults
- [x] Firebase config from environment
- [x] API URL configurable per environment

**Implementation Reference**: `mobile/src/config/festival.config.ts:L182-L242`

---

## Functional Requirements

### Configuration Loading

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Load from environment variables | ✅ | `festival.config.ts:L182-L200` |
| FR-002 | Load from app.json extra | ✅ | `festival.config.ts:L200-L220` |
| FR-003 | Fallback to default values | ✅ | `festival.config.ts:L83-L180` |
| FR-004 | Merge configs with priority | ✅ | `festival.config.ts:L220-L242` |

### Configurable Properties

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-005 | Festival name and slug | ✅ | `festival.config.ts:L15-L17` |
| FR-006 | Festival dates with labels | ✅ | `festival.config.ts:L20-L31` |
| FR-007 | Location with coordinates | ✅ | `festival.config.ts:L34-L40` |
| FR-008 | Light/dark theme colors | ✅ | `festival.config.ts:L51-L74` |
| FR-009 | Feature flags | ✅ | `festival.config.ts:L76-L81` |
| FR-010 | Firebase configuration | ✅ | `festival.config.ts:L43-L49` |

---

## Data Model

### Festival Configuration Interface

```typescript
// From mobile/src/config/festival.config.ts
interface FestivalConfig {
  // Basic festival information
  name: string;
  slug: string;
  
  // Festival dates
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dates: Array<{
    id: string;
    date: string;
    dayLabel: string;
    dayAbbrev: string;
    staffOnly: boolean;
  }>;
  
  // Location
  location: {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  
  // API configuration
  apiUrl: string;
  
  // Firebase configuration
  firebase: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
  
  // Theme colors
  theme: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  
  // Bundle identifiers
  bundleIds: {
    ios: string;
    android: string;
  };
  
  // Feature flags
  features: {
    enableMap: boolean;
    enableNotifications: boolean;
    enableSchedule: boolean;
    enableCampsites: boolean;
  };
}
```

---

## Configuration Sources

| Source | Priority | Example |
|--------|----------|---------|
| Environment Variables | Highest | `FESTIVAL_NAME`, `API_URL` |
| app.json extra | Medium | `expo.extra.festivalName` |
| Default Values | Lowest | Hardcoded in config file |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `FESTIVAL_NAME` | Festival display name |
| `FESTIVAL_SLUG` | URL-safe identifier |
| `API_URL` | Backend API base URL |
| `FIREBASE_API_KEY` | Firebase config |
| `FIREBASE_PROJECT_ID` | Firebase project |
| `ENABLE_MAP` | Map feature flag |
| `ENABLE_NOTIFICATIONS` | Notifications flag |

---

## Success Criteria

| ID | Criterion | Measurement | Status |
|----|-----------|-------------|--------|
| SC-001 | App displays custom festival name | UI verification | ✅ Met |
| SC-002 | Theme colors applied correctly | Visual check | ✅ Met |
| SC-003 | Feature flags work | Toggle features | ✅ Met |
| SC-004 | Env config overrides defaults | Config value check | ✅ Met |

---

## Integration Points

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| ThemeContext | Theme colors | Apply configured colors |
| Countdown | Festival dates | Display countdown |
| ScheduleScreen | Festival dates | Date filtering |
| Constants | API URL | API endpoint base |

---

## Key Files

- `mobile/src/config/festival.config.ts` - Main configuration
- `backend/src/config/festival.config.ts` - Backend config
- `mobile/src/config/constants.ts` - Uses festival config
- `mobile/src/contexts/ThemeContext.tsx` - Theme integration
- `mobile/src/components/Countdown.tsx` - Date integration
- `WHITE_LABEL_GUIDE.md` - Configuration documentation

---

## Documentation

Detailed white-label instructions in `WHITE_LABEL_GUIDE.md`:
- Step-by-step configuration process
- Environment variable reference
- Theme customization guide
- Deployment instructions per festival

---

## Change History

| Date | Version | Change | Reference |
|------|---------|--------|-----------|
| 2025 | 1.0.0 | Initial implementation | Config system |
| 2026-01-14 | - | Retroactive specification created | This document |
