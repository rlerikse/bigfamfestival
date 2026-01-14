/**
 * React Native Firebase initialization
 * 
 * This file initializes the React Native Firebase SDK separately from the web SDK.
 * We'll use this for native-specific features like push notifications, analytics, etc.
 */

import { Platform } from 'react-native';
import firebase from 'firebase/app';

// Initialize React Native Firebase only on actual devices, not in the web simulator
const initializeNativeFirebase = () => {
  // React Native Firebase is already initialized via the google-services.json and GoogleService-Info.plist files
  // This function exists in case we need to add additional setup steps in the future
  
  if (Platform.OS === 'web') {
    // Not available on web
    return null;
  }
  
  try {
    // React Native Firebase automatically initializes from native configuration files
    // We just return the existing app instance
    const app = firebase.initializeApp({
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    });
    return app;
  } catch (error) {
    // Handle initialization errors silently in production
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error initializing React Native Firebase:', error);
    }
    return null;
  }
};

export default initializeNativeFirebase;