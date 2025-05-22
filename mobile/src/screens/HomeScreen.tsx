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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import from our contexts
import { useTheme } from '../contexts/ThemeContext';

// Define event interface
interface Event {
  id: string;
  name: string;
  stage: string;
  date: string;
  startTime: string;
  endTime: string;
  artists: string[];
  description?: string;
  imageUrl?: string;
}

const HomeScreen = () => {
  const { theme, isDark } = useTheme();
  
  // State for events and loading states
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  ];

  // Apply day and stage filters
  const applyFilters = useCallback((allEvents: Event[], day: string, stage: string) => {
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
  }, [setFilteredEvents]); // setFilteredEvents is stable, but good practice to include

  // This function would be connected to a real API in production
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, we would call the API endpoint
      // const response = await api.get('/events');
      // const data = response.data;
      
      // For now, using mock data
      const mockEvents: Event[] = [
        {
          id: '1',
          name: 'CASPA',
          stage: 'Apogee',
          date: '2025-09-26',
          startTime: '22:00',
          endTime: '23:30',
          artists: ['CASPA'],
          description: 'Heavyweight dubstep sounds from the legend CASPA.',
          imageUrl: require('../assets/artists/caspa.jpg'),
        },
        {
          id: '2',
          name: 'SAKA',
          stage: 'The Bayou',
          date: '2025-09-26',
          startTime: '20:30',
          endTime: '21:45',
          artists: ['SAKA'],
          description: 'Innovative bass music explorations.',
          imageUrl: require('../assets/artists/saka.jpg'),
        },
        {
          id: '3',
          name: 'LYNY',
          stage: 'Apogee',
          date: '2025-09-27',
          startTime: '22:30',
          endTime: '00:00',
          artists: ['LYNY'],
          description: 'Genre-bending bass and experimental beats.',
          imageUrl: require('../assets/artists/lyny.jpg'),
        },
        {
          id: '4',
          name: 'TERNION SOUND (Farewell Tour)',
          stage: 'The Bayou',
          date: '2025-09-27',
          startTime: '21:00',
          endTime: '22:15',
          artists: ['TERNION SOUND'],
          description: "Don't miss the legendary Ternion Sound on their farewell tour.",
          imageUrl: require('../assets/artists/ternion_sound.jpg'),
        },
        {
          id: '5',
          name: 'THE WIDDLER',
          stage: 'Apogee',
          date: '2025-09-28',
          startTime: '21:30',
          endTime: '23:00',
          artists: ['THE WIDDLER'],
          description: 'Deep dubstep vibrations.',
          imageUrl: require('../assets/artists/the_widdler.jpg'),
        },
        {
          id: '6',
          name: 'KHIVA',
          stage: 'The Bayou',
          date: '2025-09-28',
          startTime: '20:00',
          endTime: '21:15',
          artists: ['KHIVA'],
          description: 'Dark and powerful bass music.',
          imageUrl: require('../assets/artists/khiva.jpg'),
        },
        {
          id: '7',
          name: 'PROBCAUSE (DJ SET)',
          stage: 'The Art Tent',
          date: '2025-09-26',
          startTime: '19:00',
          endTime: '20:15',
          artists: ['PROBCAUSE'],
          description: 'Eclectic DJ set from ProbCause.',
          imageUrl: require('../assets/artists/probcause.jpg'),
        },
        {
          id: '8',
          name: 'SUPER FUTURE X2',
          stage: 'The Art Tent',
          date: '2025-09-27',
          startTime: '19:30',
          endTime: '20:45',
          artists: ['SUPER FUTURE'],
          description: "Double dose of Super Future's unique sound.",
          imageUrl: require('../assets/artists/super_future.jpg'),
        },
         {
          id: '9',
          name: 'JASON LEECH',
          stage: 'The Art Tent',
          date: '2025-09-28',
          startTime: '18:30',
          endTime: '19:45',
          artists: ['JASON LEECH'],
          description: 'Live electronic performance.',
          imageUrl: require('../assets/artists/jason_leech.jpg'),
        },
        {
          id: '10',
          name: 'CANVAS',
          stage: 'The Bayou',
          date: '2025-09-26',
          startTime: '17:00',
          endTime: '18:00',
          artists: ['CANVAS'],
          description: 'Artistic bass music.',
          imageUrl: require('../assets/artists/canvas.jpg'),
        },
        {
          id: '11',
          name: 'OZZTIN',
          stage: 'Apogee',
          date: '2025-09-27',
          startTime: '18:00',
          endTime: '19:00',
          artists: ['OZZTIN'],
          description: 'Energetic bass performance.',
          imageUrl: require('../assets/artists/ozztin.jpg'),
        },
        {
          id: '12',
          name: 'YOKO',
          stage: 'The Art Tent',
          date: '2025-09-28',
          startTime: '17:00',
          endTime: '18:00',
          artists: ['YOKO'],
          description: 'Unique soundscapes.',
          imageUrl: require('../assets/artists/yoko.jpg'),
        }
      ];
      setEvents(mockEvents);
      applyFilters(mockEvents, selectedDay, selectedStage);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Could not load events. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [applyFilters, selectedDay, selectedStage, setEvents, setError, setIsLoading, setIsRefreshing]); // Added dependencies

  // Toggle favorite/schedule
  const toggleFavorite = (eventId: string) => {
    // In a real app, this would call an API to add/remove from user's schedule
    // console.log(`Toggle favorite for event ${eventId}`); // Removed console.log
    
    // For now, just log the action
    alert(`Event ${eventId} added to your schedule!`);
  };

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
  };

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]); // Added fetchEvents to dependency array

  // Render each event card
  const renderEventCard = ({ item }: { item: Event }) => {
    // Format the time for display
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${formattedHour}:${minutes} ${period}`;
    };

    return (
      <View style={[styles.eventCard, { backgroundColor: theme.card }]}>
        <Image
          source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl}
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
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons name="heart-outline" size={24} color={theme.primary} />
            <Text style={[styles.favoriteText, { color: theme.primary }]}>Add to Schedule</Text>
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