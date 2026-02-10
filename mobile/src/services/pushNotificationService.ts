import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdToken } from './firebaseAuthService';
import { api } from './api';

/**
 * Registers the device's push token with the backend server.
 * This should be called when the user logs in or when the app starts.
 * 
 * @returns The Expo push token or null if registration failed
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Push notifications are not available on simulator/emulator');
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