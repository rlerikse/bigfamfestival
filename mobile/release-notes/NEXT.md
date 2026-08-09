# Big Fam — Next Release Draft

> **Draft only.** This document is for review of work merged after 1.2.2. It does not approve a version number, release date, store submission, or rollout.

## What's New
- **Live friend locations:** opted-in friends can appear on the festival map as their location changes.
- **More responsive map:** friend-location updates use an authenticated realtime connection, with a temporary polling fallback if that connection is unavailable.

## Improvements & Fixes
- **Smoother map orientation:** compass and camera handling avoids the visible full-spin at the north seam, reduces drift/overshoot, and limits camera update churn.
- **Steadier friend markers:** edge/radar friend markers and the map HUD no longer visibly bounce or jitter as the device heading moves.

## Under the Hood
- Replaced the foreground 30-second friend-location poll with authenticated Server-Sent Events (SSE) while healthy.
- Reconnects use a fresh Firebase token and capped exponential backoff; temporary fallback polling preserves updates during stream failures.

## Still under review
- The existing friend-location roadmap copy for routing to a friend and profile pictures remains unshipped and is not a release commitment.
