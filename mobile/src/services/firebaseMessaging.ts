import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configure how notifications are handled
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions
export async function requestNotificationPermission() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
        // eslint-disable-next-line no-console
      console.log('Permission not granted');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Get the push token for the device
export async function getPushToken() {
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId; // Fetch projectId dynamically
    if (!projectId) {
      throw new Error('Expo projectId is missing. Please check your app configuration.');
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    // eslint-disable-next-line no-console
    console.log('Expo Push Token:', token.data);
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

// Setup notification listeners
export function setupNotificationListeners() {
  // Listener when a notification is received while the app is foregrounded
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    // eslint-disable-next-line no-console
    console.log('Notification received in foreground:', notification);
  });

  // Listener when a notification is tapped
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    // eslint-disable-next-line no-console
    console.log('Notification tapped:', response);
  });

  // Return a cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

// Send a local notification (example)
interface LocalNotificationContent {
    title: string;
    body: string;
    data: { data: string };
}

interface LocalNotificationScheduleOptions {
    content: LocalNotificationContent;
    trigger: null;
}

export async function sendLocalNotification(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: { data: 'goes here' },
        },
        trigger: null, // Send immediately
    } as LocalNotificationScheduleOptions);
}