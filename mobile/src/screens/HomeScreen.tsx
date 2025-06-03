import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  SafeAreaView,
  RefreshControl,
  Alert,
  Dimensions,
  TextProps,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import * as SecureStore from 'expo-secure-store';

// Define ScheduleEvent interface
interface ScheduleEvent {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string; // Optional
  stage: string;
  artists: string[]; // Assuming artists are an array of strings (IDs or names)
  description?: string; // Optional
  imageUrl?: string; // Optional
  // Add any other properties that ScheduleEvent might have
}

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { addToSchedule, removeFromSchedule, getUserSchedule } from '../services/scheduleService';
import { api } from '../services/api';
import EventDetailsModal from '../components/EventDetailsModal'; // Corrected import
import DayNightCycle from '../components/DayNightCycle';
import TopNavBar from '../components/TopNavBar';

// Define SafeText component
interface SafeTextProps extends TextProps {
  children: React.ReactNode;
}

const SafeText: React.FC<SafeTextProps> = ({ children, ...props }) => {
  const renderableChildren = React.Children.map(children, child => {
    if (typeof child === 'string' || typeof child === 'number') {
      return child;
    }
    if (React.isValidElement(child) && child.props.children && (typeof child.props.children === 'string' || typeof child.props.children === 'number')) {
        return child.props.children;
    }
    return child != null ? String(child) : ''; // Fallback to string conversion
  });

  return <Text {...props}>{renderableChildren}</Text>;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const HomeScreen = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ScheduleEvent[]>([]);  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSchedule, setUserSchedule] = useState<Record<string, boolean>>({});
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const festivalDays = [
    { id: 'all', label: 'FRI 26', date: '2025-09-26' },
    { id: '2025-09-27', label: 'SAT 27', date: '2025-09-27' },
    { id: '2025-09-28', label: 'SUN 28', date: '2025-09-28' },
  ];
  const stages = [
    { id: 'all', label: 'ALL', value: 'all' },
    { id: 'Apogee', label: 'APOGEE', value: 'Apogee' },
    { id: 'The Bayou', label: 'BAYOU', value: 'The Bayou' }, // Changed label to BAYOU
    { id: 'The Art Tent', label: 'ART TENT', value: 'The Art Tent' },
  ];
  
  const applyFilters = useCallback((allEvents: ScheduleEvent[], day: string, stage: string, search = '') => {
    let filtered = [...allEvents];
    
    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchLower) ||
        event.artists.some(artistId => artistId.toLowerCase().includes(searchLower)) ||
        event.stage.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower))
      );
    }
    
    if (day !== 'all') {
      filtered = filtered.filter(event => event.date === day);
    }
    if (stage !== 'all') {
      filtered = filtered.filter(event => event.stage === stage);
    }
    filtered.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime); // Corrected to startTime
    });
    setFilteredEvents(filtered);
  }, []); // No dependencies needed as it doesn't use any external variables that would change

  const fetchEvents = useCallback(async () => {
    debugLog('fetchEvents called');
    setIsLoading(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await api.get<ScheduleEvent[]>('/events', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const fetchedEvents = response.data;
      setEvents(fetchedEvents);
      applyFilters(fetchedEvents, selectedDay, selectedStage, searchQuery);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Could not load events. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [applyFilters, selectedDay, selectedStage, searchQuery]);

  const handleToggleSchedule = useCallback(async (eventToToggle: ScheduleEvent) => {
    debugLog('handleToggleSchedule called', { eventName: eventToToggle.name });
    if (!user) {
      Alert.alert("Login Required", "Please login to manage your schedule.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }

    const eventId = eventToToggle.id;
    const eventName = eventToToggle.name;
    const isInUserSchedule = userSchedule[eventId];

    if (isInUserSchedule) {
      Alert.alert("Remove from Schedule", `Remove "${eventName}" from your schedule?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            try {
              await removeFromSchedule(user.id, eventId);
              setUserSchedule(prev => { const updated = { ...prev }; delete updated[eventId]; return updated; });
              Alert.alert("Removed", `"${eventName}" removed from your schedule.`);
            } catch (error) {
              console.error("Error removing from schedule:", error);
              Alert.alert("Error", "Could not remove event. Please try again.");
            }
          }
        }
      ]);
    } else {
      try {
        await addToSchedule(user.id, eventId);
        setUserSchedule(prev => ({ ...prev, [eventId]: true }));
        Alert.alert("Added", `"${eventName}" added to your schedule.`);
      } catch (error) {
        console.error("Error adding to schedule:", error);
        Alert.alert("Error", "Could not add event. Please try again.");
      }
    }
  }, [user, navigation, userSchedule]);
  const onRefresh = () => {
    debugLog('onRefresh called');
    setIsRefreshing(true);
    fetchEvents();
  };
  
  const handleDayFilter = (day: string) => {
    debugLog('handleDayFilter called', { day });
    setSelectedDay(day);
    applyFilters(events, day, selectedStage, searchQuery);
  };
  const handleStageFilter = (stage: string) => {
    debugLog('handleStageFilter called', { stage });
    setSelectedStage(stage);
    applyFilters(events, selectedDay, stage, searchQuery);
  };
  
  const handleSearch = (query: string) => {
    debugLog('handleSearch called', { query });
    setSearchQuery(query);
    applyFilters(events, selectedDay, selectedStage, query);
  };

  const loadUserSchedule = useCallback(async () => {
    debugLog('loadUserSchedule called');
    if (!user) return;
    try {
      const schedule = await getUserSchedule(user.id);
      const scheduleMap = schedule.reduce<Record<string, boolean>>((acc, ev) => {
        acc[ev.id] = true;
        return acc;
      }, {});
      setUserSchedule(scheduleMap);
    } catch (err) {
      console.error('Error loading user schedule:', err);
    }
  }, [user]);

  useEffect(() => {
    debugLog('Main useEffect triggered');
    fetchEvents();
    if (user) {
      loadUserSchedule();
    }
  }, [fetchEvents, loadUserSchedule, user]);

  // SafeText component is now defined at the top level

  const renderEventCard = ({ item }: { item: ScheduleEvent }) => {
    // ... (formatTimeDisplay, isInUserSchedule, displayImageUrl logic is the same) ...
    const formatTimeDisplay = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${period}`;
    };

    const isInUserSchedule = userSchedule[item.id];
    let displayImageUrl: string | null = null;
    if (item.imageUrl) { // Corrected to imageUrl
      if (item.imageUrl.startsWith('gs://')) {
        const gsPath = item.imageUrl.substring(5);
        const firstSlashIndex = gsPath.indexOf('/');
        if (firstSlashIndex > 0) {
          const bucket = gsPath.substring(0, firstSlashIndex);
          const objectPath = gsPath.substring(firstSlashIndex + 1);
          displayImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
        }
      } else if (item.imageUrl.startsWith('http')) {
        displayImageUrl = item.imageUrl;
      } else {
        // Assuming S3 path if not gs:// or http(s) and imageUrl is present
        displayImageUrl = `https://big-fam-app.S3.us-east-2.amazonaws.com/${item.imageUrl}`;
      }
    }

    try {
      debugLog('Rendering Event Card for:', { name: item.name, id: item.id });
      // Ensure all dynamic text content is definitely a string or number before passing to SafeText
      const eventName = typeof item.name === 'string' ? item.name : 'Invalid Name';
      const eventStage = typeof item.stage === 'string' ? item.stage : 'Invalid Stage';
      const eventTime = typeof item.startTime === 'string' ? formatTimeDisplay(item.startTime) : 'Invalid Time';
      const eventDescription = typeof item.description === 'string' ? item.description : ''; // Empty if not string

      return (
        <TouchableOpacity onPress={() => { debugLog('Event card pressed', { name: item.name }); setSelectedEvent(item); setIsModalVisible(true); }}>
          <View style={[styles.eventCard, { backgroundColor: theme.card || '#FFFFFF' }]}>
            <Image
              source={displayImageUrl ? { uri: displayImageUrl } : require('../assets/images/event-placeholder.png')}
              style={styles.eventImage}
              resizeMode="cover"
            />
            <View style={styles.eventContent}>
              <View style={styles.eventTextContainer}>
                <SafeText style={[styles.eventTitle, { color: theme.text || '#000000' }]} numberOfLines={1}>
                  {eventName}
                </SafeText>
                <SafeText style={[styles.eventDetails, { color: theme.muted || '#666666' }]} numberOfLines={1}>
                  {`${eventStage} - ${eventTime}`}
                </SafeText>
                {eventDescription ? ( // Only render if description is not an empty string
                  <SafeText style={[styles.eventDescription, { color: theme.text || '#000000' }]} numberOfLines={2}>
                    {eventDescription}
                  </SafeText>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={(e) => { e.stopPropagation(); handleToggleSchedule(item); }}
              >
                <Ionicons
                  name={isInUserSchedule ? "heart" : "heart-outline"}
                  size={24}
                  color={isDark ? '#B87333' : theme.secondary || '#FF5722'}
                />
                <SafeText style={[styles.favoriteText, { color: isDark ? '#B87333' : theme.secondary || '#FF5722' }]}>
                  {isInUserSchedule ? "Added" : "Add"}
                </SafeText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    } catch (e: any) {
      debugLog('Error rendering event card:', { error: e.message, itemID: item.id });
      return (
        <View style={[styles.eventCard, { backgroundColor: '#FFFFFF', padding: 10 }]}>
          <SafeText style={{ color: 'red' }}>Error displaying event: {String(item.name || item.id)}</SafeText>
        </View>
      );
    }
  };

  const renderFilterButtons = (items: any[], selectedItemValue: string, onPressHandler: (itemValue: string) => void, filterType: 'day' | 'stage') => {
    // ... (try/catch and mapping logic is the same) ...
    try {
      debugLog(`Rendering ${filterType} filter buttons`);
      return items.map((item) => {
        const itemValue = filterType === 'day' ? (item.id === 'all' ? 'all' : item.date) : item.value;
        const isButtonSelected = itemValue === selectedItemValue;
        
        // Ensure label is a string
        const label = (typeof item.label === 'string' || typeof item.label === 'number') ? String(item.label) : 'N/A';

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.filterButton,
              { borderColor: theme.border || '#DDDDDD' },
              isButtonSelected && { backgroundColor: theme.primary || '#4A90E2' },
            ]}
            onPress={() => onPressHandler(itemValue)}
          >
            <SafeText 
              style={[
                styles.filterButtonText,
                isButtonSelected ? { color: theme.background || '#FFFFFF' } : { color: theme.text || '#000000' },
              ]}
              numberOfLines={1}
            >
              {label}
            </SafeText>
          </TouchableOpacity>
        );
      });
    } catch (e: any) {
      debugLog(`Error rendering ${filterType} filter buttons:`, { error: e.message });
      return null;
    }
  };

  const renderEventDetailsModal = () => {
    try {
      if (!selectedEvent) {
        // debugLog('renderEventDetailsModal: No selected event.');
        return null;
      }
      debugLog('renderEventDetailsModal: Rendering EventDetailsModal for', { eventName: selectedEvent.name });
      return (
        <EventDetailsModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          event={selectedEvent ? { ...selectedEvent, endTime: selectedEvent.endTime ?? '' } : null}
          isInSchedule={!!userSchedule[selectedEvent.id]}
          onToggleSchedule={handleToggleSchedule}
        />
      );
    } catch (e: any) {
      debugLog('Error rendering EventDetailsModal wrapper:', { error: e.message });
      return null;
    }
  };

  // Main render try/catch
  try {
    debugLog('HomeScreen: Starting main render');

    debugLog('HomeScreen: Rendering DayNightCycle');
    const dayNightCycleElement = <DayNightCycle height={Dimensions.get('window').height} />;

    debugLog('HomeScreen: Rendering StatusBar');
    const statusBarElement = <StatusBar style={isDark ? 'light' : 'dark'} />;

    debugLog('HomeScreen: Rendering TopNavBar');
    const topNavBarElement = (
      <TopNavBar 
        onSearch={handleSearch} 
        onSettingsPress={() => navigation.navigate('Settings')} 
        onNotificationsPress={() => alert('Notifications coming soon!')}  
      />
    );

    let contentPart;
    debugLog('HomeScreen: Determining content part (loading/error/empty/list)');
    if (isLoading && !isRefreshing) {
      contentPart = (
        <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
          <ActivityIndicator size="large" color={theme.primary || '#4A90E2'} />
          <SafeText style={[styles.loadingText, { color: theme.text || '#000000' }]}>Loading events...</SafeText>
        </View>
      );
    } else if (error) {
      contentPart = (
        <View style={[styles.errorContainer, { backgroundColor: 'transparent' }]}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.error || '#FF0000'} />
          <SafeText style={[styles.errorText, { color: theme.text || '#000000' }]}>{String(error)}</SafeText>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary || '#4A90E2' }]} onPress={fetchEvents}>
            <SafeText style={styles.retryButtonText}>Try Again</SafeText>
          </TouchableOpacity>
        </View>
      );
    } else if (filteredEvents.length === 0) {
      contentPart = (
        <View style={[styles.emptyContainer, { backgroundColor: 'transparent' }]}>
          <Ionicons name="calendar-outline" size={48} color={theme.muted || '#666666'} />
          <SafeText style={[styles.emptyText, { color: theme.text || '#000000' }]}>
            No events found for the selected filters.
          </SafeText>
          <TouchableOpacity style={styles.resetButton} onPress={() => { 
            debugLog('Reset Filters pressed');
            setSelectedDay('all'); 
            setSelectedStage('all'); 
            setSearchQuery(''); 
            applyFilters(events, 'all', 'all', ''); 
          }}>
            <SafeText style={[styles.resetButtonText, { color: theme.primary || '#4A90E2' }]}>Reset Filters</SafeText>
          </TouchableOpacity>
        </View>
      );
    } else {
      debugLog('HomeScreen: Rendering FlatList');
      contentPart = (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => {
            debugLog('FlatList: Rendering ListEmptyComponent');
            return (
              <View style={styles.emptyContainer}>
                <SafeText style={{ color: theme.text || '#000000' }}>No events found (FlatList empty)</SafeText>
              </View>
            );
          }}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={onRefresh} 
              colors={[theme.primary || '#4A90E2']} 
              tintColor={theme.primary || '#4A90E2'} 
            />
          }
        />
      );
    }
    
    debugLog('HomeScreen: Rendering main layout');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background || '#FFFFFF' }]}>
        {dayNightCycleElement}
        {statusBarElement}
        {topNavBarElement}
        
        <View style={[styles.content, { backgroundColor: theme.background || '#FFFFFF', marginTop: -8 }]}>
          <View style={[styles.filterRowContainer, { marginTop: 4 }]}>
            {renderFilterButtons(festivalDays, selectedDay, handleDayFilter, 'day')}
          </View>
          <View style={styles.filterRowContainer}>
            {renderFilterButtons(stages, selectedStage, handleStageFilter, 'stage')}
          </View>
          {contentPart}
        </View>
        {renderEventDetailsModal()}
      </SafeAreaView>
    );
  } catch (e: any) {
    debugLog('HomeScreen: CATASTROPHIC RENDER ERROR!', { error: e.message, stack: e.stack });
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ color: '#FF0000', fontSize: 16, marginBottom: 20, paddingHorizontal: 20, textAlign: 'center' }}>
          HomeScreen Critical Error: {e.message}
        </Text>
        <TouchableOpacity
          style={{ padding: 12, backgroundColor: '#4A90E2', borderRadius: 8 }}
          onPress={() => {
            setSelectedEvent(null);
            setIsModalVisible(false);
            fetchEvents();
          }}
        >
          <Text style={{ color: '#FFFFFF' }}>Restart</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 0, // Removed top padding to make filters flush with navbar
    paddingHorizontal: 16, // Main horizontal padding
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  resetButtonText: {
    fontWeight: '600',
  },
  filterRowContainer: {
    flexDirection: 'row',
    marginBottom: 8, // Reduced gap between rows
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 6, // Reduced vertical padding
    paddingHorizontal: 8,
    borderRadius: 20, // More pill-like shape like YouTube
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32, // Reduced height
  },
  filterButtonText: {
    fontSize: 11, // Even smaller font size to prevent clipping
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false, // Reduce font padding to prevent clipping
    textAlignVertical: 'center', // Ensure vertical center alignment
  },
  eventsList: {
    // Removed paddingHorizontal: 16 (correctly done previously)
    paddingBottom: 16,
  },
  eventCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventContent: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  favoriteButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  favoriteText: {
    fontSize: 12,
    marginTop: 2,
  },
});

// Debug logging utility for HomeScreen component
function debugLog(message: string, data?: Record<string, any>): void {
  // Only log in development environment
  if (__DEV__) {
    if (data) {
      console.log(`[HomeScreen] ${message}`, data);
    } else {
      console.log(`[HomeScreen] ${message}`);
    }
  }
}
export default HomeScreen;