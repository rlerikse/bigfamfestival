import React from 'react';
import {
  View,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import DayNightCycle from '../components/DayNightCycle';
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

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const HomeScreen = () => {
  const { theme, isDark, isPerformanceMode } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const gatesOpenDate = new Date('2025-09-26T10:00:00');
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = React.useState<ScheduleEvent | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [userSchedule, setUserSchedule] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      // Only fetch user schedule if user is logged in (not a guest)
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
    // Require a logged-in (non-guest) user to manage schedule
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
      // revert
      setUserSchedule(prev => {
        const copy = { ...prev };
        if (isIn) copy[id] = true; else delete copy[id];
        return copy;
      });
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isPerformanceMode ? (theme.background || '#FFFFFF') : 'transparent' }}>
      {/* Day/Night Cycle Background - Only render if performance mode is off */}
      {!isPerformanceMode && (
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          zIndex: 0 
        }}>
          <DayNightCycle height={Dimensions.get('window').height} />
        </View>
      )}

      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <TopNavBar 
        onSearch={(_query) => { /* Implement search logic */ }} 
        onSettingsPress={() => navigation.navigate('Settings')}
        whiteIcons={true}
      />

      {/* Main content container */}
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch' }}>
        {/* Semi-transparent overlay to ensure text readability over the day/night cycle */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
           zIndex: 0
         }} />
         
         {/* Content container with higher z-index */}
         <View style={{ 
           justifyContent: 'flex-start', 
           alignItems: 'stretch', 
           zIndex: 1,
           backgroundColor: 'transparent',
           padding: 5,
           borderRadius: 16,
           marginHorizontal: 20,
           marginTop: 80, // Account for TopNavBar
         }}>
          {/* Copper divider above Gates Open In image */}
          <View style={{ height: 6 }} />
          <View style={{ height: 1, width: '66%', alignSelf: 'center', backgroundColor: '#D4946B', opacity: 0.35, borderRadius: 1 }} />
          <View style={{ height: 6 }} />
          {/* Gates Open In image centered above countdown, width matches countdown */}
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <ExpoImage
              source={require('../assets/images/gates-open-in.png')}
              style={{ width: 320, height: 60 }}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={300}
              accessibilityLabel="Gates Open In"
            />
          </View>
          <Countdown targetDate={gatesOpenDate} />

          {/* subtle divider + even less spacing between countdown and events */}
          <View style={{ height: 12 }} />
          <View style={{ height: 1, width: '66%', alignSelf: 'center', backgroundColor: '#D4946B', opacity: 0.35, borderRadius: 1 }} />
          <View style={{ height: 0 }} />

          <LiveUpcomingEvents onEventPress={openEventModal} />
         </View>
        <EventDetailsModal
          isVisible={isModalVisible}
          onClose={closeEventModal}
          event={selectedEvent}
          isInSchedule={!!selectedEvent && !!userSchedule[selectedEvent.id]}
          onToggleSchedule={handleToggleSchedule}
        />
       </View>
     </SafeAreaView>
   );
 };

 export default HomeScreen;