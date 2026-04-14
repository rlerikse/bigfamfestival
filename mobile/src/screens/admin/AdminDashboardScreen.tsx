import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminStats, AdminStats } from '../../services/adminService';
import { AdminStatCard } from '../../components/admin/AdminStatCard';

export const AdminDashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // RBAC guard
  if (user?.role !== 'admin') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.denied, { color: theme.error ?? '#ef4444' }]}>
          🚫 Admin access required
        </Text>
      </View>
    );
  }

  const fetchStats = useCallback(async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const roleEntries = Object.entries(stats?.usersByRole ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <Text style={[styles.header, { color: theme.text }]}>Admin Dashboard</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>
        Big Fam Festival Control Panel
      </Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <AdminStatCard label="Total Users" value={stats?.totalUsers ?? 0} icon="👥" />
        <AdminStatCard label="Total Events" value={stats?.totalEvents ?? 0} icon="🎵" />
      </View>
      <View style={styles.statsRow}>
        <AdminStatCard label="Notifications" value={stats?.totalNotifications ?? 0} icon="🔔" />
        <AdminStatCard label="Roles" value={roleEntries.length} icon="🏷️" />
      </View>

      {/* Users by role */}
      {roleEntries.length > 0 && (
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Users by Role</Text>
          {roleEntries.map(([role, count]) => (
            <View key={role} style={styles.roleRow}>
              <Text style={[styles.roleLabel, { color: theme.muted }]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
              <Text style={[styles.roleCount, { color: theme.text }]}>{count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20, marginBottom: 8 }]}>
        Quick Actions
      </Text>
      <View style={styles.actionsGrid}>
        {[
          { label: '👤  Manage Users', screen: 'AdminUsers' },
          { label: '🎵  Manage Events', screen: 'AdminEvents' },
          { label: '🔔  Send Notification', screen: 'AdminNotifications' },
          { label: '🗓️  View Shifts', screen: 'AdminShifts' },
          { label: '📅  Edit Schedule', screen: 'AdminSchedule' },
        ].map(({ label, screen }) => (
          <TouchableOpacity
            key={screen}
            style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate(screen)}
            accessibilityLabel={label}
          >
            <Text style={[styles.actionText, { color: theme.text }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  denied: { fontSize: 16, fontWeight: '600' },
  header: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  statsRow: { flexDirection: 'row', marginBottom: 0 },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  roleLabel: { fontSize: 14 },
  roleCount: { fontSize: 14, fontWeight: '600' },
  actionsGrid: { gap: 10 },
  actionBtn: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: { fontSize: 15, fontWeight: '500' },
});
