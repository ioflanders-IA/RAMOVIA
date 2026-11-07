import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, Job, CantiereSite, GardenNotes, JobCostItem, JobCostCategory, User } from '../../types';
import { ClientModal } from './ClientModal';
import { JobModal, NATURANDO_LOGO_URL } from '../jobs/JobModal';
import { JobDetailViewModal } from '../jobs/JobDetailViewModal';
import { JobCostManagerModal } from '../jobs/JobCostManagerModal';
import { ManualMaintenanceModal } from '../inventory/ManualMaintenanceModal';
import { FormattedNote } from '../common/FormattedNote';
import { getRenamedCategoriesMap, getCanonicalCategoryKey } from '../../utils/categoryUtils';
import {
  Users,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Sprout,
  Droplets,
  Calendar,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Fuel,
  Package,
  Euro,
  DollarSign,
  TrendingUp,
  X,
  CheckCircle2,
  Check,
  Building2,
  Receipt,
  RotateCcw,
  Palette,
  HardHat,
  Dog,
  ChevronDown,
  Wallet,
  Wrench,
} from 'lucide-react';
import { getClientColor, CLIENT_COLOR_OPTIONS } from '../../utils/clientColors';

export interface WorkerLaborItem {
  workerId: string;
  workerName: string;
  dayType: 'mezza giornata' | 'giornata intera';
  rate: number;
  cost: number;
  totalJobsToday: number;
}

export interface JobLaborSummary {
  workers: WorkerLaborItem[];
  totalLaborCost: number;
}

const cleanHtmlText = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/<br\s*[\/]?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
};

const IT_MONTHS_SHORT = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];

const formatDayAndMonth = (dateStr?: string) => {
  if (!dateStr) return { day: '--', month: '---' };
  try {
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      const day = parts[2].replace(/^0/, '');
      const mIdx = parseInt(parts[1], 10) - 1;
      const month = IT_MONTHS_SHORT[mIdx] || parts[1];
      return { day, month };
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return { day: String(d.getDate()), month: IT_MONTHS_SHORT[d.getMonth()] || '' };
    }
  } catch {
    // fallback
  }
  return { day: dateStr, month: '' };
};

const formatAmountNoCents = (val: number) => {
  return Math.abs(val) % 1 === 0 ? val.toFixed(0) : val.toFixed(2);
};

export const isUserAdminHelper = (u?: User | null, nameOrId?: string, allUsers?: User[]): boolean => {
  if (u) {
    if (u.role?.toLowerCase() === 'admin') return true;
    const dn = (u.displayName || '').toLowerCase();
    const em = (u.email || '').toLowerCase();
    if (
      dn.includes('admin') ||
      dn.includes('alvaro') ||
      dn.includes('fazi') ||
      dn.includes('andrea blasi') ||
      dn.includes('andblasi') ||
      dn.includes('amministratore') ||
      dn.includes('titolare')
    ) {
      return true;
    }
    if (em.includes('admin') || em.includes('alvaro') || em.includes('fazi') || em.includes('andblasi')) {
      return true;
    }
  }
  if (nameOrId) {
    const s = nameOrId.toLowerCase().trim();
    if (
      s.includes('admin') ||
      s.includes('alvaro') ||
      s.includes('fazi') ||
      s.includes('andrea blasi') ||
      s.includes('andblasi') ||
      s.includes('amministratore') ||
      s.includes('titolare')
    ) {
      return true;
    }
    if (allUsers) {
      const match = allUsers.find(
        (usr) => usr.uid === nameOrId || usr.displayName.toLowerCase() === s
      );
      if (match && isUserAdminHelper(match)) return true;
    }
  }
  return false;
};

