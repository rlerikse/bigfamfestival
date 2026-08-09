# Changelog

## Unreleased

### Added
- **Realtime friend locations (#204):** opted-in friend locations now update through authenticated Server-Sent Events (SSE), replacing the previous 30-second foreground poll. The client refreshes its Firebase token on explicit reconnect attempts, uses capped exponential backoff, and temporarily falls back to polling when the stream is unavailable.

### Fixed
- **Map compass/camera stability (#202):** fixed the 0°/360° full-spin seam, reduced compass drift and overshoot with tilt-compensated sensor fusion, and improved camera-update throttling so the map remains responsive.
- **Friend marker and HUD stability (#203):** stabilized edge/radar friend markers and the map HUD to prevent visible bounce and jitter while heading changes.

## [1.2.2] - 2026-07-28

### Fixed
- **Google Sign-In**: corrected OAuth client configuration so Google authentication works on release builds
- **Schedule tab crash**: added a guard on `startTime.split(':')` to prevent a crash when a start time is missing or malformed
- **Map black screen**: fixed a Mapbox access-token initialization race that could leave the map rendering blank on startup

### Changed (Android polish)
- **Map camera**: default map camera now centers on `FESTIVAL_CENTER`
- **Android top nav**: fixed a TextureView rendering issue in the top navigation bar
- **Schedule hours**: schedule now shows full hours in 12-hour format
- **Favorite heart**: cosmetic parity for the favorite-heart icon across list/grid views
- **Favorite tap**: tapping favorite no longer jumps the horizontal scroll position

### Release hardening
- Removed the unused `ACCESS_BACKGROUND_LOCATION` (and `FOREGROUND_SERVICE_LOCATION`) permission — it was declared for a future v1.3 friend live-location feature but not used in 1.2.2; keeps only foreground `FINE`/`COARSE` location for the festival map. Clears the Play "undeclared background location" flag.
- Corrected Android app signing to use the proper Play upload key (SHA-1 `9B:50:41:8D:...:B2:FF`), resolving the upload-key mismatch that blocked Play submissions.
- Version: `versionCode` 79 → 80, versionName 1.2.2 (iOS buildNumber 36).

## [1.2.1] - 2026-07-14

### Fixed
- Performance: removed LayoutAnimation from artist modal (was causing scroll lag)
- Performance: prefer event imageUrl over artist profile image to avoid double image load/re-render
- Performance: use plain Text for bio display, added fast-path to SafeText for string children

## [1.2.0] - 2026-07-14

### Added
- Admin panel deployed to Firebase Hosting (https://bigfamfestival.web.app)
- Artist `websiteUrl` field (backend, admin, mobile)
- Collapsible artist bios with "Read More..." / "Read Less" toggle
- Stage logos in admin events list (replaces text badges)
- Circular event thumbnails in admin panel
- Client-side artist image enrichment for event cards
- Firebase Storage public read rules for artist_photos/, event-images/, event_photos/
- LayoutAnimation for smooth bio expand/collapse

### Fixed
- Event update 500 error (stripped undefined values before Firestore write)
- Sentry crash on missing DSN / Platform.OS check
- CI lint errors (no-var-requires, no-empty)
- Package-lock.json sync issues
- Duplicate artist name display in modal
- Schedule list bottom padding for tab bar clearance
- Performance: disabled 23+ debug console.logs per render cycle

### Changed
- Festival dates migrated from 2025 to 2026 (Sep 25-27)
- OptimizedImage uses direct URL construction (public storage rules)
- Version bump: 1.1.0 → 1.2.0, build 2 → 3

## [1.1.0] - 2026-07-14

### Added
- Android EAS development build
- App Store screenshots and copy
- Firebase deploy (storage rules, firestore rules, functions)
- Home header padding fix
- Notification card transparent/floating styling
- EAS remote versioning with auto-increment

### Fixed
- Backend event PUT endpoint (500 error on undefined fields)
- Sentry initialization guard

## [1.0.0] - 2026-07-01

### Added
- Initial release
- Festival schedule with day filtering
- Interactive map
- User profiles and authentication
- Push notifications
- Personal schedule/bookmarks
