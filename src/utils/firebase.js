import LOCAL_FALLBACK_CONFIG from '../firebase_config';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// --- Global Variable Setup (Mandatory for Canvas Environment) ---
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Determine the configuration source: Canvas global or local fallback
export const firebaseConfig = (typeof __firebase_config !== 'undefined' && Object.keys(JSON.parse(__firebase_config)).length > 0)
  ? JSON.parse(__firebase_config) 
  : LOCAL_FALLBACK_CONFIG;

export const initialAuthToken = typeof __initial_auth_token !== 'undefined' 
  ? __initial_auth_token
  : null;

// Safety check for local runs
if (LOCAL_FALLBACK_CONFIG.apiKey === "YOUR_API_KEY") {
    console.error("CONFIGURATION ERROR: Please update the LOCAL_FALLBACK_CONFIG in firebase_config.js with your actual Firebase project keys.");
    // We will proceed, but auth/db calls will fail until configuration is valid.
}

export const app = initializeApp(LOCAL_FALLBACK_CONFIG);
export const firestore = getFirestore(app);
export const authInstance = getAuth(app);
// Firebase Auth uses browserLocalPersistence by default, which persists sessions across page refreshes
// This means users will stay logged in until they explicitly sign out
export const storage = getStorage(app);

