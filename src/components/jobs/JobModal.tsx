import React, { useState, useMemo } from 'react';
import { Job, JobStatus, JobPaymentStatus, MaterialRequirement, PaymentMethod, PaymentInstallment } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Trash2, Package, Euro, User, UserCheck, Plus, Check } from 'lucide-react';

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
      date,
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

          {/* Financial & Payment Section - Con Tastini Cliccabili leggibili, senza emoticon e senza spunta */}
          <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-[7px] space-y-2.5">
            <span className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block text-[11px] flex items-center gap-[7px]">
              <Euro className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              Importo Lavoro & Gestione Pagamento
            </span>

            {/* Prezzo e Incassato Finora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                  Prezzo Intervento (€) *
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

            {/* Stato Pagamento - Tastini Cliccabili senza tendina, senza spunta e con testo per intero */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                Stato Pagamento
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                      className={`flex items-center justify-center py-2 px-3 rounded-[7px] text-xs font-bold transition-all cursor-pointer border text-center ${
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

            {/* Modalità Pagamento - Tastini Cliccabili senza emoticon e senza spunta */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                Modalità Pagamento Predefinita *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex items-center justify-center py-2 px-2.5 rounded-[7px] text-xs font-bold transition-all cursor-pointer border text-center ${
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
                  <span>{isAddingInstallment ? 'Annulla' : '+ Aggiungi Acconto'}</span>
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

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Modalità Pagamento Acconto
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
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
          <div className="p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] space-y-[7px]">
            <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px] flex items-center gap-[7px]">
              <Package className="w-3.5 h-3.5 text-emerald-700" />
              Materiali Richiesti dal Magazzino
            </span>

            {materialsRequired.length > 0 && (
              <div className="space-y-[7px]">
                {materialsRequired.map((mat) => (
                  <div
                    key={mat.itemId}
                    className="flex items-center justify-between p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs"
                  >
                    <span className="font-medium text-slate-800">{mat.name}</span>
                    <div className="flex items-center gap-[7px]">
                      <span className="font-mono font-bold text-emerald-800">
                        {mat.qtyNeeded} {mat.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(mat.itemId)}
                        className="text-slate-400 hover:text-rose-600 rounded-[7px] p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selector to add requirement */}
            <div className="flex items-center gap-[7px] pt-1">
              <select
                value={selectedMatId}
                onChange={(e) => setSelectedMatId(e.target.value)}
                className="flex-1 p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs"
              >
                <option value="">Seleziona materiale da associare...</option>
                {inventory
                  .filter((i) => i.category === 'material')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.quantity} {m.unit} disponibili)
                    </option>
                  ))}
              </select>

              <input
                type="number"
                min="1"
                value={selectedMatQty}
                onChange={(e) => setSelectedMatQty(parseInt(e.target.value) || 1)}
                className="w-16 p-[7px] bg-white border border-slate-200 rounded-[7px] text-xs font-mono font-bold text-right"
              />

              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-[7px] text-xs"
              >
                Aggiungi
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="pt-[7px] border-t border-slate-200 space-y-[7px]">
            <label className="font-semibold text-slate-700 block">Stato Lavoro</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] text-xs font-bold"
            >
              <option value="scheduled">Programmato</option>
              <option value="in_progress">In Corso</option>
              <option value="completed">Completato</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>

          {/* Action Footer */}
          <div className="pt-[7px] border-t border-slate-200 flex items-center justify-end gap-[7px]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-[7px] font-medium"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold shadow-xs flex items-center gap-[7px]"
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
