// Commit: Refactor schedule and my schedule into unified ScheduleScreen with new filter UI
// Author: GitHub Copilot, 2025-06-30

/**
 * ScheduleScreen
 * Shows all events with filters for date, stage (dropdown), and "My Schedule" (favorites).
 * UI matches new design: date row, then grid icon + My Schedule filter, then stage dropdown.
 * Replaces HomeScreen and MyScheduleScreen logic.
 */
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  SafeAreaView,
  RefreshControl,
  Alert,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

// --- Genre filter types - TEMPORARILY DISABLED ---
/*
interface GenreOption {
  id: string;
  label: string;
  value: string;
}
*/

// --- Types ---
interface ScheduleEvent {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  stage: string;
  artists: string[];
  description?: string;
  imageUrl?: string;
  genre?: string;
  genres?: string[];
}

type ScheduleScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

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

// Memoized EventCard component for better performance
interface EventCardProps {
  item: ScheduleEvent;
  isInUserSchedule: boolean;
  theme: {
    border: string;
    card: string;
    text: string;
    muted: string;
  };
  onToggleSchedule: (event: ScheduleEvent) => void;
  onEventPress: (event: ScheduleEvent) => void;
}

const EventCard = memo<EventCardProps>(({ item, isInUserSchedule, theme, onToggleSchedule, onEventPress }) => {
  const displayImageUrl = useMemo(() => {
    if (!item.imageUrl) return null;
    
    if (item.imageUrl.startsWith('gs://')) {
      const gsPath = item.imageUrl.substring(5);
      const firstSlashIndex = gsPath.indexOf('/');
      if (firstSlashIndex > 0) {
        const bucket = gsPath.substring(0, firstSlashIndex);
        const objectPath = gsPath.substring(firstSlashIndex + 1);
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
      }
    } else if (item.imageUrl.startsWith('http')) {
      return item.imageUrl;
    } else {
      return `https://big-fam-app.S3.us-east-2.amazonaws.com/${item.imageUrl}`;
    }
    return null;
  }, [item.imageUrl]);

  const formattedTime = useMemo(() => {
    const [hours, minutes] = item.startTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, [item.startTime]);

  const handleHeartPress = useCallback((e: GestureResponderEvent) => {
    e.stopPropagation();
    onToggleSchedule(item);
  }, [item, onToggleSchedule]);

  const handleEventPress = useCallback(() => {
    onEventPress(item);
  }, [item, onEventPress]);

  return (
    <TouchableOpacity 
      style={[
        styles.eventCard, 
        { borderColor: theme.border, backgroundColor: theme.card }
      ]}
      onPress={handleEventPress}
    >
      {displayImageUrl && (
        <Image
          source={{ uri: displayImageUrl }}
          style={styles.eventImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.eventInfo}>
        <Text style={[styles.eventName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.eventDetails, { color: theme.muted }]}>
          {item.stage} - {formattedTime}
        </Text>
        
        {item.description && (
          <Text 
            style={[
              styles.eventDescription, 
              { color: theme.text }
            ]} 
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.heartButton}
        onPress={handleHeartPress}
      >
        <Ionicons
          name={isInUserSchedule ? 'heart' : 'heart-outline'}
          size={24}
          color={isInUserSchedule ? '#B87333' : (theme.muted || '#666666')}
        />
        <Text style={[styles.favoriteText, { color: isInUserSchedule ? '#B87333' : (theme.muted || '#666666') }]}>
          {isInUserSchedule ? 'Added' : 'Add'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

EventCard.displayName = 'EventCard';

const ScheduleScreen = () => {
  const { theme, isDark, isPerformanceMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<ScheduleScreenNavigationProp>();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSchedule, setUserSchedule] = useState<Record<string, boolean>>({});
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedStages, setSelectedStages] = useState<string[]>(['all']); // Default to 'all' for showing all stages
  const [showMySchedule, setShowMySchedule] = useState(false);
  // Genre filtering temporarily disabled
  // const [availableGenres, setAvailableGenres] = useState<GenreOption[]>([]);
  // const [selectedGenres, setSelectedGenres] = useState<string[]>(['all']);
  // --- Fetch genres for filter - TEMPORARILY DISABLED ---
  /*
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const response = await api.get('/genres', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        // Expecting response.data to be array of { id, tag }
        interface GenreApiResponse {
          id?: string;
          tag: string;
        }
        const genreOptions: GenreOption[] = [
          { id: 'all', label: 'All Genres', value: 'all' },
          ...response.data.map((g: GenreApiResponse) => ({ id: g.id || g.tag, label: g.tag, value: g.tag }))
        ];
        setAvailableGenres(genreOptions);
      } catch (err) {
        console.error('Error fetching genres:', err);
        setAvailableGenres([{ id: 'all', label: 'All Genres', value: 'all' }]);
      }
    };
    fetchGenres();
  }, []);
  */

  // Helper function to check if user has staff privileges
  const isStaffUser = useCallback(() => {
    if (!user) return false;
    const staffRoles = ['admin', 'staff', 'artist', 'vendor', 'volunteer'];
    return user.role && staffRoles.includes(user.role.toLowerCase());
  }, [user]);

  // Helper function to determine if an event should appear on a given filter day
  const shouldEventAppearOnDay = useCallback((event: ScheduleEvent, filterDay: string) => {
    const cutoffTimeInMinutes = 6 * 60 + 30; // 6:30 AM
    const [eventHours, eventMinutes] = event.startTime.split(':').map(Number);
    const eventStartTimeInMinutes = eventHours * 60 + eventMinutes;
    
    // Get the next day after the filter day
    const filterDate = new Date(filterDay);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayString = nextDay.toISOString().split('T')[0];
    
    // Case 1: Event is on the filter day and starts at 6:30 AM or later
    if (event.date === filterDay && eventStartTimeInMinutes >= cutoffTimeInMinutes) {
      return true;
    }
    
    // Case 2: Event is on the next day and starts before 6:30 AM
    if (event.date === nextDayString && eventStartTimeInMinutes < cutoffTimeInMinutes) {
      // eslint-disable-next-line no-console
      console.log(`🌙 Late-night event "${event.name}" (${event.startTime} on ${event.date}) included in ${filterDay} filter`);
      return true;
    }
    
    // Debug logging for excluded events
    if (event.date === filterDay && eventStartTimeInMinutes < cutoffTimeInMinutes) {
      // eslint-disable-next-line no-console
      console.log(`� Early event "${event.name}" (${event.startTime} on ${event.date}) excluded from ${filterDay} filter (before 6:30 AM)`);
    }
    
    return false;
  }, []);

  // Get filtered festival days based on user role - memoized to prevent unnecessary recalculations
  const visibleFestivalDays = useMemo(() => {
    if (isStaffUser()) {
      return festivalDays; // Show all days including staff-only ones
    }
    return festivalDays.filter(day => !day.staffOnly); // Show only public days
  }, [isStaffUser]);

  // Extract unique stages from events for the dropdown options
  const stageOptions = useMemo(() => {
    // Prefer stages from API, fallback to extracting from events
    let stagesToUse = availableStages;
    
    if (stagesToUse.length === 0 && events.length > 0) {
      stagesToUse = Array.from(new Set(events.map(event => event.stage)))
        .filter(stage => stage && stage.trim() !== '') // Filter out empty/null stages
        .sort(); // Sort alphabetically
    }
    
    return [
      { id: 'all', label: 'All Stages', value: 'all' },
      ...stagesToUse.map(stage => ({
        id: stage,
        label: stage,
        value: stage,
      }))
    ];
  }, [availableStages, events]);

  // Initialize selectedDay based on visible days - simplified to avoid hook ordering issues
  useEffect(() => {
    if (!selectedDay && visibleFestivalDays.length > 0) {
      setSelectedDay(visibleFestivalDays[0].date);
    }
  }, [selectedDay, visibleFestivalDays]);

  // --- Fetch events and user schedule ---
  const fetchStages = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await api.get<string[]>('/events/stages', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      setAvailableStages(response.data);
      // eslint-disable-next-line no-console
      console.log(`🎭 Fetched ${response.data.length} unique stages from API`);
    } catch (err) {
      console.error('Error fetching stages:', err);
      // Fallback to extracting stages from events if API fails
    }
  };

  const fetchEvents = async () => {
    const startTime = performance.now();
    // eslint-disable-next-line no-console
    console.log('🚀 Starting to fetch events...');
    
    setIsLoading(true);
    setError(null);
    try {
      const tokenStartTime = performance.now();
      const token = await SecureStore.getItemAsync('userToken');
      // eslint-disable-next-line no-console
      console.log(`🔑 Token retrieval took: ${(performance.now() - tokenStartTime).toFixed(2)}ms`);
      
      const apiStartTime = performance.now();
      const response = await api.get<ScheduleEvent[]>('/events', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      // eslint-disable-next-line no-console
      console.log(`🌐 API call took: ${(performance.now() - apiStartTime).toFixed(2)}ms`);
      // eslint-disable-next-line no-console
      console.log(`📊 Received ${response.data?.length || 0} events`);
      
      setEvents(response.data);
      // eslint-disable-next-line no-console
      console.log(`✅ Total fetch operation took: ${(performance.now() - startTime).toFixed(2)}ms`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Error fetching events:', err);
      setError('Could not load events. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadUserSchedule = useCallback(async () => {
    if (!user) return;
    const startTime = performance.now();
    try {
      const schedule = await getUserSchedule(user.id);
      const scheduleMap = schedule.reduce<Record<string, boolean>>((acc, ev) => {
        acc[ev.id] = true;
        return acc;
      }, {});
      setUserSchedule(scheduleMap);
      // eslint-disable-next-line no-console
      console.log(`📅 User schedule loaded in: ${(performance.now() - startTime).toFixed(2)}ms`);
    } catch {
      // Silently fail - user schedule is not critical
      // eslint-disable-next-line no-console
      console.warn(`⚠️ User schedule loading failed after: ${(performance.now() - startTime).toFixed(2)}ms`);
    }
  }, [user]);

  // Separate useEffect for initial data loading to avoid dependency issues
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('🔄 useEffect triggered for fetchEvents and fetchStages');
    fetchStages();
    fetchEvents();
  }, []); // Now safe since fetchEvents and fetchStages are not callbacks

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line no-console
      console.log('👤 useEffect triggered for loadUserSchedule, user:', user.id);
      loadUserSchedule();
    }
  }, [user, loadUserSchedule]);

  // --- Optimized filtering logic with performance monitoring ---
  const filteredEvents = useMemo(() => {
    const startTime = performance.now();
    if (events.length === 0) {
      return [];
    }
    // Debug: Log event dates to see format
    if (events.length > 0) {
      // eslint-disable-next-line no-console
      console.log('📅 Sample event dates:', events.slice(0, 3).map(e => ({ id: e.id, date: e.date, name: e.name })));
      // eslint-disable-next-line no-console
      console.log('🎯 Selected day for filtering:', selectedDay);
    }
    let filtered = [...events];
    // Filter by selected day (including late-night events from next day)
    if (selectedDay) {
      filtered = filtered.filter(ev => shouldEventAppearOnDay(ev, selectedDay));
      // eslint-disable-next-line no-console
      console.log(`📅 After date filter (${selectedDay}): ${filtered.length} events`);
    }
    // Filter by selected stages (multi-select)
    if (selectedStages.length > 0 && !selectedStages.includes('all')) {
      filtered = filtered.filter(ev => selectedStages.includes(ev.stage));
    // eslint-disable-next-line no-console
      console.log(`🎭 After stage filter (${selectedStages.join(', ')}): ${filtered.length} events`);
    }
    // Filter by selected genres (multi-select) - TEMPORARILY DISABLED
    /*
    if (selectedGenres.length > 0 && !selectedGenres.includes('all')) {
      filtered = filtered.filter(ev => {
        // Assume event.genres is array of genre tags, or event.genre (string)
        if (Array.isArray(ev.genres)) {
          return ev.genres.some((g: string) => selectedGenres.includes(g));
        } else if (ev.genre) {
          return selectedGenres.includes(ev.genre);
        }
        return false;
      });
      // eslint-disable-next-line no-console
      console.log(`🎭 After genre filter (${selectedGenres.join(', ')}): ${filtered.length} events`);
    }
    */
    // Filter by user schedule
    if (showMySchedule && Object.keys(userSchedule).length > 0) {
      filtered = filtered.filter(ev => userSchedule[ev.id]);
      // eslint-disable-next-line no-console
      console.log(`❤️ After user schedule filter: ${filtered.length} events`);
    }
    // Sort by start time
    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // eslint-disable-next-line no-console
    console.log(`🔍 Filtering ${events.length} events → ${filtered.length} results took: ${(performance.now() - startTime).toFixed(2)}ms`);
    return filtered;
  }, [events, selectedDay, selectedStages, showMySchedule, userSchedule, shouldEventAppearOnDay]);

  // Performance monitoring effect - simplified
  useEffect(() => {
    if (__DEV__ && events.length > 0 && filteredEvents.length >= 0) {
      // eslint-disable-next-line no-console
      console.log(`📈 Events: ${events.length} → Filtered: ${filteredEvents.length} (${((filteredEvents.length / events.length) * 100).toFixed(1)}%)`);
    }
  }, [events.length, filteredEvents.length]);

  // --- UI Handlers ---
  const handleToggleSchedule = useCallback(async (eventToToggle: ScheduleEvent) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to manage your schedule.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    const eventId = eventToToggle.id;
    const isInUserSchedule = userSchedule[eventId];
    if (isInUserSchedule) {
      await removeFromSchedule(user.id, eventId);
      setUserSchedule(prev => { const updated = { ...prev }; delete updated[eventId]; return updated; });
    } else {
      await addToSchedule(user.id, eventId);
      setUserSchedule(prev => ({ ...prev, [eventId]: true }));
    }
  }, [user, navigation, userSchedule]);

  // Event press handlers
  const handleEventPress = useCallback((item: ScheduleEvent) => {
    setSelectedEvent(item);
    setIsModalVisible(true);
  }, []);

  // Reset filters handler
  const handleResetFilters = useCallback(() => {
    setSelectedDay(visibleFestivalDays.length > 0 ? visibleFestivalDays[0].date : '');
    setSelectedStages(['all']);
    setShowMySchedule(false);
  }, [visibleFestivalDays]);

  // Optimized key extractor
  const keyExtractor = useCallback((item: ScheduleEvent) => item.id, []);

  // --- Optimized Renderer ---
  const renderEventCard = useCallback(({ item }: { item: ScheduleEvent }) => {
    const isInUserSchedule = userSchedule[item.id];
    return (
      <EventCard
        item={item}
        isInUserSchedule={isInUserSchedule}
        theme={theme}
        onToggleSchedule={handleToggleSchedule}
        onEventPress={handleEventPress}
      />
    );
  }, [userSchedule, theme, handleToggleSchedule, handleEventPress]);

  // Debug logging in development only
  useEffect(() => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Filters - showMySchedule:', showMySchedule, 'selectedDay:', selectedDay, 'selectedStages:', selectedStages);
    }
  }, [showMySchedule, selectedDay, selectedStages]);

  // --- Main Render ---
  return (
    <SafeAreaView style={[filterStyles.container, { backgroundColor: isPerformanceMode ? (theme.background || '#FFFFFF') : 'transparent' }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TopNavBar 
        onSearch={(_query) => { /* Implement search logic */ }} 
        onSettingsPress={() => navigation.navigate('Settings')}
        onNotificationsPress={() => Alert.alert('Notifications coming soon!')} 
      />
      {/* Main content container */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Fixed header container for filter rows */}
        <View
          style={{
            backgroundColor: isPerformanceMode ? (theme.background || '#FFFFFF') : 'transparent',
            paddingTop: 73, // Make filters flush with TopNavBar
            paddingBottom: 16,
            zIndex: 1000,
            position: 'relative',
            elevation: 1,
          }}
          onLayout={e => {
            // eslint-disable-next-line no-console
            console.log('[DEBUG] Filter header row layout:', e.nativeEvent.layout);
          }}
        >
        {/* Date filter row */}
        <View 
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            alignItems: 'center',
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
              onPress={() => setSelectedDay(day.date)}
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
        {/* 2nd row: grid icon, My Schedule filter, stage dropdown */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            minHeight: 44,
          }}
          onLayout={e => {
            // eslint-disable-next-line no-console
            console.log('[DEBUG] Second filter row layout:', e.nativeEvent.layout);
          }}
        >
          {/* Grid icon aligned with logo */}
          <TouchableOpacity style={{ padding: 8 }}>
            <MaterialCommunityIcons name="view-grid-outline" size={28} color={theme.text} />
          </TouchableOpacity>
          
          {/* My Schedule filter */}
          <TouchableOpacity
            style={[
              {
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: showMySchedule ? theme.primary : 'transparent',
                marginLeft: 4, 
                marginRight: 8, 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                minWidth: 110,
                height: 36,
              }
            ]}
            onPress={() => setShowMySchedule(v => !v)}
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
            onSelectionChange={setSelectedStages}
            placeholder="All Stages"
            allOptionValue="all"
            style={{
              minWidth: 110,
              marginRight: 4,
              height: 36,
            }}
          />
          {/* Genre dropdown (multi-select) - HIDDEN FOR NOW */}
          {/*
          <MultiSelectDropdown
            options={availableGenres}
            selectedValues={selectedGenres}
            onSelectionChange={setSelectedGenres}
            placeholder="All Genres"
            allOptionValue="all"
            style={{
              minWidth: 110,
              marginRight: 4,
              height: 36,
            }}
          />
          */}
          
          {/* Share button */}
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
              }
            ]}
            onPress={() => Alert.alert('Share Schedule', 'Schedule sharing coming soon!')}
          >
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Event list container - takes remaining space */}
      <View
        style={{ 
          flex: 1,
        }}
        onLayout={e => {
          // eslint-disable-next-line no-console
          console.log('[DEBUG] Event list container layout:', e.nativeEvent.layout);
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
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={fetchEvents}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            renderItem={renderEventCard}
            keyExtractor={keyExtractor}
            contentContainerStyle={[
              styles.eventsList,
              { paddingTop: 0, flexGrow: 1 } // Ensure list/empty state fills available space
            ]}
            showsVerticalScrollIndicator={false}
            // Performance optimizations for large lists
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={100}
            initialNumToRender={8}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 112, // approximate height of event card
              offset: 112 * index,
              index,
            })}
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
      {/* Event details modal */}
      <EventDetailsModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        event={selectedEvent ? { ...selectedEvent, endTime: selectedEvent.endTime ?? '' } : null}
        isInSchedule={!!selectedEvent && !!userSchedule[selectedEvent.id]}
        onToggleSchedule={handleToggleSchedule}
      />
    </SafeAreaView>
  );
};

export default ScheduleScreen;
