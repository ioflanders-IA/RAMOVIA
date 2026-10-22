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
import { User, UserRole } from '../types';

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

export interface SignInResult {
  user: User | null;
  error?: string;
  unauthorizedDomain?: string;
}

// Sign in with Google accepting a preferred role chosen by user
export const signInWithGoogle = async (preferredRole: UserRole = 'admin'): Promise<SignInResult> => {
  if (!auth) return { user: null, error: 'Firebase Auth non inizializzato' };
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    if (!fbUser) return { user: null, error: 'Nessun utente restituito da Google' };

    const user = await handleUserDocOnLogin(fbUser, preferredRole);
    return { user };
  } catch (err: any) {
    if (
      err.code === 'auth/unauthorized-domain' ||
      (err.message && err.message.includes('unauthorized-domain'))
    ) {
      const currentHost = window.location.hostname;
      return {
        user: null,
        error: 'unauthorized_domain',
        unauthorizedDomain: currentHost,
      };
    }
    return {
      user: null,
      error: err.message || 'Errore durante l\'accesso con Google',
    };
  }
};

// Logout from Firebase
export const logoutFromFirebase = async (): Promise<void> => {
  if (auth) {
    await signOut(auth);
  }
};

// Handle creation or retrieval of user doc in Firestore upon login
export const handleUserDocOnLogin = async (
  fbUser: FirebaseUser,
  preferredRole: UserRole = 'admin'
): Promise<User> => {
  const emailLower = (fbUser.email || '').toLowerCase();
  const isAdminEmail = emailLower === 'andblasi@gmail.com' || emailLower.includes('admin') || preferredRole === 'admin';

  const role: UserRole = preferredRole;
  const fallbackUser: User = {
    uid: fbUser.uid,
    email: emailLower,
    displayName: fbUser.displayName || emailLower.split('@')[0] || 'Utente RAMOVIA',
    photoURL: fbUser.photoURL || undefined,
    role,
    active: true,
    workerCode: role === 'worker' ? 'OP-' + fbUser.uid.substring(0, 6).toUpperCase() : undefined,
    linkedToAdmin: role === 'admin' ? true : false,
    createdAt: new Date().toISOString(),
  };

  if (!db) return fallbackUser;

  try {
    const userRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newUser: User = {
        ...fallbackUser,
        role,
        workerCode: role === 'worker' ? generateWorkerCode() : undefined,
        linkedToAdmin: role === 'admin' ? true : false,
      };

      setDoc(userRef, newUser).catch((e) => console.warn('setDoc user error:', e));
      return newUser;
    } else {
      const existingData = userSnap.data() as User;
      const updatedData: Partial<User> = {
        displayName: fbUser.displayName || existingData.displayName,
        photoURL: fbUser.photoURL || existingData.photoURL,
        email: emailLower || existingData.email,
        role: preferredRole || existingData.role,
      };

      if (preferredRole === 'admin') {
        updatedData.linkedToAdmin = true;
      }

      updateDoc(userRef, updatedData).catch((e) => console.warn('updateDoc user error:', e));
      return { ...existingData, ...updatedData };
    }
  } catch (error) {
    console.warn('handleUserDocOnLogin Firestore error, using fallback:', error);
    return fallbackUser;
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
