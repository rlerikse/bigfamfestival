# Changelog

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
