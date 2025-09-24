/**
 * Application-wide constants
 */

// API configuration
// For development, use localhost (when in emulator) or local IP (when on physical device)
// For production, use the deployed API URL
export const API_URL = __DEV__ 
  ? process.env.EXPO_PUBLIC_API_URL || 'http://192.168.50.244:8080/api/v1' // Your actual local IP address and correct port
  : process.env.EXPO_PUBLIC_API_URL || 'https://api.bigfamfestival.com';

// Android emulator can use 10.0.2.2 instead of localhost to access the host machine
// iOS simulator can use localhost as usual

// App configuration
export const APP_NAME = 'BigFam Festival';

// Notification channels
export const NOTIFICATION_CHANNEL_ID = 'default';
export const NOTIFICATION_CHANNEL_NAME = 'Default Channel';

// Other constants