# Codebase Audit Report
Generated: 2025-01-XX

## 1. Hardcoded Values Inventory

### Festival-Specific Values

#### Festival Name
- `mobile/app.json`: "Big Fam Festival"
- `mobile/src/config/constants.ts`: "BigFam Festival"
- `backend/src/main.ts`: "Big Fam Festival API"
- `mobile/src/screens/SettingsScreen.tsx`: "Big Fam Festival" (About dialog)

#### Festival Dates
- `mobile/src/screens/ScheduleScreen.tsx`: 
  - 2025-09-26 (Friday)
  - 2025-09-27 (Saturday)
  - 2025-09-28 (Sunday)
- `mobile/src/screens/HomeScreen.tsx`: Same dates
- `mobile/src/screens/MyScheduleScreen.tsx`: Same dates

#### Location & Timezone
- `mobile/src/components/Countdown.tsx`:
  - Latitude: 42.1059 (Brooklyn, MI)
  - Longitude: -84.2486
  - Timezone: "America/Detroit"

#### Bundle Identifiers
- iOS: `com.eriksensolutions.bigfam`
- Android: `com.eriksensolutions.bigfam`
- Found in: `mobile/app.json`, `mobile/google-services.json`, `mobile/GoogleService-Info.plist`

#### API URLs
- Production: `https://bigfam-api-production-292369452544.us-central1.run.app/api/v1`
- Found in: `mobile/src/config/constants.ts`, `mobile/app.json`

#### Firebase Configuration
- **SECURITY ISSUE**: Hardcoded in `mobile/src/config/firebase.ts`
- Project ID: `bigfamfestival`
- Auth Domain: `bigfamfestival.firebaseapp.com`
- Database URL: `https://bigfamfestival-default-rtdb.firebaseio.com`
- Storage Bucket: `bigfamfestival.firebasestorage.app`
- Messaging Sender ID: `292369452544`
- App ID: `1:292369452544:web:b3508390b4600be71c12e5`
- Measurement ID: `G-VZ06GV8DGT`

#### Theme Colors
- `mobile/src/contexts/ThemeContext.tsx`:
  - Light theme: Primary #2E4031, Secondary #6BBF59, Background #F5F5DC
  - Dark theme: Primary #6BBF59, Secondary #2E4031, Background #1C2B20

#### App Assets
- Icons: Festival-specific (bf-logo-trans.png, etc.)
- Splash screens: Festival-specific
- Map images: `bff25_CampingMap.png` (festival-specific)

## 2. Incomplete Features

### Commented Out Features
- `mobile/src/screens/SettingsScreen.tsx`:
  - Help & FAQ (lines 254-260)
  - Contact Support (lines 262-268)

### Unused/Dead Code
- `mobile/src/screens/MapScreenDev.tsx` - Unused variant (POI functionality, placeholder map)
- `mobile/src/screens/MapScreenZoom.tsx` - Unused variant (pinch/pan zoom)
- `mobile/src/components/GrassBottomTabBar copy.tsx` - Duplicate file
- Note: `MapScreen.tsx` is the production version (simple image viewer)

### Partially Implemented
- Map functionality: Currently just displays static image, POI functionality exists in MapScreenDev but not used
- What3Words integration: Mock implementation in MapScreenDev.tsx

## 3. Test Coverage Assessment

### Existing Tests
- `mobile/src/__tests__/SafeText.test.tsx` - Component test
- `mobile/src/__tests__/placeholder.test.ts` - Placeholder test
- `backend/src/events/events.controller.spec.ts` - Controller test
- `backend/src/events/events.service.spec.ts` - Service test

### Missing Tests
- **Mobile**:
  - API service tests (api.ts, scheduleService.ts, authService.ts)
  - Auth flow tests (LoginScreen, RegisterScreen)
  - Schedule management tests
  - Notification tests
  - Event card component tests
  - Navigation tests
  - E2E tests

