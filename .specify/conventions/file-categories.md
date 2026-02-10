# File Categories - Big Fam Festival App

**Generated**: February 9, 2026  
**Source**: Codebase structure analysis

---

## Overview

This document defines the taxonomy of file types in the Big Fam Festival codebase, providing naming conventions and organizational patterns.

---

## Backend Categories

### Controllers
**Location**: `backend/src/{domain}/{domain}.controller.ts`  
**Purpose**: Handle HTTP requests, define routes, apply guards  
**Pattern**: `{domain}.controller.ts`

| File | Domain |
|------|--------|
| `auth.controller.ts` | Authentication |
| `events.controller.ts` | Events/Schedule |
| `users.controller.ts` | User management |
| `artists.controller.ts` | Artist directory |
| `campsites.controller.ts` | Campsite locations |
| `health.controller.ts` | Health checks |
| `notifications-debug.controller.ts` | Debug endpoints |

### Services
**Location**: `backend/src/{domain}/{domain}.service.ts`  
**Purpose**: Business logic, data access, external integrations  
**Pattern**: `{domain}.service.ts`

| File | Purpose |
|------|---------|
| `auth.service.ts` | Authentication logic |
| `events.service.ts` | Event CRUD operations |
| `users.service.ts` | User management |
| `artists.service.ts` | Artist data access |
| `campsites.service.ts` | Campsite operations |
| `notifications.service.ts` | Push notification sending |
| `schedule.service.ts` | User schedule management |

### Modules
**Location**: `backend/src/{domain}/{domain}.module.ts`  
**Purpose**: NestJS module definition, dependency injection setup  
**Pattern**: `{domain}.module.ts`

| File | Registers |
|------|-----------|
| `app.module.ts` | Root module |
| `auth.module.ts` | Auth providers |
| `events.module.ts` | Event services |
| `health.module.ts` | Health indicators |

### DTOs (Data Transfer Objects)
**Location**: `backend/src/{domain}/dto/{action}.dto.ts`  
**Purpose**: Request/response validation schemas  
**Pattern**: `{action}.dto.ts` or `{action}-{entity}.dto.ts`

| File | Purpose |
|------|---------|
| `login.dto.ts` | Login request validation |
| `register.dto.ts` | Registration validation |
| `create-event.dto.ts` | Event creation |
| `update-event.dto.ts` | Event updates |

### Interfaces
**Location**: `backend/src/{domain}/interfaces/{entity}.interface.ts`  
**Purpose**: TypeScript type definitions  
**Pattern**: `{entity}.interface.ts`

| File | Defines |
|------|---------|
| `user.interface.ts` | User type |
| `event.interface.ts` | Event type |
| `artist.interface.ts` | Artist type |

### Guards
**Location**: `backend/src/auth/guards/{name}.guard.ts`  
**Purpose**: Route protection, authorization  
**Pattern**: `{name}.guard.ts`

| File | Purpose |
|------|---------|
| `jwt-auth.guard.ts` | JWT authentication |
| `local-auth.guard.ts` | Username/password auth |
| `roles.guard.ts` | Role-based authorization |

### Decorators
**Location**: `backend/src/auth/decorators/{name}.decorator.ts`  
**Purpose**: Custom route metadata  
**Pattern**: `{name}.decorator.ts`

| File | Purpose |
|------|---------|
| `public.decorator.ts` | Mark routes as public |
| `roles.decorator.ts` | Specify required roles |

### Strategies
**Location**: `backend/src/auth/strategies/{name}.strategy.ts`  
**Purpose**: Passport authentication strategies  
**Pattern**: `{name}.strategy.ts`

| File | Purpose |
|------|---------|
| `jwt.strategy.ts` | JWT validation |
| `local.strategy.ts` | Local credentials |

### Enums
**Location**: `backend/src/auth/enums/{name}.enum.ts`  
**Purpose**: Enumeration constants  
**Pattern**: `{name}.enum.ts`

| File | Defines |
|------|---------|
| `role.enum.ts` | User roles (ADMIN, ATTENDEE) |

### Config
**Location**: `backend/src/config/{name}/`  
**Purpose**: Configuration modules  

| Directory | Purpose |
|-----------|---------|
| `firebase/` | Firebase Admin setup |
| `firestore/` | Firestore service |
| `festival.config.ts` | Festival-specific settings |

---

## Mobile Categories

### Screens
**Location**: `mobile/src/screens/{ScreenName}Screen.tsx`  
**Purpose**: Full-page components, navigation targets  
**Pattern**: `{Name}Screen.tsx`

| File | Purpose |
|------|---------|
| `HomeScreen.tsx` | Festival home/countdown |
| `ScheduleScreen.tsx` | Full event schedule |
| `MyScheduleScreen.tsx` | Personal schedule |
| `MapScreen.tsx` | Festival map |
| `ProfileScreen.tsx` | User profile |
| `SettingsScreen.tsx` | App settings |
| `NotificationsScreen.tsx` | Notification history |
| `AdminNotificationsScreen.tsx` | Admin broadcast UI |
| `DebugScreen.tsx` | Development tools |

### Screen Styles
**Location**: `mobile/src/screens/{ScreenName}Screen.styles.ts`  
**Purpose**: StyleSheet for screens (when extracted)  
**Pattern**: `{Name}Screen.styles.ts`

