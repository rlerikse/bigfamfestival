# BFF-S3-06: Admin Control Panel — Frontend Component Plan
**Author:** Pixel  
**Date:** 2026-04-14  
**Status:** Planning — awaiting Samantha's API endpoints before implementation

---

## Screen Architecture

```
AdminStack (RBAC gate: role === 'admin' only)
├── AdminDashboardScreen        — Overview, quick stats, activity feed
├── AdminUsersScreen            — User list, search, filters
│   └── AdminUserDetailScreen   — View/edit user, role assignment
├── AdminEventsScreen           — Event list
│   └── AdminEventEditScreen    — Create/edit/delete event, schedule
├── AdminNotificationsScreen    — Send targeted notifications (already exists, extend)
├── AdminShiftsScreen           — Staff/volunteer shift visibility
└── AdminScheduleScreen         — Admin-only schedule editing view
```

---

## Navigation Integration

Admin panel is accessed from Settings (already has an `AdminNotifications` route).
Extend to a full `AdminStack` navigator accessible to `role === 'admin'` users.

New entry in `RootStackParamList`:
```typescript
AdminPanel: undefined;  // root of admin stack
AdminUserDetail: { userId: string };
AdminEventEdit: { eventId?: string }; // undefined = create new
AdminShifts: undefined;
```

---

## Shared Admin Components

### `AdminHeader`
- Title + back button
- "Admin Panel" badge/indicator
- Consistent across all admin screens

### `AdminStatCard`
- Icon + label + value
- Used in dashboard (total users, events, shifts today, pending notifications)

### `AdminSearchBar`
- Debounced text input + filter chips
- Used in Users and Events lists

### `AdminUserRow`
- Avatar + name + email + role badge + chevron
- Tappable → AdminUserDetailScreen

### `AdminEventRow`  
- Event name + stage + date/time + status badge
- Tappable → AdminEventEditScreen

### `AdminRoleBadge`
- Color-coded pill: admin=red, staff=orange, artist=purple, volunteer=blue, attendee=gray

### `AdminActionButton`
- Danger variant (red) for delete/deactivate
- Primary variant for save/send

---

## Screen Specs

### AdminDashboardScreen
- Quick stats: total users, total events, active staff today, notifications sent this week
- Recent activity feed (last 10 user registrations, event changes)
- Quick actions: "Send Notification", "Add Event", "View Shifts"

### AdminUsersScreen  
- FlatList of users
- Search by name/email
- Filter by role (chips)
- Pull-to-refresh
- Tap → AdminUserDetailScreen

### AdminUserDetailScreen
- Read-only fields: email, uid, created date, ticket type
- Editable: name, phone, role (picker), notificationsEnabled
- Role assignment dropdown: admin/staff/artist/vendor/volunteer/director/attendee
- Save button → PATCH /admin/users/:id
- Danger zone: deactivate account button

### AdminEventsScreen
- FlatList of all events (no day filter — admin sees all)
- Search by name/stage
- Filter by date
- "+" FAB → create new event
- Swipe-to-delete or long-press menu

### AdminEventEditScreen
- All event fields: name, date, startTime, endTime, stage, description, imageUrl, genres, artists
- Create vs edit mode (title changes, delete button only in edit mode)
- Save → POST or PATCH /admin/events/:id

### AdminNotificationsScreen (extend existing)
- Already exists for broadcast send
- Add: "Send to group" — picker for userGroups (attendee/staff/artist/etc)
- Add: notification history list

### AdminShiftsScreen
- Group by date → list of shifts
- Each shift: staff name, role, start/end time, location/stage
- Filter by date, role type

### AdminScheduleScreen
- Same as ScheduleScreen but all events editable inline
- Tap event → AdminEventEditScreen
- Color-coded by stage for quick scanning

---

## RBAC Gate

Wrap entire admin stack with a guard component:

```typescript
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <AccessDeniedScreen />;
  }
  return <>{children}</>;
};
```

---

## API Dependencies (pending Samantha)

| Screen | Endpoint needed |
|--------|----------------|
| Dashboard | GET /admin/stats |
| Users list | GET /admin/users?search=&role= |
| User detail | GET /admin/users/:id, PATCH /admin/users/:id |
| Events list | GET /events (existing) |
| Event edit | POST /admin/events, PATCH /admin/events/:id, DELETE /admin/events/:id |
| Notifications | POST /admin/notifications/send (existing, extend with groups) |
| Shifts | GET /admin/shifts?date=&role= |

---

## Implementation Order (once APIs land)

1. Navigation setup + AdminGuard
2. AdminDashboardScreen (stats + quick actions)
3. AdminUsersScreen + AdminUserDetailScreen (highest value for ops)
4. AdminEventsScreen + AdminEventEditScreen
5. AdminShiftsScreen
6. AdminScheduleScreen (admin edit view)
7. Extend AdminNotificationsScreen
