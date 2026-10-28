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
  deleteDoc,
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
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  db = dbId ? getFirestore(app, dbId) : getFirestore(app);
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
  preferredRole: UserRole = 'admin',
  overrideEmail?: string
): Promise<User> => {
  const emailLower = (overrideEmail || fbUser.email || '').toLowerCase().trim();
  const nameRaw = (fbUser.displayName || '').trim();
  const nameLower = nameRaw.toLowerCase();

  // Known admin list / patterns (including Alvaro Fazi & Andrea Blasi)
  const isKnownAdmin =
    emailLower === 'andblasi@gmail.com' ||
    emailLower === 'infoa.blasi@gmail.com' ||
    emailLower.includes('alvaro') ||
    emailLower.includes('fazi') ||
    nameLower.includes('alvaro') ||
    nameLower.includes('fazi') ||
    nameLower.includes('andblasi') ||
    nameLower.includes('andrea blasi') ||
    emailLower.includes('admin') ||
    emailLower.includes('titolare') ||
    preferredRole === 'admin';

  // Display Name normalization: "andblasi" -> "Andrea Blasi", "alvaro fazi" -> "Alvaro Fazi"
  let cleanDisplayName = nameRaw;
  if (!cleanDisplayName || cleanDisplayName.toLowerCase() === 'andblasi' || emailLower === 'andblasi@gmail.com') {
    cleanDisplayName = 'Andrea Blasi';
  } else if (cleanDisplayName.toLowerCase().includes('alvaro') || cleanDisplayName.toLowerCase().includes('fazi')) {
    cleanDisplayName = 'Alvaro Fazi';
  }
  // Strip any accidental "(Io)" suffix from stored displayName
  cleanDisplayName = cleanDisplayName.replace(/\s*\(Io\)\s*$/i, '').trim();

  const role: UserRole = isKnownAdmin ? 'admin' : preferredRole;
  const fallbackUser: User = {
    uid: fbUser.uid,
    email: emailLower || 'utente@ramovia.it',
    displayName: cleanDisplayName || 'Titolare RAMOVIA',
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

    let finalUser: User;

    if (!userSnap.exists()) {
      const newUser: User = {
        ...fallbackUser,
        role: isKnownAdmin ? 'admin' : preferredRole,
        workerCode: !isKnownAdmin && preferredRole === 'worker' ? generateWorkerCode() : undefined,
        linkedToAdmin: isKnownAdmin ? true : false,
      };

      try {
        await setDoc(userRef, newUser);
      } catch (e) {
        console.warn('setDoc user error:', e);
      }
      finalUser = newUser;
    } else {
      const existingData = userSnap.data() as User;
      // CRITICAL: An existing admin MUST NEVER be demoted to worker!
      const isAlreadyAdmin = existingData.role === 'admin' || isKnownAdmin;
      const finalRole: UserRole = isAlreadyAdmin ? 'admin' : (preferredRole || existingData.role || 'worker');

      const updatedData: Partial<User> = {
        displayName: cleanDisplayName || existingData.displayName || fallbackUser.displayName,
        photoURL: fbUser.photoURL || existingData.photoURL,
        email: emailLower || existingData.email || fallbackUser.email,
        role: finalRole,
        linkedToAdmin: finalRole === 'admin' ? true : (existingData.linkedToAdmin ?? false),
      };

      try {
        await updateDoc(userRef, updatedData);
      } catch (e) {
        console.warn('updateDoc user error:', e);
      }
      finalUser = { ...existingData, ...updatedData };
    }

    // Deduplication in Firestore: prune any old duplicate documents for this user (e.g. "andblasi" or duplicate email)
    try {
      const usersColl = collection(db, 'users');
      // 1. By email
      if (emailLower) {
        const dupSnap = await getDocs(query(usersColl, where('email', '==', emailLower)));
        for (const d of dupSnap.docs) {
          if (d.id !== fbUser.uid) {
            console.log('Removing duplicate user doc by email:', d.id);
            await deleteDoc(doc(db, 'users', d.id));
          }
        }
      }
      // 2. By "andblasi" displayName if current user is Andrea Blasi
      if (emailLower === 'andblasi@gmail.com' || cleanDisplayName === 'Andrea Blasi') {
        const dupNameSnap = await getDocs(query(usersColl, where('displayName', '==', 'andblasi')));
        for (const d of dupNameSnap.docs) {
          if (d.id !== fbUser.uid) {
            console.log('Removing duplicate andblasi doc:', d.id);
            await deleteDoc(doc(db, 'users', d.id));
          }
        }
      }
    } catch (cleanErr) {
      console.warn('User deduplication error:', cleanErr);
    }

    return finalUser;
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
