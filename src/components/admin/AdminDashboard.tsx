import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MapView } from '../map/MapView';
import { WeatherWidget } from '../weather/WeatherWidget';
import { Job, WorkReport } from '../../types';
import { JobModal } from '../jobs/JobModal';
import { WorkReportModal } from '../report/WorkReportModal';
import {
  Calendar,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Users,
  Package,
  Plus,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  ShoppingCart,
  Wrench,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'calendar' | 'clients' | 'inventory' | 'reports') => void;
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
  const scheduledToday = todayJobs.filter((j) => j.status === 'scheduled');

  const pendingApprovalReports = reports.filter((r) => r.status === 'submitted');

  // Revenue calculation (only visible to Admin)
  const todayRevenue = todayJobs.reduce((sum, j) => sum + (j.agreedPrice || 0), 0);

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
    <div className="space-y-6">
      
      {/* Top Banner / Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Panoramica Direzione Operativa
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Cantieri & Squadre
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoraggio in tempo reale degli interventi su Monza, Brianza e hinterland milanese.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingJob(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Intervento</span>
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Cantieri Oggi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cantieri Oggi</span>
            <Calendar className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {todayJobs.length}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-emerald-700 font-semibold">{completedToday.length} completati</span>
            <span>·</span>
            <span className="text-sky-700 font-semibold">{inProgressToday.length} in corso</span>
          </div>
        </div>

        {/* Squadre sul Campo */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Squadre sul Campo</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {users.filter((u) => u.role === 'worker' && u.active).length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Operatori attivi con automezzi
          </div>
        </div>

        {/* Preventivi Cantieri Giornalieri (Admin Only) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fatturato Stimato Oggi</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800">
            € {todayRevenue.toLocaleString('it-IT')}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Tariffe interventi di giornata
          </div>
        </div>

        {/* Rapportini da Approvare */}
        <div
          onClick={() => onNavigateTab('reports')}
          className={`border rounded-2xl p-4 shadow-xs cursor-pointer transition-colors ${
            pendingApprovalReports.length > 0
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/50'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rapportini da Validare</span>
            <FileCheck2 className={`w-4 h-4 ${pendingApprovalReports.length > 0 ? 'text-amber-700' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${pendingApprovalReports.length > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
            {pendingApprovalReports.length}
          </div>
          <div className="mt-1 text-xs text-amber-800 font-semibold flex items-center justify-between">
            <span>Inviati dagli operai</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Warning Banners (Low stock & Maintenance Overdue) */}
      {(shoppingList.length > 0 || inventory.some((i) => i.category === 'equipment' && i.currentUsageHours && i.maintenanceIntervalHours && i.currentUsageHours >= i.maintenanceIntervalHours)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shoppingList.length > 0 && (
            <div
              onClick={() => onNavigateTab('inventory')}
              className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-100/70 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 text-amber-700 shrink-0" />
                <div className="text-xs text-amber-950">
                  <strong>{shoppingList.length} Materiali sotto scorta o richiesti dai cantieri!</strong> Lista della spesa pronta.
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 underline shrink-0">Vedi lista</span>
            </div>
          )}

          {inventory.some((i) => i.category === 'equipment' && i.currentUsageHours && i.maintenanceIntervalHours && i.currentUsageHours >= i.maintenanceIntervalHours) && (
            <div
              onClick={() => onNavigateTab('inventory')}
              className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-100/70 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-rose-700 shrink-0" />
                <div className="text-xs text-rose-950">
                  <strong>Attrezzature in scadenza manutenzione!</strong> Ore d'uso limite superate.
                </div>
              </div>
              <span className="text-xs font-bold text-rose-800 underline shrink-0">Controlla</span>
            </div>
          )}
        </div>
      )}

      {/* MAP AND WEATHER DUAL VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Leaflet OpenStreetMap (2 columns) */}
        <div className="lg:col-span-2 h-[450px]">
          <MapView onSelectJob={(job) => setSelectedJobForModal(job)} />
        </div>

        {/* Weather & Active Squads (1 column) */}
        <div className="space-y-4">
          <WeatherWidget clients={clients} />

          {/* Today's Jobs Quick List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                Programma Lavori di Oggi
              </span>
              <span className="text-xs text-slate-500 font-mono">{todayJobs.length} cantieri</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {todayJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobForModal(job)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-emerald-400 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 truncate">{job.clientName}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        job.status === 'in_progress'
                          ? 'bg-sky-100 text-sky-800'
                          : job.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {job.status === 'in_progress' ? 'IN CORSO' : job.status === 'completed' ? 'FATTO' : 'PROG'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 line-clamp-1">{job.title}</div>
                  
                  <div className="mt-1.5 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono">{job.timeSlot}</span>
                    <span className="font-semibold text-slate-700">{job.assignedWorkerName}</span>
                  </div>
                </div>
              ))}

              {todayJobs.length === 0 && (
                <div className="text-xs text-slate-400 py-6 text-center">
                  Nessun cantiere programmato per oggi.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Create/Edit Modal */}
      {(isCreatingJob || selectedJobForModal) && (
        <JobModal
          job={selectedJobForModal}
          onClose={() => {
            setIsCreatingJob(false);
            setSelectedJobForModal(null);
          }}
          onSave={handleSaveJob}
        />
      )}

      {/* Report Modal */}
      {selectedReportForModal && (
        <WorkReportModal
          report={selectedReportForModal}
          onClose={() => setSelectedReportForModal(null)}
        />
      )}
    </div>
  );
};
