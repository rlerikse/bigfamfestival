import React from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import TopNavBar from '../components/TopNavBar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { Alert } from 'react-native';
import Countdown from '../components/Countdown';
import LiveUpcomingEvents from '../components/LiveUpcomingEvents';
import EventDetailsModal from '../components/EventDetailsModal';
import { ScheduleEvent } from '../types/event';
import { useAuth } from '../contexts/AuthContext';
import { addToSchedule, removeFromSchedule, getUserSchedule } from '../services/scheduleService';
import { isLoggedInUser } from '../utils/userUtils';
import { useFestivalState } from '../hooks/useFestivalState';
import { festivalConfig } from '../config/festival.config';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

// Fallback doors date used only if Firestore config is unavailable and
// festival.config.startDate hasn't been set. Kept for backward-compat.
const DOORS_DATE_FALLBACK = new Date('2026-09-25T14:00:00-05:00');

const HomeScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const festivalState = useFestivalState();
  const [selectedEvent, setSelectedEvent] = React.useState<ScheduleEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [userSchedule, setUserSchedule] = React.useState<Record<string, boolean>>({});

  // Determine the countdown target: window start if upcoming, or the configured end
  const countdownTarget = React.useMemo(() => {
    if (festivalState.windowStart) return festivalState.windowStart;
    // Fallback to config start date if Firestore not loaded yet
    try {
      const [year, month, day] = festivalConfig.startDate.split('-').map(Number);
      return new Date(year, month - 1, day, 14, 0, 0); // 2 PM EST gates open
    } catch {
      return DOORS_DATE_FALLBACK;
    }
  }, [festivalState.windowStart]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user || !isLoggedInUser(user)) return;
      try {
        const schedule = await getUserSchedule(user.id);
        if (!mounted) return;
        const map = schedule.reduce<Record<string, boolean>>((acc, ev) => { acc[ev.id] = true; return acc; }, {});
        setUserSchedule(map);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const openEventModal = (item: ScheduleEvent) => {
    setSelectedEvent(item);
    setIsModalVisible(true);
  };

  const closeEventModal = () => {
    setIsModalVisible(false);
    setSelectedEvent(null);
  };

  const handleToggleSchedule = async (ev: ScheduleEvent) => {
    if (!user || !isLoggedInUser(user) || user.id === 'guest-user') {
      Alert.alert(
        'Login Required',
        'Please log in to manage your schedule.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Auth') },
        ]
      );
      return;
    }
    const id = ev.id;
    const isIn = !!userSchedule[id];
    setUserSchedule(prev => {
      const copy = { ...prev };
      if (isIn) delete copy[id]; else copy[id] = true;
      return copy;
    });
    try {
      if (isIn) await removeFromSchedule(user.id, id); else await addToSchedule(user.id, id);
    } catch (e) {
      setUserSchedule(prev => {
        const copy = { ...prev };
        if (isIn) copy[id] = true; else delete copy[id];
        return copy;
      });
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>

      <StatusBar style={isDark ? 'light' : 'dark'} />

      <TopNavBar
        onSettingsPress={() => navigation.navigate('Settings')}
        whiteIcons={true}
      />

      {/* Main content — flex:1 preserves tab bar */}
      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Festival-style countdown — "UNTIL GATES OPEN" */}
        <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
          <View style={{ height: 4 }} />
          <View style={{ height: 1, width: '66%', alignSelf: 'center', backgroundColor: '#D4946B', opacity: 0.35, borderRadius: 1 }} />
          <View style={{ height: 0 }} />
          <Countdown
            targetDate={countdownTarget}
            festivalPhase={festivalState.phase}
          />
          <View style={{ height: 12 }} />
          <View style={{ height: 1, width: '66%', alignSelf: 'center', backgroundColor: '#D4946B', opacity: 0.35, borderRadius: 1 }} />
        </View>

        {/* Artist cards — festival mode (EventCard with stage logos) */}
        <LiveUpcomingEvents onEventPress={openEventModal} />
      </ScrollView>

      <EventDetailsModal
        isVisible={isModalVisible}
        onClose={closeEventModal}
        event={selectedEvent}
        isInSchedule={!!selectedEvent && !!userSchedule[selectedEvent.id]}
        onToggleSchedule={handleToggleSchedule}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
