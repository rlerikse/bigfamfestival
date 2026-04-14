import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  listAdminShifts, createAdminShift, deleteAdminShift, AdminShift,
} from '../../services/adminService';

const EMPTY_SHIFT = {
  userId: '', userName: '', role: 'staff',
  date: '', startTime: '', endTime: '', location: '', stage: '', notes: '',
};

export const AdminShiftsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [shifts, setShifts] = useState<AdminShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_SHIFT });
  const [saving, setSaving] = useState(false);

  const fetchShifts = useCallback(async () => {
    try {
      const data = await listAdminShifts({
        date: dateFilter || undefined,
        role: roleFilter || undefined,
      });
      setShifts(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateFilter, roleFilter]);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const onRefresh = () => { setRefreshing(true); fetchShifts(); };

  const handleDelete = (shift: AdminShift) => {
    Alert.alert('Delete Shift', `Delete ${shift.userName}'s shift on ${shift.date}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminShift(shift.id);
            setShifts(prev => prev.filter(s => s.id !== shift.id));
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleCreate = async () => {
    if (!form.userName || !form.date || !form.location) {
      Alert.alert('Validation', 'Name, date, and location required');
      return;
    }
    setSaving(true);
    try {
      const created = await createAdminShift(form);
      setShifts(prev => [created, ...prev]);
      setShowCreate(false);
      setForm({ ...EMPTY_SHIFT });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create shift');
    } finally {
      setSaving(false);
    }
  };

  // Group by date
  const grouped = shifts.reduce<Record<string, AdminShift[]>>((acc, s) => {
    (acc[s.date] = acc[s.date] ?? []).push(s);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Filters */}
      <View style={styles.filters}>
        <TextInput
          style={[styles.filterInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          value={dateFilter}
          onChangeText={setDateFilter}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor={theme.muted}
          accessibilityLabel="Filter by date"
        />
        <TextInput
          style={[styles.filterInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          value={roleFilter}
          onChangeText={setRoleFilter}
          placeholder="Role filter"
          placeholderTextColor={theme.muted}
          accessibilityLabel="Filter by role"
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => setShowCreate(true)}
          accessibilityLabel="Create shift"
        >
          <Text style={styles.addText}>+ Shift</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>
      ) : (
        <FlatList
          data={dates}
          keyExtractor={d => d}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.empty, { color: theme.muted }]}>No shifts found</Text>
            </View>
          }
          renderItem={({ item: date }) => (
            <View>
              <Text style={[styles.dateHeader, { color: theme.primary }]}>{date}</Text>
              {grouped[date].map(shift => (
                <View key={shift.id} style={[styles.shiftRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.shiftInfo}>
                    <Text style={[styles.shiftName, { color: theme.text }]}>{shift.userName}</Text>
                    <Text style={[styles.shiftMeta, { color: theme.muted }]}>
                      {shift.role} • {shift.startTime}–{shift.endTime} • {shift.location}
                      {shift.stage ? ` (${shift.stage})` : ''}
                    </Text>
                    {shift.notes ? (
                      <Text style={[styles.shiftNotes, { color: theme.muted }]}>{shift.notes}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(shift)}
                    accessibilityLabel={`Delete shift for ${shift.userName}`}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        />
      )}

      {/* Create shift modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <ScrollView
          style={[styles.modal, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.modalTitle, { color: theme.text }]}>New Shift</Text>
          {[
            { label: 'Staff Name *', key: 'userName', placeholder: 'Full name' },
            { label: 'User ID', key: 'userId', placeholder: 'Firebase UID (optional)' },
            { label: 'Role', key: 'role', placeholder: 'staff / volunteer / etc.' },
            { label: 'Date * (YYYY-MM-DD)', key: 'date', placeholder: '2025-08-15' },
            { label: 'Start Time (HH:MM)', key: 'startTime', placeholder: '08:00' },
            { label: 'End Time (HH:MM)', key: 'endTime', placeholder: '16:00' },
            { label: 'Location *', key: 'location', placeholder: 'Main Gate, Stage 2, etc.' },
            { label: 'Stage', key: 'stage', placeholder: 'Optional' },
            { label: 'Notes', key: 'notes', placeholder: 'Any notes' },
          ].map(({ label, key, placeholder }) => (
            <View key={key}>
              <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                value={(form as any)[key]}
                onChangeText={v => setForm(prev => ({ ...prev, [key]: v }))}
                placeholder={placeholder}
                placeholderTextColor={theme.muted}
                accessibilityLabel={label}
              />
            </View>
          ))}

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={() => { setShowCreate(false); setForm({ ...EMPTY_SHIFT }); }}
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              style={[styles.saveBtn, { backgroundColor: theme.primary }, saving && { opacity: 0.7 }]}
              disabled={saving}
              accessibilityLabel="Save shift"
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Create Shift</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { flexDirection: 'row', padding: 12, gap: 6, alignItems: 'center' },
  filterInput: {
    flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 13,
  },
  addBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: 16, paddingTop: 4, paddingBottom: 40 },
  dateHeader: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 6, letterSpacing: 0.5 },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 6,
  },
  shiftInfo: { flex: 1 },
  shiftName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  shiftMeta: { fontSize: 12 },
  shiftNotes: { fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  deleteText: { color: '#ef4444', fontSize: 18, paddingLeft: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { fontSize: 14 },
  modal: { flex: 1 },
  modalContent: { padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
