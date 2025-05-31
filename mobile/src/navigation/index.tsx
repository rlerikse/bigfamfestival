import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Image, Dimensions } from 'react-native';

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

const { width } = Dimensions.get('window');

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
        header: ({ options, route }) => (
          <View style={{ // Main header container
            paddingTop: 25, // Status bar height
            height: 55 + 25, // Content height (55) + status bar height
            backgroundColor: theme.card,
            position: 'relative', // For absolute positioning of logo
            overflow: 'visible', // Important for hanging logo
          }}>
            {/* Header title text - left aligned in the 55px content area */}
            <View style={{
              height: 55, // Explicit height for the title's content area
              justifyContent: 'center', // Vertically centers text in this View
              paddingLeft: 16, // Added padding for left alignment
              // alignItems: 'center', // Removed to allow text to default to start (left)
            }}>
              <Text style={{
                fontSize: 17,
                fontWeight: 'bold',
                color: theme.text,
                zIndex: 1, // Ensure title is above the logo
              }}>
                {options.title || route.name}
              </Text>
            </View>

            {/* Centered Logo - Overlapping and hanging, behind title */}
            <View style={{
              position: 'absolute',
              // Position the top of the logo to align with the approximate top of the title text.
              // Title text top is approx: paddingTop (25) + (titleAreaHeight (55) / 2) - (fontSize (17) / 2) = 44px from screen top.
              // Logo container's top style = 44 (desired logo top) - 25 (paddingTop) = 19.
              // Adjusted to move it up slightly
              top: -77,
              left: 0,
              right: 0,
              alignItems: 'center', // Horizontally centers the Image within this View
              zIndex: 0, // Behind title text
            }}>
              <Image
                source={require('../assets/images/bf-logo-trans.png')} 
                style={{
                  width: 250, // Increased size
                  height: 250, // Increased size
                }}
                resizeMode="contain"
              />
            </View>
          </View>
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          // Remove the custom headerTitle for Home screen if the main header now handles the logo
          // headerTitle: () => (
          //   <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          //     <Image
          //       source={require('../assets/images/tree-3.png')}
          //       style={{
          //         position: 'absolute',
          //         right: -0, 
          //         top: -25, 
          //         width: 80,
          //         height: 60,
          //         opacity: 0.3, 
          //         zIndex: 0,
          //       }}
          //       resizeMode="cover"
          //     />
          //     <Text style={{
          //       fontSize: 17,
          //       fontWeight: 'bold',
          //       color: theme.text,
          //       zIndex: 1,
          //       position: 'relative',
          //     }}>
          //       Home
          //     </Text>
          //   </View>
          // ),
        }}
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