export const getJobLaborSummary = (
  job: Job,
  allJobs: Job[],
  allUsers: User[]
): JobLaborSummary => {
  const targetDate = (job.date || '').split('T')[0];
  if (!targetDate) {
    return { workers: [], totalLaborCost: 0 };
  }

  // 1. Resolve assigned workers (strictly excluding admin users from labor cost)
  const assignedWorkerMap = new Map<string, { id: string; name: string; rate: number }>();

  if (Array.isArray(job.assignedWorkerIds) && job.assignedWorkerIds.length > 0) {
    job.assignedWorkerIds.forEach((wId) => {
      if (!wId) return;
      const u = allUsers.find((usr) => usr.uid === wId);
      if (isUserAdminHelper(u, wId, allUsers)) return; // L'operaio admin non deve essere contabilizzato nella manodopera
      const name = u?.displayName || 'Operaio';
      if (isUserAdminHelper(u, name, allUsers)) return;
      const rate = u?.dailyRate || 90;
      assignedWorkerMap.set(wId, { id: wId, name, rate });
    });
  }

  if (job.assignedWorkerId && !assignedWorkerMap.has(job.assignedWorkerId)) {
    const u = allUsers.find((usr) => usr.uid === job.assignedWorkerId);
    if (!isUserAdminHelper(u, job.assignedWorkerId, allUsers)) {
      const name = u?.displayName || job.assignedWorkerName || 'Operaio';
      if (!isUserAdminHelper(u, name, allUsers)) {
        const rate = u?.dailyRate || 90;
        assignedWorkerMap.set(job.assignedWorkerId, { id: job.assignedWorkerId, name, rate });
      }
    }
  }

  const rawNames: string[] = [];
  if (Array.isArray(job.assignedWorkerNames)) {
    rawNames.push(...job.assignedWorkerNames);
  }
  if (job.assignedWorkerName) {
    job.assignedWorkerName.split(',').forEach((n) => rawNames.push(n.trim()));
  }

  rawNames.forEach((n) => {
    if (!n) return;
    if (isUserAdminHelper(undefined, n, allUsers)) return; // L'operaio admin non deve essere contabilizzato nella manodopera
    const lowerName = n.toLowerCase();
    const alreadyMapped = Array.from(assignedWorkerMap.values()).some(
      (w) => w.name.toLowerCase() === lowerName
    );
    if (!alreadyMapped) {
      const u = allUsers.find((usr) => usr.displayName.toLowerCase() === lowerName);
      if (isUserAdminHelper(u, n, allUsers)) return; // L'operaio admin non deve essere contabilizzato nella manodopera

      if (u) {
        assignedWorkerMap.set(u.uid, { id: u.uid, name: u.displayName, rate: u.dailyRate || 90 });
      } else {
        assignedWorkerMap.set(n, { id: n, name: n, rate: 90 });
      }
    }
  });

  const assignedWorkers = Array.from(assignedWorkerMap.values());
  if (assignedWorkers.length === 0) {
    return { workers: [], totalLaborCost: 0 };
  }

  // 2. Count jobs for each worker on this date
  const workers: WorkerLaborItem[] = assignedWorkers.map((w) => {
    const workerJobsOnDate = allJobs.filter((otherJob) => {
      const otherDate = (otherJob.date || '').split('T')[0];
      const isDateMatch =
        otherDate === targetDate ||
        (Array.isArray(otherJob.plannedDates) && otherJob.plannedDates.includes(targetDate));
      if (!isDateMatch) return false;

      const hasId =
        (Array.isArray(otherJob.assignedWorkerIds) && otherJob.assignedWorkerIds.includes(w.id)) ||
        otherJob.assignedWorkerId === w.id;
      const hasName =
        (Array.isArray(otherJob.assignedWorkerNames) &&
          otherJob.assignedWorkerNames.some((nm) => nm.toLowerCase() === w.name.toLowerCase())) ||
        (otherJob.assignedWorkerName &&
          otherJob.assignedWorkerName.toLowerCase().includes(w.name.toLowerCase()));

      return hasId || hasName;
    });

    const totalJobsToday = Math.max(1, workerJobsOnDate.length);
    // Se un operaio durante la giornata fa due o più interventi: mezza giornata (costo a metà)
    // Se fa un solo intervento: giornata intera (costo intero su quel cantiere)
    const isHalfDay = totalJobsToday >= 2;
    const dayType: 'mezza giornata' | 'giornata intera' = isHalfDay ? 'mezza giornata' : 'giornata intera';
    const cost = isHalfDay ? Math.round((w.rate / 2) * 100) / 100 : w.rate;

    return {
      workerId: w.id,
      workerName: w.name,
      dayType,
      rate: w.rate,
      cost,
      totalJobsToday,
    };
  });

  const totalLaborCost = workers.reduce((sum, w) => sum + w.cost, 0);

  return {
    workers,
    totalLaborCost,
  };
};

export const getCostCategoryInfo = (category: JobCostCategory | string) => {
  const rawCat = (category || 'altro').trim();
  const lowerCat = rawCat.toLowerCase();
  const canonicalKey = getCanonicalCategoryKey(rawCat);
  const renamedMap = getRenamedCategoriesMap();

  const customLabel = renamedMap[canonicalKey] || renamedMap[lowerCat] || renamedMap[rawCat];

  let defaultLabel = 'Altro Costo';
  let badgeClass = 'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 border-pink-200 dark:border-pink-800';

  switch (canonicalKey) {
    case 'carburante':
      defaultLabel = 'Benzina / Carburante';
      badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      break;
    case 'sacchi':
      defaultLabel = 'Sacchi Verde';
      badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      break;
    case 'smaltimento':
      defaultLabel = 'Smaltimento Verde';
      badgeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      break;
    case 'materiale':
      defaultLabel = 'Materiali & Concimi';
      badgeClass = 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      break;
    case 'attrezzatura':
      defaultLabel = 'Nuova Attrezzatura';
      badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      break;
    case 'noleggio':
      defaultLabel = 'Noleggio Mezzi';
      badgeClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      break;
    case 'manutenzione':
      defaultLabel = 'Manutenzione Macchinari';
      badgeClass = 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      break;
    case 'manodopera':
      defaultLabel = 'Manodopera';
      badgeClass = 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      break;
    case 'generale':
      defaultLabel = 'Spese Generali';
      badgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
      break;
    default:
      defaultLabel = rawCat ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1) : 'Altro Costo';
      badgeClass = 'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 border-pink-200 dark:border-pink-800';
      break;
  }

  return {
    label: customLabel || defaultLabel,
    badgeClass,
  };
};

