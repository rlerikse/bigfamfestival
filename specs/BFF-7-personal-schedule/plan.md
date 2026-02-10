# Personal Schedule - Implementation Plan (Retroactive)

**Status**: ✅ Implemented  
**Jira**: [BFF-7](https://eriksensolutions.atlassian.net/browse/BFF-7)

---

## Architecture Summary

### Tech Stack
- **Language**: TypeScript
- **Backend Framework**: NestJS 10.x
- **Database**: Firebase Firestore (subcollection pattern)

### Key Design Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Subcollection per user | Efficient user-scoped queries | More complex document paths |
| EventId as doc ID | Prevents duplicates naturally | Requires string IDs |
| Return full events | Better UX, fewer API calls | Larger response payloads |
| No privacy controls | Simplicity for MVP | Anyone can view any schedule |

---

## Data Flow

### Add to Schedule
```
┌─────────────┐    POST /schedule         ┌─────────────┐
│   Mobile    │ ─────────────────────────▶│   Backend   │
│    App      │  { event_id: "123" }      │   NestJS    │
└─────────────┘                           └─────────────┘
                                                 │
                              ┌──────────────────┴──────────────────┐
                              ▼                                     ▼
                   ┌─────────────────────┐             ┌─────────────────────┐
                   │  Validate event     │             │  Check if already   │
                   │  exists in events   │             │  in user's schedule │
                   │  collection         │             │                     │
                   └─────────────────────┘             └─────────────────────┘
                              │                                     │
                              └──────────────────┬──────────────────┘
                                                 ▼
                                    ┌─────────────────────┐
                                    │  Create/Return      │
                                    │  schedule item in   │
                                    │  subcollection      │
                                    └─────────────────────┘
```

### Get Schedule (with Event Enrichment)
```
┌─────────────┐    GET /schedule          ┌─────────────┐
│   Mobile    │ ─────────────────────────▶│   Backend   │
└─────────────┘                           └─────────────┘
                                                 │
                              ┌──────────────────┴──────────────────┐
                              ▼                                     ▼
                   ┌─────────────────────┐             ┌─────────────────────┐
                   │  Get all items from │             │  For each item,     │
                   │  user's schedule    │             │  fetch full event   │
                   │  subcollection      │             │  from events        │
                   └─────────────────────┘             └─────────────────────┘
                                                                │
                                                                ▼
                                                   ┌─────────────────────┐
                                                   │  Return array of    │
                                                   │  full Event objects │
                                                   └─────────────────────┘
```

---

## Module Dependencies

```
ScheduleModule
├── imports
│   ├── FirestoreModule
│   └── EventsModule (for event validation/enrichment)
├── providers
│   └── ScheduleService
└── controllers
    └── ScheduleController
```

---

## Firestore Operations

### Add Item
```typescript
// Ensure parent document exists
await userScheduleDoc.set({ userId }, { merge: true });

// Add to subcollection (using eventId as doc ID)
await itemDocRef.set({ userId, eventId, createdAt: now });
```

### Get Schedule with Events
```typescript
// Get all schedule items
const snapshot = await itemsCollection.get();
const eventIds = snapshot.docs.map(doc => doc.data().eventId);

// Fetch full events
const events = await Promise.all(
  eventIds.map(id => eventsService.findById(id))
);
```

---

## Future Enhancements (Not Implemented)

1. **Privacy Controls** - Allow users to make schedule private
2. **Conflict Detection** - Warn when events overlap
3. **Batch Operations** - Add/remove multiple events at once
4. **Sync Status** - Track if schedule is synced across devices
5. **Export** - Export schedule as ICS/PDF
