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
import ShowModeHome from '../components/ShowModeHome';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

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
        <ShowModeHome />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;