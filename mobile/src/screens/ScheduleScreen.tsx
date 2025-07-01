// Commit: Refactor schedule and my schedule into unified ScheduleScreen with new filter UI
// Author: GitHub Copilot, 2025-06-30

/**
 * ScheduleScreen
 * Shows all events with filters for date, stage (dropdown), and "My Schedule" (favorites).
 * UI matches new design: date row, then grid icon + My Schedule filter, then stage dropdown.
 * Replaces HomeScreen and MyScheduleScreen logic.
 */
import React, { useState, useEffect, useCallback } from 'react';
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
  Dimensions,
  StyleSheet,
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
import { homeScreenStyles as filterStyles } from './HomeScreen.styles';

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
}

type ScheduleScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const festivalDays = [
  { id: '2025-09-28', label: 'Sep 28\nTHU', date: '2025-09-28' },
  { id: '2025-09-29', label: 'Sep 29\nFRI', date: '2025-09-29' },
  { id: '2025-09-30', label: 'Sep 30\nSAT', date: '2025-09-30' },
];
const stages = [
  { id: 'all', label: 'All Stages', value: 'all' },
  { id: 'Apogee', label: 'Apogee', value: 'Apogee' },
  { id: 'The Bayou', label: 'The Bayou', value: 'The Bayou' },
  { id: 'The Art Tent', label: 'The Art Tent', value: 'The Art Tent' },
];

// Styles for the event cards (MySchedule style)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateFilterButton: {
    height: 96, // Double the normal height
    minHeight: 96,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  dateFilterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
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

const ScheduleScreen = () => {
  const { theme, isDark, isPerformanceMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<ScheduleScreenNavigationProp>();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSchedule, setUserSchedule] = useState<Record<string, boolean>>({});
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(festivalDays[0].date);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [showMySchedule, setShowMySchedule] = useState(false);

  // --- Fetch events and user schedule ---
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await api.get<ScheduleEvent[]>('/events', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      setEvents(response.data);
    } catch (err) {
      setError('Could not load events. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadUserSchedule = useCallback(async () => {
    if (!user) return;
    try {
      const schedule = await getUserSchedule(user.id);
      const scheduleMap = schedule.reduce<Record<string, boolean>>((acc, ev) => {
        acc[ev.id] = true;
        return acc;
      }, {});
      setUserSchedule(scheduleMap);
    } catch {
      // Silently fail - user schedule is not critical
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
    if (user) loadUserSchedule();
  }, [fetchEvents, loadUserSchedule, user]);

  // --- Filtering logic ---
  useEffect(() => {
    let filtered = [...events];
    filtered = filtered.filter(ev => ev.date === selectedDay);
    if (selectedStage !== 'all') filtered = filtered.filter(ev => ev.stage === selectedStage);
    if (showMySchedule) filtered = filtered.filter(ev => userSchedule[ev.id]);
    filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setFilteredEvents(filtered);
  }, [events, selectedDay, selectedStage, showMySchedule, userSchedule]);

  // --- UI Handlers ---
  const handleToggleSchedule = async (eventToToggle: ScheduleEvent) => {
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
  };

  // --- Renderers ---
  const renderEventCard = ({ item }: { item: ScheduleEvent }) => {
    const isInUserSchedule = userSchedule[item.id];
    let displayImageUrl: string | null = null;
    if (item.imageUrl) {
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
        displayImageUrl = `https://big-fam-app.S3.us-east-2.amazonaws.com/${item.imageUrl}`;
      }
    }

    const formatTime = (timeString: string) => {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    return (
      <TouchableOpacity 
        style={[
          styles.eventCard, 
          { borderColor: theme.border, backgroundColor: theme.card }
        ]}
        onPress={() => { setSelectedEvent(item); setIsModalVisible(true); }}
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
            {item.stage} - {formatTime(item.startTime)}
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
          onPress={(e) => {
            e.stopPropagation();
            handleToggleSchedule(item);
          }}
        >
          <Ionicons
            name={isInUserSchedule ? 'heart' : 'heart-outline'}
            size={24}
            color={isDark ? '#B87333' : theme.secondary || '#FF5722'}
          />
          <Text style={[styles.favoriteText, { color: isDark ? '#B87333' : theme.secondary || '#FF5722' }]}>
            {isInUserSchedule ? 'Added' : 'Add'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // --- Main Render ---
  return (
    <SafeAreaView style={[filterStyles.container, { backgroundColor: isPerformanceMode ? (theme.background || '#FFFFFF') : 'transparent' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TopNavBar 
        onSearch={(_query) => { /* Implement search logic */ }} 
        onSettingsPress={() => navigation.navigate('Settings')} 
        onNotificationsPress={() => Alert.alert('Notifications coming soon!')} 
      />
      
      {/* Date filter row */}
      <View style={[filterStyles.filterRowContainer, { marginTop: 78 }]}>
        {festivalDays.map(day => (
          <TouchableOpacity
            key={day.id}
            style={[styles.dateFilterButton, { borderColor: theme.border }, day.date === selectedDay && { backgroundColor: theme.primary }]}
            onPress={() => setSelectedDay(day.date)}
          >
            <Text style={[styles.dateFilterButtonText, day.date === selectedDay ? { color: theme.background } : { color: theme.text }]}>
              {day.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 2nd row: grid icon, My Schedule filter, stage dropdown */}
      <View style={[filterStyles.filterRowContainer, { flexDirection: 'row', alignItems: 'center', marginBottom: 8 }]}>
        {/* Grid icon placeholder */}
        <TouchableOpacity style={{ marginRight: 16, padding: 8 }}>
          <MaterialCommunityIcons name="view-grid-outline" size={28} color={theme.text} />
        </TouchableOpacity>
        
        {/* My Schedule filter */}
        <TouchableOpacity
          style={[filterStyles.filterButton, showMySchedule && { backgroundColor: theme.primary }, { marginRight: 16 }]}
          onPress={() => setShowMySchedule(v => !v)}
        >
          <Text style={[filterStyles.filterButtonText, showMySchedule ? { color: theme.background } : { color: theme.text }]}>
            My Schedule
          </Text>
        </TouchableOpacity>
        
        {/* Stage dropdown */}
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={[filterStyles.filterButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => Alert.alert('Stage Dropdown', 'Implement dropdown here.')}
          >
            <Text style={[filterStyles.filterButtonText, { flex: 1 }]} numberOfLines={1}>
              {stages.find(s => s.value === selectedStage)?.label || 'All Stages'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Event list */}
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
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={theme.muted || '#666666'} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No events found for the selected filters.</Text>
          <TouchableOpacity style={styles.resetButton} onPress={() => { setSelectedDay(festivalDays[0].date); setSelectedStage('all'); setShowMySchedule(false); }}>
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
          ListEmptyComponent={() => (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.text }}>No events found</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={fetchEvents}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      )}
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
