# App Settings & Theme - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-12](https://eriksensolutions.atlassian.net/browse/BFF-12)  
**Created**: 2026-02-09  

---

## Overview

App Settings & Theme provides user preference management including theme switching (light/dark mode), debug mode toggle, and persistent settings storage on the mobile device.

---

## User Stories

### User Story 1 - Toggle Dark Mode
**As a** festival attendee,  
**I want to** switch between light and dark themes,  
**So that** I can use the app comfortably at night.

**Acceptance Criteria** (Verified):
- [x] User can toggle dark mode in settings
- [x] Theme persists across app restarts
- [x] All screens respect theme setting

**Implementation**: `mobile/src/contexts/ThemeContext.tsx`

### User Story 2 - Debug Mode Toggle
**As a** developer,  
**I want to** enable debug mode in the app,  
**So that** I can see additional diagnostic information.

**Acceptance Criteria** (Verified):
- [x] Debug mode can be toggled in settings
- [x] Debug mode shows additional UI/logs

**Implementation**: `mobile/src/contexts/DebugContext.tsx`

### User Story 3 - Persistent Settings
**As a** user,  
**I want** my settings to persist,  
**So that** I don't have to reconfigure on each app launch.

**Acceptance Criteria** (Verified):
- [x] Settings are stored in AsyncStorage
- [x] Settings are loaded on app start

**Implementation**: `mobile/src/contexts/AppSettingsContext.tsx`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Theme toggle (light/dark) | ✅ | `ThemeContext.tsx` |
| FR-002 | Persist theme preference | ✅ | AsyncStorage |
| FR-003 | Debug mode toggle | ✅ | `DebugContext.tsx` |
| FR-004 | Settings screen UI | ✅ | `SettingsScreen.tsx` |

---

## Data Model

### App Settings
```typescript
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  debugMode: boolean;
  // Future settings...
}
```

### Theme Context
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isDarkMode: boolean;
}
```

### Debug Context
```typescript
interface DebugContextType {
  isDebugMode: boolean;
  toggleDebugMode: () => void;
}
```

---

## Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `@app_theme` | string | 'light' or 'dark' |
| `@debug_mode` | boolean | Debug mode enabled |

---

## File Structure

```
mobile/src/
├── contexts/
│   ├── AppSettingsContext.tsx   # Settings aggregation
│   ├── ThemeContext.tsx         # Theme state management
│   └── DebugContext.tsx         # Debug mode management
└── screens/
    └── SettingsScreen.tsx       # Settings UI
```

---

## Theme Colors

### Light Theme
```typescript
const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#6200EE',
  // ...
};
```

### Dark Theme
```typescript
const darkTheme = {
  background: '#121212',
  text: '#FFFFFF',
  primary: '#BB86FC',
  // ...
};
```

---

## Related Specifications

- No backend dependencies (mobile-only feature)
