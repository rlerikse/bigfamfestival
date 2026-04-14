# BFF-S1-06: Offline-First Audit
**Auditor:** Pixel  
**Date:** 2026-04-14  
**Branch:** Audit only — no code changes in this document  
**Status:** ⚠️ Partial offline support — schedule works, events/artists/map do not

---

## 1. Architecture Overview

The app uses `@react-native-community/netinfo` for connectivity detection and `@react-native-async-storage/async-storage` for local persistence. The `axios` API client checks connectivity in a request interceptor.

**Critical architectural issue:** The API interceptor in `api.ts` **throws an error and blocks all API calls when offline**, rather than allowing cache fallback at the service layer. This means offline fallback must be implemented individually at each service — and most services have not done this.

---

## 2. Schedule Viewing Offline — ✅ PARTIAL (works for My Schedule, not full schedule)

### My Schedule (favorited events)
`scheduleService.ts` has a full offline implementation:
- Caches schedule to AsyncStorage as `schedule_<userId>`
- On `getUserSchedule()`: checks NetInfo, falls back to `getCachedSchedule()` if offline
- Cache expires after 24 hours
- Offline add/remove operations queue to `schedule_offline_queue` and sync when back online ✅
- `processScheduleOfflineQueue()` exists but **is never called automatically** when connectivity is restored

**Gap:** `processScheduleOfflineQueue()` has no trigger. It needs a NetInfo connectivity change listener to fire it.

### Full Event Schedule (`/events` endpoint)
`ScheduleScreen.tsx` calls `api.get('/events')` with no offline fallback:
```typescript
// ScheduleScreen.tsx ~line 350
const response = await api.get<ScheduleEvent[]>('/events', { ... });
setEvents(eventsWithGenres);
// No cache write, no offline check
```

If offline: the API interceptor throws before the request fires. `fetchEvents()` catches it and sets `error = 'Could not load events. Please try again later.'` — **blank screen with error message.** No stale data shown.

### Fix Required
Cache event list in AsyncStorage after each successful fetch. On failure, fall back to cached data:
```typescript
const EVENTS_CACHE_KEY = 'cached_events';
// After successful fetch: AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(eventsWithGenres))
// On error: check AsyncStorage.getItem(EVENTS_CACHE_KEY) and use if available
```

---

## 3. Saved/Favorited Events Offline — ✅ WORKS (with gaps)

### What works
- `scheduleService.ts` caches favorited events per user in AsyncStorage
- `getUserSchedule()` falls back to cache when offline
- My Schedule filter in `ScheduleScreen` uses `userSchedule` state (in-memory, populated from service)
- Schedule add/remove queued for later sync ✅

