import React, { useState, useEffect, useRef } from 'react'; // Added useState, useEffect, useRef
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform, // Added Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';

import { useTheme } from '../contexts/ThemeContext';
import { useDebug } from '../contexts/DebugContext';
import { RootStackParamList } from '../navigation';
import DayNightCycle from '../components/DayNightCycle';

type DebugScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Debug'>;

const DebugScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<DebugScreenNavigationProp>();
  const { setDebugMode, debugHour, setDebugHour } = useDebug(); // Removed debugMode
  const [isAnimating, setIsAnimating] = useState(false); // State for animation
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Ref for interval

  // Animation loop for debugHour
  useEffect(() => {
    if (isAnimating) {
      animationIntervalRef.current = setInterval(() => {
        setDebugHour((debugHour + 1) % 24); // Reverted to direct update, debugHour is in dependency array
      }, 200); // Keep faster animation speed (200ms)
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    }
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isAnimating, setDebugHour, debugHour]); // Ensured debugHour is in dependencies

  const handleExitDebug = () => {
    Alert.alert(
      'Exit Debug Mode',
      'Are you sure you want to exit debug mode?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'default', 
          onPress: () => {
            // Turn off debug mode and navigate back to settings
            setDebugMode(false);
            navigation.navigate('Settings');
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
        {/* Day/Night Cycle Background with Debug Mode */}
      <DayNightCycle 
        height={800} 
        debugMode={true}
        debugHour={debugHour}
      />
      
      {/* Debug Controls Container */}
      <View style={styles.debugControls}>
        <View style={[styles.controlsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Debug Controls</Text>
            <TouchableOpacity
              style={[styles.exitButton, { backgroundColor: theme.error }]}
              onPress={handleExitDebug}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
              <Text style={styles.exitButtonText}>Exit Debug</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: theme.text }]}>
              Time of Day: {String(Math.floor(debugHour)).padStart(2, '0')}:00
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={23}
              value={debugHour}
              onValueChange={(value) => {
                if (isAnimating) setIsAnimating(false); // Stop animation if slider is manually moved
                setDebugHour(value);
              }}
              step={1}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              {...(Platform.OS === 'ios' 
                ? { thumbTintColor: theme.primary } 
                : { thumbStyle: { backgroundColor: theme.primary, height: 20, width: 20, borderRadius: 10 } })}
            />
            <View style={styles.sliderLabels}>
              <Ionicons name="moon-outline" size={24} color={theme.muted} />
              <Ionicons name="partly-sunny-outline" size={24} color={theme.muted} />
              <Ionicons name="sunny" size={24} color={theme.muted} />
              <Ionicons name="cloudy-night-outline" size={24} color={theme.muted} />
              <Ionicons name="moon" size={24} color={theme.muted} />
            </View>
          </View>
          
          {/* Play/Stop Controls */}
          <View style={styles.animationControls}>
            <TouchableOpacity 
              style={[styles.animationButton, { backgroundColor: theme.primary }]} 
              onPress={() => setIsAnimating(!isAnimating)}
            >
              <Ionicons name={isAnimating ? "pause-circle-outline" : "play-circle-outline"} size={30} color="#FFFFFF" />
              <Text style={styles.animationButtonText}>{isAnimating ? "Pause" : "Play"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>Current State:</Text>
            <Text style={[styles.infoText, { color: theme.muted }]}>
              Hour: {Math.floor(debugHour)}
            </Text>
            <Text style={[styles.infoText, { color: theme.muted }]}>
              Period: {debugHour >= 6 && debugHour < 18 ? 'Day' : 'Night'}
            </Text>
            <Text style={[styles.infoText, { color: theme.muted }]}>
              Debug Mode: Active
            </Text>          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlsCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabelSmall: {
    fontSize: 12,
  },
  animationControls: { // Styles for animation controls
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  animationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  animationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  infoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default DebugScreen;
