import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkReport } from '../../types';
import { WorkReportModal } from './WorkReportModal';
import {
  FileCheck2,
  Search,
  Filter,
  Printer,
  Download,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const ReportsHub: React.FC = () => {
  const { reports, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved'>('all');
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);

  // If worker, only their reports; if admin, all reports
  const visibleReports = reports.filter((r) => {
    if (currentUser.role === 'worker' && r.workerId !== currentUser.uid) {
      return false;
    }
    if (statusFilter !== 'all' && r.status !== statusFilter) {
      return false;
    }
    const matchesSearch =
      r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.workerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalHoursWorked = visibleReports.reduce((sum, r) => sum + r.totalHours, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            <span>Registro Rapportini di Lavoro Digitali</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Archivio certificato con ore timesheet, materiali scaricati, rilievo fotografico e firma touch del committente.
          </p>
        </div>

        {/* Stats Strip */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-xs text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Ore Rendicontate</span>
            <span className="text-base font-mono font-bold text-emerald-800">{totalHoursWorked.toFixed(1)} ore</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-xs text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Rapportini Archiviati</span>
            <span className="text-base font-mono font-bold text-slate-900">{visibleReports.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tutti ({reports.length})
          </button>
          <button
            onClick={() => setStatusFilter('submitted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              statusFilter === 'submitted' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Da Approvare
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              statusFilter === 'approved' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approvati
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca per cliente o lavoro..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-xs focus:outline-emerald-600"
          />
        </div>
      </div>

      {/* Reports Table / Card List */}
      <div className="space-y-3">
        {visibleReports.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
            Nessun rapportino trovato con i filtri selezionati.
          </div>
        ) : (
          visibleReports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      report.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {report.status === 'approved' ? 'APPROVATO' : 'IN ATTESA APPROVAZIONE'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    #{report.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">· {report.date}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{report.clientName}</h3>
                <div className="text-xs text-slate-600 font-medium">{report.jobTitle}</div>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.workerName}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.totalHours} ore ({report.startTime} - {report.endTime})</span>
                  </span>
                  {report.materialsUsed && report.materialsUsed.length > 0 && (
                    <span className="text-emerald-700">
                      {report.materialsUsed.length} materiali utilizzati
                    </span>
                  )}
                </div>
              </div>

              {/* Right side: Photos thumbnail & View CTA */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {report.photosAfter && report.photosAfter.length > 0 && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hidden sm:block">
                    <img
                      src={report.photosAfter[0]}
                      alt="Dopo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-emerald-700 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>Apri Scheda / PDF</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Work Report Detail & PDF Modal */}
      {selectedReport && (
        <WorkReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};
