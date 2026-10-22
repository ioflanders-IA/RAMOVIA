import firebaseConfig from '../../firebase-applet-config.json';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { User } from '../types';

export interface FirebaseCustomConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase init warning:', error);
}

export const UPLOAD_ENDPOINT = (firebaseConfig as any).customUploadEndpoint || 'https://www.iofall.it/ramovia/Upload';
export const RTDB_URL = (firebaseConfig as any).databaseURL || 'https://ramovia-a2c39-default-rtdb.europe-west1.firebasedatabase.app/';

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Generate a unique 6-character worker linking code (e.g., OP-7X9B2A)
export const generateWorkerCode = (): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'OP-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth) throw new Error('Firebase Auth non inizializzato');
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  if (!fbUser) return null;

  return await handleUserDocOnLogin(fbUser);
};

// Logout from Firebase
export const logoutFromFirebase = async (): Promise<void> => {
  if (auth) {
    await signOut(auth);
  }
};

// Handle creation or retrieval of user doc in Firestore upon login
export const handleUserDocOnLogin = async (fbUser: FirebaseUser): Promise<User> => {
  const userRef = doc(db, 'users', fbUser.uid);
  const userSnap = await getDoc(userRef);

  const emailLower = (fbUser.email || '').toLowerCase();
  const isAdminEmail = emailLower === 'andblasi@gmail.com';

  if (!userSnap.exists()) {
    // Check if there are any existing admins in database
    const usersColl = collection(db, 'users');
    const existingUsersSnap = await getDocs(usersColl);
    const noUsersYet = existingUsersSnap.empty;

    const isAdmin = isAdminEmail || noUsersYet;
    const role = isAdmin ? 'admin' : 'worker';
    const workerCode = isAdmin ? undefined : generateWorkerCode();
    const linkedToAdmin = isAdmin ? true : false;

    const newUser: User = {
      uid: fbUser.uid,
      email: emailLower,
      displayName: fbUser.displayName || 'Utente RAMOVIA',
      photoURL: fbUser.photoURL || undefined,
      role,
      active: true,
      workerCode,
      linkedToAdmin,
      createdAt: new Date().toISOString(),
    };

    await setDoc(userRef, newUser);
    return newUser;
  } else {
    const existingData = userSnap.data() as User;
    // Update profile info if changed
    const updatedData: Partial<User> = {
      displayName: fbUser.displayName || existingData.displayName,
      photoURL: fbUser.photoURL || existingData.photoURL,
      email: emailLower || existingData.email,
    };

    // Ensure primary admin always retains admin role
    if (isAdminEmail && existingData.role !== 'admin') {
      updatedData.role = 'admin';
      updatedData.linkedToAdmin = true;
    }

    await updateDoc(userRef, updatedData);
    return { ...existingData, ...updatedData };
  }
};

// Link worker to team by code
export const linkWorkerByCode = async (
  code: string,
  adminUid: string
): Promise<{ success: boolean; workerName?: string; error?: string }> => {
  if (!db) return { success: false, error: 'Database Firebase non connesso' };
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return { success: false, error: 'Inserisci un codice valido' };

  try {
    const usersColl = collection(db, 'users');
    const q = query(usersColl, where('workerCode', '==', cleanCode));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      return {
        success: false,
        error: `Nessun operaio trovato con il codice "${cleanCode}". Verifica che l'operaio si sia registrato con Google.`,
      };
    }

    const workerDoc = querySnap.docs[0];
    const workerData = workerDoc.data() as User;

    await updateDoc(doc(db, 'users', workerDoc.id), {
      linkedToAdmin: true,
      linkedAdminUid: adminUid,
      active: true,
    });

    return {
      success: true,
      workerName: workerData.displayName,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante il collegamento operaio' };
  }
};

export { app, auth, db, storage };
