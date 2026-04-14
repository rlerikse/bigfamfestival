# BFF-S1-01: Notification Reliability Audit (Frontend)
**Auditor:** Pixel  
**Date:** 2026-04-14  
**Branch:** Audit only — no code changes in this document  
**Status:** ⚠️ Multiple gaps found — action required before next live event

---

## 1. Architecture Overview

The app uses **two distinct notification systems** that partially overlap:

| System | Package | Purpose |
|--------|---------|---------|
| **Local scheduled notifications** | `expo-notifications` | Schedule "event starting soon" alerts 15 min before each favorited event |
| **Firebase Auth** | `@react-native-firebase/auth` + `@react-native-firebase/app` | Authentication only |
| **Push (FCM) via Expo** | `expo-notifications` | Push notification infrastructure (EAS project configured) |
| **Web Firebase SDK** | `firebase` (v12) | Firestore, Firestore auth compat |

**Critical finding:** There is **no FCM push token registration flow** anywhere in the frontend codebase. The app schedules local notifications only. There is no code that:
- Calls `Notifications.getExpoPushTokenAsync()`
- Registers an FCM/Expo push token with the backend
- Receives remote push notifications from a server-side sender

---

## 2. FCM Token Registration — ❌ NOT IMPLEMENTED

### Finding
Searching across all service files, there is no push token registration. The `notificationService.ts` only schedules **local** timed notifications. There is no:
- `getExpoPushTokenAsync()` call
- `getDevicePushTokenAsync()` call
- API endpoint call to register a device token with the backend
- Token refresh handling
- Token storage

### Impact
**This is why push notifications failed at the last live event.** The backend has no tokens to send to. Attendees never receive remote push notifications.

### Root Cause
The notification service was built for local scheduled alerts (15 min before events) but never extended to support server-initiated push. The `constants.ts` defines `NOTIFICATION_CHANNEL_ID` and `NOTIFICATION_CHANNEL_NAME` but these are never used to create an Android notification channel.

### Fix Required
```typescript
// Add to notificationService.ts or a new pushTokenService.ts:
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Android: create channel FIRST before requesting permissions
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF3366',
      sound: 'notification.wav',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '0c013fd4-da29-4e1c-9c8d-b69783e98066', // from app.json eas.projectId
  });

  const token = tokenData.data;

  // Register token with backend
  try {
    await api.post('/notifications/register', {
      token,
      platform: Platform.OS,
    });
  } catch (err) {
    console.error('Failed to register push token with backend:', err);
  }

  return token;
};
```

**Where to call it:** In `AuthContext.tsx`, after successful login and profile fetch — call `registerForPushNotifications()` with `await` before setting `isLoading(false)`.

---

## 3. Permission Request UX — ⚠️ PARTIAL

### Finding
Permissions are requested **inline per notification schedule**, not upfront at a logical moment (login, onboarding). The `scheduleEventNotification` function calls `requestPermissionsAsync()` every time it schedules an event for a user. This means:

- First notification schedule triggers the system permission dialog — but this happens silently in the background during login, not in a context where the user understands why
- If the user denies, there's no explanation or retry prompt shown in the UI
- No custom pre-permission prompt explaining value ("Get alerted 15 min before your favorite sets")

### iOS-specific gap
`UIBackgroundModes: ["remote-notification"]` is correctly set in `app.json`. But the `NSUserNotificationUsageDescription` key exists with a good message. ✅

### Android-specific gap
`RECEIVE_BOOT_COMPLETED` and `VIBRATE` permissions are declared in `app.json`. ✅  
However, **Android notification channels are never explicitly created** in code. The `app.json` `androidSettings` configures the Expo plugin's default channel at build time, but for dynamic channel creation (e.g., "My Schedule Alerts" vs "Announcements"), code-side channel creation is needed and absent.

### Fix Required
- Add a custom pre-permission prompt screen or modal before `requestPermissionsAsync()` — explain the value
- Move permission request to onboarding or first login, not buried in background scheduling
- Create named notification channels in code for Android (see token registration fix above)

---

