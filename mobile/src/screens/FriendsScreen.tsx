/**
 * FriendsScreen.tsx
 *
 * Friend list, search, and request management screen.
 * - Search users by name/email
 * - View + accept/decline incoming requests
 * - View + cancel outgoing requests
 * - View friend list, remove friends
 *
 * All API access goes through `friendService.ts` — no direct endpoint calls.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation';
import {
  searchUsers,
  sendFriendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getFriends,
  removeFriend,
  UserSearchResult,
  FriendRequest,
  FriendEntry,
} from '../services/friendService';

type TabKey = 'friends' | 'requests' | 'search';

const FriendsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Friends'>>();
  // Optional callback wired in from MapScreen when opened for "select a friend to route to"
  const onSelectFriend = route.params?.onSelectFriend;

  const [activeTab, setActiveTab] = useState<TabKey>('friends');

  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());

  const loadAll = useCallback(async () => {
    console.log('[Friends UI] Loading friend list...');
    setLoading(true);
    try {
      const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
        getFriends(),
        getIncomingRequests(),
        getOutgoingRequests(),
      ]);
      setFriends(friendsRes);
      setIncoming(incomingRes);
      setOutgoing(outgoingRes);
      console.log(
        `[Friends UI] Loaded ${friendsRes.length} friend(s), ${incomingRes.length} incoming request(s), ${outgoingRes.length} outgoing request(s)`
      );
    } catch (err) {
      console.error('[FriendsScreen] Failed to load friends data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      return undefined;
    }, [loadAll])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  // ─── Search ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      console.log(`[Friends UI] Searching users for "${searchQuery.trim()}"...`);
      try {
        const results = await searchUsers(searchQuery);
        if (!cancelled) setSearchResults(results);
        console.log(`[Friends UI] Search returned ${results.length} result(s)`);
      } catch (err) {
        console.error('[FriendsScreen] Search failed', err);
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350); // debounce
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery]);

  const handleSendRequest = useCallback(async (userId: string) => {
    console.log(`[Friends UI] Sending friend request to user ${userId}...`);
    setPendingRequestIds(prev => new Set(prev).add(userId));
    try {
      await sendFriendRequest(userId);
      console.log(`[Friends UI] Friend request sent to user ${userId}`);
      const outgoingRes = await getOutgoingRequests();
      setOutgoing(outgoingRes);
    } catch (err) {
      console.error('[FriendsScreen] Failed to send friend request', err);
      Alert.alert('Could not send request', 'Please try again in a moment.');
    } finally {
      setPendingRequestIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }, []);

  const handleAccept = useCallback(async (requestId: string) => {
    console.log(`[Friends UI] Accepting friend request ${requestId}...`);
    try {
      await acceptFriendRequest(requestId);
      console.log(`[Friends UI] Accepted friend request ${requestId}`);
      await loadAll();
    } catch (err) {
      console.error('[FriendsScreen] Failed to accept request', err);
      Alert.alert('Could not accept request', 'Please try again in a moment.');
    }
  }, [loadAll]);

  const handleDecline = useCallback(async (requestId: string) => {
    console.log(`[Friends UI] Declining friend request ${requestId}...`);
    try {
      await declineFriendRequest(requestId);
      console.log(`[Friends UI] Declined friend request ${requestId}`);
      setIncoming(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('[FriendsScreen] Failed to decline request', err);
      Alert.alert('Could not decline request', 'Please try again in a moment.');
    }
  }, []);

  const handleCancelOutgoing = useCallback(async (requestId: string) => {
    console.log(`[Friends UI] Cancelling outgoing request ${requestId}...`);
    try {
      await cancelFriendRequest(requestId);
      console.log(`[Friends UI] Cancelled outgoing request ${requestId}`);
      setOutgoing(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('[FriendsScreen] Failed to cancel request', err);
      Alert.alert('Could not cancel request', 'Please try again in a moment.');
    }
  }, []);

  const handleRemoveFriend = useCallback((friend: FriendEntry) => {
    Alert.alert(
      'Remove friend?',
      `Remove ${friend.name} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            console.log(`[Friends UI] Removing friend ${friend.name} (${friend.userId})...`);
            try {
              await removeFriend(friend.userId);
              console.log(`[Friends UI] Removed friend ${friend.name}`);
              setFriends(prev => prev.filter(f => f.userId !== friend.userId));
            } catch (err) {
              console.error('[FriendsScreen] Failed to remove friend', err);
              Alert.alert('Could not remove friend', 'Please try again in a moment.');
            }
          },
        },
      ]
    );
  }, []);

  const handleFriendPress = useCallback((friend: FriendEntry) => {
    if (onSelectFriend) {
      console.log(`[Friends UI] Selected friend ${friend.name} — routing back to map`);
      onSelectFriend(friend);
      navigation.goBack();
    }
  }, [onSelectFriend, navigation]);

  // ─── Render helpers ──────────────────────────────────────────────────────

  const renderAvatar = (name: string, url?: string, size = 44) => {
    if (url) {
      return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    }
    const initial = name?.trim()?.charAt(0)?.toUpperCase() || '?';
    return (
      <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.avatarFallbackText}>{initial}</Text>
      </View>
    );
  };

  const requestAlreadySent = useCallback(
    (userId: string) => outgoing.some(r => r.toUserId === userId) || friends.some(f => f.userId === userId),
    [outgoing, friends]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color="#F5F5DC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {onSelectFriend ? 'Route to a Friend' : 'Friends'}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['friends', 'requests', 'search'] as TabKey[]).map(tab => {
          const label = tab === 'friends' ? 'Friends' : tab === 'requests' ? 'Requests' : 'Add Friend';
          const badgeCount = tab === 'requests' ? incoming.length : 0;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{label}</Text>
              {badgeCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{badgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Friends tab */}
      {activeTab === 'friends' && (
        loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#F5F5DC" />
        ) : (
          <FlatList
            data={friends}
            keyExtractor={f => f.userId}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F5F5DC" />}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={40} color="rgba(245,245,220,0.4)" />
                <Text style={styles.emptyStateText}>
                  No friends yet. Head to the &quot;Add Friend&quot; tab to search and send requests.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={onSelectFriend ? 0.6 : 1}
                onPress={() => handleFriendPress(item)}
                disabled={!onSelectFriend}
              >
                {renderAvatar(item.name, item.profilePictureUrl)}
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSubtitle}>Friends since {new Date(item.addedAt).toLocaleDateString()}</Text>
                </View>
                {onSelectFriend ? (
                  <Ionicons name="navigate" size={20} color="#6BBF59" />
                ) : (
                  <TouchableOpacity
                    onPress={() => handleRemoveFriend(item)}
                    style={styles.iconAction}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="person-remove-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
          />
        )
      )}

      {/* Requests tab */}
      {activeTab === 'requests' && (
        loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#F5F5DC" />
        ) : (
          <FlatList
            data={[
              ...incoming.map(r => ({ ...r, kind: 'incoming' as const })),
              ...outgoing.map(r => ({ ...r, kind: 'outgoing' as const })),
            ]}
            keyExtractor={r => `${r.kind}-${r.id}`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F5F5DC" />}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={40} color="rgba(245,245,220,0.4)" />
                <Text style={styles.emptyStateText}>No pending friend requests.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={[styles.avatarFallback, { width: 44, height: 44, borderRadius: 22 }]}>
                  <Ionicons name={item.kind === 'incoming' ? 'arrow-down' : 'arrow-up'} size={20} color="#F5F5DC" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>
                    {item.kind === 'incoming' ? 'Incoming request' : 'Request sent'}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {item.kind === 'incoming' ? `From user ${item.fromUserId}` : `To user ${item.toUserId}`}
                  </Text>
                </View>
                {item.kind === 'incoming' ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => handleAccept(item.id)} style={[styles.pillButton, styles.acceptPill]}>
                      <Ionicons name="checkmark" size={16} color="#0A1F0A" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDecline(item.id)} style={[styles.pillButton, styles.declinePill]}>
                      <Ionicons name="close" size={16} color="#F5F5DC" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => handleCancelOutgoing(item.id)} style={[styles.pillButton, styles.declinePill]}>
                    <Text style={styles.pillButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )
      )}

      {/* Search / Add friend tab */}
      {activeTab === 'search' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="rgba(245,245,220,0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              placeholderTextColor="rgba(245,245,220,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color="#F5F5DC" />}
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={u => u.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ListEmptyComponent={
              searchQuery.trim().length >= 2 && !searching ? (
                <View style={styles.emptyState}>
                  <Ionicons name="person-outline" size={40} color="rgba(245,245,220,0.4)" />
                  <Text style={styles.emptyStateText}>No users found for &quot;{searchQuery}&quot;.</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={40} color="rgba(245,245,220,0.4)" />
                  <Text style={styles.emptyStateText}>Type at least 2 characters to search for friends.</Text>
                </View>
              )
            }
            renderItem={({ item }) => {
              const alreadySent = requestAlreadySent(item.id);
              const isSending = pendingRequestIds.has(item.id);
              return (
                <View style={styles.row}>
                  {renderAvatar(item.name, item.profilePictureUrl)}
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleSendRequest(item.id)}
                    disabled={alreadySent || isSending}
                    style={[styles.pillButton, alreadySent ? styles.pillButtonDisabled : styles.acceptPill]}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="#0A1F0A" />
                    ) : (
                      <Text style={[styles.pillButtonText, alreadySent && { color: 'rgba(245,245,220,0.5)' }]}>
                        {alreadySent ? 'Pending' : 'Add'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14221C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 26,
  },
  headerTitle: {
    color: '#F5F5DC',
    fontSize: 18,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(28,43,32,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(107,191,89,0.25)',
  },
  tabLabel: {
    color: 'rgba(245,245,220,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#F5F5DC',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28,43,32,0.6)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: '#F5F5DC',
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: 'rgba(245,245,220,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  avatarFallback: {
    backgroundColor: 'rgba(107,191,89,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#F5F5DC',
    fontWeight: '700',
  },
  iconAction: {
    padding: 6,
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  pillButtonDisabled: {
    backgroundColor: 'rgba(245,245,220,0.1)',
  },
  acceptPill: {
    backgroundColor: '#6BBF59',
  },
  declinePill: {
    backgroundColor: 'rgba(239,68,68,0.25)',
  },
  pillButtonText: {
    color: '#F5F5DC',
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(28,43,32,0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: '#F5F5DC',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyStateText: {
    color: 'rgba(245,245,220,0.55)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default FriendsScreen;
