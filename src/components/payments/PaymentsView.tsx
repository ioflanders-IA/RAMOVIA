import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
} from 'lucide-react';

import { ClientDirectoryView } from './ClientDirectoryView';

export const PaymentsView: React.FC = () => {
  const {
    jobs,
    users,
    reports,
    expenses,
    payouts,
    clients,
    addExpense,
    deleteExpense,
    recordWorkerPayout,
    updateWorkerPayout,
    updateJob,
    updateUserRole,
    addClient,
    updateClient,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'stipendi' | 'incassi' | 'clienti' | 'spese' | 'grafici'>('incassi');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

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

  // Confirmation modal to reset/delete payments for a job
  const [jobToResetPayments, setJobToResetPayments] = useState<Job | null>(null);

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

  // 2. Calculate Worker Earnings based on Work Reports (Default €15/h if not set)
  const workers = users.filter((u) => u.role === 'worker');
  const workerStats = workers.map((worker) => {
    const workerReports = reports.filter((r) => r.workerId === worker.uid && r.status === 'approved');
    const totalHours = workerReports.reduce((sum, r) => sum + r.totalHours, 0);
    const hourlyRate = worker.hourlyRate || 15.0;
    const estimatedEarnings = totalHours * hourlyRate;

    const workerPayouts = payouts.filter((p) => p.workerId === worker.uid);
    const totalPaidOut = workerPayouts.reduce((sum, p) => (p.status === 'paid' ? sum + p.totalAmount : sum), 0);
    const pendingPayout = Math.max(0, estimatedEarnings - totalPaidOut);

    return {
      worker,
      totalHours,
      daysWorked: new Set(workerReports.map((r) => r.date)).size,
      hourlyRate,
      estimatedEarnings,
      totalPaidOut,
      pendingPayout,
    };
  });

  const totalWorkerEarningsAll = workerStats.reduce((sum, w) => sum + w.estimatedEarnings, 0);
  const totalWorkerPaidAll = workerStats.reduce((sum, w) => sum + w.totalPaidOut, 0);

  // 3. Calculate Expenses
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // 4. Operating Profit Margin
  const netMargin = totalJobCollected - totalWorkerPaidAll - totalExpensesAmount;

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
        return 'Bonifico Bancario';
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

  return (
    <div className="space-y-[7px]">

      {/* Financial KPI Summary Grid - 4 card su UN'UNICA LINEA */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {/* Total Collections */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-1.5 sm:p-2.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Incassi Cantieri</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0 hidden sm:block" />
          </div>
          <div className="text-xs sm:text-base md:text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 truncate">
            € {totalJobCollected.toFixed(2)}
          </div>
          <div className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5 truncate">
            <span className="truncate">Da incassare:</span>
            <strong className="text-amber-600 dark:text-amber-400 font-mono ml-0.5 shrink-0">€ {totalJobPending.toFixed(2)}</strong>
          </div>
        </div>

        {/* Total Salaries */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-1.5 sm:p-2.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Stipendi Operai</span>
            <Users className="w-3.5 h-3.5 text-sky-600 shrink-0 hidden sm:block" />
          </div>
          <div className="text-xs sm:text-base md:text-xl font-bold font-mono text-sky-700 dark:text-sky-400 truncate">
            € {totalWorkerPaidAll.toFixed(2)}
          </div>
          <div className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5 truncate">
            <span className="truncate">Maturato:</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono ml-0.5 shrink-0">€ {totalWorkerEarningsAll.toFixed(2)}</strong>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-1.5 sm:p-2.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Spese Operative</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0 hidden sm:block" />
          </div>
          <div className="text-xs sm:text-base md:text-xl font-bold font-mono text-rose-700 dark:text-rose-400 truncate">
            € {totalExpensesAmount.toFixed(2)}
          </div>
          <div className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate pt-0.5">
            Carburante e ricambi
          </div>
        </div>

        {/* Net Operating Margin */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-1.5 sm:p-2.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Margine Netto</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0 hidden sm:block" />
          </div>
          <div className={`text-xs sm:text-base md:text-xl font-bold font-mono truncate ${netMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            € {netMargin.toFixed(2)}
          </div>
          <div className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate pt-0.5">
            Incassi - Uscite
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation - 2 Righi con 3 tasti adattati allo schermo, testi essenziali, tasto registra spesa solo con simbolo + a destra */}
      <div className="bg-slate-200/80 dark:bg-slate-800/80 p-1.5 rounded-[7px]">
        <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
          {/* Riga 1 */}
          <button
            onClick={() => setActiveSubTab('stipendi')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-[7px] transition-colors cursor-pointer text-center ${
              activeSubTab === 'stipendi'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-300/40 dark:hover:bg-slate-700/40'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Stipendi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('incassi')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-[7px] transition-colors cursor-pointer text-center ${
              activeSubTab === 'incassi'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-300/40 dark:hover:bg-slate-700/40'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Incassi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('spese')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-[7px] transition-colors cursor-pointer text-center ${
              activeSubTab === 'spese'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-300/40 dark:hover:bg-slate-700/40'
            }`}
          >
            <Fuel className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Spese</span>
          </button>

          {/* Riga 2 */}
          <button
            onClick={() => setActiveSubTab('clienti')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-[7px] transition-colors cursor-pointer text-center ${
              activeSubTab === 'clienti'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-300/40 dark:hover:bg-slate-700/40'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
            <span className="truncate">Clienti</span>
          </button>

          <button
            onClick={() => setActiveSubTab('grafici')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-[7px] transition-colors cursor-pointer text-center ${
              activeSubTab === 'grafici'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-300/40 dark:hover:bg-slate-700/40'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Bilancio</span>
          </button>

          {/* Tasto Registra Spesa: + Spesa */}
          <button
            type="button"
            onClick={() => setShowExpenseModal(true)}
            title="Registra Nuova Spesa"
            aria-label="Registra Nuova Spesa"
            className="flex items-center justify-center gap-1 py-2 px-2 rounded-[7px] bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-colors cursor-pointer shadow-xs text-center"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Spesa</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WORKER SALARIES & DAILY WAGES */}
      {activeSubTab === 'stipendi' && (
        <div className="space-y-[7px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[7px]">
            {workerStats.length === 0 ? (
              <div className="col-span-full p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] text-center text-xs text-slate-500">
                Nessun operaio ancora registrato nella squadra.
              </div>
            ) : (
              workerStats.map((st) => (
                <div
                  key={st.worker.uid}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px] flex flex-col justify-between"
                >
                  <div className="space-y-[7px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[7px]">
                        {st.worker.photoURL ? (
                          <img
                            src={st.worker.photoURL}
                            alt={st.worker.displayName}
                            className="w-8 h-8 rounded-[7px] object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-[7px] bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                            {st.worker.displayName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {st.worker.displayName}
                          </h3>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Cod: {st.worker.workerCode || 'OP----'}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 p-1 px-2 rounded-[7px]">
                        € {st.hourlyRate.toFixed(2)}/h
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-[7px] bg-slate-50 dark:bg-slate-800/60 p-[7px] rounded-[7px] text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Ore Rendicontate:</span>
                        <strong className="font-mono text-slate-900 dark:text-slate-100">{st.totalHours.toFixed(1)} h</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Giornate Lavoro:</span>
                        <strong className="font-mono text-slate-900 dark:text-slate-100">{st.daysWorked} gg</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Maturato Totale:</span>
                        <strong className="font-mono text-emerald-700 dark:text-emerald-400">€ {st.estimatedEarnings.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Da Saldate:</span>
                        <strong className="font-mono text-amber-600 dark:text-amber-400">€ {st.pendingPayout.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedWorkerForPayout(st);
                      setPayoutAmount(st.pendingPayout > 0 ? st.pendingPayout : st.estimatedEarnings);
                    }}
                    className="w-full p-[7px] bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Registra Pagamento Stipendio</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Historical Payouts List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Storico Pagamenti Stipendi ({payouts.length})
            </h3>

            {payouts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Nessun pagamento di stipendio ancora registrato.
              </div>
            ) : (
              <div className="space-y-[7px] max-h-80 overflow-y-auto">
                {payouts.map((p) => (
                  <div
                    key={p.id}
                    className="p-[7px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{p.workerName}</span>
                        <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {p.period}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.totalHours} ore · {p.paymentDate || p.createdAt.split('T')[0]} · {getMethodLabel(p.paymentMethod)}
                      </div>
                      {p.notes && <div className="text-[10px] text-slate-400 italic">{p.notes}</div>}
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                        € {p.totalAmount.toFixed(2)}
                      </div>
                      <span className="text-[9px] font-bold uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        PAGATO
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: JOB COLLECTIONS & REVENUE */}
      {activeSubTab === 'incassi' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800 gap-1.5">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Registro Incassi Lavori ({jobs.length} interventi)
            </h3>
          </div>

          {/* Filtri Stato Incasso sullo STESSO RIGO */}
          <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`py-1.5 px-2 rounded-[6px] border text-center transition-colors cursor-pointer truncate ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Tutti ({jobs.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unpaid')}
              className={`py-1.5 px-1.5 rounded-[6px] border text-center transition-colors cursor-pointer truncate ${
                statusFilter === 'unpaid'
                  ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
              }`}
            >
              Da Incassare
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('partial')}
              className={`py-1.5 px-1.5 rounded-[6px] border text-center transition-colors cursor-pointer truncate ${
                statusFilter === 'partial'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
              }`}
            >
              Parziale
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`py-1.5 px-1.5 rounded-[6px] border text-center transition-colors cursor-pointer truncate ${
                statusFilter === 'paid'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
              }`}
            >
              Saldato
            </button>
          </div>

          <div className="space-y-[7px] max-h-[500px] overflow-y-auto">
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

                return (
                  <div
                    key={job.id}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] space-y-2.5 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
                  >
                    {/* Header: Cliente, Titolo, Data, Stato */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {job.clientName}
                          </span>
                          <span className="font-mono text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                            {job.date}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            · {job.title}
                          </span>
                          {job.interventionType === 'generale' && (
                            <span className="font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 shrink-0">
                              Periodico {job.pricingMode === 'hourly' && job.hourlyRate ? `· €${job.hourlyRate}/h` : ''} {job.frequency ? `· ${job.frequency}` : ''} · Saldo fine mese
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span>
                            Modalità: <strong className="text-slate-700 dark:text-slate-300">{getMethodLabel(method)}</strong>
                          </span>
                          {job.clientAddress && (
                            <span className="hidden sm:inline text-slate-400">· {job.clientAddress}</span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-[6px] tracking-wider border ${
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
                          <span>{status === 'paid' ? 'Saldato' : status === 'partial' ? 'Parziale' : 'Da Incassare'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Financial KPI Strip: Prezzo | Incassato | Rimanente */}
                    <div className="grid grid-cols-3 gap-2 text-center sm:text-left">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Prezzo Totale
                        </div>
                        <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                          € {price.toFixed(2)}
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-[6px] border border-emerald-100 dark:border-emerald-900/30 shadow-2xs">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <span>Incassato</span>
                          {installments.length > 0 && (
                            <span className="text-[9px] font-semibold opacity-80">({installments.length} vers.)</span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                          € {paid.toFixed(2)}
                        </div>
                      </div>

                      <div
                        className={`p-2 rounded-[6px] border shadow-2xs ${
                          remaining === 0
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
                        }`}
                      >
                        <div
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            remaining === 0 ? 'text-slate-400' : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          Rimanente da Saldare
                        </div>
                        <div
                          className={`text-xs sm:text-sm font-mono font-bold mt-0.5 ${
                            remaining === 0
                              ? 'text-slate-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          € {remaining.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Acconti e Versamenti Registrati con Azioni di Modifica ed Eliminazione */}
                    {installments.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <span>Dettaglio Acconti Registrati ({installments.length})</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            Totale Acconti: € {installmentsSum.toFixed(2)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {installments.map((inst, idx) => (
                            <div
                              key={inst.id}
                              className="flex items-center justify-between p-1.5 px-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-[6px] border border-slate-200/80 dark:border-slate-700/80 text-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                                <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
                                  Acconto #{idx + 1}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                                  {inst.date}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                  {getMethodLabel(inst.paymentMethod)}
                                </span>
                                {inst.notes && (
                                  <span className="text-[11px] text-slate-500 italic truncate max-w-[140px] sm:max-w-xs" title={inst.notes}>
                                    "{inst.notes}"
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 mr-1">
                                  € {inst.amount.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditInstallment(job, inst)}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                  title="Modifica questo acconto"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInstallmentToDelete({ job, installment: inst })}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
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

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJobForAcconto(job);
                            setAccontoAmount(remaining > 0 ? remaining : 50);
                            setAccontoDate(new Date().toISOString().split('T')[0]);
                            setAccontoMethod(job.paymentMethod || 'bonifico');
                            setAccontoNotes('');
                          }}
                          className="p-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-[7px] font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Acconto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleJobPaid(job)}
                          className={`p-1.5 px-2.5 rounded-[7px] font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1 transition-colors ${
                            status === 'paid'
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:hover:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {status === 'paid' ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Riapri (Non Saldato)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Segna Saldato</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPayment(job)}
                          className="p-1.5 px-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-semibold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          title="Modifica prezzo, modalità di pagamento o stato"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Modifica</span>
                        </button>

                        {(paid > 0 || installments.length > 0) && (
                          <button
                            type="button"
                            onClick={() => setJobToResetPayments(job)}
                            className="p-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/50 rounded-[7px] font-semibold text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Azzera gli incassi e gli acconti registrati per questo cantiere"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            <span>Azzera</span>
                          </button>
                        )}
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

      {/* TAB 3: OPERATIONAL EXPENSES */}
      {activeSubTab === 'spese' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Registro Spese Operative ({expenses.length})
            </h3>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="p-[7px] px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Spesa</span>
            </button>
          </div>

          <div className="space-y-[7px] max-h-[500px] overflow-y-auto">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nessuna spesa registrata. Clicca su "Aggiungi Spesa" per registrarne una.
              </div>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-[7px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] flex items-center justify-between gap-[7px] text-xs"
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {exp.title}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {exp.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {exp.recipientOrVendor || 'Fornitore non specificato'} · {exp.date} · {getMethodLabel(exp.paymentMethod)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="font-mono font-bold text-sm text-rose-700 dark:text-rose-400">
                      - € {exp.amount.toFixed(2)}
                    </div>
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Elimina Spesa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CHARTS & PAYMENT METHOD ANALYTICS */}
      {activeSubTab === 'grafici' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[7px]">
          {/* Chart 1: Revenue vs Expenses */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Confronto Finanziario: Incassi vs Uscite</span>
            </h3>

            <div className="p-4 space-y-4">
              {/* Incassi Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-400">Incassi Cantieri:</span>
                  <strong className="font-mono text-emerald-700 dark:text-emerald-400">€ {totalJobCollected.toFixed(2)}</strong>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>

              {/* Stipendi Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-sky-800 dark:text-sky-400">Stipendi Operai Pagati:</span>
                  <strong className="font-mono text-sky-700 dark:text-sky-400">€ {totalWorkerPaidAll.toFixed(2)}</strong>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{
                      width: `${totalJobCollected > 0 ? Math.min(100, (totalWorkerPaidAll / totalJobCollected) * 100) : 30}%`,
                    }}
                  />
                </div>
              </div>

              {/* Spese Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-rose-800 dark:text-rose-400">Spese Operative:</span>
                  <strong className="font-mono text-rose-700 dark:text-rose-400">€ {totalExpensesAmount.toFixed(2)}</strong>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${totalJobCollected > 0 ? Math.min(100, (totalExpensesAmount / totalJobCollected) * 100) : 20}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Payment Method Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Riparto Modalità di Pagamento</span>
            </h3>

            <div className="p-4 space-y-3 text-xs">
              <div className="p-[7px] bg-slate-50 dark:bg-slate-800/60 rounded-[7px] flex items-center justify-between">
                <span>Bonifico Bancario</span>
                <strong className="font-mono text-emerald-700 dark:text-emerald-400">65%</strong>
              </div>

              <div className="p-[7px] bg-slate-50 dark:bg-slate-800/60 rounded-[7px] flex items-center justify-between">
                <span>POS / Carta di Credito</span>
                <strong className="font-mono text-emerald-700 dark:text-emerald-400">20%</strong>
              </div>

              <div className="p-[7px] bg-slate-50 dark:bg-slate-800/60 rounded-[7px] flex items-center justify-between">
                <span>Contanti Diretti</span>
                <strong className="font-mono text-emerald-700 dark:text-emerald-400">10%</strong>
              </div>

              <div className="p-[7px] bg-slate-50 dark:bg-slate-800/60 rounded-[7px] flex items-center justify-between">
                <span>RiBa 30/60 gg</span>
                <strong className="font-mono text-emerald-700 dark:text-emerald-400">5%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-[7px] backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-[7px] space-y-[7px] shadow-2xl">
            <div className="bg-slate-900 text-white p-[7px] px-3 rounded-[7px] flex items-center justify-between">
              <h3 className="font-bold text-xs">Registra Spesa Operativa</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-[7px] space-y-[7px] text-xs">
              <div className="space-y-[7px]">
                <label className="font-semibold block">Descrizione Spesa *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="es. Carburante rasaerba, Acquisto concime"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-[7px]">
                  <label className="font-semibold block">Importo (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] font-mono font-bold text-rose-600"
                  />
                </div>

                <div className="space-y-[7px]">
                  <label className="font-semibold block">Data *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-[7px]">
                  <label className="font-semibold block">Categoria</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                  >
                    <option value="carburante">Carburante</option>
                    <option value="manutenzione">Manutenzione Attrezzature</option>
                    <option value="materiale">Materiali Cantiere</option>
                    <option value="attrezzatura">Nuova Attrezzatura</option>
                    <option value="generale">Spese Generali</option>
                  </select>
                </div>

                <div className="space-y-[7px]">
                  <label className="font-semibold block">Modalità Pagamento</label>
                  <select
                    value={expMethod}
                    onChange={(e) => setExpMethod(e.target.value as PaymentMethod)}
                    className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                  >
                    <option value="pos_carta">POS / Carta di Credito</option>
                    <option value="bonifico">Bonifico Bancario</option>
                    <option value="contanti">Contanti</option>
                    <option value="assegno">Assegno</option>
                  </select>
                </div>
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold block">Fornitore / Esercente</label>
                <input
                  type="text"
                  value={expVendor}
                  onChange={(e) => setExpVendor(e.target.value)}
                  placeholder="es. Eni Station / Agraria Monza"
                  className="w-full p-[7px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-[7px]">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-[7px]"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px]"
                >
                  Salva Spesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      { id: 'bonifico', label: 'Bonifico Bancario' },
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
                    { id: 'partial', label: 'Parziale' },
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
                    { id: 'bonifico', label: 'Bonifico Bancario' },
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

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
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
            </form>
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
                    { id: 'bonifico', label: 'Bonifico Bancario' },
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
    </div>
  );
};
