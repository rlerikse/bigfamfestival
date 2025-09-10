import { getApps, getApp } from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Firebase is automatically initialized via google-services.json (Android) 
// and GoogleService-Info.plist (iOS), so we don't need to manually configure it
// The app is already initialized when React Native Firebase is installed

// Get the default Firebase app instance
const app = getApps().length > 0 ? getApp() : getApp();

// React Native Firebase automatically enables offline persistence by default
// No need to manually enable it like in the web SDK

export { firestore, auth, app };
