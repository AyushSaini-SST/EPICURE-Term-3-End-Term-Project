// Firebase configuration for PantryPulse
// ============================================
// IMPORTANT: Replace these placeholder values with your own Firebase project credentials.
// Go to https://console.firebase.google.com → Your Project → Project Settings → General
// Scroll down to "Your apps" → Web app → Config

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyARw7nphO0szzjqRLn2r_J6IdF9Yc3F3x0",
  authDomain: "pantry-pulse-c63f9.firebaseapp.com",
  projectId: "pantry-pulse-c63f9",
  storageBucket: "pantry-pulse-c63f9.firebasestorage.app",
  messagingSenderId: "864084857064",
  appId: "1:864084857064:web:b89c6a974f6c0a1a41f95d",
  measurementId: "G-6R7WJDCPWV"
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

export { app, db, auth };
export default app;
