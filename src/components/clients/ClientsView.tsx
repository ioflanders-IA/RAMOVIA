import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, Job, CantiereSite, GardenNotes, JobCostItem, JobCostCategory } from '../../types';
import { ClientModal } from './ClientModal';
import { JobModal } from '../jobs/JobModal';
import { FormattedNote } from '../common/FormattedNote';
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
  PlusCircle,
  Building2,
  Receipt,
  RotateCcw,
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const {
    clients,
    jobs,
    addClient,
    updateClient,
    deleteClient,
    addJob,
    updateJob,
    addJobCost,
    deleteJobCost,
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
  const [costCategory, setCostCategory] = useState<JobCostCategory>('benzina');
  const [costName, setCostName] = useState('');
  const [costAmount, setCostAmount] = useState<number>(20);
  const [costNotes, setCostNotes] = useState('');

  // Modal State: Create job for selected client
  const [creatingJobForClient, setCreatingJobForClient] = useState<Client | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

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

  // Financial summary for active client
  const clientFinancials = useMemo(() => {
    let revenue = 0;
    let totalCosts = 0;

    clientJobs.forEach((j) => {
      revenue += j.price || 0;
      if (j.costs && j.costs.length > 0) {
        totalCosts += j.costs.reduce((sum, c) => sum + (c.amount || 0), 0);
      }
    });

    const netProfit = revenue - totalCosts;

    return {
      revenue,
      totalCosts,
      netProfit,
    };
  }, [clientJobs]);

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

  // Handler: Add cost to Job
  const handleAddJobCostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!costJob || costAmount <= 0 || !costName.trim()) return;

    await addJobCost(costJob.id, {
      category: costCategory,
      name: costName.trim(),
      amount: Number(costAmount),
      notes: costNotes.trim() || undefined,
    });

    // Refresh current costJob reference from updated jobs
    setCostName('');
    setCostAmount(20);
    setCostNotes('');
  };

  // Keep costJob updated when jobs change
  const currentCostJob = useMemo(() => {
    if (!costJob) return null;
    return jobs.find((j) => j.id === costJob.id) || costJob;
  }, [jobs, costJob]);

  // Category labels for costs
  const getCostCategoryLabel = (cat: JobCostCategory) => {
    switch (cat) {
      case 'benzina':
        return 'Benzina / Carburante';
      case 'sacchi':
        return 'Sacchi Smaltimento';
      case 'materiale':
        return 'Materiali & Concimi';
      case 'manodopera':
        return 'Manodopera Esterna';
      case 'smaltimento':
        return 'Discarica Verde';
      case 'noleggio':
        return 'Noleggio Mezzi';
      default:
        return 'Altro Costo';
    }
  };

  // ==========================================
  // VIEW 1: CONTACTS DIRECTORY LIST (RUBRICA)
  // ==========================================
  if (!selectedClientId || !activeClient) {
    return (
      <div className="space-y-[7px]">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px]">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-[7px]">
              <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <span>Rubrica Clienti & Schede Giardino</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Elenco contatti clienti, gestione giardini multipli e storico costi interventi.
            </p>
          </div>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setIsCreatingClient(true)}
              className="flex items-center gap-1.5 p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-[7px] shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Cliente</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca cliente per nome, telefono o indirizzo..."
            className="w-full pl-9 pr-4 p-[7px] text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] shadow-xs focus:outline-emerald-600 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Contacts Directory List */}
        {filteredClients.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-8 text-center text-slate-500 text-xs space-y-[7px]">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Nessun cliente trovato</p>
            <p className="text-slate-500">Aggiungi un cliente per iniziare a gestire i suoi giardini e gli interventi.</p>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setIsCreatingClient(true)}
                className="inline-flex items-center gap-1.5 p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold shadow-xs text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Crea Primo Cliente</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[7px]">
            {filteredClients.map((client) => {
              const gardensCount = 1 + (client.cantieri?.length || 0);
              const relatedJobs = jobs.filter(
                (j) => j.clientId === client.id || j.clientName === client.name
              );
              const completedCount = relatedJobs.filter((j) => j.status === 'completed').length;

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs hover:border-emerald-500 dark:hover:border-emerald-600 cursor-pointer transition-all space-y-[7px] group"
                >
                  <div className="flex items-start justify-between gap-[7px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-[7px] bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {client.name}
                        </h3>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {currentUser?.role === 'admin' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClient(client);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Modifica Anagrafica"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setClientToDelete(client);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                            title="Elimina Cliente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Badges strip: Giardini & Interventi */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                        <Sprout className="w-3 h-3 text-emerald-600" />
                        <span>{gardensCount} {gardensCount === 1 ? 'Giardino' : 'Giardini'}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{relatedJobs.length} Lavori ({completedCount} ultimati)</span>
                      </span>
                    </div>

                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{client.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
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
    <div className="space-y-[7px]">
      
      {/* Back Button and Client Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedClientId(null)}
              className="p-1.5 rounded-[7px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Rubrica Clienti</span>
            </button>

            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{activeClient.name}</span>
                <span className="text-[10px] font-semibold text-slate-500 font-normal">
                  ({allGardens.length} {allGardens.length === 1 ? 'giardino' : 'giardini'})
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-[7px]">
            <button
              onClick={() => {
                setCreatingJobForClient(activeClient);
              }}
              className="flex items-center gap-1 p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuovo Intervento</span>
            </button>

            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => setEditingClient(activeClient)}
                  className="p-[7px] px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-[7px] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modifica</span>
                </button>
                <button
                  onClick={() => setClientToDelete(activeClient)}
                  className="p-[7px] px-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-[7px] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Elimina questo cliente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Elimina</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Contact Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[7px] pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{activeClient.address}</span>
          </div>
          {activeClient.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <a href={`tel:${activeClient.phone}`} className="font-mono text-emerald-700 dark:text-emerald-400 hover:underline">
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

      {/* Financial Overview for this client */}
      <div className="grid grid-cols-3 gap-[7px]">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
            Fatturato Lavori
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            € {clientFinancials.revenue.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500">
            {clientJobs.length} interventi totali
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
            Costi Interventi (Benzina/Sacchi)
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            € {clientFinancials.totalCosts.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500">
            Spese a carico dei cantieri
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
            Margine Netto
          </div>
          <div className={`text-xl font-bold font-mono ${clientFinancials.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
            € {clientFinancials.netProfit.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500">
            Guadagno reale sul cliente
          </div>
        </div>
      </div>

      {/* SECTION 1: I GIARDINI DEL CLIENTE (anche più di uno) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              I Giardini di {activeClient.name} ({allGardens.length})
            </h2>
          </div>

          <button
            onClick={() => setIsAddingGarden(true)}
            className="flex items-center gap-1 p-[7px] px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-[7px] font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Aggiungi Altro Giardino</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[7px]">
          {allGardens.map((garden, idx) => (
            <div
              key={garden.id}
              className="p-[7px] rounded-[7px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-[7px] text-xs"
            >
              <div className="flex items-start justify-between gap-[7px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {garden.name}
                    </span>
                    {garden.isPrimary && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[9px] rounded uppercase">
                        Sede Principale
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{garden.address}</span>
                  </div>
                </div>

                {!garden.isPrimary && (
                  <button
                    onClick={() => handleDeleteAdditionalGarden({ id: garden.id, name: garden.name })}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Elimina questo giardino"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Garden specs */}
              <div className="grid grid-cols-2 gap-1.5 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Superficie:</span>
                  <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                    {garden.notes?.squareMeters || 300} mq
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Codice Cancello:</span>
                  <strong className="font-mono text-slate-700 dark:text-slate-300">
                    {garden.notes?.gateCode || 'Nessuno'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Irrigazione:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {garden.notes?.irrigationDetails || 'Manuale'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Cane Presente:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {garden.notes?.dogPresent ? 'Sì 🐕' : 'No'}
                  </span>
                </div>
              </div>

              {garden.notes?.notes && (
                <div className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                  Note: {garden.notes.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: STORICO INTERVENTI & MONITORAGGIO COSTI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Storico Interventi del Giardino ({clientJobs.length})
            </h2>
          </div>

          <button
            onClick={() => setCreatingJobForClient(activeClient)}
            className="flex items-center gap-1 p-[7px] px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuovo Lavoro</span>
          </button>
        </div>

        {clientJobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nessun intervento ancora registrato per i giardini di {activeClient.name}. Clicca su "Nuovo Lavoro" per pianificare il primo intervento.
          </div>
        ) : (
          <div className="space-y-[7px]">
            {clientJobs.map((job) => {
              const isCompleted = job.status === 'completed';
              const price = job.price || 0;
              const costs = job.costs || [];
              const totalCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0);
              const margin = price - totalCost;

              return (
                <div
                  key={job.id}
                  className="p-[7px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] space-y-[7px] text-xs hover:border-slate-300 transition-colors"
                >
                  {/* Job Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {job.title}
                        </span>
                        <span className="font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {job.date} · {job.timeSlot}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase ${
                            isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : job.status === 'in_progress'
                              ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {isCompleted ? 'Ultimato' : job.status === 'in_progress' ? 'In Corso' : 'Programmato'}
                        </span>
                      </div>

                      {job.description && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          {job.description}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500">
                        Operaio: <strong>{job.assignedWorkerName}</strong>
                      </div>
                    </div>

                    {/* Financial summary badge of this job */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500">
                          Prezzo: <strong className="font-mono text-slate-900 dark:text-slate-100">€ {price.toFixed(2)}</strong>
                        </div>
                        <div className="text-[10px] text-rose-600 dark:text-rose-400">
                          Costi: <strong className="font-mono">€ {totalCost.toFixed(2)}</strong>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          Margine: € {margin.toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={() => setCostJob(job)}
                        className="p-[7px] px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 border border-slate-300 dark:border-slate-700 rounded-[7px] font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        title="Inserisci e monitora i costi sostenuti per questo intervento (benzina, sacchi, ecc.)"
                      >
                        <Fuel className="w-3.5 h-3.5 text-amber-600" />
                        <span>Gestisci Costi ({costs.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick preview of costs if any */}
                  {costs.length > 0 && (
                    <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Costi sostenuti:</span>
                      {costs.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                        >
                          <span>{c.name}:</span>
                          <strong className="text-rose-600 dark:text-rose-400">€ {c.amount.toFixed(2)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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

      {/* MODAL: GESTIONE & INSERIMENTO COSTI INTERVENTO (BENZINA, SACCHI, ETC) */}
      {currentCostJob && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-lg w-full p-[7px] space-y-[7px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white p-[7px] px-3 rounded-[7px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs">
                  Costi Sostenuti: {currentCostJob.title}
                </h3>
              </div>
              <button onClick={() => setCostJob(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial monitor for this specific intervention */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-[7px] text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Prezzo Intervento:</span>
                <strong className="font-mono text-sm text-slate-900 dark:text-slate-100">
                  € {(currentCostJob.price || 0).toFixed(2)}
                </strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Totale Costi:</span>
                <strong className="font-mono text-sm text-rose-600 dark:text-rose-400">
                  - € {(currentCostJob.costs?.reduce((s, c) => s + (c.amount || 0), 0) || 0).toFixed(2)}
                </strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Margine Netto:</span>
                <strong className="font-mono text-sm text-emerald-700 dark:text-emerald-400">
                  € {((currentCostJob.price || 0) - (currentCostJob.costs?.reduce((s, c) => s + (c.amount || 0), 0) || 0)).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* List of existing costs */}
            <div className="space-y-[7px]">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Spese Registrate ({currentCostJob.costs?.length || 0})
              </h4>

              {(!currentCostJob.costs || currentCostJob.costs.length === 0) ? (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded">
                  Nessun costo registrato per questo intervento. Usa il modulo sotto per inserire benzina, sacchi, ecc.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {currentCostJob.costs.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{c.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 uppercase font-mono">
                            {c.category}
                          </span>
                        </div>
                        {c.notes && <div className="text-[10px] text-slate-400">{c.notes}</div>}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          € {c.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => deleteJobCost(currentCostJob.id, c.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Elimina costo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form: Add Cost to Intervention */}
            <form onSubmit={handleAddJobCostSubmit} className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-[7px] border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-700">
                + Inserisci Nuovo Costo per l'Intervento
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-0.5">Categoria Costo *</label>
                  <select
                    value={costCategory}
                    onChange={(e) => setCostCategory(e.target.value as JobCostCategory)}
                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
                  >
                    <option value="benzina">Benzina / Carburante</option>
                    <option value="sacchi">Sacchi Smaltimento</option>
                    <option value="materiale">Materiale & Concimi</option>
                    <option value="smaltimento">Smaltimento Verde</option>
                    <option value="noleggio">Noleggio Mezzi</option>
                    <option value="manodopera">Manodopera</option>
                    <option value="altro">Altro Costo</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-0.5">Importo Sostenuto (€) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={costAmount}
                    onChange={(e) => setCostAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-0.5">Descrizione Spesa *</label>
                <input
                  type="text"
                  required
                  value={costName}
                  onChange={(e) => setCostName(e.target.value)}
                  placeholder="es. 10L Benzina decespugliatore, 15 sacchi sfalcio"
                  className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
                />
              </div>

              <div>
                <label className="font-semibold block mb-0.5">Note Aggiuntive</label>
                <input
                  type="text"
                  value={costNotes}
                  onChange={(e) => setCostNotes(e.target.value)}
                  placeholder="es. Fornitore Eni / Agraria"
                  className="w-full p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-xs shadow-xs"
                >
                  Aggiungi Costo
                </button>
              </div>
            </form>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setCostJob(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded text-xs"
              >
                Chiudi Gestione Costi
              </button>
            </div>
          </div>
        </div>
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

    </div>
  );
};
