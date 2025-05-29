import React, { useState, useEffect, useCallback } from 'react'; // Removed useMemo
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserSchedule, removeFromSchedule } from '../services/scheduleService';
import { ScheduleEvent } from '../types/event';

// Define festival days outside the component or memoize if it needs to be dynamic based on props/state
const FESTIVAL_DAYS = [
  '2025-09-26',
  '2025-09-27',
  '2025-09-28',
];

const MyScheduleScreen = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Day filter state
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // fetchSchedule is now defined before useEffect
  const fetchSchedule = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const scheduleData = await getUserSchedule(user.id);
      setEvents(scheduleData);
      
      // Default to the first festival day if available and no day is selected
      // or if the current selectedDay is not in the new FESTIVAL_DAYS
      if (FESTIVAL_DAYS.length > 0) {
        if (!selectedDay || !FESTIVAL_DAYS.includes(selectedDay)) {
          setSelectedDay(FESTIVAL_DAYS[0]);
        }
      } else {
        setSelectedDay(null); // No festival days, so no selected day
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load your schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDay]); // Dependencies for fetchSchedule

  // Fetch user's schedule
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]); // fetchSchedule is now a stable dependency

  const handleRemoveEvent = async (eventId: string) => {
    if (!user) return;
    
    try {
      await removeFromSchedule(user.id, eventId);
      // Update local state to remove the event
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error removing event:', error);
      setError('Failed to remove event from your schedule.');
    }
  };

  /**
   * Show a confirmation before removing an event
   */
  const confirmRemoveEvent = (event: ScheduleEvent) => {
    Alert.alert(
      'Remove from Schedule',
      `Are you sure you want to remove "${event.name}" from your schedule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => handleRemoveEvent(event.id),
        },
      ],
    );
  };

  // Filter events by selected day
  const filteredEvents = selectedDay
    ? events.filter(event => event.date === selectedDay)
    : events;

  // Sort events by start time
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (a.date !== b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return a.startTime.localeCompare(b.startTime);
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time for display (convert 24h to 12h)
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Render a day filter button
  const renderDayButton = (day: string) => {
    const isSelected = day === selectedDay;
    return (
      <TouchableOpacity
        key={day}
        style={[
          styles.dayButton,
          isSelected && { backgroundColor: theme.primary },
          { borderColor: theme.border }
        ]}
        onPress={() => setSelectedDay(day)}
      >
        <Text style={[
          styles.dayButtonText,
          isSelected && { color: '#FFFFFF' },
          !isSelected && { color: theme.text }
        ]}>
          {formatDate(day).split(', ')[0]} {/* Display only Weekday */}
        </Text>
        <Text style={[
            styles.dayButtonDateText,
            isSelected && { color: '#FFFFFF' },
            !isSelected && { color: theme.muted }
        ]}>
            {formatDate(day).split(', ')[1]} {/* Display Month and Day */}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render a single event card
  const renderEventCard = ({ item }: { item: ScheduleEvent }) => {
    return (
      <View style={[styles.eventCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.eventInfo}>
          <Text style={[styles.eventName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.eventDetails, { color: theme.muted }]}>
            {item.stage} - {formatTime(item.startTime)}
          </Text>
          
          {/* Optional description */}
          {item.description && (
            <Text style={[styles.eventDescription, { color: theme.text }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => confirmRemoveEvent(item)}
        >
          <Ionicons name="heart" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render browse events link
  const renderBrowseLink = () => (
    <TouchableOpacity 
      style={[styles.browseButton, { borderColor: theme.border }]}
      onPress={() => {
        // Navigate to Events screen (will need to be implemented)
        // navigation.navigate('Events');
      }}
    >
      <Text style={{ color: theme.primary }}>Browse All Events</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Text style={[styles.title, { color: theme.text }]}>My Schedule</Text>
      
      {/* Day filter */}
      {FESTIVAL_DAYS.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.dayFilterContainer}
          contentContainerStyle={styles.dayFilterContent}
        >
          {FESTIVAL_DAYS.map(renderDayButton)}
        </ScrollView>
      )}
      
      {/* Browse Events Button */}
      {renderBrowseLink()}
      
      {/* Loading state */}
      {isLoading ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.centeredContent}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]} 
            onPress={fetchSchedule}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sortedEvents.length === 0 ? (
        <View style={styles.centeredContent}>
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            {selectedDay 
              ? 'No events in your schedule for this day.' 
              : 'No events in your schedule yet.'}
          </Text>
          {renderBrowseLink()}
        </View>
      ) : (
        <FlatList
          data={sortedEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dayFilterContainer: {
    marginBottom: 16,
    paddingLeft: 8, 
  },
  dayFilterContent: {
    paddingHorizontal: 8, 
    alignItems: 'center', // Align items vertically
  },
  dayButton: {
    paddingHorizontal: 12, 
    paddingVertical: 10, // Increased vertical padding
    borderRadius: 10, // Slightly less rounded
    borderWidth: 1,
    marginRight: 10, 
    minWidth: 110, // Adjusted min width
    alignItems: 'center', 
    justifyContent: 'center', // Center content vertically
    height: 60, // Fixed height for buttons
  },
  dayButtonText: {
    fontSize: 14, // Adjusted font size
    fontWeight: 'bold', // Make weekday bold
    textAlign: 'center',
  },
  dayButtonDateText: { // New style for the date part
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2, // Add a little space between weekday and date
  },
  browseButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  eventCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  heartButton: {
    justifyContent: 'center',
    padding: 4,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
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
});

export default MyScheduleScreen;