import { Client, InventoryItem, Job, User, WorkReport } from '../types';

// Clean initial empty datasets - no demo/mock records
export const INITIAL_USERS: User[] = [
  {
    uid: 'user_admin',
    email: '',
    displayName: 'Titolare (Admin)',
    role: 'admin',
    active: true,
  },
  {
    uid: 'user_worker',
    email: '',
    displayName: 'Operaio',
    role: 'worker',
    active: true,
  }
];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_JOBS: Job[] = [];

export const INITIAL_REPORTS: WorkReport[] = [];
