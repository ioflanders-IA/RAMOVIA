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

  return (
    <div className="space-y-[7px]">
      {/* Header Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-[7px] px-3 rounded-[7px] flex flex-col sm:flex-row sm:items-center justify-between gap-[7px] shadow-xs">
        <div className="flex items-center gap-[7px]">
          <div className="w-8 h-8 rounded-[7px] bg-emerald-800 flex items-center justify-center text-emerald-300 shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Gestione Pagamenti, Stipendi & Bilancio</h1>
            <p className="text-[10px] text-slate-300">
              Storico incassi lavori, calcolo giornate operai, registro spese e report finanziari
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center gap-1.5 p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-[7px] shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registra Nuova Spesa</span>
        </button>
      </div>

      {/* Financial KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[7px]">
        {/* Total Collections */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Incassi Cantieri</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            € {totalJobCollected.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Da Incassare:</span>
            <strong className="text-amber-600 dark:text-amber-400 font-mono">€ {totalJobPending.toFixed(2)}</strong>
          </div>
        </div>

        {/* Total Salaries */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stipendi Operai</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-700 dark:text-sky-400">
            € {totalWorkerPaidAll.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Maturato Ore:</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono">€ {totalWorkerEarningsAll.toFixed(2)}</strong>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Spese Operative</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400">
            € {totalExpensesAmount.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Carburante, manutenzioni e ricambi
          </div>
        </div>

        {/* Net Operating Margin */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Margine Netto</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className={`text-2xl font-bold font-mono ${netMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            € {netMargin.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Incassi - Stipendi - Spese
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-[7px] bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-[7px] text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('stipendi')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] transition-colors cursor-pointer shrink-0 ${
            activeSubTab === 'stipendi'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Stipendi & Giornate Operai</span>
        </button>

        <button
          onClick={() => setActiveSubTab('incassi')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] transition-colors cursor-pointer shrink-0 ${
            activeSubTab === 'incassi'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Incassi Lavori Cantieri</span>
        </button>

        <button
          onClick={() => setActiveSubTab('clienti')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] transition-colors cursor-pointer shrink-0 ${
            activeSubTab === 'clienti'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Clienti & Rubrica</span>
        </button>

        <button
          onClick={() => setActiveSubTab('spese')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] transition-colors cursor-pointer shrink-0 ${
            activeSubTab === 'spese'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Spese & Materiali</span>
        </button>

        <button
          onClick={() => setActiveSubTab('grafici')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] transition-colors cursor-pointer shrink-0 ${
            activeSubTab === 'grafici'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Grafici & Modalità Pagamento</span>
        </button>
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
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Registro Incassi Lavori ({jobs.length} interventi)
            </h3>
          </div>

          <div className="space-y-[7px] max-h-[500px] overflow-y-auto">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nessun cantiere o intervento ancora registrato.
              </div>
            ) : (
              jobs.map((job) => {
                const price = job.price || 0;
                const paid = job.installments && job.installments.length > 0
                  ? job.installments.reduce((sum, it) => sum + it.amount, 0)
                  : job.paidAmount || (job.paymentStatus === 'paid' ? price : 0);
                const remaining = Math.max(0, price - paid);
                const status = job.paymentStatus || (paid >= price && price > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid');
                const method = job.paymentMethod || 'bonifico';

                return (
                  <div
                    key={job.id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
                          {job.clientName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {job.date}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {job.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Modalità: <strong>{getMethodLabel(method)}</strong></span>
                        {job.installments && job.installments.length > 0 && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            {job.installments.length} acconti registrati
                          </span>
                        )}
                      </div>

                      {/* Mini elenco acconti se presenti */}
                      {job.installments && job.installments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.installments.map((inst, idx) => (
                            <span
                              key={inst.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-700 dark:text-slate-300 font-mono"
                            >
                              <span>Acconto #{idx + 1}: € {inst.amount.toFixed(2)} ({inst.date})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          € {price.toFixed(2)}
                        </div>
                        {remaining > 0 && paid > 0 && (
                          <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                            Rimanente: € {remaining.toFixed(2)}
                          </div>
                        )}
                        <span
                          className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded mt-0.5 ${
                            status === 'paid'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : status === 'partial'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {status === 'paid' ? 'SALDATO' : status === 'partial' ? 'PARZIALE' : 'DA INCASSARE'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedJobForAcconto(job);
                            setAccontoAmount(remaining > 0 ? remaining : 50);
                            setAccontoDate(new Date().toISOString().split('T')[0]);
                            setAccontoMethod(job.paymentMethod || 'bonifico');
                            setAccontoNotes('');
                          }}
                          className="p-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-[7px] font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Acconto</span>
                        </button>

                        {status !== 'paid' && (
                          <button
                            onClick={() => {
                              updateJob({
                                ...job,
                                paymentStatus: 'paid',
                                paidAmount: price,
                              });
                            }}
                            className="p-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold text-[11px] shadow-xs cursor-pointer whitespace-nowrap"
                          >
                            Segna Saldato
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

                        <button
                          type="button"
                          onClick={async () => {
                            const updatedInst = (selectedJobForAcconto.installments || []).filter((it) => it.id !== inst.id);
                            const newPaid = updatedInst.reduce((s, it) => s + it.amount, 0);
                            const price = selectedJobForAcconto.price || 0;
                            const newStatus: any = newPaid >= price && price > 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

                            const updatedJob = {
                              ...selectedJobForAcconto,
                              installments: updatedInst,
                              paidAmount: newPaid,
                              paymentStatus: newStatus,
                            };
                            await updateJob(updatedJob);
                            setSelectedJobForAcconto(updatedJob);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Elimina questo acconto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
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
    </div>
  );
};
