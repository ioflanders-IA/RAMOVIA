import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchWeatherForClients } from '../../services/weatherService';
import { Job, WorkReport, WeatherData } from '../../types';
import { JobModal } from '../jobs/JobModal';
import { WorkReportModal } from '../report/WorkReportModal';
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
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'dashboard' | 'map' | 'calendar' | 'clients' | 'inventory' | 'reports' | 'payments' | 'weather') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { jobs, users, inventory, reports, clients, shoppingList, addJob, updateJob } = useApp();

  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [selectedReportForModal, setSelectedReportForModal] = useState<WorkReport | null>(null);

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

  const todayStr = new Date().toISOString().split('T')[0];
  const todayJobs = jobs.filter((j) => j.date === todayStr);
  const completedToday = todayJobs.filter((j) => j.status === 'completed');
  const inProgressToday = todayJobs.filter((j) => j.status === 'in_progress');

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
      
      {/* Top Banner with Weather Button & New Job Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard Cantieri & Squadre
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Panoramica degli interventi programmati e stato delle squadre sul campo.
          </p>
        </div>

        <div className="flex items-center gap-[7px]">
          {/* Tasto unico Meteo Cantieri per navigare alla pagina normale del meteo */}
          <button
            onClick={() => onNavigateTab('weather')}
            className={`flex items-center gap-[7px] p-[7px] px-3 border text-xs font-bold rounded-[7px] shadow-xs transition-colors shrink-0 ${
              alertClients.length > 0
                ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
            }`}
            title="Apri la pagina Meteo Cantieri"
          >
            <CloudSun className={`w-4 h-4 ${alertClients.length > 0 ? 'text-amber-600' : 'text-emerald-700 dark:text-emerald-400'}`} />
            <span>Meteo Cantieri</span>
            {alertClients.length > 0 && (
              <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {alertClients.length} {alertClients.length === 1 ? 'allerta' : 'allerte'}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsCreatingJob(true)}
            className="flex items-center gap-[7px] p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-[7px] shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Intervento</span>
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS with 7px spacing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[7px]">
        
        {/* Cantieri Oggi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cantieri Oggi</span>
            <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {todayJobs.length}
          </div>
          <div className="flex items-center gap-[7px] text-xs text-slate-600 dark:text-slate-300">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{completedToday.length} completati</span>
            <span>·</span>
            <span className="text-sky-700 dark:text-sky-400 font-semibold">{inProgressToday.length} in corso</span>
          </div>
        </div>

        {/* Squadre sul Campo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Squadre Attive</span>
            <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {users.filter((u) => u.role === 'worker' && u.active).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Operatori sul campo
          </div>
        </div>

        {/* Ore Lavorate Rendicontate */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs cursor-pointer hover:border-emerald-300 transition-colors space-y-[7px]"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ore Rendicontate</span>
            <Timer className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-400">
            {totalReportedHours.toFixed(1)} h
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Totale da rapportini archiviati
          </div>
        </div>

        {/* Rapportini da Validare */}
        <div
          onClick={() => onNavigateTab('reports')}
          className={`border rounded-[7px] p-[7px] shadow-xs cursor-pointer transition-colors space-y-[7px] ${
            pendingApprovalReports.length > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rapportini da Validare</span>
            <FileCheck2 className={`w-4 h-4 ${pendingApprovalReports.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${pendingApprovalReports.length > 0 ? 'text-amber-900 dark:text-amber-300' : 'text-slate-900 dark:text-slate-100'}`}>
            {pendingApprovalReports.length}
          </div>
          <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center justify-between">
            <span>Inviati dagli operai</span>
            <ArrowRight className="w-3.5 h-3.5" />
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

      {/* MAIN OPERATIONAL SECTION: Today's Jobs & Squad Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[7px]">
        
        {/* Today's Jobs List (Expanded to 2 cols for clarity) */}
        <div className="lg:col-span-2 space-y-[7px]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
            <div className="flex items-center justify-between pb-[7px] border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-[7px]">
                <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Programma Interventi di Oggi ({todayJobs.length})</span>
              </span>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Vai al Calendario</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-[7px]">
              {todayJobs.length === 0 ? (
                <div className="p-[7px] py-8 text-center space-y-[7px]">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Nessun intervento programmato per oggi.
                  </p>
                  <button
                    onClick={() => setIsCreatingJob(true)}
                    className="inline-flex items-center gap-[7px] p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-[7px] shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pianifica un lavoro per oggi</span>
                  </button>
                </div>
              ) : (
                todayJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobForModal(job)}
                    className="p-[7px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition-colors space-y-[7px]"
                  >
                    <div className="flex items-center justify-between gap-[7px]">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {job.clientName}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-[7px] py-0.5 rounded-[7px] border border-slate-200 dark:border-slate-700 shrink-0">
                        {job.timeSlot}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                      {job.title}
                    </div>

                    {job.clientAddress && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {job.clientAddress}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-[7px] border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>Assegnato a: <strong>{job.assignedWorkerName}</strong></span>
                      <span
                        className={`p-[7px] py-0.5 rounded-[7px] font-bold text-[9px] uppercase ${
                          job.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : job.status === 'in_progress'
                            ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {job.status === 'completed'
                          ? 'Completato'
                          : job.status === 'in_progress'
                          ? 'In Corso'
                          : 'Programmato'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side Column: Squads & Quick Info with 7px spacing */}
        <div className="space-y-[7px]">
          
          {/* Quick Team Status Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
            <div className="flex items-center justify-between pb-[7px] border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-[7px]">
                <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Squadre sul Campo</span>
              </span>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Rapportini</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-[7px]">
              {users
                .filter((u) => u.role === 'worker' && u.active)
                .slice(0, 5)
                .map((worker) => {
                  const workerJobsToday = todayJobs.filter(
                    (j) => j.assignedWorkerId === worker.uid || j.assignedWorkerName === worker.displayName
                  );
                  return (
                    <div
                      key={worker.uid}
                      className="flex items-center justify-between p-[7px] rounded-[7px] bg-slate-50 dark:bg-slate-800/50 text-xs border border-slate-100 dark:border-slate-800"
                    >
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {worker.displayName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {workerJobsToday.length} {workerJobsToday.length === 1 ? 'lavoro oggi' : 'lavori oggi'}
                      </span>
                    </div>
                  );
                })}
            </div>
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

    </div>
  );
};