export const ClientsView: React.FC = () => {
  const {
    clients,
    jobs,
    users,
    workedDays,
    addClient,
    updateClient,
    deleteClient,
    addJob,
    updateJob,
    addJobCost,
    deleteJobCost,
    inventory,
    currentUser,
  } = useApp();

  // Navigation state: null = Contact List Directory; string = Client Detail
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [gardenToDelete, setGardenToDelete] = useState<{ id: string; name: string } | null>(null);
  const [maintenanceForJobItem, setMaintenanceForJobItem] = useState<{ job: Job; itemId?: string; itemName?: string } | null>(null);

  // Modal State: Add Cantiere/Giardino to selected client
  const [isAddingGarden, setIsAddingGarden] = useState(false);
  const [newGardenName, setNewGardenName] = useState('');
  const [newGardenAddress, setNewGardenAddress] = useState('');
  const [newGardenMq, setNewGardenMq] = useState<number>(300);
  const [newGardenGateCode, setNewGardenGateCode] = useState('');
  const [newGardenIrrigation, setNewGardenIrrigation] = useState('');
  const [newGardenDog, setNewGardenDog] = useState(false);
  const [newGardenNotes, setNewGardenNotes] = useState('');

  // Modal State: Cost management for a specific Job
  const [costJob, setCostJob] = useState<Job | null>(null);

  // Modal State: Create job for selected client
  const [creatingJobForClient, setCreatingJobForClient] = useState<Client | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Accordion state: both closed by default
  const [showGardensSection, setShowGardensSection] = useState(false);
  const [showJobsSection, setShowJobsSection] = useState(false);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({});

  const toggleJobExpanded = (jobId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedJobIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  // Selected client object
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Filtered contacts list
  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.address.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  // Interventions for active client
  const clientJobs = useMemo(() => {
    if (!activeClient) return [];
    return jobs
      .filter((j) => j.clientId === activeClient.id || j.clientName === activeClient.name)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [jobs, activeClient]);

  // Financial summary for active client (Spese + Manodopera + Naturando)
  const clientFinancials = useMemo(() => {
    let revenue = 0;
    let totalExpenses = 0;
    let totalLabor = 0;
    let totalNaturando = 0;

    clientJobs.forEach((j) => {
      revenue += j.price || 0;
      if (j.costs && j.costs.length > 0) {
        totalExpenses += j.costs.reduce((sum, c) => sum + (c.amount || 0), 0);
      }
      const labor = getJobLaborSummary(j, jobs, users);
      totalLabor += labor.totalLaborCost;

      if (j.isNaturando) {
        const base = j.naturandoAmount !== undefined && j.naturandoAmount > 0 ? j.naturandoAmount : (j.price || 0);
        const pct = j.naturandoPercentage !== undefined && j.naturandoPercentage > 0 ? j.naturandoPercentage : 20;
        totalNaturando += Math.round(((base * pct) / 100) * 100) / 100;
      }
    });

    const totalCosts = totalExpenses + totalLabor + totalNaturando;
    const netProfit = revenue - totalCosts;

    return {
      revenue,
      totalExpenses,
      totalLabor,
      totalNaturando,
      totalCosts,
      netProfit,
    };
  }, [clientJobs, jobs, users]);

  // Handlers for Client
  const handleSaveClientModal = (clientData: any) => {
    if (editingClient) {
      updateClient({ ...editingClient, ...clientData });
      setEditingClient(null);
    } else {
      addClient(clientData);
      setIsCreatingClient(false);
    }
  };

  // Handler: Add additional Garden/Cantiere to client
  const handleSaveAdditionalGarden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || !newGardenName.trim()) return;

    const newSite: CantiereSite = {
      id: `cantiere_${Date.now()}`,
      name: newGardenName.trim(),
      address: newGardenAddress.trim() || activeClient.address,
      lat: activeClient.lat || 45.65,
      lng: activeClient.lng || 9.32,
      createdAt: new Date().toISOString(),
      gardenNotes: {
        squareMeters: Number(newGardenMq) || 100,
        gateCode: newGardenGateCode.trim(),
        irrigationDetails: newGardenIrrigation.trim(),
        delicatePlants: '',
        dogPresent: newGardenDog,
        notes: newGardenNotes.trim(),
      },
    };

    const updatedCantieri = [...(activeClient.cantieri || []), newSite];
    await updateClient({ ...activeClient, cantieri: updatedCantieri });

    setIsAddingGarden(false);
    setNewGardenName('');
    setNewGardenAddress('');
    setNewGardenMq(300);
    setNewGardenGateCode('');
    setNewGardenIrrigation('');
    setNewGardenDog(false);
    setNewGardenNotes('');
  };

  // Handler: Remove additional garden
  const handleDeleteAdditionalGarden = (site: { id: string; name: string }) => {
    setGardenToDelete(site);
  };

  // State for collapsible Clienti Passati section
  const [showPassedClients, setShowPassedClients] = useState(false);

  // Helper to format address into 2 lines: Street on Line 1, City and rest on Line 2
  const formatAddressTwoLines = (rawAddress: string) => {
    if (!rawAddress) return { line1: '', line2: null };
    const parts = rawAddress.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 1) {
      return { line1: rawAddress, line2: null };
    }
    const line1 = parts[0];
    const line2 = parts.slice(1).join(', ');
    return { line1, line2 };
  };

  // Separate active and passed (inactive) clients
  const activeClients = useMemo(() => {
    return filteredClients.filter((c) => c.active !== false);
  }, [filteredClients]);

  const passedClients = useMemo(() => {
    return filteredClients.filter((c) => c.active === false);
  }, [filteredClients]);

  const renderClientCard = (client: Client) => {
    const gardensCount = 1 + (client.cantieri?.length || 0);
    const relatedJobs = jobs.filter(
      (j) => j.clientId === client.id || j.clientName === client.name
    );
    const completedCount = relatedJobs.filter((j) => j.status === 'completed').length;
    const clientColor = getClientColor(client);
    const { line1, line2 } = formatAddressTwoLines(client.address);

    return (
      <div
        key={client.id}
        onClick={() => setSelectedClientId(client.id)}
        style={{ borderLeftColor: clientColor, borderLeftWidth: '3.5px' }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-2 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-600 cursor-pointer transition-all space-y-[3px] group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              {client.name}
            </h3>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1 pt-0.5 leading-snug">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="whitespace-normal break-words font-medium">{line1}</span>
                {line2 && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-normal break-words">
                    {line2}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {currentUser?.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingClient(client);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  title="Modifica Anagrafica"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setClientToDelete(client);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                  title="Elimina Cliente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Badges strip: ONLY numbers next to icons, right aligned next to phone number */}
        <div className="flex items-center justify-end text-xs pt-[3px] border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 ml-auto">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10.5px] border border-emerald-200 dark:border-emerald-800"
              title={`${gardensCount} giardini`}
            >
              <Sprout className="w-3 h-3 text-emerald-600" />
              <span>{gardensCount}</span>
            </span>

            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10.5px]"
              title={`${relatedJobs.length} lavori (${completedCount} ultimati)`}
            >
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>{relatedJobs.length}</span>
            </span>

            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 ml-1 font-bold"
              >
                <Phone className="w-3 h-3" />
                <span>{client.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW 1: CONTACTS DIRECTORY LIST (RUBRICA)
  // ==========================================
  if (!selectedClientId || !activeClient) {
    return (
      <div className="space-y-[3px]">
        {/* Search Bar + "+ cliente" button on the right */}
        <div className="flex items-center gap-[3px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca cliente per nome, telefono o indirizzo..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[5px] shadow-xs focus:outline-emerald-600 text-slate-900 dark:text-slate-100"
            />
          </div>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setIsCreatingClient(true)}
              className="flex items-center justify-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-[5px] shadow-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap"
            >
              <span>+ cliente</span>
            </button>
          )}
        </div>

        {/* Contacts Directory List */}
        {activeClients.length === 0 && passedClients.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-8 text-center text-slate-500 text-xs space-y-[3px]">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Nessun cliente trovato</p>
            <p className="text-slate-500">Aggiungi un cliente per iniziare a gestire i suoi giardini e gli interventi.</p>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setIsCreatingClient(true)}
                className="inline-flex items-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[5px] font-bold shadow-xs text-xs"
              >
                <span>+ cliente</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Active Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[3px]">
              {activeClients.map((client) => renderClientCard(client))}
            </div>

            {/* Collapsible Section: Clienti Passati (closed by default) */}
            {passedClients.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPassedClients(!showPassedClients)}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-[7px] border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Clienti Passati ({passedClients.length})</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showPassedClients ? 'rotate-90' : ''}`} />
                </button>

                {showPassedClients && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[3px] pt-[3px] opacity-75">
                    {passedClients.map((client) => renderClientCard(client))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal: Nuovo/Modifica Cliente */}
        {(isCreatingClient || editingClient) && (
          <ClientModal
            client={editingClient}
            onClose={() => {
              setIsCreatingClient(false);
              setEditingClient(null);
            }}
            onSave={handleSaveClientModal}
          />
        )}

        {/* Modal: Conferma Eliminazione Cliente */}
        {clientToDelete && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-sm w-full p-4 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <Trash2 className="w-5 h-5 shrink-0" />
                <span>Conferma Eliminazione</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Sei sicuro di voler eliminare definitivamente il cliente <strong className="text-slate-900 dark:text-slate-100">{clientToDelete.name}</strong>?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setClientToDelete(null)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-[7px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const targetId = clientToDelete.id;
                    setClientToDelete(null);
                    if (selectedClientId === targetId) {
                      setSelectedClientId(null);
                    }
                    await deleteClient(targetId);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-[7px] bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Elimina Definitivamente</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CLIENT DETAIL PAGE (GIARDINI + STORICO INTERVENTI + MONITOR COSTI)
  // =========================================================================
  const allGardens = [
    {
      id: 'primary',
      name: 'Giardino Principale',
      address: activeClient.address,
      notes: activeClient.gardenNotes,
      isPrimary: true,
    },
    ...(activeClient.cantieri || []).map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      notes: s.gardenNotes,
      isPrimary: false,
    })),
  ];

  return (
    <div className="space-y-[3px]">
      
      {/* Back Button and Client Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-2 sm:p-2.5 shadow-xs space-y-[3px]">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSelectedClientId(null)}
            className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0 bg-transparent border-0 shadow-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Rubrica</span>
          </button>

          <div className="flex items-center gap-1.5 min-w-0 text-right">
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 justify-end truncate">
              <span>{activeClient.name}</span>
              <span className="text-[10px] text-slate-500 font-normal shrink-0">
                ({allGardens.length} {allGardens.length === 1 ? 'giardino' : 'giardini'})
              </span>
            </h1>
          </div>
        </div>

        {/* Contact Info Strip & 3 Action Icons Aligned to the Right */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-col gap-1 text-slate-600 dark:text-slate-300 min-w-0">
            {activeClient.address && (() => {
              const commaIdx = activeClient.address.indexOf(',');
              if (commaIdx !== -1) {
                const street = activeClient.address.substring(0, commaIdx).trim();
                const city = activeClient.address.substring(commaIdx + 1).trim();
                return (
                  <div className="flex items-start gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="leading-tight min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{street}</div>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">{city}</div>
                    </div>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{activeClient.address}</span>
                </div>
              );
            })()}

            <div className="flex items-center gap-3 text-xs">
              {activeClient.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`tel:${activeClient.phone}`} className="font-mono text-emerald-700 dark:text-emerald-400 hover:underline font-bold">
                    {activeClient.phone}
                  </a>
                </div>
              )}
              {activeClient.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{activeClient.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3 Action Buttons as Icons with transparent background and border like delete button */}
          <div className="flex items-center gap-1.5 shrink-0 self-center">
            <button
              type="button"
              onClick={() => {
                setCreatingJobForClient(activeClient);
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-[5px] border border-emerald-600/70 dark:border-emerald-500/60 bg-transparent text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer shrink-0"
              title="Nuovo Intervento"
              aria-label="Nuovo Intervento"
            >
              <Plus className="w-4 h-4" />
            </button>

            {currentUser?.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => setEditingClient(activeClient)}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-[5px] border border-slate-400/60 dark:border-slate-600/60 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-500/10 transition-colors cursor-pointer shrink-0"
                  title="Modifica Cliente"
                  aria-label="Modifica Cliente"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setClientToDelete(activeClient)}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-[5px] border border-rose-500/60 dark:border-rose-800/60 bg-transparent text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  title="Elimina Cliente"
                  aria-label="Elimina Cliente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Financial Overview for this client - no .00 and renamed to Lavoro and Costi */}
      <div className="grid grid-cols-3 gap-[3px]">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-2 shadow-xs space-y-[3px]">
          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
            Lavoro
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            € {formatAmountNoCents(clientFinancials.revenue)}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {clientJobs.length} interventi totali
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-2 shadow-xs space-y-[3px]">
          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
            Costi
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            -€ {formatAmountNoCents(clientFinancials.totalCosts)}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            Spese €{Math.round(clientFinancials.totalExpenses)} · Manodopera €{Math.round(clientFinancials.totalLabor)}{clientFinancials.totalNaturando > 0 ? ` · Naturando €${Math.round(clientFinancials.totalNaturando)}` : ''}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-2 shadow-xs space-y-[3px]">
          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
            Margine
          </div>
          <div className={`text-xl font-bold font-mono ${clientFinancials.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
            € {formatAmountNoCents(clientFinancials.netProfit)}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {clientFinancials.revenue > 0 ? Math.round((clientFinancials.netProfit / clientFinancials.revenue) * 100) : 0}% sul fatturato
          </div>
        </div>
      </div>

      {/* SECTION 1: GIARDINI (accordion, closed by default) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-2 shadow-xs space-y-[3px]">
        <div
          onClick={() => setShowGardensSection(!showGardensSection)}
          className="flex items-center justify-between cursor-pointer select-none py-0.5"
        >
          <div className="flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Giardini
            </h2>
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${showGardensSection ? 'rotate-90' : ''}`}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingGarden(true);
            }}
            className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-[5px] font-bold text-xs transition-colors cursor-pointer"
          >
            + Aggiungi Giardino
          </button>
        </div>

        {showGardensSection && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[3px] pt-1">
            {allGardens.map((garden) => (
              <div
                key={garden.id}
                className="p-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {garden.name}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {garden.isPrimary && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[9px] rounded uppercase">
                        Principale
                      </span>
                    )}

                    {!garden.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAdditionalGarden({ id: garden.id, name: garden.name })}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer shrink-0"
                        title="Elimina questo giardino"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{garden.address}</span>
                </div>

                {/* Informazioni a mo di testo continuo senza card interna, note rimosse */}
                <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-0.5">
                  <div>
                    <span className="text-slate-400 text-[10px]">Superficie: </span>
                    <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                      {garden.notes?.squareMeters || 300} mq
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Codice Cancello: </span>
                    <strong className="font-mono text-slate-700 dark:text-slate-300">
                      {garden.notes?.gateCode || 'Nessuno'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Irrigazione: </span>
                    <span>{cleanHtmlText(garden.notes?.irrigationDetails) || 'Manuale'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-[10px]">Cane: </span>
                    {garden.notes?.dogPresent ? (
                      <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <span>Sì</span>
                        <Dog className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </span>
                    ) : (
                      <span>No</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: STORICO INTERVENTI & MONITORAGGIO COSTI (accordion, closed by default) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-2 shadow-xs space-y-[3px]">
        <div
          onClick={() => setShowJobsSection(!showJobsSection)}
          className="flex items-center justify-between cursor-pointer select-none py-0.5"
        >
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Storico Interventi
            </h2>
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${showJobsSection ? 'rotate-90' : ''}`}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCreatingJobForClient(activeClient);
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[5px] flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
            title="Nuovo Intervento"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showJobsSection && (
          <>
            {clientJobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nessun intervento ancora registrato per i giardini di {activeClient.name}. Clicca su "+" per pianificare il primo intervento.
              </div>
            ) : (
              <div className="space-y-[3px] pt-1">
                {clientJobs.map((job) => {
                  const isCompleted = job.status === 'completed';
                  const price = job.price || 0;
                  const costs = job.costs || [];
                  const expensesCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0);
                  const laborSummary = getJobLaborSummary(job, jobs, users);

                  // Quota spettante a Naturando se l'intervento è marcato per Naturando
                  const isJobNaturando = !!job.isNaturando;
                  const naturandoBase = job.naturandoAmount !== undefined && job.naturandoAmount > 0
                    ? job.naturandoAmount
                    : price;
                  const naturandoPct = job.naturandoPercentage !== undefined && job.naturandoPercentage > 0
                    ? job.naturandoPercentage
                    : 20;
                  const naturandoCost = isJobNaturando ? Math.round(((naturandoBase * naturandoPct) / 100) * 100) / 100 : 0;

                  const totalAllCost = expensesCost + laborSummary.totalLaborCost + naturandoCost;
                  const margin = price - totalAllCost;
                  const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;
                  const totalCostCount = costs.length + laborSummary.workers.length + (isJobNaturando ? 1 : 0);

                  const isExpanded = !!expandedJobIds[job.id];
                  const dayMonth = formatDayAndMonth(job.date);

                  return (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] text-xs hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-colors shadow-2xs overflow-hidden"
                    >
                      {/* Job Header: Always visible, clickable to toggle open/closed */}
                      <div
                        onClick={() => toggleJobExpanded(job.id)}
                        className={`p-2 flex items-center justify-between gap-2 cursor-pointer select-none transition-colors ${
                          isExpanded ? 'bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Sinistra: Data in grande (Giorno grande + Mese 3 lettere) + Titolo */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-baseline gap-0.5 shrink-0 font-mono">
                            <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none">
                              {dayMonth.day}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 ml-0.5">
                              {dayMonth.month}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                              {job.title}
                            </span>
                            {isJobNaturando && (
                              <img
                                src="https://www.iofall.it/Public%20Image/Ramovianatur_logo.svg"
                                alt="Naturando"
                                className="w-3.5 h-3.5 object-contain shrink-0 dark:brightness-0 dark:invert"
                                title="Intervento Naturando"
                              />
                            )}
                          </div>
                        </div>

                        {/* Destra: Icona Stato + Icona Pagamento + Prezzo + Freccia toggle */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Icona Stato Intervento (Ultimato / In Corso / Programmato) */}
                          <div title={isCompleted ? 'Ultimato' : job.status === 'in_progress' ? 'In Corso' : 'Programmato'}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : job.status === 'in_progress' ? (
                              <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            ) : (
                              <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>

                          {/* Icona Pagamento Ricevuto o Ancora da Ricevere */}
                          {(() => {
                            const isPaid =
                              job.paymentStatus === 'paid' ||
                              ((job.paidAmount || 0) >= price && price > 0);
                            const isPartial = job.paymentStatus === 'partial';

                            if (isPaid) {
                              return (
                                <div title="Pagamento Ricevuto">
                                  <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                </div>
                              );
                            }
                            if (isPartial) {
                              return (
                                <div title="Acconto Ricevuto">
                                  <Wallet className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                </div>
                              );
                            }
                            return (
                              <div title="Pagamento Ancora da Ricevere">
                                <Wallet className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              </div>
                            );
                          })()}

                          <span className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-200 shrink-0">
                            € {formatAmountNoCents(price)}
                          </span>

                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                              isExpanded ? 'rotate-180 text-emerald-600' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Card Content when OPEN (expanded) */}
                      {isExpanded && (
                        <div className="p-2 space-y-2 animate-in fade-in duration-150">
                          {/* Orario visibile quando aperto & tasti azione rapidi */}
                          <div className="flex items-center justify-between gap-2 p-1.5 px-2 bg-slate-50 dark:bg-slate-800/40 rounded-[5px] border border-slate-100 dark:border-slate-800 text-[11px]">
                            <div className="flex items-center gap-1.5 font-mono text-slate-600 dark:text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-semibold">{job.timeSlot || 'Orario non specificato'}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCostJob(job);
                                }}
                                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-[5px] font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Gestisci spese e manodopera"
                              >
                                <Fuel className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>Gestisci Costi</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingJob(job);
                                }}
                                className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[5px] font-bold text-[10px] transition-colors cursor-pointer shadow-2xs"
                              >
                                Visualizza
                              </button>
                            </div>
                          </div>

                          {/* Note / Lavorazione Formattate (Senza tag HTML visibili) */}
                          {(job.description || job.notes) && (
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/30 rounded-[5px] border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Lavorazione & Note Cantiere:
                              </span>
                              {job.description && (
                                <div className="text-slate-700 dark:text-slate-200">
                                  <FormattedNote content={job.description} />
                                </div>
                              )}
                              {job.notes && job.notes !== job.description && (
                                <div className="text-slate-600 dark:text-slate-300 pt-0.5 border-t border-slate-200/50 dark:border-slate-700/50">
                                  <FormattedNote content={job.notes} />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Macchinari Usati nel Cantiere & Aggiungi Manutenzione */}
                          {job.equipmentRequired && job.equipmentRequired.length > 0 && (
                            <div className="p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-[5px] border border-slate-100 dark:border-slate-800 space-y-[3px]">
                              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>Macchinari Usati ({job.equipmentRequired.length})</span>
                                </div>
                              </div>

                              <div className="space-y-[3px] pt-0.5">
                                {job.equipmentRequired.map((eq) => (
                                  <div
                                    key={eq.itemId}
                                    className="p-1 px-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                        {eq.name}
                                      </span>
                                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                        ({eq.hoursUsed}h)
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Financial KPI Strip: Prezzo | Costi | Margine - su un rigo solo */}
                          <div className="grid grid-cols-3 gap-[3px] text-center text-[11px] sm:text-xs">
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-1 px-1.5 rounded-[5px] border border-slate-200/70 dark:border-slate-800 flex items-center justify-center font-mono font-bold text-slate-900 dark:text-slate-100 truncate">
                              <span>tot € {formatAmountNoCents(price)}</span>
                            </div>

                            <div className="bg-rose-50/40 dark:bg-rose-950/20 p-1 px-1.5 rounded-[5px] border border-rose-100 dark:border-rose-950/60 flex items-center justify-center font-mono font-bold text-rose-600 dark:text-rose-400 truncate">
                              <span>costi -€ {formatAmountNoCents(totalAllCost)}</span>
                            </div>

                            <div
                              className={`p-1 px-1.5 rounded-[5px] border flex items-center justify-center gap-1 truncate ${
                                margin >= 0
                                  ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400'
                                  : 'bg-rose-950/40 border-rose-900/60 text-rose-400'
                              }`}
                            >
                              <span className="text-[10px] font-sans font-bold opacity-90">
                                utile {marginPct}%
                              </span>
                              <span className="text-white text-xs sm:text-sm font-extrabold font-mono ml-0.5">
                                € {formatAmountNoCents(margin)}
                              </span>
                            </div>
                          </div>

                          {/* Manodopera Cantiere Breakdown */}
                          <div className="px-1 py-1 space-y-[3px]">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Manodopera Cantiere</span>
                              </div>
                              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                -€ {formatAmountNoCents(laborSummary.totalLaborCost)}
                              </span>
                            </div>

                            {laborSummary.workers.length > 0 ? (
                              <div className="space-y-[3px] pt-0.5">
                                {laborSummary.workers.map((w) => (
                                  <div
                                    key={w.workerId || w.workerName}
                                    className="flex items-center justify-between gap-2 text-xs py-0.5"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                        {w.workerName}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border shrink-0 ${
                                          w.dayType === 'mezza giornata'
                                            ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                            : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        }`}
                                      >
                                        {w.dayType === 'mezza giornata' ? 'Mezza giornata' : 'Giornata intera'}
                                      </span>
                                    </div>
                                    <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0 text-right">
                                      -€ {formatAmountNoCents(w.cost)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 italic">
                                Nessun operaio assegnato a questo intervento.
                              </div>
                            )}
                          </div>

                          {/* Voci di Spesa Breakdown */}
                          <div className="px-1 py-1 space-y-[3px]">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              <span>Voci di Spesa Registrate</span>
                              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                -€ {formatAmountNoCents(expensesCost)}
                              </span>
                            </div>

                            {costs.length > 0 ? (
                              <div className="space-y-[3px] pt-0.5">
                                {costs.map((c) => {
                                  const catInfo = getCostCategoryInfo(c.category);
                                  return (
                                    <div
                                      key={c.id}
                                      className="flex items-center justify-between gap-2 text-xs py-0.5"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                                          {c.name}
                                        </span>
                                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border shrink-0 ${catInfo.badgeClass}`}>
                                          {catInfo.label}
                                        </span>
                                      </div>
                                      <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0 text-right">
                                        -€ {formatAmountNoCents(c.amount)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 italic pt-0.5">
                                Nessuna spesa extra registrata.
                              </div>
                            )}
                          </div>

                          {/* Quota Dovuta a Naturando */}
                          {isJobNaturando && (
                            <div className="px-1 py-1">
                              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={NATURANDO_LOGO_URL}
                                    alt="Naturando"
                                    className="h-3 max-w-[50px] object-contain rounded"
                                  />
                                  <span>Quota Dovuta a Naturando</span>
                                </div>
                                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                  -€ {formatAmountNoCents(naturandoCost)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: AGGIUNGI GIARDINO AL CLIENTE */}
      {isAddingGarden && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-[7px] space-y-[7px] shadow-2xl">
            <div className="bg-emerald-950 text-white p-[7px] px-3 rounded-[7px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-300" />
                <h3 className="font-bold text-xs">Aggiungi Altro Giardino per {activeClient.name}</h3>
              </div>
              <button onClick={() => setIsAddingGarden(false)} className="text-emerald-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdditionalGarden} className="p-[7px] space-y-[7px] text-xs">
              <div className="space-y-[7px]">
                <label className="font-semibold block">Nome Giardino / Cantiere *</label>
                <input
                  type="text"
                  required
                  value={newGardenName}
                  onChange={(e) => setNewGardenName(e.target.value)}
                  placeholder="es. Villa Monzese, Giardino Secondario, Casa Vacanze"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Indirizzo Giardino</label>
                <input
                  type="text"
                  value={newGardenAddress}
                  onChange={(e) => setNewGardenAddress(e.target.value)}
                  placeholder="Lascia vuoto se coincide con l'indirizzo principale"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-[7px]">
                  <label className="font-semibold block">Superficie (mq)</label>
                  <input
                    type="number"
                    step="10"
                    value={newGardenMq}
                    onChange={(e) => setNewGardenMq(parseFloat(e.target.value) || 0)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono"
                  />
                </div>

                <div className="space-y-[7px]">
                  <label className="font-semibold block">Codice Cancello</label>
                  <input
                    type="text"
                    value={newGardenGateCode}
                    onChange={(e) => setNewGardenGateCode(e.target.value)}
                    placeholder="es. #1234"
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                  />
                </div>
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Impianto Irrigazione</label>
                <input
                  type="text"
                  value={newGardenIrrigation}
                  onChange={(e) => setNewGardenIrrigation(e.target.value)}
                  placeholder="es. Automatico RainBird 4 zone"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="dogCheck"
                  checked={newGardenDog}
                  onChange={(e) => setNewGardenDog(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="dogCheck" className="text-xs font-semibold cursor-pointer">
                  Cane presente nella proprietà 🐕
                </label>
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Note Tecniche</label>
                <input
                  type="text"
                  value={newGardenNotes}
                  onChange={(e) => setNewGardenNotes(e.target.value)}
                  placeholder="es. Piante delicate, accesso difficile, pendenza"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-[7px]">
                <button
                  type="button"
                  onClick={() => setIsAddingGarden(false)}
                  className="p-[7px] px-3 bg-slate-100 dark:bg-slate-800 rounded-[7px]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="p-[7px] px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px]"
                >
                  Salva Giardino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GESTIONE & INSERIMENTO COSTI INTERVENTO (SPESE + MANODOPERA + NATURANDO) */}
      {costJob && (
        <JobCostManagerModal
          job={costJob}
          onClose={() => setCostJob(null)}
        />
      )}

      {/* Modal: Job Creation for this Client */}
      {creatingJobForClient && (
        <JobModal
          job={null}
          onClose={() => setCreatingJobForClient(null)}
          onSave={(jobData) => {
            addJob({
              ...jobData,
              clientId: creatingJobForClient.id,
              clientName: creatingJobForClient.name,
              clientAddress: creatingJobForClient.address,
            });
            setCreatingJobForClient(null);
          }}
        />
      )}

      {/* Modal: Job Detail View Modal (with financial costs) */}
      {viewingJob && (
        <JobDetailViewModal
          job={viewingJob}
          onClose={() => setViewingJob(null)}
          onEdit={() => {
            const j = viewingJob;
            setViewingJob(null);
            setEditingJob(j);
          }}
        />
      )}

      {/* Modal: Modifica Intervento */}
      {editingJob && (
        <JobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSave={(jobData) => {
            updateJob({ ...editingJob, ...jobData });
            setEditingJob(null);
          }}
        />
      )}

      {/* Modal: Modifica Anagrafica Cliente */}
      {editingClient && (
        <ClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleSaveClientModal}
        />
      )}

      {/* Modal: Conferma Eliminazione Cliente (in View 2) */}
      {clientToDelete && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <Trash2 className="w-5 h-5 shrink-0" />
              <span>Conferma Eliminazione</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Sei sicuro di voler eliminare definitivamente il cliente <strong className="text-slate-900 dark:text-slate-100">{clientToDelete.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-[7px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = clientToDelete.id;
                  setClientToDelete(null);
                  setSelectedClientId(null);
                  await deleteClient(targetId);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-[7px] bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Elimina Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Conferma Eliminazione Giardino (in View 2) */}
      {gardenToDelete && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <Trash2 className="w-5 h-5 shrink-0" />
              <span>Elimina Giardino</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Sei sicuro di voler eliminare il giardino secondario <strong className="text-slate-900 dark:text-slate-100">{gardenToDelete.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setGardenToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-[7px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!activeClient) return;
                  const updatedCantieri = (activeClient.cantieri || []).filter((s) => s.id !== gardenToDelete.id);
                  await updateClient({ ...activeClient, cantieri: updatedCantieri });
                  setGardenToDelete(null);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-[7px] bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                Elimina Giardino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Maintenance Modal for Job */}
      {maintenanceForJobItem && (
        <ManualMaintenanceModal
          equipmentItem={
            maintenanceForJobItem.itemId
              ? inventory.find((i) => i.id === maintenanceForJobItem.itemId) || null
              : null
          }
          preselectedJobId={maintenanceForJobItem.job.id}
          onClose={() => setMaintenanceForJobItem(null)}
        />
      )}
    </div>
  );
};
