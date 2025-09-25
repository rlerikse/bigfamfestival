// Commit: Replace Messages screen with Notifications placeholder screen
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import TopNavBar from '../components/TopNavBar';
import NotificationHistoryItem from '../components/NotificationHistoryItem';
import firestore, { 
  collection, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  query, 
  limit as fsLimit 
} from '../utils/firebaseCompat';
import { api } from '../services/api';

/**
 * Notifications screen with added admin functionality to send broadcast notifications
 */
const NotificationsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isGuestUser } = useAuth();
  const isGuest = React.useMemo(
    () => (typeof isGuestUser === 'function' ? isGuestUser() : !user),
    [isGuestUser, user]
  );
  const isAdmin = user?.role === 'admin';

  // Local types to avoid name collision with component import
  interface NotificationHistoryEntry {
    id: string;
    title: string;
    body: string;
    sentAt:
      | {
          _seconds: number;
          _nanoseconds: number;
        }
      | string;
    category?: string;
    priority?: 'normal' | 'high';
  }

  const [notificationHistory, setNotificationHistory] = useState<
    NotificationHistoryEntry[]
  >([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [usePolling, setUsePolling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localTriggered, setLocalTriggered] = useState<NotificationHistoryEntry[]>([]);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  // Prevent repeated API calls/logs when backend forbids access (e.g., non-admin users)
  const apiForbiddenRef = useRef<boolean>(false);

  // Normalize backend categories to UI-friendly categories
  const normalizeCategory = useCallback((cat?: string): string | undefined => {
    if (!cat) return cat;
    const c = cat.toLowerCase();
    if (c === 'announcement' || c === 'announcements' || c === 'broadcast') {
      // Use 'promotion' to leverage megaphone icon mapping in NotificationHistoryItem
      return 'promotion';
    }
    return cat;
  }, []);

  // Helper to normalize to ISO string for sorting
  const toIso = useCallback((v: NotificationHistoryEntry['sentAt']): string => {
    if (typeof v === 'string') return v;
    if (v && typeof (v as { _seconds?: number })._seconds === 'number') {
      return new Date((v as { _seconds: number })._seconds * 1000).toISOString();
    }
    return new Date().toISOString();
  }, []);

  // Build a stable dedupe key so server-saved notifications don't show twice
  const makeKey = useCallback((item: NotificationHistoryEntry) => {
    const ts = Date.parse(toIso(item.sentAt));
    const bucket = Number.isFinite(ts) ? Math.floor(ts / 60000) : 0; // minute bucket
    const title = (item.title || '').trim().toLowerCase();
    const body = (item.body || '').trim().toLowerCase();
    const category = (item.category || '').trim().toLowerCase();
    return `${category}|${title}|${body}|${bucket}`;
  }, [toIso]);

  // Persist previous notification IDs between renders to only trigger local push for new notifications
  const previousIdsRef = useRef<Set<string>>(new Set());

  // Load previously seen notification IDs from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('seen_notification_ids');
        if (stored) {
          const ids = JSON.parse(stored) as string[];
          previousIdsRef.current = new Set(ids);
        }
      } catch (e) {
        // Ignore storage errors
      }
    })();
  }, []);

  // Persist seen notification IDs to storage
  const persistSeenIds = useCallback(async (ids: Set<string>) => {
    try {
      await AsyncStorage.setItem('seen_notification_ids', JSON.stringify(Array.from(ids)));
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const fetchFromApi = React.useCallback(async () => {
    // Only admins should call /notifications; guests and attendees skip
    if (isGuest || !isAdmin) {
      setIsLoadingHistory(false);
      return;
    }
    if (apiForbiddenRef.current) {
      // API is forbidden for this user (likely non-admin); avoid spamming requests/logs
      setIsLoadingHistory(false);
      return;
    }
    try {
      setIsLoadingHistory(true);
      const response = await api.get('/notifications?limit=10');
      const raw = Array.isArray(response.data)
        ? (response.data as unknown[])
        : ((response.data?.items as unknown[]) || []);
      const items: NotificationHistoryEntry[] = raw.map((it) => {
        const asItem = it as Partial<NotificationHistoryEntry> & { sentAt?: unknown } & { id?: string };
        const sentAtVal = asItem?.sentAt as unknown;
        let sentAt: string | { _seconds: number; _nanoseconds: number } = new Date().toISOString();
        if (sentAtVal) {
          if (typeof sentAtVal === 'string') {
            sentAt = sentAtVal;
          } else if ((sentAtVal as { _seconds?: number })._seconds) {
            sentAt = new Date((sentAtVal as { _seconds: number })._seconds * 1000).toISOString();
          }
        }
        const rawCategory = asItem.category || ((asItem.id || '').startsWith('local-') ? 'my_schedule' : undefined);
        return {
          id: asItem.id || '',
          title: asItem.title || '',
          body: asItem.body || '',
          sentAt,
          category: normalizeCategory(rawCategory),
          priority: asItem.priority,
        } as NotificationHistoryEntry;
      });
      setNotificationHistory(items);
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401 || status === 403) {
        apiForbiddenRef.current = true;
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.info('Notifications API forbidden for this user; disabling API fallback/polling.');
        }
        // If we were polling due to Firestore denial, stop polling to prevent repeated 403s
        if (usePolling) setUsePolling(false);
      } else if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Fallback notifications fetch failed:', error);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }, [normalizeCategory, isGuest, isAdmin, usePolling]);

  useEffect(() => {
    setIsLoadingHistory(true);
    try {
      const q = query(
        collection(firestore, 'notifications'),
        orderBy('sentAt', 'desc'),
        fsLimit(10)
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: NotificationHistoryEntry[] = snapshot.docs.map((doc) => {
            const raw = doc.data() as Record<string, unknown>;
            const sentAtVal = (raw as { sentAt?: unknown }).sentAt;
            let sentAt: string | { _seconds: number; _nanoseconds: number } = new Date().toISOString();
            if (sentAtVal) {
              if (typeof sentAtVal === 'string') {
                sentAt = sentAtVal;
              } else if (
                typeof (sentAtVal as { toDate?: () => Date }).toDate === 'function'
              ) {
                sentAt = (sentAtVal as { toDate: () => Date }).toDate().toISOString();
              } else if (
                (sentAtVal as { seconds?: number; _seconds?: number }).seconds ||
                (sentAtVal as { seconds?: number; _seconds?: number })._seconds
              ) {
                const secs =
                  (sentAtVal as { seconds?: number; _seconds?: number }).seconds ?? 
                  (sentAtVal as { seconds?: number; _seconds?: number })._seconds ?? 0;
                sentAt = new Date(secs * 1000).toISOString();
              }
            }
            return {
              id: doc.id,
              title: (raw.title as string) || '',
              body: (raw.body as string) || '',
              sentAt,
              category: normalizeCategory(raw.category as string | undefined),
              priority: raw.priority as 'normal' | 'high' | undefined,
            } as NotificationHistoryEntry;
          });

          // Track seen notification IDs for deduplication (but don't trigger local push - NotificationListener handles that)
          const currentIds = new Set(items.map((item) => item.id));
          previousIdsRef.current = currentIds;
          // Persist the seen IDs to storage
          persistSeenIds(currentIds);

          setNotificationHistory(items);
          setIsLoadingHistory(false);
        },
        (error) => {
          setIsLoadingHistory(false);
          if ((error as { code?: string }).code === 'permission-denied') {/* Lines 303-314 omitted */}
          // Other errors (network, etc.)
          if (__DEV__) {/* Lines 317-319 omitted */}
        }
      );
      return () => {
        unsubscribe();
      };
    } catch (err) {
      setIsLoadingHistory(false);
      if (isAdmin && !apiForbiddenRef.current) {
        setUsePolling(true);
        fetchFromApi();
      }
      return () => {
        /* no-op */
      };
    }
  }, [fetchFromApi, usePolling, normalizeCategory, isAdmin, persistSeenIds]);

  const mergedHistory = useMemo(() => {
    // Prefer server history items over local duplicates (same title/body/time bucket/category)
    const map = new Map<string, NotificationHistoryEntry>();
    for (const it of notificationHistory) {
      map.set(makeKey(it), it);
    }
    for (const it of localTriggered) {
      // Only merge locally-captured schedule reminders; skip globals to avoid duplicates
      const normalizedCat = normalizeCategory(it.category);
      if (normalizedCat !== 'my_schedule') continue;
      const normalizedItem: NotificationHistoryEntry = { ...it, category: normalizedCat };
      const key = makeKey(normalizedItem);
      if (!map.has(key)) map.set(key, normalizedItem);
    }
    const result = Array.from(map.values());
    result.sort(
      (a, b) => new Date(toIso(b.sentAt)).getTime() - new Date(toIso(a.sentAt)).getTime()
    );
    return result;
  }, [localTriggered, notificationHistory, makeKey, toIso, normalizeCategory]);

  // Load and persist dismissed keys
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('dismissed_notifications_keys');
        if (raw) {
          const arr = JSON.parse(raw) as string[];
          setDismissedKeys(new Set(arr));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const persistDismissed = useCallback(async (next: Set<string>) => {
    try {
      await AsyncStorage.setItem('dismissed_notifications_keys', JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = useCallback((item: NotificationHistoryEntry) => {
    const key = makeKey(item);
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      // persist async (fire and forget)
      persistDismissed(next);
      return next;
    });
  }, [makeKey, persistDismissed]);

  const visibleHistory = useMemo(() => {
    if (!dismissedKeys.size) return mergedHistory;
    return mergedHistory.filter((it) => !dismissedKeys.has(makeKey(it)));
  }, [mergedHistory, dismissedKeys, makeKey]);

  // Persist visible notifications count for global badge indicator
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          'visible_notifications_count',
          String(visibleHistory.length)
        );
      } catch {
        // ignore
      }
    })();
  }, [visibleHistory.length]);

  const handleDismissAll = useCallback(() => {
    if (!visibleHistory.length) return;
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      for (const it of visibleHistory) {
        next.add(makeKey(it));
      }
      persistDismissed(next);
      return next;
    });
  }, [visibleHistory, makeKey, persistDismissed]);

  // Polling fallback when Firestore rules block realtime reads
  useEffect(() => {
    if (!usePolling || isGuest || !isAdmin || apiForbiddenRef.current) return;
    const intervalId = setInterval(() => {
      fetchFromApi();
    }, 30000);
    // Do an extra fetch when polling turns on
    fetchFromApi();
    return () => clearInterval(intervalId);
  }, [usePolling, fetchFromApi, normalizeCategory, isGuest, isAdmin]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (isGuest || !isAdmin || apiForbiddenRef.current) {
        // Nothing to fetch for guests/attendees; rely on local-triggered notifications
        return;
      }
      if (usePolling) {
        await fetchFromApi();
      } else {
        // One-time Firestore fetch mirroring the live query
        const q = query(
          collection(firestore, 'notifications'),
          orderBy('sentAt', 'desc'),
          fsLimit(10)
        );
        const snap = await getDocs(q);
        const items: NotificationHistoryEntry[] = snap.docs.map((doc) => {
          const raw = doc.data() as Record<string, unknown>;
          const sentAtVal = (raw as { sentAt?: unknown }).sentAt;
          let sentAt: string | { _seconds: number; _nanoseconds: number } = new Date().toISOString();
          if (sentAtVal) {
            if (typeof sentAtVal === 'string') {
              sentAt = sentAtVal;
            } else if (typeof (sentAtVal as { toDate?: () => Date }).toDate === 'function') {
              sentAt = (sentAtVal as { toDate: () => Date }).toDate().toISOString();
            } else if (
              (sentAtVal as { seconds?: number; _seconds?: number }).seconds ||
              (sentAtVal as { seconds?: number; _seconds?: number })._seconds
            ) {
              const secs =
                (sentAtVal as { seconds?: number; _seconds?: number }).seconds ??
                (sentAtVal as { seconds?: number; _seconds?: number })._seconds ?? 0;
              sentAt = new Date(secs * 1000).toISOString();
            }
          }
          return {
            id: doc.id,
            title: (raw.title as string) || '',
            body: (raw.body as string) || '',
            sentAt,
            category: normalizeCategory(raw.category as string | undefined),
            priority: raw.priority as 'normal' | 'high' | undefined,
          } as NotificationHistoryEntry;
        });
        setNotificationHistory(items);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [usePolling, fetchFromApi, normalizeCategory, isGuest, isAdmin]);

  // Capture locally-triggered MySchedule notifications when this screen is mounted
  useEffect(() => {
    // Load persisted local notifications
    (async () => {
      try {
        const key = 'local_notifications_log';
        const existing = await AsyncStorage.getItem(key);
        const arr = existing ? (JSON.parse(existing) as NotificationHistoryEntry[]) : [];
        // Dedupe by id just in case
        const byId = new Map(arr.map((i) => [i.id, i] as const));
        setLocalTriggered(Array.from(byId.values()));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load local notifications log:', e);
      }
    })();

    // No need for duplicate notification listener - NotificationListener component handles this globally
  }, [normalizeCategory]);

  // Keep local log fresh on screen focus
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const key = 'local_notifications_log';
          const existing = await AsyncStorage.getItem(key);
          const arr = existing ? (JSON.parse(existing) as NotificationHistoryEntry[]) : [];
          // Dedupe by id
          const byId = new Map(arr.map((i) => [i.id, i] as const));
          if (mounted) setLocalTriggered(Array.from(byId.values()));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to refresh local notifications log on focus:', e);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['left', 'right', 'bottom']}
    >
  <TopNavBar whiteIcons={isDark} unreadCount={visibleHistory.length} />
      
      {/* Admin controls moved to Settings screen */}
      
      <ScrollView
        style={{ marginTop: insets.top + 55 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View style={[styles.innerContainer, (visibleHistory.length === 0) && styles.centeredFill]}>
        {/* Placeholder header: show when empty (initial/empty state); hide during pull-to-refresh */}
  {!isRefreshing && visibleHistory.length === 0 ? (
          <View style={styles.headerContent}>
            <Ionicons
              name="notifications-outline"
              size={80}
              color={theme.muted || '#666666'}
            />
            <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
            <Text style={[styles.description, { color: theme.muted }]}>
              Stay updated with festival announcements, artist updates, and important information.
            </Text>
          </View>
        ) : null}

        <View style={styles.historySection}>
          {(isLoadingHistory && visibleHistory.length > 0) ? (
            <ActivityIndicator style={styles.historyLoader} color={theme.primary} />
          ) : visibleHistory.length > 0 ? (
            <View
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 4,
              }}
            >
              {visibleHistory.map((item) => (
                <NotificationHistoryItem
                  key={item.id}
                  title={item.title}
                  body={item.body}
                  sentAt={
                    typeof item.sentAt === 'string'
                      ? item.sentAt
                      : item.sentAt._seconds
                      ? new Date(item.sentAt._seconds * 1000).toISOString()
                      : new Date().toISOString()
                  }
                  category={item.category}
                  priority={item.priority}
                  onDismiss={() => handleDismiss(item)}
                  isDark={isDark}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Footer actions */}
        {visibleHistory.length > 0 ? (
          <View style={styles.footer}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleDismissAll}
              style={styles.footerLinkButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  styles.footerLinkText,
                  { color: theme.primary },
                ]}
              >
                Dismiss All
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 96, // extra bottom padding for footer button
    flexGrow: 1,
  },
  innerContainer: {
    flexGrow: 1,
  },
  centeredFill: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  historySection: {
    marginTop: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  historyLoader: {
    marginVertical: 20,
  },
  noHistoryText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 16,
    paddingBottom: 16,
  },
  footerLinkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerLinkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationsScreen;
