import React, { useState, useMemo } from 'react';
import { Job, JobStatus, JobPaymentStatus, MaterialRequirement, PaymentMethod, PaymentInstallment } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Trash2, Package, Euro, User, UserCheck, Plus, Check, Repeat, Clock, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';

interface JobModalProps {
  job?: Job | null;
  initialDate?: string;
  onClose: () => void;
  onSave: (jobData: any) => void;
}

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'bonifico', label: 'Bonifico Bancario' },
  { id: 'contanti', label: 'Contanti' },
  { id: 'pos_carta', label: 'POS / Carta' },
  { id: 'assegno', label: 'Assegno' },
  { id: 'riba_30_60', label: 'RiBa' },
];

const PAYMENT_STATUSES: Array<{ id: JobPaymentStatus; label: string }> = [
  { id: 'unpaid', label: 'Da Incassare' },
  { id: 'partial', label: 'Parziale (Acconto)' },
  { id: 'paid', label: 'Saldato' },
];

export const JobModal: React.FC<JobModalProps> = ({ job, initialDate, onClose, onSave }) => {
  const { clients, users, inventory, currentUser } = useApp();

  // Lista di tutti gli esecutori selezionabili, includendo sempre l'utente corrente in prima posizione
  const availableWorkers = useMemo(() => {
    const list: Array<{ uid: string; displayName: string; role: string; isSelf: boolean }> = [];
    
    if (currentUser) {
      list.push({
        uid: currentUser.uid,
        displayName: `${currentUser.displayName || 'Titolare'} (Io)`,
        role: currentUser.role,
        isSelf: true,
      });
    }

    users.forEach((u) => {
      if (!list.some((item) => item.uid === u.uid)) {
        list.push({
          uid: u.uid,
          displayName: u.displayName || u.email,
          role: u.role,
          isSelf: false,
        });
      }
    });

    return list;
  }, [users, currentUser]);

  const [clientId, setClientId] = useState<string>(job?.clientId || clients[0]?.id || '');
  
  // Di default assegna all'intervento esistente, oppure a se stesso (currentUser), oppure al primo operaio disponibile
  const [assignedWorkerId, setAssignedWorkerId] = useState<string>(() => {
    if (job?.assignedWorkerId) return job.assignedWorkerId;
    if (currentUser?.uid) return currentUser.uid;
    return users.find((u) => u.role === 'worker')?.uid || '';
  });

  const [date, setDate] = useState<string>(
    job?.date || initialDate || new Date().toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState<string>(job?.timeSlot || '08:30 - 12:30');
  const [status, setStatus] = useState<JobStatus>(job?.status || 'scheduled');
  const [title, setTitle] = useState<string>(job?.title || '');
  const [description, setDescription] = useState<string>(job?.description || '');
  const [notes, setNotes] = useState<string>(job?.notes || '');

  // Financial State
  const [price, setPrice] = useState<number>(job?.price || 150);
  const [paymentStatus, setPaymentStatus] = useState<JobPaymentStatus>(
    job?.paymentStatus || 'unpaid'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    const raw = job?.paymentMethod as any;
    if (raw === 'pos') return 'pos_carta';
    if (raw === 'riba') return 'riba_30_60';
    if (raw === 'bonifico' || raw === 'contanti' || raw === 'pos_carta' || raw === 'assegno' || raw === 'riba_30_60' || raw === 'altro') {
      return raw;
    }
    return 'bonifico';
  });

  // Gestione Intervento Singolo vs Periodico / Continuativo con saldo a fine mese / interventi
  const [interventionType, setInterventionType] = useState<'singolo' | 'generale'>(
    job?.interventionType || 'singolo'
  );
  const [billingArrangement, setBillingArrangement] = useState<'standard' | 'fine_mese_giornate' | 'fine_ciclo_interventi' | 'canone_fisso_mensile'>(
    job?.billingArrangement || (job?.interventionType === 'generale' ? 'fine_mese_giornate' : 'standard')
  );

  // Modalità di calcolo tariffa: oraria, a uscita, canone fisso
  const [pricingMode, setPricingMode] = useState<'hourly' | 'per_session' | 'fixed'>(
    job?.pricingMode || (job?.hourlyRate ? 'hourly' : 'per_session')
  );
  const [hourlyRate, setHourlyRate] = useState<number>(
    job?.hourlyRate || 30
  );
  const [estimatedHoursPerSession, setEstimatedHoursPerSession] = useState<number>(
    job?.estimatedHoursPerSession || 4
  );
  const [ratePerSession, setRatePerSession] = useState<number>(
    job?.ratePerSession || 120
  );

  // Date pianificate liberamente dall'utente
  const [plannedDates, setPlannedDates] = useState<string[]>(() => {
    if (job?.plannedDates && job.plannedDates.length > 0) return [...job.plannedDates];
    return [job?.date || initialDate || new Date().toISOString().split('T')[0]];
  });
  const [dateToAdd, setDateToAdd] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const [billingTermsNote, setBillingTermsNote] = useState<string>(
    job?.billingTermsNote || ''
  );

  // Ricalcola il totale stimato
  const recalculateTotal = (
    dates: string[],
    mode: 'hourly' | 'per_session' | 'fixed',
    hRate: number,
    hPerSession: number,
    sessionRate: number
  ) => {
    const count = dates.length || 1;
    if (mode === 'hourly') {
      const total = count * hPerSession * hRate;
      setPrice(total);
    } else if (mode === 'per_session') {
      const total = count * sessionRate;
      setPrice(total);
    }
  };

  const handleAddPlannedDate = (customDate?: string) => {
    const target = customDate || dateToAdd;
    if (!target) return;
    if (!plannedDates.includes(target)) {
      const updated = [...plannedDates, target].sort();
      setPlannedDates(updated);
      recalculateTotal(updated, pricingMode, hourlyRate, estimatedHoursPerSession, ratePerSession);
    }
  };

  const handleRemovePlannedDate = (dToRemove: string) => {
    if (plannedDates.length <= 1) return;
    const updated = plannedDates.filter((d) => d !== dToRemove);
    setPlannedDates(updated);
    recalculateTotal(updated, pricingMode, hourlyRate, estimatedHoursPerSession, ratePerSession);
  };

  const handleAddDaysShortcut = (days: number) => {
    const lastDateStr = plannedDates[plannedDates.length - 1] || new Date().toISOString().split('T')[0];
    const lastDate = new Date(lastDateStr);
    lastDate.setDate(lastDate.getDate() + days);
    const newStr = lastDate.toISOString().split('T')[0];
    handleAddPlannedDate(newStr);
  };

  // Gestione Acconti (Installments)
  const [installments, setInstallments] = useState<PaymentInstallment[]>(job?.installments || []);
  const [isAddingInstallment, setIsAddingInstallment] = useState(false);
  const [instAmount, setInstAmount] = useState<number>(50);
  const [instDate, setInstDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [instMethod, setInstMethod] = useState<PaymentMethod>(paymentMethod);
  const [instNotes, setInstNotes] = useState<string>('');

  const [paidAmount, setPaidAmount] = useState<number>(() => {
    if (job?.installments && job.installments.length > 0) {
      return job.installments.reduce((sum, item) => sum + item.amount, 0);
    }
    return job?.paidAmount || 0;
  });

  // Materials Required
  const [materialsRequired, setMaterialsRequired] = useState<MaterialRequirement[]>(
    job?.materialsRequired || []
  );
  const [selectedMatId, setSelectedMatId] = useState<string>('');
  const [selectedMatQty, setSelectedMatQty] = useState<number>(1);

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedWorker =
    availableWorkers.find((u) => u.uid === assignedWorkerId) ||
    (currentUser && currentUser.uid === assignedWorkerId
      ? { uid: currentUser.uid, displayName: currentUser.displayName || 'Titolare', role: currentUser.role, isSelf: true }
      : null);

  const handleAddMaterial = () => {
    if (!selectedMatId) return;
    const invItem = inventory.find((i) => i.id === selectedMatId);
    if (!invItem) return;

    if (materialsRequired.some((m) => m.itemId === invItem.id)) {
      setMaterialsRequired((prev) =>
        prev.map((m) =>
          m.itemId === invItem.id ? { ...m, qtyNeeded: m.qtyNeeded + selectedMatQty } : m
        )
      );
    } else {
      setMaterialsRequired((prev) => [
        ...prev,
        {
          itemId: invItem.id,
          name: invItem.name,
          qtyNeeded: selectedMatQty,
          unit: invItem.unit,
        },
      ]);
    }
    setSelectedMatId('');
    setSelectedMatQty(1);
  };

  const handleRemoveMaterial = (itemId: string) => {
    setMaterialsRequired((prev) => prev.filter((m) => m.itemId !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedWorker) return;

    onSave({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientAddress: selectedClient.address,
      clientPhone: selectedClient.phone,
      lat: selectedClient.lat,
      lng: selectedClient.lng,
      assignedWorkerId: selectedWorker.uid,
      assignedWorkerName: selectedWorker.isSelf
        ? (currentUser?.displayName || 'Titolare')
        : selectedWorker.displayName,
      date: plannedDates[0] || date,
      timeSlot,
      status,
      title,
      description,
      notes,
      price: Number(price),
      paymentStatus,
      paymentMethod,
      paidAmount: Number(paidAmount),
      installments,
      materialsRequired,
      interventionType,
      billingArrangement: interventionType === 'generale' ? billingArrangement : 'standard',
      frequency: interventionType === 'generale' ? `${plannedDates.length} uscite programmate` : undefined,
      sessionsCount: interventionType === 'generale' ? plannedDates.length : undefined,
      ratePerSession: interventionType === 'generale' && pricingMode === 'per_session' ? Number(ratePerSession) : undefined,
      pricingMode: interventionType === 'generale' ? pricingMode : undefined,
      hourlyRate: interventionType === 'generale' && pricingMode === 'hourly' ? Number(hourlyRate) : undefined,
      estimatedHoursPerSession: interventionType === 'generale' && pricingMode === 'hourly' ? Number(estimatedHoursPerSession) : undefined,
      plannedDates: interventionType === 'generale' ? plannedDates : undefined,
      billingTermsNote: interventionType === 'generale' ? billingTermsNote : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-[7px] overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-[7px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-2 max-h-[92vh] flex flex-col space-y-[7px]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-[7px] px-3 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold">
            {job ? 'Modifica Intervento' : 'Pianifica Nuovo Intervento'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[7px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-[7px] overflow-y-auto space-y-[7px] text-xs text-slate-700 dark:text-slate-300">
          
          {/* Client Selection */}
          <div className="space-y-[7px]">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Committente / Cantiere *</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.address} ({c.gardenNotes.squareMeters} mq)
                </option>
              ))}
            </select>
          </div>

          {/* Worker (Esecutore), Date, TimeSlot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[7px]">
            <div className="space-y-[7px]">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Esecutore Assegnato *
                </label>
                {currentUser && assignedWorkerId !== currentUser.uid && (
                  <button
                    type="button"
                    onClick={() => setAssignedWorkerId(currentUser.uid)}
                    className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    title="Assegna a me stesso"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Assegna a me</span>
                  </button>
                )}
              </div>
              <select
                required
                value={assignedWorkerId}
                onChange={(e) => setAssignedWorkerId(e.target.value)}
                className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
              >
                {availableWorkers.length === 0 ? (
                  <option value="">Nessun esecutore disponibile</option>
                ) : (
                  availableWorkers.map((w) => (
                    <option key={w.uid} value={w.uid}>
                      {w.isSelf ? w.displayName : `${w.displayName} (${w.role === 'admin' ? 'Admin' : 'Operaio'})`}
                    </option>
                  ))
                )}
              </select>
              {currentUser && assignedWorkerId === currentUser.uid && (
                <div className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-[5px] inline-flex items-center gap-1 font-semibold border border-emerald-200 dark:border-emerald-800/50">
                  <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Esecutore: Tu stesso (Titolare)</span>
                </div>
              )}
            </div>

            <div className="space-y-[7px]">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">Data Intervento *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-[7px]">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">Fascia Oraria</label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="es. 08:30 - 12:30"
                className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-[7px]">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Titolo Intervento *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Sfalcio prato e potatura siepe"
              className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs focus:outline-emerald-600 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-[7px]">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Descrizione Intervento</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dettagli lavorazione..."
              className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Tipologia Intervento: Singolo vs Periodico */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[7px] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tipologia Intervento & Fatturazione</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {interventionType === 'generale' ? 'Lavoro Continuativo / Periodico' : 'Intervento Singolo'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setInterventionType('singolo');
                  setBillingArrangement('standard');
                }}
                className={`py-2 px-2.5 rounded-[7px] text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  interventionType === 'singolo'
                    ? 'bg-slate-900 text-white border-slate-950 shadow-xs ring-1 ring-slate-400 dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Intervento Singolo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInterventionType('generale');
                  setBillingArrangement('fine_mese_giornate');
                  recalculateTotal(plannedDates, pricingMode, hourlyRate, estimatedHoursPerSession, ratePerSession);
                }}
                className={`py-2 px-2.5 rounded-[7px] text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  interventionType === 'generale'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-500/60'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-600 dark:hover:border-emerald-500'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Intervento Periodico</span>
              </button>
            </div>

            {/* Sottosezione per Intervento Periodico / Continuativo */}
            {interventionType === 'generale' && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-[7px] border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                  <span>Accordo Lavoro & Pianificazione Date</span>
                  <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">Pianifica le date e la tariffa</span>
                </div>

                {/* 1. PIANIFICAZIONE LIBERA DELLE DATE */}
                <div className="space-y-1.5 bg-white dark:bg-slate-900 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Date Pianificate ({plannedDates.length} interventi)</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Pianifica tu stesso le uscite</span>
                  </div>

                  {/* Input date + pulsante aggiungi + shortcut */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <input
                      type="date"
                      value={dateToAdd}
                      onChange={(e) => setDateToAdd(e.target.value)}
                      className="p-1 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] font-mono text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddPlannedDate()}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[6px] text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Aggiungi Data</span>
                    </button>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleAddDaysShortcut(7)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[5px] border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
                        title="Aggiungi data tra 7 giorni"
                      >
                        +7 gg
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddDaysShortcut(14)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[5px] border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
                        title="Aggiungi data tra 14 giorni"
                      >
                        +14 gg
                      </button>
                    </div>
                  </div>

                  {/* Lista chips delle date pianificate */}
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto">
                    {plannedDates.map((dStr, idx) => {
                      const dObj = new Date(dStr);
                      const formatted = !isNaN(dObj.getTime())
                        ? dObj.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
                        : dStr;
                      return (
                        <span
                          key={dStr}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] text-[11px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs"
                        >
                          <span className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400">#{idx + 1}</span>
                          <span>{formatted}</span>
                          {plannedDates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePlannedDate(dStr)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-0.5 cursor-pointer"
                              title="Rimuovi data"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 2. MODALITÀ TARIFFA: A ORE vs A USCITA vs FORFAIT */}
                <div className="space-y-1.5 bg-white dark:bg-slate-900 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Modalità di Calcolo Tariffa
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'hourly', label: 'Tariffa Oraria (€/h)' },
                      { id: 'per_session', label: 'A Uscita (€)' },
                      { id: 'fixed', label: 'Canone Fisso (€)' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          const m = mode.id as any;
                          setPricingMode(m);
                          recalculateTotal(plannedDates, m, hourlyRate, estimatedHoursPerSession, ratePerSession);
                        }}
                        className={`py-1.5 px-1.5 rounded-[6px] text-[10px] font-bold border transition-colors cursor-pointer text-center ${
                          pricingMode === mode.id
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* Campi specifici in base alla modalità scelta */}
                  {pricingMode === 'hourly' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            Tariffa Oraria (€/ora) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                            <input
                              type="number"
                              step="0.5"
                              min="1"
                              value={hourlyRate}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setHourlyRate(val);
                                recalculateTotal(plannedDates, 'hourly', val, estimatedHoursPerSession, ratePerSession);
                              }}
                              className="w-full p-1.5 pl-6 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            Stima Ore per Uscita
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={estimatedHoursPerSession}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 1;
                              setEstimatedHoursPerSession(val);
                              recalculateTotal(plannedDates, 'hourly', hourlyRate, val, ratePerSession);
                            }}
                            className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="p-2 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-[6px] border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <span>
                            {plannedDates.length} uscite × {estimatedHoursPerSession}h = <strong>{plannedDates.length * estimatedHoursPerSession} ore stimate</strong> a €{hourlyRate}/h
                          </span>
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          € {(plannedDates.length * estimatedHoursPerSession * hourlyRate).toFixed(2)} (stimato)
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                        A fine mese o a chiusura lavori, il totale effettivo calcolerà in automatico la somma delle ore realmente lavorate nei singoli interventi.
                      </p>
                    </div>
                  )}

                  {pricingMode === 'per_session' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          Prezzo Fisso a Singola Uscita / Giornata (€)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={ratePerSession}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setRatePerSession(val);
                              recalculateTotal(plannedDates, 'per_session', hourlyRate, estimatedHoursPerSession, val);
                            }}
                            className="w-full p-1.5 pl-6 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
                          />
                        </div>
                      </div>

                      <div className="p-2 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-[6px] border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                        <span>
                          {plannedDates.length} uscite × €{ratePerSession}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          Totale: € {(plannedDates.length * ratePerSession).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {pricingMode === 'fixed' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          Importo Fisso Concordato (€)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 pl-6 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. MODALITÀ ACCORDO PAGAMENTO */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Accordo di Pagamento
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {[
                      { id: 'fine_mese_giornate', label: 'A Fine Mese (somma ore/uscite)' },
                      { id: 'fine_ciclo_interventi', label: 'A Fine Interventi' },
                      { id: 'canone_fisso_mensile', label: 'Canone Fisso Mensile' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBillingArrangement(item.id as any)}
                        className={`py-1.5 px-2 rounded-[6px] text-[10px] font-bold border transition-colors cursor-pointer text-center leading-tight ${
                          billingArrangement === item.id
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Financial & Payment Section */}
          <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-[7px] space-y-2.5">
            <span className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block text-[11px] flex items-center gap-[7px]">
              <Euro className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              Importo Lavoro & Gestione Pagamento
            </span>

            {/* Prezzo e Incassato Finora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                  Prezzo Totale Intervento (€) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPrice(val);
                      if (paymentStatus === 'paid') setPaidAmount(val);
                    }}
                    className="w-full p-[7px] pl-7 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                  Incassato Finora (€)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPaidAmount(val);
                      if (val >= price && price > 0) {
                        setPaymentStatus('paid');
                      } else if (val > 0) {
                        setPaymentStatus('partial');
                      } else {
                        setPaymentStatus('unpaid');
                      }
                    }}
                    className="w-full p-[7px] pl-7 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Stato Pagamento - SU UNICO RIGO (3 colonne fisse) */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                Stato Pagamento
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_STATUSES.map((ps) => {
                  const isSelected = paymentStatus === ps.id;
                  return (
                    <button
                      key={ps.id}
                      type="button"
                      onClick={() => {
                        setPaymentStatus(ps.id);
                        if (ps.id === 'paid') setPaidAmount(price);
                        if (ps.id === 'unpaid') setPaidAmount(0);
                      }}
                      className={`flex items-center justify-center py-2 px-1.5 rounded-[7px] text-xs font-bold transition-all cursor-pointer border text-center ${
                        isSelected
                          ? ps.id === 'paid'
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm ring-2 ring-emerald-500/60'
                            : ps.id === 'partial'
                            ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/60'
                            : 'bg-rose-700 text-white border-rose-800 shadow-sm ring-2 ring-rose-400/60'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="whitespace-normal leading-tight">{ps.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modalità Pagamento - SU 3 COLONNE OGNI RIGO */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                Modalità Pagamento Predefinita *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex items-center justify-center py-2 px-2 rounded-[7px] text-xs font-bold transition-all cursor-pointer border text-center ${
                        isSelected
                          ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-950 dark:border-emerald-500 shadow-sm ring-2 ring-emerald-400/60'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="whitespace-normal leading-tight">{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sezione Acconti & Pagamenti Ricevuti (quando il lavoro è in essere) */}
            <div className="pt-2.5 mt-2.5 border-t border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wide block">
                    Acconti & Versamenti Ricevuti ({installments.length})
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Rimanente da incassare:{' '}
                    <strong className={price - paidAmount > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}>
                      € {Math.max(0, price - paidAmount).toFixed(2)}
                    </strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const remaining = Math.max(0, price - paidAmount);
                    setInstAmount(remaining > 0 ? remaining : 50);
                    setIsAddingInstallment(!isAddingInstallment);
                  }}
                  className="p-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-[7px] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingInstallment ? 'Annulla' : 'Aggiungi Acconto'}</span>
                </button>
              </div>

              {/* Form Rapido per Aggiungere un Acconto */}
              {isAddingInstallment && (
                <div className="p-3 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-[7px] space-y-2.5 shadow-xs">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Registrazione Nuovo Acconto
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Importo Acconto (€) *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={instAmount}
                        onChange={(e) => setInstAmount(parseFloat(e.target.value) || 0)}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-emerald-600"
                        placeholder="es. 200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Data Pagamento Acconto *
                      </label>
                      <input
                        type="date"
                        value={instDate}
                        onChange={(e) => setInstDate(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Modalità Pagamento Acconto - SU 3 COLONNE OGNI RIGO */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Modalità Pagamento Acconto
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PAYMENT_METHODS.map((pm) => {
                        const isSel = instMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setInstMethod(pm.id)}
                            className={`py-1.5 px-2 rounded-[7px] text-[11px] font-bold border transition-colors cursor-pointer text-center ${
                              isSel
                                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-1 ring-emerald-400'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-600'
                            }`}
                          >
                            <span className="whitespace-normal leading-tight">{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>


                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Note Acconto (facoltative)
                    </label>
                    <input
                      type="text"
                      value={instNotes}
                      onChange={(e) => setInstNotes(e.target.value)}
                      placeholder="es. Bonifico anticipato, contanti ricevuti..."
                      className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingInstallment(false)}
                      className="p-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-[7px] text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (instAmount <= 0) return;
                        const newInst: PaymentInstallment = {
                          id: `inst_${Date.now()}`,
                          amount: Number(instAmount),
                          date: instDate,
                          paymentMethod: instMethod,
                          notes: instNotes.trim() || undefined,
                          createdAt: new Date().toISOString(),
                        };
                        const updated = [...installments, newInst];
                        setInstallments(updated);
                        const total = updated.reduce((s, it) => s + it.amount, 0);
                        setPaidAmount(total);
                        if (total >= price && price > 0) {
                          setPaymentStatus('paid');
                        } else if (total > 0) {
                          setPaymentStatus('partial');
                        } else {
                          setPaymentStatus('unpaid');
                        }
                        setIsAddingInstallment(false);
                        setInstNotes('');
                      }}
                      className="p-1.5 px-3.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-[7px] text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Conferma Acconto
                    </button>
                  </div>
                </div>
              )}

              {/* Elenco Acconti già registrati */}
              {installments.length > 0 ? (
                <div className="space-y-1.5">
                  {installments.map((inst, index) => (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Acconto #{index + 1}
                          </span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            € {inst.amount.toFixed(2)}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {inst.date}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {PAYMENT_METHODS.find((m) => m.id === inst.paymentMethod)?.label || inst.paymentMethod}
                          {inst.notes && <span> · "{inst.notes}"</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = installments.filter((item) => item.id !== inst.id);
                          setInstallments(updated);
                          const total = updated.reduce((s, it) => s + it.amount, 0);
                          setPaidAmount(total);
                          if (total >= price && price > 0) {
                            setPaymentStatus('paid');
                          } else if (total > 0) {
                            setPaymentStatus('partial');
                          } else {
                            setPaymentStatus('unpaid');
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-[7px] transition-colors cursor-pointer"
                        title="Elimina acconto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-center text-[11px] text-slate-400 dark:text-slate-500 bg-white/60 dark:bg-slate-900/60 rounded-[7px] border border-dashed border-slate-300 dark:border-slate-700">
                  Nessun acconto specifico ancora registrato. Puoi inserire direttamente l'incasso sopra o aggiungere acconti singoli con data e metodo.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-[7px]">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Note per l'Operaio</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Attenzione cancelli o istruzioni speciali..."
              className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Materials Required Section */}
          <div className="p-[7px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[7px] space-y-[7px]">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px] flex items-center gap-[7px]">
              <Package className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              Materiali Richiesti dal Magazzino
            </span>

            {materialsRequired.length > 0 && (
              <div className="space-y-[7px]">
                {materialsRequired.map((mat) => (
                  <div
                    key={mat.itemId}
                    className="flex items-center justify-between p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{mat.name}</span>
                    <div className="flex items-center gap-[7px]">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        {mat.qtyNeeded} {mat.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(mat.itemId)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-[7px] p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selector to add requirement */}
            <div className="flex items-center gap-1.5 pt-1 w-full min-w-0">
              <select
                value={selectedMatId}
                onChange={(e) => setSelectedMatId(e.target.value)}
                className="flex-1 min-w-0 p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs text-slate-900 dark:text-slate-100 truncate focus:outline-emerald-600"
              >
                <option value="">Seleziona</option>
                {inventory
                  .filter((i) => i.category === 'material')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.quantity} {m.unit})
                    </option>
                  ))}
              </select>

              <input
                type="number"
                min="1"
                value={selectedMatQty}
                onChange={(e) => setSelectedMatQty(parseInt(e.target.value) || 1)}
                className="w-12 sm:w-14 shrink-0 p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-mono font-bold text-center text-slate-900 dark:text-slate-100"
              />

              <button
                type="button"
                onClick={handleAddMaterial}
                className="shrink-0 px-2.5 py-1.5 bg-slate-800 dark:bg-emerald-700 hover:bg-slate-700 dark:hover:bg-emerald-600 text-white font-medium rounded-[7px] text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1 whitespace-nowrap"
                title="Aggiungi materiale"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi</span>
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="pt-[7px] border-t border-slate-200 dark:border-slate-700 space-y-[7px]">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Stato Lavoro</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full p-[7px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              <option value="scheduled">Programmato</option>
              <option value="in_progress">In Corso</option>
              <option value="completed">Completato</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>

          {/* Action Footer */}
          <div className="pt-[7px] border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-[7px]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[7px] font-medium cursor-pointer transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold shadow-xs flex items-center gap-[7px] cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Salva Intervento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
