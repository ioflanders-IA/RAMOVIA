import React, { useState, useMemo } from 'react';
import { Job, JobStatus, JobPaymentStatus, MaterialRequirement, EquipmentRequirement, PaymentMethod, PaymentInstallment } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Trash2, Package, Euro, User, UserCheck, Plus, Check, Repeat, Clock, AlertCircle, Calendar as CalendarIcon, Users, Wrench } from 'lucide-react';
import { formatLocalDate, parseLocalDate, formatItalianDate } from '../../utils/dateUtils';
import { RichNoteBox } from '../common/RichNoteBox';
import { getClientColor } from '../../utils/clientColors';

interface JobModalProps {
  job?: Job | null;
  initialDate?: string;
  onClose: () => void;
  onSave: (jobData: any) => void;
}

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'bonifico', label: 'Bonifico' },
  { id: 'contanti', label: 'Contanti' },
  { id: 'pos_carta', label: 'POS / Carta' },
  { id: 'assegno', label: 'Assegno' },
  { id: 'riba_30_60', label: 'RiBa' },
];

const PAYMENT_STATUSES: Array<{ id: JobPaymentStatus; label: string }> = [
  { id: 'unpaid', label: 'Da Incassare' },
  { id: 'partial', label: 'Acconto' },
  { id: 'paid', label: 'Saldato' },
];

