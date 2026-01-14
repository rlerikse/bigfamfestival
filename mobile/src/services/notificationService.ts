// /src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduleEvent } from '../types/event';
import { getUserSchedule } from './scheduleService';

const NOTIFICATION_LEAD_TIME_MINUTES = 15;

/**
 * Schedules a local notification for a specific event.
 * The notification will be triggered 15 minutes before the event's start time.
 *
 * @param event The schedule event to schedule a notification for.
 */
export const scheduleEventNotification = async (event: ScheduleEvent): Promise<void> => {
  try {
    // Parse the event date and time
    // Event date is in YYYY-MM-DD format and time is in HH:MM format
    const eventDateTime = new Date(`${event.date}T${event.startTime}`);
    const currentDate = new Date();
    
    // Calculate when notification should be sent (15 mins before event)
    const notificationTime = new Date(eventDateTime);
    notificationTime.setMinutes(notificationTime.getMinutes() - NOTIFICATION_LEAD_TIME_MINUTES);
    
    // Don't schedule notifications for events that have already passed
    if (notificationTime < currentDate) {
      console.warn(`Skipping notification for past event: ${event.name}`);
      return;
    }

    // Request permissions if not already granted
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return;
    }
    
    // Set up notification with proper trigger format for Expo notifications
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${event.name} is starting soon!`,
        body: `Head over to ${event.stage} in ${NOTIFICATION_LEAD_TIME_MINUTES} minutes.`,
        data: { eventId: event.id, category: 'my_schedule' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationTime
      },
      identifier: event.id, // Use event ID as identifier to prevent duplicates
    });
  } catch (error) {
    console.error(`Error scheduling notification for event ${event.id}:`, error);
  }
};

/**
 * Cancels a scheduled notification for a specific event.
 *
 * @param eventId The ID of the event for which to cancel the notification.
 */
export const cancelEventNotification = async (eventId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(eventId);
  } catch (error) {
    console.error(`Error canceling notification for event ${eventId}:`, error);
  }
};

/**
 * Schedules notifications for all events in the user's schedule.
 * This should be called when the user logs in or when the schedule is updated.
 * This will check if notifications are enabled for the user before scheduling.
 *
 * @param userId The ID of the user.
 */
export const scheduleAllUserEventsNotifications = async (userId: string): Promise<void> => {
  try {
    // Check if notifications are enabled for this user
    const notificationsEnabled = await AsyncStorage.getItem(`schedule_notifications_enabled_${userId}`);
    // If explicitly disabled, don't schedule notifications
    if (notificationsEnabled === 'false') {
      // User has disabled schedule notifications
      return;
    }

    const schedule = await getUserSchedule(userId);
    for (const event of schedule) {
      await scheduleEventNotification(event);
    }
  } catch (error) {
    console.error('Error scheduling all user event notifications:', error);
  }
};

/**
 * Cancels all scheduled notifications.
 * This should be called when the user logs out.
 */
export const cancelAllUserEventsNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all scheduled notifications:', error);
  }
};
