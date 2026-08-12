# Big Fam — Next Release Draft

> **Draft only.** This document is for review of work merged after 1.4.2. It does not approve a version number, release date, store submission, or rollout.
>
> **Projected next version:** 1.5.0 (minor — the unreleased realtime friend-location SSE feature triggers a minor bump; also includes the schedule genre-filter fix and schedule-list performance improvements. release-please will finalize the number and `CHANGELOG.md`).

## What's New
- **Live friend locations:** opted-in friends can appear on the festival map as their location changes.
- **More responsive map:** friend-location updates use an authenticated realtime connection, with a temporary polling fallback if that connection is unavailable.

## Improvements & Fixes
- **Sharing toggles also on your Profile:** "Share My Live Location" and "Share My Campsite" can now be turned on/off from your Profile screen, not just Settings — same preference, either place.
- **Friend & your own photos show on the map:** on-map avatars now display profile pictures instead of a blank placeholder (fixes an Android rendering issue).
- **Map opens centered on you:** the first time you open the map it centers on your own location instead of the festival grounds.
- **Walking directions work reliably:** fixed an error that could stop directions to a POI or friend from loading.
- **Rides out brief connection blips:** the app now quietly retries read requests through short server cold-starts or network hiccups instead of surfacing a “can’t connect” error.
- **Steadier friend markers:** edge/radar friend markers and the map HUD no longer visibly bounce or jitter as the device heading moves.
- **Genre filter matches this year's lineup:** the schedule's genre filter now lists only genres actually being performed this year, so every option leads to real sets. The list stays consistent across refreshes and day changes, and no longer shows stale genres that return no results.
- **Faster, smoother Schedule:** the schedule list opens noticeably quicker and scrolls more smoothly through a full day — it now renders just what's on screen instead of a whole day up front, and no longer re-renders every visible card on each clock tick. Live and "Starts in …" badges still update as before.

## Under the Hood
- Replaced the foreground 30-second friend-location poll with authenticated Server-Sent Events (SSE) while healthy.
- Reconnects use a fresh Firebase token and capped exponential backoff; temporary fallback polling preserves updates during stream failures.

## Still under review
- **Compass / heading-follow map is disabled by default.** The reworked friend-finder — directional “point-to-a-friend” tracking, the heading-follow compass mode, and the new Compass Calibration screen — is on the build but turned off pending an on-device stability pass; the map ships north-up for now. Not a release commitment.
