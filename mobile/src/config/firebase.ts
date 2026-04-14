// Commit: Environment-aware Firebase config — reads from app.config.js extra
// Supports APP_ENV=development (dev project) vs APP_ENV=production (prod project)

/**
 * Firebase configuration and initialization for Expo React Native app.
 * 
 * Config is loaded from Expo Constants (set by app.config.js at build time).
 * No hardcoded production values — environment determines the project.
 * 
 * See: ../../app.config.js for environment routing logic.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};
const appEnv = extra.appEnv || process.env.APP_ENV || 'production';

if (__DEV__) {
  console.log(`[Firebase] Initializing for environment: ${appEnv}`);
  console.log(`[Firebase] Project ID: ${extra.firebaseProjectId || '(missing)'}`);
}

/**
 * Builds Firebase config from Expo Constants.
 * Falls back to env vars for cases where Constants aren't populated (bare workflow).
 */
const getFirebaseConfig = () => {
  const config = {
    apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            || extra.firebaseApiKey,
    authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        || extra.firebaseAuthDomain,
    databaseURL:       process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL       || extra.firebaseDatabaseUrl,
    projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         || extra.firebaseProjectId,
    storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     || extra.firebaseStorageBucket,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || extra.firebaseMessagingSenderId,
    appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             || extra.firebaseAppId,
    measurementId:     process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID     || extra.firebaseMeasurementId,
  };

  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    const envHint = appEnv === 'development'
      ? 'Set EXPO_PUBLIC_FIREBASE_* vars or populate GoogleService-Info.dev.plist / google-services-dev.json. See docs/env-setup.md.'
      : 'Production Firebase config is missing. Check app.config.js and EAS secrets.';
    throw new Error(
      `[Firebase] Missing required config fields: ${missingFields.join(', ')}.\n${envHint}`
    );
  }

  return config;
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase (guard against double-init in dev fast-refresh)
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Also initialize the compat version (needed for AsyncStorage persistence)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

const auth = getAuth(app);

export { firestore, auth, app };
