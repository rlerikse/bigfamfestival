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
  { id: 'all', label: 'ALL', date: 'all' },
  { id: '2025-09-26', label: 'FRI 26', date: '2025-09-26' },
  { id: '2025-09-27', label: 'SAT 27', date: '2025-09-27' },
  { id: '2025-09-28', label: 'SUN 28', date: '2025-09-28' },
];

const MyScheduleScreen = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Day filter state
  const [selectedDay, setSelectedDay] = useState<string>('all');

  // fetchSchedule is now defined before useEffect
  const fetchSchedule = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const scheduleData = await getUserSchedule(user.id);
      setEvents(scheduleData);
        // Default to 'all' if available
      if (FESTIVAL_DAYS.length > 0) {
        if (!selectedDay || !FESTIVAL_DAYS.some(day => day.date === selectedDay)) {
          setSelectedDay('all');
        }
      } else {
        setSelectedDay('all');
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
  };  // Filter events by selected day
  const filteredEvents = selectedDay === 'all'
    ? events
    : events.filter(event => event.date === selectedDay);

  // Sort events by start time
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (a.date !== b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return a.startTime.localeCompare(b.startTime);
  });

  // Format time for display (convert 24h to 12h)
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Day filter at the top with proper alignment */}
      {FESTIVAL_DAYS.length > 0 && (
        <View style={styles.dayFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayFilterContent}
          >
            {FESTIVAL_DAYS.map((day, index) => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  day.date === selectedDay && { backgroundColor: theme.primary },
                  { borderColor: theme.border },
                  index === FESTIVAL_DAYS.length - 1 && { marginRight: 0 }
                ]}
                onPress={() => setSelectedDay(day.date)}
              >
                <Text style={[
                  styles.dayButtonText,
                  day.date === selectedDay && { color: '#FFFFFF' },
                  day.date !== selectedDay && { color: theme.text }
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.contentContainer}>
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
              {selectedDay === 'all'
                ? 'No events in your schedule yet.'
                : 'No events in your schedule for this day.'}
            </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  dayFilterContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  dayFilterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayButton: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
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