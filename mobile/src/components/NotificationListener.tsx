import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { registerForPushNotifications, syncPendingPushToken } from '../services/pushNotificationService';
import { goToNotificationsSafe } from '../navigation/navigationRef';
import { useAuth } from '../contexts/AuthContext';

// Set up notification handler for when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * NotificationListener component that handles push notification setup and responses
 * This is a "wrapper" component that doesn't render anything but sets up notification listeners
 */
const NotificationListener: React.FC = () => {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Always register for push notifications, even for guests
    registerForPushNotifications().catch(error => {
      console.error('Failed to register for push notifications:', error);
    });

    // Set up notification received listener
    notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Notification received:', notification);
      }
      try {
        const content = notification.request?.content;
        const identifier = notification.request?.identifier || `${Date.now()}`;
        const title = content?.title || 'Notification';
        const body = content?.body || '';
        const data = content?.data as Record<string, unknown> | undefined;
        // Heuristic: mark as my_schedule if eventId present or channel is event-reminders
        const android = notification.request?.trigger as { channelId?: string } | undefined;
        const category = (data?.category as string) || (android?.channelId === 'event-reminders' || data?.eventId ? 'my_schedule' : undefined);

        const entry = {
          id: `local-${identifier}`,
          title,
          body,
          sentAt: new Date().toISOString(),
          category,
          priority: 'high',
        };
        const key = 'local_notifications_log';
        const existing = await AsyncStorage.getItem(key);
        const arr = existing ? (JSON.parse(existing) as typeof entry[]) : [];
        // de-dupe by id
        const next = [entry, ...arr.filter((e) => e.id !== entry.id)].slice(0, 30);
        await AsyncStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to persist local notification:', e);
      }
    });

  // Set up notification response listener (when user taps the notification)
  responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Notification response received:', response);
      }
      try {
        const { notification } = response;
        const content = notification.request?.content;
        const identifier = notification.request?.identifier || `${Date.now()}`;
        const title = content?.title || 'Notification';
        const body = content?.body || '';
        const data = content?.data as Record<string, unknown> | undefined;
        const android = notification.request?.trigger as { channelId?: string } | undefined;
        const category = (data?.category as string) || (android?.channelId === 'event-reminders' || data?.eventId ? 'my_schedule' : undefined);

        const entry = {
          id: `local-${identifier}`,
          title,
          body,
          sentAt: new Date().toISOString(),
          category,
          priority: 'high',
        };
        const key = 'local_notifications_log';
        const existing = await AsyncStorage.getItem(key);
        const arr = existing ? (JSON.parse(existing) as typeof entry[]) : [];
        const next = [entry, ...arr.filter((e) => e.id !== entry.id)].slice(0, 30);
        await AsyncStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to persist local notification from response:', e);
      }

      // For now, regardless of type, open Notifications screen
      // Future: branch by data?.type to deep link to specific content
      await goToNotificationsSafe();
    });

    // Set up foreground notification handler for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Clean up the listeners when the component unmounts
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
    // Handle cold start: if the app was opened by tapping a notification, handle it here
    (async () => {
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          // Navigate to Notifications on cold start from a notification tap
          await goToNotificationsSafe();
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to handle cold-start notification response:', e);
      }
    })();

  }, []);

  // When a user logs in later, re-register to sync the token with backend
  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const synced = await syncPendingPushToken();
          if (!synced) {
            await registerForPushNotifications();
          }
        } catch (error) {
          console.error('Failed to sync/register push notifications after login:', error);
        }
      })();
    }
  }, [user]);

  // This component doesn't render anything
  return null;
};

export default NotificationListener;