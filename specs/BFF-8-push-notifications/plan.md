# Push Notifications - Implementation Plan (Retroactive)

**Status**: ✅ Implemented  
**Jira**: [BFF-8](https://eriksensolutions.atlassian.net/browse/BFF-8)

---

## Architecture Summary

### Tech Stack
- **Backend**: NestJS + Expo Server SDK
- **Push Service**: Expo Push Notifications
- **Storage**: Firebase Firestore
- **Mobile**: expo-notifications

### Key Design Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Expo Push over FCM directly | Unified API for iOS/Android | Dependency on Expo service |
| Store all notifications | History for missed notifications | Storage costs |
| Chunked sending | Expo rate limits | More complex sending logic |
| Token on user document | Simple association | One device per user |

---

## Notification Flow

```
┌─────────────┐                        ┌─────────────┐
│  Admin UI   │─── POST /notifications ─▶│   Backend   │
└─────────────┘                        └─────────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                   ┌─────────────────────┐       ┌─────────────────────┐
                   │  Store notification │       │  Get all push tokens│
                   │  in Firestore       │       │  from users         │
                   └─────────────────────┘       └─────────────────────┘
                                                          │
                                                          ▼
                                              ┌─────────────────────┐
                                              │  Chunk into batches │
                                              │  of 100 messages    │
                                              └─────────────────────┘
                                                          │
                                                          ▼
                                              ┌─────────────────────┐
                                              │  Send via Expo SDK  │
                                              │  (parallel chunks)  │
                                              └─────────────────────┘
                                                          │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                   ┌─────────────────────┐       ┌─────────────────────┐
                   │  iOS Device (APNS)  │       │  Android (FCM)      │
                   └─────────────────────┘       └─────────────────────┘
```

---

## Module Dependencies

```
NotificationsModule
├── imports
│   └── FirestoreModule
├── providers
│   └── NotificationsService
└── controllers
    └── NotificationsController
```

---

## Expo SDK Integration

### Installation
```bash
npm install expo-server-sdk
```

### Usage
```typescript
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

// Validate tokens
if (!Expo.isExpoPushToken(token)) {
  console.log('Invalid token');
}

// Send messages
const tickets = await expo.sendPushNotificationsAsync(messages);
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_ACCESS_TOKEN` | Optional Expo access token for higher rate limits | No |

---

## Future Enhancements (Not Implemented)

1. **Topic Subscriptions** - Subscribe to specific notification topics
2. **Rich Notifications** - Images, action buttons
3. **Scheduled Notifications** - Send at specific times
4. **Analytics** - Track open rates, delivery rates
5. **Token Cleanup** - Remove invalid tokens automatically
6. **Rate Limiting** - Prevent notification spam
