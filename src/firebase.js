// Firebase configuration for SmartKitchen Pro
// ============================================
// IMPORTANT: Replace these placeholder values with your own Firebase project credentials.
// Go to https://console.firebase.google.com → Your Project → Project Settings → General
// Scroll down to "Your apps" → Web app → Config

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if Firebase is configured with real credentials
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let app = null;
let db = null;
let auth = null;

if (isFirebaseConfigured) {
  // Initialize Firebase only if real credentials are provided
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
}

export { db, auth };

// Anonymous auth — no sign-up friction
export const initAuth = () => {
  if (!isFirebaseConfigured) {
    // Skip Firebase auth when not configured — app works with localStorage
    console.info('SmartKitchen Pro: Running in local mode (no Firebase configured). Data is saved to localStorage.');
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(auth)
          .then((credential) => resolve(credential.user))
          .catch((error) => {
            console.error('Anonymous auth error:', error);
            resolve(null);
          });
      }
    });
  });
};

export default app;
