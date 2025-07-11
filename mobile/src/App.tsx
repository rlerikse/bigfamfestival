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

import Navigation from './navigation';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DebugProvider } from './contexts/DebugContext';
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
      // Request notification permissions
      const permissionGranted = await requestNotificationPermission();
      
      if (permissionGranted) {
        // Get the push token
        await getPushToken();
        
        // Setup notification listeners
        const cleanup = setupNotificationListeners();

        // Return cleanup function
        return () => {
          cleanup();
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
            <DebugProvider>
              <NavigationContainer>
                <Navigation />
                <StatusBar style="auto" />
              </NavigationContainer>
            </DebugProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
