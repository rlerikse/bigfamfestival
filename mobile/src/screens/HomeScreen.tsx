import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  FlatList,
  SafeAreaView,
  Platform,
  Alert, // Added Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import * as SecureStore from 'expo-secure-store';

// Import from our contexts
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { addToSchedule, isEventInSchedule, removeFromSchedule, getUserSchedule } from '../services/scheduleService';
import { api } from '../services/api';
import { ScheduleEvent } from '../types/event';

// Define navigation prop type for HomeScreen
type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const HomeScreen = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth(); // Get user from AuthContext
  const navigation = useNavigation<HomeScreenNavigationProp>(); // Get and type navigation object
    // State for events and loading states
  const [events, setEvents] = useState<ScheduleEvent[]>([]); // Use ScheduleEvent
  const [filteredEvents, setFilteredEvents] = useState<ScheduleEvent[]>([]); // Use ScheduleEvent
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSchedule, setUserSchedule] = useState<Record<string, boolean>>({});
  
  // State for filters
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Festival days for the filter
  const festivalDays = [
    { id: 'all', label: 'ALL', date: 'all' }, // Changed label and added date
    { id: '2025-09-26', label: 'FRI 26', date: '2025-09-26' }, // Changed label
    { id: '2025-09-27', label: 'SAT 27', date: '2025-09-27' }, // Changed label
    { id: '2025-09-28', label: 'SUN 28', date: '2025-09-28' }, // Changed label
  ];

  // Stages for the filter
  const stages = [
    { id: 'all', label: 'ALL', value: 'all' }, // Changed label and added value
    { id: 'Apogee', label: 'APOGEE', value: 'Apogee' }, // Changed label
    { id: 'The Bayou', label: 'THE BAYOU', value: 'The Bayou' }, // Changed label
    { id: 'The Art Tent', label: 'ART TENT', value: 'The Art Tent' }, // Changed label
    // Add other stages as needed
  ];

  // Apply day and stage filters
  const applyFilters = useCallback((allEvents: ScheduleEvent[], day: string, stage: string) => { // Use ScheduleEvent
    let filtered = [...allEvents];
    
    // Apply date filter if not 'all'
    if (day !== 'all') {
      filtered = filtered.filter(event => event.date === day);
    }
    
    // Apply stage filter if not 'all'
    if (stage !== 'all') {
      filtered = filtered.filter(event => event.stage === stage);
    }
    
    // Sort events by date and time
    filtered.sort((a, b) => {
      // First compare by date
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      
      // If same date, compare by start time
      return a.startTime.localeCompare(b.startTime);
    });
    
    setFilteredEvents(filtered);
  }, [setFilteredEvents]); // setFilteredEvents is stable, but good practice to include  // Fetch events from the backend API
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get auth token for API request
      const token = await SecureStore.getItemAsync('userToken');
      
      // Make the API request to get events from Firestore
      const response = await api.get<ScheduleEvent[]>('/events', {
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : undefined
      });
      
      // Process the events from the API
      const fetchedEvents = response.data;
      
      // Set the events and apply any filters
      setEvents(fetchedEvents);
      applyFilters(fetchedEvents, selectedDay, selectedStage);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Could not load events from the server. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [applyFilters, selectedDay, selectedStage]);
  // Toggle favorite/schedule
  const handleAddToSchedule = useCallback(async (event: ScheduleEvent) => { // Use ScheduleEvent
    if (!user) {
      Alert.alert(
        "Login Required",
        "You need to be logged in to add events to your schedule.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },          {
            text: "Login",
            onPress: () => navigation.navigate('Auth'), // Navigate to Auth stack
          },
        ]
      );
      return;
    }
    
    try {
      const isInSchedule = userSchedule[event.id];
      
      if (isInSchedule) {
        Alert.alert(
          "Remove from Schedule",
          `Are you sure you want to remove "${event.name}" from your schedule?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: async () => {
                try {
                  await removeFromSchedule(user.id, event.id);
                  setUserSchedule(prev => {
                    const updated = { ...prev };
                    delete updated[event.id];
                    return updated;
                  });
                  Alert.alert("Removed", `"${event.name}" has been removed from your schedule.`);
                } catch (error) {
                  console.error("Error removing from schedule:", error);
                  Alert.alert("Error", "Could not remove event from your schedule. Please try again.");
                }
              }
            }
          ]
        );
        return;
      } else {
        // Add to schedule
        await addToSchedule(user.id, event.id);
        
        // Update local state
        setUserSchedule(prev => ({
          ...prev,
          [event.id]: true
        }));
        
        Alert.alert("Success", `"${event.name}" has been added to your schedule.`);
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      Alert.alert("Error", "Could not update your schedule. Please try again.");
    }
  }, [user, navigation, userSchedule]);

  // Handle refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

  // Handle day filter selection
  const handleDayFilter = (day: string) => {
    setSelectedDay(day);
    applyFilters(events, day, selectedStage);
  };

  // Handle stage filter selection
  const handleStageFilter = (stage: string) => {
    setSelectedStage(stage);
    applyFilters(events, selectedDay, stage);
  };  // Load user's schedule to track which events are in it
  const loadUserSchedule = useCallback(async () => {
    if (!user) return;
    
    try {
      const { id } = user;
      const schedule = await getUserSchedule(id);
      
      // Create a mapping of event IDs to true for quick lookup
      const scheduleMap = schedule.reduce<Record<string, boolean>>((acc, event) => {
        acc[event.id] = true;
        return acc;
      }, {});
      
      setUserSchedule(scheduleMap);
    } catch (err) {
      console.error('Error loading user schedule:', err);
      // Don't set error state here as it would replace the main error message
    }
  }, [user]);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
    if (user) {
      loadUserSchedule();
    }
  }, [fetchEvents, loadUserSchedule, user]); // Added loadUserSchedule and user to dependency array
  // Render each event card
  const renderEventCard = ({ item }: { item: ScheduleEvent }) => { // Use ScheduleEvent
    // Format the time for display
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${formattedHour}:${minutes} ${period}`;
    };
    
    // Check if this event is in the user's schedule
    const isInSchedule = userSchedule[item.id];

    let displayImageUrl: string | null = null;
    if (item.imageUrl) {
      if (item.imageUrl.startsWith('gs://')) {
        // Handle gs:// URI
        const gsPath = item.imageUrl.substring(5); // Remove 'gs://'
        const firstSlashIndex = gsPath.indexOf('/');
        if (firstSlashIndex > 0) {
          const bucket = gsPath.substring(0, firstSlashIndex);
          const objectPath = gsPath.substring(firstSlashIndex + 1);
          const encodedPath = encodeURIComponent(objectPath);
          displayImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
        }
      } else if (item.imageUrl.startsWith('http')) {
        // Handle direct HTTPS URL
        displayImageUrl = item.imageUrl;
      } else {
        // Assume it's a relative path, use default bucket
        const bucket = 'bigfamfestival.firebasestorage.app'; // Default bucket
        const objectPath = item.imageUrl.startsWith('/') ? item.imageUrl.substring(1) : item.imageUrl;
        const encodedPath = encodeURIComponent(objectPath);
        displayImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
      }
    }
    
    return (
      <View style={[styles.eventCard, { backgroundColor: theme.card }]}>
        <Image
          source={displayImageUrl ? { uri: displayImageUrl } : require('../assets/images/event-placeholder.png')}
          style={styles.eventImage}
          resizeMode="cover"
        />
        <View style={styles.eventContent}>
          <View style={styles.eventTextContainer}>
            <Text style={[styles.eventTitle, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.eventDetails, { color: theme.muted }]}>
              {item.stage} - {formatTime(item.startTime)}
            </Text>
            {item.description && (
              <Text style={[styles.eventDescription, { color: theme.text }]} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleAddToSchedule(item)}
          >
            <Ionicons 
              name={isInSchedule ? "heart" : "heart-outline"} 
              size={24} 
              color={theme.primary} 
            />
            <Text style={[styles.favoriteText, { color: theme.primary }]}>
              {isInSchedule ? "Added" : "Add"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.content}>
        {/* Day Filters */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterContent}
          >
            {festivalDays.map((day, index) => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.filterButton,
                  day.date === selectedDay && { backgroundColor: theme.primary },
                  { borderColor: theme.border },
                  index === festivalDays.length - 1 && { marginRight: 0 }
                ]}
                onPress={() => handleDayFilter(day.date)}
              >
                <Text style={[
                  styles.filterButtonText,
                  day.date === selectedDay && { color: '#FFFFFF' },
                  day.date !== selectedDay && { color: theme.text }
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Stage Filters */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterContent}
          >
            {stages.map((stage, index) => (
              <TouchableOpacity
                key={stage.id}
                style={[
                  styles.filterButton,
                  stage.value === selectedStage && { backgroundColor: theme.primary },
                  { borderColor: theme.border },
                  index === stages.length - 1 && { marginRight: 0 }
                ]}
                onPress={() => handleStageFilter(stage.value)}
              >
                <Text style={[
                  styles.filterButtonText,
                  stage.value === selectedStage && { color: '#FFFFFF' },
                  stage.value !== selectedStage && { color: theme.text }
                ]}>
                  {stage.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Events List */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading events...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.primary }]} 
              onPress={fetchEvents}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={theme.muted} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No events found for the selected filters.
            </Text>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={() => {
                setSelectedDay('all');
                setSelectedStage('all');
                applyFilters(events, 'all', 'all');
              }}
            >
              <Text style={[styles.resetButtonText, { color: theme.primary }]}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            renderItem={renderEventCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
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
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  resetButtonText: {
    fontWeight: '600',
  },
  filterContainer: { // Renamed from filterScroll / dayFilterContainer
    marginBottom: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  filterContent: { // Renamed from filterScrollContent / dayFilterContent
    flexDirection: 'row',
    justifyContent: 'space-between', // To space out buttons
    width: '100%', // Ensure it takes full width for justifyContent to work
  },
  filterButton: { // Renamed from filterButton / dayButton
    paddingVertical: 14, // Matched from MyScheduleScreen
    borderRadius: 10, // Matched from MyScheduleScreen
    borderWidth: 1,
    marginRight: 8, // Matched from MyScheduleScreen
    flex: 1, // Added to make buttons take equal space
    alignItems: 'center', 
    justifyContent: 'center',
    height: 48, // Matched from MyScheduleScreen
  },
  filterButtonText: { // Renamed from filterButtonText / dayButtonText
    fontSize: 14, // Matched from MyScheduleScreen
    fontWeight: '600', // Matched from MyScheduleScreen
    textAlign: 'center',
  },
  eventsList: {
    paddingHorizontal: 16, // Keep horizontal padding
    paddingBottom: 30, 
  },
  eventCard: {
    flexDirection: 'row', // Changed
    alignItems: 'center', // Added
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    // backgroundColor will be set dynamically by theme.card
  },
  eventImage: {
    width: '33%', // Changed from 100%
    height: 100, // Changed from 180 to make card shorter
    // resizeMode: 'cover' is still good
  },
  eventContent: {
    flex: 1, // Added
    flexDirection: 'row', // Added
    justifyContent: 'space-between', // Added
    alignItems: 'center', // Added
    paddingVertical: 8, // Adjusted padding
    paddingHorizontal: 12, // Adjusted padding
  },
  eventTextContainer: { // New style for the text block
    flex: 1, 
    marginRight: 8, 
  },
  eventTitle: {
    fontSize: 16, 
    fontWeight: 'bold',
    marginBottom: 2, // Reduced margin
  },
  eventDetails: {
    fontSize: 13, 
    marginBottom: 0, // Removed margin
  },
  eventDescription: { // New style for the description
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  favoriteButton: {
    flexDirection: 'column', // Stack icon and text vertically
    alignItems: 'center',   // Center icon and text
    justifyContent: 'center',
    paddingHorizontal: 4, // Add some horizontal padding if needed
  },
  favoriteText: {
    marginLeft: 0, // Removed as text is below icon
    marginTop: 2,  // Add a small margin between icon and text
    fontSize: 10, // Made text smaller
    fontWeight: '600',
  },
});

export default HomeScreen;