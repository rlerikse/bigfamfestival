/**
 * Application-wide constants
 * 
 * Note: Most configuration is now in festival.config.ts
 * This file maintains backward compatibility and API-specific constants
 */

import { getApiUrl } from '../utils/getApiUrl';
import { festivalConfig } from './festival.config';

// API configuration - uses smart URL detection for development
export const API_URL = getApiUrl();

// Log immediately when module loads (helps debug)
if (__DEV__) {
  console.log('═══════════════════════════════════════');
  console.log('[CONFIG] API URL:', API_URL);
  console.log('[CONFIG] Festival:', festivalConfig.name);
  console.log('═══════════════════════════════════════');
}

// Android emulator can use 10.0.2.2 instead of localhost to access the host machine
// iOS simulator can use localhost as usual

// App configuration - loaded from festival config
export const APP_NAME = festivalConfig.name;

// Notification channels
export const NOTIFICATION_CHANNEL_ID = 'default';
export const NOTIFICATION_CHANNEL_NAME = 'Default Channel';

// Other constants