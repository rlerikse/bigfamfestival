# Architectural Domains - Big Fam Festival App

**Generated**: February 9, 2026  
**Source**: Codebase pattern analysis

---

## Overview

This document describes the architectural patterns, domain boundaries, and design constraints discovered in the Big Fam Festival codebase.

---

## Domain Architecture

### Backend Domain Structure

```
backend/src/
├── auth/           # Authentication & Authorization domain
├── users/          # User management domain
├── events/         # Event/Schedule domain
├── schedule/       # Personal schedule domain
├── artists/        # Artist directory domain
├── campsites/      # Location/campsite domain
├── notifications/  # Push notification domain
├── health/         # System health domain
├── debug/          # Development tools domain
├── config/         # Cross-cutting configuration
└── common/         # Shared utilities
```

### Mobile Domain Structure

```
mobile/src/
├── screens/        # UI layer - page components
├── components/     # UI layer - reusable components
├── contexts/       # State layer - global state
├── hooks/          # Logic layer - reusable logic
├── services/       # Data layer - API integration
├── types/          # Type definitions
├── utils/          # Utility functions
├── navigation/     # Navigation configuration
├── config/         # App configuration
└── assets/         # Static resources
```

---

## Architectural Patterns

### 1. NestJS Module Pattern (Backend)

**Pattern**: Domain-driven modules with clear boundaries

```typescript
// Each domain has its own module
@Module({
  imports: [FirestoreModule],      // Dependencies
  controllers: [EventsController], // HTTP handlers
  providers: [EventsService],      // Business logic
  exports: [EventsService],        // Shared services
})
export class EventsModule {}
```

**Constraints**:
- One module per domain
- Services are injectable singletons
- Controllers only handle HTTP concerns
- Services contain business logic
- Modules declare their dependencies explicitly

### 2. Repository Pattern via Firestore Service (Backend)

**Pattern**: Centralized data access through FirestoreService

```typescript
@Injectable()
export class EventsService {
  private readonly collection = 'events';
  
  constructor(private readonly firestoreService: FirestoreService) {}
  
  async findById(id: string): Promise<Event> {
    return this.firestoreService.get<Event>(this.collection, id);
  }
}
```

**Constraints**:
- All Firestore operations go through `FirestoreService`
- Collection names defined as class constants
- Generic types for type safety
- Services handle NOT_FOUND exceptions

### 3. Guard + Decorator Pattern (Backend)

**Pattern**: Declarative route protection

```typescript
// Route is protected by default
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  
  @Public()  // Opt-out of authentication
  @Get()
  findAll() { ... }
  
  @Roles(Role.ADMIN)  // Require specific role
  @Post()
  create() { ... }
}
```

**Constraints**:
- `@Public()` decorator for unauthenticated routes
- `@Roles()` decorator for role-based access
- Guards applied at controller level
- JWT is the primary auth mechanism

### 4. DTO Validation Pattern (Backend)

**Pattern**: Class-validator decorators for input validation

```typescript
export class CreateEventDto {
  @ApiProperty({ description: 'Event name' })
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @ApiProperty({ example: '2025-09-27' })
  @IsDateString()
  date: string;
}
```

**Constraints**:
- All DTOs use class-validator decorators
- Swagger decorators for API documentation
- Validation happens automatically via NestJS pipes

### 5. React Context Pattern (Mobile)

**Pattern**: Context + Provider for global state

```typescript
// Define context shape
interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Custom hook for consumption
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  // State and logic here
};
```

**Constraints**:
- Context value typed via interface
- Custom hook for type-safe access
- Provider at app root in `App.tsx`
- Error thrown if used outside provider

### 6. Service Layer Pattern (Mobile)

**Pattern**: API calls abstracted into service modules

```typescript
// services/scheduleService.ts
export const getUserSchedule = async (userId: string): Promise<ScheduleEvent[]> => {
  const token = await SecureStore.getItemAsync('userToken');
  const response = await api.get<ScheduleEvent[]>('/schedule', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
```

**Constraints**:
- Services are pure functions (not classes)
- Token retrieval within service functions
- Error handling at service level
- Offline fallback to cached data

### 7. Axios Interceptor Pattern (Mobile)

**Pattern**: Centralized request/response handling

```typescript
// Request interceptor - add auth token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => handleApiError(error)
);
```

