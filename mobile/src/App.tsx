import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
// import * as SecureStore from 'expo-secure-store';
import { 
  requestNotificationPermission, 
  getPushToken,
  setupNotificationListeners 
} from '../src/services/firebaseMessaging';
// Removed firebase messaging imports

import Navigation from './navigation';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DebugProvider } from './contexts/DebugContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import useCachedResources from './hooks/useCachedResources';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Keep the splash screen visible until the app is ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const isLoadingComplete = useCachedResources();
  useEffect(() => {
    async function setupNotifications() {
      // Request notification permissions for both Expo notifications and Firebase
      const expoPermissionGranted = await requestNotificationPermission();
        // Firebase messaging removed
      
      if (expoPermissionGranted) {
        // Get the Expo push token
        await getPushToken();
        
        // Setup Expo notification listeners
        const cleanupExpo = setupNotificationListeners();

        // Setup Firebase messaging if permission granted
          
          

          // Firebase messaging removed

        // Return Expo cleanup only
        return () => {
          cleanupExpo();
        };
      }
    }
    setupNotifications();
  }, []);

  useEffect(() => {
    // Hide splash screen once resources are loaded
    async function hideSplash() {
      if (isLoadingComplete) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [isLoadingComplete]);

  if (!isLoadingComplete) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: 'transparent' }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppSettingsProvider>
              <DebugProvider>
                <NavigationContainer>
                  <Navigation />
                  <StatusBar style="auto" />
                </NavigationContainer>
              </DebugProvider>
            </AppSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