### Auth Screens
**Location**: `mobile/src/screens/auth/{Name}Screen.tsx`  
**Purpose**: Authentication flow screens  
**Pattern**: `{Name}Screen.tsx`

| File | Purpose |
|------|---------|
| `LoginScreen.tsx` | User login |
| `RegisterScreen.tsx` | User registration |

### Components
**Location**: `mobile/src/components/{ComponentName}.tsx`  
**Purpose**: Reusable UI components  
**Pattern**: `{ComponentName}.tsx` (PascalCase)

| File | Purpose |
|------|---------|
| `EventCard.tsx` | Event display card |
| `EventDetailsModal.tsx` | Event detail popup |
| `Countdown.tsx` | Festival countdown |
| `TopNavBar.tsx` | Header navigation |
| `GrassBottomTabBar.tsx` | Custom tab bar |
| `DayNightCycle.tsx` | Background animation |
| `LiveUpcomingEvents.tsx` | Live/upcoming section |
| `OptimizedImage.tsx` | Cached image component |
| `ErrorBoundary.tsx` | Error handling wrapper |
| `NotificationListener.tsx` | Push notification handler |
| `MultiSelectDropdown.tsx` | Filter dropdown |
| `SafeText.tsx` | Text wrapper |

### Contexts
**Location**: `mobile/src/contexts/{Name}Context.tsx`  
**Purpose**: React Context providers for global state  
**Pattern**: `{Name}Context.tsx`

| File | Provides |
|------|----------|
| `AuthContext.tsx` | Authentication state |
| `ThemeContext.tsx` | Theme/dark mode state |
| `AppSettingsContext.tsx` | App preferences |
| `DebugContext.tsx` | Development settings |

### Hooks
**Location**: `mobile/src/hooks/use{Name}.ts`  
**Purpose**: Custom React hooks  
**Pattern**: `use{Name}.ts` (camelCase with "use" prefix)

| File | Purpose |
|------|---------|
| `useOffline.ts` | Network connectivity |
| `useCountdown.ts` | Countdown timer |
| `useCachedResources.ts` | Asset preloading |

### Services
**Location**: `mobile/src/services/{name}Service.ts`  
**Purpose**: API calls and business logic  
**Pattern**: `{name}Service.ts` (camelCase)

| File | Purpose |
|------|---------|
| `apiClient.ts` | Axios instance |
| `api.ts` | API wrapper |
| `authService.ts` | Auth API calls |
| `scheduleService.ts` | Schedule API calls |
| `notificationService.ts` | Local notifications |
| `pushNotificationService.ts` | Push setup |
| `userService.ts` | User API calls |
| `mapService.ts` | Map data |
| `genreService.ts` | Genre lookups |

### Types
**Location**: `mobile/src/types/{name}.ts`  
**Purpose**: TypeScript type definitions  
**Pattern**: `{name}.ts` (lowercase)

| File | Defines |
|------|---------|
| `event.ts` | Event, ScheduleEvent |
| `user.ts` | UserRole |

### Utils
**Location**: `mobile/src/utils/{name}.ts`  
**Purpose**: Utility functions  
**Pattern**: `{name}.ts` or `{name}Utils.ts`

| File | Purpose |
|------|---------|
| `userUtils.ts` | User type checking |
| `alertUtils.ts` | Alert helpers |
| `logger.ts` | Logging utilities |
| `debugTools.ts` | Debug utilities |
| `getApiUrl.ts` | API URL resolution |

### Navigation
**Location**: `mobile/src/navigation/`  
**Purpose**: Navigation configuration  

| File | Purpose |
|------|---------|
| `index.tsx` | Navigator definitions |
| `navigationRef.ts` | Navigation reference |

### Config
**Location**: `mobile/src/config/`  
**Purpose**: App configuration  

| File | Purpose |
|------|---------|
| `constants.ts` | App constants |
| `sentry.ts` | Error tracking setup |

### Assets
**Location**: `mobile/src/assets/`  
**Purpose**: Static assets (images, fonts)

---

## Test Files

### Backend Tests
**Pattern**: `{name}.spec.ts` (unit) or `{name}.e2e-spec.ts` (e2e)  
**Location**: Colocated with source or `test/` directory

### Mobile Tests
**Pattern**: `{ComponentName}.test.tsx` or `{name}.test.ts`  
**Location**: `mobile/src/__tests__/`

---

## File Naming Summary

| Category | Pattern | Example |
|----------|---------|---------|
| Controllers | `{domain}.controller.ts` | `events.controller.ts` |
| Services | `{domain}.service.ts` | `events.service.ts` |
| Modules | `{domain}.module.ts` | `events.module.ts` |
| DTOs | `{action}.dto.ts` | `create-event.dto.ts` |
| Interfaces | `{entity}.interface.ts` | `event.interface.ts` |
| Guards | `{name}.guard.ts` | `jwt-auth.guard.ts` |
| Decorators | `{name}.decorator.ts` | `public.decorator.ts` |
| Screens | `{Name}Screen.tsx` | `HomeScreen.tsx` |
| Components | `{ComponentName}.tsx` | `EventCard.tsx` |
| Contexts | `{Name}Context.tsx` | `AuthContext.tsx` |
| Hooks | `use{Name}.ts` | `useOffline.ts` |
| Services (mobile) | `{name}Service.ts` | `scheduleService.ts` |
| Utils | `{name}Utils.ts` | `userUtils.ts` |
| Types | `{name}.ts` | `event.ts` |
