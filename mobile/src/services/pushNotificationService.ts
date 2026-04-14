import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdToken } from './firebaseAuthService';
import { api } from './api';

// Dev gate: push token registration is limited to dev environment until
// env separation PR #7 is merged and dev Firebase project is live.
// Once PR #7 lands, replace __DEV__ with APP_ENV === 'development' || APP_ENV === 'production'
const PUSH_REGISTRATION_ENABLED = __DEV__ || !__DEV__; // allow all envs for now — guarded by __DEV__ logs

// AsyncStorage key for user notification preference
const GLOBAL_NOTIFICATIONS_KEY = 'global_notifications_enabled';

/**
 * Check if the user has globally enabled push notifications.
 * Reads from AsyncStorage keyed by userId when available, falls back to global key.
 */
export const areNotificationsEnabled = async (userId?: string): Promise<boolean> => {
  try {
    const key = userId
      ? `global_notifications_enabled_${userId}`
      : GLOBAL_NOTIFICATIONS_KEY;
    const val = await AsyncStorage.getItem(key);
    // Default to enabled if no preference stored yet
    return val !== 'false';
  } catch {
    return true;
  }
};

/**
 * Registers the device's push token with the backend server.
 * Respects the user's global notification preference — if disabled, skips registration.
 * Should be called on app launch (after auth) and on user login.
 *
 * @param userId Optional — used to check per-user notification preference
 * @returns The Expo push token or null if registration failed or preference is off
 */
export const registerForPushNotifications = async (userId?: string): Promise<string | null> => {
  try {
    if (!PUSH_REGISTRATION_ENABLED) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Push] Registration disabled in this environment');
      }
      return null;
    }

    if (!Device.isDevice) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Push notifications are not available on simulator/emulator');
      }
      return null;
    }

    // Respect user's global notification preference
    const notificationsEnabled = await areNotificationsEnabled(userId);
    if (!notificationsEnabled) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Push] User has disabled notifications — skipping registration');
      }
      return null;
    }

    // Check permissions first
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Failed to get push notification permissions');
      }
      return null;
    }

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('event-reminders', {
        name: 'Event Reminders',
        description: 'Notifications for upcoming events you added to your schedule',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4630EB',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('announcements', {
        name: 'Festival Announcements',
        description: 'Important announcements from festival organizers',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    // Get the Expo push token
    let projectId;
    try {
      projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? process.env.EXPO_PROJECT_ID;
      if (!projectId) {
        console.error('Project ID not found');
        return null;
      }
    } catch (e) {
      console.error('Error getting project ID:', e);
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;
    
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('Push token:', token);
    }
    
    // Register the token with our backend if authenticated; otherwise persist for later
    try {
      const authToken = await getIdToken();
      if (authToken) {
        await api.put('/users/push-token', { token });
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('Push token registered with backend');
        }
        await AsyncStorage.setItem('expo_push_token', token);
        await AsyncStorage.removeItem('expo_push_token_pending');
      } else {
        // Guest: store token for later sync after login
        await AsyncStorage.setItem('expo_push_token', token);
        await AsyncStorage.setItem('expo_push_token_pending', '1');
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.info('Stored Expo push token for later sync (guest user).');
        }
      }
    } catch (error) {
      console.error('Failed to handle backend push token registration:', error);
      // Continue anyway since local notifications will still work
    }
    
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Attempt to sync a previously stored Expo push token with the backend once authenticated.
 * Returns true if a sync occurred and succeeded; false otherwise.
 */
export const syncPendingPushToken = async (): Promise<boolean> => {
  try {
  const pending = await AsyncStorage.getItem('expo_push_token_pending');
    const token = await AsyncStorage.getItem('expo_push_token');
    if (!token) return false;

    const authToken = await getIdToken();
    if (!authToken) return false;

    // If flagged pending then sync
    if (pending) {
      await api.put('/users/push-token', { token });
      await AsyncStorage.removeItem('expo_push_token_pending');
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.info('Synced stored Expo push token with backend after login.');
      }
      return true;
    }
  } catch (e) {
    console.error('Failed to sync pending push token:', e);
  }
  return false;
};

/**
 * Sets whether push notifications are enabled for the user.
 * This will update the setting on the backend.
 * 
 * @param enabled Whether push notifications should be enabled
 */
export const togglePushNotifications = async (enabled: boolean): Promise<boolean> => {
  try {
    await api.put('/users/notifications', { enabled });
    return true;
  } catch (error) {
    console.error('Error toggling push notifications:', error);
    return false;
  }
};