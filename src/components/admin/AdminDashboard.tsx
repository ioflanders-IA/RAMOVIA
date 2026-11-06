import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp, consolidateWorkedDays } from '../../context/AppContext';
import { fetchWeatherForClients, fetchWeatherForLocation } from '../../services/weatherService';
import { Job, WorkReport, WeatherData } from '../../types';
import { JobModal } from '../jobs/JobModal';
import { JobDetailViewModal } from '../jobs/JobDetailViewModal';
import { JobCostManagerModal } from '../jobs/JobCostManagerModal';
import { WorkReportModal } from '../report/WorkReportModal';
import { ExpenseModal } from '../payments/ExpenseModal';
import { isJobTimeExpired, isJobCurrentlyInProgress } from '../../utils/jobTimeUtils';
import { getEffectiveJobStatusOnDate } from '../calendar/CalendarView';
import {
  WeatherVectorIcon,
  ExpenseWalletVectorIcon,
  PruningShearsVectorIcon,
} from '../common/HeaderVectorIcons';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ArrowRight,
  Fuel,
  FileCheck2,
  ShoppingCart,
  Wrench,
  Timer,
  CloudSun,
  AlertTriangle,
  Droplets,
  Wind,
  Thermometer,
  CheckCircle2,
  Check,
  RotateCcw,
  Receipt,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  Wallet,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'dashboard' | 'map' | 'calendar' | 'clients' | 'inventory' | 'reports' | 'payments' | 'weather') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { jobs, users, inventory, reports, clients, shoppingList, workedDays, payouts, addJob, updateJob } = useApp();

  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [selectedJobForView, setSelectedJobForView] = useState<{ job: Job; dateISO: string } | null>(null);
  const [costJob, setCostJob] = useState<Job | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [selectedReportForModal, setSelectedReportForModal] = useState<WorkReport | null>(null);
  const [isWeatherAlertOpen, setIsWeatherAlertOpen] = useState(false);

  // Clock ticker to refresh time-based statuses (in corso, orario scaduto) automatically every 30s
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Weather state across cantieri for alert detection
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherData>>({});
  // GPS Location synchronized weather
  const [userGpsWeather, setUserGpsWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const data = await fetchWeatherForLocation(
              position.coords.latitude,
              position.coords.longitude
            );
            setUserGpsWeather(data);
          } catch (err) {
            console.warn('GPS weather fetch error:', err);
          }
        },
        (err) => {
          console.warn('GPS location permission declined/unavailable:', err.message);
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    }
  }, []);

  const loadWeatherData = useCallback((forceRefresh = false) => {
    if (clients.length === 0) return;
    fetchWeatherForClients(clients, forceRefresh)
      .then((map) => {
        setWeatherMap(map);
      })
      .catch((err) => {
        console.error('Errore caricamento meteo cantieri:', err);
      });
  }, [clients]);

  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  // Weather object to display (prefer user GPS, fallback to first client)
  const displayWeather = userGpsWeather || (clients.length > 0 ? weatherMap[clients[0].id] : null);

  // Identify cantieri with active weather alert
  const alertClients = clients.filter((c) => weatherMap[c.id]?.rainAlert);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const todayJobs = jobs.filter((j) => j.date === todayStr);
  const tomorrowJobs = jobs.filter((j) => j.date === tomorrowStr);
  const completedToday = todayJobs.filter((j) => j.status === 'completed');
  const expiredJobsToday = todayJobs.filter((j) => isJobTimeExpired(j));
  const inProgressToday = todayJobs.filter((j) => isJobCurrentlyInProgress(j));

  const pendingApprovalReports = reports.filter((r) => r.status === 'submitted');

  // Real operational hours logged across all reports
  const totalReportedHours = reports.reduce((sum, r) => sum + r.totalHours, 0);

  // Operatori unici impegnati nei cantieri di oggi (contati solo 1 volta al giorno)
  const activeWorkersToday = useMemo(() => {
    const uniqueWorkerIds = new Set<string>();
    todayJobs.forEach((j) => {
      if (j.assignedWorkerIds && j.assignedWorkerIds.length > 0) {
        j.assignedWorkerIds.forEach((wId) => { if (wId) uniqueWorkerIds.add(wId); });
      } else if (j.assignedWorkerId) {
        uniqueWorkerIds.add(j.assignedWorkerId);
      }
    });
    return uniqueWorkerIds.size > 0
      ? uniqueWorkerIds.size
      : users.filter((u) => u.role === 'worker' && u.active).length;
  }, [todayJobs, users]);

  // 1. Cantieri questo mese: quanti interventi completati nel mese corrente
  const completedJobsThisMonthCount = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayISO = now.toISOString().split('T')[0];

    let count = 0;
    jobs.forEach((job) => {
      if (Array.isArray(job.plannedDates) && job.plannedDates.length > 1) {
        // Intervento periodico: conta le uscite completate nel mese corrente
        job.plannedDates.forEach((d) => {
          if (d && d.startsWith(currentMonthPrefix)) {
            if (getEffectiveJobStatusOnDate(job, d, todayISO) === 'completed') {
              count += 1;
            }
          }
        });
      } else {
        // Intervento singolo
        const jDate = (job.date || '').split('T')[0];
        if (jDate.startsWith(currentMonthPrefix) && job.status === 'completed') {
          count += 1;
        }
      }
    });
    return count;
  }, [jobs]);

  // 2. Incassi da riscuotere (totale ancora da incassare)
  const totalJobPending = useMemo(() => {
    const totalRev = jobs.reduce((sum, j) => sum + (j.price || 0), 0);
    const totalColl = jobs.reduce((sum, j) => {
      if (j.paymentStatus === 'paid') return sum + (j.price || 0);
      if (j.installments && j.installments.length > 0) {
        return sum + j.installments.reduce((s, it) => s + (it.amount || 0), 0);
      }
      if (j.paidAmount) return sum + j.paidAmount;
      if (j.paymentStatus === 'partial') return sum + ((j.price || 0) / 2);
      return sum;
    }, 0);
    return Math.max(0, totalRev - totalColl);
  }, [jobs]);

  // 3. Stipendi da pagare (totale 'DA DARE' agli operai)
  const workers = useMemo(() => users.filter((u) => u.role === 'worker'), [users]);
  const workerUids = useMemo(() => new Set(workers.map((w) => w.uid)), [workers]);
  const validWorkedDays = useMemo(
    () => consolidateWorkedDays((workedDays || []).filter((wd) => workerUids.has(wd.workerId))),
    [workedDays, workerUids]
  );

  const totalWorkerPendingAll = useMemo(() => {
    const allMonths = new Set<string>();
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    allMonths.add(currentMonthStr);

    validWorkedDays.forEach((wd) => {
      if (wd.date && wd.date.length >= 7) {
        allMonths.add(wd.date.substring(0, 7));
      }
    });

    (payouts || []).forEach((p) => {
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

    workers.forEach((worker) => {
      const workerDays = validWorkedDays.filter((wd) => wd.workerId === worker.uid);
      const workerPayouts = (payouts || []).filter(
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
      });

      const unzonedDays = workerDays.filter((d) => !processedDayIds.has(d.id));
      if (unzonedDays.length > 0) {
        const unzonedEarned = unzonedDays.reduce((sum, d) => sum + (d.amount || 0), 0);
        const unzonedPaid = unzonedDays.filter((d) => d.paid).reduce((sum, d) => sum + (d.amount || 0), 0);
        const cappedUnzonedPaid = unzonedEarned > 0 ? Math.min(unzonedEarned, unzonedPaid) : unzonedPaid;
        pendingTotal += Math.max(0, unzonedEarned - cappedUnzonedPaid);
      }
    });

    return pendingTotal;
  }, [workers, workerUids, validWorkedDays, payouts]);

  // 4. Totale operai
  const totalWorkersCount = useMemo(() => {
    return users.filter((u) => u.role === 'worker').length;
  }, [users]);

  const formatAmountNoCents = (amount: number): string => {
    return Math.round(amount || 0).toLocaleString('it-IT');
  };

  const handleSaveJob = (jobData: any) => {
    if (selectedJobForModal) {
      updateJob({ ...selectedJobForModal, ...jobData });
      setSelectedJobForModal(null);
    } else {
      addJob(jobData);
      setIsCreatingJob(false);
    }
  };

  return (
    <div className="space-y-[7px]">
      
      {/* Top Banner with Weather Button (Left), and Add Expense + New Job Actions grouped closely (Right) - SENZA LINEA */}
      <div className="flex items-center justify-between pb-1">
        
        {/* Tasto Meteo Sincronizzato con Posizione (Ingrandito +15%, Niente bordo, Niente sfondo) */}
        <button
          type="button"
          onClick={() => onNavigateTab('weather')}
          className="relative flex items-center gap-2 p-1 bg-transparent border-0 shadow-none hover:opacity-85 transition-opacity shrink-0 cursor-pointer text-slate-800 dark:text-slate-100 font-bold text-sm"
          title={
            displayWeather
              ? `Meteo Sincronizzato Posizione: ${displayWeather.condition}, ${displayWeather.temp}°C`
              : 'Meteo Sincronizzato Posizione'
          }
          aria-label="Meteo Posizione"
        >
          <WeatherVectorIcon data={displayWeather} className="w-8 h-8" />
          {displayWeather && (
            <span className="font-mono font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
              {displayWeather.temp}°C
            </span>
          )}
          {alertClients.length > 0 && (
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shrink-0" title={`${alertClients.length} allerte cantieri`} />
          )}
        </button>

        {/* Tasti Azione Raggruppati a Destra (Spesa + Nuovo Intervento vicini) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Tasto Spesa (Icona tutta rossa, Ingrandita +15%, Icon-only, Niente bordo, Niente sfondo) */}
          <button
            type="button"
            onClick={() => setIsCreatingExpense(true)}
            className="flex items-center p-1 bg-transparent border-0 shadow-none hover:opacity-85 transition-opacity shrink-0 cursor-pointer"
            title="Aggiungi Nuova Spesa"
            aria-label="Aggiungi Spesa"
          >
            <ExpenseWalletVectorIcon className="w-8 h-8" />
          </button>

          {/* Tasto Nuovo Intervento (Operaio con lente e foglia, Ingrandita +15%, Icon-only, Niente bordo, Niente sfondo) */}
          <button
            type="button"
            onClick={() => setIsCreatingJob(true)}
            className="flex items-center p-1 bg-transparent border-0 shadow-none hover:opacity-85 transition-opacity shrink-0 cursor-pointer"
            title="Pianifica Nuovo Intervento"
            aria-label="Nuovo Intervento"
          >
            <PruningShearsVectorIcon className="w-8 h-8" />
          </button>
        </div>

      </div>

      {/* KPI STAT CARDS: 4 card senza titolo, senza sfondo e senza bordo, solo icona e valore */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        
        {/* 1. Cantieri questo mese (interventi completati) */}
        <div
          onClick={() => onNavigateTab('calendar')}
          title="Cantieri completati questo mese"
          className="py-1 px-0.5 sm:px-1 flex flex-col justify-between space-y-1 cursor-pointer hover:opacity-80 transition-opacity select-none"
        >
          <div className="flex items-center text-slate-500 dark:text-slate-400">
            <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
            {completedJobsThisMonthCount}
          </div>
        </div>

        {/* 2. Incassi da riscuotere */}
        <div
          onClick={() => onNavigateTab('payments')}
          title="Incassi da riscuotere"
          className="py-1 px-0.5 sm:px-1 flex flex-col justify-between space-y-1 cursor-pointer hover:opacity-80 transition-opacity select-none"
        >
          <div className="flex items-center text-slate-500 dark:text-slate-400">
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="text-[13px] sm:text-lg md:text-xl font-black font-mono text-emerald-700 dark:text-emerald-400 leading-tight truncate">
            € {formatAmountNoCents(totalJobPending)}
          </div>
        </div>

        {/* 3. Stipendi da pagare */}
        <div
          onClick={() => onNavigateTab('payments')}
          title="Stipendi da pagare"
          className="py-1 px-0.5 sm:px-1 flex flex-col justify-between space-y-1 cursor-pointer hover:opacity-80 transition-opacity select-none"
        >
          <div className="flex items-center text-slate-500 dark:text-slate-400">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="text-[13px] sm:text-lg md:text-xl font-black font-mono text-amber-600 dark:text-amber-400 leading-tight truncate">
            € {formatAmountNoCents(totalWorkerPendingAll)}
          </div>
        </div>

        {/* 4. Totale operai */}
        <div
          onClick={() => onNavigateTab('calendar')}
          title="Totale operai"
          className="py-1 px-0.5 sm:px-1 flex flex-col justify-between space-y-1 cursor-pointer hover:opacity-80 transition-opacity select-none"
        >
          <div className="flex items-center text-slate-500 dark:text-slate-400">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
            {totalWorkersCount}
          </div>
        </div>
      </div>

      {/* Warning Banners (Inventory / Maintenance) with 7px spacing */}
      {(shoppingList.length > 0 || inventory.some((i) => i.category === 'equipment' && i.currentUsageHours >= i.maintenanceIntervalHours)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[7px]">
          {shoppingList.length > 0 && (
            <div
              onClick={() => onNavigateTab('inventory')}
              className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-[7px] p-[7px] flex items-center justify-between gap-[7px] cursor-pointer hover:bg-amber-100/70 transition-colors"
            >
              <div className="flex items-center gap-[7px]">
                <ShoppingCart className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <div className="text-xs text-amber-950 dark:text-amber-200">
                  <strong>{shoppingList.length} Materiali sotto scorta o richiesti dai cantieri!</strong> Lista spesa.
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 underline shrink-0">Vedi lista</span>
            </div>
          )}

          {inventory.some((i) => i.category === 'equipment' && i.currentUsageHours >= i.maintenanceIntervalHours) && (
            <div
              onClick={() => onNavigateTab('inventory')}
              className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-[7px] p-[7px] flex items-center justify-between gap-[7px] cursor-pointer hover:bg-rose-100/70 transition-colors"
            >
              <div className="flex items-center gap-[7px]">
                <Wrench className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                <div className="text-xs text-rose-950 dark:text-rose-200">
                  <strong>Attrezzature in scadenza manutenzione!</strong> Ore limite superate.
                </div>
              </div>
              <span className="text-xs font-bold text-rose-800 dark:text-rose-400 underline shrink-0">Controlla</span>
            </div>
          )}
        </div>
      )}

      {/* ALLERTA METEO SECTION: Chiusa di default, cliccabile per aprire le schede interne */}
      {alertClients.length > 0 && (
        <div className={`bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-[7px] p-[7px] shadow-xs transition-all ${isWeatherAlertOpen ? 'space-y-[7px]' : ''}`}>
          {/* Header con solo icona, titolo Allerta Meteo e chevron cliccabile */}
          <button
            type="button"
            onClick={() => setIsWeatherAlertOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 cursor-pointer text-left select-none"
            aria-expanded={isWeatherAlertOpen}
          >
            <div className="flex items-center gap-[7px]">
              <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200">
                Allerta Meteo
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <span className="text-xs font-bold font-mono text-amber-950 dark:text-amber-200">
                {alertClients.length}
              </span>
              {isWeatherAlertOpen ? (
                <ChevronUp className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              )}
            </div>
          </button>

          {/* Elenco cantieri in allerta: visibile solo quando aperto */}
          {isWeatherAlertOpen && (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-[7px] pt-0.5 animate-in fade-in duration-150">
              {alertClients.map((client) => {
                const w = weatherMap[client.id];

                return (
                  <div
                    key={client.id}
                    onClick={() => onNavigateTab('weather')}
                    className="p-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-[7px] hover:border-amber-500 cursor-pointer transition-colors flex flex-col justify-between shadow-xs min-w-0 h-full"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight flex-1 min-w-0 break-words">
                        {client.name}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-[10px] sm:text-[11px] font-mono text-amber-800 dark:text-amber-300 font-semibold mt-auto pt-1">
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-sky-500 shrink-0" />
                        <span>{w?.precipitationProbability ?? 0}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wind className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{w?.windSpeed ?? 0} km/h</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                        <Thermometer className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{w ? `${w.temp}°C` : '--'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MAIN OPERATIONAL SECTION: Interventi di Oggi e Domani */}
      <div className="space-y-[7px]">
        
        {/* Today's Jobs List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] shadow-xs space-y-[3px]">
          <div className="flex items-center justify-between px-1.5 pt-1 pb-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Interventi di Oggi</span>
              {todayJobs.length > 0 && (
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
                  {todayJobs.length}
                </span>
              )}
            </span>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Vai al Calendario</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-[3px]">
            {todayJobs.length === 0 ? (
              <div className="p-3 py-8 text-center space-y-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Nessun intervento programmato per oggi.
                </p>
                <button
                  onClick={() => setIsCreatingJob(true)}
                  className="inline-flex items-center gap-1.5 p-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-[6px] shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pianifica un lavoro per oggi</span>
                </button>
              </div>
            ) : (
              todayJobs.map((job) => {
                const isCompleted = job.status === 'completed';
                const isExpired = !isCompleted && isJobTimeExpired(job);
                const isInProgress = !isCompleted && isJobCurrentlyInProgress(job);

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobForView({ job, dateISO: todayStr })}
                    className={`p-2.5 sm:p-3 border border-dashed rounded-[6px] hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all space-y-1.5 ${
                      isCompleted
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-600 shadow-2xs'
                        : isInProgress
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-500 shadow-2xs'
                        : isExpired
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700/70'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5 pt-0.5">
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        <span className={isCompleted ? 'text-emerald-950 dark:text-emerald-200' : ''}>
                          {job.clientName}
                        </span>
                      </span>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-[7px] border border-slate-200 dark:border-slate-700 shrink-0">
                          {job.timeSlot}
                        </span>
                        {isExpired && (
                          <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold bg-amber-100/80 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-[5px] border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                            <span>Orario terminato</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                      {job.title}
                    </div>

                    {job.clientAddress && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {job.clientAddress}
                      </div>
                    )}

                    {/* Bottom row with worker assignment & quick completion button - LINEA TRATTEGGIATA */}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-[7px] border-t border-dashed border-slate-200 dark:border-slate-700/80 gap-2">
                      <span className="truncate">Assegnato a: <strong>{job.assignedWorkerName}</strong></span>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Pulsante 'In Corso' o 'Segna Ultimato' con 1 clic per completare */}
                        {!isCompleted ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateJob({ ...job, status: 'completed' });
                            }}
                            className={`flex items-center gap-1.5 p-[7px] py-1 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-600 dark:border-emerald-500 rounded-[7px] font-bold text-[10px] transition-colors cursor-pointer ${
                              isInProgress ? 'ring-1 ring-emerald-500/30' : ''
                            }`}
                            title={
                              isInProgress
                                ? 'Intervento in corso · Clicca per segnare come Ultimato'
                                : 'Clicca per segnare subito come Ultimato / Completato'
                            }
                          >
                            {isInProgress ? (
                              <>
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-400"></span>
                                </span>
                                <span>In Corso</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Segna Ultimato</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="flex items-center gap-1 p-[7px] py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-[7px] font-bold text-[9px] uppercase">
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Ultimato</span>
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateJob({ ...job, status: 'scheduled' });
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 rounded transition-colors text-[10px]"
                              title="Riapri e imposta come programmato"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tomorrow's Jobs List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] shadow-xs space-y-[3px]">
          <div className="flex items-center justify-between px-1.5 pt-1 pb-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Interventi di Domani</span>
              {tomorrowJobs.length > 0 && (
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
                  {tomorrowJobs.length}
                </span>
              )}
            </span>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Vai al Calendario</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-[3px]">
            {tomorrowJobs.length === 0 ? (
              <div className="p-3 py-6 text-center space-y-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Nessun intervento programmato per domani.
                </p>
                <button
                  onClick={() => setIsCreatingJob(true)}
                  className="inline-flex items-center gap-1.5 p-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-[6px] shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pianifica un lavoro per domani</span>
                </button>
              </div>
            ) : (
              tomorrowJobs.map((job) => {
                const isCompleted = job.status === 'completed';

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobForView({ job, dateISO: tomorrowStr })}
                    className={`p-2.5 sm:p-3 border border-dashed rounded-[6px] hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all space-y-1.5 ${
                      isCompleted
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5 pt-0.5">
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        <span className={isCompleted ? 'text-emerald-950 dark:text-emerald-200' : ''}>
                          {job.clientName}
                        </span>
                      </span>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-[7px] border border-slate-200 dark:border-slate-700 shrink-0">
                          {job.timeSlot}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                      {job.title}
                    </div>

                    {job.clientAddress && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {job.clientAddress}
                      </div>
                    )}

                    {/* Bottom row with worker assignment - LINEA TRATTEGGIATA */}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-[7px] border-t border-dashed border-slate-200 dark:border-slate-700/80 gap-2">
                      <span className="truncate">Assegnato a: <strong>{job.assignedWorkerName}</strong></span>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="p-[7px] py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[7px] font-semibold text-[9px] uppercase">
                          {job.status === 'completed' ? 'Ultimato' : 'Programmato'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Read-Only Job Detail View Modal */}
      {selectedJobForView && (
        <JobDetailViewModal
          job={selectedJobForView.job}
          selectedDateISO={selectedJobForView.dateISO}
          onClose={() => setSelectedJobForView(null)}
          onEdit={() => {
            const current = selectedJobForView.job;
            setSelectedJobForView(null);
            setSelectedJobForModal(current);
          }}
        />
      )}

      {/* Interactive Cost Manager Modal */}
      {costJob && (
        <JobCostManagerModal
          job={costJob}
          onClose={() => setCostJob(null)}
        />
      )}

      {/* Modal for Creating or Editing Job */}
      {(isCreatingJob || selectedJobForModal) && (
        <JobModal
          job={selectedJobForModal || undefined}
          onClose={() => {
            setIsCreatingJob(false);
            setSelectedJobForModal(null);
          }}
          onSave={handleSaveJob}
        />
      )}

      {/* Modal for Reviewing Report */}
      {selectedReportForModal && (
        <WorkReportModal
          report={selectedReportForModal}
          onClose={() => setSelectedReportForModal(null)}
        />
      )}

      {/* Modal for Recording Expense */}
      <ExpenseModal
        isOpen={isCreatingExpense}
        onClose={() => setIsCreatingExpense(false)}
      />

    </div>
  );
};
