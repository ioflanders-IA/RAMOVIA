import React, { useState, useMemo } from 'react';
import { useApp, consolidateWorkedDays } from '../../context/AppContext';
import { User, WorkedDay, DayType, PaymentMethod } from '../../types';
import {
  InsertDayVectorIcon,
  NewWorkerVectorIcon,
  WorkerSummaryVectorIcon,
} from '../common/HeaderVectorIcons';
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
  ChevronDown,
  Tag,
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

const WORKER_PALETTE = [
  '#38bdf8', // sky-400 (bright blue, like first card in clients)
  '#c084fc', // purple-400 (magenta/purple, like Salè in clients)
  '#fb923c', // orange-400 (orange, like Vincenzo photinia in clients)
  '#34d399', // emerald-400
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#2dd4bf', // teal-400
  '#facc15', // amber-400
];

const getWorkerColor = (workerId: string, index: number) => {
  if (!workerId) return WORKER_PALETTE[index % WORKER_PALETTE.length];
  let hash = 0;
  for (let i = 0; i < workerId.length; i++) {
    hash = workerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % WORKER_PALETTE.length;
  return WORKER_PALETTE[idx];
};

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
    deleteWorkerPayout,
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
  const [summaryFilter, setSummaryFilter] = useState<'weekend' | 'all' | string>('all');
  const [quickPayWorkerId, setQuickPayWorkerId] = useState<string | null>(null);
  const [quickPayMethod, setQuickPayMethod] = useState<PaymentMethod>('contanti');
  const [quickPaySuccessMsg, setQuickPaySuccessMsg] = useState<string | null>(null);

  // List of workers (strictly non-admin workers)
  const workers = useMemo(() => {
    return users.filter((u) => u.role === 'worker');
  }, [users]);

  // Filter worked days for current selected month (excluding admin users) with 1 day per date consolidation
  const monthWorkedDays = useMemo(() => {
    const workerUids = new Set(workers.map((w) => w.uid));
    const raw = workedDays.filter(
      (wd) => wd.date && wd.date.startsWith(selectedMonth) && workerUids.has(wd.workerId)
    );
    return consolidateWorkedDays(raw);
  }, [workedDays, selectedMonth, workers]);

  // Filter payouts strictly for current selected month (excluding admin users)
  const monthPayouts = useMemo(() => {
    const workerUids = new Set(workers.map((w) => w.uid));
    return payouts.filter((p) => {
      const isWorkerValid = workerUids.has(p.workerId);
      const pDate = p.paymentDate || p.createdAt?.split('T')[0];
      const isMonthMatch = p.period === selectedMonth || (pDate && pDate.startsWith(selectedMonth));
      return isWorkerValid && isMonthMatch;
    });
  }, [payouts, selectedMonth, workers]);

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
      const rawPaid = Math.max(totalPaidFromPayouts, totalPaidFromDays);
      const totalPaid = totalEarned > 0 ? Math.min(totalEarned, rawPaid) : rawPaid;

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
      const rawPaid = Math.max(paidFromPayouts, paidFromDays);
      const paid = earned > 0 ? Math.min(earned, rawPaid) : rawPaid;
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

  // Helper to format short date in Italian (e.g., "30 OTT")
  const formatShortDateItalian = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);
    const monthShort = d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '').toUpperCase();
    return `${day} ${monthShort}`;
  };

  // Helper to format YYYY-MM safely
  const formatYearMonth = (year: number, month: number): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${year}-${pad(month)}`;
  };

  // Format month name in Italian (e.g., "Ottobre 2026")
  const formattedMonthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1, 15); // Use mid-month to prevent timezone boundary shifts
    const monthName = d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    setSelectedMonth(formatYearMonth(prevYear, prevMonth));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setSelectedMonth(formatYearMonth(nextYear, nextMonth));
  };

  const currentRealMonth = useMemo(() => {
    const now = new Date();
    return formatYearMonth(now.getFullYear(), now.getMonth() + 1);
  }, []);

  const handleResetCurrentMonth = () => {
    setSelectedMonth(currentRealMonth);
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

  // Helper per gestire click (apertura/chiusura) e pressione prolungata (modifica operaio)
  const createWorkerCardProps = (worker: User) => {
    let pressTimer: NodeJS.Timeout | null = null;
    let didLongPress = false;

    const start = () => {
      didLongPress = false;
      pressTimer = setTimeout(() => {
        didLongPress = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
        setEditingWorker(worker);
      }, 500);
    };

    const clear = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    return {
      onMouseDown: start,
      onMouseUp: clear,
      onMouseLeave: clear,
      onTouchStart: start,
      onTouchEnd: clear,
      onClick: () => {
        if (didLongPress) return;
        setExpandedWorkerId((prev) => (prev === worker.uid ? null : worker.uid));
      },
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        setEditingWorker(worker);
      },
    };
  };

  return (
    <div className="space-y-[3px]">
      {/* Header Action Buttons Grouped on the Right (Icon-only vector style) */}
      <div className="flex items-center justify-end gap-2.5 sm:gap-3 w-full pb-1">
        <button
          type="button"
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
          className="flex items-center p-1 bg-transparent border-0 shadow-none hover:opacity-85 transition-opacity shrink-0 cursor-pointer"
          title="Inserisci Giornata Lavorata"
          aria-label="Inserisci Giornata"
        >
          <InsertDayVectorIcon className="w-8 h-8" />
        </button>

        <button
          type="button"
          onClick={() => setShowAddWorkerModal(true)}
          className="flex items-center p-1 bg-transparent border-0 shadow-none hover:opacity-85 transition-opacity shrink-0 cursor-pointer"
          title="Nuovo Operaio"
          aria-label="Nuovo Operaio"
        >
          <NewWorkerVectorIcon className="w-8 h-8" />
        </button>

        <button
          type="button"
          onClick={() => setSubView(subView === 'summary' ? 'registry' : 'summary')}
          className="flex items-center p-1 bg-transparent border-0 shadow-none hover:opacity-85 transition-opacity shrink-0 cursor-pointer"
          title="Mostra riepilogo compensi e saldi operai"
          aria-label="Riepilogo Compensi"
        >
          <WorkerSummaryVectorIcon className="w-8 h-8" />
        </button>
      </div>

      {/* KPI STAT CARDS: 4 cards with high-contrast, non-truncated text matching home */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full">
        {/* 1. DA DARE */}
        <div className="bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-lg p-2 shadow-xs flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-slate-300 dark:text-slate-300">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Da Dare</span>
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
            € {totalDueAllWorkers.toFixed(0)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-300 dark:text-slate-300 font-medium leading-none">
            {workers.length} operai
          </div>
        </div>

        {/* 2. MATURATO */}
        <div className="bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-lg p-2 shadow-xs flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-slate-300 dark:text-slate-300">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Maturato</span>
            <Euro className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 leading-tight">
            € {totalEarnedAllWorkers.toFixed(0)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-300 dark:text-slate-300 font-medium leading-none">
            Lavoro svolto
          </div>
        </div>

        {/* 3. GIORNATE */}
        <div className="bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-lg p-2 shadow-xs flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-slate-300 dark:text-slate-300">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Giornate</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-400 leading-tight">
            {totalDaysAllWorkers.toFixed(1)} <span className="text-xs font-normal">gg</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-300 dark:text-slate-300 font-medium leading-none">
            Nel mese
          </div>
        </div>

        {/* 4. LIQUIDATO */}
        <div className="bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-lg p-2 shadow-xs flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-slate-300 dark:text-slate-300">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Liquidato</span>
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white leading-tight">
            € {totalPaidAllWorkers.toFixed(0)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-300 dark:text-slate-300 font-medium leading-none">
            Già pagati
          </div>
        </div>
      </div>

      {/* Mese: Gap a 6px sopra e sotto (my-[6px]), senza sfondi o bordi al centro, bordi verdi solo sulle freccette */}
      <div className="w-full bg-transparent border-0 my-[6px] px-1 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 px-3 rounded-lg border border-emerald-600/70 dark:border-emerald-500/70 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer shrink-0"
          title="Mese precedente"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </button>

        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold font-mono text-sm sm:text-base">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{formattedMonthLabel}</span>
          {selectedMonth !== currentRealMonth && (
            <button
              type="button"
              onClick={handleResetCurrentMonth}
              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 underline ml-1 cursor-pointer"
            >
              Oggi
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 px-3 rounded-lg border border-emerald-600/70 dark:border-emerald-500/70 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer shrink-0"
          title="Mese successivo"
        >
          <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </button>
      </div>

      {subView === 'registry' ? (
        <>
          {/* SCHEDE OPERAI: RIEPILOGO TOTALE DA DARE AD OGNUNO */}
          <div className="space-y-[7px]">

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
            {workerStats.map((st, index) => {
              const isExpanded = expandedWorkerId === st.worker.uid;
              const workerColor = getWorkerColor(st.worker.uid, index);
              const cardProps = createWorkerCardProps(st.worker);

              return (
                <div
                  key={st.worker.uid}
                  style={{ borderLeftColor: workerColor, borderLeftWidth: '3.5px' }}
                  {...cardProps}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-2.5 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-600 transition-all space-y-2 group cursor-pointer select-none"
                >
                  {/* Top Row: Name on Left, Google / Offline Badge on Right (No edit icon, no chevron) */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {st.worker.displayName}
                    </h3>
                    <div className="shrink-0">
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
                  </div>

                  {/* Middle Row: Tariffa (without Cod) + Maturato on Left, DA DARE on Right (enlarged value, small euro, no decimals, no bg, no border) */}
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1 leading-snug">
                        <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Tariffa: € {(st.worker.dailyRate || 90).toFixed(0)} / gg
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-4 leading-snug truncate">
                        Maturato nel mese: € {st.totalEarned.toFixed(0)}
                        {st.totalPaid > 0 && ` · Pagati: € ${st.totalPaid.toFixed(0)}`}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] uppercase font-bold text-amber-500/90 dark:text-amber-400/90 tracking-wider block leading-none pb-0.5">
                        Da dare
                      </span>
                      <div className="font-mono font-black text-slate-900 dark:text-white leading-none flex items-baseline justify-end">
                        <span className="text-xs font-bold mr-0.5 text-slate-500 dark:text-slate-300">€</span>
                        <span className="text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
                          {Math.round(st.pendingToPay)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar: Square + button on left (transparent bg & green border), Phone/Nessun tel on left of Salda, Salda with transparent bg & thick border */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDayWorkerId(st.worker.uid);
                        setDayRate(st.worker.dailyRate || 90);
                        setDayAmount(st.worker.dailyRate || 90);
                        setDayDate(new Date().toISOString().split('T')[0]);
                        setDayType('full');
                        setShowAddDayModal(true);
                      }}
                      className="w-7 h-7 rounded-[6px] bg-transparent hover:bg-emerald-500/10 border-2 border-emerald-500 dark:border-emerald-400 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 cursor-pointer shadow-2xs transition-colors"
                      title="Aggiungi giornata"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    </button>

                    <div className="flex items-center gap-2.5 ml-auto shrink-0">
                      {st.worker.phone ? (
                        <a
                          href={`tel:${st.worker.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                          title="Chiama operaio"
                        >
                          <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{st.worker.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                          Nessun tel
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPayoutWorker(st.worker);
                          setPayoutAmount(st.pendingToPay > 0 ? st.pendingToPay : st.totalEarned);
                          setPayoutMethod('bonifico');
                          setPayoutNotes(`Saldo compenso ${formattedMonthLabel}`);
                          setShowPayoutModal(true);
                        }}
                        className="h-7 px-3 bg-transparent hover:bg-amber-400/10 border-2 border-amber-400 text-amber-500 dark:text-amber-400 rounded-[6px] font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors shrink-0"
                        title="Registra Pagamento / Saldo"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Salda</span>
                      </button>
                    </div>
                  </div>

                  {/* Accordion Elenco Giornate Operaio */}
                  {isExpanded && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-slate-50 dark:bg-slate-950/80 rounded-[7px] border border-slate-200 dark:border-slate-800 space-y-1 max-h-48 overflow-y-auto text-[11px]"
                    >
                      {st.days.length === 0 ? (
                        <div className="text-slate-400 text-center py-2 text-xs">
                          Nessuna giornata inserita in questo mese.
                        </div>
                      ) : (
                        st.days.map((d) => (
                          <div
                            key={d.id}
                            className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                                {formatShortDateItalian(d.date)}
                              </div>
                              {d.cantiereName && (
                                <div className="text-[10px] text-slate-500 truncate" title={d.cantiereName}>
                                  {d.cantiereName}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                € {d.amount.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateWorkedDay({ ...d, paid: !d.paid })}
                                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-[3px] border cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                                  d.paid
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                                }`}
                                title={d.paid ? 'Clicca per annullare pagamento' : 'Clicca per segnare pagato'}
                              >
                                {d.paid ? '✓ Pagato' : 'Da Saldare'}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteWorkedDay(d.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded shrink-0 cursor-pointer"
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
              );
            })}
          </div>
        )}
      </div>

      {/* REGISTRO COMPLETO DELLE GIORNATE LAVORATE DEL MESE (COMPATTO STILE CALENDARIO) */}
      <div className="bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-lg p-2 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>REGISTRO GIORNATE DEL MESE ({monthWorkedDays.length})</span>
          </h3>
          <span className="text-[11px] font-mono font-bold text-emerald-400">
            {formattedMonthLabel}
          </span>
        </div>

        {monthWorkedDays.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            Nessuna giornata di lavoro inserita per {formattedMonthLabel}.
          </div>
        ) : (
          <div className="space-y-[3px] max-h-56 overflow-y-auto pr-0.5">
            {monthWorkedDays
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((d) => (
                <div
                  key={d.id}
                  className="p-1.5 px-2 bg-slate-800/60 border border-slate-700/60 rounded-md flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80 shrink-0">
                      {formatShortDateItalian(d.date)}
                    </span>
                    <span className="font-bold text-slate-100 text-xs shrink-0">
                      {d.workerName}
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700 text-emerald-300 shrink-0">
                      {d.dayType === 'full' ? '1 GG' : d.dayType === 'half' ? '0.5 GG' : `${d.hours}h`}
                    </span>
                    {d.cantiereName && (
                      <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                        · {d.cantiereName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-xs sm:text-sm text-emerald-400">
                      € {d.amount.toFixed(0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteWorkedDay(d.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
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

      {/* STORICO PAGAMENTI STIPENDI OPERAI (FILTRATO PER MESE - COMPATTO STILE CALENDARIO) */}
      <div className="bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-lg p-2 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>STORICO PAGAMENTI STIPENDI ({monthPayouts.length})</span>
          </h3>
          <span className="text-[11px] font-mono font-bold text-emerald-400">
            {formattedMonthLabel}
          </span>
        </div>

        {monthPayouts.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            Nessun pagamento di stipendio o acconto registrato per {formattedMonthLabel}.
          </div>
        ) : (
          <div className="space-y-[3px] max-h-56 overflow-y-auto pr-0.5">
            {monthPayouts
              .sort((a, b) => (b.paymentDate || b.createdAt).localeCompare(a.paymentDate || a.createdAt))
              .map((p) => (
                <div
                  key={p.id}
                  className="p-1.5 px-2 bg-slate-800/60 border border-slate-700/60 rounded-md flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80 shrink-0">
                      {formatShortDateItalian(p.paymentDate || p.createdAt?.split('T')[0])}
                    </span>
                    <span className="font-bold text-slate-100 text-xs shrink-0">
                      {p.workerName}
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 shrink-0">
                      {p.paymentMethod}
                    </span>
                    {p.notes && (
                      <span className="text-[10px] text-slate-400 truncate hidden sm:inline italic">
                        · {p.notes}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-bold text-xs sm:text-sm text-emerald-400">
                      € {p.totalAmount.toFixed(0)}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 uppercase shrink-0">
                      LIQUIDATO
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteWorkerPayout(p.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                      title="Elimina registrazione pagamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="uppercase tracking-tight">Riepilogo Saldi</span>
              </div>
            </div>

            {summaryTotalPending > 0 ? (
              <button
                type="button"
                onClick={handlePayAllSummaryWorkers}
                className="text-right cursor-pointer flex items-center gap-1 group"
                title="Salda tutti gli operai del periodo selezionato"
              >
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 group-hover:underline">
                    Salda Tutti
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    € {summaryTotalPending.toFixed(2)}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            ) : totalDueAllWorkers > 0 ? (
              <div className="text-right leading-tight">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Nessun saldo in questo filtro</span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 font-mono">Totale Mese: € {totalDueAllWorkers.toFixed(2)}</span>
              </div>
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
            </div>

            {/* Bar Chart Container */}
            {(() => {
              const maxVal = Math.max(
                1,
                ...paymentTrendData.map((d) => Math.max(d.earned, d.paid))
              );

              return (
                <div className="space-y-[3px]">
                  <div className="grid grid-cols-5 gap-[3px] pt-1.5 pb-2 px-1">
                    {paymentTrendData.map((wk) => {
                      const earnedHeightPct = Math.min(100, Math.max(8, (wk.earned / maxVal) * 100));
                      const paidHeightPct = Math.min(100, Math.max(6, (wk.paid / maxVal) * 100));

                      return (
                        <div key={wk.id} className="flex flex-col items-center justify-end group">
                          {/* Bar Graphic Box */}
                          <div className="w-full flex items-end justify-center gap-1 h-12 bg-slate-100 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-[4px] p-0.5 relative">
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
                          {/* Label Settimana */}
                          <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-full text-center">
                            {wk.shortLabel}
                          </div>
                          {/* Valore / Stato sotto la Settimana */}
                          <div className="mt-0.5 text-center">
                            {wk.pending > 0 ? (
                              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-900/40 inline-block whitespace-nowrap shadow-2xs">
                                € {wk.pending.toFixed(0)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-block">
                                ✓
                              </span>
                            )}
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
                {summaryFilter === 'all' ? 'Tutto il mese' : summaryFilter === 'weekend' ? 'Venerdì, Sabato e Domenica del mese' : 'Settimana specifica'}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-7 gap-[3px]">
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
                              className="flex items-center justify-between gap-2 p-[3px] px-2 bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/60 rounded-[4px] text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span
                                  className={`font-mono font-semibold shrink-0 text-[10px] ${
                                    isWeekend
                                      ? 'text-amber-800 dark:text-amber-300 font-bold'
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {d.date.substring(5)}
                                  {isWeekend ? ' (WE)' : ''}
                                </span>
                                <span
                                  className="text-slate-600 dark:text-slate-400 truncate min-w-0 flex-1 text-[11px]"
                                  title={d.cantiereName || 'Lavoro ordinario'}
                                >
                                  {d.cantiereName || 'Lavoro ordinario'}
                                </span>
                                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 whitespace-nowrap">
                                  {d.dayType === 'full' ? '1gg' : d.dayType === 'half' ? '0.5gg' : `${d.hours}h`}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-1">
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-200 whitespace-nowrap text-right">
                                  € {(d.amount || 0).toFixed(2)}
                                </span>

                                {/* Clickable Day Paid Toggle */}
                                <button
                                  type="button"
                                  onClick={() => updateWorkedDay({ ...d, paid: !d.paid })}
                                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded-[3px] border cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
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
