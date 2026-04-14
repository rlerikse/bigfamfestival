# BFF-S1-01: Notification Reliability Audit (Backend)
**Auditor:** Koda  
**Date:** 2026-04-14  
**Status:** ⚠️ Multiple gaps found — action required before next live event  
**Pairs with:** Frontend audit by Pixel (docs/audits/BFF-S1-01-notification-audit.md)

---

## Executive Summary

The backend notification infrastructure is largely functional but has two critical failure modes:

1. **The app never registers push tokens** (frontend gap, confirmed by Pixel's audit) → backend has no tokens to send to
2. **FCM service account lacks Cloud Messaging Admin role** → FCM sends fail with `messaging/mismatched-credential`

Everything else is secondary to these two root causes. Fixing them will restore push delivery.

---

## 1. Token Storage Architecture

### Finding
The backend stores push tokens on the `users` collection as `expoPushToken`. The field is:
- A single string per user (not an array)
- Not indexed (Firestore query `where('expoPushToken', '!=', null)` is unindexed)
- Mixed format: code checks for `ExponentPushToken[` (Android), `ExponentPushToken:` (iOS), `fcm:` (web)

### Problems
- **Single token per user** — if a user installs on multiple devices, only the last registration wins
- **No token registration endpoint** — there's no `PUT /users/me/push-token` or equivalent. There's no documented path for the frontend to register tokens. (Pixel's audit confirms the frontend has no registration code at all.)
- **No token freshness tracking** — no `tokenRegisteredAt` field, no way to identify stale tokens

### What's needed
```
POST /users/push-token  { token: string, platform: 'ios'|'android', deviceId: string }
```
Store as an array of `{ token, platform, deviceId, registeredAt, lastSeenAt }` per user.

---

## 2. FCM Service Account Permissions

### Finding
The code explicitly handles `messaging/mismatched-credential` with a warn-and-skip:

```typescript
if (fcmError.code === 'messaging/mismatched-credential') {
  this.logger.error(
    'FCM permission denied: Service account lacks FCM send permissions...',
  );
  this.logger.warn(
    'Notification saved to database but could not be delivered via FCM...',
  );
}
```

This means notifications have been silently failing to deliver. The database shows they were sent. The devices never received them.

### Root cause
The service account used in production (`bigfam-serviceaccount.json`) does not have the **Firebase Cloud Messaging Admin** role in GCP IAM.

### Fix
GCP Console → IAM → find the service account → add role: `Firebase Cloud Messaging Admin`  
(Or: `roles/cloudmessaging.admin`)

⚠️ Requires Robert's approval (production IAM change).

---

## 3. Dual Push System Complexity

### Finding
The backend sends via two paths:

| Path | Token format | SDK |
|---|---|---|
| Expo Push | `ExponentPushToken[...]` or `ExponentPushToken:...` | `expo-server-sdk` |
| FCM direct | everything else | `firebase-admin` |

### Problem
The token routing relies on string prefix matching. If a token format changes (e.g., new Expo SDK version changes format), tokens silently fall into the FCM path and may fail there too.

### Recommendation
Standardize on **Expo Push API only** for the mobile app. The Expo Push Service handles FCM/APNs routing internally, is more resilient, and requires no special GCP IAM roles. FCM direct is only needed for web push or cases where Expo isn't used.

---

## 4. No Delivery Receipts / Retry

### Finding
After calling `sendEachForMulticast`, the backend logs failures but:
- Does not retry failed sends
- Does not track delivery status per notification
- Does not surface delivery stats to admins

### Impact
At a live event with 500 attendees, if 10% of sends fail, there's no visibility.

### What's needed
- Store delivery attempt results in Firestore (`notifications/{id}/deliveryStats`)
- Expose `GET /notifications/{id}/delivery-stats` for admin monitoring

---

## 5. Token Cleanup Race Condition

### Finding
`cleanupInvalidTokens()` does:
```typescript
.where('expoPushToken', 'in', tokensToRemove)
```
Firestore `in` queries are limited to 30 values. If more than 30 tokens fail simultaneously, only the first 30 get cleaned up — the rest persist as invalid tokens and will fail on every future send.

### Fix
Batch the cleanup in chunks of 30.

---

## 6. `receiverGroups` Filter Bug

### Finding
`filterTokensByGroups()` queries users by `userGroup` field:
```typescript
.where('userGroup', 'in', groups)
.where('expoPushToken', '!=', null)
```
Firestore requires a composite index for multiple inequality/`in` filters. This query likely fails silently in production (returns empty array on error), meaning targeted group notifications don't work.

### Fix
- Add Firestore composite index on `(userGroup, expoPushToken)`
- Or restructure: query by group first, then filter for token existence in code

---

## 7. Fire-and-Forget Delivery (Intentional but Risky)

### Finding
```typescript
this.sendNotificationToAllDevices(...).catch((err) => {
  this.logger.error('Failed to send notification to devices', err);
});
```
Delivery is intentionally not awaited for performance. This is reasonable but means the API returns `201 Created` even when delivery fails.

### Recommendation
Keep fire-and-forget for API responsiveness. Document it explicitly. Add a delivery status field (`delivered: boolean | null`) to the notification document that gets updated async.

---

## Priority Action Plan

| Priority | Action | Who | Approval needed |
|---|---|---|---|
| P0 | Add push token registration endpoint to backend | Koda | No |
| P0 | Implement frontend token registration flow | Pixel | No |
| P0 | Fix FCM service account IAM role (add `roles/cloudmessaging.admin`) | Robert | **Yes — prod IAM** |
| P1 | Fix `cleanupInvalidTokens` chunk batching | Koda | No |
| P1 | Fix `receiverGroups` Firestore index | Koda | No |
| P2 | Add delivery stats tracking | Koda | No |
| P2 | Simplify to Expo Push only (drop FCM direct) | Koda + Pixel | No |

---

## Next Steps

Koda will implement P0 and P1 backend items (token registration endpoint, cleanup fix, index fix) in branch `BFF-S1-01-notification-backend`.

Robert approval needed for the IAM role change before push delivery can be validated end-to-end on the dev environment.
