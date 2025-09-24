/**
 * Application-wide constants
 */

// API configuration
// Default to the production API. You can override with EXPO_PUBLIC_API_URL when needed.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://bigfam-api-production-292369452544.us-central1.run.app/api/v1';

// Android emulator can use 10.0.2.2 instead of localhost to access the host machine
// iOS simulator can use localhost as usual

// App configuration
export const APP_NAME = 'BigFam Festival';

// Notification channels
export const NOTIFICATION_CHANNEL_ID = 'default';
export const NOTIFICATION_CHANNEL_NAME = 'Default Channel';

// Other constants