import React from 'react';
import {
  View,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import DayNightCycle from '../components/DayNightCycle';
import TopNavBar from '../components/TopNavBar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { Alert } from 'react-native';
import { useCountdown } from '../hooks/useCountdown';
import LiveUpcomingEvents from '../components/LiveUpcomingEvents';
import EventDetailsModal from '../components/EventDetailsModal';
import { ScheduleEvent } from '../types/event';
import { useAuth } from '../contexts/AuthContext';
import { addToSchedule, removeFromSchedule, getUserSchedule } from '../services/scheduleService';
import { isLoggedInUser } from '../utils/userUtils';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

// Show config — doors at 8 PM EDT Saturday April 25
const DOORS_DATE = new Date('2026-04-25T20:00:00-04:00');
const HIDE_AFTER = new Date('2026-04-26T02:00:00-04:00');
const TICKET_URL = 'https://www.ticketweb.com/event/josh-teed-pike-room-the-crofoot-tickets/14180784';
const FACEBOOK_URL = 'https://facebook.com/events/s/josh-teed-pike-room/1535485537547851/';

const HomeScreen = () => {
  const { theme, isDark, isPerformanceMode } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = React.useState<ScheduleEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [userSchedule, setUserSchedule] = React.useState<Record<string, boolean>>({});
  const timeLeft = useCountdown(DOORS_DATE);
  const showEvent = Date.now() < HIDE_AFTER.getTime();
  const doorsOpen = timeLeft === null || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user || !isLoggedInUser(user)) return;
      try {
        const schedule = await getUserSchedule(user.id);
        if (!mounted) return;
        const map = schedule.reduce<Record<string, boolean>>((acc, ev) => { acc[ev.id] = true; return acc; }, {});
        setUserSchedule(map);
      } catch (e) { /* ignore */ }
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

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isPerformanceMode ? (theme.background || '#FFFFFF') : 'transparent' }}>
      {!isPerformanceMode && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <DayNightCycle height={Dimensions.get('window').height} />
        </View>
      )}

      <StatusBar style={isDark ? 'light' : 'dark'} />

      <TopNavBar
        onSettingsPress={() => navigation.navigate('Settings')}
        whiteIcons={true}
      />

      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ paddingTop: 75, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {showEvent && (
          <View style={heroStyles.container}>
            {/* Hero flyer image */}
            <Image
              source={require('../assets/images/josh-teed-flyer.jpg')}
              style={heroStyles.flyer}
              resizeMode="contain"
              accessibilityLabel="Josh Teed at The Crofoot flyer"
            />

            {/* Countdown */}
            <View style={heroStyles.countdownWrap}>
              {doorsOpen ? (
                <Text style={heroStyles.doorsOpenText}>🚨 DOORS OPEN</Text>
              ) : (
                <>
                  <Text style={heroStyles.untilText}>UNTIL DOORS</Text>
                  <View style={heroStyles.countdownRow}>
                    <View style={heroStyles.timeBlock}>
                      <Text style={heroStyles.timeValue}>{pad(timeLeft?.days ?? 0)}</Text>
                      <Text style={heroStyles.timeLabel}>DAYS</Text>
                    </View>
                    <Text style={heroStyles.colon}>:</Text>
                    <View style={heroStyles.timeBlock}>
                      <Text style={heroStyles.timeValue}>{pad(timeLeft?.hours ?? 0)}</Text>
                      <Text style={heroStyles.timeLabel}>HRS</Text>
                    </View>
                    <Text style={heroStyles.colon}>:</Text>
                    <View style={heroStyles.timeBlock}>
                      <Text style={heroStyles.timeValue}>{pad(timeLeft?.minutes ?? 0)}</Text>
                      <Text style={heroStyles.timeLabel}>MIN</Text>
                    </View>
                    <Text style={heroStyles.colon}>:</Text>
                    <View style={heroStyles.timeBlock}>
                      <Text style={heroStyles.timeValue}>{pad(timeLeft?.seconds ?? 0)}</Text>
                      <Text style={heroStyles.timeLabel}>SEC</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Action buttons */}
            <View style={heroStyles.buttonRow}>
              <TouchableOpacity
                style={heroStyles.ticketBtn}
                onPress={() => Linking.openURL(TICKET_URL).catch(() => { /* ignore */ })}
                activeOpacity={0.8}
              >
                <Text style={heroStyles.ticketBtnText}>🎟  Get Tickets</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={heroStyles.fbBtn}
                onPress={() => Linking.openURL(FACEBOOK_URL).catch(() => { /* ignore */ })}
                activeOpacity={0.8}
              >
                <Text style={heroStyles.fbBtnText}>Facebook Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Divider */}
        <View style={{ height: 16 }} />
        <View style={{ height: 1, width: '66%', alignSelf: 'center', backgroundColor: '#D4946B', opacity: 0.35 }} />
        <View style={{ height: 8 }} />

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

const GOLD = '#C9A84C';
const GOLD_DIM = '#7A6030';

const heroStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  flyer: {
    width: '100%',
    height: 380,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
  },
  countdownWrap: {
    alignItems: 'center',
    marginTop: 16,
  },
  untilText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 8,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: '#B87333',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timeLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: '#B87333',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  colon: {
    color: GOLD,
    fontSize: 28,
    fontWeight: 'bold',
    paddingBottom: 12,
    marginHorizontal: 2,
  },
  doorsOpenText: {
    color: GOLD,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  ticketBtn: {
    flex: 1,
    backgroundColor: GOLD,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  ticketBtnText: {
    color: '#0A0A0A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fbBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: GOLD_DIM,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  fbBtnText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default HomeScreen;