import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminUser, updateAdminUser, AdminUser } from '../../services/adminService';
import { AdminRoleBadge } from '../../components/admin/AdminRoleBadge';

type RouteParams = { userId: string };

const ALL_ROLES = ['admin', 'staff', 'artist', 'director', 'vendor', 'volunteer', 'attendee'];

export const AdminUserDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const navigation = useNavigation<any>();
  const { userId } = route.params;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await getAdminUser(userId);
        setUser(u);
        setName(u.name ?? '');
        setPhone(u.phone ?? '');
        setRole(u.role ?? 'attendee');
        setNotificationsEnabled(u.notificationsEnabled ?? false);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load user');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAdminUser(userId, { name, phone, role, notificationsEnabled });
      Alert.alert('Saved', 'User updated successfully');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Read-only info */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Info</Text>
        <InfoRow label="Email" value={user?.email ?? '—'} theme={theme} />
        <InfoRow label="UID" value={user?.uid ?? '—'} theme={theme} mono />
        <InfoRow label="Ticket Type" value={user?.ticketType ?? '—'} theme={theme} />
        <InfoRow label="Created" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'} theme={theme} />
      </View>

      {/* Editable fields */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Edit Profile</Text>

        <Text style={[styles.label, { color: theme.muted }]}>Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={theme.muted}
          accessibilityLabel="User name"
        />

        <Text style={[styles.label, { color: theme.muted }]}>Phone</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          placeholderTextColor={theme.muted}
          keyboardType="phone-pad"
          accessibilityLabel="User phone"
        />

        <Text style={[styles.label, { color: theme.muted }]}>Role</Text>
        <View style={styles.roleGrid}>
          {ALL_ROLES.map(r => (
            <TouchableOpacity
              key={r}
              onPress={() => setRole(r)}
              style={[
                styles.roleOption,
                { borderColor: role === r ? theme.primary : theme.border },
                role === r && { backgroundColor: theme.primary + '22' },
              ]}
              accessibilityLabel={`Set role to ${r}`}
            >
              <AdminRoleBadge role={r} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: theme.muted, marginBottom: 0 }]}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: theme.primary }, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
        accessibilityLabel="Save user changes"
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>Save Changes</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
};

const InfoRow = ({
  label, value, theme, mono,
}: { label: string; value: string; theme: any; mono?: boolean }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: theme.text }, mono && styles.mono]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 4, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  roleOption: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  mono: { fontFamily: 'monospace', fontSize: 11 },
  saveBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
