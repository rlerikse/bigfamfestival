/**
 * Festival Configuration System
 * 
 * This module provides a centralized configuration system for festival-specific values.
 * Configuration can be loaded from:
 * 1. Environment variables (highest priority)
 * 2. app.json extra section
 * 3. Default values (lowest priority)
 * 
 * This enables white-labeling the app for different festivals.
 */

import Constants from 'expo-constants';

export interface FestivalConfig {
  // Basic festival information
  name: string;
  slug: string;
  
  // Festival dates
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dates: Array<{
    id: string;
    date: string;
    dayLabel: string;
    dayAbbrev: string;
    staffOnly: boolean;
  }>;
  
  // Location
  location: {
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  
  // API configuration
  apiUrl: string;
  
  // Firebase configuration (loaded from environment)
  firebase: {
    apiKey?: string;
    authDomain?: string;
    databaseURL?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
  };
  
  // Theme colors
  theme: {
    light: {
      primary: string;
      secondary: string;
      background: string;
      card: string;
      text: string;
      border: string;
      notification: string;
      success: string;
      warning: string;
      error: string;
      muted: string;
    };
    dark: {
      primary: string;
      secondary: string;
      background: string;
      card: string;
      text: string;
      border: string;
      notification: string;
      success: string;
      warning: string;
      error: string;
      muted: string;
    };
  };
  
  // Bundle identifiers
  bundleIds: {
    ios: string;
    android: string;
  };
  
  // Feature flags
  features: {
    enableMap: boolean;
    enableNotifications: boolean;
    enableSchedule: boolean;
    enableCampsites: boolean;
  };
}

// Default configuration (Big Fam Festival)
const defaultConfig: FestivalConfig = {
  name: 'Big Fam Festival',
  slug: 'bigfam-festival',
  startDate: '2025-09-26',
  endDate: '2025-09-28',
  dates: [
    { id: '2025-09-26', date: '2025-09-26', dayLabel: 'Sep 26', dayAbbrev: 'FRI', staffOnly: false },
    { id: '2025-09-27', date: '2025-09-27', dayLabel: 'Sep 27', dayAbbrev: 'SAT', staffOnly: false },
    { id: '2025-09-28', date: '2025-09-28', dayLabel: 'Sep 28', dayAbbrev: 'SUN', staffOnly: false },
  ],
  location: {
    name: 'Brooklyn, MI',
    latitude: 42.1059,
    longitude: -84.2486,
    timezone: 'America/Detroit',
  },
  apiUrl: 'https://bigfam-api-production-292369452544.us-central1.run.app/api/v1',
  firebase: {},
  theme: {
    light: {
      primary: '#2E4031',
      secondary: '#6BBF59',
      background: '#F5F5DC',
      card: '#FFFFFF',
      text: '#4A3B31',
      border: '#D2B48C',
      notification: '#6BBF59',
      success: '#6BBF59',
      warning: '#FFA500',
      error: '#D22B2B',
      muted: '#8A7967',
    },
    dark: {
      primary: '#6BBF59',
      secondary: '#2E4031',
      background: '#1C2B20',
      card: '#2E4031',
      text: '#F5F5DC',
      border: '#4A3B31',
      notification: '#6BBF59',
      success: '#6BBF59',
      warning: '#FFA500',
      error: '#FF6B6B',
      muted: '#A89C8C',
    },
  },
  bundleIds: {
    ios: 'com.eriksensolutions.bigfam',
    android: 'com.eriksensolutions.bigfam',
  },
  features: {
    enableMap: true,
    enableNotifications: true,
    enableSchedule: true,
    enableCampsites: true,
  },
};

/**
 * Loads festival configuration from environment variables and app.json
 */
export const loadFestivalConfig = (): FestivalConfig => {
  const extra = Constants.expoConfig?.extra || {};
  const env = process.env;
  
  // Helper to get value from env, extra, or default
  const getValue = <T>(key: string, envKey?: string, defaultValue: T): T => {
    if (envKey && env[envKey]) {
      return env[envKey] as T;
    }
    if (extra[key]) {
      return extra[key] as T;
    }
    return defaultValue;
  };
  
  // Parse dates from string if provided
  const parseDates = (datesStr?: string): FestivalConfig['dates'] => {
    if (datesStr) {
      try {
        return JSON.parse(datesStr);
      } catch {
        // Fall back to default
      }
    }
    return defaultConfig.dates;
  };
  
  // Parse theme from string if provided
  const parseTheme = (themeStr?: string): FestivalConfig['theme'] => {
    if (themeStr) {
      try {
        return JSON.parse(themeStr);
      } catch {
        // Fall back to default
      }
    }
    return defaultConfig.theme;
  };
  
  const config: FestivalConfig = {
    name: getValue('festivalName', 'EXPO_PUBLIC_FESTIVAL_NAME', defaultConfig.name),
    slug: getValue('festivalSlug', 'EXPO_PUBLIC_FESTIVAL_SLUG', defaultConfig.slug),
    startDate: getValue('festivalStartDate', 'EXPO_PUBLIC_FESTIVAL_START_DATE', defaultConfig.startDate),
    endDate: getValue('festivalEndDate', 'EXPO_PUBLIC_FESTIVAL_END_DATE', defaultConfig.endDate),
    dates: parseDates(getValue('festivalDates', 'EXPO_PUBLIC_FESTIVAL_DATES', undefined)),
    location: {
      name: getValue('festivalLocationName', 'EXPO_PUBLIC_FESTIVAL_LOCATION_NAME', defaultConfig.location.name),
      latitude: parseFloat(getValue('festivalLatitude', 'EXPO_PUBLIC_FESTIVAL_LATITUDE', String(defaultConfig.location.latitude))),
      longitude: parseFloat(getValue('festivalLongitude', 'EXPO_PUBLIC_FESTIVAL_LONGITUDE', String(defaultConfig.location.longitude))),
      timezone: getValue('festivalTimezone', 'EXPO_PUBLIC_FESTIVAL_TIMEZONE', defaultConfig.location.timezone),
    },
    apiUrl: getValue('apiUrl', 'EXPO_PUBLIC_API_URL', defaultConfig.apiUrl),
    firebase: {
      apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || extra.firebaseApiKey,
      authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || extra.firebaseAuthDomain,
      databaseURL: env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || extra.firebaseDatabaseUrl,
      projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extra.firebaseProjectId,
      storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || extra.firebaseStorageBucket,
      messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || extra.firebaseMessagingSenderId,
      appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || extra.firebaseAppId,
      measurementId: env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || extra.firebaseMeasurementId,
    },
    theme: parseTheme(getValue('festivalTheme', 'EXPO_PUBLIC_FESTIVAL_THEME', undefined)),
    bundleIds: {
      ios: getValue('iosBundleId', 'EXPO_PUBLIC_IOS_BUNDLE_ID', defaultConfig.bundleIds.ios),
      android: getValue('androidBundleId', 'EXPO_PUBLIC_ANDROID_BUNDLE_ID', defaultConfig.bundleIds.android),
    },
    features: {
      enableMap: getValue('enableMap', 'EXPO_PUBLIC_ENABLE_MAP', defaultConfig.features.enableMap),
      enableNotifications: getValue('enableNotifications', 'EXPO_PUBLIC_ENABLE_NOTIFICATIONS', defaultConfig.features.enableNotifications),
      enableSchedule: getValue('enableSchedule', 'EXPO_PUBLIC_ENABLE_SCHEDULE', defaultConfig.features.enableSchedule),
      enableCampsites: getValue('enableCampsites', 'EXPO_PUBLIC_ENABLE_CAMPSITES', defaultConfig.features.enableCampsites),
    },
  };
  
  return config;
};

// Export the loaded configuration
export const festivalConfig = loadFestivalConfig();

