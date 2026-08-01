# ADR-002: Realtime Friend Locations via Server-Sent Events

## Status
Accepted

## Date
2026-07-31

## Context
The map needs to show location changes for opted-in friends promptly while the app is in use. The initial implementation fetched `GET /friends/locations` every 30 seconds. That polling model delayed updates, performed requests even when nothing changed, and provided no durable connection semantics.

The backend already owns friend-location permissions and opt-in enforcement. The mobile client needs an authenticated, resilient transport that preserves that server-side authorization model.

## Decision
Use an authenticated Server-Sent Events (SSE) stream at `GET /friends/locations/stream` for foreground friend-location updates.

- The client uses `react-native-sse`, which supports the Firebase `Authorization: Bearer <token>` header required by the backend guard. The stock EventSource implementation cannot provide that header in the required environment.
- The server sends the permitted friend-location set when connected and whenever it changes. The client does not run the former 30-second location poll while healthy SSE data is arriving (`pollingInterval: 0`).
- The screen owns reconnection rather than relying only on library auto-reconnect: on a stream error it closes the subscription, starts temporary 30-second fallback polling, then reconnects with capped exponential backoff (2 seconds, doubling to a 60-second maximum).
- Each explicit reconnection re-subscribes through `getIdToken()`. This obtains a current Firebase token rather than allowing a long-lived stream reconnect to replay the token captured at the original connection.
- On the first healthy SSE payload, fallback polling stops and the reconnect counter resets. Campsites remain on a separate five-minute refresh because they are near-static.
- Cleanup closes the stream and cancels polling and pending reconnect timers when the map unmounts.

## Consequences

### Positive
- Friend-location changes reach the map promptly without continuous polling while the stream is healthy.
- Authorization and opt-in behavior remains centralized in the existing backend endpoint logic.
- Network loss, parsing errors, token expiry, and stream errors have a visible recovery path instead of silently leaving stale markers on screen.
- The polling fallback maintains a usable map during temporary SSE failures.

### Trade-offs
- The mobile screen carries connection lifecycle and retry logic, rather than using a simple periodic fetch.
- During an outage, fallback polling still incurs the former 30-second request cadence until a fresh SSE connection succeeds.
- This decision applies only to realtime friend locations; it is unrelated to ADR-001's artist-modal performance work.
