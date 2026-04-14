/**
 * app.config.js — Dynamic Expo configuration
 *
 * Replaces the static app.json extra block so we can switch between
 * dev and prod Firebase projects + API URLs at build time via APP_ENV.
 *
 * Usage:
 *   APP_ENV=development  → dev Firebase project, local/dev API
 *   APP_ENV=production   → prod Firebase project, prod API  (default)
 *
 * EAS Build: set APP_ENV in eas.json env block per profile.
 * Local dev:  APP_ENV=development npx expo start
 */

const IS_DEV = process.env.APP_ENV === 'development';
const IS_PREVIEW = process.env.APP_ENV === 'preview';

// ── API URLs ────────────────────────────────────────────────────────────────
const API_URL = process.env.EXPO_PUBLIC_API_URL || (
  IS_DEV
    ? 'http://localhost:8080/api/v1'       // override with your local IP if testing on device
    : 'https://bigfam-api-production-292369452544.us-central1.run.app/api/v1'
);

// ── Firebase configs ────────────────────────────────────────────────────────
// Production Firebase (bigfamfestival)
const PROD_FIREBASE = {
  apiKey:            'AIzaSyDxZIs1oOTEtHu0SsuV30Of84RTCDkmg0s',
  authDomain:        'bigfamfestival.firebaseapp.com',
  databaseURL:       'https://bigfamfestival-default-rtdb.firebaseio.com',
  projectId:         'bigfamfestival',
  storageBucket:     'bigfamfestival.firebasestorage.app',
  messagingSenderId: '292369452544',
  appId:             '1:292369452544:web:b3508390b4600be71c12e5',
  measurementId:     'G-VZ06GV8DGT',
};

// Dev Firebase — replace with actual dev project values once created
// See: docs/env-setup.md for instructions on creating the dev project
const DEV_FIREBASE = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            || 'REPLACE_WITH_DEV_API_KEY',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        || 'REPLACE_WITH_DEV_AUTH_DOMAIN',
  databaseURL:       process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL       || '',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         || 'REPLACE_WITH_DEV_PROJECT_ID',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     || 'REPLACE_WITH_DEV_STORAGE_BUCKET',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'REPLACE_WITH_DEV_SENDER_ID',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             || 'REPLACE_WITH_DEV_APP_ID',
  measurementId:     process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID     || '',
};

const FIREBASE_CONFIG = IS_DEV ? DEV_FIREBASE : PROD_FIREBASE;

// ── App identifier ──────────────────────────────────────────────────────────
// Dev builds use a different bundle ID so they can coexist on the same device
const IOS_BUNDLE_ID = IS_DEV
  ? 'com.eriksensolutions.bigfam.dev'
  : 'com.eriksensolutions.bigfam';

const ANDROID_PACKAGE = IS_DEV
  ? 'com.eriksensolutions.bigfam.dev'
  : 'com.eriksensolutions.bigfam';

const APP_NAME = IS_DEV ? 'Big Fam (Dev)' : 'Big Fam Festival';

// ── Export ──────────────────────────────────────────────────────────────────
module.exports = ({ config }) => ({
  ...config,
  name: APP_NAME,
  ios: {
    ...config.ios,
    bundleIdentifier: IOS_BUNDLE_ID,
    // Dev builds use google-services-dev files; prod uses the committed ones
    googleServicesFile: IS_DEV
      ? './GoogleService-Info.dev.plist'   // created after dev Firebase project is set up
      : './GoogleService-Info.plist',
  },
  android: {
    ...config.android,
    package: ANDROID_PACKAGE,
    googleServicesFile: IS_DEV
      ? './google-services-dev.json'       // created after dev Firebase project is set up
      : './google-services.json',
  },
  extra: {
    ...config.extra,
    appEnv: process.env.APP_ENV || 'production',
    apiUrl: API_URL,
    firebase: FIREBASE_CONFIG,
    // Legacy flat keys kept for backward-compat with existing code
    firebaseApiKey:            FIREBASE_CONFIG.apiKey,
    firebaseAuthDomain:        FIREBASE_CONFIG.authDomain,
    firebaseDatabaseUrl:       FIREBASE_CONFIG.databaseURL,
    firebaseProjectId:         FIREBASE_CONFIG.projectId,
    firebaseStorageBucket:     FIREBASE_CONFIG.storageBucket,
    firebaseMessagingSenderId: FIREBASE_CONFIG.messagingSenderId,
    firebaseAppId:             FIREBASE_CONFIG.appId,
    firebaseMeasurementId:     FIREBASE_CONFIG.measurementId,
    eas: {
      projectId: '0c013fd4-da29-4e1c-9c8d-b69783e98066',
    },
  },
});
