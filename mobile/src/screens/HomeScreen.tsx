import React from 'react';
import {
  View,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';
import DayNightCycle from '../components/DayNightCycle';
import TopNavBar from '../components/TopNavBar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import Countdown from '../components/Countdown';
import ShowModeHome from '../components/ShowModeHome';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

// Doors at 8 PM EDT tonight
const DOORS_DATE = new Date('2026-04-25T20:00:00-04:00');

const HomeScreen = () => {
  const { isDark, isPerformanceMode, theme } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

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
        {/* Existing countdown component — styled like festival "GATES OPEN" */}
        <View style={{ paddingHorizontal: 20 }}>
          <Countdown targetDate={DOORS_DATE} />
        </View>

        {/* Divider */}
        <View style={{ height: 12 }} />
        <View style={{ height: 1, width: '66%', alignSelf: 'center', backgroundColor: '#D4946B', opacity: 0.35 }} />
        <View style={{ height: 12 }} />

        {/* Stage section with live now playing + lineup */}
        <ShowModeHome />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;