### Gaps
1. **Queue never auto-processes** — offline mutations sit in `schedule_offline_queue` forever unless the user kills and relaunches the app, or a NetInfo listener fires `processScheduleOfflineQueue()` (which doesn't exist)
2. **Cache lookup in `addToSchedule()`** — when adding to schedule offline, it tries to fetch the event details from the API to cache them locally. This will fail offline:
   ```typescript
   // scheduleService.ts ~line 180
   const response = await api.get<ScheduleEvent>(`/events/${eventId}`, { ... });
   // This will throw when offline — event detail won't be cached
   ```
   The catch block silently swallows this, so the event is added to the queue but won't have cached details.

### Fix Required
- Add a NetInfo event listener (ideally in `AppContext` or root) that calls `processScheduleOfflineQueue()` when `isConnected` transitions from `false` → `true`
- Pre-populate the event cache from the full events list so offline add-to-schedule can look up locally

---

## 4. Cached Artist Data Offline — ❌ NOT IMPLEMENTED

### Finding
There is no artist data caching. Artist screens fetch from the API with no AsyncStorage fallback. When offline, artist screens will show an error or blank state.

No `artistService.ts` was found with offline handling. If it exists, it follows the same pattern as the raw `api.get()` calls without cache.

### Impact
Medium — attendees may want to look up artist info while in a dead zone. Not blocking for schedule management.

### Fix Required
Add artist list caching with the same pattern as schedule:
- Cache on successful fetch
- Serve from cache when offline
- Show stale-data banner ("Last updated X hours ago") if data is older than 1 hour

---

## 5. Map Data Offline — ⚠️ DEPENDS ON IMPLEMENTATION

### Finding
`festival.config.ts` confirms `enableMap: true` and coordinates are provided (`latitude: 42.1059, longitude: -84.2486`). However, the map implementation was not found in the files reviewed.

The map likely uses `expo-location` + an embedded map (React Native Maps or similar). Key questions:
- Is the map tile source remote (MapBox, Google Maps) or bundled?
- Are festival-specific overlays (stage locations, campsite markers) fetched from the API?
- Is there a `MapScreen.tsx`?

**If using remote map tiles (Google Maps / MapBox):** tiles are typically cached by the map SDK at the OS level. Festival overlay data (stage pins, campsite markers) would need to be separately cached.

### Recommendation
This needs a targeted review of the map screen. Key things to check:
1. Are stage/campsite pin coordinates fetched from the API on each load?
2. If yes, add AsyncStorage cache for that overlay data
3. Consider bundling a static PNG map as a guaranteed fallback — festival grounds don't change during the event

---

## 6. API Interceptor Issue — ⚠️ SYSTEMIC

### Finding
`api.ts` request interceptor (line ~55):
```typescript
if (!netInfo.isConnected) {
  throw new Error('No internet connection. Please try again when you\'re online.');
}
```

This fires **before any service-layer cache check**. This means:
- Every screen that uses `api` directly (not through a cache-aware service) is broken offline
- The cache fallback pattern in `scheduleService.ts` works because it checks NetInfo **before** calling `api`
- Any service that calls `api` directly without a prior NetInfo check will get this error thrown

### Impact
All screens using the API pattern without explicit offline guards show error states offline.

### Fix Required (two options)
**Option A (preferred):** Remove the check from the interceptor. Let each service handle offline gracefully. Add a global NetInfo context that services can read.

**Option B (simpler):** Allow the interceptor to pass through but mark the request with `isOffline: true`. Services can then check this flag and decide whether to use cache.

---

## 7. Offline UX — ❌ NOT IMPLEMENTED

### Finding
There is no:
- Global offline banner ("You're offline — showing cached data")
- Stale data indicators
- Network status indicator in the UI

When offline, each screen independently shows either stale data (schedule) or an error (most other screens). Users don't know what's cached vs what's live.

### Fix Required
Add a `NetworkBanner` component that renders conditionally:
```typescript
// Uses NetInfo to detect connectivity and renders a yellow banner:
// "You're offline — schedule shows last synced data"
```

---

## 8. Summary

| Flow | Offline Status | Severity |
|------|---------------|----------|
| Full event schedule viewing | ❌ Error state | **P0** |
| My Schedule (favorites) viewing | ✅ Works (cache) | — |
| Add/remove from schedule offline | ⚠️ Queued but queue never auto-processes | P1 |
| Artist data | ❌ No cache | P1 |
| Map overlay data | ❓ Unknown — needs map screen review | P1 |
| Map tiles | ⚠️ OS-level cache (partial, not guaranteed) | P2 |
| Offline UX feedback | ❌ None | P2 |
| Offline queue sync on reconnect | ❌ Never triggered | P1 |

---

## 9. Recommended Fix Order

1. **Cache the full events list** — this is the most-used screen and it goes blank offline
2. **Add reconnect listener** to trigger `processScheduleOfflineQueue()` 
3. **Fix `addToSchedule()` offline cache** — use local events cache for event details lookup
4. **Add offline banner** — simple UX improvement, high attendee impact
5. **Review MapScreen and cache overlay data**
6. **Add artist caching**

---

## 10. Files to Modify

| File | Change |
|------|--------|
| `src/screens/ScheduleScreen.tsx` | Add events cache read/write |
| `src/services/scheduleService.ts` | Add reconnect listener, fix addToSchedule offline lookup |
| `src/services/api.ts` | Consider removing offline throw from interceptor |
| `src/App.tsx` (or root) | Add NetInfo reconnect listener for queue processing |
| New: `src/components/NetworkBanner.tsx` | Offline status indicator |

---

*Note: Map screen audit pending — MapScreen.tsx location not identified in this pass. Needs follow-up.*
