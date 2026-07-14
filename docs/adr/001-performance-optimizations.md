# ADR-001: Performance Optimizations for Artist Modal

## Status
Accepted

## Date
2026-07-14

## Context
The artist detail modal experienced noticeable scroll lag and image flicker on certain artists (notably Cheska). Root causes:

1. **LayoutAnimation conflicts** — `LayoutAnimation.configureNext()` was triggering on bio expand/collapse, but conflicted with the ScrollView's native scroll animations, causing frame drops.
2. **Double image loading** — When artist profiles loaded async, the image URL swapped from the event's `gs://` URL to the artist's HTTPS URL, causing a full image re-render.
3. **SafeText overhead** — `React.Children.map` was called on every Text render even when children was a simple string, adding unnecessary overhead in high-frequency renders (bio, "Read More" labels).

## Decision
- Remove `LayoutAnimation` from the artist modal entirely. Bio expand/collapse works fine without animation.
- Use event-level `imageUrl` as primary source; only fall back to artist profile image when event has none.
- Add a fast-path in `SafeText`: if children is already a string, skip `React.Children.map` and render directly.
- Use plain `Text` instead of `SafeText` for bio and "Read More" labels (no child processing needed).

## Consequences
- Scroll lag eliminated
- Image flicker on artist cards resolved
- Minor loss: no animated bio expand (acceptable tradeoff for smoothness)
- SafeText remains available for complex child compositions
