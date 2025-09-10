import messaging from '@react-native-firebase/messaging';

// Request permission for push notifications
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      // eslint-disable-next-line no-console
      console.log('Authorization status:', authStatus);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Get FCM token
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    // eslint-disable-next-line no-console
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Setup Firebase messaging listeners
export function setupFirebaseMessagingListeners() {
  // Background message handler
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    // eslint-disable-next-line no-console
    console.log('Message handled in the background!', remoteMessage);
  });

  // Foreground message handler
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    // eslint-disable-next-line no-console
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
  });

  // Token refresh listener
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
    // eslint-disable-next-line no-console
    console.log('FCM token refreshed:', token);
  });

  // Return cleanup function
  return () => {
    unsubscribe();
    unsubscribeTokenRefresh();
  };
}

// Handle notification opened app (when app is in background/quit)
export function setupNotificationOpenedApp() {
  // Check whether an initial notification is available
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        // eslint-disable-next-line no-console
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
      }
    });

  // Handle notification opened app (when app is in background)
  messaging().onNotificationOpenedApp(remoteMessage => {
    // eslint-disable-next-line no-console
    console.log(
      'Notification caused app to open from background state:',
      remoteMessage.notification,
    );
  });
}