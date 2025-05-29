import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MyScheduleScreen from '../screens/MyScheduleScreen';
import MapScreen from '../screens/MapScreen';
// import NotificationsScreen from '../screens/NotificationsScreen';
// import MoreScreen from '../screens/MoreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GrassBottomTabBar from '../components/GrassBottomTabBar';

// Define navigation types
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  MySchedule: undefined;
  Map: undefined;
  Notifications: undefined;
  More: undefined;
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

// Main tab navigation
function MainNavigator() {
  const { theme } = useTheme(); // Get the theme from context

  return (
    <Tab.Navigator
      tabBar={props => <GrassBottomTabBar {...props} />}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          let label: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            label = 'Home';
          } else if (route.name === 'MySchedule') {
            iconName = focused ? 'heart' : 'heart-outline';
            label = 'Schedule';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
            label = 'Map';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
            label = 'Notifications';
          } else if (route.name === 'More') {
            iconName = focused ? 'menu' : 'menu-outline';
            label = 'More';
          } else {
            iconName = 'help-circle';
            label = 'Help';
          }

          return (
            <View style={{ alignItems: 'center' }}>
              <Ionicons 
                name={iconName} 
                size={size} 
                color={focused ? 'white' : '#B8860B'} // White for active, muted gold (#B8860B) for inactive
              />
              <Text style={{
                color: focused ? 'white' : '#B8860B',
                fontSize: 12,
                marginTop: 4,
              }}>
                {label}
              </Text>
            </View>
          );
        },
        tabBarActiveTintColor: theme.primary, // Use theme color
        tabBarInactiveTintColor: theme.muted, // Use theme color
        tabBarStyle: {
          backgroundColor: 'transparent', // Transparent background to let our custom tab bar show through
          borderTopColor: 'transparent', // Make default border invisible
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
        },
        headerStyle: {
          backgroundColor: theme.card, // Use theme color for header background
        },
        headerTintColor: theme.text, // Use theme color for header text
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // headerShown: true, // This was already here, ensure it's set as needed
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="MySchedule" 
        component={MyScheduleScreen} 
        options={{ title: 'My Schedule' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: 'Map' }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={HomeScreen} // Temporarily using HomeScreen
        options={{ title: 'Notifications' }}
      />
      <Tab.Screen 
        name="More" 
        component={HomeScreen} // Temporarily using HomeScreen
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
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
        // User is signed in
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ 
              headerShown: true,
              title: 'Profile',
              presentation: 'modal'
            }}
          />
        </>
      ) : (
        // User is not signed in
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
