import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchWeatherForClients } from '../../services/weatherService';
import { Job, WorkReport, WeatherData } from '../../types';
import { JobModal } from '../jobs/JobModal';
import { WorkReportModal } from '../report/WorkReportModal';
import { ExpenseModal } from '../payments/ExpenseModal';
import { isJobTimeExpired, isJobCurrentlyInProgress } from '../../utils/jobTimeUtils';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ArrowRight,
  FileCheck2,
  ShoppingCart,
  Wrench,
  Timer,
  CloudSun,
  AlertTriangle,
  Droplets,
  Wind,
  CheckCircle2,
  Check,
  RotateCcw,
  Receipt,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'dashboard' | 'map' | 'calendar' | 'clients' | 'inventory' | 'reports' | 'payments' | 'weather') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { jobs, users, inventory, reports, clients, shoppingList, addJob, updateJob } = useApp();

  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [selectedReportForModal, setSelectedReportForModal] = useState<WorkReport | null>(null);

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
      
      {/* Top Banner with Weather Button, Add Expense, and New Job Action */}
      <div className="flex items-center justify-between sm:justify-end gap-[7px]">
        <div className="flex items-center gap-[7px] w-full sm:w-auto justify-between sm:justify-end">
          {/* Tasto Meteo solo icona */}
          <button
            onClick={() => onNavigateTab('weather')}
            className={`relative flex items-center justify-center p-[7px] px-2.5 sm:px-3 border rounded-[7px] shadow-xs transition-colors shrink-0 cursor-pointer ${
              alertClients.length > 0
                ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
            title={`Meteo Cantieri${alertClients.length > 0 ? ` (${alertClients.length} allerte)` : ''}`}
            aria-label="Meteo Cantieri"
          >
            <CloudSun className={`w-4 h-4 ${alertClients.length > 0 ? 'text-amber-600' : 'text-emerald-700 dark:text-emerald-400'}`} />
            {alertClients.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Tasto Aggiungi Spesa come presente in Spese */}
          <button
            onClick={() => setIsCreatingExpense(true)}
            className="flex items-center gap-1.5 p-[7px] px-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-800 dark:border-slate-700 text-xs font-bold rounded-[7px] shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Aggiungi Nuova Spesa"
            aria-label="Aggiungi Spesa"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Spesa</span>
          </button>

          {/* Tasto Nuovo Intervento */}
          <button
            onClick={() => setIsCreatingJob(true)}
            className="flex items-center gap-1.5 p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-[7px] shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Intervento</span>
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS: 4 cards all on the same row */}
      <div className="grid grid-cols-4 gap-[7px]">
        
        {/* 1. Cantieri Oggi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Cantieri Oggi</span>
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 leading-tight">
            {todayJobs.length}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 truncate">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{completedToday.length} fatti</span>
            <span className="mx-1">·</span>
            <span className="text-sky-700 dark:text-sky-400 font-semibold">{inProgressToday.length} in corso</span>
          </div>
        </div>

        {/* 2. Squadre Attive */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Squadre Attive</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 leading-tight">
            {users.filter((u) => u.role === 'worker' && u.active).length}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
            Operatori sul campo
          </div>
        </div>

        {/* 3. Ore Rendicontate */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs cursor-pointer hover:border-emerald-300 transition-colors flex flex-col justify-between space-y-1"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Ore Rendicontate</span>
            <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-400 leading-tight">
            {totalReportedHours.toFixed(1)} h
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
            Totale da rapportini
          </div>
        </div>

        {/* 4. Rapportini da Validare */}
        <div
          onClick={() => onNavigateTab('reports')}
          className={`border rounded-[7px] p-[7px] shadow-xs cursor-pointer transition-colors flex flex-col justify-between space-y-1 ${
            pendingApprovalReports.length > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Rapportini da Validare</span>
            <FileCheck2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${pendingApprovalReports.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'} shrink-0`} />
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono ${pendingApprovalReports.length > 0 ? 'text-amber-900 dark:text-amber-300' : 'text-slate-900 dark:text-slate-100'} leading-tight`}>
            {pendingApprovalReports.length}
          </div>
          <div className="text-[10px] sm:text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center justify-between truncate">
            <span className="truncate">Inviati dagli operai</span>
            <ArrowRight className="w-3 h-3 shrink-0 ml-1" />
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

      {/* ALLERTA METEO SECTION: Titolo solo "Allerta meteo con icona", zero testi superflui, senza duplicato del tasto, bordi e spazi a 7PX */}
      {alertClients.length > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          {/* Header con solo icona e titolo Allerta Meteo */}
          <div className="flex items-center gap-[7px]">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200">
              Allerta Meteo
            </span>
          </div>

          {/* Elenco cantieri in allerta con spaziatura 7PX */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[7px]">
            {alertClients.map((client) => {
              const w = weatherMap[client.id];
              const clientTodayJobs = todayJobs.filter(
                (j) => j.clientId === client.id || j.clientName === client.name
              );

              return (
                <div
                  key={client.id}
                  onClick={() => onNavigateTab('weather')}
                  className="p-[7px] bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-[7px] hover:border-amber-500 cursor-pointer transition-colors space-y-[7px] shadow-xs"
                >
                  <div className="flex items-start justify-between gap-[7px]">
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate block">
                        {client.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                        {client.address}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-400 shrink-0">
                      {w ? `${w.temp}°C` : '--'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-900 dark:text-amber-200 bg-amber-100/60 dark:bg-amber-900/40 p-[7px] rounded-[7px]">
                    <span className="flex items-center gap-[7px]">
                      <Droplets className="w-3.5 h-3.5 text-sky-600" />
                      Pioggia: <strong>{w?.precipitationProbability ?? 0}%</strong>
                    </span>
                    <span className="flex items-center gap-[7px]">
                      <Wind className="w-3.5 h-3.5 text-slate-500" />
                      {w?.windSpeed ?? 0} km/h
                    </span>
                  </div>

                  <div className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold">
                    {w?.condition}: Sfalcio sconsigliato.
                  </div>

                  {clientTodayJobs.length > 0 && (
                    <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 p-[7px] rounded-[7px] border border-rose-200 dark:border-rose-800">
                      Attenzione: {clientTodayJobs.length} lavoro in programma per oggi!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
                    onClick={() => setSelectedJobForModal(job)}
                    className={`p-2.5 sm:p-3 border rounded-[6px] hover:border-emerald-400 dark:hover:border-emerald-600 cursor-pointer transition-all space-y-1.5 ${
                      isCompleted
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-2xs'
                        : isInProgress
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-700/80 shadow-2xs'
                        : isExpired
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/70'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
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

                    {/* Bottom row with worker assignment & quick completion button */}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-[7px] border-t border-slate-200/60 dark:border-slate-700/60 gap-2">
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
                    onClick={() => setSelectedJobForModal(job)}
                    className={`p-2.5 sm:p-3 border rounded-[6px] hover:border-emerald-400 dark:hover:border-emerald-600 cursor-pointer transition-all space-y-1.5 ${
                      isCompleted
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
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

                    {/* Bottom row with worker assignment */}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-[7px] border-t border-slate-200/60 dark:border-slate-700/60 gap-2">
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
