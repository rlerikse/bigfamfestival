import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { listAdminUsers, AdminUser } from '../../services/adminService';
import { AdminSearchBar } from '../../components/admin/AdminSearchBar';
import { AdminRoleBadge } from '../../components/admin/AdminRoleBadge';

const ROLES = ['all', 'admin', 'staff', 'artist', 'director', 'vendor', 'volunteer', 'attendee'];

export const AdminUsersScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const res = await listAdminUsers({
        search: search || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        page: pageNum,
        limit: 20,
      });
      setUsers(prev => reset ? res.users : [...prev, ...res.users]);
      setTotal(res.total);
      setPage(pageNum);
    } catch (e) {
      // silently fail on load-more
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(1, true), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchUsers]);

  const onRefresh = () => { setRefreshing(true); fetchUsers(1, true); };

  const onEndReached = () => {
    if (!loadingMore && users.length < total) {
      setLoadingMore(true);
      fetchUsers(page + 1);
    }
  };

  const renderItem = ({ item }: { item: AdminUser }) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => navigation.navigate('AdminUserDetail', { userId: item.id })}
      accessibilityLabel={`View user ${item.name}`}
    >
      <View style={[styles.avatar, { backgroundColor: theme.primary + '33' }]}>
        <Text style={[styles.avatarText, { color: theme.primary }]}>
          {(item.name?.[0] ?? item.email?.[0] ?? '?').toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name || '(no name)'}</Text>
        <Text style={[styles.email, { color: theme.muted }]} numberOfLines={1}>{item.email}</Text>
      </View>
      <AdminRoleBadge role={item.role} small />
      <Text style={[styles.chevron, { color: theme.muted }]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <AdminSearchBar value={search} onChangeText={setSearch} placeholder="Search by name or email…" />
        <FlatList
          horizontal
          data={ROLES}
          keyExtractor={r => r}
          showsHorizontalScrollIndicator={false}
          style={styles.roleFilters}
          renderItem={({ item: r }) => (
            <TouchableOpacity
              onPress={() => setRoleFilter(r)}
              style={[
                styles.chip,
                { backgroundColor: roleFilter === r ? theme.primary : theme.card, borderColor: theme.border },
              ]}
              accessibilityLabel={`Filter by ${r}`}
            >
              <Text style={[styles.chipText, { color: roleFilter === r ? '#fff' : theme.text }]}>
                {r}
              </Text>
            </TouchableOpacity>
          )}
        />
        <Text style={[styles.count, { color: theme.muted }]}>{total} users</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.empty, { color: theme.muted }]}>No users found</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} style={styles.footer} /> : null}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 0 },
  roleFilters: { marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  chipText: { fontSize: 12, fontWeight: '500' },
  count: { fontSize: 12, marginBottom: 8 },
  list: { padding: 16, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  email: { fontSize: 12 },
  chevron: { fontSize: 22, marginLeft: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { fontSize: 14 },
  footer: { paddingVertical: 16 },
});
