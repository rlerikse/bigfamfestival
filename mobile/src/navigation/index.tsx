import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Dimensions, Image } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useDebug } from '../contexts/DebugContext';
import { useTheme } from '../contexts/ThemeContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import MapScreen from '../screens/MapScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AdminNotificationsScreen from '../screens/AdminNotificationsScreen'; // Import the new screen
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DebugScreen from '../screens/DebugScreen';
import GrassBottomTabBar from '../components/GrassBottomTabBar';
import DayNightCycle from '../components/DayNightCycle';

// Define navigation types
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  Profile: undefined;
  Settings: undefined;
  Debug: undefined;
  AdminNotifications: undefined; // Add the new screen to types
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Schedule: undefined;
  Map: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth navigation stack
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Main tab navigation with custom grass bottom tab bar
function MainNavigator() {
  const { height } = Dimensions.get('window');
  const { debugMode, debugHour } = useDebug();
  const { isPerformanceMode } = useTheme(); // Added isPerformanceMode from ThemeContext
  const { user } = useAuth(); // Get user data for profile picture
  
  return (
    <View style={{ flex: 1 }}>
      {/* Full-Screen Day/Night Cycle Background - Conditionally render based on performance mode */}
      {!isPerformanceMode && (
        <DayNightCycle
          height={height}
          debugMode={debugMode}
          debugHour={debugHour}
        />
      )}
      <Tab.Navigator
        tabBar={(props) => <GrassBottomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Schedule"
          component={ScheduleScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'map' : 'map-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => {              // Use profile picture if available, otherwise use default person icon
              if (user?.profilePictureUrl) {
                return (
                  <View style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: focused ? 2 : 1,
                    borderColor: focused ? '#D4946B' : '#8B7355',
                    overflow: 'hidden',
                    backgroundColor: '#F5F5DC',
                    shadowColor: '#000',
                    shadowOffset: {
                      width: 0,
                      height: 1,
                    },
                    shadowOpacity: focused ? 0.3 : 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}>
                    <Image
                      source={{ uri: user.profilePictureUrl }}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                      resizeMode="cover"
                    />
                  </View>
                );
              }
              return (
                <View style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: focused ? 2 : 1,
                  borderColor: focused ? '#D4946B' : color,
                  backgroundColor: focused ? '#D4946B20' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons
                    name={focused ? 'person' : 'person-outline'}
                    size={size - 8}
                    color={color}
                  />
                </View>
              );
            },
          }}
        />
        {/* <Tab.Screen
          name="MySchedule"
          component={MyScheduleScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        /> */}
      </Tab.Navigator>
    </View>
  );
}

// Root navigation
export default function Navigation() {
  const { user, isLoading } = useAuth();

  // Show loading screen if auth state is still loading
  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              headerShown: true,
              title: 'Profile',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: 'Settings',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="AdminNotifications"
            component={AdminNotificationsScreen}
            options={{
              headerShown: true,
              title: 'Send Notifications',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Debug"
            component={DebugScreen}
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
