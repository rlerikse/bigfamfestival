import React from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import DayNightCycle from '../components/DayNightCycle';
import TopNavBar from '../components/TopNavBar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { Alert } from 'react-native';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const HomeScreen = () => {
  const { theme, isDark, isPerformanceMode } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

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
        onNotificationsPress={() => Alert.alert('Notifications coming soon!')} 
      />

      {/* Main content container */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Semi-transparent overlay to ensure text readability over the day/night cycle */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isPerformanceMode ? 'transparent' : 'rgba(0, 0, 0, 0.3)',
          zIndex: 0
        }} />
        
        {/* Content container with higher z-index */}
        <View style={{ 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 1,
          backgroundColor: isPerformanceMode ? 'transparent' : 'rgba(0, 0, 0, 0.6)',
          padding: 32,
          borderRadius: 16,
          marginHorizontal: 20,
          marginTop: 80, // Account for TopNavBar
        }}>
          <Image
            source={{ uri: 'https://img.icons8.com/color/96/000000/under-construction.png' }}
            style={{ width: 96, height: 96, marginBottom: 24 }}
          />
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            Under Construction
          </Text>
          <Text style={{ color: '#aaa', fontSize: 16, textAlign: 'center', maxWidth: 280, lineHeight: 22 }}>
            The Home screen is being rebuilt. Please use the Schedule tab for now.
          </Text>
          <Ionicons name="construct" size={48} color="#FFD600" style={{ marginTop: 24 }} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;