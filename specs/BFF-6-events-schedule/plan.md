# Events & Schedule Browser - Implementation Plan (Retroactive)

**Status**: ✅ Implemented  
**Jira**: [BFF-6](https://eriksensolutions.atlassian.net/browse/BFF-6)

---

## Architecture Summary

### Tech Stack
- **Language**: TypeScript
- **Backend Framework**: NestJS 10.x
- **Database**: Firebase Firestore
- **Mobile**: React Native + TanStack Query

### Key Design Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Public endpoints | Events are public info | No personalization without auth |
| Client-side caching | Reduce API calls | Data may be stale |
| Date as string | Simple filtering | No timezone handling |
| Compound queries | Filter by multiple fields | Requires Firestore indexes |

---

## Firestore Indexes Required

For compound filtering (stage + date), a composite index is needed:

```
Collection: events
Fields: stage (Ascending), date (Ascending)
```

---

## Query Patterns

### All Events
```typescript
firestoreService.getAll<Event>('events')
```

### By Stage
```typescript
firestoreService.query<Event>('events', 'stage', '==', stage)
```

### By Date
```typescript
firestoreService.query<Event>('events', 'date', '==', date)
```

### By Stage AND Date
```typescript
queryCompound<Event>('events', [
  { field: 'stage', operator: '==', value: stage },
  { field: 'date', operator: '==', value: date },
])
```

---

## Mobile Integration

### TanStack Query Usage
```typescript
const { data: events } = useQuery({
  queryKey: ['events', { stage, date }],
  queryFn: () => fetchEvents({ stage, date }),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## Future Enhancements (Not Implemented)

1. **Search** - Full-text search on event titles/descriptions
2. **Pagination** - Currently returns all events
3. **Caching** - Redis caching for frequently accessed data
4. **Real-time Updates** - Firestore listeners for live updates