**Constraints**:
- Auth token injected automatically
- Response unwrapped to `response.data`
- 401 errors trigger token refresh
- Network errors return friendly messages

### 8. Component Composition Pattern (Mobile)

**Pattern**: Screens compose reusable components

```tsx
const HomeScreen = () => {
  return (
    <SafeAreaView>
      <TopNavBar />
      <Countdown targetDate={festivalDate} />
      <LiveUpcomingEvents onEventPress={openModal} />
      <EventDetailsModal visible={isVisible} event={selectedEvent} />
    </SafeAreaView>
  );
};
```

**Constraints**:
- Screens are thin orchestrators
- Business logic in hooks or services
- Components receive data via props
- Modals managed at screen level

---

## Domain Boundaries

### Auth Domain

**Backend Responsibilities**:
- User registration and login
- JWT token generation/validation
- Password hashing
- Role assignment

**Mobile Responsibilities**:
- Token storage (SecureStore)
- Auth state management (AuthContext)
- Login/logout UI flow
- Guest user support

**Boundary**: Backend issues tokens, mobile stores and sends them.

### Events Domain

**Backend Responsibilities**:
- Event CRUD operations
- Stage/date filtering
- Genre aggregation from artists
- Admin-only mutations

**Mobile Responsibilities**:
- Event list display
- Filtering UI
- Event detail modals
- Schedule integration

**Boundary**: Backend is source of truth, mobile caches for offline.

### Schedule Domain

**Backend Responsibilities**:
- User schedule storage
- Add/remove events
- Fetch user's saved events

**Mobile Responsibilities**:
- Schedule display (MyScheduleScreen)
- Toggle add/remove UI
- Local notifications for events
- Offline caching

**Boundary**: Backend persists, mobile schedules local notifications.

### Notifications Domain

**Backend Responsibilities**:
- Broadcast notifications to all/targeted users
- Store notification history
- Handle Expo push tokens
- Admin notification management

**Mobile Responsibilities**:
- Push token registration
- Notification permissions
- Local notification scheduling
- Notification display/history

**Boundary**: Backend sends push via Expo, mobile handles display.

---

## Cross-Cutting Concerns

### Authentication Flow

```
Mobile                          Backend
  │                               │
  ├─── POST /auth/register ──────►│
  │◄────── { token, user } ───────┤
  │                               │
  ├─── Store token (SecureStore)  │
  │                               │
  ├─── GET /events ──────────────►│
  │    (Authorization: Bearer)    │
  │◄────── { events } ────────────┤
```

### Offline Support

```
Mobile
  │
  ├─── Check network (NetInfo)
  │
  ├─── If offline:
  │    └── Return cached data (AsyncStorage)
  │
  ├─── If online:
  │    ├── Fetch from API
  │    └── Cache response
```

### Error Handling

**Backend**: NestJS exception filters
**Mobile**: Try-catch + Alert.alert for user feedback

---

## Data Flow Patterns

### Read Flow (Mobile to Backend)

```
Screen → Hook/Effect → Service → API Client → Backend → Firestore
                                                  ↓
Screen ← State Update ← Service ← Response ← Backend
```

### Write Flow (Mobile to Backend)

```
User Action → Handler → Service → API Client → Backend → Firestore
                                                   ↓
UI Update ← State Update ← Service ← Response ← Backend
```

### Real-time Updates

**Current**: Polling via React Query `refetchInterval`  
**No WebSocket/real-time subscription pattern observed**

---

## Security Boundaries

### Backend Security Layers

1. **Route Level**: `@Public()` or default protected
2. **Role Level**: `@Roles(Role.ADMIN)` for admin routes
3. **Guard Level**: `JwtAuthGuard` validates tokens
4. **Service Level**: Additional business rule checks

### Mobile Security Layers

1. **Token Storage**: SecureStore (encrypted)
2. **API Client**: Automatic token injection
3. **Context Level**: `isGuestUser()` checks
4. **Screen Level**: Navigation guards to Auth screen

---

## Performance Patterns

### Backend

- **Rate Limiting**: `@nestjs/throttler` (configured)
- **Compression**: `compression` middleware
- **Caching**: Not observed (Firestore direct queries)

### Mobile

- **Image Optimization**: `OptimizedImage` component
- **Query Caching**: TanStack Query with `staleTime: 5min`
- **Performance Mode**: Theme context flag to disable animations
- **Memoization**: `React.memo` on components like `EventCard`
