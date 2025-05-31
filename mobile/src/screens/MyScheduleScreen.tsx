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
  Image, // Import Image component
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserSchedule, removeFromSchedule } from '../services/scheduleService';
import { ScheduleEvent } from '../types/event';
import TopNavBar from '../components/TopNavBar';

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
  const [filteredEvents, setFilteredEvents] = useState<ScheduleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
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
    }  };

  // Apply filters (search and day)
  const applyFilters = useCallback(() => {
    let filtered = [...events];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchLower) ||
        event.artists.some(artistId => artistId.toLowerCase().includes(searchLower)) ||
        event.stage.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply day filter
    if (selectedDay !== 'all') {
      filtered = filtered.filter(event => event.date === selectedDay);
    }
    
    // Sort events by date and start time
    filtered.sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.startTime.localeCompare(b.startTime);
    });
    
    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedDay]);

  // Update filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
    );  };  // Filter events by selected day
  // Note: Filtering logic moved to applyFilters function above

  // Sort events by start time (now using filteredEvents instead of local variable)
  const sortedEvents = [...filteredEvents];

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
    const isExpanded = item.id === expandedEventId;
    let displayImageUrl: string | null = null;
    
    if (item.imageUrl) {
      if (item.imageUrl.startsWith('gs://')) {
        const gsPath = item.imageUrl.substring(5); 
        const firstSlashIndex = gsPath.indexOf('/');
        if (firstSlashIndex > 0) {
          const bucket = gsPath.substring(0, firstSlashIndex);
          const objectPath = gsPath.substring(firstSlashIndex + 1);
          const encodedPath = encodeURIComponent(objectPath);
          displayImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
        }
      } else if (item.imageUrl.startsWith('http')) {
        displayImageUrl = item.imageUrl;
      } else {
        const bucket = 'bigfamfestival.firebasestorage.app'; 
        const objectPath = item.imageUrl.startsWith('/') ? item.imageUrl.substring(1) : item.imageUrl;
        const encodedPath = encodeURIComponent(objectPath);
        displayImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
      }
    }

    return (
      <TouchableOpacity 
        style={[
          styles.eventCard, 
          { borderColor: theme.border, backgroundColor: theme.card },          isExpanded && {
            borderWidth: 2,
            marginVertical: 4,
          }
        ]}
        onPress={() => setExpandedEventId(isExpanded ? null : item.id)}
      >
        {displayImageUrl && (
          <Image
            source={{ uri: displayImageUrl }}
            style={[
              styles.eventImage,
              isExpanded && { height: 120, width: 120 }
            ]}
            resizeMode="cover"
          />
        )}
        <View style={[
          styles.eventInfo, 
          !displayImageUrl && { paddingLeft: 12 },
          isExpanded && { padding: 16 }
        ]}>
          <Text style={[styles.eventName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.eventDetails, { color: theme.muted }]}>
            {item.stage} - {formatTime(item.startTime)}
          </Text>
          
          {/* Optional description - show full description when expanded */}
          {item.description && (
            <Text 
              style={[
                styles.eventDescription, 
                { color: theme.text },
                isExpanded && { 
                  fontSize: 14,
                  marginTop: 8,
                  lineHeight: 20,
                }
              ]} 
              numberOfLines={isExpanded ? undefined : 2}
            >
              {item.description}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.heartButton}
          onPress={(e) => {
            e.stopPropagation();
            confirmRemoveEvent(item);
          }}
        >
          <Ionicons name="heart" size={24} color={isDark ? '#B87333' : theme.secondary} />
          <Text style={[styles.favoriteText, { color: isDark ? '#B87333' : theme.secondary }]}>
            Added
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );  };  return (    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Top Navigation Bar */}
      <TopNavBar onSearch={handleSearch} placeholder="Search your schedule..." />
      
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

const styles = StyleSheet.create({  container: {
    flex: 1,
    paddingTop: 76, // Add padding to account for TopNavBar height (60) + some spacing
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
    alignItems: 'center', // Vertically center items in the card
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden', // Add overflow hidden to clip image corners
    // backgroundColor will be set by theme.card
  },
  eventImage: { // Added style for the image
    width: 100, // Make image wider, similar to HomeScreen
    height: 100, // Make image take full height of card
    // borderRadius: 8, // Remove specific borderRadius, rely on card's overflow:hidden
    // marginRight: 12, // Remove margin, text will have its own padding
  },
  eventInfo: {
    flex: 1, // Takes remaining space
    justifyContent: 'center', // Center content vertically if it's shorter
    paddingVertical: 12, // Add vertical padding
    paddingHorizontal: 12, // Add horizontal padding
  },
  eventName: {
    fontSize: 16, // Slightly smaller
    fontWeight: 'bold',
    marginBottom: 2, // Reduced margin
  },
  eventDetails: {
    fontSize: 13, // Slightly smaller
    marginBottom: 2, // Reduced margin
  },  eventDescription: {
    fontSize: 12, // Slightly smaller
    marginTop: 2, // Reduced margin
    fontStyle: 'italic',
  },  heartButton: {
    flexDirection: 'column', // Stack icon and text vertically
    alignItems: 'center',   // Center icon and text
    justifyContent: 'center',
    paddingHorizontal: 12, // Reduced padding back
    marginRight: 4, // Reduced margin back
  },
  favoriteText: {
    marginLeft: 0, // Removed as text is below icon
    marginTop: 2,  // Add a small margin between icon and text
    fontSize: 10, // Made text smaller
    fontWeight: '600',
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
  expandedCard: {
    marginHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  expandedImage: {
    height: 150,
    width: '100%',
  },
  expandedInfo: {
    padding: 16,
  },
  expandedDescription: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
});

export default MyScheduleScreen;