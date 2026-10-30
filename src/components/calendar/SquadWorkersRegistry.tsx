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
  BarChart3,
  TrendingUp,
  Check,
  CheckSquare,
  Square,
  ArrowRight,
  DollarSign,
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
  const [confirmDeleteWorkerId, setConfirmDeleteWorkerId] = useState<string | null>(null);

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
  const [dayHourlyRate, setDayHourlyRate] = useState<number>(15);
  const [dayAmount, setDayAmount] = useState<number>(90);
  const [dayCantiere, setDayCantiere] = useState<string>('');
  const [dayNotes, setDayNotes] = useState<string>('');

  // Payout Form
  const [payoutWorker, setPayoutWorker] = useState<User | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<PaymentMethod>('bonifico');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

  // Riepilogo SubView & Filter States
  const [subView, setSubView] = useState<'registry' | 'summary'>('registry');
  const [summaryFilter, setSummaryFilter] = useState<'weekend' | 'all' | string>('weekend');
  const [quickPayWorkerId, setQuickPayWorkerId] = useState<string | null>(null);
  const [quickPayMethod, setQuickPayMethod] = useState<PaymentMethod>('contanti');
  const [quickPaySuccessMsg, setQuickPaySuccessMsg] = useState<string | null>(null);

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
      const totalPaidFromPayouts = workerPayoutsThisMonth.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const totalPaidFromDays = days.filter((d) => d.paid).reduce((sum, d) => sum + (d.amount || 0), 0);
      const totalPaid = Math.max(totalPaidFromPayouts, totalPaidFromDays);

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

  // Calcolo delle settimane e dei fine settimana del mese selezionato
  const monthWeeks = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const weeks: Array<{
      id: string;
      weekNum: number;
      label: string;
      shortLabel: string;
      startDate: string;
      endDate: string;
      weekendDates: string[]; // Venerdì, Sabato, Domenica
      allDates: string[];
    }> = [];

    let currentStart = 1;
    let weekNum = 1;

    while (currentStart <= daysInMonth) {
      const dObj = new Date(year, month - 1, currentStart);
      const dayOfWeek = dObj.getDay(); // 0 = Sun, 1 = Mon ...
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const currentEnd = Math.min(daysInMonth, currentStart + daysUntilSunday);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const startStr = `${year}-${pad(month)}-${pad(currentStart)}`;
      const endStr = `${year}-${pad(month)}-${pad(currentEnd)}`;

      const allDates: string[] = [];
      const weekendDates: string[] = [];
      for (let day = currentStart; day <= currentEnd; day++) {
        const curDate = new Date(year, month - 1, day);
        const dow = curDate.getDay();
        const dStr = `${year}-${pad(month)}-${pad(day)}`;
        allDates.push(dStr);
        if (dow === 5 || dow === 6 || dow === 0) { // Ven, Sab, Dom
          weekendDates.push(dStr);
        }
      }

      weeks.push({
        id: `week_${weekNum}`,
        weekNum,
        label: `Settimana ${weekNum} (${currentStart} - ${currentEnd})`,
        shortLabel: `Sett. ${weekNum}`,
        startDate: startStr,
        endDate: endStr,
        weekendDates,
        allDates,
      });

      currentStart = currentEnd + 1;
      weekNum++;
    }

    return weeks;
  }, [selectedMonth]);

  // Mini grafico andamento pagamenti per le settimane del mese
  const paymentTrendData = useMemo(() => {
    return monthWeeks.map((wk) => {
      const weekDays = monthWorkedDays.filter((d) => wk.allDates.includes(d.date));
      const earned = weekDays.reduce((sum, d) => sum + (d.amount || 0), 0);

      const weekPayouts = payouts.filter((p) => {
        const pDate = p.paymentDate || p.createdAt?.split('T')[0];
        return pDate && wk.allDates.includes(pDate);
      });
      const paidFromPayouts = weekPayouts.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const paidFromDays = weekDays.filter((d) => d.paid).reduce((sum, d) => sum + (d.amount || 0), 0);
      const paid = Math.max(paidFromPayouts, paidFromDays);
      const pending = Math.max(0, earned - paid);

      return {
        ...wk,
        earned,
        paid,
        pending,
        daysCount: weekDays.length,
      };
    });
  }, [monthWeeks, monthWorkedDays, payouts]);

  // Dati filtrati per la vista Riepilogo Compensi
  const summaryFilteredDays = useMemo(() => {
    if (summaryFilter === 'all') {
      return monthWorkedDays;
    }
    if (summaryFilter === 'weekend') {
      // Raccoglie tutti i giorni che cadono di venerdì, sabato o domenica nel mese
      const allWeekendDates = new Set(monthWeeks.flatMap((w) => w.weekendDates));
      return monthWorkedDays.filter((d) => allWeekendDates.has(d.date));
    }
    // Filtro per settimana specifica
    const targetWeek = monthWeeks.find((w) => w.id === summaryFilter);
    if (targetWeek) {
      return monthWorkedDays.filter((d) => targetWeek.allDates.includes(d.date));
    }
    return monthWorkedDays;
  }, [monthWorkedDays, summaryFilter, monthWeeks]);

  // Riepilogo operai con lavoro svolto nel periodo selezionato
  const summaryWorkerBreakdown = useMemo(() => {
    return workers.map((worker) => {
      const days = summaryFilteredDays.filter((d) => d.workerId === worker.uid);
      const totalEarned = days.reduce((sum, d) => sum + (d.amount || 0), 0);
      const totalPaid = days.filter((d) => d.paid).reduce((sum, d) => sum + (d.amount || 0), 0);
      const pendingToPay = Math.max(0, totalEarned - totalPaid);

      return {
        worker,
        days,
        totalEarned,
        totalPaid,
        pendingToPay,
        daysCount: days.length,
      };
    }).filter((item) => item.days.length > 0 || item.pendingToPay > 0);
  }, [workers, summaryFilteredDays]);

  const summaryTotalPending = useMemo(() => {
    return summaryWorkerBreakdown.reduce((sum, item) => sum + item.pendingToPay, 0);
  }, [summaryWorkerBreakdown]);

  const summaryTotalEarned = useMemo(() => {
    return summaryWorkerBreakdown.reduce((sum, item) => sum + item.totalEarned, 0);
  }, [summaryWorkerBreakdown]);

  const summaryTotalPaid = useMemo(() => {
    return summaryWorkerBreakdown.reduce((sum, item) => sum + item.totalPaid, 0);
  }, [summaryWorkerBreakdown]);

  const handleQuickPayWorker = async (worker: User, amountToPay: number, targetDays: WorkedDay[], method: PaymentMethod = 'contanti') => {
    if (amountToPay <= 0 && targetDays.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Registra Payout
    await recordWorkerPayout({
      workerId: worker.uid,
      workerName: worker.displayName,
      period: selectedMonth,
      totalHours: 0,
      daysWorked: targetDays.length,
      hourlyRate: worker.hourlyRate || 15,
      totalAmount: Number(amountToPay),
      paymentMethod: method,
      paymentDate: todayStr,
      status: 'paid',
      notes: `Liquidato compenso ${summaryFilter === 'weekend' ? 'fine settimana' : 'periodo'} (${targetDays.length} giornate)`,
    });

    // 2. Segna le giornate come pagate
    for (const d of targetDays) {
      if (!d.paid) {
        await updateWorkedDay({ ...d, paid: true });
      }
    }

    setQuickPayWorkerId(null);
    setQuickPaySuccessMsg(`Compenso di €${amountToPay.toFixed(2)} registrato come PAGATO per ${worker.displayName}!`);
    setTimeout(() => setQuickPaySuccessMsg(null), 3500);
  };

  const handlePayAllSummaryWorkers = async () => {
    if (summaryTotalPending <= 0) return;
    for (const item of summaryWorkerBreakdown) {
      if (item.pendingToPay > 0) {
        await handleQuickPayWorker(item.worker, item.pendingToPay, item.days, 'contanti');
      }
    }
  };

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
    const hourly = w?.hourlyRate || Math.round((rate / 8) * 100) / 100;
    setDayRate(rate);
    setDayHourlyRate(hourly);
    calculateAmount(rate, hourly, dayType, dayHours);
  };

  const handleDayTypeChange = (type: DayType) => {
    setDayType(type);
    calculateAmount(dayRate, dayHourlyRate, type, dayHours);
  };

  const handleHoursChange = (h: number) => {
    setDayHours(h);
    calculateAmount(dayRate, dayHourlyRate, 'custom', h);
  };

  const handleRateChange = (r: number) => {
    setDayRate(r);
    calculateAmount(r, dayHourlyRate, dayType, dayHours);
  };

  const handleHourlyRateChange = (hr: number) => {
    setDayHourlyRate(hr);
    calculateAmount(dayRate, hr, dayType, dayHours);
  };

  const calculateAmount = (dailyRate: number, hourlyRate: number, type: DayType, hours: number) => {
    if (type === 'full') {
      setDayAmount(dailyRate);
    } else if (type === 'half') {
      setDayAmount(Math.round((dailyRate / 2) * 100) / 100);
    } else {
      const hRate = hourlyRate > 0 ? hourlyRate : dailyRate / 8;
      setDayAmount(Math.round(hRate * hours * 100) / 100);
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
    <div className="space-y-[3px]">
      
      {/* Mese in alto allargato a tutta larghezza con i pulsantini laterali */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] p-[3px] px-2 shadow-xs flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-1 px-2.5 rounded-[5px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="Mese precedente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-mono tracking-tight">
            {formattedMonthLabel}
          </span>
          {selectedMonth !== new Date().toISOString().substring(0, 7) && (
            <button
              onClick={handleResetCurrentMonth}
              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 underline ml-1 cursor-pointer"
            >
              Oggi
            </button>
          )}
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1 px-2.5 rounded-[5px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="Mese successivo"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Pulsanti Azione sulla stessa riga (3 pulsanti adattati allo schermo: Inserisci Giornata, Nuovo Operaio, Riepilogo) */}
      <div className="grid grid-cols-3 gap-[3px] w-full">
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
          className="flex items-center justify-center gap-1 p-[3px] py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[6px] font-bold text-[11px] sm:text-xs shadow-xs transition-colors cursor-pointer w-full min-w-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Inserisci Giornata</span>
        </button>

        <button
          onClick={() => setShowAddWorkerModal(true)}
          className="flex items-center justify-center gap-1 p-[3px] py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-700 rounded-[6px] font-bold text-[11px] sm:text-xs shadow-xs transition-colors cursor-pointer w-full min-w-0"
        >
          <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="truncate">Nuovo Operaio</span>
        </button>

        <button
          onClick={() => setSubView(subView === 'summary' ? 'registry' : 'summary')}
          className={`flex items-center justify-center gap-1 p-[3px] py-2 rounded-[6px] font-bold text-[11px] sm:text-xs shadow-xs transition-colors cursor-pointer w-full min-w-0 ${
            subView === 'summary'
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700/60'
          }`}
          title="Mostra riepilogo compensi e saldi operai"
        >
          <BarChart3 className={`w-3.5 h-3.5 shrink-0 ${subView === 'summary' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
          <span className="truncate">Riepilogo</span>
        </button>
      </div>

      {/* KPI STATS: 4 CARD DEI RIEPILOGHI SU UNA SOLA RIGA (GRAFICA STRETTA A 3PX) */}
      <div className="grid grid-cols-4 gap-[3px] w-full">
        {/* BIG HIGHLIGHT: TOTALE DA DARE */}
        <div className="bg-emerald-950 text-white border border-emerald-900 rounded-[6px] p-[3px] px-1.5 shadow-2xs space-y-0.5 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight truncate">Da Dare</span>
            <Wallet className="w-3 h-3 text-amber-400 shrink-0" />
          </div>
          <div className="text-xs sm:text-base font-bold font-mono text-amber-300 truncate">
            € {totalDueAllWorkers.toFixed(0)}
          </div>
          <div className="text-[7px] sm:text-[8px] text-emerald-200/80 truncate">
            {workers.length} operai
          </div>
        </div>

        {/* Totale Maturato nel Mese */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] p-[3px] px-1.5 shadow-2xs space-y-0.5 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight truncate">Maturato</span>
            <Euro className="w-3 h-3 text-emerald-600 shrink-0" />
          </div>
          <div className="text-xs sm:text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 truncate">
            € {totalEarnedAllWorkers.toFixed(0)}
          </div>
          <div className="text-[7px] sm:text-[8px] text-slate-500 dark:text-slate-400 truncate">
            Lavoro svolto
          </div>
        </div>

        {/* Giornate Lavorate Totali */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] p-[3px] px-1.5 shadow-2xs space-y-0.5 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight truncate">Giornate</span>
            <Clock className="w-3 h-3 text-sky-600 shrink-0" />
          </div>
          <div className="text-xs sm:text-base font-bold font-mono text-sky-700 dark:text-sky-400 truncate">
            {totalDaysAllWorkers.toFixed(1)} gg
          </div>
          <div className="text-[7px] sm:text-[8px] text-slate-500 dark:text-slate-400 truncate">
            Nel mese
          </div>
        </div>

        {/* Già Pagati / Acconti */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] p-[3px] px-1.5 shadow-2xs space-y-0.5 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-tight truncate">Liquidato</span>
            <CreditCard className="w-3 h-3 text-emerald-600 shrink-0" />
          </div>
          <div className="text-xs sm:text-base font-bold font-mono text-slate-900 dark:text-slate-100 truncate">
            € {totalPaidAllWorkers.toFixed(0)}
          </div>
          <div className="text-[7px] sm:text-[8px] text-slate-500 dark:text-slate-400 truncate">
            Già pagati
          </div>
        </div>
      </div>

      {subView === 'registry' ? (
        <>
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

      {/* STORICO PAGAMENTI STIPENDI OPERAI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Storico Pagamenti Stipendi ({payouts.length} erogazioni)</span>
          </h3>
        </div>

        {payouts.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            Nessun pagamento di stipendio o acconto ancora erogato.
          </div>
        ) : (
          <div className="space-y-[7px] max-h-72 overflow-y-auto">
            {payouts
              .sort((a, b) => (b.paymentDate || b.createdAt).localeCompare(a.paymentDate || a.createdAt))
              .map((p) => (
                <div
                  key={p.id}
                  className="p-[7px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] flex items-center justify-between gap-[7px] text-xs"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{p.workerName}</span>
                      <span className="font-mono text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded font-bold">
                        {p.period}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Pagato il: <strong className="text-slate-700 dark:text-slate-300">{p.paymentDate || p.createdAt.split('T')[0]}</strong> · Metodo: <strong className="text-slate-700 dark:text-slate-300">{p.paymentMethod}</strong>
                    </div>
                    {p.notes && <div className="text-[10px] text-slate-400 italic truncate">{p.notes}</div>}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                      € {p.totalAmount.toFixed(2)}
                    </div>
                    <span className="text-[9px] font-bold uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                      LIQUIDATO
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
        </div>
        </>
      ) : (
        /* SCHERMATA RIEPILOGO COMPENSI E SALDI A PAGINA NORMALE */
        <div className="space-y-[3px]">
          {/* Header Barra Riepilogo */}
          <div className="flex items-center justify-between p-[3px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubView('registry')}
                className="p-1 px-2 text-[11px] font-bold rounded-[4px] bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Torna a Operai</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="uppercase tracking-tight">Riepilogo Compensi & Saldi</span>
              </div>
            </div>

            {summaryTotalPending > 0 ? (
              <button
                type="button"
                onClick={handlePayAllSummaryWorkers}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                title="Salda tutti gli operai del periodo selezionato"
              >
                <span>Salda Tutti (€ {summaryTotalPending.toFixed(2)})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Tutti saldati</span>
              </span>
            )}
          </div>

          {/* Toast Notifica Successo Pagamento */}
          {quickPaySuccessMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 p-[3px] px-3 py-1.5 text-xs flex items-center gap-2 rounded-[6px] shadow-2xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{quickPaySuccessMsg}</span>
            </div>
          )}

          {/* MINI GRAFICO ANDAMENTO PAGAMENTI (TEMA CHIARO & SCURO) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] p-[3px] px-2.5 py-2 space-y-[3px] shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Andamento Pagamenti Settimanali</span>
              </div>
              <div className="flex items-center gap-2.5 text-[9px] font-semibold">
                <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400">
                  <span className="w-2 h-2 rounded-[2px] bg-sky-500 inline-block" />
                  Maturato
                </span>
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-[2px] bg-emerald-500 inline-block" />
                  Liquidato
                </span>
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-[2px] bg-amber-500 inline-block" />
                  Da Saldare
                </span>
              </div>
            </div>

            {/* Bar Chart Container */}
            {(() => {
              const maxVal = Math.max(
                1,
                ...paymentTrendData.map((d) => Math.max(d.earned, d.paid))
              );

              return (
                <div className="space-y-[3px]">
                  <div className="grid grid-cols-5 gap-[3px] h-20 items-end pt-2 px-1">
                    {paymentTrendData.map((wk) => {
                      const earnedHeightPct = Math.min(100, Math.max(6, (wk.earned / maxVal) * 100));
                      const paidHeightPct = Math.min(100, Math.max(4, (wk.paid / maxVal) * 100));

                      return (
                        <div key={wk.id} className="flex flex-col items-center justify-end h-full group">
                          <div className="w-full flex items-end justify-center gap-1 h-14 bg-slate-100 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-[4px] p-0.5 relative">
                            {/* Bar: Maturato */}
                            <div
                              style={{ height: `${earnedHeightPct}%` }}
                              title={`Maturato: €${wk.earned.toFixed(0)}`}
                              className="w-2 sm:w-3 bg-sky-500 hover:bg-sky-400 rounded-t-[2px] transition-all"
                            />
                            {/* Bar: Liquidato */}
                            <div
                              style={{ height: `${paidHeightPct}%` }}
                              title={`Liquidato: €${wk.paid.toFixed(0)}`}
                              className="w-2 sm:w-3 bg-emerald-500 hover:bg-emerald-400 rounded-t-[2px] transition-all"
                            />
                          </div>
                          <div className="text-[9px] font-medium text-slate-600 dark:text-slate-400 mt-1 truncate max-w-full text-center">
                            {wk.shortLabel}
                          </div>
                          <div className="text-[8px] font-mono font-bold text-amber-700 dark:text-amber-300">
                            {wk.pending > 0 ? `€${wk.pending.toFixed(0)}` : '✓'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mini Summary Strip */}
                  <div className="grid grid-cols-3 gap-[3px] text-center pt-1 border-t border-slate-200 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-[3px] rounded-[4px]">
                      <span className="text-[8px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Totale Lavoro</span>
                      <span className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-300">
                        € {summaryTotalEarned.toFixed(0)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-[3px] rounded-[4px]">
                      <span className="text-[8px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Già Liquidato</span>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        € {summaryTotalPaid.toFixed(0)}
                      </span>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-[3px] rounded-[4px]">
                      <span className="text-[8px] text-amber-800 dark:text-amber-300 block uppercase font-bold">Da Saldare</span>
                      <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-400">
                        € {summaryTotalPending.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* FILTER BAR: SELETTORE PERIODO (FINE SETTIMANA / SETTIMANE / MESE) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] p-[3px] space-y-[3px] shadow-2xs">
            <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 px-1 font-semibold">
              <span>FILTRA PERIODO DI CALCOLO:</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">
                {summaryFilter === 'weekend' ? 'Venerdì, Sabato e Domenica del mese' : summaryFilter === 'all' ? 'Tutto il mese' : 'Settimana specifica'}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-7 gap-[3px]">
              <button
                type="button"
                onClick={() => setSummaryFilter('weekend')}
                className={`p-[3px] py-1.5 text-center text-xs font-bold rounded-[4px] cursor-pointer transition-colors col-span-2 sm:col-span-2 ${
                  summaryFilter === 'weekend'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                <span>⭐ Fine Settimana (Ven-Dom)</span>
              </button>

              <button
                type="button"
                onClick={() => setSummaryFilter('all')}
                className={`p-[3px] py-1.5 text-center text-xs font-bold rounded-[4px] cursor-pointer transition-colors ${
                  summaryFilter === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                Mese Intero
              </button>

              {monthWeeks.map((wk) => (
                <button
                  key={wk.id}
                  type="button"
                  onClick={() => setSummaryFilter(wk.id)}
                  className={`p-[3px] py-1 text-center text-[10px] font-bold rounded-[4px] cursor-pointer transition-colors ${
                    summaryFilter === wk.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {wk.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA RIEPILOGHI OPERAI */}
          <div className="space-y-[3px]">
            {summaryWorkerBreakdown.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] p-6 text-center text-slate-500 dark:text-slate-400 text-xs shadow-2xs">
                Nessuna attività o giornata registrata per il periodo selezionato.
              </div>
            ) : (
              summaryWorkerBreakdown.map((item) => {
                const isPayingThis = quickPayWorkerId === item.worker.uid;

                return (
                  <div
                    key={item.worker.uid}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-[6px] p-[3px] space-y-[3px] shadow-2xs transition-colors"
                  >
                    {/* Worker Header */}
                    <div className="flex items-center justify-between p-[3px] px-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-[4px]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-400 shadow-2xs">
                          {item.worker.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {item.worker.displayName}
                          </div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400">
                            Tariffa: €{item.worker.dailyRate || 90}/gg · €{item.worker.hourlyRate || 15}/h
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {item.pendingToPay > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] uppercase tracking-wider text-amber-800 dark:text-amber-400 font-bold">
                              Da Saldare:
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                              € {item.pendingToPay.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded-[3px] font-bold">
                            <Check className="w-3 h-3" />
                            SALDATO
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Worked Days Details */}
                    {item.days.length > 0 && (
                      <div className="space-y-[3px] p-[3px]">
                        {item.days.map((d) => {
                          const dDate = new Date(d.date);
                          const isWeekend = dDate.getDay() === 0 || dDate.getDay() === 5 || dDate.getDay() === 6;

                          return (
                            <div
                              key={d.id}
                              className="flex items-center justify-between p-[3px] px-2 bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/60 rounded-[4px] text-[11px]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`font-mono font-semibold shrink-0 ${
                                    isWeekend
                                      ? 'text-amber-800 dark:text-amber-300 font-bold'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {d.date.substring(5)}
                                  {isWeekend ? ' (WE)' : ''}
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 truncate">
                                  {d.cantiereName || 'Lavoro ordinario'}
                                </span>
                                <span className="text-[9px] text-slate-500 dark:text-slate-500 shrink-0">
                                  {d.dayType === 'full' ? '1gg' : d.dayType === 'half' ? '0.5gg' : `${d.hours}h`}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                                  € {(d.amount || 0).toFixed(2)}
                                </span>

                                {/* Clickable Day Paid Toggle */}
                                <button
                                  type="button"
                                  onClick={() => updateWorkedDay({ ...d, paid: !d.paid })}
                                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded-[3px] border cursor-pointer transition-colors ${
                                    d.paid
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                      : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                                  }`}
                                  title={d.paid ? 'Clicca per annullare pagamento' : 'Clicca per segnare pagato'}
                                >
                                  {d.paid ? '✓ Pagato' : 'Da Saldare'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Pay Action Bar */}
                    {item.pendingToPay > 0 && (
                      <div className="p-[3px] bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-[4px] flex items-center justify-between gap-1 flex-wrap">
                        {isPayingThis ? (
                          <div className="w-full flex items-center justify-between gap-[3px]">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Metodo:</span>
                              <select
                                value={quickPayMethod}
                                onChange={(e) => setQuickPayMethod(e.target.value as PaymentMethod)}
                                className="p-1 text-[10px] bg-white border border-slate-300 rounded-[3px] text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                              >
                                <option value="contanti">Contanti</option>
                                <option value="bonifico">Bonifico</option>
                                <option value="pos">POS / Carta</option>
                                <option value="assegno">Assegno</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickPayWorker(item.worker, item.pendingToPay, item.days, quickPayMethod)
                                }
                                className="p-[3px] px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[3px] font-bold text-xs cursor-pointer shadow-xs"
                              >
                                Conferma €{item.pendingToPay.toFixed(2)}
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickPayWorkerId(null)}
                                className="p-[3px] px-1.5 py-1 text-[10px] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                              >
                                Annulla
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickPayWorkerId(item.worker.uid);
                              setQuickPayMethod('contanti');
                            }}
                            className="w-full p-[3px] py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[4px] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Segna Pagato (€ {item.pendingToPay.toFixed(2)})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Summary Footer Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-[3px] px-3 py-2 flex items-center justify-between rounded-[6px] shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Totale Da Dare:
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-sm">
                € {summaryTotalPending.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSubView('registry')}
              className="p-[3px] px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-[4px] font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
            >
              Torna a Operai
            </button>
          </div>
        </div>
      )}

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

              <div className="grid grid-cols-3 gap-[7px]">
                <div className="space-y-[7px]">
                  <label className="font-semibold block truncate">Tariffa GG (€)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={dayRate}
                    onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono text-xs"
                  />
                </div>

                <div className="space-y-[7px]">
                  <label className="font-semibold block truncate">Tariffa Oraria (€/h)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={dayHourlyRate}
                    onChange={(e) => handleHourlyRateChange(parseFloat(e.target.value) || 0)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono text-xs text-sky-600 dark:text-sky-400 font-bold"
                  />
                </div>

                <div className="space-y-[7px]">
                  <label className="font-semibold block truncate">Totale (€) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={dayAmount}
                    onChange={(e) => setDayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono font-bold text-emerald-600 text-xs"
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
                  <option value="bonifico">Bonifico</option>
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
                {confirmDeleteWorkerId === editingWorker.uid ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        deleteUser(editingWorker.uid);
                        setEditingWorker(null);
                        setConfirmDeleteWorkerId(null);
                      }}
                      className="p-[7px] px-3 bg-rose-600 text-white rounded-[7px] hover:bg-rose-700 flex items-center gap-1 font-bold text-xs cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Conferma Eliminazione</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteWorkerId(null)}
                      className="p-[7px] px-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Annulla
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteWorkerId(editingWorker.uid)}
                    className="p-[7px] px-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-[7px] hover:bg-rose-100 flex items-center gap-1 font-semibold text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Rimuovi Operaio</span>
                  </button>
                )}

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
