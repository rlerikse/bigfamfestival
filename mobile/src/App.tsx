import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigation/navigationRef';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
// import * as SecureStore from 'expo-secure-store';
// Import our new notification listener component
import NotificationListener from './components/NotificationListener';

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
  // Removed old notification setup code

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
