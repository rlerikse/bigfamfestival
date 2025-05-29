import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// REPLACE THESE WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDxZIs1oOTEtHu0SsuV30Of84RTCDkmg0s",
  authDomain: "bigfamfestival.firebaseapp.com",
  projectId: "bigfamfestival", // e.g., "bigfamfestival-d50c6"
  storageBucket: "bigfamfestival.firebasestorage.app",
  messagingSenderId: "292369452544", 
  appId: "1:292369452544:web:b3508390b4600be71c12e5",
  measurementId: "G-VZ06GV8DGT" // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const firestore = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(firestore)
  .then(() => {
    console.log("Firestore offline persistence enabled.");
  })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn("Firestore offline persistence failed: Multiple tabs open or other precondition failed.");
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn("Firestore offline persistence failed: Browser does not support required features.");
    } else {
      console.error("Firestore offline persistence failed: ", err);
    }
  });

export { firestore, auth, app };
