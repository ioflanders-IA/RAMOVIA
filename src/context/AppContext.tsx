import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Client,
  ExpenseRecord,
  ExpenseCategory,
  JobCostCategory,
  InventoryItem,
  Job,
  ShoppingListItem,
  User,
  UserRole,
  WorkerPayout,
  WorkReport,
  WorkedDay,
  JobCostItem,
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
  workedDays: WorkedDay[];
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
  updateUser: (user: User) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  addOfflineWorker: (data: { displayName: string; phone?: string; dailyRate: number; hourlyRate?: number; notes?: string }) => Promise<User>;
  // Clients
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  // Jobs
  addJob: (jobData: Omit<Job, 'id'>) => Promise<void>;
  updateJob: (job: Job) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  startJob: (id: string) => Promise<void>;
  addJobCost: (jobId: string, cost: Omit<JobCostItem, 'id'>) => Promise<void>;
  deleteJobCost: (jobId: string, costId: string) => Promise<void>;
  // Worked Days (Presenze & Compensi Operai)
  addWorkedDay: (data: Omit<WorkedDay, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkedDay: (data: WorkedDay) => Promise<void>;
  deleteWorkedDay: (id: string) => Promise<void>;
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
  CURRENT_USER: 'ramovia_current_user_v3',
  USERS: 'ramovia_users_v3',
  CLIENTS: 'ramovia_clients_v3',
  JOBS: 'ramovia_jobs_v3',
  INVENTORY: 'ramovia_inventory_v3',
  REPORTS: 'ramovia_reports_v3',
  EXPENSES: 'ramovia_expenses_v3',
  PAYOUTS: 'ramovia_payouts_v3',
  WORKED_DAYS: 'ramovia_worked_days_v3',
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

/**
 * Recursively cleans objects to remove any 'undefined' values before sending to Firestore
 * which prevents FirebaseError: Unsupported field value: undefined
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore) as any;
  }
  const clean: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean;
}

/**
 * Deduplicate and normalize users list:
 * - Unifies "andblasi" and "Andrea Blasi" into a single profile ("Andrea Blasi")
 * - Unifies "Alvaro Fazi" and ensures Alvaro Fazi is always Admin (never downgraded)
 * - Ensures any known admin (or user previously set as admin) stays Admin
 * - Merges duplicates by email or normalized name
 * - Preserves the current authenticated user's record or the most complete record
 */
export function deduplicateUsers(rawUsers: User[], currentAuthUid?: string): User[] {
  const mapByEmail = new Map<string, User>();
  const mapByName = new Map<string, User>();
  const result: User[] = [];

  for (const u of rawUsers) {
    if (!u) continue;
    let name = (u.displayName || u.email || 'Utente').trim();
    // Strip trailing tags like (Io), (Admin), (Operaio)
    name = name.replace(/\s*\((Io|Admin|Operaio)\)\s*$/i, '').trim();

    const emailKey = (u.email || '').toLowerCase().trim();
    const nameLower = name.toLowerCase();

    // Check known admins / identities
    const isAndreaBlasi =
      nameLower === 'andblasi' ||
      nameLower === 'andrea blasi' ||
      emailKey === 'andblasi@gmail.com' ||
      emailKey === 'infoa.blasi@gmail.com' ||
      emailKey.includes('andblasi');

    const isAlvaroFazi =
      nameLower.includes('alvaro') ||
      nameLower.includes('fazi') ||
      emailKey.includes('alvaro') ||
      emailKey.includes('fazi');

    if (isAndreaBlasi) {
      name = 'Andrea Blasi';
    } else if (isAlvaroFazi) {
      name = 'Alvaro Fazi';
    }

    const isPermanentAdmin =
      isAndreaBlasi ||
      isAlvaroFazi ||
      emailKey.includes('admin') ||
      emailKey.includes('titolare') ||
      nameLower.includes('admin') ||
      nameLower.includes('titolare') ||
      u.role === 'admin';

    const normalizedUser: User = {
      ...u,
      displayName: name,
      role: isPermanentAdmin ? 'admin' : (u.role || 'worker'),
      linkedToAdmin: isPermanentAdmin ? true : (u.linkedToAdmin ?? false),
    };

    const existingByEmail = emailKey ? mapByEmail.get(emailKey) : undefined;
    const existingByName = mapByName.get(name.toLowerCase());
    const existing = existingByEmail || existingByName;

    if (existing) {
      const preferCurrent =
        u.uid === currentAuthUid ||
        (!existing.photoURL && !!u.photoURL) ||
        (!existing.email && !!u.email) ||
        (existing.displayName.toLowerCase() === 'andblasi' && name === 'Andrea Blasi');

      if (preferCurrent) {
        const idx = result.indexOf(existing);
        if (idx >= 0) {
          result[idx] = normalizedUser;
          if (emailKey) mapByEmail.set(emailKey, normalizedUser);
          mapByName.set(name.toLowerCase(), normalizedUser);
        }
      }
    } else {
      result.push(normalizedUser);
      if (emailKey) mapByEmail.set(emailKey, normalizedUser);
      mapByName.set(name.toLowerCase(), normalizedUser);
    }
  }

  return result;
}

export const mapJobCostCategoryToExpense = (cat?: JobCostCategory): ExpenseCategory => {
  switch (cat) {
    case 'benzina':
      return 'carburante';
    case 'sacchi':
    case 'materiale':
      return 'materiale';
    case 'manodopera':
      return 'stipendio';
    case 'noleggio':
      return 'attrezzatura';
    case 'smaltimento':
    case 'altro':
    default:
      return 'generale';
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Current user initialized from localStorage so refresh keeps the user logged in
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          let name = (parsed.displayName || parsed.email || '').trim().replace(/\s*\((Io|Admin|Operaio)\)\s*$/i, '');
          const nameLower = name.toLowerCase();
          const emailLower = (parsed.email || '').toLowerCase();
          const isKnownAdmin =
            nameLower.includes('alvaro') ||
            nameLower.includes('fazi') ||
            nameLower === 'andblasi' ||
            nameLower === 'andrea blasi' ||
            emailLower === 'andblasi@gmail.com' ||
            emailLower.includes('alvaro') ||
            emailLower.includes('fazi') ||
            parsed.role === 'admin';

          if (nameLower === 'andblasi' || emailLower === 'andblasi@gmail.com') {
            name = 'Andrea Blasi';
          } else if (nameLower.includes('alvaro') || emailLower.includes('alvaro')) {
            name = 'Alvaro Fazi';
          }

          return {
            ...parsed,
            displayName: name,
            role: isKnownAdmin ? 'admin' : (parsed.role || 'worker'),
            linkedToAdmin: isKnownAdmin ? true : (parsed.linkedToAdmin ?? false),
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [loadingAuth, setLoadingAuth] = useState(true);

  // 2. State initialized from LocalStorage immediately
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      const parsed: User[] = saved ? JSON.parse(saved) : [];
      return deduplicateUsers(parsed);
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

  const [operationalExpenses, setOperationalExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const parsed = saved ? JSON.parse(saved) : [];
      const pureExpenses = Array.isArray(parsed)
        ? parsed.filter((e: any) => !e.jobId && !e.jobCostId && !e.id?.startsWith('exp_job_'))
        : [];
      return pureExpenses.length > 0 ? pureExpenses : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  // Combina in tempo reale le spese operative generali con ciascun costo singolo registrato nei cantieri
  const expenses = useMemo<ExpenseRecord[]>(() => {
    const combined: ExpenseRecord[] = [];
    const seenIds = new Set<string>();

    // 1. Spese generali
    operationalExpenses.forEach((exp) => {
      if (!seenIds.has(exp.id)) {
        seenIds.add(exp.id);
        combined.push(exp);
      }
    });

    // 2. Ogni voce di costo dei cantieri/lavori
    jobs.forEach((job) => {
      if (job.costs && job.costs.length > 0) {
        job.costs.forEach((cost) => {
          const costExpId = `exp_job_${job.id}_${cost.id}`;
          if (!seenIds.has(costExpId) && !seenIds.has(cost.id)) {
            seenIds.add(costExpId);
            combined.push({
              id: costExpId,
              title: cost.name,
              category: mapJobCostCategoryToExpense(cost.category),
              amount: Number(cost.amount) || 0,
              date: job.date || new Date().toISOString().split('T')[0],
              paymentMethod: job.paymentMethod || 'contanti',
              recipientOrVendor: cost.notes || job.clientName,
              notes: `Costo cantiere: ${job.title} (${job.clientName})`,
              status: 'paid',
              createdAt: cost.createdAt || job.date || new Date().toISOString(),
              jobId: job.id,
              jobCostId: cost.id,
              clientId: job.clientId,
              clientName: job.clientName,
            });
          }
        });
      }
    });

    return combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [operationalExpenses, jobs]);

  const [payouts, setPayouts] = useState<WorkerPayout[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYOUTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [workedDays, setWorkedDays] = useState<WorkedDay[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORKED_DAYS);
      const parsed: WorkedDay[] = saved ? JSON.parse(saved) : [];
      // Deduplica presenze nello stesso giorno per lo stesso operaio
      const uniqueMap = new Map<string, WorkedDay>();
      parsed.forEach((wd) => {
        const key = `${wd.workerId}_${wd.date}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { ...wd });
        } else {
          const existing = uniqueMap.get(key)!;
          if (wd.notes && !existing.notes?.includes(wd.notes)) {
            existing.notes = `${existing.notes || ''} | ${wd.notes}`;
          }
        }
      });
      return Array.from(uniqueMap.values());
    } catch {
      return [];
    }
  });

  // Save current user whenever changed
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Sync state changes to LocalStorage unconditionally so deletions are preserved
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
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(operationalExpenses));
  }, [operationalExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(payouts));
  }, [payouts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKED_DAYS, JSON.stringify(workedDays));
  }, [workedDays]);

  // Auto-reconciliation: verifica e applica ore attrezzatura e scarico materiali dei lavori già completati
  useEffect(() => {
    const unappliedJobs = jobs.filter(
      (j) =>
        j.status === 'completed' &&
        (!j.equipmentHoursApplied || !j.materialsDeducted) &&
        ((j.equipmentRequired && j.equipmentRequired.length > 0) ||
          (j.materialsRequired && j.materialsRequired.length > 0))
    );

    if (unappliedJobs.length === 0) return;

    let invChanged = false;
    let nextInv = [...inventory];

    unappliedJobs.forEach((job) => {
      // 1. Attrezzature: somma ore
      if (!job.equipmentHoursApplied && job.equipmentRequired) {
        job.equipmentRequired.forEach((req) => {
          const hours = Number(req.hoursUsed) || 0;
          if (hours > 0) {
            nextInv = nextInv.map((item) => {
              if (
                item.category === 'equipment' &&
                (item.id === req.itemId || (item.name && req.name && item.name.trim().toLowerCase() === req.name.trim().toLowerCase()))
              ) {
                invChanged = true;
                return { ...item, currentUsageHours: (item.currentUsageHours || 0) + hours };
              }
              return item;
            });
          }
        });
      }

      // 2. Materiali: scarico giacenza
      if (!job.materialsDeducted && job.materialsRequired) {
        job.materialsRequired.forEach((mat) => {
          const qty = Number(mat.qtyNeeded) || 0;
          if (qty > 0) {
            nextInv = nextInv.map((item) => {
              if (
                item.category === 'material' &&
                (item.id === mat.itemId || (item.name && mat.name && item.name.trim().toLowerCase() === mat.name.trim().toLowerCase()))
              ) {
                invChanged = true;
                return { ...item, quantity: Math.max(0, (item.quantity || 0) - qty) };
              }
              return item;
            });
          }
        });
      }
    });

    if (invChanged) {
      setInventory(nextInv);
      try {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(nextInv));
      } catch (e) {
        console.warn(e);
      }
    }

    setJobs((prev) => {
      const next = prev.map((j) => {
        if (
          j.status === 'completed' &&
          (!j.equipmentHoursApplied || !j.materialsDeducted) &&
          ((j.equipmentRequired && j.equipmentRequired.length > 0) ||
            (j.materialsRequired && j.materialsRequired.length > 0))
        ) {
          return { ...j, equipmentHoursApplied: true, materialsDeducted: true };
        }
        return j;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  }, [jobs.length]);

  // 3. Firestore snapshot listeners & real-time cross-device sync (PC <-> Mobile)
  useEffect(() => {
    if (!db) return;

    // CLIENTS LISTENER
    const unsubClients = onSnapshot(
      collection(db, 'clients'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Client));
        setClients(docs);
        try {
          localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(docs));
        } catch (e) {
          console.warn(e);
        }
      },
      (err) => console.warn('clients snapshot error:', err)
    );

    // JOBS LISTENER
    const unsubJobs = onSnapshot(
      collection(db, 'jobs'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
        setJobs(docs);
        try {
          localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(docs));
        } catch (e) {
          console.warn(e);
        }
      },
      (err) => console.warn('jobs snapshot error:', err)
    );

    // INVENTORY LISTENER
    const unsubInv = onSnapshot(
      collection(db, 'inventory'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem));
        setInventory(docs);
        try {
          localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(docs));
        } catch (e) {
          console.warn(e);
        }
      },
      (err) => console.warn('inventory snapshot error:', err)
    );

    // REPORTS LISTENER
    const unsubReports = onSnapshot(
      collection(db, 'timesheets_and_reports'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkReport));
        setReports(docs);
        try {
          localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(docs));
        } catch (e) {
          console.warn(e);
        }
      },
      (err) => console.warn('reports snapshot error:', err)
    );

    // EXPENSES LISTENER (Solo spese operative generali)
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseRecord));
          const pureDocs = docs.filter((e) => !e.jobId && !e.jobCostId && !e.id?.startsWith('exp_job_'));
          if (pureDocs.length > 0) {
            setOperationalExpenses(pureDocs);
            try {
              localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(pureDocs));
            } catch (e) {
              console.warn(e);
            }
          }
        }
      },
      (err) => console.warn('expenses snapshot error:', err)
    );

    // PAYOUTS LISTENER
    const unsubPayouts = onSnapshot(
      collection(db, 'worker_payouts'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkerPayout));
        setPayouts(docs);
        try {
          localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(docs));
        } catch (e) {
          console.warn(e);
        }
      },
      (err) => console.warn('payouts snapshot error:', err)
    );

    // WORKED DAYS LISTENER
    const unsubWorkedDays = onSnapshot(
      collection(db, 'worked_days'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkedDay));
        setWorkedDays(docs);
        try {
          localStorage.setItem(STORAGE_KEYS.WORKED_DAYS, JSON.stringify(docs));
        } catch (e) {
          console.warn(e);
        }
      },
      (err) => console.warn('worked_days snapshot error:', err)
    );

    // USERS LISTENER
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User));
        if (docs.length > 0) {
          const cleanDocs = deduplicateUsers(docs, auth?.currentUser?.uid);
          setUsers(cleanDocs);
          try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleanDocs));
          } catch (e) {
            console.warn(e);
          }
        }
      },
      (err) => console.warn('users snapshot error:', err)
    );

    return () => {
      unsubClients();
      unsubJobs();
      unsubInv();
      unsubReports();
      unsubExpenses();
      unsubPayouts();
      unsubWorkedDays();
      unsubUsers();
    };
  }, []);

  // 4. Firebase Auth session listener
  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser && !fbUser.isAnonymous && fbUser.email) {
        const emailLower = fbUser.email.toLowerCase();
        let displayName = (fbUser.displayName || emailLower.split('@')[0] || 'Utente RAMOVIA').trim();
        displayName = displayName.replace(/\s*\((Io|Admin|Operaio)\)\s*$/i, '').trim();
        const nameLower = displayName.toLowerCase();

        // Check if saved user in localStorage was already admin
        let savedRole: UserRole | undefined;
        try {
          const savedStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
          if (savedStr) {
            const parsed = JSON.parse(savedStr);
            if (parsed && parsed.role) savedRole = parsed.role;
          }
        } catch {
          // ignore
        }

        const isKnownAdmin =
          emailLower === 'andblasi@gmail.com' ||
          emailLower === 'infoa.blasi@gmail.com' ||
          emailLower.includes('admin') ||
          emailLower.includes('titolare') ||
          emailLower.includes('alvaro') ||
          emailLower.includes('fazi') ||
          nameLower.includes('alvaro') ||
          nameLower.includes('fazi') ||
          nameLower.includes('andrea blasi') ||
          nameLower === 'andblasi' ||
          savedRole === 'admin';

        if (nameLower === 'andblasi' || emailLower === 'andblasi@gmail.com' || emailLower === 'infoa.blasi@gmail.com') {
          displayName = 'Andrea Blasi';
        } else if (nameLower.includes('alvaro') || emailLower.includes('alvaro') || nameLower.includes('fazi')) {
          displayName = 'Alvaro Fazi';
        }

        const roleToUse: UserRole = isKnownAdmin ? 'admin' : (savedRole || 'worker');

        const fallbackUser: User = {
          uid: fbUser.uid,
          email: emailLower,
          displayName,
          photoURL: fbUser.photoURL || undefined,
          role: roleToUse,
          active: true,
          workerCode: roleToUse === 'admin' ? undefined : 'OP-' + fbUser.uid.substring(0, 6).toUpperCase(),
          linkedToAdmin: roleToUse === 'admin',
          createdAt: new Date().toISOString(),
        };

        setCurrentUser(fallbackUser);
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(fallbackUser));
        } catch {
          // ignore
        }
        setLoadingAuth(false);

        // Background sync user document in Firestore
        try {
          const userDocData = await handleUserDocOnLogin(fbUser, roleToUse);
          if (userDocData) {
            const safeDocData: User = {
              ...userDocData,
              role: isKnownAdmin ? 'admin' : userDocData.role,
              displayName: displayName || userDocData.displayName,
              linkedToAdmin: isKnownAdmin ? true : (userDocData.linkedToAdmin ?? false),
            };
            setCurrentUser(safeDocData);
            try {
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeDocData));
            } catch {
              // ignore
            }
          }
        } catch (err) {
          console.warn('User doc sync error:', err);
        }

        // Also listen to current user doc updates
        if (db) {
          onSnapshot(
            doc(db, 'users', fbUser.uid),
            (snap) => {
              if (snap.exists()) {
                const updated = snap.data() as User;
                const safeUpdated: User = {
                  ...updated,
                  role: isKnownAdmin ? 'admin' : updated.role,
                  displayName: displayName || updated.displayName,
                  linkedToAdmin: isKnownAdmin ? true : (updated.linkedToAdmin ?? false),
                };
                setCurrentUser(safeUpdated);
                try {
                  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUpdated));
                } catch {
                  // ignore
                }
              }
            },
            (err) => console.warn('user doc snapshot error:', err)
          );
        }
      } else {
        // If there was any anonymous leftover session, sign out of it immediately
        if (fbUser && fbUser.isAnonymous) {
          logoutFromFirebase().catch(() => {});
        }
        // Check if there is an active user session in localStorage (direct preview access)
        const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.email) {
              const nameLower = (parsed.displayName || '').toLowerCase();
              const emailLower = (parsed.email || '').toLowerCase();
              const isKnownAdmin =
                emailLower === 'andblasi@gmail.com' ||
                emailLower === 'infoa.blasi@gmail.com' ||
                emailLower.includes('admin') ||
                emailLower.includes('titolare') ||
                emailLower.includes('alvaro') ||
                emailLower.includes('fazi') ||
                nameLower.includes('alvaro') ||
                nameLower.includes('fazi') ||
                nameLower.includes('andrea blasi') ||
                nameLower === 'andblasi' ||
                parsed.role === 'admin';

              if (isKnownAdmin) {
                parsed.role = 'admin';
                parsed.linkedToAdmin = true;
              }
              if (nameLower === 'andblasi' || emailLower === 'andblasi@gmail.com') {
                parsed.displayName = 'Andrea Blasi';
              } else if (nameLower.includes('alvaro') || emailLower.includes('alvaro')) {
                parsed.displayName = 'Alvaro Fazi';
              }
              setCurrentUser(parsed);
            }
          } catch {
            // ignore
          }
        }
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
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(res.user));
        } catch {
          // ignore
        }
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
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {
      // ignore
    }
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
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(found));
      } catch {
        // ignore
      }
    }
  };

  const loginWithEmail = async (
    email: string,
    role: UserRole = 'admin'
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isOwner =
      role === 'admin' ||
      cleanEmail.includes('admin') ||
      cleanEmail.includes('titolare') ||
      cleanEmail.includes('andblasi') ||
      cleanEmail.includes('infoa.blasi') ||
      cleanEmail.includes('alvaro') ||
      cleanEmail.includes('fazi');
    const effectiveRole: UserRole = isOwner ? 'admin' : role;

    let computedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    if (cleanEmail === 'andblasi@gmail.com' || cleanEmail.includes('andblasi')) {
      computedName = 'Andrea Blasi';
    } else if (cleanEmail.includes('alvaro') || cleanEmail.includes('fazi')) {
      computedName = 'Alvaro Fazi';
    }

    const existing = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanEmail) ||
        (computedName === 'Andrea Blasi' && (u.displayName?.toLowerCase() === 'andblasi' || u.displayName?.toLowerCase() === 'andrea blasi')) ||
        (computedName === 'Alvaro Fazi' && (u.displayName?.toLowerCase().includes('alvaro') || u.displayName?.toLowerCase().includes('fazi')))
    );

    if (existing) {
      const updatedUser: User = {
        ...existing,
        displayName: computedName,
        role: effectiveRole,
        linkedToAdmin: true,
      };
      setCurrentUser(updatedUser);
      setUsers((prev) => deduplicateUsers(prev.map((u) => (u.uid === existing.uid ? updatedUser : u))));
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      } catch {
        // ignore
      }
      return { success: true };
    }

    const newUser: User = {
      uid: auth?.currentUser?.uid || `usr_${Date.now()}`,
      email: cleanEmail,
      displayName: computedName,
      role: effectiveRole,
      active: true,
      workerCode: isOwner ? undefined : generateWorkerCode(),
      linkedToAdmin: true,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      try {
        await setDoc(doc(db, 'users', newUser.uid), sanitizeForFirestore(newUser), { merge: true });
      } catch (err) {
        console.warn('setDoc in loginWithEmail:', err);
      }
    }
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    } catch {
      // ignore
    }
    setUsers((prev) => deduplicateUsers([...prev, newUser]));
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
      try {
        await setDoc(doc(db, 'users', newUser.uid), sanitizeForFirestore(newUser));
      } catch (err) {
        console.warn(err);
      }
    }
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    } catch {
      // ignore
    }
    setUsers((prev) => [...prev, newUser]);
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
      try {
        await setDoc(doc(db, 'users', uid), sanitizeForFirestore(newUser));
      } catch (err) {
        console.warn(err);
      }
    }
    setUsers((prev) => [...prev, newUser]);
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
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
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
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (err) {
        console.warn(err);
      }
    }
    setUsers((prev) => prev.filter((u) => u.uid !== uid));
  };

  const updateUser = async (updated: User) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.uid === updated.uid ? updated : u));
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (currentUser && currentUser.uid === updated.uid) {
      setCurrentUser(updated);
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }

    if (db) {
      try {
        await setDoc(doc(db, 'users', updated.uid), sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        console.warn('Firestore updateUser error:', err);
      }
    }
  };

  const addOfflineWorker = async (data: {
    displayName: string;
    phone?: string;
    dailyRate: number;
    hourlyRate?: number;
    notes?: string;
  }): Promise<User> => {
    const uid = `worker_offline_${Date.now()}`;
    const newWorker: User = {
      uid,
      displayName: data.displayName.trim(),
      email: `${data.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'operaio'}@ramovia.local`,
      phone: data.phone?.trim(),
      role: 'worker',
      active: true,
      workerCode: generateWorkerCode(),
      linkedToAdmin: true,
      isOfflineWorker: true,
      dailyRate: data.dailyRate,
      hourlyRate: data.hourlyRate || (data.dailyRate ? Math.round(data.dailyRate / 8) : 15),
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => {
      const next = [...prev, newWorker];
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'users', uid), sanitizeForFirestore(newWorker));
      } catch (err) {
        console.warn('Firestore addOfflineWorker error:', err);
      }
    }

    return newWorker;
  };

  // WORKED DAYS (Presenze & Compensi Giornalieri)
  const addWorkedDay = async (data: Omit<WorkedDay, 'id' | 'createdAt'>) => {
    // Controlla se l'operaio ha già una giornata conteggiata in questa data
    const existing = workedDays.find((wd) => wd.workerId === data.workerId && wd.date === data.date);
    if (existing) {
      // Aggiorna l'esistente unificando note e cantieri senza conteggiare due volte la giornata
      const updated: WorkedDay = {
        ...existing,
        cantiereName: data.cantiereName && !existing.cantiereName?.includes(data.cantiereName)
          ? `${existing.cantiereName || ''}, ${data.cantiereName}`
          : existing.cantiereName,
        notes: data.notes && !existing.notes?.includes(data.notes)
          ? `${existing.notes || ''} | ${data.notes}`
          : existing.notes,
      };
      await updateWorkedDay(updated);
      return;
    }

    const id = `wd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDay: WorkedDay = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };

    setWorkedDays((prev) => {
      const next = [newDay, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.WORKED_DAYS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'worked_days', id), sanitizeForFirestore(newDay));
      } catch (err) {
        console.warn('Firestore setDoc worked_days error:', err);
      }
    }
  };

  const updateWorkedDay = async (day: WorkedDay) => {
    setWorkedDays((prev) => {
      const next = prev.map((d) => (d.id === day.id ? day : d));
      try {
        localStorage.setItem(STORAGE_KEYS.WORKED_DAYS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'worked_days', day.id), sanitizeForFirestore(day), { merge: true });
      } catch (err) {
        console.warn('Firestore updateDoc worked_days error:', err);
      }
    }
  };

  const deleteWorkedDay = async (id: string) => {
    setWorkedDays((prev) => {
      const next = prev.filter((d) => d.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.WORKED_DAYS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await deleteDoc(doc(db, 'worked_days', id));
      } catch (err) {
        console.warn('Firestore deleteDoc worked_days error:', err);
      }
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

    // Immediate optimistic update and local persistence
    setClients((prev) => {
      const next = [newClient, ...prev.filter((c) => c.id !== id)];
      try {
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'clients', id), sanitizeForFirestore(newClient));
      } catch (err) {
        console.warn('Firestore setDoc client error:', err);
      }
    }
  };

  const updateClient = async (updated: Client) => {
    setClients((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      try {
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'clients', updated.id), sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        console.warn('Firestore updateDoc client error:', err);
      }
    }
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (err) {
        console.warn('Firestore deleteDoc client error:', err);
      }
    }
  };

  // Helper: Sincronizza ore di utilizzo attrezzature e consumo materiali in Magazzino
  const syncJobToInventory = (updatedJob: Job, prevJob?: Job) => {
    setInventory((prevInv) => {
      let changed = false;
      const nextInv = prevInv.map((item) => {
        const updatedItem = { ...item };

        // 1. ATTREZZATURE: Calcolo e aggiornamento ore di utilizzo
        if (item.category === 'equipment') {
          const req = updatedJob.equipmentRequired?.find(
            (r) => r.itemId === item.id || (r.name && item.name && r.name.trim().toLowerCase() === item.name.trim().toLowerCase())
          );
          const prevReq = prevJob?.equipmentRequired?.find(
            (r) => r.itemId === item.id || (r.name && item.name && r.name.trim().toLowerCase() === item.name.trim().toLowerCase())
          );

          const newHours = updatedJob.status === 'completed' ? (Number(req?.hoursUsed) || 0) : 0;
          const oldHours = (prevJob?.status === 'completed' && prevJob.equipmentHoursApplied) ? (Number(prevReq?.hoursUsed) || 0) : 0;
          const deltaHours = newHours - oldHours;

          if (deltaHours !== 0) {
            const calculatedHours = Math.max(0, (item.currentUsageHours || 0) + deltaHours);
            updatedItem.currentUsageHours = calculatedHours;
            changed = true;
            if (db) {
              updateDoc(doc(db, 'inventory', item.id), { currentUsageHours: calculatedHours }).catch((err) =>
                console.warn('Firestore equipment hours update error:', err)
              );
            }
          }
        }

        // 2. MATERIALI & CONSUMABILI: Scarico giacenze da magazzino
        if (item.category === 'material') {
          const reqMat = updatedJob.materialsRequired?.find(
            (m) => m.itemId === item.id || (m.name && item.name && m.name.trim().toLowerCase() === item.name.trim().toLowerCase())
          );
          const prevMat = prevJob?.materialsRequired?.find(
            (m) => m.itemId === item.id || (m.name && item.name && m.name.trim().toLowerCase() === item.name.trim().toLowerCase())
          );

          const newQtyDeducted = updatedJob.status === 'completed' ? (Number(reqMat?.qtyNeeded) || 0) : 0;
          const oldQtyDeducted = (prevJob?.status === 'completed' && prevJob.materialsDeducted) ? (Number(prevMat?.qtyNeeded) || 0) : 0;
          const deltaQty = newQtyDeducted - oldQtyDeducted;

          if (deltaQty !== 0) {
            const calculatedQty = Math.max(0, (item.quantity || 0) - deltaQty);
            updatedItem.quantity = calculatedQty;
            changed = true;
            if (db) {
              updateDoc(doc(db, 'inventory', item.id), { quantity: calculatedQty }).catch((err) =>
                console.warn('Firestore material quantity update error:', err)
              );
            }
          }
        }

        return updatedItem;
      });

      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(nextInv));
        } catch (e) {
          console.warn(e);
        }
        return nextInv;
      }
      return prevInv;
    });
  };

  // JOB MANAGEMENT
  const addJob = async (jobData: Omit<Job, 'id'>) => {
    const id = `job_${Date.now()}`;
    const isCompleted = jobData.status === 'completed';
    const newJob: Job = {
      ...jobData,
      id,
      equipmentHoursApplied: isCompleted,
      materialsDeducted: isCompleted,
    };

    setJobs((prev) => {
      const next = [newJob, ...prev.filter((j) => j.id !== id)];
      try {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (isCompleted) {
      syncJobToInventory(newJob);
    }

    if (db) {
      try {
        await setDoc(doc(db, 'jobs', id), sanitizeForFirestore(newJob));
      } catch (err) {
        console.warn('Firestore setDoc job error:', err);
      }
    }
  };

  const updateJob = async (updated: Job) => {
    const prevJob = jobs.find((j) => j.id === updated.id);
    const isCompleted = updated.status === 'completed';

    const processedJob: Job = {
      ...updated,
      equipmentHoursApplied: isCompleted,
      materialsDeducted: isCompleted,
    };

    setJobs((prev) => {
      const next = prev.map((j) => (j.id === processedJob.id ? processedJob : j));
      try {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    // Sincronizza sempre ore macchine e consumo materiali in magazzino
    syncJobToInventory(processedJob, prevJob);

    if (isCompleted) {
      const targetWorkerIds = processedJob.assignedWorkerIds && processedJob.assignedWorkerIds.length > 0
        ? processedJob.assignedWorkerIds
        : [processedJob.assignedWorkerId];

      targetWorkerIds.forEach((wId) => {
        if (!wId) return;
        const workerObj = users.find((u) => u.uid === wId);
        const wName = workerObj?.displayName || processedJob.assignedWorkerName || 'Operaio';
        const existingOnDate = workedDays.find((wd) => wd.workerId === wId && wd.date === processedJob.date);
        if (!existingOnDate) {
          const defaultDailyRate = workerObj?.dailyRate || 90;
          addWorkedDay({
            workerId: wId,
            workerName: wName,
            date: processedJob.date,
            dayType: 'full',
            dailyRate: defaultDailyRate,
            amount: defaultDailyRate,
            cantiereName: processedJob.cantiereName || processedJob.clientName,
            jobId: processedJob.id,
            notes: `Completato: ${processedJob.title}`,
            paid: false,
          });
        }
      });
    }

    if (db) {
      try {
        await setDoc(doc(db, 'jobs', processedJob.id), sanitizeForFirestore(processedJob), { merge: true });
      } catch (err) {
        console.warn('Firestore update job error:', err);
      }
    }
  };

  const deleteJob = async (id: string) => {
    setJobs((prev) => {
      const next = prev.filter((j) => j.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await deleteDoc(doc(db, 'jobs', id));
      } catch (err) {
        console.warn('Firestore delete job error:', err);
      }
    }
  };

  const startJob = async (id: string) => {
    setJobs((prev) => {
      const next = prev.map((j) => (j.id === id ? { ...j, status: 'in_progress' as const } : j));
      try {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await updateDoc(doc(db, 'jobs', id), { status: 'in_progress' });
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const addJobCost = async (jobId: string, costData: Omit<JobCostItem, 'id'>) => {
    const costId = `cost_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCost: JobCostItem = {
      ...costData,
      id: costId,
      createdAt: new Date().toISOString(),
    };

    setJobs((prev) => {
      const next = prev.map((j) => {
        if (j.id === jobId) {
          const updatedCosts = [...(j.costs || []), newCost];
          const updatedJob = { ...j, costs: updatedCosts };
          if (db) {
            setDoc(doc(db, 'jobs', j.id), sanitizeForFirestore(updatedJob), { merge: true }).catch((e) =>
              console.warn('Firestore addJobCost error:', e)
            );
          }
          return updatedJob;
        }
        return j;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const deleteJobCost = async (jobId: string, costId: string) => {
    setJobs((prev) => {
      const next = prev.map((j) => {
        if (j.id === jobId) {
          const updatedCosts = (j.costs || []).filter((c) => c.id !== costId);
          const updatedJob = { ...j, costs: updatedCosts };
          if (db) {
            setDoc(doc(db, 'jobs', j.id), sanitizeForFirestore(updatedJob), { merge: true }).catch((e) =>
              console.warn('Firestore deleteJobCost error:', e)
            );
          }
          return updatedJob;
        }
        return j;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  // INVENTORY MANAGEMENT
  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id'>) => {
    const id = `inv_${itemData.category === 'equipment' ? 'eq' : 'mat'}_${Date.now()}`;
    const newItem: InventoryItem = {
      ...itemData,
      id,
    };

    setInventory((prev) => {
      const next = [newItem, ...prev.filter((i) => i.id !== id)];
      try {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'inventory', id), sanitizeForFirestore(newItem));
      } catch (err) {
        console.warn('Firestore setDoc inventory error:', err);
      }
    }
  };

  const updateInventoryItem = async (updated: InventoryItem) => {
    setInventory((prev) => {
      const next = prev.map((item) => (item.id === updated.id ? updated : item));
      try {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'inventory', updated.id), sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        console.warn('Firestore update inventory error:', err);
      }
    }
  };

  const deleteInventoryItem = async (id: string) => {
    setInventory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
      } catch (err) {
        console.warn('Firestore delete inventory error:', err);
      }
    }
  };

  const recordEquipmentMaintenance = async (itemId: string, newUsageHours: number) => {
    const lastMaintenanceDate = new Date().toISOString().split('T')[0];
    setInventory((prev) => {
      const next = prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              currentUsageHours: newUsageHours,
              status: 'available' as const,
              lastMaintenanceDate,
            }
          : item
      );
      try {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await updateDoc(doc(db, 'inventory', itemId), {
          currentUsageHours: newUsageHours,
          status: 'available',
          lastMaintenanceDate,
        });
      } catch (err) {
        console.warn('Firestore maintenance update error:', err);
      }
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

    setReports((prev) => {
      const next = [newReport, ...prev.filter((r) => r.id !== id)];
      try {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    setJobs((prev) => {
      const next = prev.map((j) => (j.id === reportData.jobId ? { ...j, status: 'completed' as const } : j));
      try {
        localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'timesheets_and_reports', id), sanitizeForFirestore(newReport));
        await updateDoc(doc(db, 'jobs', reportData.jobId), { status: 'completed' });
      } catch (err) {
        console.warn('Firestore submit report error:', err);
      }
    }

    // Automatically deduct materials used
    if (reportData.materialsUsed && reportData.materialsUsed.length > 0) {
      for (const used of reportData.materialsUsed) {
        const inv = inventory.find((i) => i.id === used.itemId);
        if (inv) {
          const newQty = Math.max(0, inv.quantity - used.qty);
          setInventory((prev) => {
            const next = prev.map((i) => (i.id === inv.id ? { ...i, quantity: newQty } : i));
            try {
              localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(next));
            } catch (e) {
              console.warn(e);
            }
            return next;
          });
          if (db) {
            try {
              await updateDoc(doc(db, 'inventory', inv.id), { quantity: newQty });
            } catch (err) {
              console.warn('Firestore material deduct error:', err);
            }
          }
        }
      }
    }
  };

  const approveWorkReport = async (reportId: string, adminNotes?: string) => {
    setReports((prev) => {
      const next = prev.map((r) =>
        r.id === reportId
          ? { ...r, status: 'approved' as const, adminNotes: adminNotes ?? r.adminNotes }
          : r
      );
      try {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await updateDoc(doc(db, 'timesheets_and_reports', reportId), {
          status: 'approved',
          adminNotes: adminNotes || '',
        });
      } catch (err) {
        console.warn('Firestore approve report error:', err);
      }
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

    setOperationalExpenses((prev) => {
      const next = [newExpense, ...prev.filter((e) => e.id !== id)];
      try {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'expenses', id), sanitizeForFirestore(newExpense));
      } catch (err) {
        console.warn('Firestore add expense error:', err);
      }
    }
  };

  const updateExpense = async (updated: ExpenseRecord) => {
    // If it belongs to a job cost
    if (updated.jobId && updated.jobCostId) {
      setJobs((prev) => {
        const next = prev.map((j) => {
          if (j.id === updated.jobId) {
            const updatedCosts = (j.costs || []).map((c) =>
              c.id === updated.jobCostId
                ? { ...c, amount: Number(updated.amount) || 0, name: updated.title, notes: updated.recipientOrVendor }
                : c
            );
            const updatedJob = { ...j, costs: updatedCosts };
            if (db) {
              setDoc(doc(db, 'jobs', j.id), sanitizeForFirestore(updatedJob), { merge: true }).catch((e) =>
                console.warn(e)
              );
            }
            return updatedJob;
          }
          return j;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
        } catch (e) {
          console.warn(e);
        }
        return next;
      });
      return;
    }

    setOperationalExpenses((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e));
      try {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'expenses', updated.id), sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        console.warn('Firestore update expense error:', err);
      }
    }
  };

  const deleteExpense = async (id: string) => {
    const expenseToDelete = expenses.find((e) => e.id === id);

    // Se appartiene a un costo di cantiere
    if (expenseToDelete?.jobId && expenseToDelete?.jobCostId) {
      setJobs((prev) => {
        const next = prev.map((j) => {
          if (j.id === expenseToDelete.jobId) {
            const updatedCosts = (j.costs || []).filter((c) => c.id !== expenseToDelete.jobCostId);
            const updatedJob = { ...j, costs: updatedCosts };
            if (db) {
              setDoc(doc(db, 'jobs', j.id), sanitizeForFirestore(updatedJob), { merge: true }).catch((e) =>
                console.warn(e)
              );
            }
            return updatedJob;
          }
          return j;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
        } catch (e) {
          console.warn(e);
        }
        return next;
      });
      return;
    }

    if (id.startsWith('exp_job_')) {
      const parts = id.replace('exp_job_', '').split('_');
      const jobId = parts[0];
      const costId = parts.slice(1).join('_');
      setJobs((prev) => {
        const next = prev.map((j) => {
          if (j.id === jobId) {
            const updatedCosts = (j.costs || []).filter((c) => c.id !== costId);
            const updatedJob = { ...j, costs: updatedCosts };
            if (db) {
              setDoc(doc(db, 'jobs', j.id), sanitizeForFirestore(updatedJob), { merge: true }).catch((e) =>
                console.warn(e)
              );
            }
            return updatedJob;
          }
          return j;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(next));
        } catch (e) {
          console.warn(e);
        }
        return next;
      });
      return;
    }

    // Se è una spesa operativa generale, rimuovi solo questo ID
    setOperationalExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (err) {
        console.warn('Firestore delete expense error:', err);
      }
    }
  };

  const recordWorkerPayout = async (payoutData: Omit<WorkerPayout, 'id' | 'createdAt'>) => {
    const id = `pay_${Date.now()}`;
    const newPayout: WorkerPayout = {
      ...payoutData,
      id,
      createdAt: new Date().toISOString(),
    };

    setPayouts((prev) => {
      const next = [newPayout, ...prev.filter((p) => p.id !== id)];
      try {
        localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'worker_payouts', id), sanitizeForFirestore(newPayout));
      } catch (err) {
        console.warn('Firestore add payout error:', err);
      }
    }
  };

  const updateWorkerPayout = async (updated: WorkerPayout) => {
    setPayouts((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      try {
        localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'worker_payouts', updated.id), sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        console.warn('Firestore update payout error:', err);
      }
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
    Object.values(STORAGE_KEYS).forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
    setUsers([]);
    setCurrentUser(null);
    setClients([]);
    setJobs([]);
    setInventory([]);
    setReports([]);
    setOperationalExpenses([]);
    setPayouts([]);
    setWorkedDays([]);
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
        workedDays,
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
        updateUser,
        deleteUser,
        addOfflineWorker,
        addClient,
        updateClient,
        deleteClient,
        addJob,
        updateJob,
        deleteJob,
        startJob,
        addJobCost,
        deleteJobCost,
        addWorkedDay,
        updateWorkedDay,
        deleteWorkedDay,
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
