import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import from our contexts
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Import from our services
import api from '../services/api';

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
  const { user } = useAuth();
  const navigation = useNavigation();
  
  // State for events and loading states
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Mock festival days for the filter
  const festivalDays = [
    { id: 'all', label: 'All Days' },
    { id: '2025-06-20', label: 'Day 1' },
    { id: '2025-06-21', label: 'Day 2' },
    { id: '2025-06-22', label: 'Day 3' },
  ];

  // Mock stages for the filter
  const stages = [
    { id: 'all', label: 'All Stages' },
    { id: 'Main Stage', label: 'Main Stage' },
    { id: 'Stage A', label: 'Stage A' },
    { id: 'Stage B', label: 'Stage B' },
    { id: 'Stage C', label: 'Stage C' },
  ];

  // This function would be connected to a real API in production
  const fetchEvents = async () => {
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
          name: 'DJ Nightwave',
          stage: 'Main Stage',
          date: '2025-06-20',
          startTime: '19:30',
          endTime: '21:00',
          artists: ['DJ Nightwave'],
          description: 'Experience the electrifying beats of DJ Nightwave',
          imageUrl: 'https://images.unsplash.com/photo-1571751239073-38b8fcd74595?ixlib=rb-4.0.3&auto=format&fit=crop&w=1050&q=80',
        },
        {
          id: '2',
          name: 'Indie Sparks',
          stage: 'Stage A',
          date: '2025-06-20',
          startTime: '18:00',
          endTime: '19:30',
          artists: ['Indie Sparks'],
          description: 'Soulful indie melodies to start your evening',
          imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1050&q=80',
        },
        {
          id: '3',
          name: 'Rock Revolution',
          stage: 'Stage B',
          date: '2025-06-21',
          startTime: '20:00',
          endTime: '22:00',
          artists: ['Rock Revolution'],
          description: 'Get ready to rock with the most energetic band',
          imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&auto=format&fit=crop&w=1050&q=80',
        },
        {
          id: '4',
          name: 'Drum Circle',
          stage: 'Stage C',
          date: '2025-06-22',
          startTime: '16:00',
          endTime: '17:30',
          artists: ['Drum Circle Collective'],
          description: 'Join the community drum circle experience',
          imageUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1050&q=80',
        },
        {
          id: '5',
          name: 'Pop Sensation',
          stage: 'Main Stage',
          date: '2025-06-22',
          startTime: '21:00',
          endTime: '23:00',
          artists: ['Pop Sensation'],
          description: 'Chart-topping hits and amazing choreography',
          imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1050&q=80',
        },
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
  };

  // Apply day and stage filters
  const applyFilters = (allEvents: Event[], day: string, stage: string) => {
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
  };

  // Toggle favorite/schedule
  const toggleFavorite = (eventId: string) => {
    // In a real app, this would call an API to add/remove from user's schedule
    console.log(`Toggle favorite for event ${eventId}`);
    
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
  }, []);

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
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/300x200' }}
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
      style={[
        styles.filterButton,
        selectedValue === id ? 
          { backgroundColor: theme.primary } : 
          { backgroundColor: 'transparent', borderColor: theme.border, borderWidth: 1 }
      ]}
      onPress={() => onSelect(id)}
    >
      <Text
        style={[
          styles.filterButtonText,
          { color: selectedValue === id ? '#FFFFFF' : theme.text }
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
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 8,
  },
  filterButtonText: {
    fontWeight: '600',
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