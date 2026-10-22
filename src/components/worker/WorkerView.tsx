import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Job, WorkReport } from '../../types';
import { ReportSubmissionModal } from './ReportSubmissionModal';
import { WorkReportModal } from '../report/WorkReportModal';
import {
  Calendar,
  Clock,
  Compass,
  MapPin,
  Play,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Package,
  ShieldAlert,
  FileCheck2,
  Phone,
} from 'lucide-react';

export const WorkerView: React.FC = () => {
  const { currentUser, jobs, startJob, reports, clients } = useApp();

  const [selectedJobForReport, setSelectedJobForReport] = useState<Job | null>(null);
  const [selectedReportToView, setSelectedReportToView] = useState<WorkReport | null>(null);
  const [expandedGardenJobId, setExpandedGardenJobId] = useState<string | null>(null);

  // Live timer for jobs in progress
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter jobs strictly assigned to this worker
  const myJobs = jobs.filter((j) => j.assignedWorkerId === currentUser?.uid);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayJobs = myJobs.filter((j) => j.date === todayStr);
  const otherJobs = myJobs.filter((j) => j.date !== todayStr);

  const handleStartWork = (jobId: string) => {
    startJob(jobId);
    setElapsedSeconds(0);
  };

  return (
    <div className="space-y-[7px] max-w-3xl mx-auto pb-12">
      
      {/* Top Mobile Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-[7px] p-[7px] shadow-sm border border-emerald-800 space-y-[7px]">
        <div className="flex items-center justify-between gap-[7px]">
          <div>
            <div className="text-[10px] text-emerald-300 font-semibold tracking-wider uppercase">
              Operatore sul campo
            </div>
            <h1 className="text-lg font-bold text-white">{currentUser?.displayName}</h1>
            <div className="text-[11px] text-emerald-200/80 flex items-center gap-[7px] font-mono">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Oggi: {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center p-[7px] rounded-[7px] bg-emerald-800/80 text-emerald-200 text-xs font-semibold border border-emerald-700 font-mono">
              {todayJobs.length} interventi oggi
            </span>
          </div>
        </div>
      </div>

      {/* TODAY'S JOBS LIST */}
      <div className="space-y-[7px]">
        <div className="flex items-center justify-between px-[7px]">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-[7px]">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>I Miei Interventi di Oggi</span>
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">Priorità giornaliera</span>
        </div>

        {todayJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[7px] p-[7px] py-8 text-center text-slate-500 text-xs">
            Nessun intervento programmato per oggi sul tuo profilo.
          </div>
        ) : (
          todayJobs.map((job) => {
            const clientDetails = clients.find((c) => c.id === job.clientId);
            const isExpanded = expandedGardenJobId === job.id;
            const existingReport = reports.find((r) => r.jobId === job.id);

            return (
              <div
                key={job.id}
                className={`bg-white rounded-[7px] border transition-all shadow-xs overflow-hidden space-y-[7px] p-[7px] ${
                  job.status === 'in_progress'
                    ? 'border-sky-500 ring-2 ring-sky-100'
                    : job.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Job Header Bar */}
                <div className="space-y-[7px]">
                  <div className="flex items-start justify-between gap-[7px]">
                    <div>
                      {/* Status badge */}
                      <div className="flex items-center gap-[7px]">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            job.status === 'in_progress'
                              ? 'bg-sky-100 text-sky-800 animate-pulse'
                              : job.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {job.status === 'in_progress'
                            ? 'LAVORO IN CORSO'
                            : job.status === 'completed'
                            ? 'COMPLETATO'
                            : 'PROGRAMMATO'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono flex items-center gap-[7px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {job.timeSlot}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {job.clientName}
                      </h3>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{job.clientAddress}</span>
                      </div>
                    </div>

                    {/* Quick Maps Navigation Button */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 flex items-center gap-[7px] p-[7px] bg-slate-900 hover:bg-slate-800 text-white rounded-[7px] text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span>Naviga</span>
                    </a>
                  </div>

                  {/* Job Title & Scope */}
                  <div className="p-[7px] bg-slate-50 border border-slate-200/80 rounded-[7px] text-xs space-y-[7px]">
                    <div className="font-bold text-slate-800">{job.title}</div>
                    <div className="text-slate-600 leading-relaxed">{job.description}</div>
                  </div>

                  {/* Materials To Pick Up */}
                  {job.materialsRequired && job.materialsRequired.length > 0 && (
                    <div className="flex items-center gap-[7px] flex-wrap text-xs">
                      <span className="text-slate-500 font-semibold flex items-center gap-[7px]">
                        <Package className="w-3.5 h-3.5" /> Materiali necessari:
                      </span>
                      {job.materialsRequired.map((mat, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-[7px] py-0.5 rounded-[7px] font-mono text-[11px]"
                        >
                          {mat.qtyNeeded} {mat.unit} {mat.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Garden Technical Card Dropdown */}
                  {clientDetails && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGardenJobId(isExpanded ? null : job.id)
                        }
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-colors p-[7px]"
                      >
                        <span className="flex items-center gap-[7px]">
                          <Info className="w-4 h-4 text-emerald-700" />
                          Scheda Tecnica Giardino (Codici cancelli, animali, irrigazione)
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-[7px] bg-emerald-950/5 border border-emerald-200/80 rounded-[7px] text-xs space-y-[7px] text-slate-800">
                          <div className="grid grid-cols-2 gap-[7px] pb-2 border-b border-emerald-100">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                Superficie Prato
                              </span>
                              <span className="font-mono font-bold text-emerald-900">
                                {clientDetails.gardenNotes.squareMeters} mq
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                Codice Cancello / Accesso
                              </span>
                              <span className="font-mono font-bold text-slate-900 bg-white p-[7px] py-0.5 rounded-[7px] border border-slate-200 inline-block">
                                {clientDetails.gardenNotes.gateCode}
                              </span>
                            </div>
                          </div>

                          {clientDetails.gardenNotes.dogPresent && (
                            <div className="flex items-start gap-[7px] p-[7px] bg-amber-50 border border-amber-200 rounded-[7px] text-amber-900 text-xs font-semibold">
                              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                              <span>Attenzione: Cani presenti in proprietà! Accertarsi che siano chiusi prima di accedere con i macchinari.</span>
                            </div>
                          )}

                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">
                              Impianto Irrigazione
                            </span>
                            <span className="text-slate-700">
                              {clientDetails.gardenNotes.irrigationDetails}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">
                              Essenze Delicate / Prescrizioni
                            </span>
                            <span className="text-slate-700">
                              {clientDetails.gardenNotes.delicatePlants}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* JOB ACTIONS & TIMESHEET CONTROLS */}
                  <div className="pt-2 border-t border-slate-100">
                    {job.status === 'scheduled' && (
                      <button
                        onClick={() => handleStartWork(job.id)}
                        className="w-full flex items-center justify-center gap-[7px] p-[7px] py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] text-sm font-bold shadow-xs transition-colors"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Inizia Lavoro (Avvia Timer Cantiere)</span>
                      </button>
                    )}

                    {job.status === 'in_progress' && (
                      <div className="space-y-[7px]">
                        {/* Live Timer Display */}
                        <div className="bg-sky-50 border border-sky-200 rounded-[7px] p-[7px] flex items-center justify-between">
                          <div className="flex items-center gap-[7px]">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
                            <span className="text-xs font-bold text-sky-900 uppercase">
                              Lavoro In Corso
                            </span>
                          </div>
                          <div className="font-mono text-xl font-bold text-sky-950">
                            {formatTimer(elapsedSeconds)}
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedJobForReport(job)}
                          className="w-full flex items-center justify-center gap-[7px] p-[7px] py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-[7px] text-sm font-bold shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Termina Lavoro & Compila Rapportino</span>
                        </button>
                      </div>
                    )}

                    {job.status === 'completed' && (
                      <div className="flex items-center justify-between gap-[7px]">
                        <span className="flex items-center gap-[7px] text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Intervento concluso con successo
                        </span>

                        {existingReport && (
                          <button
                            onClick={() => setSelectedReportToView(existingReport)}
                            className="flex items-center gap-[7px] p-[7px] text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 rounded-[7px] border border-emerald-200"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Vedi Rapportino</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* OTHER SCHEDULED JOBS */}
      {otherJobs.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Prossimi Interventi Assegnati ({otherJobs.length})
          </h2>

          <div className="space-y-2">
            {otherJobs.map((j) => (
              <div
                key={j.id}
                className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{j.clientName}</div>
                  <div className="text-slate-500">{j.title}</div>
                </div>
                <div className="text-right font-mono text-slate-600">
                  <div className="font-bold">{j.date}</div>
                  <div>{j.timeSlot}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Submission Modal */}
      {selectedJobForReport && (
        <ReportSubmissionModal
          job={selectedJobForReport}
          initialHours={elapsedSeconds > 0 ? Number((elapsedSeconds / 3600).toFixed(2)) : 1.0}
          onClose={() => setSelectedJobForReport(null)}
          onSuccess={() => setSelectedJobForReport(null)}
        />
      )}

      {/* Completed Report Preview Modal */}
      {selectedReportToView && (
        <WorkReportModal
          report={selectedReportToView}
          onClose={() => setSelectedReportToView(null)}
        />
      )}
    </div>
  );
};
