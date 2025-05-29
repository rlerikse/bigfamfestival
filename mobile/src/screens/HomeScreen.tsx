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
    { id: 'all', label: 'All Days' },
    { id: '2025-09-26', label: 'Sept 26th' },
    { id: '2025-09-27', label: 'Sept 27th' },
    { id: '2025-09-28', label: 'Sept 28th' },
  ];

  // Stages for the filter
  const stages = [
    { id: 'all', label: 'All Stages' },
    { id: 'Apogee', label: 'Apogee' },
    { id: 'The Bayou', label: 'The Bayou' },
    { id: 'The Art Tent', label: 'The Art Tent' },
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
    
    return (
      <View style={[styles.eventCard, { backgroundColor: theme.card }]}>
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/images/event-placeholder.png')}
          style={styles.eventImage}
          resizeMode="cover"
        />
        <View style={styles.eventContent}>
          <Text style={[styles.eventTitle, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.eventDetails, { color: theme.muted }]}>
            {item.stage} - {formatTime(item.startTime)}
          </Text>
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
              {isInSchedule ? "Added to Schedule" : "Add to Schedule"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render a filter button
  const renderFilterButton = (
    id: string,
    label: string,
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <TouchableOpacity
      key={id} // Add unique key here
      style={[
        styles.filterButton,
        selectedValue === id ? 
          { backgroundColor: theme.primary } : 
          { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }
      ]}
      onPress={() => onSelect(id)}
    >
      <Text
        style={[
          styles.filterButtonText,
          { color: selectedValue === id ? (isDark ? theme.text : '#FFFFFF') : theme.text }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.content}>
        {/* Day Filters */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScrollContent}
          style={styles.filterScroll}
        >
          {festivalDays.map(day => (
            renderFilterButton(day.id, day.label, selectedDay, handleDayFilter)
          ))}
        </ScrollView>
        
        {/* Stage Filters */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScrollContent}
          style={styles.filterScroll}
        >
          {stages.map(stage => (
            renderFilterButton(stage.id, stage.label, selectedStage, handleStageFilter)
          ))}
        </ScrollView>
        
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
  filterScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 16, 
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 18, // Increased from 16
    borderRadius: 20,
    marginHorizontal: 6, // Increased from 4
    justifyContent: 'center',
    alignItems: 'center',
    height: 38, // Slightly increased height for better vertical padding balance
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventsList: {
    padding: 16,
    paddingBottom: 30, // Extra padding at bottom for notches and navigation
  },
  eventCard: {
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
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    marginBottom: 12,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteText: {
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default HomeScreen;