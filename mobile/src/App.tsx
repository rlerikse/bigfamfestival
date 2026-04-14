import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigation/navigationRef';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
// Import our new notification listener component
import NotificationListener from './components/NotificationListener';
import { processScheduleOfflineQueue } from './services/scheduleService';

// Firebase initialization
// import initializeNativeFirebase from './config/nativeFirebase';

import Navigation from './navigation';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DebugProvider } from './contexts/DebugContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
import { initSentry } from './config/sentry';
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
  const wasOfflineRef = useRef(false);

  // Reconnect listener: process queued offline schedule changes when connectivity is restored
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && wasOfflineRef.current) {
        if (__DEV__) console.log('[App] Reconnected — processing offline schedule queue');
        processScheduleOfflineQueue().catch(err =>
          console.warn('[App] Failed to process offline queue:', err)
        );
      }
      wasOfflineRef.current = !state.isConnected;
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Initialize services and hide splash screen once resources are loaded
    async function initializeAndHideSplash() {
      if (isLoadingComplete) {
        // Initialize Sentry for error tracking (production only)
        await initSentry();
        
        // Hide splash screen
        await SplashScreen.hideAsync();
      }
    }
    initializeAndHideSplash();
  }, [isLoadingComplete]);

  if (!isLoadingComplete) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider style={{ backgroundColor: 'transparent' }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <AppSettingsProvider>
                <DebugProvider>
                  <NavigationContainer ref={navigationRef}>
                    <Navigation />
                    <NotificationListener />
                    <StatusBar style="auto" />
                  </NavigationContainer>
                </DebugProvider>
              </AppSettingsProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
