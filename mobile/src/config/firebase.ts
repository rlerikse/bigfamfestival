// Commit: Replace react-native-firebase with Firebase JS SDK for Expo compatibility
// Author: GitHub Copilot, 2024-06-10

/**
 * Firebase configuration and initialization for Expo React Native app.
 * Exports initialized firestore and auth instances.
 * 
 * Configuration is loaded from environment variables for security.
 * Falls back to hardcoded values only in development mode.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Load Firebase config from environment variables
// In Expo, environment variables are accessed via Constants.expoConfig.extra
const getFirebaseConfig = () => {
  const isDev = __DEV__;
  const extra = Constants.expoConfig?.extra || {};
  
  // Try to get from environment variables first
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 
            extra.firebaseApiKey ||
            (isDev ? "AIzaSyDxZIs1oOTEtHu0SsuV30Of84RTCDkmg0s" : undefined),
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 
                extra.firebaseAuthDomain ||
                (isDev ? "bigfamfestival.firebaseapp.com" : undefined),
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 
                 extra.firebaseDatabaseUrl ||
                 (isDev ? "https://bigfamfestival-default-rtdb.firebaseio.com" : undefined),
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 
               extra.firebaseProjectId ||
               (isDev ? "bigfamfestival" : undefined),
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                   extra.firebaseStorageBucket ||
                   (isDev ? "bigfamfestival.firebasestorage.app" : undefined),
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 
                      extra.firebaseMessagingSenderId ||
                      (isDev ? "292369452544" : undefined),
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 
           extra.firebaseAppId ||
           (isDev ? "1:292369452544:web:b3508390b4600be71c12e5" : undefined),
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 
                   extra.firebaseMeasurementId ||
                   (isDev ? "G-VZ06GV8DGT" : undefined),
  };

  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required Firebase configuration: ${missingFields.join(', ')}. ` +
      `Please set EXPO_PUBLIC_FIREBASE_* environment variables or configure in app.json extra section.`
    );
  }

  return config;
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase with v9 API
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Also initialize the compat version for AsyncStorage persistence
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Set AsyncStorage persistence for authentication
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Use the v9 API auth for compatibility with existing code
const auth = getAuth(app);

export { firestore, auth, app };
