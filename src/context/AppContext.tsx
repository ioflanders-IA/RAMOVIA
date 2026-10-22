import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_CLIENTS,
  INITIAL_INVENTORY,
  INITIAL_JOBS,
  INITIAL_REPORTS,
  INITIAL_USERS,
} from '../data/mockData';
import {
  Client,
  InventoryItem,
  Job,
  ShoppingListItem,
  User,
  UserRole,
  WorkReport,
} from '../types';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  clients: Client[];
  jobs: Job[];
  inventory: InventoryItem[];
  reports: WorkReport[];
  shoppingList: ShoppingListItem[];
  switchUser: (uid: string) => void;
  login: (user: User) => void;
  logout: () => void;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerAccount: (name: string, email: string, role: UserRole, phone?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  addUser: (userData: Omit<User, 'uid'>) => User;
  updateUserRole: (uid: string, role: UserRole) => void;
  deleteUser: (uid: string) => void;
  // Clients
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  // Jobs
  addJob: (jobData: Omit<Job, 'id'>) => void;
  updateJob: (job: Job) => void;
  deleteJob: (id: string) => void;
  startJob: (id: string) => void;
  // Inventory
  addInventoryItem: (itemData: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  recordEquipmentMaintenance: (itemId: string, newUsageHours: number) => void;
  // Reports
  submitWorkReport: (reportData: Omit<WorkReport, 'id' | 'createdAt' | 'status'>) => void;
  approveWorkReport: (reportId: string, adminNotes?: string) => void;
  // Clear all data
  clearAllData: () => void;
}

const STORAGE_KEYS = {
  USERS: 'ramovia_users_v2',
  CURRENT_USER_ID: 'ramovia_current_uid_v2',
  CLIENTS: 'ramovia_clients_v2',
  JOBS: 'ramovia_jobs_v2',
  INVENTORY: 'ramovia_inventory_v2',
  REPORTS: 'ramovia_reports_v2',
};

// Clear any old v1 mock/demo keys from previous runs
try {
  ['ramovia_users_v1', 'ramovia_current_uid_v1', 'ramovia_clients_v1', 'ramovia_jobs_v1', 'ramovia_inventory_v1', 'ramovia_reports_v1'].forEach((k) => {
    localStorage.removeItem(k);
  });
} catch {
  // ignore
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with localStorage fallbacks (defaulting to empty arrays)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || INITIAL_USERS[0].uid;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.JOBS);
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [reports, setReports] = useState<WorkReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

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

  const currentUser = currentUserId === 'logged_out' ? null : (users.find((u) => u.uid === currentUserId) || users[0] || null);

  const switchUser = (uid: string) => {
    const found = users.find((u) => u.uid === uid);
    if (found) {
      setCurrentUserId(uid);
    }
  };

  const login = (user: User) => {
    setCurrentUserId(user.uid);
  };

  const logout = () => {
    setCurrentUserId('logged_out');
  };

  const loginWithEmail = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
    if (existing) {
      setCurrentUserId(existing.uid);
      return { success: true };
    }
    // If not found in local user registry, automatically create the user profile with worker role (or admin if keyword matched)
    const isOwner = cleanEmail.includes('admin') || cleanEmail.includes('titolare') || cleanEmail.includes('andblasi');
    const newUser: User = {
      uid: `usr_${Date.now()}`,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0].replace(/[._-]/g, ' '),
      role: isOwner ? 'admin' : 'worker',
      active: true,
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.uid);
    return { success: true };
  };

  const registerAccount = async (
    name: string,
    email: string,
    role: UserRole,
    phone?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email && u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Un account con questa email è già registrato.' };
    }
    const newUser: User = {
      uid: `usr_${Date.now()}`,
      email: cleanEmail,
      displayName: name.trim(),
      role,
      phone: phone?.trim(),
      active: true,
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.uid);
    return { success: true, user: newUser };
  };

  const addUser = (userData: Omit<User, 'uid'>): User => {
    const newUser: User = {
      ...userData,
      uid: `usr_${Date.now()}`,
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUserRole = (uid: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
  };

  const deleteUser = (uid: string) => {
    setUsers((prev) => prev.filter((u) => u.uid !== uid));
    if (currentUserId === uid) {
      const remaining = users.filter((u) => u.uid !== uid);
      if (remaining.length > 0) {
        setCurrentUserId(remaining[0].uid);
      } else {
        setCurrentUserId('logged_out');
      }
    }
  };

  // CLIENT MANAGEMENT
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClients((prev) => [newClient, ...prev]);
  };

  const updateClient = (updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    // Also sync client name & address to uncompleted jobs
    setJobs((prev) =>
      prev.map((j) =>
        j.clientId === updated.id
          ? {
              ...j,
              clientName: updated.name,
              clientAddress: updated.address,
              clientPhone: updated.phone,
              lat: updated.lat,
              lng: updated.lng,
            }
          : j
      )
    );
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  // JOB MANAGEMENT
  const addJob = (jobData: Omit<Job, 'id'>) => {
    const newJob: Job = {
      ...jobData,
      id: `job_${Date.now()}`,
    };
    setJobs((prev) => [newJob, ...prev]);
  };

  const updateJob = (updated: Job) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const startJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'in_progress' } : j))
    );
  };

  // INVENTORY MANAGEMENT
  const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv_${itemData.category === 'equipment' ? 'eq' : 'mat'}_${Date.now()}`,
    };
    setInventory((prev) => [newItem, ...prev]);
  };

  const updateInventoryItem = (updated: InventoryItem) => {
    setInventory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const recordEquipmentMaintenance = (itemId: string, newUsageHours: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              currentUsageHours: newUsageHours,
              status: 'available',
              lastMaintenanceDate: new Date().toISOString().split('T')[0],
            }
          : item
      )
    );
  };

  // REPORT & TIMESHEET SUBMISSION
  const submitWorkReport = (reportData: Omit<WorkReport, 'id' | 'createdAt' | 'status'>) => {
    const newReport: WorkReport = {
      ...reportData,
      id: `rep_${Date.now()}`,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...prev]);

    // 1. Mark corresponding job as completed
    setJobs((prev) =>
      prev.map((j) => (j.id === reportData.jobId ? { ...j, status: 'completed' } : j))
    );

    // 2. Automatically deduct materials used from inventory
    if (reportData.materialsUsed && reportData.materialsUsed.length > 0) {
      setInventory((prev) =>
        prev.map((inv) => {
          const used = reportData.materialsUsed.find((m) => m.itemId === inv.id);
          if (used) {
            const newQty = Math.max(0, inv.quantity - used.qty);
            return { ...inv, quantity: newQty };
          }
          return inv;
        })
      );
    }
  };

  const approveWorkReport = (reportId: string, adminNotes?: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'approved',
              adminNotes: adminNotes ?? r.adminNotes,
            }
          : r
      )
    );
  };

  // CALCULATE SHOPPING LIST
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
          urgency: neededForJobs > effectiveAvailable || mat.quantity <= mat.minThreshold / 2 ? 'high' : 'medium',
        });
      }
    }

    return itemsToBuy;
  };

  const shoppingList = calculateShoppingList();

  const clearAllData = () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    setUsers(INITIAL_USERS);
    setCurrentUserId(INITIAL_USERS[0].uid);
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
        switchUser,
        login,
        logout,
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
