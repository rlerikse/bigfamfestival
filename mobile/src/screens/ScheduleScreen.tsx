// Commit: Refactor schedule and my schedule into unified ScheduleScreen with new filter UI
// Author: GitHub Copilot, 2025-06-30

/**
 * ScheduleScreen
 * Shows all events with filters for date, stage (dropdown), and "My Schedule" (favorites).
 * UI matches new design: date row, then grid icon + My Schedule filter, then stage dropdown.
 * Replaces HomeScreen and MyScheduleScreen logic.
 */
import React, { useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { addToSchedule, removeFromSchedule, getUserSchedule } from '../services/scheduleService';
import { api } from '../services/api';
import EventDetailsModal from '../components/EventDetailsModal';
import TopNavBar from '../components/TopNavBar';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { homeScreenStyles as filterStyles } from './HomeScreen.styles';
import EventCard from '../components/EventCard';
import { ScheduleEvent } from '../types/event';
import { isLoggedInUser } from '../utils/userUtils';
import firestore, { collection, getDocs } from '../utils/firebaseCompat';
import genreService from '../services/genreService';

type ScheduleScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

// Consolidate filter states into a reducer for atomic updates
interface FilterState {
  selectedDay: string;
  selectedStages: string[];
  selectedGenres: string[];
  showMySchedule: boolean;
}

type FilterAction =
  | { type: 'SET_SELECTED_DAY'; payload: string }
  | { type: 'SET_SELECTED_STAGES'; payload: string[] }
  | { type: 'SET_SELECTED_GENRES'; payload: string[] }
  | { type: 'TOGGLE_MY_SCHEDULE' }
  | { type: 'RESET_FILTERS'; payload?: string };

const initialFilterState: FilterState = {
  selectedDay: '',
  selectedStages: ['all'],
  selectedGenres: ['all'],
  showMySchedule: false,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SELECTED_DAY':
      return { ...state, selectedDay: action.payload };
    case 'SET_SELECTED_STAGES':
      return { ...state, selectedStages: action.payload };
    case 'SET_SELECTED_GENRES':
      return { ...state, selectedGenres: action.payload };
    case 'TOGGLE_MY_SCHEDULE':
      return { ...state, showMySchedule: !state.showMySchedule };
    case 'RESET_FILTERS':
      return { ...initialFilterState, selectedDay: action.payload || '' };
    default:
      return state;
  }
}

// Days to show in the filter buttons (Friday, Saturday, Sunday)
const festivalDays = [
  { id: '2025-09-26', date: '2025-09-26', dayLabel: 'Sep 26', dayAbbrev: 'FRI', staffOnly: false },
  { id: '2025-09-27', date: '2025-09-27', dayLabel: 'Sep 27', dayAbbrev: 'SAT', staffOnly: false },
  { id: '2025-09-28', date: '2025-09-28', dayLabel: 'Sep 28', dayAbbrev: 'SUN', staffOnly: false },
];

// All days we need to fetch events for (includes Monday for late-night events)
// Currently not used since API fetches all events at once
/*
const allFestivalDays = [
  { id: '2025-09-26', date: '2025-09-26', dayLabel: 'Sep 26', dayAbbrev: 'FRI', staffOnly: false },
  { id: '2025-09-27', date: '2025-09-27', dayLabel: 'Sep 27', dayAbbrev: 'SAT', staffOnly: false },
  { id: '2025-09-28', date: '2025-09-28', dayLabel: 'Sep 28', dayAbbrev: 'SUN', staffOnly: false },
  { id: '2025-09-29', date: '2025-09-29', dayLabel: 'Sep 29', dayAbbrev: 'MON', staffOnly: false },
];
*/

