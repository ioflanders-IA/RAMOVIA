import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, WorkedDay, DayType, PaymentMethod } from '../../types';
import {
  Users,
  Plus,
  Calendar,
  Wallet,
  Clock,
  Euro,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  HardHat,
  Phone,
  FileText,
  CreditCard,
  Building2,
  Sparkles,
} from 'lucide-react';

export const SquadWorkersRegistry: React.FC = () => {
  const {
    users,
    workedDays,
    addWorkedDay,
    deleteWorkedDay,
    updateWorkedDay,
    addOfflineWorker,
    updateUser,
    deleteUser,
    payouts,
    recordWorkerPayout,
    clients,
    jobs,
    currentUser,
  } = useApp();

  // Current Month State (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7);
  });

  // Modal States
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

  // New Worker Form
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerDailyRate, setNewWorkerDailyRate] = useState<number>(90);
  const [newWorkerHourlyRate, setNewWorkerHourlyRate] = useState<number>(15);
  const [newWorkerNotes, setNewWorkerNotes] = useState('');

  // Add Worked Day Form
  const [dayWorkerId, setDayWorkerId] = useState<string>('');
  const [dayDate, setDayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dayType, setDayType] = useState<DayType>('full');
  const [dayHours, setDayHours] = useState<number>(8);
  const [dayRate, setDayRate] = useState<number>(90);
  const [dayAmount, setDayAmount] = useState<number>(90);
  const [dayCantiere, setDayCantiere] = useState<string>('');
  const [dayNotes, setDayNotes] = useState<string>('');

  // Payout Form
  const [payoutWorker, setPayoutWorker] = useState<User | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<PaymentMethod>('bonifico');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

  // Filter worked days for current selected month
  const monthWorkedDays = useMemo(() => {
    return workedDays.filter((wd) => wd.date.startsWith(selectedMonth));
  }, [workedDays, selectedMonth]);

  // List of workers
  const workers = useMemo(() => {
    return users.filter((u) => u.role === 'worker');
  }, [users]);

  // Calculate worker stats for this month
  const workerStats = useMemo(() => {
    return workers.map((worker) => {
      const days = monthWorkedDays.filter((wd) => wd.workerId === worker.uid);
      const totalDaysCount = days.reduce((sum, d) => {
        if (d.dayType === 'full') return sum + 1.0;
        if (d.dayType === 'half') return sum + 0.5;
        return sum + (d.hours ? d.hours / 8 : 1.0);
      }, 0);

      const totalEarned = days.reduce((sum, d) => sum + (d.amount || 0), 0);

      const workerPayoutsThisMonth = payouts.filter(
        (p) => p.workerId === worker.uid && (p.period === selectedMonth || p.paymentDate?.startsWith(selectedMonth))
      );
      const totalPaid = workerPayoutsThisMonth.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

      const pendingToPay = Math.max(0, totalEarned - totalPaid);

      return {
        worker,
        days,
        totalDaysCount,
        totalEarned,
        totalPaid,
        pendingToPay,
      };
    });
  }, [workers, monthWorkedDays, payouts, selectedMonth]);

  // Global KPIs for the month
  const totalDueAllWorkers = useMemo(() => {
    return workerStats.reduce((sum, s) => sum + s.pendingToPay, 0);
  }, [workerStats]);

  const totalEarnedAllWorkers = useMemo(() => {
    return workerStats.reduce((sum, s) => sum + s.totalEarned, 0);
  }, [workerStats]);

  const totalDaysAllWorkers = useMemo(() => {
    return workerStats.reduce((sum, s) => sum + s.totalDaysCount, 0);
  }, [workerStats]);

  const totalPaidAllWorkers = useMemo(() => {
    return workerStats.reduce((sum, s) => sum + s.totalPaid, 0);
  }, [workerStats]);

  // Format month name in Italian (e.g., "Ottobre 2026")
  const formattedMonthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prev = new Date(year, month - 2, 1);
    setSelectedMonth(prev.toISOString().substring(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month, 1);
    setSelectedMonth(next.toISOString().substring(0, 7));
  };

  const handleResetCurrentMonth = () => {
    setSelectedMonth(new Date().toISOString().substring(0, 7));
  };

  // When changing worker or dayType in AddDay modal, auto-calculate dayAmount
  const handleSelectDayWorker = (workerId: string) => {
    setDayWorkerId(workerId);
    const w = workers.find((u) => u.uid === workerId);
    const rate = w?.dailyRate || 90;
    setDayRate(rate);
    calculateAmount(rate, dayType, dayHours);
  };

  const handleDayTypeChange = (type: DayType) => {
    setDayType(type);
    calculateAmount(dayRate, type, dayHours);
  };

  const handleHoursChange = (h: number) => {
    setDayHours(h);
    calculateAmount(dayRate, 'custom', h);
  };

  const handleRateChange = (r: number) => {
    setDayRate(r);
    calculateAmount(r, dayType, dayHours);
  };

  const calculateAmount = (rate: number, type: DayType, hours: number) => {
    if (type === 'full') {
      setDayAmount(rate);
    } else if (type === 'half') {
      setDayAmount(Math.round((rate / 2) * 100) / 100);
    } else {
      const hourly = rate / 8;
      setDayAmount(Math.round(hourly * hours * 100) / 100);
    }
  };

  // Submit New Offline Worker
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;

    await addOfflineWorker({
      displayName: newWorkerName.trim(),
      phone: newWorkerPhone.trim(),
      dailyRate: Number(newWorkerDailyRate) || 90,
      hourlyRate: Number(newWorkerHourlyRate) || 15,
      notes: newWorkerNotes.trim(),
    });

    setNewWorkerName('');
    setNewWorkerPhone('');
    setNewWorkerDailyRate(90);
    setNewWorkerHourlyRate(15);
    setNewWorkerNotes('');
    setShowAddWorkerModal(false);
  };

  // Submit New Worked Day
  const handleSaveWorkedDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayWorkerId || !dayDate) return;

    const worker = workers.find((w) => w.uid === dayWorkerId);
    if (!worker) return;

    await addWorkedDay({
      workerId: worker.uid,
      workerName: worker.displayName,
      date: dayDate,
      dayType,
      hours: dayType === 'custom' ? dayHours : dayType === 'full' ? 8 : 4,
      dailyRate: Number(dayRate) || 90,
      amount: Number(dayAmount) || 90,
      cantiereName: dayCantiere.trim() || undefined,
      notes: dayNotes.trim() || undefined,
    });

    // Reset and close
    setShowAddDayModal(false);
    setDayCantiere('');
    setDayNotes('');
  };

  // Submit Payout
  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutWorker || payoutAmount <= 0) return;

    await recordWorkerPayout({
      workerId: payoutWorker.uid,
      workerName: payoutWorker.displayName,
      period: selectedMonth,
      totalHours: 0,
      daysWorked: 0,
      hourlyRate: payoutWorker.hourlyRate || 15,
      totalAmount: Number(payoutAmount),
      paymentMethod: payoutMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'paid',
      notes: payoutNotes.trim() || `Saldo / Acconto compenso ${formattedMonthLabel}`,
    });

    setShowPayoutModal(false);
    setPayoutWorker(null);
    setPayoutAmount(0);
    setPayoutNotes('');
  };

  // Save Worker Edit
  const handleUpdateWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    await updateUser(editingWorker);
    setEditingWorker(null);
  };

  return (
    <div className="space-y-[7px]">
      
      {/* Month Selector Bar & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-[7px]">
        {/* Month Navigation */}
        <div className="flex items-center gap-[7px]">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-[7px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Mese precedente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
              {formattedMonthLabel}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-[7px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Mese successivo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedMonth !== new Date().toISOString().substring(0, 7) && (
            <button
              onClick={handleResetCurrentMonth}
              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 underline ml-1 cursor-pointer"
            >
              Mese attuale
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-[7px]">
          <button
            onClick={() => {
              if (workers.length > 0) {
                setDayWorkerId(workers[0].uid);
                const rate = workers[0].dailyRate || 90;
                setDayRate(rate);
                setDayAmount(rate);
              }
              setDayDate(new Date().toISOString().split('T')[0]);
              setDayType('full');
              setShowAddDayModal(true);
            }}
            className="flex items-center gap-1.5 p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Inserisci Giornata Lavorata</span>
          </button>

          <button
            onClick={() => setShowAddWorkerModal(true)}
            className="flex items-center gap-1.5 p-[7px] px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-[7px] font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Nuovo Operaio Offline</span>
          </button>
        </div>
      </div>

      {/* KPI STATS: TOTALE DA DARE AGLI OPERAI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[7px]">
        {/* BIG HIGHLIGHT: TOTALE DA DARE */}
        <div className="bg-emerald-950 text-white border border-emerald-900 rounded-[7px] p-[7px] shadow-sm space-y-[7px]">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">Totale da Dare agli Operai</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            € {totalDueAllWorkers.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-200/80 flex items-center justify-between">
            <span>Rimanenza a fine mese</span>
            <span>{workers.length} operai</span>
          </div>
        </div>

        {/* Totale Maturato nel Mese */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Compenso Maturato</span>
            <Euro className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            € {totalEarnedAllWorkers.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Calcolato sulle giornate inserite
          </div>
        </div>

        {/* Giornate Lavorate Totali */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Giornate Lavoro</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-700 dark:text-sky-400">
            {totalDaysAllWorkers.toFixed(1)} gg
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Nel mese di {formattedMonthLabel}
          </div>
        </div>

        {/* Già Pagati / Acconti */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Già Liquidato</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            € {totalPaidAllWorkers.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Acconti e saldi registrati
          </div>
        </div>
      </div>

      {/* SCHEDE OPERAI: RIEPILOGO TOTALE DA DARE AD OGNUNO */}
      <div className="space-y-[7px]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Compensi Operai per {formattedMonthLabel} ({workers.length})</span>
          </h2>
          <span className="text-[10px] text-slate-500">
            Clicca su "Vedi Giornate" per espandere il dettaglio
          </span>
        </div>

        {workers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-8 text-center text-xs text-slate-500 space-y-[7px]">
            <HardHat className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Nessun operaio ancora inserito nella squadra.
            </p>
            <p className="text-[11px]">
              Puoi creare subito i tuoi operai "offline" anche se non hanno fatto l'accesso con Google.
            </p>
            <button
              onClick={() => setShowAddWorkerModal(true)}
              className="inline-flex items-center gap-1.5 p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Primo Operaio</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[7px]">
            {workerStats.map((st) => {
              const isExpanded = expandedWorkerId === st.worker.uid;

              return (
                <div
                  key={st.worker.uid}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px] flex flex-col justify-between"
                >
                  <div className="space-y-[7px]">
                    {/* Header Card Operaio */}
                    <div className="flex items-start justify-between gap-[7px]">
                      <div className="flex items-center gap-[7px] min-w-0">
                        <div className="w-8 h-8 rounded-[7px] bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {st.worker.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {st.worker.displayName}
                            </h3>
                            {st.worker.isOfflineWorker ? (
                              <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[9px] rounded uppercase border border-slate-200 dark:border-slate-700">
                                Offline
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[9px] rounded uppercase border border-emerald-200 dark:border-emerald-800">
                                Google
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {st.worker.phone || 'Nessun telefono'} · Cod: {st.worker.workerCode || 'OP----'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingWorker(st.worker)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Modifica tariffa o dati operaio"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Riepilogo Giornate & Totale da Dare */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-[7px] rounded-[7px] space-y-[7px] text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Tariffa Giornaliera:</span>
                        <strong className="font-mono text-slate-900 dark:text-slate-100">
                          € {(st.worker.dailyRate || 90).toFixed(2)} / gg
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Giornate Lavorate nel Mese:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {st.totalDaysCount.toFixed(1)} gg
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Totale Maturato:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">
                          € {st.totalEarned.toFixed(2)}
                        </strong>
                      </div>

                      {st.totalPaid > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">Acconti / Pagati:</span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400">
                            - € {st.totalPaid.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* TOTALE DA DARE HIGHLIGHT */}
                      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase">
                          Totale da Dare:
                        </span>
                        <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded-[7px] border border-emerald-300 dark:border-emerald-800">
                          € {st.pendingToPay.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pulsanti Azione Operaio */}
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setDayWorkerId(st.worker.uid);
                          setDayRate(st.worker.dailyRate || 90);
                          setDayAmount(st.worker.dailyRate || 90);
                          setDayDate(new Date().toISOString().split('T')[0]);
                          setDayType('full');
                          setShowAddDayModal(true);
                        }}
                        className="flex-1 p-[7px] bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Giornata</span>
                      </button>

                      <button
                        onClick={() => {
                          setPayoutWorker(st.worker);
                          setPayoutAmount(st.pendingToPay > 0 ? st.pendingToPay : st.totalEarned);
                          setPayoutMethod('bonifico');
                          setPayoutNotes(`Saldo compenso ${formattedMonthLabel}`);
                          setShowPayoutModal(true);
                        }}
                        className="p-[7px] px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-[7px] font-bold text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        title="Registra Pagamento / Acconto"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Salda</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setExpandedWorkerId(isExpanded ? null : st.worker.uid)}
                      className="w-full text-center py-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 underline cursor-pointer"
                    >
                      {isExpanded ? 'Nascondi elenco giornate ▲' : `Vedi giornate lavorate (${st.days.length}) ▼`}
                    </button>

                    {/* Accordion Elenco Giornate Operaio */}
                    {isExpanded && (
                      <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-[7px] space-y-1.5 max-h-48 overflow-y-auto text-[11px]">
                        {st.days.length === 0 ? (
                          <div className="text-slate-400 text-center py-2">
                            Nessuna giornata inserita in questo mese.
                          </div>
                        ) : (
                          st.days.map((d) => (
                            <div
                              key={d.id}
                              className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1"
                            >
                              <div className="min-w-0">
                                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {d.date} ({d.dayType === 'full' ? '1 gg' : d.dayType === 'half' ? '0.5 gg' : `${d.hours}h`})
                                </div>
                                {d.cantiereName && (
                                  <div className="text-[10px] text-slate-500 truncate">
                                    {d.cantiereName}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                  € {d.amount.toFixed(2)}
                                </span>
                                <button
                                  onClick={() => deleteWorkedDay(d.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  title="Elimina giornata"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REGISTRO COMPLETO DELLE GIORNATE LAVORATE DEL MESE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Registro Giornate del Mese ({monthWorkedDays.length} registrazioni)</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            {formattedMonthLabel}
          </span>
        </div>

        {monthWorkedDays.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Nessuna giornata di lavoro inserita per il mese di {formattedMonthLabel}. Clicca su "Inserisci Giornata Lavorata" per iniziare.
          </div>
        ) : (
          <div className="space-y-[7px] max-h-72 overflow-y-auto">
            {monthWorkedDays
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((d) => (
                <div
                  key={d.id}
                  className="p-[7px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] flex items-center justify-between gap-[7px] text-xs"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {d.workerName}
                      </span>
                      <span className="font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold">
                        {d.date}
                      </span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {d.dayType === 'full' ? 'Giornata Intera' : d.dayType === 'half' ? 'Mezza Giornata' : `${d.hours} Ore`}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {d.cantiereName ? `Cantiere: ${d.cantiereName}` : 'Nessun cantiere specificato'}
                      {d.notes && ` · ${d.notes}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                        € {d.amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Tariffa: € {d.dailyRate.toFixed(2)}/gg
                      </div>
                    </div>

                    <button
                      onClick={() => deleteWorkedDay(d.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                      title="Elimina registrazione giornata"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* MODAL: NUOVO OPERAIO OFFLINE */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-[7px] space-y-[7px] shadow-2xl">
            <div className="bg-emerald-950 text-white p-[7px] px-3 rounded-[7px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-300" />
                <h3 className="font-bold text-xs">Crea Operaio "Offline" (Manuale)</h3>
              </div>
              <button onClick={() => setShowAddWorkerModal(false)} className="text-emerald-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug px-1">
              Inserisci i dati dell'operaio per poter monitorare subito le sue giornate lavorate ed assegnargli cantieri, anche se non ha ancora effettuato il login con Google.
            </p>

            <form onSubmit={handleCreateWorker} className="p-[7px] space-y-[7px] text-xs">
              <div className="space-y-[7px]">
                <label className="font-semibold block">Nome e Cognome *</label>
                <input
                  type="text"
                  required
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="es. Mario Rossi"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Numero Telefono</label>
                <input
                  type="tel"
                  value={newWorkerPhone}
                  onChange={(e) => setNewWorkerPhone(e.target.value)}
                  placeholder="+39 347 ..."
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-[7px]">
                  <label className="font-semibold block">Tariffa Giornaliera (€) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newWorkerDailyRate}
                    onChange={(e) => setNewWorkerDailyRate(parseFloat(e.target.value) || 0)}
                    placeholder="90"
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono font-bold text-emerald-600"
                  />
                </div>

                <div className="space-y-[7px]">
                  <label className="font-semibold block">Tariffa Oraria (€)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newWorkerHourlyRate}
                    onChange={(e) => setNewWorkerHourlyRate(parseFloat(e.target.value) || 0)}
                    placeholder="15"
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Note / Competenze</label>
                <input
                  type="text"
                  value={newWorkerNotes}
                  onChange={(e) => setNewWorkerNotes(e.target.value)}
                  placeholder="es. Sfalcio erba, potature, uso decespugliatore"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-[7px]">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="p-[7px] px-3 bg-slate-100 dark:bg-slate-800 rounded-[7px]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="p-[7px] px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px]"
                >
                  Salva Operaio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSERISCI GIORNATA LAVORATA */}
      {showAddDayModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-[7px] space-y-[7px] shadow-2xl">
            <div className="bg-emerald-950 text-white p-[7px] px-3 rounded-[7px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-300" />
                <h3 className="font-bold text-xs">Inserisci Giornata Lavorata</h3>
              </div>
              <button onClick={() => setShowAddDayModal(false)} className="text-emerald-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkedDay} className="p-[7px] space-y-[7px] text-xs">
              <div className="space-y-[7px]">
                <label className="font-semibold block">Seleziona Operaio *</label>
                <select
                  required
                  value={dayWorkerId}
                  onChange={(e) => handleSelectDayWorker(e.target.value)}
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                >
                  <option value="">Seleziona un operaio...</option>
                  {workers.map((w) => (
                    <option key={w.uid} value={w.uid}>
                      {w.displayName} (Tariffa: € {w.dailyRate || 90}/gg) {w.isOfflineWorker ? '· [Offline]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-[7px]">
                  <label className="font-semibold block">Data *</label>
                  <input
                    type="date"
                    required
                    value={dayDate}
                    onChange={(e) => setDayDate(e.target.value)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                  />
                </div>

                <div className="space-y-[7px]">
                  <label className="font-semibold block">Tipologia Giornata</label>
                  <select
                    value={dayType}
                    onChange={(e) => handleDayTypeChange(e.target.value as DayType)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                  >
                    <option value="full">Giornata Intera (100%)</option>
                    <option value="half">Mezza Giornata (50%)</option>
                    <option value="custom">Ore Personalizzate</option>
                  </select>
                </div>
              </div>

              {dayType === 'custom' && (
                <div className="space-y-[7px]">
                  <label className="font-semibold block">Ore Lavorate Effettive</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="16"
                    value={dayHours}
                    onChange={(e) => handleHoursChange(parseFloat(e.target.value) || 1)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-[7px]">
                  <label className="font-semibold block">Tariffa Giornaliera Base (€)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={dayRate}
                    onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono"
                  />
                </div>

                <div className="space-y-[7px]">
                  <label className="font-semibold block">Totale Giornata (€) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={dayAmount}
                    onChange={(e) => setDayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono font-bold text-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Cantiere / Lavoro Svolto</label>
                <input
                  type="text"
                  value={dayCantiere}
                  onChange={(e) => setDayCantiere(e.target.value)}
                  placeholder="es. Villa Alberto - Taglio siepe / Suore di clausura"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Note Giornata</label>
                <input
                  type="text"
                  value={dayNotes}
                  onChange={(e) => setDayNotes(e.target.value)}
                  placeholder="es. Sfalcio prato + concimazione"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-[7px]">
                <button
                  type="button"
                  onClick={() => setShowAddDayModal(false)}
                  className="p-[7px] px-3 bg-slate-100 dark:bg-slate-800 rounded-[7px]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="p-[7px] px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px]"
                >
                  Salva Giornata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRA PAGAMENTO / SALDO COMPENSO */}
      {showPayoutModal && payoutWorker && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-[7px] space-y-[7px] shadow-2xl">
            <div className="bg-slate-900 text-white p-[7px] px-3 rounded-[7px] flex items-center justify-between">
              <h3 className="font-bold text-xs">
                Registra Compenso a {payoutWorker.displayName}
              </h3>
              <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayout} className="p-[7px] space-y-[7px] text-xs">
              <div className="space-y-[7px]">
                <label className="font-semibold block">Importo Erogato (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono font-bold text-emerald-600 text-sm"
                />
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Modalità Pagamento</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as PaymentMethod)}
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                >
                  <option value="bonifico">Bonifico Bancario</option>
                  <option value="contanti">Contanti Diretti</option>
                  <option value="pos_carta">Carta / POS</option>
                  <option value="assegno">Assegno</option>
                </select>
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Note / Causale</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="es. Saldo compenso mese di Ottobre"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-[7px]">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="p-[7px] px-3 bg-slate-100 dark:bg-slate-800 rounded-[7px]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="p-[7px] px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px]"
                >
                  Registra Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MODIFICA OPERAIO & TARIFFA */}
      {editingWorker && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-[7px] space-y-[7px] shadow-2xl">
            <div className="bg-slate-900 text-white p-[7px] px-3 rounded-[7px] flex items-center justify-between">
              <h3 className="font-bold text-xs">Modifica Operaio: {editingWorker.displayName}</h3>
              <button onClick={() => setEditingWorker(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateWorkerSubmit} className="p-[7px] space-y-[7px] text-xs">
              <div className="space-y-[7px]">
                <label className="font-semibold block">Nome e Cognome *</label>
                <input
                  type="text"
                  required
                  value={editingWorker.displayName}
                  onChange={(e) => setEditingWorker({ ...editingWorker, displayName: e.target.value })}
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Telefono</label>
                <input
                  type="tel"
                  value={editingWorker.phone || ''}
                  onChange={(e) => setEditingWorker({ ...editingWorker, phone: e.target.value })}
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-[7px]">
                  <label className="font-semibold block">Tariffa Giornaliera (€) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={editingWorker.dailyRate || 90}
                    onChange={(e) => setEditingWorker({ ...editingWorker, dailyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono font-bold text-emerald-600"
                  />
                </div>

                <div className="space-y-[7px]">
                  <label className="font-semibold block">Tariffa Oraria (€)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingWorker.hourlyRate || 15}
                    onChange={(e) => setEditingWorker({ ...editingWorker, hourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Note</label>
                <input
                  type="text"
                  value={editingWorker.notes || ''}
                  onChange={(e) => setEditingWorker({ ...editingWorker, notes: e.target.value })}
                  placeholder="Specializzazioni o riferimenti"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="pt-2 flex justify-between gap-[7px]">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Sei sicuro di voler rimuovere l'operaio ${editingWorker.displayName}?`)) {
                      deleteUser(editingWorker.uid);
                      setEditingWorker(null);
                    }
                  }}
                  className="p-[7px] px-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-[7px] hover:bg-rose-100 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Rimuovi</span>
                </button>

                <div className="flex gap-[7px]">
                  <button
                    type="button"
                    onClick={() => setEditingWorker(null)}
                    className="p-[7px] px-3 bg-slate-100 dark:bg-slate-800 rounded-[7px]"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="p-[7px] px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px]"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
