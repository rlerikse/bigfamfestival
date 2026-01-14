import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { festivalConfig } from '../config/festival.config';

/**
 * Gets the appropriate API URL for the current environment
 * Handles:
 * - Development mode: localhost (with Android emulator support)
 * - Production mode: configured production URL
 * - Environment variable override
 */
export const getApiUrl = (): string => {
  const isDev = __DEV__;
  
  // Check for environment variable override first
  const envUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
  if (envUrl) {
    if (__DEV__) {
      console.log('[API] Using environment variable API URL:', envUrl);
    }
    return envUrl;
  }
  
  // In development, use localhost
  if (isDev) {
    // For Android emulator, use 10.0.2.2 instead of localhost
    if (Platform.OS === 'android') {
      const url = 'http://10.0.2.2:8080/api/v1';
      console.log('[API] Development mode - Android emulator, using:', url);
      return url;
    }
    // For iOS simulator, use localhost
    // For physical devices, you'll need to use your computer's IP address
    // You can get it from: ipconfig (Windows) or ifconfig (Mac/Linux)
    // Example: http://192.168.1.100:8080/api/v1
    const url = 'http://localhost:8080/api/v1';
    console.log('[API] Development mode - iOS simulator, using:', url);
    console.log('[API] For physical device, update EXPO_PUBLIC_API_URL to your computer IP');
    return url;
  }
  
  // In production, use the configured URL
  const url = festivalConfig.apiUrl;
  if (__DEV__) {
    console.log('[API] Production mode, using:', url);
  }
  return url;
};

