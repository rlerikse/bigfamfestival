/**
 * AdminScheduleScreen — admin-only editable schedule view.
 * Shows all events across all days. Tap any event to edit it in AdminEventEdit.
 * This reuses the schedule layout but removes all user personalization — admin sees everything.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchEvents as fetchEventsFromService } from "../../services/eventsService";
import { AdminEvent } from '../../services/adminService';

const STAGE_COLORS: Record<string, string> = {
  'Main Stage': '#f59e0b',
  'Stage 2':    '#3b82f6',
  'Stage 3':    '#8b5cf6',
  'Stage 4':    '#10b981',
  'Tent':       '#ec4899',
};

export const AdminScheduleScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const { events: data } = await fetchEventsFromService();
      setEvents(data as any);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const onRefresh = () => { setRefreshing(true); fetchEvents(); };

  // Group by date
  const grouped = events.reduce<Record<string, AdminEvent[]>>((acc, ev) => {
    const key = ev.date ?? 'Unknown';
    (acc[key] = acc[key] ?? []).push(ev);
    return acc;
  }, {});

  const sections = Object.keys(grouped)
    .sort()
    .map(date => ({
      title: date,
      data: grouped[date].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
    }));

  const stageColor = (stage: string) =>
    STAGE_COLORS[stage] ?? theme.primary;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <SectionList
      style={[styles.container, { backgroundColor: theme.background }]}
      sections={sections}
      keyExtractor={ev => ev.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.headerBar}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Schedule Editor</Text>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('AdminEventEdit', {})}
            accessibilityLabel="Create new event"
          >
            <Text style={styles.newBtnText}>+ Event</Text>
          </TouchableOpacity>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={[styles.dateHeader, { color: theme.primary, backgroundColor: theme.background }]}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.eventRow, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('AdminEventEdit', { eventId: item.id })}
          accessibilityLabel={`Edit ${item.name}`}
        >
          <View style={[styles.stageTag, { backgroundColor: stageColor(item.stage) + '33', borderColor: stageColor(item.stage) }]}>
            <Text style={[styles.stageText, { color: stageColor(item.stage) }]} numberOfLines={1}>
              {item.stage}
            </Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={[styles.eventName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.eventTime, { color: theme.muted }]}>
              {item.startTime}–{item.endTime}
            </Text>
          </View>
          <Text style={[styles.editHint, { color: theme.primary }]}>Edit ›</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={[styles.empty, { color: theme.muted }]}>No events</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  newBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  dateHeader: { fontSize: 13, fontWeight: '700', paddingVertical: 8, letterSpacing: 0.5 },
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
    minWidth: 60,
    alignItems: 'center',
  },
  stageText: { fontSize: 10, fontWeight: '700' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  eventTime: { fontSize: 12 },
  editHint: { fontSize: 13, fontWeight: '600' },
  empty: { fontSize: 14 },
});
