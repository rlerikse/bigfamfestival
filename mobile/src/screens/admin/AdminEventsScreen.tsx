/**
 * AdminEventsScreen — unified event management screen.
 *
 * Combines the former "Manage Events" (flat searchable list) and
 * "Edit Schedule" (date-grouped timeline) into a single screen with
 * a List / Schedule toggle in the header.
 *
 * Both views navigate to AdminEventEdit on tap.
 * Delete is available in List view only (swipe-friendly; Schedule view
 * is read+edit focused).
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, SectionList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { deleteAdminEvent, listAdminEvents, AdminEvent } from '../../services/adminService';
import { AdminSearchBar } from '../../components/admin/AdminSearchBar';

// ── Stage colours (matches legacy AdminScheduleScreen) ─────────────────

const STAGE_COLORS: Record<string, string> = {
  'Apogee':     '#f59e0b',
  'The Bayou':  '#3b82f6',
  'The Gallery':'#8b5cf6',
};

const stageColor = (stage: string, fallback: string) =>
  STAGE_COLORS[stage] ?? fallback;

// ── Types ───────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'schedule';

// ── List View ────────────────────────────────────────────────────────────

interface ListViewProps {
  events: AdminEvent[];
  search: string;
  onSearch: (v: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onEdit: (id: string) => void;
  onDelete: (event: AdminEvent) => void;
  onNew: () => void;
  theme: any;
}

const ListView: React.FC<ListViewProps> = ({
  events, search, onSearch, refreshing, onRefresh, onEdit, onDelete, onNew, theme,
}) => {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return events;
    return events.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.stage?.toLowerCase().includes(q)
    );
  }, [events, search]);

  const renderItem = ({ item }: { item: AdminEvent }) => (
    <View style={[listStyles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity
        style={listStyles.rowMain}
        onPress={() => onEdit(item.id)}
        accessibilityLabel={`Edit event ${item.name}`}
      >
        <Text style={[listStyles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[listStyles.meta, { color: theme.muted }]}>
          {item.stage} · {item.date} {item.startTime}{item.endTime ? `–${item.endTime}` : ''}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onDelete(item)}
        style={[listStyles.deleteBtn, { borderColor: '#ef444444' }]}
        accessibilityLabel={`Delete event ${item.name}`}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Ionicons name="trash-outline" size={16} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={listStyles.searchRow}>
        <View style={{ flex: 1 }}>
          <AdminSearchBar value={search} onChangeText={onSearch} placeholder="Search events…" />
        </View>
        <TouchableOpacity
          style={[listStyles.newBtn, { backgroundColor: theme.primary }]}
          onPress={onNew}
          accessibilityLabel="Create new event"
        >
          <Text style={listStyles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={e => e.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={listStyles.list}
        ListEmptyComponent={
          <View style={listStyles.empty}>
            <Text style={[listStyles.emptyText, { color: theme.muted }]}>
              {search ? 'No events match your search' : 'No events yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const listStyles = StyleSheet.create({
  searchRow: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 8, alignItems: 'center' },
  newBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  rowMain: { flex: 1, padding: 12 },
  name: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  meta: { fontSize: 12 },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderLeftWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 14 },
});

// ── Schedule View ─────────────────────────────────────────────────────────

interface ScheduleViewProps {
  events: AdminEvent[];
  refreshing: boolean;
  onRefresh: () => void;
  onEdit: (id: string) => void;
  onNew: () => void;
  theme: any;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({
  events, refreshing, onRefresh, onEdit, onNew, theme,
}) => {
  const sections = useMemo(() => {
    const grouped = events.reduce<Record<string, AdminEvent[]>>((acc, ev) => {
      const key = ev.date ?? 'Unknown';
      (acc[key] = acc[key] ?? []).push(ev);
      return acc;
    }, {});
    return Object.keys(grouped)
      .sort()
      .map(date => ({
        title: date,
        data: grouped[date].sort((a, b) =>
          (a.startTime ?? '').localeCompare(b.startTime ?? '')
        ),
      }));
  }, [events]);

  return (
    <SectionList
      style={{ flex: 1 }}
      sections={sections}
      keyExtractor={ev => ev.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      contentContainerStyle={schedStyles.content}
      ListHeaderComponent={
        <TouchableOpacity
          style={[schedStyles.newBtn, { backgroundColor: theme.primary }]}
          onPress={onNew}
          accessibilityLabel="Create new event"
        >
          <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={schedStyles.newBtnText}>New Event</Text>
        </TouchableOpacity>
      }
      renderSectionHeader={({ section }) => (
        <Text style={[schedStyles.dateHeader, { color: theme.primary, backgroundColor: theme.background }]}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => {
        const color = stageColor(item.stage ?? '', theme.primary);
        return (
          <TouchableOpacity
            style={[schedStyles.eventRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => onEdit(item.id)}
            accessibilityLabel={`Edit ${item.name}`}
          >
            <View style={[schedStyles.stageTag, { backgroundColor: color + '33', borderColor: color }]}>
              <Text style={[schedStyles.stageText, { color }]} numberOfLines={1}>
                {item.stage}
              </Text>
            </View>
            <View style={schedStyles.eventInfo}>
              <Text style={[schedStyles.eventName, { color: theme.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[schedStyles.eventTime, { color: theme.muted }]}>
                {item.startTime}{item.endTime ? `–${item.endTime}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.muted} />
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={schedStyles.empty}>
          <Text style={[schedStyles.emptyText, { color: theme.muted }]}>No events yet</Text>
        </View>
      }
    />
  );
};

const schedStyles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dateHeader: {
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 6,
    gap: 10,
  },
  stageTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 72,
    alignItems: 'center',
  },
  stageText: { fontSize: 10, fontWeight: '700' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  eventTime: { fontSize: 12 },
  empty: { justifyContent: 'center', alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 14 },
});

// ── Main Screen ───────────────────────────────────────────────────────────

export const AdminEventsScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<ViewMode>('list');

  const fetchEvents = useCallback(async () => {
    try {
      const data = await listAdminEvents();
      setEvents(data as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const onRefresh = () => { setRefreshing(true); fetchEvents(); };

  const handleEdit = (id: string) => navigation.navigate('AdminEventEdit', { eventId: id });
  const handleNew = () => navigation.navigate('AdminEventEdit', {});

  const handleDelete = (event: AdminEvent) => {
    Alert.alert(
      'Delete Event',
      `Delete "${event.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdminEvent(event.id);
              setEvents(prev => prev.filter(e => e.id !== event.id));
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Events</Text>
        {/* List / Schedule toggle */}
        <View style={[styles.toggle, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'list' && { backgroundColor: theme.primary }]}
            onPress={() => setMode('list')}
            accessibilityLabel="List view"
            accessibilityRole="button"
          >
            <Ionicons name="list-outline" size={16} color={mode === 'list' ? '#fff' : theme.muted} />
            <Text style={[styles.toggleText, { color: mode === 'list' ? '#fff' : theme.muted }]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'schedule' && { backgroundColor: theme.primary }]}
            onPress={() => setMode('schedule')}
            accessibilityLabel="Schedule view"
            accessibilityRole="button"
          >
            <Ionicons name="calendar-outline" size={16} color={mode === 'schedule' ? '#fff' : theme.muted} />
            <Text style={[styles.toggleText, { color: mode === 'schedule' ? '#fff' : theme.muted }]}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : mode === 'list' ? (
        <ListView
          events={events}
          search={search}
          onSearch={setSearch}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNew={handleNew}
          theme={theme}
        />
      ) : (
        <ScheduleView
          events={events}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEdit={handleEdit}
          onNew={handleNew}
          theme={theme}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  toggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  toggleText: { fontSize: 13, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
