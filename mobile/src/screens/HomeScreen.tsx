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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import * as SecureStore from 'expo-secure-store';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { addToSchedule, removeFromSchedule, getUserSchedule } from '../services/scheduleService';
import { api } from '../services/api';
import { ScheduleEvent } from '../types/event';
import EventDetailsModal from '../components/EventDetailsModal'; // Corrected import

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const HomeScreen = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSchedule, setUserSchedule] = useState<Record<string, boolean>>({});
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const festivalDays = [
    { id: 'all', label: 'ALL', date: 'all' },
    { id: '2025-09-26', label: 'FRI 26', date: '2025-09-26' },
    { id: '2025-09-27', label: 'SAT 27', date: '2025-09-27' },
    { id: '2025-09-28', label: 'SUN 28', date: '2025-09-28' },
  ];

  const stages = [
    { id: 'all', label: 'ALL', value: 'all' },
    { id: 'Apogee', label: 'APOGEE', value: 'Apogee' },
    { id: 'The Bayou', label: 'THE BAYOU', value: 'The Bayou' },
    { id: 'The Art Tent', label: 'ART TENT', value: 'The Art Tent' },
  ];

  const applyFilters = useCallback((allEvents: ScheduleEvent[], day: string, stage: string) => {
    let filtered = [...allEvents];
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
  }, [setFilteredEvents]); // setFilteredEvents is stable

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await api.get<ScheduleEvent[]>('/events', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const fetchedEvents = response.data;
      setEvents(fetchedEvents);
      applyFilters(fetchedEvents, selectedDay, selectedStage);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Could not load events. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [applyFilters, selectedDay, selectedStage]);

  const handleToggleSchedule = useCallback(async (eventToToggle: ScheduleEvent) => {
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
    setIsRefreshing(true);
    fetchEvents();
  };

  const handleDayFilter = (day: string) => {
    setSelectedDay(day);
    applyFilters(events, day, selectedStage);
  };

  const handleStageFilter = (stage: string) => {
    setSelectedStage(stage);
    applyFilters(events, selectedDay, stage);
  };

  const loadUserSchedule = useCallback(async () => {
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
    fetchEvents();
    if (user) {
      loadUserSchedule();
    }
  }, [fetchEvents, loadUserSchedule, user]);

  const renderEventCard = ({ item }: { item: ScheduleEvent }) => {
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

    return (
      <TouchableOpacity onPress={() => { setSelectedEvent(item); setIsModalVisible(true); }}>
        <View style={[styles.eventCard, { backgroundColor: theme.card }]}>
          <Image
            source={displayImageUrl ? { uri: displayImageUrl } : require('../assets/images/event-placeholder.png')}
            style={styles.eventImage}
            resizeMode="cover"
          />
          <View style={styles.eventContent}>
            <View style={styles.eventTextContainer}>
              <Text style={[styles.eventTitle, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.eventDetails, { color: theme.muted }]}
              >
                {item.stage} - {formatTimeDisplay(item.startTime)} {/* Corrected to startTime*/}
              </Text>
              {item.description && (
                <Text style={[styles.eventDescription, { color: theme.text }]} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => { e.stopPropagation(); handleToggleSchedule(item); }}
            >
              <Ionicons name={isInUserSchedule ? "heart" : "heart-outline"} size={24} color={theme.primary} />
              <Text style={[styles.favoriteText, { color: theme.primary }]}>
                {isInUserSchedule ? "Added" : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.content}>
        {/* Filters */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
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
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
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
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={fetchEvents}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={theme.muted} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No events found for the selected filters.
            </Text>
            <TouchableOpacity style={styles.resetButton} onPress={() => { setSelectedDay('all'); setSelectedStage('all'); applyFilters(events, 'all', 'all'); }}>
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
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
          />
        )}
      </View>
      <EventDetailsModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        event={selectedEvent}
        isInSchedule={selectedEvent ? !!userSchedule[selectedEvent.id] : false}
        onToggleSchedule={handleToggleSchedule}
      />
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
  filterContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  filterContent: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventsList: {
    paddingHorizontal: 16,
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

export default HomeScreen;