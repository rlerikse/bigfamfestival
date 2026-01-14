/**
 * Firebase Compatibility Layer
 * 
 * This file provides a unified interface for Firebase functionality,
 * handling the compatibility between web Firebase SDK and React Native Firebase SDK.
 * Use this for all Firebase interactions to avoid conflicts.
 */

// Import from web SDK
import { firestore, auth } from '../config/firebase';

// Re-export web Firebase methods
export { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// Import from React Native Firebase SDK for native-specific functionality
// These imports are commented out by default to avoid immediate conflicts.
// Uncomment and use these when you specifically need React Native Firebase features
// that aren't available in the web SDK.

// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';

// You can create utility functions to handle differences between SDKs if needed

/**
 * Gets the appropriate Firestore instance
 * Uses web SDK by default
 */
export const getFirestore = () => {
  return firestore;
};

/**
 * Gets the appropriate Auth instance
 * Uses web SDK by default
 */
export const getAuth = () => {
  return auth;
};

// Default export is the web SDK firestore instance for backward compatibility
export default firestore;