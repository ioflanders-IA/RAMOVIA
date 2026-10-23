export type UserRole = 'admin' | 'worker';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  phone?: string;
  active: boolean;
  workerCode?: string;
  linkedToAdmin?: boolean;
  linkedAdminUid?: string;
  hourlyRate?: number; // e.g. €15.00/h
  dailyRate?: number;  // e.g. €120.00/day
  createdAt?: string;
}

export interface PolygonPoint {
  lat: number;
  lng: number;
}

export interface GardenNotes {
  squareMeters: number;
  irrigationDetails: string;
  delicatePlants: string;
  gateCode: string;
  dogPresent: boolean;
  notes?: string;
  polygonPoints?: PolygonPoint[];
}

export type PaymentMethod = 'bonifico' | 'contanti' | 'pos_carta' | 'assegno' | 'riba_30_60' | 'altro';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  lat: number;
  lng: number;
  gardenNotes: GardenNotes;
  preferredPaymentMethod?: PaymentMethod;
  vatOrTaxCode?: string;
  createdAt: string;
}

export interface MaterialRequirement {
  itemId: string;
  name: string;
  qtyNeeded: number;
  unit: string;
}

export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type JobPaymentStatus = 'pending' | 'partial' | 'paid' | 'unpaid';

export interface PaymentInstallment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt?: string;
}

export interface Job {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  assignedWorkerId: string;
  assignedWorkerName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "08:30 - 12:30"
  status: JobStatus;
  title: string;
  description: string;
  notes?: string;
  materialsRequired: MaterialRequirement[];
  lat: number;
  lng: number;
  // Financial fields
  price?: number;
  paymentStatus?: JobPaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
  installments?: PaymentInstallment[];
}

export type InventoryCategory = 'equipment' | 'material';
export type InventoryUnit = 'pz' | 'kg' | 'lt' | 'sacchi' | 'rotoli';
export type EquipmentStatus = 'available' | 'maintenance';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: InventoryUnit;
  minThreshold: number;
  assignedToWorkerId: string | null;
  assignedWorkerName?: string;
  maintenanceIntervalHours: number; // e.g. every 50h
  currentUsageHours: number; // e.g. 48h
  status: EquipmentStatus;
  brand?: string;
  lastMaintenanceDate?: string;
}

export interface MaterialUsed {
  itemId: string;
  name: string;
  qty: number;
  unit: string;
}

export interface WorkReport {
  id: string;
  jobId: string;
  jobTitle: string;
  clientId?: string;
  clientName: string;
  clientAddress: string;
  workerId: string;
  workerName: string;
  date: string;
  startTime: string; // "08:30"
  endTime: string;   // "12:15"
  totalHours: number;
  trackingType: 'timer' | 'manual';
  photosBefore: string[];
  photosAfter: string[];
  materialsUsed: MaterialUsed[];
  signatureDataUrl?: string;
  clientSigneeName?: string;
  clientNotes: string;
  adminNotes?: string;
  status: 'submitted' | 'approved';
  createdAt: string;
}

export interface ShoppingListItem {
  itemId: string;
  name: string;
  currentStock: number;
  minThreshold: number;
  neededForScheduledJobs: number;
  toOrder: number;
  unit: string;
  urgency: 'high' | 'medium';
}

export interface WeatherData {
  temp: number;
  condition: string;
  precipitationProbability: number;
  rainMm: number;
  windSpeed: number;
  isRaining: boolean;
  rainAlert: boolean;
  summary: string;
}

// EXPENSE & FINANCIAL RECORDS
export type ExpenseCategory = 'attrezzatura' | 'carburante' | 'materiale' | 'manutenzione' | 'stipendio' | 'generale';

export interface ExpenseRecord {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  recipientOrVendor?: string;
  notes?: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface WorkerPayout {
  id: string;
  workerId: string;
  workerName: string;
  period: string; // e.g. "2026-10"
  totalHours: number;
  daysWorked: number;
  hourlyRate: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  status: 'pending' | 'paid';
  notes?: string;
  createdAt: string;
}
