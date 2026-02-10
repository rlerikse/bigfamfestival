# Campsite Location - Implementation Plan (Retroactive)

**Status**: ✅ Implemented  
**Jira**: [BFF-10](https://eriksensolutions.atlassian.net/browse/BFF-10)

---

## Architecture Summary

### Tech Stack
- **Backend**: NestJS + Firestore
- **Mobile**: React Native + expo-location

### Key Design Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| UserID as document ID | One campsite per user, simple lookup | No multiple campsites |
| Upsert behavior | Simpler API (no separate create/update) | No 201 vs 200 distinction |
| Server timestamps | Consistent timing | Two Firestore writes on create |

---

## Future Enhancements (Not Implemented)

1. **Multiple Campsites** - Save multiple locations
2. **Sharing** - Share campsite with friends (respecting shareMyCampsite setting)
3. **Directions** - Integration with maps for navigation
4. **Offline Storage** - Cache location for offline access
5. **Photos** - Attach photos to campsite location
