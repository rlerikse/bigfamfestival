// Commit: Replace react-native-firebase with Firebase JS SDK for Expo compatibility
// Author: GitHub Copilot, 2024-06-10

/**
 * Firebase configuration and initialization for Expo React Native app.
 * Exports initialized firestore and auth instances.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Move these values to environment variables for security
const firebaseConfig = {
  apiKey: "AIzaSyDxZIs1oOTEtHu0SsuV30Of84RTCDkmg0s",
  authDomain: "bigfamfestival.firebaseapp.com",
  databaseURL: "https://bigfamfestival-default-rtdb.firebaseio.com",
  projectId: "bigfamfestival",
  storageBucket: "bigfamfestival.firebasestorage.app",
  messagingSenderId: "292369452544",
  appId: "1:292369452544:web:b3508390b4600be71c12e5",
  measurementId: "G-VZ06GV8DGT"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const firestore = getFirestore(app);
const auth = getAuth(app);

export { firestore, auth, app };
