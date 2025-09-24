// src/components/LiveUpcomingEvents.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ImageRequireSource } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import EventCard from '../components/EventCard';
import { ScheduleEvent } from '../types/event';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';
import { getUserSchedule, addToSchedule, removeFromSchedule } from '../services/scheduleService';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { isLoggedInUser } from '../utils/userUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

type LiveUpcomingEventsProps = {
  onEventPress?: (item: ScheduleEvent) => void;
};

const LiveUpcomingEvents: React.FC<LiveUpcomingEventsProps> = ({ onEventPress }) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [userSchedule, setUserSchedule] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const fetchEventsAndSchedule = async () => {
      try {
        // Fetch events and user schedule in parallel for speed
        // Only fetch user schedule if user is logged in (not a guest)
        const [eventsResponse, scheduleResponse] = await Promise.all([
          api.get<ScheduleEvent[]>('/events'),
          (user && isLoggedInUser(user)) ? getUserSchedule(user.id) : Promise.resolve([]),
        ]);

        setEvents(eventsResponse.data);

        if (scheduleResponse) {
          const scheduleMap = scheduleResponse.reduce<Record<string, boolean>>((acc, ev) => {
            acc[ev.id] = true;
            return acc;
          }, {});
          setUserSchedule(scheduleMap);
        }
      } catch (err) {
        setError('Could not load live events.');
        console.error('Error fetching data for LiveUpcomingEvents:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventsAndSchedule();

    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const liveOrUpcomingEventsByStage = useMemo(() => {
    if (!events.length) {
      return [];
    }

    const stages = [...new Set(events.map(e => e.stage).filter(Boolean))].sort();
    const upcomingEvents: ScheduleEvent[] = [];

    const nowTime = now.getTime();

    for (const stage of stages) {
      const stageEvents = events
        .filter(e => e.stage === stage)
        .sort((a, b) => {
          return new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime();
        });

      const nextEvent = stageEvents.find(e => {
        const startTime = new Date(`${e.date}T${e.startTime}`).getTime();
        const endTime = e.endTime ? new Date(`${e.date}T${e.endTime}`).getTime() : startTime + 2 * 60 * 60 * 1000;
        return endTime > nowTime;
      });

      if (nextEvent) {
        upcomingEvents.push(nextEvent);
      }
    }

    return upcomingEvents;
  }, [events, now]);

  const handleToggleSchedule = useCallback(async (eventToToggle: ScheduleEvent) => {
    // If no user, show login prompt
    if (!user) {
      const message = 'You need to be logged in to add events to your schedule.';
      Alert.alert('Login Required', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    
    // Check if user is a guest user
    if (user.id === 'guest-user') {
      const message = 'You need to be logged in to add events to your schedule.';
      Alert.alert('Login Required', message, [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Login', 
          onPress: async () => {
            try {
              // Need to logout first to remove guest user so Auth stack becomes available
              await logout();
              // Let the navigation system update to show Auth screen
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Could not log out. Please try again.');
            }
          }
        },
      ]);
      return;
    }

    const eventId = eventToToggle.id;
    const isCurrentlyInSchedule = userSchedule[eventId];

    // Optimistic UI update
    setUserSchedule(prev => {
      const updated = { ...prev };
      if (isCurrentlyInSchedule) {
        delete updated[eventId];
      } else {
        updated[eventId] = true;
      }
      return updated;
    });

    try {
      if (isCurrentlyInSchedule) {
        await removeFromSchedule(user.id, eventId);
      } else {
        await addToSchedule(user.id, eventId);
      }
    } catch (error) {
      // Revert on error
      setUserSchedule(prev => {
        const reverted = { ...prev };
        if (isCurrentlyInSchedule) {
          reverted[eventId] = true;
        } else {
          delete reverted[eventId];
        }
        return reverted;
      });
      Alert.alert('Error', 'Failed to update your schedule. Please try again.');
    }
  }, [user, userSchedule, navigation, logout]);

  const handleEventPress = useCallback((item: ScheduleEvent) => {
    if (onEventPress) {
      onEventPress(item);
      return;
    }
    // Fallback: switch to the Schedule tab in the parent tab navigator
    const parent = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
    parent?.navigate('Schedule');
  }, [onEventPress, navigation]);

  // Pass the full theme object as expected by EventCard
  const themeForCard = useMemo(() => ({
    ...theme
  }), [theme]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: theme.error }}>{error}</Text>
      </View>
    );
  }

  if (liveOrUpcomingEventsByStage.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: theme.text }}>No upcoming events right now.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {liveOrUpcomingEventsByStage.map((event, idx) => (
        <View key={event.id} style={styles.cardWrapper}>
          {/* Stage logo overlapping top-left only for Bayou stage or 2nd item */}
          {/* Stage-specific logos: Apogee (first), Bayou (second), The Gallery (third) */}
          {(() => {
            let logoSource: ImageRequireSource | null = null;
            let logoStyle = styles.stageLogo;
            if (event.stage === 'Apogee' || idx === 0) {
              logoSource = require('../assets/images/apogee-logo-trans.png');
              logoStyle = styles.stageLogoApogee;
            } else if (event.stage === 'Bayou' || idx === 1) {
              logoSource = require('../assets/images/bayou-logo-trans.png');
              logoStyle = styles.stageLogoBayou;
            } else if (event.stage === 'The Gallery' || idx === 2) {
              logoSource = require('../assets/images/gallery-logo-trans.png');
              logoStyle = styles.stageLogoGallery;
            }
            return logoSource ? (
              <ExpoImage 
                source={logoSource} 
                style={logoStyle} 
                contentFit="contain" 
                cachePolicy="memory-disk"
                transition={300}
              />
            ) : null;
          })()}
          <EventCard
            item={event}
            isInUserSchedule={!!userSchedule[event.id]}
            onToggleSchedule={handleToggleSchedule}
            onEventPress={() => handleEventPress(event)}
            theme={themeForCard}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    width: '100%',
  },
  centered: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  cardWrapper: {
    marginBottom: 16,
    maxHeight: 80,
    marginTop: 46,
    position: 'relative',
    width: '100%',
  },
  stageLogo: {
    position: 'absolute',
    top: -60,
    left: -20,
    width: 112,
    height: 112,
    zIndex: 5,
    opacity: 0.95,
  },
  stageLogoApogee: {
    position: 'absolute',
    top: -64,
    left: -18,
    width: 120,
    height: 120,
    zIndex: 6,
    opacity: 1,
  },
  stageLogoBayou: {
    position: 'absolute',
    top: -58,
    left: -16,
    width: 102,
    height: 102,
    zIndex: 6,
    opacity: 0.95,
  },
  stageLogoGallery: {
    position: 'absolute',
    top: -56,
    left: -16,
    width: 118,
    height: 118,
    zIndex: 6,
    opacity: 0.95,
  },
});

export default LiveUpcomingEvents;
