import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { deleteAdminEvent, listAdminEvents, AdminEvent } from '../../services/adminService';
import { AdminSearchBar } from '../../components/admin/AdminSearchBar';

export const AdminEventsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [filtered, setFiltered] = useState<AdminEvent[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await listAdminEvents();
      setEvents(data as any);
      setFiltered(data as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(events.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.stage?.toLowerCase().includes(q)
    ));
  }, [search, events]);

  const onRefresh = () => { setRefreshing(true); fetchEvents(); };

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

  const renderItem = ({ item }: { item: AdminEvent }) => (
    <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity
        style={styles.rowMain}
        onPress={() => navigation.navigate('AdminEventEdit', { eventId: item.id })}
        accessibilityLabel={`Edit event ${item.name}`}
      >
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.meta, { color: theme.muted }]}>
          {item.stage} • {item.date} {item.startTime}–{item.endTime}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        style={[styles.deleteBtn, { borderColor: '#ef4444' + '44' }]}
        accessibilityLabel={`Delete event ${item.name}`}
      >
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <View style={styles.searchWrap}>
          <AdminSearchBar value={search} onChangeText={setSearch} placeholder="Search events…" />
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('AdminEventEdit', {})}
          accessibilityLabel="Create new event"
        >
          <Text style={styles.addText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={e => e.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.empty, { color: theme.muted }]}>No events found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', padding: 16, paddingBottom: 0, alignItems: 'flex-start', gap: 8 },
  searchWrap: { flex: 1 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginTop: 0 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: 16, paddingTop: 8 },
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
    padding: 16,
    borderLeftWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#ef4444', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { fontSize: 14 },
});