export const JobModal: React.FC<JobModalProps> = ({ job, initialDate, onClose, onSave }) => {
  const { clients, users, inventory, currentUser } = useApp();

  // Lista di tutti gli esecutori selezionabili, includendo sempre l'utente corrente in prima posizione e senza doppioni
  const availableWorkers = useMemo(() => {
    const list: Array<{ uid: string; displayName: string; role: string; isSelf: boolean }> = [];
    const seenNames = new Set<string>();
    const seenEmails = new Set<string>();

    if (currentUser) {
      let cleanSelfName = (currentUser.displayName || 'Titolare').replace(/\s*\(Io\)\s*$/i, '').trim();
      const lowerSelf = cleanSelfName.toLowerCase();
      if (lowerSelf === 'andblasi' || currentUser.email?.toLowerCase() === 'andblasi@gmail.com') {
        cleanSelfName = 'Andrea Blasi';
      } else if (lowerSelf.includes('alvaro') || lowerSelf.includes('fazi')) {
        cleanSelfName = 'Alvaro Fazi';
      }

      list.push({
        uid: currentUser.uid,
        displayName: `${cleanSelfName} (Io)`,
        role: currentUser.role,
        isSelf: true,
      });

      seenNames.add(cleanSelfName.toLowerCase());
      if (cleanSelfName.toLowerCase() === 'andrea blasi') {
        seenNames.add('andblasi');
      }
      if (currentUser.email) {
        seenEmails.add(currentUser.email.toLowerCase().trim());
      }
    }

    users.forEach((u) => {
      let cleanName = (u.displayName || u.email || 'Utente').replace(/\s*\(Io\)\s*$/i, '').trim();
      const lowerName = cleanName.toLowerCase();
      const emailKey = (u.email || '').toLowerCase().trim();

      if (lowerName === 'andblasi' || emailKey === 'andblasi@gmail.com') {
        cleanName = 'Andrea Blasi';
      } else if (lowerName.includes('alvaro') || lowerName.includes('fazi')) {
        cleanName = 'Alvaro Fazi';
      }

      const normalizedKey = cleanName.toLowerCase();

      // Skip if this matches current user or already added user
      if (currentUser && u.uid === currentUser.uid) return;
      if (list.some((item) => item.uid === u.uid)) return;
      if (emailKey && seenEmails.has(emailKey)) return;
      if (seenNames.has(normalizedKey)) return;
      if (normalizedKey === 'andblasi' && seenNames.has('andrea blasi')) return;
      if (normalizedKey === 'andrea blasi' && seenNames.has('andblasi')) return;

      const isUserAdmin = u.role === 'admin' || normalizedKey === 'alvaro fazi' || normalizedKey === 'andrea blasi';

      list.push({
        uid: u.uid,
        displayName: cleanName,
        role: isUserAdmin ? 'admin' : u.role,
        isSelf: false,
      });

      seenNames.add(normalizedKey);
      if (normalizedKey === 'andrea blasi') seenNames.add('andblasi');
      if (emailKey) seenEmails.add(emailKey);
    });

    return list;
  }, [users, currentUser]);

  const [clientId, setClientId] = useState<string>(job?.clientId || clients[0]?.id || '');
  
  // Support multiple assigned workers (squadra di lavoro)
  const [assignedWorkerIds, setAssignedWorkerIds] = useState<string[]>(() => {
    if (job?.assignedWorkerIds && job.assignedWorkerIds.length > 0) {
      return [...job.assignedWorkerIds];
    }
    if (job?.assignedWorkerId) {
      return [job.assignedWorkerId];
    }
    if (currentUser?.uid) return [currentUser.uid];
    const firstWorker = users.find((u) => u.role === 'worker');
    return firstWorker ? [firstWorker.uid] : [];
  });

  const toggleWorkerSelection = (workerUid: string) => {
    setAssignedWorkerIds((prev) => {
      if (prev.includes(workerUid)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((id) => id !== workerUid);
      } else {
        return [...prev, workerUid];
      }
    });
  };

  const [date, setDate] = useState<string>(
    job?.date || initialDate || formatLocalDate(new Date())
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
    return [job?.date || initialDate || formatLocalDate(new Date())];
  });
  const [dateToAdd, setDateToAdd] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatLocalDate(d);
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
    const lastDateStr = plannedDates[plannedDates.length - 1] || formatLocalDate(new Date());
    const lastDate = parseLocalDate(lastDateStr);
    lastDate.setDate(lastDate.getDate() + days);
    const newStr = formatLocalDate(lastDate);
    handleAddPlannedDate(newStr);
  };

  // Gestione Acconti (Installments)
  const [installments, setInstallments] = useState<PaymentInstallment[]>(job?.installments || []);
  const [isAddingInstallment, setIsAddingInstallment] = useState(false);
  const [instAmount, setInstAmount] = useState<number>(50);
  const [instDate, setInstDate] = useState<string>(formatLocalDate(new Date()));
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

  // Equipment Required & Hours of Usage
  const [equipmentRequired, setEquipmentRequired] = useState<EquipmentRequirement[]>(
    job?.equipmentRequired || []
  );
  const [selectedEquipId, setSelectedEquipId] = useState<string>('');
  const [selectedEquipHours, setSelectedEquipHours] = useState<number>(2);

  const handleAddEquipment = () => {
    if (!selectedEquipId) return;
    const invItem = inventory.find((i) => i.id === selectedEquipId);
    if (!invItem) return;

    if (equipmentRequired.some((e) => e.itemId === invItem.id)) {
      setEquipmentRequired((prev) =>
        prev.map((e) =>
          e.itemId === invItem.id ? { ...e, hoursUsed: e.hoursUsed + selectedEquipHours } : e
        )
      );
    } else {
      setEquipmentRequired((prev) => [
        ...prev,
        {
          itemId: invItem.id,
          name: invItem.name,
          hoursUsed: selectedEquipHours,
        },
      ]);
    }
    setSelectedEquipId('');
    setSelectedEquipHours(2);
  };

  const handleRemoveEquipment = (itemId: string) => {
    setEquipmentRequired((prev) => prev.filter((e) => e.itemId !== itemId));
  };

  const handleUpdateEquipmentHours = (itemId: string, hours: number) => {
    setEquipmentRequired((prev) =>
      prev.map((e) => (e.itemId === itemId ? { ...e, hoursUsed: Math.max(0, hours) } : e))
    );
  };

  const [sessionsCount, setSessionsCount] = useState<number>(
    job?.sessionsCount || (job?.plannedDates ? job.plannedDates.length : 1)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    // Resolve all assigned workers (squadra)
    const selectedWorkers = availableWorkers.filter((w) => assignedWorkerIds.includes(w.uid));
    const fallbackWorker = availableWorkers[0] || {
      uid: currentUser?.uid || 'unknown',
      displayName: currentUser?.displayName || 'Titolare',
      role: 'admin',
      isSelf: true,
    };
    const primaryWorker = selectedWorkers[0] || fallbackWorker;
    const workerNames = selectedWorkers.length > 0
      ? selectedWorkers.map((w) => (w.isSelf ? (currentUser?.displayName || 'Titolare') : w.displayName))
      : [primaryWorker.displayName];
    const combinedWorkerName = workerNames.join(', ');

    onSave({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientAddress: selectedClient.address,
      clientPhone: selectedClient.phone,
      lat: selectedClient.lat,
      lng: selectedClient.lng,
      assignedWorkerId: primaryWorker.uid,
      assignedWorkerName: combinedWorkerName,
      assignedWorkerIds: assignedWorkerIds.length > 0 ? assignedWorkerIds : [primaryWorker.uid],
      assignedWorkerNames: workerNames,
      date: interventionType === 'generale' ? (plannedDates[0] || date) : (date || plannedDates[0] || formatLocalDate(new Date())),
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
      equipmentRequired,
      interventionType,
      billingArrangement: interventionType === 'generale' ? billingArrangement : 'standard',
      frequency: interventionType === 'generale' ? `${plannedDates.length} uscite programmate` : undefined,
      sessionsCount: interventionType === 'generale' ? plannedDates.length : (sessionsCount || 1),
      ratePerSession: Number(ratePerSession),
      pricingMode: pricingMode,
      hourlyRate: Number(hourlyRate),
      estimatedHoursPerSession: Number(estimatedHoursPerSession),
      plannedDates: interventionType === 'generale' ? plannedDates : undefined,
      billingTermsNote: interventionType === 'generale' ? billingTermsNote : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900 text-slate-100 overflow-y-auto flex flex-col min-h-screen">
      {/* Full Page Header Bar */}
      <div className="sticky top-0 z-50 bg-slate-950 text-white p-[7px] px-3 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-1 px-2.5 rounded-[7px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            ← Indietro
          </button>
          <h2 className="text-sm font-bold pl-1">
            {job ? 'Modifica Intervento' : 'Pianifica Nuovo Intervento'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-[7px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Full Page Body */}
      <div className="w-full max-w-3xl mx-auto p-3 space-y-[7px] flex-1 pb-16">
        <form onSubmit={handleSubmit} className="space-y-[7px] text-xs text-slate-700 dark:text-slate-300">
          
          {/* Client Selection */}
          <div className="space-y-[7px]">
            {(() => {
              const selectedClient = clients.find((c) => c.id === clientId);
              const selectedColor = selectedClient ? getClientColor(selectedClient) : undefined;

              return (
                <>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Committente / Cantiere *
                    </label>
                    {selectedClient && selectedColor && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-slate-800/80 border border-slate-700 text-[10px] font-bold">
                        <span className="w-2 h-2 rounded-full shadow-2xs" style={{ backgroundColor: selectedColor }} />
                        <span style={{ color: selectedColor }}>{selectedClient.name}</span>
                      </div>
                    )}
                  </div>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    style={selectedColor ? { borderLeftColor: selectedColor, borderLeftWidth: '3.5px' } : undefined}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.address} ({c.gardenNotes.squareMeters} mq)
                      </option>
                    ))}
                  </select>
                </>
              );
            })()}
          </div>

          {/* Operai Assegnati (supporto esecutori multipli / squadra) */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-[7px] border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>OPERAI ASSEGNATI ({assignedWorkerIds.length}) *</span>
              </label>
              <div className="flex items-center gap-2">
                {currentUser && !assignedWorkerIds.includes(currentUser.uid) && (
                  <button
                    type="button"
                    onClick={() => toggleWorkerSelection(currentUser.uid)}
                    className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    title="Aggiungi me stesso alla squadra"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>+ Aggiungi me</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (assignedWorkerIds.length === availableWorkers.length) {
                      setAssignedWorkerIds([availableWorkers[0]?.uid || '']);
                    } else {
                      setAssignedWorkerIds(availableWorkers.map((w) => w.uid));
                    }
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer font-bold"
                >
                  {assignedWorkerIds.length === availableWorkers.length ? 'Solo uno' : 'Tutti'}
                </button>
              </div>
            </div>

            {/* Chips operai con selezione multipla (tocca per aggiungere/togliere) */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {availableWorkers.map((w) => {
                const isSelected = assignedWorkerIds.includes(w.uid);
                return (
                  <button
                    key={w.uid}
                    type="button"
                    onClick={() => toggleWorkerSelection(w.uid)}
                    className={`px-2 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs ring-1 ring-emerald-500/40'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <User className={`w-3 h-3 ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`} />
                    <span>{w.isSelf ? `${w.displayName} (Tu)` : w.displayName}</span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-white ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & TimeSlot (Coordinati e affiancati) */}
          <div className="grid grid-cols-2 gap-[7px]">
            <div className="space-y-[7px]">
              <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs uppercase tracking-wider">
                DATA INTERVENTO *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  const val = e.target.value;
                  setDate(val);
                  setPlannedDates([val]);
                }}
                className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-[7px]">
              <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs uppercase tracking-wider flex items-center justify-between">
                <span>FASCIA ORARIA</span>
                {pricingMode === 'hourly' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal font-mono">
                    ({estimatedHoursPerSession}h stimate)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="es. 08:30 - 12:30"
                className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-[7px]">
            <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs uppercase tracking-wider">
              TITOLO INTERVENTO *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Sfalcio prato e potatura siepe"
              className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs focus:outline-emerald-600 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Rich Note Box per Descrizione Intervento (identico a Note Operative cliente) */}
          <div className="space-y-[7px]">
            <RichNoteBox
              label="DESCRIZIONE INTERVENTO"
              value={description}
              onChange={setDescription}
              placeholder="es. Dettagli lavorazione, specifiche intervento, attrezzatura e istruzioni..."
            />
          </div>

          {/* Tipologia Intervento: Singolo vs Periodico */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[7px] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                <span>TIPOLOGIA INTERVENTO</span>
              </label>
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
                <span>Singolo</span>
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
                <span>Periodico</span>
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
                      const formatted = formatItalianDate(dStr, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
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
            <span className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-[7px]">
                <Euro className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>Importo Lavoro & Gestione Pagamento</span>
              </span>
            </span>

            {/* Tariffazione (Scegli tra Giornata, Oraria, A Corpo) */}
            <div className="space-y-1.5 p-2 bg-white dark:bg-slate-900 rounded-[7px] border border-slate-200 dark:border-slate-700 shadow-2xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs uppercase tracking-wider">
                Tariffazione
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'per_session', label: 'Giornata' },
                  { id: 'hourly', label: 'Oraria' },
                  { id: 'fixed', label: 'A Corpo' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      const m = mode.id as 'hourly' | 'per_session' | 'fixed';
                      setPricingMode(m);
                      if (m === 'per_session') {
                        const count = interventionType === 'generale' ? plannedDates.length : (sessionsCount || 1);
                        setPrice((ratePerSession || 120) * count);
                      } else if (m === 'hourly') {
                        const count = interventionType === 'generale' ? plannedDates.length : (sessionsCount || 1);
                        setPrice((hourlyRate || 30) * (estimatedHoursPerSession || 4) * count);
                      }
                    }}
                    className={`py-1.5 px-2 rounded-[6px] text-xs font-bold border transition-all cursor-pointer text-center ${
                      pricingMode === mode.id
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Dettagli specifici per la tariffazione scelta */}
              {pricingMode === 'per_session' && (
                <div className="pt-1.5 grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Tariffa Giornaliera (€/gg) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={ratePerSession}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setRatePerSession(val);
                          const count = interventionType === 'generale' ? plannedDates.length : (sessionsCount || 1);
                          setPrice(val * count);
                        }}
                        className="w-full p-1.5 pl-6 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      N. Giornate / Uscite
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={interventionType === 'generale' ? plannedDates.length : sessionsCount}
                      disabled={interventionType === 'generale'}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setSessionsCount(val);
                        setPrice((ratePerSession || 120) * val);
                      }}
                      className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs font-mono font-bold text-slate-900 dark:text-slate-100 disabled:opacity-70 focus:outline-emerald-600"
                    />
                  </div>
                </div>
              )}

              {pricingMode === 'hourly' && (
                <div className="pt-1.5 grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Tariffa Oraria (€/h) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={hourlyRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setHourlyRate(val);
                          const count = interventionType === 'generale' ? plannedDates.length : (sessionsCount || 1);
                          setPrice(val * (estimatedHoursPerSession || 4) * count);
                        }}
                        className="w-full p-1.5 pl-6 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Ore Stimate (h)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={estimatedHoursPerSession}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        setEstimatedHoursPerSession(val);
                        const count = interventionType === 'generale' ? plannedDates.length : (sessionsCount || 1);
                        setPrice((hourlyRate || 30) * val * count);
                      }}
                      className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Prezzo e Incassato Finora */}
            <div className="grid grid-cols-2 gap-2">
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

            {/* Sezione Acconti Ricevuti (quando il lavoro è in essere) */}
            <div className="pt-2.5 mt-2.5 border-t border-dashed border-emerald-300 dark:border-emerald-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wide block">
                    Acconti Ricevuti ({installments.length})
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
                  <span>{isAddingInstallment ? 'Annulla' : 'Acconto'}</span>
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

          {/* Attrezzatura Richiesta & Ore Utilizzo */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[7px] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>ATTREZZATURA & ORE DI UTILIZZO</span>
              </label>
              {equipmentRequired.length > 0 && (
                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded-[4px]">
                  {equipmentRequired.reduce((sum, eq) => sum + (eq.hoursUsed || 0), 0)}h conteggiate
                </span>
              )}
            </div>

            {/* Elenco attrezzature già selezionate */}
            {equipmentRequired.length > 0 && (
              <div className="space-y-1.5">
                {equipmentRequired.map((equip) => {
                  const invItem = inventory.find((i) => i.id === equip.itemId);
                  return (
                    <div
                      key={equip.itemId}
                      className="flex items-center justify-between p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {equip.name}
                        </span>
                        {invItem?.currentUsageHours !== undefined && (
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            (Giri attuali: {invItem.currentUsageHours}h)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={equip.hoursUsed}
                            onChange={(e) =>
                              handleUpdateEquipmentHours(equip.itemId, parseFloat(e.target.value) || 0)
                            }
                            className="w-14 p-1 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[5px] text-xs"
                          />
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            ore
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(equip.itemId)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-[7px] p-1 cursor-pointer transition-colors"
                          title="Rimuovi attrezzatura"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selettore per aggiungere attrezzatura con ore di utilizzo */}
            <div className="flex items-center gap-1.5 pt-1 w-full min-w-0">
              <select
                value={selectedEquipId}
                onChange={(e) => setSelectedEquipId(e.target.value)}
                className="flex-1 min-w-0 p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs text-slate-900 dark:text-slate-100 truncate focus:outline-emerald-600"
              >
                <option value="">Seleziona Attrezzatura</option>
                {inventory
                  .filter((i) => i.category === 'equipment')
                  .map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} {eq.brand ? `(${eq.brand})` : ''} - Ore attuali: {eq.currentUsageHours}h
                    </option>
                  ))}
              </select>

              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={selectedEquipHours}
                  onChange={(e) => setSelectedEquipHours(parseFloat(e.target.value) || 0.5)}
                  placeholder="Ore"
                  title="Ore di utilizzo da conteggiare"
                  className="w-12 sm:w-14 p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-mono font-bold text-center text-slate-900 dark:text-slate-100"
                />
                <span className="text-[10px] font-bold text-slate-500">h</span>
              </div>

              <button
                type="button"
                onClick={handleAddEquipment}
                disabled={!selectedEquipId}
                className="shrink-0 px-2.5 py-1.5 bg-slate-800 dark:bg-emerald-700 hover:bg-slate-700 dark:hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-[7px] text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1 whitespace-nowrap"
                title="Aggiungi attrezzatura al cantiere"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi</span>
              </button>
            </div>
          </div>

          {/* Status - Rinomina in AGGIORNA LAVORAZIONE e senza righe sopra/sotto */}
          <div className="space-y-[7px]">
            <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs uppercase tracking-wider">
              AGGIORNA LAVORAZIONE
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full p-[7px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[7px] text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
            >
              <option value="scheduled">Programmato</option>
              <option value="in_progress">In Corso</option>
              <option value="completed">Completato</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>

          {/* Action Footer senza divisore sopra */}
          <div className="pt-2 flex items-center justify-end gap-[7px]">
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