// Styles for the event cards (MySchedule style)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateFilterButton: {
    height: 50,
    minHeight: 50,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  dateFilterButtonText: {
    fontSize: 14, // Adjusted for new height
    fontWeight: '700', // Thicker weight for day abbreviation
    textAlign: 'center',
    lineHeight: 18, // Adjusted for new height
  },
  dateFilterButtonDateText: {
    fontSize: 11, // Adjusted for new height
    fontWeight: '600', // Lighter weight for the date
    textAlign: 'center',
    lineHeight: 14, // Adjusted for new height
  },
  listContentContainer: {
    flexGrow: 1,
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  eventImage: {
    width: 100,
    height: 100,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  eventDetails: {
    fontSize: 13,
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  heartButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginRight: 4,
  },
  favoriteText: {
    marginLeft: 0,
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

const ScheduleScreen = () => {
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<ScheduleScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSchedule, setUserSchedule] = useState<Record<string, boolean>>({});
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filterState, dispatchFilter] = useReducer(filterReducer, initialFilterState);
  const { selectedDay, selectedStages, selectedGenres, showMySchedule } = filterState;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // Current time ticker for countdown badges
  const [now, setNow] = useState<number>(Date.now());
  // FlatList ref for programmatic scrolling to live events
  const flatListRef = useRef<FlatList<ScheduleEvent>>(null);
  const previousDayRef = useRef<string | null>(null);

  // Update current time every minute to refresh countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to check if user has staff privileges
  const isStaffUser = useCallback(() => {
    if (!user) return false;
    const staffRoles = ['admin', 'staff', 'artist', 'vendor', 'volunteer'];
    return user.role && staffRoles.includes(user.role.toLowerCase());
  }, [user]);

  // Get filtered festival days based on user role - memoized to prevent unnecessary recalculations
  const visibleFestivalDays = useMemo(() => {
    if (isStaffUser()) {
      return festivalDays; // Show all days including staff-only ones
    }
    return festivalDays.filter(day => !day.staffOnly); // Show only public days
  }, [isStaffUser]);

  // Memoize only needed theme properties to prevent unnecessary re-renders
  const themeColors = useMemo(() => ({
    border: theme.border,
    card: theme.card,
    text: theme.text,
    muted: theme.muted
  }), [theme.border, theme.card, theme.text, theme.muted]);

  // Precompute date-related constants to avoid repeated calculations
  const dateConstants = useMemo(() => {
    const cutoffTimeInMinutes = 6 * 60 + 30; // 6:30 AM
    return { cutoffTimeInMinutes };
  }, []);

  // Extract unique stages from events - this is now the primary approach
  // Extract unique stages from events - this is now the primary approach
  const stageOptions = useMemo(() => {
    if (events.length === 0) {
      return [{ id: 'all', label: 'All Stages', value: 'all' }];
    }
    
    // Use a Set directly instead of Array.from(new Set(...))
    const stageSet = new Set<string>();
    events.forEach(event => {
      if (event.stage && event.stage.trim()) {
        stageSet.add(event.stage);
      }
    });
    
    const sortedStages = Array.from(stageSet).sort();
    
    return [
      { id: 'all', label: 'All Stages', value: 'all' },
      ...sortedStages.map(stage => ({
        id: stage,
        label: stage,
        value: stage,
      }))
    ];
  }, [events]);

  // Extract unique genres from fetched genres list
  const genreOptions = useMemo(() => {
    if (genres.length === 0) {
      return [{ id: 'all', label: 'All Genres', value: 'all' }];
    }
    
    const sortedGenres = [...genres].sort();
    
    return [
      { id: 'all', label: 'All Genres', value: 'all' },
      ...sortedGenres.map(genre => ({
        id: genre,
        label: genre,
        value: genre,
      }))
    ];
  }, [genres]);

  // Initialize selectedDay based on visible days - simplified to avoid hook ordering issues
  useEffect(() => {
    if (!selectedDay && visibleFestivalDays.length > 0) {
      dispatchFilter({ type: 'SET_SELECTED_DAY', payload: visibleFestivalDays[0].date });
    }
  }, [selectedDay, visibleFestivalDays]);

  // --- Fetch events and user schedule ---
  const fetchEvents = useCallback(async (loadMore = false) => {
    if (loadMore && !hasMore) return;
    setIsLoading(!loadMore);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await api.get<ScheduleEvent[]>(`/events?page=${page}&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      
      // Populate genres for the events
      const eventsWithGenres = await genreService.populateEventGenres(response.data);
      
      setEvents(prev => loadMore ? [...prev, ...eventsWithGenres] : eventsWithGenres);
      setHasMore(response.data.length === 50); // Assume 50 is page size
      if (loadMore) setPage(prev => prev + 1);
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      setError('Could not load events. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, hasMore]);

  const loadUserSchedule = useCallback(async () => {
    // Only fetch user schedule if user is logged in (not a guest)
    if (!user || !isLoggedInUser(user)) return;
    try {
      const schedule = await getUserSchedule(user.id);
      const scheduleMap = schedule.reduce<Record<string, boolean>>((acc, ev) => {
        acc[ev.id] = true;
        return acc;
      }, {});
      setUserSchedule(scheduleMap);
    } catch {
      // Silently fail - user schedule is not critical
      console.warn('⚠️ User schedule loading failed');
    }
  }, [user]);

  // Fetch genres from the API
  const fetchGenres = useCallback(async () => {
    try {
      // Fetch directly from Firestore genres collection
      const genresCollection = collection(firestore, 'genres');
      const genresSnapshot = await getDocs(genresCollection);
      
      const genreTags: string[] = [];
      genresSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.tag && typeof data.tag === 'string') {
          genreTags.push(data.tag);
        }
      });
      
      // Sort genres alphabetically
      genreTags.sort();
      setGenres(genreTags);
      
  // Dev note: fetched genres count available here for debugging if needed
    } catch (err) {
      console.warn('⚠️ Firestore permissions error - using sample genres until rules are updated');
      console.error('Full error:', err);
      
      // Use expanded sample genres that match what's likely in your Firestore
      const sampleGenres = [
        'Live Electronic',
        'Hip Hop', 
        'Rock',
        'Jazz',
        'Folk',
        'Techno',
        'House',
        'Ambient',
        'Experimental',
        'Pop',
        'R&B',
        'Reggae',
        'Funk',
        'Soul'
      ].sort();
      
      setGenres(sampleGenres);
  // Dev note: using sample genres fallback
    }
  }, []);

  // Separate useEffect for initial data loading to avoid dependency issues
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    // Only load user schedule if user exists and is logged in (not a guest)
    if (user && isLoggedInUser(user)) {
      loadUserSchedule();
    }
  }, [user, loadUserSchedule]);

  // Load genres on user login or token change
  useEffect(() => {
    // Fetch genres only if user is logged in (token exists)
    const fetchData = async () => {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        fetchGenres();
      }
    };
    
    fetchData();
  }, [user, fetchGenres]);

  // Fetch genres on component mount
  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  // --- Optimized filtering logic with performance monitoring ---
  // Precompute sorted events (sort only when events change)
  const sortedEvents = useMemo(() => {
    if (events.length === 0) return [];
    return [...events].sort((a, b) => {
      const [aHours, aMinutes] = a.startTime.split(':').map(Number);
      const aTimeInMinutes = aHours * 60 + aMinutes;
      const [bHours, bMinutes] = b.startTime.split(':').map(Number);
      const bTimeInMinutes = bHours * 60 + bMinutes;
      const adjustedA = aTimeInMinutes < dateConstants.cutoffTimeInMinutes ? aTimeInMinutes + (24 * 60) : aTimeInMinutes;
      const adjustedB = bTimeInMinutes < dateConstants.cutoffTimeInMinutes ? bTimeInMinutes + (24 * 60) : bTimeInMinutes;
      return adjustedA - adjustedB;
    });
  }, [events, dateConstants.cutoffTimeInMinutes]);

  const filteredEvents = useMemo(() => {
    const startTime = performance.now();
    if (sortedEvents.length === 0) {
      return [];
    }
    
    let filtered = [...sortedEvents]; // Start with pre-sorted array
    
    // Filter by selected day (including late-night events from next day)
    if (selectedDay) {
      filtered = filtered.filter(ev => {
        const [eventHours, eventMinutes] = ev.startTime.split(':').map(Number);
        const eventStartTimeInMinutes = eventHours * 60 + eventMinutes;
        
        // Get the next day after the filter day
        const filterDate = new Date(selectedDay);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayString = nextDay.toISOString().split('T')[0];
        
        // Case 1: Event is on the filter day and starts at 6:30 AM or later
        if (ev.date === selectedDay && eventStartTimeInMinutes >= dateConstants.cutoffTimeInMinutes) {
          return true;
        }
        
        // Case 2: Event is on the next day and starts before 6:30 AM
        if (ev.date === nextDayString && eventStartTimeInMinutes < dateConstants.cutoffTimeInMinutes) {
          return true;
        }
        
        return false;
      });
    }
    
    // Filter by selected stages (multi-select)
    if (selectedStages.length > 0 && !selectedStages.includes('all')) {
      filtered = filtered.filter(ev => selectedStages.includes(ev.stage));
    }
    
    // Filter by selected genres (multi-select)
    if (selectedGenres.length > 0 && !selectedGenres.includes('all')) {
      filtered = filtered.filter(ev => {
        // Check if event has genres array (populated by backend)
        if (ev.genres && Array.isArray(ev.genres)) {
          return ev.genres.some(genre => selectedGenres.includes(genre));
        }
        // Fallback: check single genre field
        return ev.genre && selectedGenres.includes(ev.genre);
      });
    }
    
    // Filter by user schedule
    if (showMySchedule) {
      // Check if there are any events in the user's schedule
      if (Object.keys(userSchedule).length > 0) {
        filtered = filtered.filter(ev => userSchedule[ev.id]);
      } else {
        // No events in schedule, return empty array
        filtered = [];
      }
    }
    
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`🔍 Filtering ${sortedEvents.length} events → ${filtered.length} results took: ${(performance.now() - startTime).toFixed(2)}ms`);
    }
    return filtered;
  }, [sortedEvents, selectedDay, selectedStages, selectedGenres, showMySchedule, userSchedule, dateConstants.cutoffTimeInMinutes]);

  // --- UI Handlers ---
  const handleDayPress = useCallback((day: string) => {
    dispatchFilter({ type: 'SET_SELECTED_DAY', payload: day });
  }, []);

  const handleStagesChange = useCallback((stages: string[]) => {
    dispatchFilter({ type: 'SET_SELECTED_STAGES', payload: stages });
  }, []);

  const handleGenresChange = useCallback((genres: string[]) => {
    dispatchFilter({ type: 'SET_SELECTED_GENRES', payload: genres });
  }, []);

  const handleToggleMySchedule = useCallback(() => {
    // Check if user exists and is not a guest
    if (!user) {
      Alert.alert('Login Required', 'Please login to view your schedule.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    
    // Check if user is a guest user
    if (user.id === 'guest-user') {
      const message = 'You need to be logged in to view your schedule.';
      Alert.alert('Login Required', message, [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Login', 
          onPress: async () => {
            try {
              // Need to logout first to remove guest user so Auth stack becomes available
              await logout();
              // Let the navigation system update to show Auth screen
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Could not log out. Please try again.');
            }
          }
        },
      ]);
      return;
    }
    
    // User is authenticated, proceed with toggling the filter
    dispatchFilter({ type: 'TOGGLE_MY_SCHEDULE' });
  }, [user, navigation, logout]);
  const handleToggleSchedule = useCallback(async (eventToToggle: ScheduleEvent) => {
    // If no user, show login prompt
    if (!user) {
      Alert.alert('Login Required', 'Please login to manage your schedule.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    
    // Check if user is a guest user
    if (user.id === 'guest-user') {
      const message = 'You need to be logged in to add events to your schedule.';
      Alert.alert('Login Required', message, [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Login', 
          onPress: async () => {
            try {
              // Need to logout first to remove guest user so Auth stack becomes available
              await logout();
              // Let the navigation system update to show Auth screen
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Could not log out. Please try again.');
            }
          }
        },
      ]);
      return;
    }
    
    const eventId = eventToToggle.id;
    const isCurrentlyInSchedule = userSchedule[eventId];
    
    // Optimistically update UI immediately
    if (isCurrentlyInSchedule) {
      setUserSchedule(prev => { 
        const updated = { ...prev }; 
        delete updated[eventId]; 
        return updated; 
      });
    } else {
      setUserSchedule(prev => ({ ...prev, [eventId]: true }));
    }
    
    // Perform API call in background
    try {
      if (isCurrentlyInSchedule) {
        await removeFromSchedule(user.id, eventId);
      } else {
        await addToSchedule(user.id, eventId);
      }
    } catch (error) {
      // Revert optimistic update on error
      if (isCurrentlyInSchedule) {
        setUserSchedule(prev => ({ ...prev, [eventId]: true }));
      } else {
        setUserSchedule(prev => { 
          const updated = { ...prev }; 
          delete updated[eventId]; 
          return updated; 
        });
      }
      console.error('Error toggling schedule:', error);
      Alert.alert('Error', 'Failed to update your schedule. Please try again.');
    }
  }, [user, navigation, userSchedule, logout]);

  // Event press handlers
  const handleEventPress = useCallback((item: ScheduleEvent) => {
    setSelectedEvent(item);
    setIsModalVisible(true);
  }, []);

  // Clear modal state on close to free memory
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedEvent(null);
  }, []);

  // Reset filters handler
  const handleResetFilters = useCallback(() => {
    dispatchFilter({ type: 'RESET_FILTERS', payload: visibleFestivalDays.length > 0 ? visibleFestivalDays[0].date : '' });
  }, [visibleFestivalDays]);

  // Optimized key extractor
  const keyExtractor = useCallback((item: ScheduleEvent) => item.id, []);

  // --- Optimized Renderer with better caching ---
  const renderEventCard = useCallback(({ item }: { item: ScheduleEvent }) => {
    const isInUserSchedule = Boolean(userSchedule[item.id]);
    return (
      <EventCard
        key={`event-${item.id}`} // Explicit key for better React reconciliation
        item={item}
        isInUserSchedule={isInUserSchedule}
        theme={themeColors}
        onToggleSchedule={handleToggleSchedule}
        onEventPress={handleEventPress}
        showStatusBadge
        currentTime={now}
      />
    );
  }, [userSchedule, themeColors, handleToggleSchedule, handleEventPress, now]);

  // Determine if event is currently live (mirrors logic inside EventCard)
  const isEventLive = useCallback((ev: ScheduleEvent, nowMs: number) => {
    if (!ev.date || !ev.startTime) return false;
    const startTs = new Date(`${ev.date}T${ev.startTime}`).getTime();
    let endTs: number;
    if (ev.endTime && ev.endTime.trim()) {
      endTs = new Date(`${ev.date}T${ev.endTime}`).getTime();
      if (endTs <= startTs) endTs += 24 * 60 * 60 * 1000; // crosses midnight
    } else {
      endTs = startTs + 2 * 60 * 60 * 1000; // fallback 2h
    }
    return nowMs >= startTs && nowMs < endTs;
  }, []);

  // On day change (after initial set), auto-scroll to first live event if present
  useEffect(() => {
    if (!selectedDay) return;
    if (previousDayRef.current && previousDayRef.current !== selectedDay) {
      const nowMs = now;
      const liveIndex = filteredEvents.findIndex(ev => isEventLive(ev, nowMs));
      if (liveIndex >= 0) {
        // Defer to ensure FlatList rendered new data
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({ index: liveIndex, animated: true });
          } catch (err) {
            // Fallback to offset scroll if measurement not ready
            flatListRef.current?.scrollToOffset({ offset: liveIndex * 112, animated: true });
          }
        }, 0);
      }
    }
    previousDayRef.current = selectedDay;
  }, [selectedDay, filteredEvents, now, isEventLive]);

  // Aggressive initial image preloading for first screen
  const preloadInitialImages = useCallback((events: ScheduleEvent[]) => {
    const shouldPreload = __DEV__ || true; // Enable for production
    if (!shouldPreload || events.length === 0) return;
    
    // Preload first 30 images immediately for faster initial loading
    const initialImages = events
      .slice(0, 30)
      .filter(event => event.imageUrl && event.imageUrl.trim())
      .map(event => {
        let processedUri = event.imageUrl as string;
        if (processedUri.startsWith('gs://')) {
          const gsPath = processedUri.substring(5);
          const firstSlashIndex = gsPath.indexOf('/');
          if (firstSlashIndex > 0) {
            const bucket = gsPath.substring(0, firstSlashIndex);
            const objectPath = gsPath.substring(firstSlashIndex + 1);
            processedUri = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
          }
        } else if (!processedUri.startsWith('http') && processedUri.trim()) {
          processedUri = `https://big-fam-app.S3.us-east-2.amazonaws.com/${processedUri}`;
        }
        return { uri: processedUri };
      });
    
    // Preload immediately (no delay) for initial screen
    initialImages.forEach(({ uri }) => {
      Image.prefetch(uri).catch(() => {
        // Silently fail
      });
    });
  }, []);

  // Smart image preloading for visible items + lookahead
  const preloadVisibleImages = useCallback((visibleEvents: ScheduleEvent[]) => {
    // Enable in production for better UX
    const shouldPreload = __DEV__ || true; // Enable for production
    if (!shouldPreload) return;
    
    // Preload images for currently visible events
    const visibleImages = visibleEvents
      .filter(event => event.imageUrl && event.imageUrl.trim())
      .map(event => event.imageUrl as string);
    
    // Also preload next 10 images (increased lookahead)
    const allFilteredImages = filteredEvents
      .filter(event => event.imageUrl && event.imageUrl.trim())
      .map(event => event.imageUrl as string);
    
    const visibleIndices = visibleEvents.map(event => 
      allFilteredImages.indexOf(event.imageUrl as string)
    ).filter(index => index >= 0);
    
    const maxVisibleIndex = Math.max(...visibleIndices, 0);
    const lookaheadImages = allFilteredImages.slice(maxVisibleIndex + 1, maxVisibleIndex + 11);  // Increased to 10 lookahead
    
    const imagesToPreload = [...new Set([...visibleImages, ...lookaheadImages])];
    
    // Preload immediately without delay for faster loading
    const processedImages = imagesToPreload.map(uri => {
      let processedUri = uri;
      if (uri.startsWith('gs://')) {
        const gsPath = uri.substring(5);
        const firstSlashIndex = gsPath.indexOf('/');
        if (firstSlashIndex > 0) {
          const bucket = gsPath.substring(0, firstSlashIndex);
          const objectPath = gsPath.substring(firstSlashIndex + 1);
          processedUri = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
        }
      } else if (!uri.startsWith('http') && uri.trim()) {
        processedUri = `https://big-fam-app.S3.us-east-2.amazonaws.com/${uri}`;
      }
      return { uri: processedUri };
    });
    
    // Preload immediately without delay for faster loading
    processedImages.forEach(({ uri }) => {
      Image.prefetch(uri).catch(() => {
        // Silently fail - prefetching is best effort
      });
    });
  }, [filteredEvents]);

  // Preload initial images when events load
  useEffect(() => {
    if (filteredEvents.length > 0) {
      preloadInitialImages(filteredEvents);
    }
  }, [filteredEvents, preloadInitialImages]);

  // Track visible items for smart preloading
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<{ item: ScheduleEvent }> }) => {
    const visibleEvents = viewableItems.map(viewableItem => viewableItem.item);
    preloadVisibleImages(visibleEvents);
  }, [preloadVisibleImages]);

  // --- Main Render ---
  return (
    <SafeAreaView style={[filterStyles.container, { backgroundColor: theme.background }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} />
  {/* Main content container */}
  {/* TopNavBar already consumes safe-area top; only offset by nav height (55) to avoid double-padding on iOS */}
  <View style={{ flex: 1, flexDirection: 'column', marginTop: insets.top + 55 }}>
        {/* Fixed header container for filter rows - align flush with nav bar bottom */}
        <View
          style={{
            backgroundColor: theme.background,
            paddingTop: 0, // remove extra top padding so filters are flush with nav bar
            paddingBottom: 6,
            zIndex: 1000,
            position: 'relative',
            elevation: 1,
            justifyContent: 'flex-end',
          }}
        >
        {/* Date filter row */}
        <View 
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            alignItems: 'flex-end',
            minHeight: 56,
          }}
        >
          {visibleFestivalDays.map(day => (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dateFilterButton,
                { borderColor: theme.border, flex: 1 },
                day.date === selectedDay && { backgroundColor: theme.primary },
              ]}
              onPress={() => handleDayPress(day.date)}
              accessibilityLabel={`Select ${day.dayLabel} for events`}
            >
              <Text
                style={[
                  styles.dateFilterButtonDateText,
                  day.date === selectedDay ? { color: theme.background } : { color: theme.text }
                ]}
                numberOfLines={1}
                ellipsizeMode='clip'
              >
                {day.dayLabel}
              </Text>
              <Text
                style={[
                  styles.dateFilterButtonText,
                  day.date === selectedDay ? { color: theme.background } : { color: theme.text }
                ]}
                numberOfLines={1}
                ellipsizeMode='clip'
              >
                {day.dayAbbrev}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* 2nd row: My Schedule filter, stage dropdown */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            minHeight: 44,
          }}
        >
          {/* Grid icon - hidden for now
          <TouchableOpacity style={{ padding: 8 }}>
            <MaterialCommunityIcons name="view-grid-outline" size={28} color={theme.text} />
          </TouchableOpacity>
          */}
          
          {/* My Schedule filter */}
          <TouchableOpacity
            style={[
              {
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: showMySchedule ? theme.primary : 'transparent',
                marginLeft: 0, // Changed from 4 since grid icon is hidden 
                marginRight: 8, 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                minWidth: 110,
                height: 36,
              }
            ]}
            onPress={handleToggleMySchedule}
            accessibilityLabel={showMySchedule ? 'Hide my schedule' : 'Show my schedule'}
          >
            <Ionicons
              name={showMySchedule ? 'heart' : 'heart-outline'}
              size={16}
              color={showMySchedule ? '#B87333' : theme.text}
              style={{ marginRight: 6 }}
            />
            <Text style={[
              {
                fontSize: 14,
                fontWeight: '500',
                color: showMySchedule ? theme.background : theme.text
              }
            ]}>
              My Schedule
            </Text>
          </TouchableOpacity>
          
          {/* Stage dropdown (multi-select) */}
          <MultiSelectDropdown
            options={stageOptions}
            selectedValues={selectedStages}
            onSelectionChange={handleStagesChange}
            placeholder="All Stages"
            allOptionValue="all"
            style={{
              minWidth: 110,
              marginRight: 4,
              height: 36,
            }}
          />
          {/* Genre dropdown (multi-select) */}
          <MultiSelectDropdown
            options={genreOptions}
            selectedValues={selectedGenres}
            onSelectionChange={handleGenresChange}
            placeholder="All Genres"
            allOptionValue="all"
            dropdownMinWidth={200}
            style={{
              flex: 1,
              marginRight: 4,
              height: 36,
            }}
          />
          
          {/* Share button - hidden for now
          <TouchableOpacity 
            style={[
              filterStyles.filterButton,
              {
                borderRadius: 18,
                backgroundColor: '#B87333',
                borderWidth: 1,
                borderColor: theme.border,
                paddingHorizontal: 8,
                paddingVertical: 0,
                paddingLeft: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 36,
                marginRight: 0,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.10,
                shadowRadius: 2,
                elevation: 2,
                opacity: 0.5, // Reduced opacity to indicate disabled state
              }
            ]}
            disabled={true}
            onPress={() => Alert.alert('Share Schedule', 'Schedule sharing coming soon!')}
          >
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          */}
        </View>
      </View>
      {/* Event list container - takes remaining space */}
      <View
        style={{ 
          flex: 1,
        }}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.text, marginTop: 16 }}>Loading events...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.error || '#FF0000'} />
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={() => fetchEvents()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredEvents}
            renderItem={renderEventCard}
            keyExtractor={keyExtractor}
            contentContainerStyle={[
              styles.eventsList,
              // Respect bottom safe-area and keep minimum scroll space for footers/tab bar
              { paddingTop: 0, paddingBottom: Math.max(100, insets.bottom + 16), flexGrow: 1 }
            ]}
            showsVerticalScrollIndicator={false}
            // Enhanced performance optimizations for smooth scrolling
            removeClippedSubviews={true}
            maxToRenderPerBatch={20}
            updateCellsBatchingPeriod={100}
            initialNumToRender={75}
            windowSize={15}
            legacyImplementation={false}
            disableVirtualization={false}
            // Consistent item layout for better performance
            getItemLayout={(data, index) => ({
              length: 112,
              offset: 112 * index,
              index,
            })}
            // Performance optimizations for scrolling
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onEndReached={() => fetchEvents(true)}
            onEndReachedThreshold={0.5}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50, // Item is considered visible when 50% is showing
            }}
            onScrollToIndexFailed={({ index }) => {
              // Retry after a brief delay with approximate offset
              setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: index * 112, animated: true });
              }, 60);
            }}
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { flex: 1, justifyContent: 'center' }]}> 
                <Ionicons name="calendar-outline" size={48} color={theme.muted || '#666666'} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No events found for the selected filters.</Text>
                <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
                  <Text style={[styles.resetButtonText, { color: theme.primary }]}>Reset Filters</Text>
                </TouchableOpacity>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchEvents(); // Refetch on pull-to-refresh
                }}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          />
        )}
      </View>
      </View>
      {/* Top navigation bar (render last so it overlays content reliably) */}
      <TopNavBar 
        onSettingsPress={() => navigation.navigate('Settings')}
        whiteIcons={false}
      />

      {/* Event details modal */}
      <EventDetailsModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        event={selectedEvent ? { ...selectedEvent, endTime: selectedEvent.endTime ?? '' } : null}
        isInSchedule={!!selectedEvent && !!userSchedule[selectedEvent.id]}
        onToggleSchedule={handleToggleSchedule}
      />
    </SafeAreaView>
  );
};

export default ScheduleScreen;

// NOTE: Backend should populate event.genres array by:
  // 1. For each event, iterate through event.artists array
  // 2. For each artist ID, fetch from artists collection
  // 3. Get artist's genres subcollection documents
  // 4. Look up each genre document in genres collection to get tag
  // 5. Add all unique genre tags to event.genres array