## 4. Token Refresh Handling — ❌ NOT IMPLEMENTED

### Finding
`firebaseAuthService.ts` has `onIdTokenChanged()` exported but it is **not used** anywhere in the app. Token refresh is handled by Firebase Auth automatically for API auth tokens, but there is no push notification token refresh listener.

Expo push tokens can change when:
- App is reinstalled
- User clears app data
- FCM rotates the token

### Fix Required
Add a `Notifications.addPushTokenListener()` call that re-registers the new token with the backend when it changes:

```typescript
// In registerForPushNotifications or a separate effect in AuthContext:
Notifications.addPushTokenListener(async (tokenData) => {
  await api.post('/notifications/register', {
    token: tokenData.data,
    platform: Platform.OS,
  });
});
```

---

## 5. Notification Display States

### Foreground
`expo-notifications` requires a handler to display notifications when the app is in the foreground. There is **no `Notifications.setNotificationHandler()` call** anywhere in the codebase. This means:

**⚠️ Foreground notifications are silently dropped.** Users who have the app open receive no visual alert.

### Fix Required — Add to `App.tsx` or root layout:
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### Background
`UIBackgroundModes: ["remote-notification"]` is set for iOS ✅  
Android background delivery depends on FCM — since there's no token registration, this is moot until fixed.

### Killed State
Expo push notifications in killed state are delivered by the OS via FCM/APNs. This works when:
1. Token is registered ✅ (not yet implemented)
2. Notification payload includes `content-available: 1` (iOS) or `priority: high` (Android)
3. `app.json` `androidSettings.priority: "high"` is set ✅

---

## 6. Android Notification Channels — ⚠️ PARTIAL

### Finding
`app.json` configures the Expo notifications plugin with a default channel (priority HIGH, sound, vibrate, lights). This creates a channel at build time with the default channel ID.

However, `constants.ts` defines `NOTIFICATION_CHANNEL_ID = 'default'` and `NOTIFICATION_CHANNEL_NAME = 'Default Channel'` but **these constants are never used**. The `scheduleNotificationAsync` calls don't specify a channel ID — they rely on the Expo default.

This is functional for the default case but means:
- Cannot create separate channels per notification type (schedule alerts vs announcements)
- Cannot let users selectively enable/disable notification categories on Android 8+

---

## 7. Summary of Findings

| Area | Status | Severity |
|------|--------|----------|
| FCM token registration | ❌ Not implemented | **P0 — Critical** |
| Push token refresh | ❌ Not implemented | **P0 — Critical** |
| Foreground notification handler | ❌ Missing | **P0 — Critical** |
| Permission request UX | ⚠️ Functional but poor timing/context | P1 |
| Android notification channels | ⚠️ Default only, not configurable | P2 |
| iOS background modes | ✅ Correctly configured | — |
| Local scheduled notifications | ✅ Working (15-min pre-event alerts) | — |
| Notification permission strings | ✅ Present and reasonable | — |

---

## 8. Recommended Fix Order

1. **Immediate (before next event):**
   - Add `Notifications.setNotificationHandler()` to root — fixes foreground display
   - Implement `registerForPushNotifications()` and call it on login
   - Create Android notification channel in code

2. **Before next sprint:**
   - Add token refresh listener
   - Improve permission request UX with pre-permission explanation modal
   - Coordinate with Koda on backend `/notifications/register` endpoint shape

3. **Nice to have:**
   - Multiple Android notification channels (schedule vs announcements)
   - Notification preferences screen per channel

---

## 9. Files to Modify

| File | Change |
|------|--------|
| `src/services/notificationService.ts` | Add `registerForPushNotifications()`, `setNotificationHandler()` setup |
| `src/contexts/AuthContext.tsx` | Call token registration after login |
| `App.tsx` (or root layout) | Add `setNotificationHandler()` call |
| `src/config/constants.ts` | Wire `NOTIFICATION_CHANNEL_ID` to actual channel creation |

---

*Dependency: Wait for Koda to complete BFF-S1-03 (env config) before testing any Firebase-connected push flow.*
