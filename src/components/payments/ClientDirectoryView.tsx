import React, { useState, useMemo } from 'react';
import { Client, Job, PaymentMethod, CantiereSite, GardenNotes } from '../../types';
import {
  Users,
  Search,
  Plus,
  Building2,
  MapPin,
  Euro,
  Receipt,
  Calendar,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Clock,
  Shield,
} from 'lucide-react';

interface ClientDirectoryViewProps {
  clients: Client[];
  jobs: Job[];
  onUpdateClient: (client: Client) => Promise<void>;
  onAddClient: (clientData: any) => Promise<void>;
  onOpenAccontoModal: (job: Job) => void;
  onNavigateToNewJob?: (clientId?: string, cantiereId?: string) => void;
}

export const ClientDirectoryView: React.FC<ClientDirectoryViewProps> = ({
  clients,
  jobs,
  onUpdateClient,
  onAddClient,
  onOpenAccontoModal,
  onNavigateToNewJob,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Modal State: Add Cantiere to Client
  const [addingCantiereForClient, setAddingCantiereForClient] = useState<Client | null>(null);
  const [cantiereName, setCantiereName] = useState('');
  const [cantiereAddress, setCantiereAddress] = useState('');
  const [cantiereSqMeters, setCantiereSqMeters] = useState<number>(200);
  const [cantiereGateCode, setCantiereGateCode] = useState('');
  const [cantiereNotes, setCantiereNotes] = useState('');

  // Modal State: Add New Client
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientVat, setNewClientVat] = useState('');
  const [newClientPaymentMethod, setNewClientPaymentMethod] = useState<PaymentMethod>('bonifico');
  const [newClientSqMeters, setNewClientSqMeters] = useState<number>(300);

  // Calculate client financial metrics
  const clientMetrics = useMemo(() => {
    const map: Record<
      string,
      {
        totalRevenue: number;
        totalCollected: number;
        totalPending: number;
        completedJobsCount: number;
        totalJobsCount: number;
        jobs: Job[];
      }
    > = {};

    clients.forEach((c) => {
      const clientJobs = jobs.filter((j) => j.clientId === c.id || j.clientName === c.name);
      let totalRev = 0;
      let totalCol = 0;

      clientJobs.forEach((j) => {
        const price = j.price || 0;
        totalRev += price;

        if (j.paymentStatus === 'paid') {
          totalCol += price;
        } else if (j.installments && j.installments.length > 0) {
          totalCol += j.installments.reduce((s, it) => s + it.amount, 0);
        } else if (j.paidAmount) {
          totalCol += j.paidAmount;
        } else if (j.paymentStatus === 'partial') {
          totalCol += price / 2;
        }
      });

      const pending = Math.max(0, totalRev - totalCol);
      const completed = clientJobs.filter((j) => j.status === 'completed').length;

      map[c.id] = {
        totalRevenue: totalRev,
        totalCollected: totalCol,
        totalPending: pending,
        completedJobsCount: completed,
        totalJobsCount: clientJobs.length,
        jobs: clientJobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      };
    });

    return map;
  }, [clients, jobs]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const metrics = clientMetrics[c.id];
      if (filterPendingOnly && (!metrics || metrics.totalPending <= 0)) {
        return false;
      }

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const matchName = c.name.toLowerCase().includes(term);
      const matchPhone = c.phone.toLowerCase().includes(term);
      const matchEmail = c.email.toLowerCase().includes(term);
      const matchAddress = c.address.toLowerCase().includes(term);
      const matchVat = c.vatOrTaxCode?.toLowerCase().includes(term);
      const matchCantieri = c.cantieri?.some(
        (site) => site.name.toLowerCase().includes(term) || site.address.toLowerCase().includes(term)
      );

      return matchName || matchPhone || matchEmail || matchAddress || matchVat || matchCantieri;
    });
  }, [clients, searchTerm, filterPendingOnly, clientMetrics]);

  // Handle Save New Cantiere to Client
  const handleSaveCantiere = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingCantiereForClient || !cantiereName.trim() || !cantiereAddress.trim()) return;

    const newSite: CantiereSite = {
      id: `site_${Date.now()}`,
      name: cantiereName.trim(),
      address: cantiereAddress.trim(),
      lat: addingCantiereForClient.lat || 45.4642,
      lng: addingCantiereForClient.lng || 9.19,
      gardenNotes: {
        squareMeters: Number(cantiereSqMeters) || 100,
        irrigationDetails: 'Da verificare',
        delicatePlants: 'Nessuna nota',
        gateCode: cantiereGateCode.trim(),
        dogPresent: false,
        notes: cantiereNotes.trim(),
      },
      createdAt: new Date().toISOString(),
    };

    const existingCantieri = addingCantiereForClient.cantieri || [];
    const updatedClient: Client = {
      ...addingCantiereForClient,
      cantieri: [...existingCantieri, newSite],
    };

    await onUpdateClient(updatedClient);

    // Reset Modal
    setAddingCantiereForClient(null);
    setCantiereName('');
    setCantiereAddress('');
    setCantiereSqMeters(200);
    setCantiereGateCode('');
    setCantiereNotes('');
  };

  // Handle Save New Client
  const handleSaveNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientAddress.trim()) return;

    await onAddClient({
      name: newClientName.trim(),
      phone: newClientPhone.trim(),
      email: newClientEmail.trim(),
      address: newClientAddress.trim(),
      lat: 45.4642,
      lng: 9.19,
      vatOrTaxCode: newClientVat.trim(),
      preferredPaymentMethod: newClientPaymentMethod,
      gardenNotes: {
        squareMeters: Number(newClientSqMeters) || 200,
        irrigationDetails: 'Impianto automatico',
        delicatePlants: 'Nessuna',
        gateCode: '',
        dogPresent: false,
      },
      cantieri: [],
    });

    setShowAddClientModal(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientAddress('');
    setNewClientVat('');
  };

  return (
    <div className="space-y-[7px]">
      
      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px]">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-[7px]">
              <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Rubrica Clienti & Storico Cantieri Multipli</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Storico interventi, saldi incassi e gestione di più cantieri/location per lo stesso committente.
            </p>
          </div>

          <button
            onClick={() => setShowAddClientModal(true)}
            className="flex items-center justify-center gap-[7px] p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-[7px] shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Cliente</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-[7px] pt-[7px] border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca cliente per nome, telefono, P.IVA, indirizzo o cantiere..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[7px] text-slate-900 dark:text-slate-100 focus:outline-emerald-600 placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => setFilterPendingOnly(!filterPendingOnly)}
            className={`p-[7px] px-3 rounded-[7px] text-xs font-bold border transition-colors flex items-center gap-[7px] shrink-0 ${
              filterPendingOnly
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Solo con sospesi / da incassare</span>
          </button>
        </div>
      </div>

      {/* Clients Directory List */}
      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] py-12 text-center text-xs text-slate-500 shadow-xs">
          Nessun cliente trovato con i criteri impostati.
        </div>
      ) : (
        <div className="space-y-[7px]">
          {filteredClients.map((client) => {
            const metrics = clientMetrics[client.id] || {
              totalRevenue: 0,
              totalCollected: 0,
              totalPending: 0,
              completedJobsCount: 0,
              totalJobsCount: 0,
              jobs: [],
            };

            const isExpanded = selectedClientId === client.id;
            const extraCantieri = client.cantieri || [];
            const totalCantieriCount = 1 + extraCantieri.length; // Main address + additional cantieri

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] shadow-xs overflow-hidden transition-all space-y-[7px]"
              >
                {/* Client Main Card Summary Header */}
                <div
                  onClick={() => setSelectedClientId(isExpanded ? null : client.id)}
                  className="p-[7px] bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-[7px] transition-colors"
                >
                  <div className="flex items-start gap-[7px] min-w-0">
                    <div className="w-9 h-9 rounded-[7px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-[7px] flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {client.name}
                        </span>
                        {client.vatOrTaxCode && (
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-[7px]">
                            P.IVA/CF: {client.vatOrTaxCode}
                          </span>
                        )}
                        <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded-[7px] border border-indigo-200 dark:border-indigo-800">
                          {totalCantieriCount} {totalCantieriCount === 1 ? 'Location/Cantiere' : 'Cantieri/Location'}
                        </span>
                      </div>

                      <div className="flex items-center gap-[7px] text-[11px] text-slate-600 dark:text-slate-400 flex-wrap">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {client.phone}
                          </span>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {client.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{client.address}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Quick Metrics */}
                  <div className="flex items-center justify-between md:justify-end gap-[7px] shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Totale Lavori</div>
                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                          € {metrics.totalRevenue.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Incassato</div>
                        <div className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                          € {metrics.totalCollected.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Sospeso</div>
                        <div
                          className={`font-mono font-bold text-xs ${
                            metrics.totalPending > 0
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          € {metrics.totalPending.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="p-1 rounded-[7px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Client Details & Storico Cantieri */}
                {isExpanded && (
                  <div className="p-[7px] border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-[7px]">
                    
                    {/* Action Bar for Client */}
                    <div className="flex flex-wrap items-center justify-between gap-[7px] p-[7px] bg-white dark:bg-slate-900 rounded-[7px] border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Gestione Sedi Cantieri & Storico Lavori
                      </div>

                      <div className="flex items-center gap-[7px] flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddingCantiereForClient(client);
                            setCantiereName('');
                            setCantiereAddress('');
                          }}
                          className="flex items-center gap-1.5 p-[7px] px-2.5 bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-[11px] rounded-[7px] shadow-2xs transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>+ Aggiungi Cantiere / Location</span>
                        </button>

                        {onNavigateToNewJob && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToNewJob(client.id);
                            }}
                            className="flex items-center gap-1.5 p-[7px] px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-[7px] shadow-2xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Pianifica Lavoro per questo Cliente</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SEZIONE 1: Elenco delle Location / Cantieri registrati per questo cliente */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] space-y-[7px]">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-[7px]">
                        <Building2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        <span>Sedi & Cantieri del Cliente ({totalCantieriCount})</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-[7px]">
                        {/* Main Address Cantiere */}
                        <div className="p-[7px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              Cantiere Principale / Sede
                            </span>
                            {client.gardenNotes?.squareMeters && (
                              <span className="font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded-[7px]">
                                {client.gardenNotes.squareMeters} mq
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{client.address}</span>
                          </div>
                          {client.gardenNotes?.gateCode && (
                            <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                              🔑 Cancello: {client.gardenNotes.gateCode}
                            </div>
                          )}
                        </div>

                        {/* Additional Cantieri */}
                        {extraCantieri.map((site) => (
                          <div
                            key={site.id}
                            className="p-[7px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                                📍 {site.name}
                              </span>
                              {site.gardenNotes?.squareMeters && (
                                <span className="font-mono text-[10px] font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded-[7px]">
                                  {site.gardenNotes.squareMeters} mq
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{site.address}</span>
                            </div>
                            {site.gardenNotes?.gateCode && (
                              <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                                🔑 Cancello: {site.gardenNotes.gateCode}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SEZIONE 2: Storico Completo Lavori & Acconti per questo Cliente */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] space-y-[7px]">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-[7px]">
                          <Receipt className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <span>Storico Interventi & Pagamenti ({metrics.jobs.length})</span>
                        </span>
                      </div>

                      {metrics.jobs.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Nessun intervento registrato per questo cliente.
                        </div>
                      ) : (
                        <div className="space-y-[7px]">
                          {metrics.jobs.map((job) => {
                            const price = job.price || 0;
                            const installmentsSum = job.installments
                              ? job.installments.reduce((s, it) => s + it.amount, 0)
                              : 0;
                            const effectivePaid =
                              job.paymentStatus === 'paid'
                                ? price
                                : installmentsSum > 0
                                ? installmentsSum
                                : job.paidAmount || 0;
                            const jobPending = Math.max(0, price - effectivePaid);

                            return (
                              <div
                                key={job.id}
                                className="p-[7px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-[7px] space-y-[7px]"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px]">
                                  <div>
                                    <div className="flex items-center gap-[7px] flex-wrap">
                                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                        {job.title}
                                      </span>
                                      {job.cantiereName && (
                                        <span className="font-bold text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950 px-1.5 py-0.5 rounded-[7px]">
                                          {job.cantiereName}
                                        </span>
                                      )}
                                      <span className="font-mono text-[11px] text-slate-500">
                                        📅 {job.date} ({job.timeSlot})
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                      📍 {job.clientAddress} · Assegnato: <strong>{job.assignedWorkerName}</strong>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="text-right font-mono">
                                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                        € {price.toFixed(2)}
                                      </div>
                                      <div
                                        className={`text-[10px] font-bold ${
                                          jobPending <= 0
                                            ? 'text-emerald-700 dark:text-emerald-400'
                                            : 'text-amber-700 dark:text-amber-400'
                                        }`}
                                      >
                                        {jobPending <= 0 ? 'Saldato' : `Sospeso: € ${jobPending.toFixed(2)}`}
                                      </div>
                                    </div>

                                    {jobPending > 0 && (
                                      <button
                                        onClick={() => onOpenAccontoModal(job)}
                                        className="p-[7px] px-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] rounded-[7px] shadow-2xs transition-colors shrink-0"
                                      >
                                        + Acconto
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Installments History for this Job */}
                                {job.installments && job.installments.length > 0 && (
                                  <div className="p-[7px] bg-white dark:bg-slate-900 rounded-[7px] border border-slate-200/80 dark:border-slate-800 space-y-1">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      Acconti Versati ({job.installments.length})
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] font-mono">
                                      {job.installments.map((inst) => (
                                        <div
                                          key={inst.id}
                                          className="p-1 px-2 bg-slate-50 dark:bg-slate-800 rounded-[7px] border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                                        >
                                          <span>{inst.date} ({inst.paymentMethod})</span>
                                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                            + € {inst.amount.toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Aggiungi Nuovo Cantiere a Cliente */}
      {addingCantiereForClient && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-[7px]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-[7px] shadow-2xl space-y-[7px] text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-xs flex items-center gap-[7px]">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Aggiungi Nuovo Cantiere a {addingCantiereForClient.name}
              </h3>
              <button
                onClick={() => setAddingCantiereForClient(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCantiere} className="space-y-[7px] text-xs">
              <div className="space-y-1">
                <label className="font-semibold block">Nome Cantiere / Location *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Villa Monza, Sede Viale Parioli, Parco Estivo"
                  value={cantiereName}
                  onChange={(e) => setCantiereName(e.target.value)}
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Indirizzo Cantiere *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Via Brianza 45, Monza (MB)"
                  value={cantiereAddress}
                  onChange={(e) => setCantiereAddress(e.target.value)}
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-1">
                  <label className="font-semibold block">Superficie (mq)</label>
                  <input
                    type="number"
                    value={cantiereSqMeters}
                    onChange={(e) => setCantiereSqMeters(Number(e.target.value))}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Codice Cancello / Allarme</label>
                  <input
                    type="text"
                    placeholder="Es. 1234#"
                    value={cantiereGateCode}
                    onChange={(e) => setCantiereGateCode(e.target.value)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Note Cantiere (opzionale)</label>
                <textarea
                  rows={2}
                  placeholder="Note su irrigazione, piante o accesso cane..."
                  value={cantiereNotes}
                  onChange={(e) => setCantiereNotes(e.target.value)}
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-[7px]">
                <button
                  type="button"
                  onClick={() => setAddingCantiereForClient(null)}
                  className="p-[7px] px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-[7px]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="p-[7px] px-4 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-[7px]"
                >
                  Salva Cantiere
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Aggiungi Nuovo Cliente */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-[7px]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-[7px] shadow-2xl space-y-[7px] text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-xs flex items-center gap-[7px]">
                <Users className="w-4 h-4 text-emerald-600" />
                Registra Nuovo Cliente in Rubrica
              </h3>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewClient} className="space-y-[7px] text-xs">
              <div className="space-y-1">
                <label className="font-semibold block">Nome Ragione Sociale / Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Condominio Il Parco, Mariuccio, Famiglia Rossi"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-1">
                  <label className="font-semibold block">Telefono</label>
                  <input
                    type="text"
                    placeholder="Es. 333 1234567"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Email</label>
                  <input
                    type="email"
                    placeholder="info@cliente.it"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Indirizzo Sede Principale *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Viale Parioli 74, Roma"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-1">
                  <label className="font-semibold block">Codice Fiscale / P.IVA</label>
                  <input
                    type="text"
                    placeholder="P.IVA / CF"
                    value={newClientVat}
                    onChange={(e) => setNewClientVat(e.target.value)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Mq Giardino Principale</label>
                  <input
                    type="number"
                    value={newClientSqMeters}
                    onChange={(e) => setNewClientSqMeters(Number(e.target.value))}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-[7px]">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="p-[7px] px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-[7px]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="p-[7px] px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px]"
                >
                  Salva Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
