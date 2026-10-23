import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Client,
  ExpenseRecord,
  InventoryItem,
  Job,
  PaymentMethod,
  ShoppingListItem,
  User,
  UserRole,
  WorkerPayout,
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
  expenses: ExpenseRecord[];
  payouts: WorkerPayout[];
  shoppingList: ShoppingListItem[];
  loadingAuth: boolean;
  loginWithGoogle: (preferredRole?: UserRole) => Promise<{ success: boolean; error?: string; unauthorizedDomain?: string }>;
  logout: () => Promise<void>;
  linkWorker: (code: string) => Promise<{ success: boolean; workerName?: string; error?: string }>;
  switchUser: (uid: string) => void;
  loginWithEmail: (email: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
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
  // Expenses & Financials
  addExpense: (expenseData: Omit<ExpenseRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (expense: ExpenseRecord) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  recordWorkerPayout: (payoutData: Omit<WorkerPayout, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkerPayout: (payout: WorkerPayout) => Promise<void>;
  clearAllData: () => void;
}

const STORAGE_KEYS = {
  USERS: 'ramovia_users_v3',
  CLIENTS: 'ramovia_clients_v3',
  JOBS: 'ramovia_jobs_v3',
  INVENTORY: 'ramovia_inventory_v3',
  REPORTS: 'ramovia_reports_v3',
  EXPENSES: 'ramovia_expenses_v3',
  PAYOUTS: 'ramovia_payouts_v3',
};

// Initial Sample Data for Expenses if empty
const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp_101',
    title: 'Acquisto Carburante Decespugliatori & Rasaerba',
    category: 'carburante',
    amount: 145.5,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'pos_carta',
    recipientOrVendor: 'Eni Station Monza',
    notes: '25L Miscela 2T + Benzina',
    status: 'paid',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp_102',
    title: 'Manutenzione Trattorino e Affilatura Lame',
    category: 'manutenzione',
    amount: 280.0,
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    paymentMethod: 'bonifico',
    recipientOrVendor: 'Officina Agraria Brianza',
    notes: 'Tagliando e sostituzione filtri',
    status: 'paid',
    createdAt: new Date().toISOString(),
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ramovia_current_user_v3');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('ramovia_current_user_v3', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('ramovia_current_user_v3');
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

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

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [payouts, setPayouts] = useState<WorkerPayout[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYOUTS);
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(payouts));
  }, [payouts]);

  // Real-time Firebase Auth listener & Firestore sync
  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const emailLower = (fbUser.email || '').toLowerCase();
        const isAdmin =
          emailLower === 'andblasi@gmail.com' ||
          emailLower === 'infoa.blasi@gmail.com' ||
          emailLower.includes('admin') ||
          emailLower.includes('titolare');

        const fallbackUser: User = {
          uid: fbUser.uid,
          email: emailLower,
          displayName: fbUser.displayName || emailLower.split('@')[0] || 'Utente RAMOVIA',
          photoURL: fbUser.photoURL || undefined,
          role: isAdmin ? 'admin' : 'worker',
          active: true,
          workerCode: isAdmin ? undefined : 'OP-' + fbUser.uid.substring(0, 6).toUpperCase(),
          linkedToAdmin: isAdmin ? true : false,
          createdAt: new Date().toISOString(),
        };

        setCurrentUser(fallbackUser);
        setLoadingAuth(false);

        // Background sync user document
        try {
          const userDocData = await handleUserDocOnLogin(fbUser, isAdmin ? 'admin' : 'worker');
          if (userDocData) {
            setCurrentUser(userDocData);
          }
        } catch (err) {
          console.warn('User doc sync error:', err);
        }

        // Attach Firestore snapshots
        if (db) {
          try {
            onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
              if (snap.exists()) {
                setCurrentUser(snap.data() as User);
              }
            }, (err) => console.warn('user doc snapshot error:', err));

            onSnapshot(collection(db, 'users'), (snap) => {
              const docs = snap.docs.map((d) => d.data() as User);
              if (docs.length > 0) setUsers(docs);
            }, (err) => console.warn('users coll snapshot error:', err));

            onSnapshot(collection(db, 'clients'), (snap) => {
              const docs = snap.docs.map((d) => d.data() as Client);
              if (docs.length > 0) setClients(docs);
            }, (err) => console.warn('clients coll snapshot error:', err));

            onSnapshot(collection(db, 'jobs'), (snap) => {
              const docs = snap.docs.map((d) => d.data() as Job);
              if (docs.length > 0) setJobs(docs);
            }, (err) => console.warn('jobs coll snapshot error:', err));

            onSnapshot(collection(db, 'inventory'), (snap) => {
              const docs = snap.docs.map((d) => d.data() as InventoryItem);
              if (docs.length > 0) setInventory(docs);
            }, (err) => console.warn('inventory coll snapshot error:', err));

            onSnapshot(collection(db, 'timesheets_and_reports'), (snap) => {
              const docs = snap.docs.map((d) => d.data() as WorkReport);
              if (docs.length > 0) setReports(docs);
            }, (err) => console.warn('reports coll snapshot error:', err));

            onSnapshot(collection(db, 'expenses'), (snap) => {
              const docs = snap.docs.map((d) => d.data() as ExpenseRecord);
              if (docs.length > 0) setExpenses(docs);
            }, (err) => console.warn('expenses coll snapshot error:', err));

            onSnapshot(collection(db, 'worker_payouts'), (snap) => {
              const docs = snap.docs.map((d) => d.data() as WorkerPayout);
              if (docs.length > 0) setPayouts(docs);
            }, (err) => console.warn('payouts coll snapshot error:', err));
          } catch (e) {
            console.warn('Snapshot listeners setup warning:', e);
          }
        }
      } else {
        setLoadingAuth(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // AUTH ACTIONS
  const loginWithGoogle = async (preferredRole: UserRole = 'admin'): Promise<{ success: boolean; error?: string; unauthorizedDomain?: string }> => {
    try {
      setLoadingAuth(true);
      const res = await signInWithGoogle(preferredRole);
      if (res.user) {
        setCurrentUser(res.user);
        return { success: true };
      }
      return {
        success: false,
        error: res.error,
        unauthorizedDomain: res.unauthorizedDomain,
      };
    } catch (err: any) {
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
    role: UserRole = 'admin'
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
    if (existing) {
      const updatedUser: User = {
        ...existing,
        role,
        linkedToAdmin: true,
      };
      setCurrentUser(updatedUser);
      return { success: true };
    }
    const isOwner = role === 'admin' || cleanEmail.includes('admin') || cleanEmail.includes('titolare') || cleanEmail.includes('andblasi') || cleanEmail.includes('infoa.blasi');
    const newUser: User = {
      uid: `usr_${Date.now()}`,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0].replace(/[._-]/g, ' '),
      role: isOwner ? 'admin' : role,
      active: true,
      workerCode: isOwner ? undefined : generateWorkerCode(),
      linkedToAdmin: true,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      try {
        await setDoc(doc(db, 'users', newUser.uid), newUser);
      } catch (err) {
        console.warn('setDoc in loginWithEmail:', err);
      }
    }
    try {
      localStorage.setItem('ramovia_current_user_v3', JSON.stringify(newUser));
    } catch {
      // ignore
    }
    setUsers((prev) => [...prev, newUser]);
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
      linkedToAdmin: true,
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
    if (currentUser && currentUser.uid === uid) {
      const updatedUser: User = {
        ...currentUser,
        role,
        linkedToAdmin: true,
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('ramovia_current_user_v3', JSON.stringify(updatedUser));
      } catch {
        // ignore
      }
    }

    if (db) {
      try {
        await updateDoc(doc(db, 'users', uid), { role, linkedToAdmin: true });
      } catch (err) {
        console.warn('updateDoc user role error:', err);
      }
    }

    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role, linkedToAdmin: true } : u)));
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

  // EXPENSES & PAYOUTS MANAGEMENT
  const addExpense = async (expenseData: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const id = `exp_${Date.now()}`;
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, 'expenses', id), newExpense);
    } else {
      setExpenses((prev) => [newExpense, ...prev]);
    }
  };

  const updateExpense = async (updated: ExpenseRecord) => {
    if (db) {
      await setDoc(doc(db, 'expenses', updated.id), updated);
    } else {
      setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    }
  };

  const deleteExpense = async (id: string) => {
    if (db) {
      await deleteDoc(doc(db, 'expenses', id));
    } else {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const recordWorkerPayout = async (payoutData: Omit<WorkerPayout, 'id' | 'createdAt'>) => {
    const id = `pay_${Date.now()}`;
    const newPayout: WorkerPayout = {
      ...payoutData,
      id,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, 'worker_payouts', id), newPayout);
    } else {
      setPayouts((prev) => [newPayout, ...prev]);
    }
  };

  const updateWorkerPayout = async (updated: WorkerPayout) => {
    if (db) {
      await setDoc(doc(db, 'worker_payouts', updated.id), updated);
    } else {
      setPayouts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
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
    setExpenses([]);
    setPayouts([]);
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
        expenses,
        payouts,
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
        addExpense,
        updateExpense,
        deleteExpense,
        recordWorkerPayout,
        updateWorkerPayout,
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
