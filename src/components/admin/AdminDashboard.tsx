import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WeatherWidget } from '../weather/WeatherWidget';
import { Job, WorkReport } from '../../types';
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
  Building2,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'dashboard' | 'map' | 'calendar' | 'clients' | 'inventory' | 'reports') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { jobs, users, inventory, reports, clients, shoppingList, addJob, updateJob } = useApp();

  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [selectedReportForModal, setSelectedReportForModal] = useState<WorkReport | null>(null);

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
      
      {/* Top Banner (Cleaned up: Map button removed as requested) */}
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

      {/* Warning Banners */}
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

      {/* OPERATIONAL SUMMARY GRID (Cleaned up: Map banner removed as requested) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[7px]">
        
        {/* Active Clients & Gardens Overview (2 columns) */}
        <div className="lg:col-span-2 space-y-[7px]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
            <div className="flex items-center justify-between pb-[7px] border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-[7px]">
                <Building2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Elenco Cantieri & Giardini Registrati ({clients.length})
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('clients')}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Gestisci Clienti</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[7px] max-h-[360px] overflow-y-auto">
              {clients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => onNavigateTab('clients')}
                  className="p-[7px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {client.name}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded-[7px] border border-emerald-200 dark:border-emerald-800">
                      {client.gardenNotes?.squareMeters || '0'} mq
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    📍 {client.address}
                  </div>
                  {client.gardenNotes?.polygonPoints && client.gardenNotes.polygonPoints.length > 0 && (
                    <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold pt-0.5 flex items-center gap-1">
                      <span>📐 Perimetro tracciato sulla mappa ({client.gardenNotes.polygonPoints.length} vertici)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weather & Active Squads (1 column) */}
        <div className="space-y-[7px]">
          <WeatherWidget clients={clients} />

          {/* Today's Jobs Quick List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-[7px]">
                <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Programma di Oggi</span>
              </span>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Calendario</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-[7px] max-h-60 overflow-y-auto">
              {todayJobs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  Nessun intervento in programma per oggi.
                </div>
              ) : (
                todayJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobForModal(job)}
                    className="p-[7px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between gap-[7px]">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {job.clientName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                        {job.timeSlot}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                      {job.title}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                      <span>Assegnato: <strong>{job.assignedWorkerName}</strong></span>
                      <span className={`px-1.5 py-0.5 rounded-[7px] font-bold text-[9px] uppercase ${
                        job.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : job.status === 'in_progress'
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}>
                        {job.status === 'completed' ? 'Completato' : job.status === 'in_progress' ? 'In Corso' : 'Programmato'}
                      </span>
                    </div>
                  </div>
                ))
              )}
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
