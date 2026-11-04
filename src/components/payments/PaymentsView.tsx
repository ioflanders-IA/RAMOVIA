import React, { useState, useMemo } from 'react';
import { useApp, consolidateWorkedDays } from '../../context/AppContext';
import { PaymentMethod, ExpenseCategory, ExpenseRecord, WorkerPayout, PaymentInstallment, Job } from '../../types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Plus,
  DollarSign,
  PieChart,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Building2,
  Fuel,
  Wrench,
  Package,
  Receipt,
  Check,
  X,
  FileText,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  RotateCcw,
  BarChart3,
} from 'lucide-react';

import { ClientDirectoryView } from './ClientDirectoryView';
import { ExpenseModal } from './ExpenseModal';
import { getClientColor } from '../../utils/clientColors';
import { ExpenseWalletVectorIcon } from '../common/HeaderVectorIcons';

const NATURANDO_LOGO_URL = 'https://www.naturandodal1997.it/wp-content/uploads/2023/06/Logo-Naturando-il-vivaio-per-il-tuo-giardino-removebg-preview.png';

export const PaymentsView: React.FC = () => {
  const {
    jobs,
    users,
    reports,
    expenses,
    payouts,
    clients,
    workedDays,
    addExpense,
    deleteExpense,
    recordWorkerPayout,
    updateWorkerPayout,
    updateJob,
    deleteJob,
    updateUserRole,
    addClient,
    updateClient,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'incassi' | 'clienti' | 'spese' | 'grafici' | 'naturando'>('incassi');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

  // Naturando tab states
  const [naturandoFilter, setNaturandoFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [naturandoDefaultPercentage, setNaturandoDefaultPercentage] = useState<number>(20);
  const [editingNaturandoJobId, setEditingNaturandoJobId] = useState<string | null>(null);
  const [editNaturandoAmount, setEditNaturandoAmount] = useState<number>(0);
  const [editNaturandoPct, setEditNaturandoPct] = useState<number>(20);

  // Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(50);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('carburante');
  const [expMethod, setExpMethod] = useState<PaymentMethod>('pos_carta');
  const [expVendor, setExpVendor] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Payout modal state
  const [selectedWorkerForPayout, setSelectedWorkerForPayout] = useState<any | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<PaymentMethod>('bonifico');
  const [payoutNotes, setPayoutNotes] = useState('');

  // Acconto modal state for ongoing jobs
  const [selectedJobForAcconto, setSelectedJobForAcconto] = useState<Job | null>(null);
  const [accontoAmount, setAccontoAmount] = useState<number>(0);
  const [accontoDate, setAccontoDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [accontoMethod, setAccontoMethod] = useState<PaymentMethod>('bonifico');
  const [accontoNotes, setAccontoNotes] = useState('');

  // Edit entire payment state for a Job (prezzo, metodo, stato, note)
  const [selectedJobForEditPayment, setSelectedJobForEditPayment] = useState<Job | null>(null);
  const [editPaymentPrice, setEditPaymentPrice] = useState<number>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('bonifico');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('unpaid');
  const [editPaymentNotes, setEditPaymentNotes] = useState<string>('');

  // Edit specific installment state
  const [editingInstallment, setEditingInstallment] = useState<{ job: Job; installment: PaymentInstallment } | null>(null);
  const [editInstAmount, setEditInstAmount] = useState<number>(0);
  const [editInstDate, setEditInstDate] = useState<string>('');
  const [editInstMethod, setEditInstMethod] = useState<PaymentMethod>('bonifico');
  const [editInstNotes, setEditInstNotes] = useState<string>('');

  // Confirmation modal to delete a specific installment
  const [installmentToDelete, setInstallmentToDelete] = useState<{ job: Job; installment: PaymentInstallment } | null>(null);

  // Confirmation modal to reset payments for a job
  const [jobToResetPayments, setJobToResetPayments] = useState<Job | null>(null);

  // Confirmation modal to delete an entire job / cantiere
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  // Confirmation modal to safely delete a single expense
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);

  // Edit modal state for single expense
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseRecord | null>(null);

  // Long-press state for operational expense cards
  const [longPressedExpenseId, setLongPressedExpenseId] = useState<string | null>(null);

  // Chart interactivity states
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [hoveredMonthKey, setHoveredMonthKey] = useState<string | null>(null);

  // Long-press state for revealing icon-only actions (modifica & azzera) in bottom-right
  const [longPressedPaymentJobId, setLongPressedPaymentJobId] = useState<string | null>(null);

  // Long-press state for revealing icon-only actions on installments
  const [longPressedInstallmentId, setLongPressedInstallmentId] = useState<string | null>(null);

  const createExpenseLongPressProps = (expId: string) => {
    let pressTimer: NodeJS.Timeout | null = null;

    const start = () => {
      pressTimer = setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
        setLongPressedExpenseId((prev) => (prev === expId ? null : expId));
      }, 500);
    };

    const clear = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    return {
      onMouseDown: () => start(),
      onMouseUp: () => clear(),
      onMouseLeave: () => clear(),
      onTouchStart: () => start(),
      onTouchEnd: () => clear(),
      onTouchMove: () => clear(),
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        setLongPressedExpenseId((prev) => (prev === expId ? null : expId));
      },
    };
  };

  const parseExpenseDetails = (exp: ExpenseRecord) => {
    let rawTitle = exp.title || '';
    let extractedClientName = exp.clientName || '';

    // Extract bracketed client name e.g. "Smaltimento [Alberto]" -> title "Smaltimento", client "Alberto"
    const match = rawTitle.match(/^(.*?)\[(.*?)\](.*)$/);
    if (match) {
      rawTitle = (match[1] + match[3]).trim();
      if (!extractedClientName) {
        extractedClientName = match[2].trim();
      }
    }

    if (!extractedClientName && exp.recipientOrVendor) {
      const matchVendor = clients.find(
        (c) => c.name.toLowerCase().trim() === exp.recipientOrVendor?.toLowerCase().trim()
      );
      if (matchVendor) {
        extractedClientName = matchVendor.name;
      }
    }

    const matchedClient = clients.find(
      (c) =>
        (exp.clientId && c.id === exp.clientId) ||
        (extractedClientName && c.name.toLowerCase().trim() === extractedClientName.toLowerCase().trim())
    );

    const clientColor = matchedClient ? getClientColor(matchedClient) : null;

    return {
      cleanTitle: rawTitle || exp.title,
      clientName: matchedClient ? matchedClient.name : extractedClientName,
      clientColor,
      matchedClient,
    };
  };

  const createInstallmentLongPress = (instId: string) => {
    let pressTimer: NodeJS.Timeout | null = null;

    const start = () => {
      pressTimer = setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
        setLongPressedInstallmentId((prev) => (prev === instId ? null : instId));
      }, 500);
    };

    const clear = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    return {
      onMouseDown: () => start(),
      onMouseUp: () => clear(),
      onMouseLeave: () => clear(),
      onTouchStart: () => start(),
      onTouchEnd: () => clear(),
      onTouchMove: () => clear(),
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        setLongPressedInstallmentId((prev) => (prev === instId ? null : instId));
      },
    };
  };

  const createPaymentCardLongPress = (jobId: string) => {
    let pressTimer: NodeJS.Timeout | null = null;
    let didLong = false;

    const start = () => {
      didLong = false;
      pressTimer = setTimeout(() => {
        didLong = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
        setLongPressedPaymentJobId((prev) => (prev === jobId ? null : jobId));
      }, 500);
    };

    const clear = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    return {
      onMouseDown: () => start(),
      onMouseUp: () => clear(),
      onMouseLeave: () => clear(),
      onTouchStart: () => start(),
      onTouchEnd: () => clear(),
      onTouchMove: () => clear(),
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        setLongPressedPaymentJobId((prev) => (prev === jobId ? null : jobId));
      },
    };
  };

  // 1. Calculate Revenue from Jobs
  const totalJobRevenue = jobs.reduce((sum, j) => sum + (j.price || 0), 0);
  const totalJobCollected = jobs.reduce((sum, j) => {
    if (j.paymentStatus === 'paid') return sum + (j.price || 0);
    if (j.installments && j.installments.length > 0) {
      return sum + j.installments.reduce((s, it) => s + it.amount, 0);
    }
    if (j.paidAmount) return sum + j.paidAmount;
    if (j.paymentStatus === 'partial') return sum + ((j.price || 0) / 2);
    return sum;
  }, 0);
  const totalJobPending = Math.max(0, totalJobRevenue - totalJobCollected);

  // 2. Calculate Worker Earnings & Pending Payouts based on workedDays and payouts (strictly per-worker)
  const workers = useMemo(() => users.filter((u) => u.role === 'worker'), [users]);
  const workerUids = useMemo(() => new Set(workers.map((w) => w.uid)), [workers]);
  const validWorkedDays = useMemo(
    () => consolidateWorkedDays(workedDays.filter((wd) => workerUids.has(wd.workerId))),
    [workedDays, workerUids]
  );

  const { totalWorkerPaidAll, totalWorkerPendingAll } = useMemo(() => {
    // 1. Collect all distinct months (YYYY-MM) across workedDays and payouts
    const allMonths = new Set<string>();
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    allMonths.add(currentMonthStr);

    validWorkedDays.forEach((wd) => {
      if (wd.date && wd.date.length >= 7) {
        allMonths.add(wd.date.substring(0, 7));
      }
    });

    payouts.forEach((p) => {
      if (workerUids.has(p.workerId) && p.status === 'paid') {
        const pDate = p.paymentDate || p.createdAt?.split('T')[0];
        if (p.period && p.period.length >= 7) {
          allMonths.add(p.period.substring(0, 7));
        } else if (pDate && pDate.length >= 7) {
          allMonths.add(pDate.substring(0, 7));
        }
      }
    });

    let pendingTotal = 0;
    let paidTotalFromPeriods = 0;

    // 2. Compute month-by-month for each worker to align strictly with SquadWorkersRegistry
    // and prevent historical payouts (e.g. October) from zeroing out current unpaid wages (e.g. November)
    workers.forEach((worker) => {
      const workerDays = validWorkedDays.filter((wd) => wd.workerId === worker.uid);
      const workerPayouts = payouts.filter(
        (p) => p.workerId === worker.uid && p.status === 'paid'
      );

      const processedDayIds = new Set<string>();

      allMonths.forEach((m) => {
        const mDays = workerDays.filter((d) => d.date && d.date.startsWith(m));
        mDays.forEach((d) => processedDayIds.add(d.id));

        const mEarned = mDays.reduce((sum, d) => sum + (d.amount || 0), 0);

        const mPayouts = workerPayouts.filter((p) => {
          const pDate = p.paymentDate || p.createdAt?.split('T')[0];
          return p.period === m || (pDate && pDate.startsWith(m));
        });

        const mPaidPayouts = mPayouts.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const mPaidDays = mDays.filter((d) => d.paid).reduce((sum, d) => sum + (d.amount || 0), 0);
        const rawPaid = Math.max(mPaidPayouts, mPaidDays);
        const mPaid = mEarned > 0 ? Math.min(mEarned, rawPaid) : rawPaid;

        const mPending = Math.max(0, mEarned - mPaid);
        pendingTotal += mPending;
        paidTotalFromPeriods += mPaid;
      });

      // Handle any non-dated or unzoned worked days if any
      const unzonedDays = workerDays.filter((d) => !processedDayIds.has(d.id));
      if (unzonedDays.length > 0) {
        const unzonedEarned = unzonedDays.reduce((sum, d) => sum + (d.amount || 0), 0);
        const unzonedPaid = unzonedDays.filter((d) => d.paid).reduce((sum, d) => sum + (d.amount || 0), 0);
        const cappedUnzonedPaid = unzonedEarned > 0 ? Math.min(unzonedEarned, unzonedPaid) : unzonedPaid;
        pendingTotal += Math.max(0, unzonedEarned - cappedUnzonedPaid);
        paidTotalFromPeriods += cappedUnzonedPaid;
      }
    });

    return {
      totalWorkerPaidAll: paidTotalFromPeriods,
      totalWorkerPendingAll: pendingTotal,
    };
  }, [workers, workerUids, validWorkedDays, payouts]);

  // 3. Calculate Expenses
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // 4. Operating Profit Margin
  const netMargin = totalJobCollected - totalWorkerPaidAll - totalExpensesAmount;

  // Monochromatic modern green/emerald palette for Donut Chart
  const MONOCHROME_EMERALD_PALETTE = [
    '#047857', // emerald-700
    '#059669', // emerald-600
    '#10b981', // emerald-500
    '#34d399', // emerald-400
    '#065f46', // emerald-800
    '#6ee7b7', // emerald-300
    '#064e3b', // emerald-900
    '#0f766e', // teal-700
    '#14b8a6', // teal-500
    '#a7f3d0', // emerald-200
  ];

  // 1. Spese raggruppate per categoria (include tutte le categorie senza forzare il ripiego su generale)
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, { category: string; label: string; amount: number; count: number }>();

    const knownLabels: Record<string, string> = {
      carburante: 'Carburante',
      manutenzione: 'Manutenzione Attrezzature',
      materiale: 'Materiali Cantiere',
      attrezzatura: 'Nuova Attrezzatura',
      smaltimento: 'Smaltimento / Discarica',
      generale: 'Spese Generali',
      stipendio: 'Manodopera / Stipendi',
    };

    expenses.forEach((e) => {
      const rawCat = (e.category || 'Spese Generali').trim();
      const lowerCat = rawCat.toLowerCase();
      const displayLabel = knownLabels[lowerCat] || rawCat;

      const existing = map.get(displayLabel) || {
        category: displayLabel,
        label: displayLabel,
        amount: 0,
        count: 0,
      };
      existing.amount += Number(e.amount) || 0;
      existing.count += 1;
      map.set(displayLabel, existing);
    });

    const list = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
    const total = list.reduce((sum, item) => sum + item.amount, 0);

    return list.map((item, index) => ({
      ...item,
      color: MONOCHROME_EMERALD_PALETTE[index % MONOCHROME_EMERALD_PALETTE.length],
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }));
  }, [expenses]);

  // 2. Andamento temporale spese (raggruppamento cronologico per mese)
  const expensesByMonth = useMemo(() => {
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const monthMap = new Map<string, { key: string; label: string; fullLabel: string; year: string; amount: number; count: number }>();

    // Inizializza gli ultimi 6 mesi per continuità visiva immediata
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear().toString();
      const mNum = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${mNum}`;
      monthMap.set(key, {
        key,
        label: `${monthNames[d.getMonth()]} '${y.slice(2)}`,
        fullLabel: `${monthNames[d.getMonth()]} ${y}`,
        year: y,
        amount: 0,
        count: 0,
      });
    }

    // Aggiungi le spese effettive registrate
    expenses.forEach((e) => {
      const dateStr = e.date || e.createdAt;
      if (!dateStr) return;
      const key = dateStr.slice(0, 7); // YYYY-MM
      if (!monthMap.has(key)) {
        const parts = key.split('-');
        const y = parts[0];
        const mIdx = (parseInt(parts[1], 10) || 1) - 1;
        monthMap.set(key, {
          key,
          label: `${monthNames[mIdx] || parts[1]} '${y.slice(2)}`,
          fullLabel: `${monthNames[mIdx] || parts[1]} ${y}`,
          year: y,
          amount: 0,
          count: 0,
        });
      }
      const entry = monthMap.get(key)!;
      entry.amount += Number(e.amount) || 0;
      entry.count += 1;
    });

    const sorted = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));
    const displayMonths = sorted.length > 8 ? sorted.slice(sorted.length - 8) : sorted;

    const maxMonthAmount = Math.max(...displayMonths.map((m) => m.amount), 1);
    const totalPeriodAmount = displayMonths.reduce((s, m) => s + m.amount, 0);
    const avgMonthly = displayMonths.length > 0 ? totalPeriodAmount / displayMonths.length : 0;
    const peakMonth = displayMonths.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), displayMonths[0]);

    return {
      months: displayMonths,
      maxMonthAmount,
      totalPeriodAmount,
      avgMonthly,
      peakMonth,
    };
  }, [expenses]);

  // Handlers
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) return;

    await addExpense({
      title: expTitle,
      amount: Number(expAmount),
      category: expCategory,
      paymentMethod: expMethod,
      recipientOrVendor: expVendor,
      date: expDate,
      status: 'paid',
    });

    setShowExpenseModal(false);
    setExpTitle('');
    setExpAmount(50);
    setExpVendor('');
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerForPayout || payoutAmount <= 0) return;

    await recordWorkerPayout({
      workerId: selectedWorkerForPayout.worker.uid,
      workerName: selectedWorkerForPayout.worker.displayName,
      period: new Date().toISOString().substring(0, 7),
      totalHours: selectedWorkerForPayout.totalHours,
      daysWorked: selectedWorkerForPayout.daysWorked,
      hourlyRate: selectedWorkerForPayout.hourlyRate,
      totalAmount: Number(payoutAmount),
      paymentMethod: payoutMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'paid',
      notes: payoutNotes,
    });

    setSelectedWorkerForPayout(null);
    setPayoutAmount(0);
    setPayoutNotes('');
  };

  const getMethodLabel = (method?: PaymentMethod) => {
    switch (method) {
      case 'bonifico':
        return 'Bonifico';
      case 'contanti':
        return 'Contanti';
      case 'pos_carta':
        return 'POS / Carta';
      case 'assegno':
        return 'Assegno';
      case 'riba_30_60':
        return 'RiBa 30/60 gg';
      default:
        return 'Non Specificato';
    }
  };

  // Handlers for Editing Entire Payment
  const handleOpenEditPayment = (job: Job) => {
    setSelectedJobForEditPayment(job);
    setEditPaymentPrice(job.price || 0);
    setEditPaymentMethod(job.paymentMethod || 'bonifico');
    const price = job.price || 0;
    const installmentsSum = (job.installments || []).reduce((s, it) => s + it.amount, 0);
    const paid = job.paymentStatus === 'paid' ? price : (installmentsSum > 0 ? installmentsSum : (job.paidAmount || 0));
    const normalizedStatus: 'paid' | 'partial' | 'unpaid' =
      job.paymentStatus === 'paid'
        ? 'paid'
        : job.paymentStatus === 'partial'
        ? 'partial'
        : paid >= price && price > 0
        ? 'paid'
        : paid > 0
        ? 'partial'
        : 'unpaid';
    setEditPaymentStatus(normalizedStatus);
    setEditPaymentNotes(job.notes || '');
  };

  const handleSaveEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForEditPayment) return;

    const currentInst = selectedJobForEditPayment.installments || [];
    const instSum = currentInst.reduce((s, it) => s + it.amount, 0);
    let newPaid = selectedJobForEditPayment.paidAmount || 0;

    if (editPaymentStatus === 'paid') {
      newPaid = Number(editPaymentPrice);
    } else if (editPaymentStatus === 'unpaid') {
      newPaid = 0;
    } else {
      newPaid = instSum > 0 ? instSum : Math.min(Number(editPaymentPrice), selectedJobForEditPayment.paidAmount || Number(editPaymentPrice) / 2);
    }

    await updateJob({
      ...selectedJobForEditPayment,
      price: Number(editPaymentPrice),
      paymentMethod: editPaymentMethod,
      paymentStatus: editPaymentStatus,
      paidAmount: newPaid,
      notes: editPaymentNotes.trim() || undefined,
    });

    setSelectedJobForEditPayment(null);
  };

  // Handlers for Editing a Specific Installment
  const handleOpenEditInstallment = (job: Job, inst: PaymentInstallment) => {
    setEditingInstallment({ job, installment: inst });
    setEditInstAmount(inst.amount);
    setEditInstDate(inst.date);
    setEditInstMethod(inst.paymentMethod);
    setEditInstNotes(inst.notes || '');
  };

  const handleSaveEditInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstallment || editInstAmount <= 0) return;

    const { job, installment } = editingInstallment;
    const currentInst = job.installments || [];
    const updatedInst = currentInst.map((it) =>
      it.id === installment.id
        ? {
            ...it,
            amount: Number(editInstAmount),
            date: editInstDate,
            paymentMethod: editInstMethod,
            notes: editInstNotes.trim() || undefined,
          }
        : it
    );

    const price = job.price || 0;
    const newPaid = updatedInst.reduce((s, it) => s + it.amount, 0);
    const newStatus: any = newPaid >= price && price > 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    const updatedJob = {
      ...job,
      installments: updatedInst,
      paidAmount: newPaid,
      paymentStatus: newStatus,
    };

    await updateJob(updatedJob);
    if (selectedJobForAcconto && selectedJobForAcconto.id === job.id) {
      setSelectedJobForAcconto(updatedJob);
    }
    setEditingInstallment(null);
  };

  // Handler for Deleting an Installment
  const handleConfirmDeleteInstallment = async () => {
    if (!installmentToDelete) return;
    const { job, installment } = installmentToDelete;
    const currentInst = job.installments || [];
    const updatedInst = currentInst.filter((it) => it.id !== installment.id);
    const price = job.price || 0;
    const newPaid = updatedInst.reduce((s, it) => s + it.amount, 0);
    const newStatus: any = newPaid >= price && price > 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    const updatedJob = {
      ...job,
      installments: updatedInst,
      paidAmount: newPaid,
      paymentStatus: newStatus,
    };

    await updateJob(updatedJob);
    if (selectedJobForAcconto && selectedJobForAcconto.id === job.id) {
      setSelectedJobForAcconto(updatedJob);
    }
    setInstallmentToDelete(null);
  };

  // Handler for Resetting All Payments on a Job
  const handleConfirmResetPayments = async () => {
    if (!jobToResetPayments) return;
    const updatedJob = {
      ...jobToResetPayments,
      installments: [],
      paidAmount: 0,
      paymentStatus: 'unpaid' as const,
    };
    await updateJob(updatedJob);
    if (selectedJobForAcconto && selectedJobForAcconto.id === jobToResetPayments.id) {
      setSelectedJobForAcconto(updatedJob);
    }
    setJobToResetPayments(null);
  };

  // Toggle Saldo: Segna Saldato / Riapri come non saldato
  const handleToggleJobPaid = async (job: Job) => {
    const price = job.price || 0;
    const isCurrentlyPaid = job.paymentStatus === 'paid';

    if (isCurrentlyPaid) {
      const instSum = (job.installments || []).reduce((s, it) => s + it.amount, 0);
      const newStatus = instSum > 0 ? 'partial' : 'unpaid';
      await updateJob({
        ...job,
        paymentStatus: newStatus,
        paidAmount: instSum,
      });
    } else {
      await updateJob({
        ...job,
        paymentStatus: 'paid',
        paidAmount: price,
      });
    }
  };

  // Helper to format currency removing trailing ,00
  const formatAmountNoCents = (val: number) => {
    return Math.abs(val) % 1 === 0 ? val.toFixed(0) : val.toFixed(2);
  };

  // Naturando computations & handlers
  const naturandoJobs = useMemo(() => {
    return jobs.filter(
      (j) => j.isNaturando === true || j.title?.toLowerCase().includes('naturando') || j.description?.toLowerCase().includes('naturando')
    );
  }, [jobs]);

  const naturandoTotals = useMemo(() => {
    let totalCommunicated = 0;
    let totalDue = 0;
    let totalNet = 0;
    let totalPaid = 0;
    let totalPending = 0;

    naturandoJobs.forEach((job) => {
      const amount = job.naturandoAmount !== undefined && job.naturandoAmount > 0
        ? job.naturandoAmount
        : (job.price || 0);
      const pct = job.naturandoPercentage !== undefined && job.naturandoPercentage > 0
        ? job.naturandoPercentage
        : naturandoDefaultPercentage;
      const due = (amount * pct) / 100;
      const net = amount - due;

      totalCommunicated += amount;
      totalDue += due;
      totalNet += net;

      if (job.naturandoPaid) {
        totalPaid += due;
      } else {
        totalPending += due;
      }
    });

    return { totalCommunicated, totalDue, totalNet, totalPaid, totalPending };
  }, [naturandoJobs, naturandoDefaultPercentage]);

  const filteredNaturandoJobs = useMemo(() => {
    return naturandoJobs.filter((j) => {
      if (naturandoFilter === 'pending') return !j.naturandoPaid;
      if (naturandoFilter === 'paid') return !!j.naturandoPaid;
      return true;
    });
  }, [naturandoJobs, naturandoFilter]);

  const handleToggleNaturandoPaid = async (job: Job) => {
    const nextPaid = !job.naturandoPaid;
    await updateJob({
      ...job,
      isNaturando: true,
      naturandoPaid: nextPaid,
      naturandoPaidDate: nextPaid ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const handleSaveNaturandoValues = async (job: Job) => {
    await updateJob({
      ...job,
      isNaturando: true,
      naturandoAmount: Number(editNaturandoAmount) || 0,
      naturandoPercentage: Number(editNaturandoPct) || 20,
    });
    setEditingNaturandoJobId(null);
  };

  return (
    <div className="space-y-[7px]">

      {/* Financial KPI Summary Grid - Senza sfondo e senza bordi, max 3px sopra e sotto al testo */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {/* Total Collections */}
        <div className="py-[3px] px-0.5 sm:px-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 py-[3px] leading-tight">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Incassi</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0 hidden sm:block" />
          </div>
          <div className="text-[16px] sm:text-[21px] md:text-[26.5px] text-right font-extrabold font-mono text-emerald-700 dark:text-emerald-400 truncate py-[3px] leading-none">
            € {formatAmountNoCents(totalJobCollected)}
          </div>
        </div>

        {/* Total Salaries */}
        <div className="py-[3px] px-0.5 sm:px-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 py-[3px] leading-tight">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Stipendi</span>
            <Users className="w-3.5 h-3.5 text-sky-600 shrink-0 hidden sm:block" />
          </div>
          <div className="flex flex-col items-end justify-center py-[1px] leading-none space-y-0.5">
            <div className="text-right font-mono font-extrabold text-sky-700 dark:text-sky-400 text-xs sm:text-sm md:text-base leading-tight" title="Totale già liquidato / pagato agli operai">
              € {formatAmountNoCents(totalWorkerPaidAll)} <span className="text-[9px] sm:text-[10px] font-sans font-bold text-slate-400 uppercase">Pagati</span>
            </div>
            <div className="text-right font-mono font-extrabold text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs md:text-sm leading-tight" title="Totale maturato ancora da dare agli operai">
              € {formatAmountNoCents(totalWorkerPendingAll)} <span className="text-[9px] sm:text-[10px] font-sans font-bold text-amber-600/80 dark:text-amber-400/80 uppercase">Da dare</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="py-[3px] px-0.5 sm:px-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 py-[3px] leading-tight">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Spese</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0 hidden sm:block" />
          </div>
          <div className="text-[16px] sm:text-[21px] md:text-[26.5px] text-right font-extrabold font-mono text-rose-700 dark:text-rose-400 truncate py-[3px] leading-none">
            € {formatAmountNoCents(totalExpensesAmount)}
          </div>
        </div>

        {/* Net Operating Margin */}
        <div className="py-[3px] px-0.5 sm:px-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 py-[3px] leading-tight">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Margine</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0 hidden sm:block" />
          </div>
          <div className={`text-[16px] sm:text-[21px] md:text-[26.5px] text-right font-extrabold font-mono truncate py-[3px] leading-none ${netMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            € {formatAmountNoCents(netMargin)}
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation - 5 Schede con Naturando dopo Bilancio, + Spesa al rigo sotto */}
      <div className="py-0.5 space-y-1.5">
        <div className="grid grid-cols-5 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('incassi')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-[6px] transition-colors cursor-pointer text-center ${
              activeSubTab === 'incassi'
                ? 'bg-emerald-800 text-white dark:bg-emerald-700 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Incassi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('spese')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-[6px] transition-colors cursor-pointer text-center ${
              activeSubTab === 'spese'
                ? 'bg-emerald-800 text-white dark:bg-emerald-700 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Fuel className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Spese</span>
          </button>

          <button
            onClick={() => setActiveSubTab('clienti')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-[6px] transition-colors cursor-pointer text-center ${
              activeSubTab === 'clienti'
                ? 'bg-indigo-700 text-white dark:bg-indigo-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
            <span className="truncate">Clienti</span>
          </button>

          <button
            onClick={() => setActiveSubTab('grafici')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-[6px] transition-colors cursor-pointer text-center ${
              activeSubTab === 'grafici'
                ? 'bg-emerald-800 text-white dark:bg-emerald-700 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Bilancio</span>
          </button>

          {/* Scheda Naturando (dopo Bilancio) */}
          <button
            onClick={() => setActiveSubTab('naturando')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-[6px] transition-colors cursor-pointer text-center ${
              activeSubTab === 'naturando'
                ? 'bg-emerald-800 text-white dark:bg-emerald-700 shadow-xs ring-1 ring-emerald-500/50'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <img
              src={NATURANDO_LOGO_URL}
              alt="Naturando"
              className="h-3.5 max-w-[38px] object-contain shrink-0"
            />
            <span className="truncate">Naturando</span>
          </button>
        </div>

        {/* Tasto Registra Nuova Spesa spostato al rigo sotto */}
        <div className="flex items-center justify-end pt-0.5">
          <button
            type="button"
            onClick={() => setShowExpenseModal(true)}
            title="Registra Nuova Spesa"
            aria-label="Registra Nuova Spesa"
            className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuova Spesa</span>
          </button>
        </div>
      </div>


      {/* TAB 2: JOB COLLECTIONS & REVENUE */}
      {activeSubTab === 'incassi' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] shadow-xs space-y-[3px]">
          <div className="flex items-center justify-between px-1.5 pt-1 pb-1">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Registro Incassi Lavori
            </h3>
          </div>

          {/* Filtri Stato Incasso sullo STESSO RIGO (Tutti compatto, gli altri tre allargati) */}
          <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-[3px] text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`py-1.5 px-2.5 rounded-[5px] border text-center transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Tutti
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unpaid')}
              className={`py-1.5 px-1 rounded-[5px] border text-center transition-colors cursor-pointer truncate ${
                statusFilter === 'unpaid'
                  ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
              }`}
              title="Da Incassare"
            >
              Da Incassare
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('partial')}
              className={`py-1.5 px-1 rounded-[5px] border text-center transition-colors cursor-pointer truncate ${
                statusFilter === 'partial'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
              }`}
              title="Acconto"
            >
              Acconto
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`py-1.5 px-1 rounded-[5px] border text-center transition-colors cursor-pointer truncate ${
                statusFilter === 'paid'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
              }`}
              title="Saldato"
            >
              Saldato
            </button>
          </div>

          <div className="space-y-[3px] max-h-[500px] overflow-y-auto">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nessun cantiere o intervento ancora registrato.
              </div>
            ) : (
              jobs
                .filter((job) => {
                  if (statusFilter === 'all') return true;
                  const price = job.price || 0;
                  const installments = job.installments || [];
                  const installmentsSum = installments.reduce((sum, it) => sum + (it.amount || 0), 0);
                  const isExplicitlyPaid = job.paymentStatus === 'paid';
                  const isExplicitlyUnpaid = job.paymentStatus === 'unpaid';

                  let paid = 0;
                  if (isExplicitlyPaid) {
                    paid = price;
                  } else if (installmentsSum > 0) {
                    paid = installmentsSum;
                  } else if (job.paidAmount && !isExplicitlyUnpaid) {
                    paid = job.paidAmount;
                  } else {
                    paid = 0;
                  }

                  const jobComputedStatus: 'paid' | 'partial' | 'unpaid' =
                    isExplicitlyPaid || (paid >= price && price > 0)
                      ? 'paid'
                      : paid > 0
                      ? 'partial'
                      : 'unpaid';

                  return jobComputedStatus === statusFilter;
                })
                .map((job) => {
                const price = job.price || 0;
                const installments = job.installments || [];
                const installmentsSum = installments.reduce((sum, it) => sum + (it.amount || 0), 0);
                const isExplicitlyPaid = job.paymentStatus === 'paid';
                const isExplicitlyUnpaid = job.paymentStatus === 'unpaid';

                let paid = 0;
                if (isExplicitlyPaid) {
                  paid = price;
                } else if (installmentsSum > 0) {
                  paid = installmentsSum;
                } else if (job.paidAmount && !isExplicitlyUnpaid) {
                  paid = job.paidAmount;
                } else {
                  paid = 0;
                }

                const remaining = Math.max(0, price - paid);
                const status: 'paid' | 'partial' | 'unpaid' =
                  isExplicitlyPaid || (paid >= price && price > 0)
                    ? 'paid'
                    : paid > 0
                    ? 'partial'
                    : 'unpaid';
                const method = job.paymentMethod || 'bonifico';

                const isLongPressed = longPressedPaymentJobId === job.id;
                const pressHandlers = createPaymentCardLongPress(job.id);

                return (
                  <div
                    key={job.id}
                    {...pressHandlers}
                    className={`p-[3px] bg-white dark:bg-slate-900 border rounded-[7px] space-y-[3px] text-xs transition-all shadow-2xs select-none ${
                      isLongPressed
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Cliente, Titolo, Data (sulla destra) & Badge Stato */}
                    <div className="flex items-start justify-between gap-1.5 px-1.5 pt-1 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {job.clientName}
                          </span>
                          {job.interventionType === 'generale' && (
                            <span className="font-mono text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800 shrink-0">
                              Periodico
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {job.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Modalità: <strong className="text-slate-700 dark:text-slate-300">{getMethodLabel(method)}</strong>
                        </div>
                      </div>

                      {/* Right: Data e Badge Stato */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded shrink-0">
                          {job.date}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-[5px] tracking-wider border ${
                            status === 'paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : status === 'partial'
                              ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              status === 'paid'
                                ? 'bg-emerald-500'
                                : status === 'partial'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>{status === 'paid' ? 'Saldato' : status === 'partial' ? 'Acconto' : 'Da Incassare'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Financial Breakdown: Testo normale senza bordi o sfondi (testo a sx e importi a dx) */}
                    <div className="space-y-[3px] text-xs px-1.5 py-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Prezzo Totale:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          € {price.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <span>Incassato</span>
                          {installments.length > 0 && (
                            <span className="text-[10px] font-normal opacity-80">({installments.length})</span>
                          )}
                          <span>:</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          € {paid.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${remaining === 0 ? 'text-slate-400' : 'text-amber-700 dark:text-amber-400'}`}>
                          Rimanente da Saldare:
                        </span>
                        <span className={`font-mono font-bold ${remaining === 0 ? 'text-slate-400' : 'text-amber-700 dark:text-amber-400'}`}>
                          € {remaining.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Acconti e Versamenti Registrati */}
                    {installments.length > 0 && (
                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 px-1 space-y-[3px]">
                        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <span>Acconti ({installments.length})</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            Totale: € {installmentsSum.toFixed(2)}
                          </span>
                        </div>

                        <div className="space-y-[3px]">
                          {installments.map((inst, idx) => {
                            const isInstLongPressed = longPressedInstallmentId === inst.id;
                            const instLongPress = createInstallmentLongPress(inst.id);
                            return (
                              <div
                                key={inst.id}
                                {...instLongPress}
                                className={`flex items-center justify-between py-1 px-1 text-xs select-none cursor-pointer transition-colors rounded ${
                                  isInstLongPressed ? 'bg-slate-100/90 dark:bg-slate-800/60' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0 text-xs">
                                    #{idx + 1}
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-500 shrink-0">
                                    {inst.date}
                                  </span>
                                  <span className="text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                                    {getMethodLabel(inst.paymentMethod)}
                                  </span>
                                  {inst.notes && (
                                    <span className="text-[10px] text-slate-400 italic truncate max-w-[120px] sm:max-w-xs" title={inst.notes}>
                                      "{inst.notes}"
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                                    € {inst.amount.toFixed(2)}
                                  </span>
                                  {isInstLongPressed && (
                                    <div className="flex items-center gap-0.5 ml-1 animate-in fade-in duration-150">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditInstallment(job, inst)}
                                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer bg-transparent border-0"
                                        title="Modifica questo acconto"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setInstallmentToDelete({ job, installment: inst })}
                                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer bg-transparent border-0"
                                        title="Elimina questo acconto"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions Toolbar: Left = Modifica, Elimina Cantiere, Azzera Incassi; Right = Saldato & + Acconto */}
                    <div className="flex items-center justify-between gap-2 px-1 pt-1 border-t border-slate-100 dark:border-slate-800 min-h-[34px]">
                      {/* Left: Icon-only actions with stopPropagation */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                        {isLongPressed ? (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in-90 duration-150">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleOpenEditPayment(job);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer bg-slate-100 dark:bg-slate-800/80 rounded-[5px]"
                              title="Modifica pagamento e dettagli cantiere"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setJobToDelete(job);
                              }}
                              className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer bg-rose-50 dark:bg-rose-950/60 rounded-[5px]"
                              title="Elimina definitivamente questo intervento/cantiere"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {(paid > 0 || installments.length > 0) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setJobToResetPayments(job);
                                }}
                                className="p-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors cursor-pointer bg-amber-50 dark:bg-amber-950/60 rounded-[5px]"
                                title="Azzera incassi del cantiere"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleOpenEditPayment(job);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Pressione prolungata o clicca per opzioni (Modifica / Elimina)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Right: [Saldato] then [+ Acconto] furthest right */}
                      <div className="flex items-center gap-1.5 ml-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleJobPaid(job)}
                          className={`p-1 px-2.5 rounded-[5px] font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1 transition-colors ${
                            status === 'paid'
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:hover:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {status === 'paid' ? (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>Riapri (Non Saldato)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Saldato</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJobForAcconto(job);
                            setAccontoAmount(remaining > 0 ? remaining : 50);
                            setAccontoDate(new Date().toISOString().split('T')[0]);
                            setAccontoMethod(job.paymentMethod || 'bonifico');
                            setAccontoNotes('');
                          }}
                          className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-[5px] font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Acconto</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB: RUBRICA CLIENTI & STORICO CANTIERI MULTIPLI */}
      {activeSubTab === 'clienti' && (
        <ClientDirectoryView
          clients={clients}
          jobs={jobs}
          onUpdateClient={updateClient}
          onAddClient={addClient}
          onOpenAccontoModal={(job) => {
            setSelectedJobForAcconto(job);
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
            setAccontoAmount(Math.max(0, price - effectivePaid));
            setAccontoDate(new Date().toISOString().split('T')[0]);
            setAccontoMethod(job.paymentMethod || 'bonifico');
            setAccontoNotes('');
          }}
        />
      )}

      {/* TAB 3: OPERATIONAL EXPENSES - SENZA SFONDO SCHEDA, TITOLO PULITO, ICONA ROSSA VETTORIALE */}
      {activeSubTab === 'spese' && (
        <div className="space-y-[7px]">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              REGISTRO SPESE
            </h3>
            <button
              type="button"
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center p-1 bg-transparent border-0 shadow-none hover:opacity-85 transition-opacity shrink-0 cursor-pointer"
              title="Aggiungi Nuova Spesa"
              aria-label="Aggiungi Spesa"
            >
              <ExpenseWalletVectorIcon className="w-8 h-8" />
            </button>
          </div>

          <div className="space-y-[7px] max-h-[520px] overflow-y-auto">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nessuna spesa registrata. Clicca su "Aggiungi Spesa" per registrarne una.
              </div>
            ) : (
              expenses.map((exp) => {
                const { cleanTitle, clientName, clientColor } = parseExpenseDetails(exp);
                const isLongPressed = longPressedExpenseId === exp.id;
                const longPressProps = createExpenseLongPressProps(exp.id);

                return (
                  <div
                    key={exp.id}
                    {...longPressProps}
                    className={`p-[7px] bg-slate-50 dark:bg-slate-800/60 border rounded-[7px] flex items-center justify-between gap-[7px] text-xs transition-all select-none cursor-pointer ${
                      isLongPressed
                        ? 'border-emerald-500 dark:border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    style={clientColor ? { borderLeftWidth: '5px', borderLeftColor: clientColor } : undefined}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                          {cleanTitle}
                        </span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                          {exp.category}
                        </span>
                        {clientName && (
                          <span
                            className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border truncate shrink-0 max-w-[160px] inline-flex items-center gap-1 shadow-2xs"
                            style={
                              clientColor
                                ? {
                                    backgroundColor: `${clientColor}22`,
                                    color: clientColor,
                                    borderColor: `${clientColor}55`,
                                  }
                                : {
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    color: '#2563eb',
                                    borderColor: 'rgba(59, 130, 246, 0.3)',
                                  }
                            }
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: clientColor || '#2563eb' }} />
                            <span>{clientName}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {exp.recipientOrVendor || 'Fornitore non specificato'} · {exp.date} · {getMethodLabel(exp.paymentMethod)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="font-mono font-bold text-sm text-rose-700 dark:text-rose-400">
                        - € {exp.amount.toFixed(2)}
                      </div>

                      {/* Action Buttons appear ONLY after Long Press */}
                      {isLongPressed && (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in-90 duration-150 ml-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpTitle(exp.title);
                              setExpAmount(exp.amount);
                              setExpCategory(exp.category);
                              setExpMethod(exp.paymentMethod || 'pos_carta');
                              setExpVendor(exp.recipientOrVendor || '');
                              setExpDate(exp.date || new Date().toISOString().split('T')[0]);
                              setExpenseToEdit(exp);
                            }}
                            className="p-1.5 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-200 dark:bg-slate-700 rounded-[5px] cursor-pointer transition-colors"
                            title="Modifica Spesa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpenseToDelete(exp);
                            }}
                            className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-100 dark:bg-rose-950/70 rounded-[5px] cursor-pointer transition-colors"
                            title="Elimina Spesa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CHARTS & FINANCIAL TRENDS */}
      {activeSubTab === 'grafici' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[7px]">
          {/* CHART 1: Monochromatic Emerald Donut Chart for Expense Categories */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>Spese per Categoria (Donut Chart)</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                Totale: € {totalExpensesAmount.toFixed(2)}
              </span>
            </div>

            {expensesByCategory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nessuna spesa disponibile per generare il grafico.
              </div>
            ) : (
              <div className="p-2 space-y-4">
                {/* Donut Chart SVG & Center Hole */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {(() => {
                        const radius = 36;
                        const circumference = 2 * Math.PI * radius; // ~226.195
                        let cumulativeOffset = 0;

                        return expensesByCategory.map((cat) => {
                          const sliceLength = (cat.percentage / 100) * circumference;
                          const offset = cumulativeOffset;
                          cumulativeOffset += sliceLength;
                          const isSelected = selectedCategoryKey === cat.category;

                          return (
                            <circle
                              key={cat.category}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="transparent"
                              stroke={cat.color}
                              strokeWidth={isSelected ? 18 : 15}
                              strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
                              strokeDashoffset={-offset}
                              className="transition-all duration-300 cursor-pointer hover:opacity-90"
                              onClick={() => setSelectedCategoryKey((prev) => (prev === cat.category ? null : cat.category))}
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Donut Center Hole display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                        {selectedCategoryKey
                          ? expensesByCategory.find((c) => c.category === selectedCategoryKey)?.label
                          : 'Totale Spese'}
                      </span>
                      <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        € {formatAmountNoCents(
                          selectedCategoryKey
                            ? expensesByCategory.find((c) => c.category === selectedCategoryKey)?.amount || 0
                            : totalExpensesAmount
                        )}
                      </span>
                      {selectedCategoryKey && (
                        <span className="text-[9.5px] font-bold text-emerald-600">
                          {expensesByCategory.find((c) => c.category === selectedCategoryKey)?.percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category Breakdown List */}
                  <div className="flex-1 min-w-0 space-y-1.5 w-full">
                    {expensesByCategory.map((cat) => {
                      const isSelected = selectedCategoryKey === cat.category;
                      return (
                        <div
                          key={cat.category}
                          onClick={() => setSelectedCategoryKey((prev) => (prev === cat.category ? null : cat.category))}
                          className={`p-1.5 rounded-[6px] border text-xs cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-slate-100 dark:bg-slate-800 border-emerald-500 font-bold'
                              : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="truncate text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
                              {cat.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                              {cat.percentage.toFixed(1)}%
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              € {cat.amount.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CHART 2: Temporal Expense Trend Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Andamento Temporale Spese</span>
              </h3>
              {expensesByMonth.peakMonth && (
                <span className="text-[10px] font-semibold text-slate-500">
                  Picco: <strong className="text-rose-600 dark:text-rose-400">{expensesByMonth.peakMonth.label} (€ {expensesByMonth.peakMonth.amount.toFixed(0)})</strong>
                </span>
              )}
            </div>

            <div className="p-2 space-y-3">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-1.5 text-center p-2 bg-slate-50 dark:bg-slate-800/60 rounded-[6px] border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Media Mensile</span>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    € {formatAmountNoCents(expensesByMonth.avgMonthly)}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Totale Periodo</span>
                  <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                    € {formatAmountNoCents(expensesByMonth.totalPeriodAmount)}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Mesi Monitorati</span>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {expensesByMonth.months.length} mesi
                  </span>
                </div>
              </div>

              {/* Monthly Histogram Bars */}
              <div className="pt-2">
                <div className="h-40 flex items-end justify-between gap-1.5 px-1 relative">
                  {/* Average Expense Dotted Line */}
                  {expensesByMonth.maxMonthAmount > 0 && (
                    <div
                      className="absolute left-0 right-0 border-b border-dashed border-emerald-500/50 z-10 pointer-events-none flex items-center justify-end pr-1"
                      style={{
                        bottom: `${Math.min(95, Math.max(5, (expensesByMonth.avgMonthly / expensesByMonth.maxMonthAmount) * 100))}%`,
                      }}
                    >
                      <span className="text-[8.5px] font-mono font-bold bg-emerald-600 text-white px-1 py-0.5 rounded shadow-2xs opacity-90">
                        Media: € {expensesByMonth.avgMonthly.toFixed(0)}
                      </span>
                    </div>
                  )}

                  {expensesByMonth.months.map((m) => {
                    const heightPercent = expensesByMonth.maxMonthAmount > 0
                      ? Math.max(8, (m.amount / expensesByMonth.maxMonthAmount) * 100)
                      : 8;
                    const isHovered = hoveredMonthKey === m.key;

                    return (
                      <div
                        key={m.key}
                        onMouseEnter={() => setHoveredMonthKey(m.key)}
                        onMouseLeave={() => setHoveredMonthKey(null)}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                      >
                        {/* Tooltip on hover */}
                        {isHovered && (
                          <div className="absolute -top-10 z-30 bg-slate-900 text-white text-[10px] p-1.5 rounded shadow-lg whitespace-nowrap animate-in fade-in duration-100">
                            <div className="font-bold">{m.fullLabel}</div>
                            <div className="font-mono text-emerald-400 font-bold">€ {m.amount.toFixed(2)} ({m.count} spese)</div>
                          </div>
                        )}

                        <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-t-[4px] overflow-hidden flex items-end h-full relative">
                          <div
                            className={`w-full rounded-t-[4px] transition-all duration-300 ${
                              isHovered
                                ? 'bg-emerald-500 shadow-md'
                                : m.amount === expensesByMonth.peakMonth?.amount
                                ? 'bg-emerald-700'
                                : 'bg-emerald-800/80 dark:bg-emerald-600/80'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>

                        <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate max-w-full text-center">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NATURANDO - RIEPILOGO COMMESSE E QUOTE SPETTANTI */}
      {activeSubTab === 'naturando' && (
        <div className="space-y-[7px]">
          {/* Header Card con Logo Naturando e Regolatore Percentuale */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-[6px] border border-slate-200 dark:border-slate-700 shrink-0">
                  <img
                    src={NATURANDO_LOGO_URL}
                    alt="Logo Naturando"
                    className="h-7 max-w-[110px] object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Riepilogo Commesse Naturando
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Calcolo quota spettante a Naturando e ricavo netto d'impresa
                  </p>
                </div>
              </div>

              {/* Regolatore Percentuale Globale / Rapida */}
              <div className="flex items-center gap-1.5 p-1.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-[6px] border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Quota Base:
                </span>
                <div className="flex items-center gap-1">
                  {[10, 15, 20, 25, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setNaturandoDefaultPercentage(pct)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                        naturandoDefaultPercentage === pct
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <div className="flex items-center ml-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={naturandoDefaultPercentage}
                      onChange={(e) => setNaturandoDefaultPercentage(parseFloat(e.target.value) || 0)}
                      className="w-12 p-0.5 text-center font-mono font-bold text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-emerald-700 dark:text-emerald-400 focus:outline-emerald-600"
                    />
                    <span className="text-[10px] font-bold text-slate-500 ml-0.5">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Summary Grid per Naturando */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-[6px] border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block truncate">
                  Lavori Naturando
                </span>
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-slate-100">
                  {naturandoJobs.length}
                </span>
                <span className="text-[9.5px] text-slate-400 block truncate">
                  interventi collegati
                </span>
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-[6px] border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block truncate">
                  Totale Comunicato
                </span>
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-slate-100">
                  € {formatAmountNoCents(naturandoTotals.totalCommunicated)}
                </span>
                <span className="text-[9.5px] text-slate-400 block truncate">
                  importo concordato
                </span>
              </div>

              <div className="p-2 bg-rose-50/70 dark:bg-rose-950/30 rounded-[6px] border border-rose-200 dark:border-rose-900/60">
                <span className="text-[9px] uppercase font-bold text-rose-700 dark:text-rose-400 block truncate">
                  Spettante a Naturando
                </span>
                <span className="text-base font-extrabold font-mono text-rose-700 dark:text-rose-400">
                  € {formatAmountNoCents(naturandoTotals.totalDue)}
                </span>
                <span className="text-[9.5px] text-rose-600/80 dark:text-rose-400/80 block truncate">
                  quota provvigione
                </span>
              </div>

              <div className="p-2 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-[6px] border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[9px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block truncate">
                  Tuo Ricavo Netto
                </span>
                <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                  € {formatAmountNoCents(naturandoTotals.totalNet)}
                </span>
                <span className="text-[9.5px] text-emerald-600/80 dark:text-emerald-400/80 block truncate">
                  al netto della quota
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-2 bg-amber-50/70 dark:bg-amber-950/30 rounded-[6px] border border-amber-200 dark:border-amber-900/60 flex sm:flex-col justify-between sm:justify-start">
                <div>
                  <span className="text-[9px] uppercase font-bold text-amber-700 dark:text-amber-400 block truncate">
                    Ancora da Saldare
                  </span>
                  <span className="text-base font-extrabold font-mono text-amber-700 dark:text-amber-400">
                    € {formatAmountNoCents(naturandoTotals.totalPending)}
                  </span>
                </div>
                <div className="text-right sm:text-left sm:pt-0.5">
                  <span className="text-[9.5px] font-mono text-emerald-700 dark:text-emerald-400 font-bold block truncate">
                    Già saldati: € {formatAmountNoCents(naturandoTotals.totalPaid)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filtro Stato Naturando */}
          <div className="flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setNaturandoFilter('all')}
              className={`py-1.5 px-3 rounded-[5px] border text-center transition-colors cursor-pointer ${
                naturandoFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Tutti ({naturandoJobs.length})
            </button>
            <button
              type="button"
              onClick={() => setNaturandoFilter('pending')}
              className={`py-1.5 px-3 rounded-[5px] border text-center transition-colors cursor-pointer ${
                naturandoFilter === 'pending'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
              }`}
            >
              Da Saldare ({naturandoJobs.filter((j) => !j.naturandoPaid).length})
            </button>
            <button
              type="button"
              onClick={() => setNaturandoFilter('paid')}
              className={`py-1.5 px-3 rounded-[5px] border text-center transition-colors cursor-pointer ${
                naturandoFilter === 'paid'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
              }`}
            >
              Saldati ({naturandoJobs.filter((j) => !!j.naturandoPaid).length})
            </button>
          </div>

          {/* Lista Commesse Naturando */}
          <div className="space-y-[3px] max-h-[550px] overflow-y-auto">
            {filteredNaturandoJobs.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[7px] border border-slate-200 dark:border-slate-800 space-y-2">
                <img
                  src={NATURANDO_LOGO_URL}
                  alt="Naturando"
                  className="h-8 max-w-[120px] object-contain mx-auto opacity-70"
                />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {naturandoJobs.length === 0
                    ? 'Nessun intervento contrassegnato per Naturando.'
                    : 'Nessun intervento corrisponde al filtro selezionato.'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Quando crei o modifichi un intervento, attiva il pulsante con il logo di Naturando sotto alla modalità di calcolo tariffa per associarlo a questa sezione.
                </p>
              </div>
            ) : (
              filteredNaturandoJobs.map((job) => {
                const client = clients.find((c) => c.id === job.clientId);
                const clientColor = client ? getClientColor(client) : undefined;
                const isEditing = editingNaturandoJobId === job.id;

                const jobAmount =
                  job.naturandoAmount !== undefined && job.naturandoAmount > 0
                    ? job.naturandoAmount
                    : (job.price || 0);

                const jobPct =
                  job.naturandoPercentage !== undefined && job.naturandoPercentage > 0
                    ? job.naturandoPercentage
                    : naturandoDefaultPercentage;

                const naturandoDue = (jobAmount * jobPct) / 100;
                const netRevenue = jobAmount - naturandoDue;
                const isPaid = !!job.naturandoPaid;

                return (
                  <div
                    key={job.id}
                    className={`p-2.5 bg-white dark:bg-slate-900 border rounded-[7px] space-y-2 transition-all ${
                      isPaid
                        ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                    style={clientColor ? { borderLeftWidth: '4.5px', borderLeftColor: clientColor } : undefined}
                  >
                    {/* Header Riga Lavoro */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {client?.name || 'Cliente non specificato'}
                          </span>
                          {client?.address && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                              · {client.address}
                            </span>
                          )}
                          <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                            {job.date}
                          </span>
                        </div>
                        {job.title && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            {job.title}
                          </p>
                        )}
                      </div>

                      {/* Badge Stato Saldo Naturando */}
                      <div className="shrink-0">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Saldato {job.naturandoPaidDate ? `(${job.naturandoPaidDate})` : ''}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Da Saldare</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Breakdown Finanziario o Form Modifica Rapida */}
                    {isEditing ? (
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                              Importo Comunicato (€)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={editNaturandoAmount}
                              onChange={(e) => setEditNaturandoAmount(parseFloat(e.target.value) || 0)}
                              className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                              % Spettante a Naturando
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={editNaturandoPct}
                                onChange={(e) => setEditNaturandoPct(parseFloat(e.target.value) || 0)}
                                className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-xs text-center text-slate-900 dark:text-slate-100"
                              />
                              <span className="text-xs font-bold text-slate-400">%</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingNaturandoJobId(null)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Annulla
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNaturandoValues(job)}
                            className="px-3 py-1 rounded text-xs font-bold bg-emerald-700 text-white cursor-pointer shadow-xs"
                          >
                            Salva
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-[6px] border border-slate-200 dark:border-slate-800 text-xs font-mono">
                        <div>
                          <span className="text-[9px] uppercase font-sans font-bold text-slate-400 block">
                            Comunicato
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            € {formatAmountNoCents(jobAmount)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-sans font-bold text-slate-400 block">
                            Quota Naturando ({jobPct}%)
                          </span>
                          <span className="font-extrabold text-rose-600 dark:text-rose-400">
                            € {naturandoDue.toFixed(2)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-sans font-bold text-slate-400 block">
                            Tuo Netto ({100 - jobPct}%)
                          </span>
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                            € {netRevenue.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-1 font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNaturandoJobId(job.id);
                              setEditNaturandoAmount(jobAmount);
                              setEditNaturandoPct(jobPct);
                            }}
                            className="p-1 px-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded cursor-pointer transition-colors"
                            title="Regola importo e percentuale per questo lavoro"
                          >
                            <Edit2 className="w-3 h-3 inline mr-0.5" />
                            Regola %
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleNaturandoPaid(job)}
                            className={`p-1 px-2.5 rounded text-[10px] font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1 ${
                              isPaid
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 border border-slate-300 dark:border-slate-700'
                                : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-800'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{isPaid ? 'Annulla Saldo' : 'Salda Quota'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
      />

      {/* Modal: Record Worker Payout */}
      {selectedWorkerForPayout && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-[7px] space-y-[7px] shadow-2xl">
            <div className="bg-slate-900 text-white p-[7px] px-3 rounded-[7px] flex items-center justify-between">
              <h3 className="font-bold text-xs">
                Registra Pagamento Stipendio - {selectedWorkerForPayout.worker.displayName}
              </h3>
              <button onClick={() => setSelectedWorkerForPayout(null)} className="text-slate-400 hover:text-white">
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
                  <option value="contanti">Contanti</option>
                  <option value="pos_carta">Carta / POS</option>
                  <option value="assegno">Assegno Circolare</option>
                </select>
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Note Pagamento / Riferimento Busta</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="es. Saldo compenso giornate Ottobre"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-[7px]">
                <button
                  type="button"
                  onClick={() => setSelectedWorkerForPayout(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-[7px]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px]"
                >
                  Conferma Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aggiungi Acconto per Lavoro in Essere */}
      {selectedJobForAcconto && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-[7px] overflow-y-auto backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-[7px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-2">
            <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Registra Acconto per Cantiere</h3>
                <p className="text-[11px] text-slate-300">{selectedJobForAcconto.clientName} · {selectedJobForAcconto.title}</p>
              </div>
              <button
                onClick={() => setSelectedJobForAcconto(null)}
                className="p-1 rounded-[7px] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 space-y-3 text-xs">
              {/* Situazione Economica Cantiere */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-[7px] border border-slate-200 dark:border-slate-700 text-center">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold">Prezzo Totale</span>
                  <span className="font-mono font-bold text-sm">€ {(selectedJobForAcconto.price || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold">Già Incassato</span>
                  <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                    € {(selectedJobForAcconto.paidAmount || (selectedJobForAcconto.paymentStatus === 'paid' ? selectedJobForAcconto.price || 0 : 0)).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold">Rimanente</span>
                  <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-400">
                    € {Math.max(0, (selectedJobForAcconto.price || 0) - (selectedJobForAcconto.paidAmount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Elenco Acconti Precedenti */}
              {selectedJobForAcconto.installments && selectedJobForAcconto.installments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block">
                    Acconti precedentemente registrati:
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {selectedJobForAcconto.installments.map((inst, idx) => (
                      <div
                        key={inst.id}
                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold flex items-center gap-2">
                            <span>Acconto #{idx + 1}: € {inst.amount.toFixed(2)}</span>
                            <span className="font-mono text-[10px] text-slate-500">{inst.date}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {getMethodLabel(inst.paymentMethod)} {inst.notes && `· "${inst.notes}"`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditInstallment(selectedJobForAcconto, inst)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Modifica questo acconto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInstallmentToDelete({ job: selectedJobForAcconto, installment: inst })}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Elimina questo acconto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Nuovo Acconto */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (accontoAmount <= 0) return;

                  const currentInst = selectedJobForAcconto.installments || [];
                  const newInst: PaymentInstallment = {
                    id: `inst_${Date.now()}`,
                    amount: Number(accontoAmount),
                    date: accontoDate,
                    paymentMethod: accontoMethod,
                    notes: accontoNotes.trim() || undefined,
                    createdAt: new Date().toISOString(),
                  };

                  const updatedInst = [...currentInst, newInst];
                  const newPaid = updatedInst.reduce((s, it) => s + it.amount, 0);
                  const price = selectedJobForAcconto.price || 0;
                  const newStatus: any = newPaid >= price && price > 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

                  await updateJob({
                    ...selectedJobForAcconto,
                    installments: updatedInst,
                    paidAmount: newPaid,
                    paymentStatus: newStatus,
                  });

                  setSelectedJobForAcconto(null);
                  setAccontoAmount(0);
                  setAccontoNotes('');
                }}
                className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Aggiungi Nuovo Versamento / Acconto
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Importo Acconto (€) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={accontoAmount}
                      onChange={(e) => setAccontoAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono font-bold text-emerald-700 dark:text-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Data Incasso *
                    </label>
                    <input
                      type="date"
                      required
                      value={accontoDate}
                      onChange={(e) => setAccontoDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Modalità Pagamento a tastini senza emoticon e senza spunta */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Modalità Pagamento Acconto
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'bonifico', label: 'Bonifico' },
                      { id: 'contanti', label: 'Contanti' },
                      { id: 'pos_carta', label: 'POS / Carta' },
                      { id: 'assegno', label: 'Assegno' },
                      { id: 'riba_30_60', label: 'RiBa' },
                    ].map((m) => {
                      const isSel = accontoMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setAccontoMethod(m.id as PaymentMethod)}
                          className={`py-1.5 px-2 rounded-[7px] text-[11px] font-bold border transition-colors cursor-pointer text-center ${
                            isSel
                              ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-1 ring-emerald-400'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-600'
                          }`}
                        >
                          <span className="whitespace-normal leading-tight">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Note Versamento (facoltative)
                  </label>
                  <input
                    type="text"
                    value={accontoNotes}
                    onChange={(e) => setAccontoNotes(e.target.value)}
                    placeholder="es. Acconto ricevuto con bonifico..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobForAcconto(null)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-[7px] text-slate-700 dark:text-slate-300 font-medium"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px] shadow-xs"
                  >
                    Salva Acconto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Modifica Condizioni Pagamento Lavoro */}
      {selectedJobForEditPayment && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-[7px] overflow-y-auto backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-[7px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-2">
            <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  <span>Modifica Pagamento Cantiere</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  {selectedJobForEditPayment.clientName} · {selectedJobForEditPayment.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForEditPayment(null)}
                className="p-1 rounded-[7px] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPayment} className="p-3 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Prezzo Totale Concordato (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={editPaymentPrice}
                  onChange={(e) => setEditPaymentPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono font-bold text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Stato Pagamento
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'unpaid', label: 'Da Incassare' },
                    { id: 'partial', label: 'Acconto' },
                    { id: 'paid', label: 'Saldato' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setEditPaymentStatus(s.id as any)}
                      className={`py-1.5 px-2 rounded-[7px] text-xs font-bold border transition-colors cursor-pointer text-center ${
                        editPaymentStatus === s.id
                          ? s.id === 'paid'
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : s.id === 'partial'
                            ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                            : 'bg-rose-700 text-white border-rose-800 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Modalità Pagamento (3 colonne per rigo)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'bonifico', label: 'Bonifico' },
                    { id: 'contanti', label: 'Contanti' },
                    { id: 'pos_carta', label: 'POS / Carta' },
                    { id: 'assegno', label: 'Assegno' },
                    { id: 'riba_30_60', label: 'RiBa 30/60' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEditPaymentMethod(m.id as PaymentMethod)}
                      className={`py-1.5 px-2 rounded-[7px] text-[11px] font-bold border transition-colors cursor-pointer text-center ${
                        editPaymentMethod === m.id
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-1 ring-emerald-400'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Note di Pagamento
                </label>
                <input
                  type="text"
                  value={editPaymentNotes}
                  onChange={(e) => setEditPaymentNotes(e.target.value)}
                  placeholder="es. Pagamento concordato a 30gg fine mese..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const job = selectedJobForEditPayment;
                    setSelectedJobForEditPayment(null);
                    setJobToDelete(job);
                  }}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-[7px] text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Elimina Intervento</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobForEditPayment(null)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-[7px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px] shadow-xs cursor-pointer"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation: Delete Entire Job / Intervention */}
      {jobToDelete && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-[7px] backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-4 shadow-2xl space-y-3 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <Trash2 className="w-5 h-5" />
              <span>Elimina Intervento / Cantiere</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Sei sicuro di voler eliminare definitivamente l'intervento <strong>"{jobToDelete.title}"</strong> di <strong>"{jobToDelete.clientName}"</strong> ({jobToDelete.date})?
            </p>
            <p className="text-[11px] text-slate-400 italic">
              Questa azione rimuoverà la voce dal registro incassi, dal calendario e da tutti i bilanci dell'applicazione.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-[7px] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteJob(jobToDelete.id);
                  setJobToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[7px] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Elimina Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Modifica Singolo Acconto */}
      {editingInstallment && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-[7px] overflow-y-auto backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-[7px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-2">
            <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  <span>Modifica Singolo Acconto</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  {editingInstallment.job.clientName} · {editingInstallment.job.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingInstallment(null)}
                className="p-1 rounded-[7px] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditInstallment} className="p-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Importo Acconto (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editInstAmount}
                    onChange={(e) => setEditInstAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Data Versamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={editInstDate}
                    onChange={(e) => setEditInstDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Modalità Pagamento (3 colonne per rigo)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'bonifico', label: 'Bonifico' },
                    { id: 'contanti', label: 'Contanti' },
                    { id: 'pos_carta', label: 'POS / Carta' },
                    { id: 'assegno', label: 'Assegno' },
                    { id: 'riba_30_60', label: 'RiBa 30/60' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEditInstMethod(m.id as PaymentMethod)}
                      className={`py-1.5 px-2 rounded-[7px] text-[11px] font-bold border transition-colors cursor-pointer text-center ${
                        editInstMethod === m.id
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-1 ring-emerald-400'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Note Acconto (facoltative)
                </label>
                <input
                  type="text"
                  value={editInstNotes}
                  onChange={(e) => setEditInstNotes(e.target.value)}
                  placeholder="es. Acconto 30% all'inizio lavori..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingInstallment(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-[7px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px] shadow-xs cursor-pointer"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Conferma Eliminazione Acconto */}
      {installmentToDelete && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <Trash2 className="w-5 h-5 shrink-0" />
              <span>Elimina Acconto</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Sei sicuro di voler eliminare l'acconto di <strong className="text-slate-900 dark:text-slate-100">€ {installmentToDelete.installment.amount.toFixed(2)}</strong> del {installmentToDelete.installment.date}? L'importo totale incassato verrà ricalcolato automaticamente.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInstallmentToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-[7px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteInstallment}
                className="px-3 py-1.5 text-xs font-bold rounded-[7px] bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Elimina Acconto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Conferma Reset Incassi Lavoro */}
      {jobToResetPayments && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <Trash2 className="w-5 h-5 shrink-0" />
              <span>Azzera Incassi Cantiere</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Sei sicuro di voler azzerare tutti i versamenti e acconti registrati per <strong className="text-slate-900 dark:text-slate-100">{jobToResetPayments.clientName}</strong> ({jobToResetPayments.title})? Lo stato tornerà a "Da Incassare".
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setJobToResetPayments(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-[7px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPayments}
                className="px-3 py-1.5 text-xs font-bold rounded-[7px] bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Azzera Incassi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Conferma Eliminazione Spesa */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <Trash2 className="w-5 h-5 shrink-0" />
              <span>Elimina Spesa Operativa</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Sei sicuro di voler eliminare la spesa <strong className="text-slate-900 dark:text-slate-100">{expenseToDelete.title}</strong> di <strong className="text-rose-600 font-mono">€ {expenseToDelete.amount.toFixed(2)}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-[7px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteExpense(expenseToDelete.id);
                  setExpenseToDelete(null);
                  setLongPressedExpenseId(null);
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

      {/* Modal: Modifica Spesa Operativa */}
      {expenseToEdit && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <span>Modifica Spesa Operativa</span>
              </h3>
              <button
                type="button"
                onClick={() => setExpenseToEdit(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!expTitle.trim() || expAmount <= 0) return;
                await deleteExpense(expenseToEdit.id);
                await addExpense({
                  title: expTitle.trim(),
                  amount: Number(expAmount),
                  category: expCategory,
                  paymentMethod: expMethod,
                  recipientOrVendor: expVendor.trim() || undefined,
                  date: expDate,
                  status: 'paid',
                });
                setExpenseToEdit(null);
                setLongPressedExpenseId(null);
              }}
              className="space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="font-semibold block text-slate-700 dark:text-slate-300">Descrizione Spesa *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-700 dark:text-slate-300">Importo (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono font-bold text-rose-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-700 dark:text-slate-300">Data Spesa</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-700 dark:text-slate-300">Categoria</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                  >
                    <option value="carburante">Carburante</option>
                    <option value="materiale">Materiali Cantiere</option>
                    <option value="attrezzatura">Attrezzatura & Noleggio</option>
                    <option value="manutenzione">Manutenzione</option>
                    <option value="stipendio">Manodopera / Stipendi</option>
                    <option value="generale">Spese Generali / Altro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-700 dark:text-slate-300">Metodo Pagamento</label>
                  <select
                    value={expMethod}
                    onChange={(e) => setExpMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                  >
                    <option value="pos_carta">POS / Carta</option>
                    <option value="contanti">Contanti</option>
                    <option value="bonifico">Bonifico Bancario</option>
                    <option value="assegno">Assegno</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-slate-700 dark:text-slate-300">Fornitore / Note (opzionale)</label>
                <input
                  type="text"
                  value={expVendor}
                  onChange={(e) => setExpVendor(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setExpenseToEdit(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-[7px] font-medium cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px] shadow-xs cursor-pointer"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
