import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyASlipjgOaPPyZpFtvD1tIGjxe3bEcBLh0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bigfamfestival.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bigfamfestival',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'bigfamfestival.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '292369452544',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:292369452544:web:70ee9f2189f0b554735a18',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
