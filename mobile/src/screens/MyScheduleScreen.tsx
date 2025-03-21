import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserSchedule, removeFromSchedule } from '../services/scheduleService';
import { ScheduleEvent } from '../types/event';

const MyScheduleScreen = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Day filter state
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);

  // Fetch user's schedule
  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const scheduleData = await getUserSchedule(user.id);
      setEvents(scheduleData);
      
      // Extract unique days from events for the day filter
      const uniqueDays = Array.from(new Set(scheduleData.map(event => event.date)))
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      setDays(uniqueDays);
      
      // Default to the first day if available
      if (uniqueDays.length > 0 && !selectedDay) {
        setSelectedDay(uniqueDays[0]);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load your schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing an event from the schedule
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
          {formatDate(day)}
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
          onPress={() => handleRemoveEvent(item.id)}
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
      {days.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.dayFilterContainer}
          contentContainerStyle={styles.dayFilterContent}
        >
          {days.map(renderDayButton)}
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
  },
  dayFilterContent: {
    paddingHorizontal: 16,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
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