- **Backend**:
  - Auth service tests
  - Notifications service tests
  - Schedule service tests
  - Users service tests
  - Artists service tests
  - Campsites service tests
  - Integration tests for API endpoints
  - E2E tests for critical flows

### Test Infrastructure
- Jest configured for both mobile and backend
- No CI/CD test pipelines visible
- No coverage thresholds set

## 4. Security Audit

### Critical Issues
1. **Firebase Config Exposed** (`mobile/src/config/firebase.ts`)
   - All Firebase credentials hardcoded in source
   - TODO comment exists but not addressed
   - Should use environment variables

2. **API Keys in Source**
   - Firebase API key visible in code
   - Should be moved to secure storage

### Potential Issues
1. **JWT Secret Handling**
   - Backend uses environment variable (good)
   - Need to verify secure storage in mobile app

2. **Token Storage**
   - Mobile uses SecureStore (good)
   - Should verify token refresh logic

3. **Input Validation**
   - Backend has ValidationPipe with DTOs (good)
   - Need to verify all endpoints have proper validation

4. **Rate Limiting**
   - No rate limiting visible in backend
   - Should add to prevent abuse

5. **CORS Configuration**
   - Currently set to `*` (allows all origins)
   - Should be restricted in production

## 5. Dependency Status

### Mobile Dependencies
- React Native: 0.81.4
- Expo: ~54.0.0
- React: 19.1.0
- TypeScript: ^5.3.3
- Need to check for security vulnerabilities

### Backend Dependencies
- NestJS: ^10.0.0
- TypeScript: ^5.1.6
- Firebase Admin: ^13.4.0
- Need to check for security vulnerabilities

### Build Tools
- EAS Build configured
- Docker configured
- Terraform configured
- Need to verify all are up-to-date

## 6. Code Quality Issues

### Dead Code
- MapScreenDev.tsx (unused)
- MapScreenZoom.tsx (unused)
- GrassBottomTabBar copy.tsx (duplicate)
- Commented code in SettingsScreen

### Code Organization
- Some duplicate logic across screens
- Could benefit from more shared utilities
- Type definitions could be more centralized

### Performance Concerns
- Image loading: OptimizedImage component exists but need to verify usage
- FlatList rendering: ScheduleScreen could benefit from optimization
- DayNightCycle: Has performance mode toggle (good)

## 7. Error Handling Assessment

### Backend
- Has global ValidationPipe (good)
- Notifications service has some error handling
- Health check has timeout (good)
- Missing: Global error filter, retry logic for Firestore

### Mobile
- API interceptor has some error handling
- Network error handling exists but could be improved
- Missing: Error boundaries, offline mode, retry mechanisms

## 8. Logging & Monitoring

### Backend
- Pino logger configured (good)
- Structured logging available
- Missing: Error tracking (Sentry), performance monitoring

### Mobile
- Console logging (development)
- Missing: Crash reporting, analytics, production logging

## 9. Documentation Status

### Existing
- README.md with setup instructions
- Swagger API docs (non-production)

### Missing
- Architecture documentation
- White-label setup guide
- Configuration reference
- Deployment templates
- Troubleshooting guide

## 10. Multi-Tenant Readiness

### Current State
- No tenant/festival ID in data models
- No tenant isolation
- All data is single-tenant
- Configuration is hardcoded

### Required Changes
- Add festival/tenant ID to all models
- Implement tenant context middleware
- Support multiple Firebase projects or namespaced collections
- Dynamic configuration loading

## Recommendations Priority

### Immediate (Week 1)
1. Fix Firebase config security issue
2. Remove dead code files
3. Add basic error boundaries
4. Set up test infrastructure

### Short-term (Week 2)
1. Write tests for critical paths
2. Improve error handling
3. Add logging/monitoring
4. Performance optimization

### Medium-term (Week 3-4)
1. Create configuration system
2. Extract hardcoded values
3. Implement multi-tenant architecture
4. Complete documentation

