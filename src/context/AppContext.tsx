import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Client,
  InventoryItem,
  Job,
  ShoppingListItem,
  User,
  UserRole,
  WorkReport,
} from '../types';
import {
  auth,
  db,
  signInWithGoogle,
  logoutFromFirebase,
  linkWorkerByCode,
  handleUserDocOnLogin,
  generateWorkerCode,
} from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  clients: Client[];
  jobs: Job[];
  inventory: InventoryItem[];
  reports: WorkReport[];
  shoppingList: ShoppingListItem[];
  loadingAuth: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  linkWorker: (code: string) => Promise<{ success: boolean; workerName?: string; error?: string }>;
  switchUser: (uid: string) => void;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerAccount: (name: string, email: string, role: UserRole, phone?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  addUser: (userData: Omit<User, 'uid'>) => Promise<User>;
  updateUserRole: (uid: string, role: UserRole) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  // Clients
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  // Jobs
  addJob: (jobData: Omit<Job, 'id'>) => Promise<void>;
  updateJob: (job: Job) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  startJob: (id: string) => Promise<void>;
  // Inventory
  addInventoryItem: (itemData: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  recordEquipmentMaintenance: (itemId: string, newUsageHours: number) => Promise<void>;
  // Reports
  submitWorkReport: (reportData: Omit<WorkReport, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  approveWorkReport: (reportId: string, adminNotes?: string) => Promise<void>;
  clearAllData: () => void;
}

const STORAGE_KEYS = {
  USERS: 'ramovia_users_v3',
  CLIENTS: 'ramovia_clients_v3',
  JOBS: 'ramovia_jobs_v3',
  INVENTORY: 'ramovia_inventory_v3',
  REPORTS: 'ramovia_reports_v3',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOBS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reports, setReports] = useState<WorkReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to LocalStorage as offline backup
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }, [reports]);

  // Real-time Firebase Auth listener & Firestore sync
  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        // Sync user doc upon login
        try {
          const userDocData = await handleUserDocOnLogin(fbUser);
          setCurrentUser(userDocData);
        } catch (err) {
          console.warn('User doc sync error:', err);
        }

        // Listen to currentUser doc in Firestore for real-time role / linkedToAdmin updates
        const userRef = doc(db, 'users', fbUser.uid);
        const unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setCurrentUser(snap.data() as User);
          }
        });

        // Listen to all collections in Firestore
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
          const docs = snap.docs.map((d) => d.data() as User);
          setUsers(docs);
        });

        const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
          const docs = snap.docs.map((d) => d.data() as Client);
          setClients(docs);
        });

        const unsubJobs = onSnapshot(collection(db, 'jobs'), (snap) => {
          const docs = snap.docs.map((d) => d.data() as Job);
          setJobs(docs);
        });

        const unsubInv = onSnapshot(collection(db, 'inventory'), (snap) => {
          const docs = snap.docs.map((d) => d.data() as InventoryItem);
          setInventory(docs);
        });

        const unsubRep = onSnapshot(collection(db, 'timesheets_and_reports'), (snap) => {
          const docs = snap.docs.map((d) => d.data() as WorkReport);
          setReports(docs);
        });

        setLoadingAuth(false);

        return () => {
          unsubUser();
          unsubUsers();
          unsubClients();
          unsubJobs();
          unsubInv();
          unsubRep();
        };
      } else {
        setCurrentUser(null);
        setLoadingAuth(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // AUTH ACTIONS
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoadingAuth(true);
      const user = await signInWithGoogle();
      if (user) {
        setCurrentUser(user);
        return { success: true };
      }
      return { success: false, error: 'Accesso annullato o non riuscito.' };
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      return {
        success: false,
        error: err.message || 'Si è verificato un errore durante l\'accesso con Google.',
      };
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = async () => {
    await logoutFromFirebase();
    setCurrentUser(null);
  };

  const linkWorker = async (code: string) => {
    if (!currentUser) return { success: false, error: 'Non sei autenticato' };
    return await linkWorkerByCode(code, currentUser.uid);
  };

  const switchUser = (uid: string) => {
    const found = users.find((u) => u.uid === uid);
    if (found) {
      setCurrentUser(found);
    }
  };

  const loginWithEmail = async (
    email: string,
    _password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
    if (existing) {
      setCurrentUser(existing);
      return { success: true };
    }
    const isOwner = cleanEmail.includes('admin') || cleanEmail.includes('titolare') || cleanEmail.includes('andblasi');
    const newUser: User = {
      uid: `usr_${Date.now()}`,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0].replace(/[._-]/g, ' '),
      role: isOwner ? 'admin' : 'worker',
      active: true,
      workerCode: isOwner ? undefined : generateWorkerCode(),
      linkedToAdmin: isOwner ? true : false,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, 'users', newUser.uid), newUser);
    } else {
      setUsers((prev) => [...prev, newUser]);
    }
    setCurrentUser(newUser);
    return { success: true };
  };

  const registerAccount = async (
    name: string,
    email: string,
    role: UserRole,
    phone?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const newUser: User = {
      uid: `usr_${Date.now()}`,
      email: cleanEmail,
      displayName: name.trim(),
      role,
      phone: phone?.trim(),
      active: true,
      workerCode: role === 'worker' ? generateWorkerCode() : undefined,
      linkedToAdmin: role === 'admin' ? true : false,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, 'users', newUser.uid), newUser);
    } else {
      setUsers((prev) => [...prev, newUser]);
    }
    setCurrentUser(newUser);
    return { success: true, user: newUser };
  };

  const addUser = async (userData: Omit<User, 'uid'>): Promise<User> => {
    const uid = `usr_${Date.now()}`;
    const newUser: User = {
      ...userData,
      uid,
      workerCode: userData.role === 'worker' ? (userData.workerCode || generateWorkerCode()) : undefined,
      linkedToAdmin: userData.role === 'admin' ? true : (userData.linkedToAdmin ?? false),
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, 'users', uid), newUser);
    } else {
      setUsers((prev) => [...prev, newUser]);
    }
    return newUser;
  };

  const updateUserRole = async (uid: string, role: UserRole) => {
    const linkedToAdmin = role === 'admin' ? true : true; // Admin promoted or changed
    if (db) {
      await updateDoc(doc(db, 'users', uid), { role, linkedToAdmin });
    } else {
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role, linkedToAdmin } : u)));
    }
  };

  const deleteUser = async (uid: string) => {
    if (db) {
      await deleteDoc(doc(db, 'users', uid));
    } else {
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    }
  };

  // CLIENT MANAGEMENT
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const id = `cli_${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (db) {
      await setDoc(doc(db, 'clients', id), newClient);
    } else {
      setClients((prev) => [newClient, ...prev]);
    }
  };

  const updateClient = async (updated: Client) => {
    if (db) {
      await setDoc(doc(db, 'clients', updated.id), updated);
    } else {
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
  };

  const deleteClient = async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, 'clients', id));
    } else {
      setClients((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // JOB MANAGEMENT
  const addJob = async (jobData: Omit<Job, 'id'>) => {
    const id = `job_${Date.now()}`;
    const newJob: Job = {
      ...jobData,
      id,
    };

    if (db) {
      await setDoc(doc(db, 'jobs', id), newJob);
    } else {
      setJobs((prev) => [newJob, ...prev]);
    }
  };

  const updateJob = async (updated: Job) => {
    if (db) {
      await setDoc(doc(db, 'jobs', updated.id), updated);
    } else {
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    }
  };

  const deleteJob = async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, 'jobs', id));
    } else {
      setJobs((prev) => prev.filter((j) => j.id !== id));
    }
  };

  const startJob = async (id: string) => {
    if (db) {
      await updateDoc(doc(db, 'jobs', id), { status: 'in_progress' });
    } else {
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status: 'in_progress' } : j))
      );
    }
  };

  // INVENTORY MANAGEMENT
  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id'>) => {
    const id = `inv_${itemData.category === 'equipment' ? 'eq' : 'mat'}_${Date.now()}`;
    const newItem: InventoryItem = {
      ...itemData,
      id,
    };

    if (db) {
      await setDoc(doc(db, 'inventory', id), newItem);
    } else {
      setInventory((prev) => [newItem, ...prev]);
    }
  };

  const updateInventoryItem = async (updated: InventoryItem) => {
    if (db) {
      await setDoc(doc(db, 'inventory', updated.id), updated);
    } else {
      setInventory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    }
  };

  const deleteInventoryItem = async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, 'inventory', id));
    } else {
      setInventory((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const recordEquipmentMaintenance = async (itemId: string, newUsageHours: number) => {
    const lastMaintenanceDate = new Date().toISOString().split('T')[0];
    if (db) {
      await updateDoc(doc(db, 'inventory', itemId), {
        currentUsageHours: newUsageHours,
        status: 'available',
        lastMaintenanceDate,
      });
    } else {
      setInventory((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                currentUsageHours: newUsageHours,
                status: 'available',
                lastMaintenanceDate,
              }
            : item
        )
      );
    }
  };

  // REPORT & TIMESHEET SUBMISSION
  const submitWorkReport = async (reportData: Omit<WorkReport, 'id' | 'createdAt' | 'status'>) => {
    const id = `rep_${Date.now()}`;
    const newReport: WorkReport = {
      ...reportData,
      id,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, 'timesheets_and_reports', id), newReport);
      await updateDoc(doc(db, 'jobs', reportData.jobId), { status: 'completed' });
    } else {
      setReports((prev) => [newReport, ...prev]);
      setJobs((prev) =>
        prev.map((j) => (j.id === reportData.jobId ? { ...j, status: 'completed' } : j))
      );
    }

    // Automatically deduct materials used
    if (reportData.materialsUsed && reportData.materialsUsed.length > 0) {
      for (const used of reportData.materialsUsed) {
        const inv = inventory.find((i) => i.id === used.itemId);
        if (inv) {
          const newQty = Math.max(0, inv.quantity - used.qty);
          if (db) {
            await updateDoc(doc(db, 'inventory', inv.id), { quantity: newQty });
          } else {
            setInventory((prev) =>
              prev.map((i) => (i.id === inv.id ? { ...i, quantity: newQty } : i))
            );
          }
        }
      }
    }
  };

  const approveWorkReport = async (reportId: string, adminNotes?: string) => {
    if (db) {
      await updateDoc(doc(db, 'timesheets_and_reports', reportId), {
        status: 'approved',
        adminNotes: adminNotes || '',
      });
    } else {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: 'approved', adminNotes: adminNotes ?? r.adminNotes }
            : r
        )
      );
    }
  };

  // SHOPPING LIST COMPUTATION
  const calculateShoppingList = (): ShoppingListItem[] => {
    const materialsNeededMap = new Map<string, number>();

    const pendingJobs = jobs.filter(
      (j) => j.status === 'scheduled' || j.status === 'in_progress'
    );

    for (const job of pendingJobs) {
      for (const req of job.materialsRequired || []) {
        const current = materialsNeededMap.get(req.itemId) || 0;
        materialsNeededMap.set(req.itemId, current + req.qtyNeeded);
      }
    }

    const itemsToBuy: ShoppingListItem[] = [];
    const materials = inventory.filter((item) => item.category === 'material');

    for (const mat of materials) {
      const neededForJobs = materialsNeededMap.get(mat.id) || 0;
      const effectiveAvailable = mat.quantity;
      const shortfallFromMin = Math.max(0, mat.minThreshold - effectiveAvailable);
      const shortfallFromJobs = Math.max(0, neededForJobs - effectiveAvailable);

      if (effectiveAvailable < mat.minThreshold || neededForJobs > effectiveAvailable) {
        const toOrder = Math.max(
          shortfallFromMin + (neededForJobs > effectiveAvailable ? shortfallFromJobs : 0),
          Math.max(1, mat.minThreshold)
        );

        itemsToBuy.push({
          itemId: mat.id,
          name: mat.name,
          currentStock: mat.quantity,
          minThreshold: mat.minThreshold,
          neededForScheduledJobs: neededForJobs,
          toOrder,
          unit: mat.unit,
          urgency:
            neededForJobs > effectiveAvailable || mat.quantity <= mat.minThreshold / 2
              ? 'high'
              : 'medium',
        });
      }
    }

    return itemsToBuy;
  };

  const shoppingList = calculateShoppingList();

  const clearAllData = () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    setUsers([]);
    setCurrentUser(null);
    setClients([]);
    setJobs([]);
    setInventory([]);
    setReports([]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        clients,
        jobs,
        inventory,
        reports,
        shoppingList,
        loadingAuth,
        loginWithGoogle,
        logout,
        linkWorker,
        switchUser,
        loginWithEmail,
        registerAccount,
        addUser,
        updateUserRole,
        deleteUser,
        addClient,
        updateClient,
        deleteClient,
        addJob,
        updateJob,
        deleteJob,
        startJob,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        recordEquipmentMaintenance,
        submitWorkReport,
        approveWorkReport,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
