import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Optional Firebase configuration from environment or localStorage
export interface FirebaseCustomConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const getStoredConfig = (): FirebaseCustomConfig => {
  try {
    const stored = localStorage.getItem('ramovia_firebase_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to read stored Firebase config', e);
  }
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ramovia-gestionale',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export const initFirebase = (customConfig?: FirebaseCustomConfig) => {
  const config = customConfig || getStoredConfig();
  if (!config.apiKey || !config.projectId) {
    // Config not yet provided; app will run in high-performance local persistent mode
    return { app: null, auth: null, db: null, storage: null, isConfigured: false };
  }

  try {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    return { app, auth, db, storage, isConfigured: true };
  } catch (error) {
    console.warn('Firebase initialization warning:', error);
    return { app: null, auth: null, db: null, storage: null, isConfigured: false };
  }
};

const initialSetup = initFirebase();
export { auth, db, storage };
export const isFirebaseConfigured = initialSetup.isConfigured;
