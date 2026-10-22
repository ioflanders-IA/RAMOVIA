import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Job } from '../../types';
import { JobModal } from '../jobs/JobModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { jobs, users, addJob, updateJob, deleteJob, currentUser } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newJobDate, setNewJobDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Generate 7 days of the current week (starting Monday)
  const getWeekDates = (baseDate: Date) => {
    const current = new Date(baseDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(current.setDate(diff));

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSaveJob = (jobData: any) => {
    if (selectedJobForEdit) {
      updateJob({ ...selectedJobForEdit, ...jobData });
      setSelectedJobForEdit(null);
    } else {
      addJob(jobData);
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-700" />
            <span>Pianificazione Settimanale Squadre</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Calendario operativo assegnazioni cantieri, fasce orarie e monitoraggio avanzamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Worker Filter */}
          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:outline-emerald-600"
          >
            <option value="all">Tutti gli Operai</option>
            {users
              .filter((u) => u.role === 'worker')
              .map((w) => (
                <option key={w.uid} value={w.uid}>
                  {w.displayName}
                </option>
              ))}
          </select>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                setNewJobDate(todayStr);
                setIsCreatingNew(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Intervento</span>
            </button>
          )}
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
        <button
          onClick={prevWeek}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
          Settimana dal {weekDates[0].toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} al{' '}
          {weekDates[6].toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        <button
          onClick={nextWeek}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 7-DAY WEEKLY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDates.map((dayDate) => {
          const dateISO = dayDate.toISOString().split('T')[0];
          const isToday = dateISO === todayStr;

          const dayJobs = jobs.filter((job) => {
            if (job.date !== dateISO) return false;
            if (workerFilter !== 'all' && job.assignedWorkerId !== workerFilter) return false;
            return true;
          });

          return (
            <div
              key={dateISO}
              className={`bg-white border rounded-2xl p-3 flex flex-col justify-between min-h-[280px] shadow-xs ${
                isToday
                  ? 'border-emerald-600 ring-2 ring-emerald-50'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {dayDate.toLocaleDateString('it-IT', { weekday: 'short' })}
                    </div>
                    <div className={`text-base font-bold font-mono ${
                      isToday ? 'text-emerald-700' : 'text-slate-900'
                    }`}>
                      {dayDate.getDate()}
                    </div>
                  </div>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setNewJobDate(dateISO);
                        setIsCreatingNew(true);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-700 rounded hover:bg-emerald-50 transition-colors"
                      title="Pianifica intervento per questa data"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Day Jobs List */}
                <div className="space-y-2">
                  {dayJobs.map((job) => {
                    let statusColor = 'border-amber-200 bg-amber-50/60 text-amber-900';
                    if (job.status === 'in_progress') {
                      statusColor = 'border-sky-300 bg-sky-50 text-sky-950 font-semibold';
                    } else if (job.status === 'completed') {
                      statusColor = 'border-emerald-200 bg-emerald-50/50 text-emerald-950';
                    }

                    return (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJobForEdit(job)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer hover:shadow-sm transition-all ${statusColor}`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className="font-bold truncate">{job.timeSlot}</span>
                          <span className="text-[9px] uppercase font-bold px-1 rounded bg-white/70">
                            {job.status === 'in_progress' ? 'IN CORSO' : job.status === 'completed' ? 'FATTO' : 'PROG'}
                          </span>
                        </div>

                        <div className="font-bold text-slate-900 truncate">{job.clientName}</div>
                        <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{job.title}</div>

                        <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium truncate">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            {job.assignedWorkerName.split(' ')[0]}
                          </span>
                          {currentUser.role === 'admin' && job.agreedPrice && (
                            <span className="font-mono font-bold text-emerald-800">
                              €{job.agreedPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {dayJobs.length === 0 && (
                    <div className="text-[11px] text-slate-400 text-center py-8">
                      Nessun cantiere
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Job Edit / Create Modal */}
      {(isCreatingNew || selectedJobForEdit) && (
        <JobModal
          job={selectedJobForEdit}
          initialDate={newJobDate}
          onClose={() => {
            setIsCreatingNew(false);
            setSelectedJobForEdit(null);
          }}
          onSave={handleSaveJob}
        />
      )}
    </div>
  );
};
