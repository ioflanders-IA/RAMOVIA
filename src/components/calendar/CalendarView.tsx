import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Job } from '../../types';
import { JobModal } from '../jobs/JobModal';
import { SquadWorkersRegistry } from './SquadWorkersRegistry';
import { formatLocalDate, parseLocalDate, formatItalianDate } from '../../utils/dateUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  CalendarDays,
  Search,
  Trash2,
  X,
  ChevronDown,
} from 'lucide-react';

export type CalendarMode = 'week' | 'month' | 'year' | 'day';

// Helper: check if a job is scheduled on a specific YYYY-MM-DD date
export const isJobScheduledOnDate = (job: Job, targetDateISO: string): boolean => {
  if (!job) return false;
  const cleanTarget = targetDateISO.split('T')[0];
  const cleanJobDate = job.date ? job.date.split('T')[0] : '';
  if (cleanJobDate === cleanTarget) return true;
  if (Array.isArray(job.plannedDates)) {
    return job.plannedDates.some((d) => d && d.split('T')[0] === cleanTarget);
  }
  return false;
};

// Helper: check if a job occurs in a given year and month (0-indexed month)
export const isJobInMonth = (job: Job, year: number, month: number): boolean => {
  if (!job) return false;
  const targetPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const cleanJobDate = job.date ? job.date.split('T')[0] : '';
  if (cleanJobDate.startsWith(targetPrefix)) return true;
  if (Array.isArray(job.plannedDates)) {
    return job.plannedDates.some((d) => d && d.split('T')[0].startsWith(targetPrefix));
  }
  return false;
};

// Helper: check if a job occurs in a given year
export const isJobInYear = (job: Job, year: number): boolean => {
  if (!job) return false;
  const targetPrefix = `${year}-`;
  const cleanJobDate = job.date ? job.date.split('T')[0] : '';
  if (cleanJobDate.startsWith(targetPrefix)) return true;
  if (Array.isArray(job.plannedDates)) {
    return job.plannedDates.some((d) => d && d.split('T')[0].startsWith(targetPrefix));
  }
  return false;
};

const ITALIAN_MONTHS = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

export const CalendarView: React.FC = () => {
  const { jobs, users, addJob, updateJob, deleteJob, currentUser, workedDays } = useApp();

  const [activeTab, setActiveTab] = useState<'calendar' | 'workers'>('calendar');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newJobDate, setNewJobDate] = useState<string>(() => formatLocalDate(new Date()));
  const [selectedDateISO, setSelectedDateISO] = useState<string>(() => formatLocalDate(new Date()));

  // Long-press delete state
  const [activeDeleteJobId, setActiveDeleteJobId] = useState<string | null>(null);
  const [jobToDeleteConfirm, setJobToDeleteConfirm] = useState<Job | null>(null);

  // Quick Month/Year Dropdown
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  // Filter jobs based on worker, status and search query
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Worker filter
      if (workerFilter !== 'all') {
        const matchesWorker =
          job.assignedWorkerId === workerFilter ||
          (job.assignedWorkerIds && job.assignedWorkerIds.includes(workerFilter)) ||
          (workerFilter === currentUser?.uid &&
            (job.assignedWorkerName?.toLowerCase().includes('andrea') ||
              job.assignedWorkerName?.toLowerCase().includes('blasi') ||
              job.assignedWorkerName?.toLowerCase().includes('titolare')));
        if (!matchesWorker) return false;
      }
      // Status filter
      if (statusFilter !== 'all' && job.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const clientMatch = job.clientName?.toLowerCase().includes(q);
        const titleMatch = job.title?.toLowerCase().includes(q);
        const workerMatch = job.assignedWorkerName?.toLowerCase().includes(q);
        const addressMatch = job.clientAddress?.toLowerCase().includes(q);
        if (!clientMatch && !titleMatch && !workerMatch && !addressMatch) return false;
      }
      return true;
    });
  }, [jobs, workerFilter, statusFilter, searchQuery, currentUser]);

  const selectedDateObj = useMemo(() => {
    return parseLocalDate(selectedDateISO);
  }, [selectedDateISO]);

  const selectedDayJobs = useMemo(() => {
    return filteredJobs.filter((job) => isJobScheduledOnDate(job, selectedDateISO));
  }, [filteredJobs, selectedDateISO]);

  // WEEK NAVIGATION & DATES (computed with midday hour to avoid DST shifts)
  const getWeekDates = (baseDate: Date) => {
    const current = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 12, 0, 0);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday is start
    const monday = new Date(current.getFullYear(), current.getMonth(), diff, 12, 0, 0);

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
      week.push(d);
    }
    return week;
  };

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // MONTH NAVIGATION & MATRIX (computed using local date helpers to avoid UTC day-offset)
  const monthMatrix = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1, 12, 0, 0);
    const lastDayOfMonth = new Date(year, month + 1, 0, 12, 0, 0);

    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const cells: { date: Date; dateISO: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Leading days from previous month
    const prevMonthLastDay = new Date(year, month, 0, 12, 0, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i, 12, 0, 0);
      const iso = formatLocalDate(d);
      cells.push({ date: d, dateISO: iso, isCurrentMonth: false, isToday: iso === todayStr });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i, 12, 0, 0);
      const iso = formatLocalDate(d);
      cells.push({ date: d, dateISO: iso, isCurrentMonth: true, isToday: iso === todayStr });
    }

    // Trailing days to fill standard 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i, 12, 0, 0);
      const iso = formatLocalDate(d);
      cells.push({ date: d, dateISO: iso, isCurrentMonth: false, isToday: iso === todayStr });
    }

    return cells;
  }, [currentDate, todayStr]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    const next = new Date(currentDate);
    if (calendarMode === 'day') {
      next.setDate(next.getDate() - 1);
    } else if (calendarMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else if (calendarMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (calendarMode === 'year') {
      next.setFullYear(next.getFullYear() - 1);
    }
    setCurrentDate(next);
  }, [currentDate, calendarMode]);

  const handleNext = useCallback(() => {
    const next = new Date(currentDate);
    if (calendarMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else if (calendarMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (calendarMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (calendarMode === 'year') {
      next.setFullYear(next.getFullYear() + 1);
    }
    setCurrentDate(next);
  }, [currentDate, calendarMode]);

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Keyboard navigation support: Left Arrow = Previous, Right Arrow = Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Touch Swipe detection for intuitive scrolling
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 60) {
      handleNext();
    } else if (diff < -60) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const handleSaveJob = (jobData: any) => {
    if (selectedJobForEdit) {
      updateJob({ ...selectedJobForEdit, ...jobData });
      setSelectedJobForEdit(null);
    } else {
      addJob(jobData);
      setIsCreatingNew(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status: Job['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: 'FATTO',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-500',
        };
      case 'in_progress':
        return {
          label: 'IN CORSO',
          bg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800',
          dot: 'bg-sky-500',
        };
      case 'cancelled':
        return {
          label: 'ANNULLATO',
          bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: 'PROG',
          bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          dot: 'bg-amber-500',
        };
    }
  };

  // Helper to determine aggregate status style for a given day's jobs
  const getDayStatusStyle = (jobsOnDay: Job[]) => {
    if (jobsOnDay.length === 0) return null;

    const hasInProgress = jobsOnDay.some((j) => j.status === 'in_progress');
    if (hasInProgress) {
      return {
        bg: 'bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border border-sky-400 dark:border-sky-600 hover:bg-sky-200',
        dot: 'bg-sky-500',
        label: 'In Corso',
      };
    }

    const hasScheduled = jobsOnDay.some((j) => j.status === 'scheduled');
    if (hasScheduled) {
      return {
        bg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-600 hover:bg-amber-200',
        dot: 'bg-amber-500',
        label: 'Programmato',
      };
    }

    const allCompleted = jobsOnDay.every((j) => j.status === 'completed');
    if (allCompleted) {
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-600 hover:bg-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Ultimato',
      };
    }

    return {
      bg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-400 dark:border-rose-600 hover:bg-rose-200',
      dot: 'bg-rose-500',
      label: 'Annullato',
    };
  };

  // Header Title based on active mode
  const getHeaderTitle = () => {
    if (calendarMode === 'day') {
      return currentDate.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    if (calendarMode === 'week') {
      const start = weekDates[0].toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
      const end = weekDates[6].toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${start} - ${end}`;
    }
    if (calendarMode === 'month') {
      return currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    }
    if (calendarMode === 'year') {
      return `Anno ${currentDate.getFullYear()}`;
    }
    return '';
  };

  // Metrics for current year in Year view
  const currentYear = currentDate.getFullYear();
  const yearJobs = useMemo(() => {
    return filteredJobs.filter((j) => isJobInYear(j, currentYear));
  }, [filteredJobs, currentYear]);

  const yearStats = useMemo(() => {
    const total = yearJobs.length;
    const completed = yearJobs.filter((j) => j.status === 'completed').length;
    const inProgress = yearJobs.filter((j) => j.status === 'in_progress').length;
    const scheduled = yearJobs.filter((j) => j.status === 'scheduled').length;
    return { total, completed, inProgress, scheduled };
  }, [yearJobs]);

  // Metrics for current month in Month view
  const currentMonth = currentDate.getMonth();
  const monthJobs = useMemo(() => {
    return filteredJobs.filter((j) => isJobInMonth(j, currentYear, currentMonth));
  }, [filteredJobs, currentYear, currentMonth]);

  const monthStats = useMemo(() => {
    const total = monthJobs.length;
    const completed = monthJobs.filter((j) => j.status === 'completed').length;
    const inProgress = monthJobs.filter((j) => j.status === 'in_progress').length;
    const scheduled = monthJobs.filter((j) => j.status === 'scheduled').length;
    return { total, completed, inProgress, scheduled };
  }, [monthJobs]);

  // Helper hook / handlers for long-press on cards
  const createLongPressCardProps = (job: Job) => {
    let pressTimer: NodeJS.Timeout | null = null;
    let didLongPress = false;

    const start = () => {
      didLongPress = false;
      pressTimer = setTimeout(() => {
        didLongPress = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(60);
        }
        setActiveDeleteJobId(job.id);
      }, 500); // 500ms long press threshold
    };

    const clear = (triggerClick: boolean) => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (triggerClick && !didLongPress && activeDeleteJobId !== job.id) {
        setSelectedJobForEdit(job);
      }
    };

    return {
      onMouseDown: () => start(),
      onMouseUp: () => clear(true),
      onMouseLeave: () => clear(false),
      onTouchStart: () => start(),
      onTouchEnd: () => clear(true),
      onTouchMove: () => clear(false),
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        setActiveDeleteJobId(job.id);
      },
    };
  };

  return (
    <div className="space-y-[3px]">
      {/* Top Sub-Tabs Selector Bar: Calendario | Operai (gap a 3px) */}
      <div className="flex items-center gap-[3px] bg-slate-200/80 dark:bg-slate-800/80 p-[3px] rounded-[7px] text-xs font-bold">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] transition-colors cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Calendario Interventi</span>
        </button>

        <button
          onClick={() => setActiveTab('workers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] transition-colors cursor-pointer ${
            activeTab === 'workers'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Operai & Presenze</span>
          {workedDays.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {workedDays.length}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 2: OPERAI & GIORNATE LAVORO HUB */}
      {activeTab === 'workers' ? (
        <SquadWorkersRegistry />
      ) : (
        /* VIEW 1: CALENDAR PLANNING (Optimized for Mobile with 3px gaps) */
        <div className="space-y-[3px]">
          
          {/* Top Controls Box: Clean, Non-chaotic on both Mobile and Desktop */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] sm:p-2 shadow-xs space-y-[3px]">
            
            {/* ROW 1 (Mobile & Desktop): Search + New Job */}
            <div className="flex items-center gap-[3px]">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca cantiere..."
                  className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[5px] text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
                />
              </div>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setNewJobDate(todayStr);
                    setIsCreatingNew(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-[5px] shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuovo</span>
                </button>
              )}
            </div>

            {/* ROW 2: Filters side by side (Operai & Stati, both 50% on mobile, compact on desktop) */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-[3px]">
              <select
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[5px] px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-emerald-600"
              >
                <option value="all">Tutti gli Operai</option>
                {currentUser && (
                  <option value={currentUser.uid}>
                    Io ({currentUser.displayName || 'Titolare'})
                  </option>
                )}
                {users
                  .filter((u) => u.uid !== currentUser?.uid && u.active !== false)
                  .map((w) => (
                    <option key={w.uid} value={w.uid}>
                      {w.displayName} {w.role === 'admin' ? '(Admin)' : '(Operaio)'}
                    </option>
                  ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[5px] px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-emerald-600"
              >
                <option value="all">Tutti gli stati</option>
                <option value="scheduled">Programmati</option>
                <option value="in_progress">In corso</option>
                <option value="completed">Completati</option>
              </select>
            </div>

            {/* ROW 3: Period Navigation (< Oggi > + Month Title + Dropdown) */}
            <div className="flex items-center justify-between gap-[3px] pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-[3px]">
                <button
                  onClick={handlePrev}
                  className="p-1 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-[5px] border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center text-xs font-bold active:scale-95 shadow-2xs"
                  title="Periodo precedente (Freccia Sinistra)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-[5px] border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title="Torna ad Oggi"
                >
                  Oggi
                </button>

                <button
                  onClick={handleNext}
                  className="p-1 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-[5px] border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center text-xs font-bold active:scale-95 shadow-2xs"
                  title="Periodo successivo (Freccia Destra)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Month Title with Quick Month Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-[5px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-bold capitalize transition-colors cursor-pointer"
                  title="Clicca per scegliere rapidamente il mese o anno"
                >
                  <span className="truncate max-w-[130px] sm:max-w-none">{getHeaderTitle()}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {showMonthPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowMonthPicker(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] shadow-2xl w-60 space-y-[3px] animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-800 px-1">
                        <button
                          onClick={() => {
                            const n = new Date(currentDate);
                            n.setFullYear(n.getFullYear() - 1);
                            setCurrentDate(n);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span>{currentDate.getFullYear()}</span>
                        <button
                          onClick={() => {
                            const n = new Date(currentDate);
                            n.setFullYear(n.getFullYear() + 1);
                            setCurrentDate(n);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-[3px]">
                        {ITALIAN_MONTHS.map((mName, mIdx) => {
                          const isSelected = currentDate.getMonth() === mIdx;
                          return (
                            <button
                              key={mName}
                              onClick={() => {
                                const n = new Date(currentDate);
                                n.setMonth(mIdx);
                                setCurrentDate(n);
                                setShowMonthPicker(false);
                              }}
                              className={`p-1.5 text-[11px] font-bold rounded-[5px] transition-colors ${
                                isSelected
                                  ? 'bg-emerald-700 text-white'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {mName.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Active Jobs Counter (Desktop) */}
              <div className="hidden sm:block text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {calendarMode === 'month' ? monthStats.total : calendarMode === 'year' ? yearStats.total : filteredJobs.length}
                </strong>
                <span className="ml-1">interventi</span>
              </div>
            </div>

            {/* ROW 4: Segmented View Switcher (Full Width on mobile, tidy tabs with gap a 3px) */}
            <div className="grid grid-cols-4 gap-[3px] bg-slate-100 dark:bg-slate-800 p-[3px] rounded-[6px] border border-slate-200/80 dark:border-slate-700">
              <button
                onClick={() => setCalendarMode('week')}
                className={`py-1 rounded-[4px] text-center text-xs font-bold transition-all cursor-pointer ${
                  calendarMode === 'week'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Settimana
              </button>
              <button
                onClick={() => setCalendarMode('month')}
                className={`py-1 rounded-[4px] text-center text-xs font-bold transition-all cursor-pointer ${
                  calendarMode === 'month'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Mese
              </button>
              <button
                onClick={() => setCalendarMode('year')}
                className={`py-1 rounded-[4px] text-center text-xs font-bold transition-all cursor-pointer ${
                  calendarMode === 'year'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Anno
              </button>
              <button
                onClick={() => setCalendarMode('day')}
                className={`py-1 rounded-[4px] text-center text-xs font-bold transition-all cursor-pointer ${
                  calendarMode === 'day'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Giorno
              </button>
            </div>
          </div>

          {/* Swipeable Container for Views with gap a 3px */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="space-y-[3px]"
          >
            {/* ============================================================ */}
            {/* MODE 1: SETTIMANA (7-Day Grid with gap-[3px])                */}
            {/* ============================================================ */}
            {calendarMode === 'week' && (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-[3px]">
                {weekDates.map((dayDate) => {
                  const dateISO = formatLocalDate(dayDate);
                  const isToday = dateISO === todayStr;
                  const dayJobs = filteredJobs.filter((job) => isJobScheduledOnDate(job, dateISO));

                  const isSelected = selectedDateISO === dateISO;

                  return (
                    <div
                      key={dateISO}
                      onClick={() => setSelectedDateISO(dateISO)}
                      className={`border rounded-[7px] p-[3px] sm:p-2 flex flex-col justify-between min-h-[260px] shadow-xs space-y-[3px] transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/50 ring-2 ring-emerald-500/30'
                          : isToday
                          ? 'border-emerald-500 bg-white dark:bg-slate-900 ring-1 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-[3px]">
                        {/* Day Header */}
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {dayDate.toLocaleDateString('it-IT', { weekday: 'short' })}
                            </div>
                            <div
                              className={`text-sm sm:text-base font-bold font-mono ${
                                isToday ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {dayDate.getDate()}
                            </div>
                          </div>

                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={() => {
                                setNewJobDate(dateISO);
                                setIsCreatingNew(true);
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Pianifica intervento per questa data"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Day Jobs List with Long-Press Delete Support */}
                        <div className="space-y-[3px]">
                          {dayJobs.map((job) => {
                            const badge = getStatusBadge(job.status);
                            const isDeleteActive = activeDeleteJobId === job.id;
                            const pressProps = createLongPressCardProps(job);

                            return (
                              <div
                                key={job.id}
                                {...pressProps}
                                className={`p-1.5 rounded-[5px] border text-xs cursor-pointer transition-all space-y-[3px] select-none relative ${
                                  isDeleteActive
                                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/60 ring-2 ring-rose-500/30 shadow-md'
                                    : `${badge.bg} hover:shadow-xs`
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="font-bold truncate">{job.timeSlot || 'Fascia non def.'}</span>
                                  
                                  {isDeleteActive ? (
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => setJobToDeleteConfirm(job)}
                                        className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[9px] shadow-2xs"
                                        title="Elimina"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Elimina</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setActiveDeleteJobId(null)}
                                        className="p-0.5 text-slate-400 hover:text-slate-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] uppercase font-bold px-1 rounded bg-white/80 dark:bg-slate-900/80">
                                      {badge.label}
                                    </span>
                                  )}
                                </div>

                                <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {job.clientName}
                                </div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                                  {job.title}
                                </div>

                                <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1 font-medium truncate">
                                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                                    {(job.assignedWorkerName || 'Non ass.').split(' ')[0]}
                                  </span>
                                  {isDeleteActive && (
                                    <span className="text-[9px] text-rose-600 font-bold">Tocca Elimina</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {dayJobs.length === 0 && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-6">
                              Nessun cantiere
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ============================================================ */}
            {/* MODE 2: MESE (Full Monthly Grid with gap-[3px])              */}
            {/* ============================================================ */}
            {calendarMode === 'month' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] sm:p-2 shadow-xs space-y-[3px]">

                {/* Weekday Names Header (Mon to Sun with gap-[3px]) */}
                <div className="grid grid-cols-7 gap-[3px] text-center font-bold text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mer</span>
                  <span>Gio</span>
                  <span>Ven</span>
                  <span>Sab</span>
                  <span>Dom</span>
                </div>

                {/* 7-Column Days Matrix: gap-[3px] everywhere */}
                <div className="grid grid-cols-7 gap-[3px]">
                  {monthMatrix.map((cell) => {
                    const dayJobs = filteredJobs.filter((job) => isJobScheduledOnDate(job, cell.dateISO));
                    const isSelected = selectedDateISO === cell.dateISO;

                    return (
                      <div
                        key={cell.dateISO}
                        onClick={() => setSelectedDateISO(cell.dateISO)}
                        className={`min-h-[85px] sm:min-h-[110px] p-1 rounded-[5px] border flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                            : cell.isToday
                            ? 'border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 font-bold'
                            : cell.isCurrentMonth
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-100 dark:border-slate-900 opacity-60'
                        }`}
                      >
                        {/* Top Row: Day Number (plain text without circle background) + Add button */}
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-xs sm:text-sm font-mono font-bold ${
                              isSelected
                                ? 'text-emerald-900 dark:text-emerald-200 font-extrabold'
                                : cell.isToday
                                ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                                : cell.isCurrentMonth
                                ? 'text-slate-800 dark:text-slate-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {cell.date.getDate()}
                          </span>

                          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            {currentUser?.role === 'admin' && (
                              <button
                                onClick={() => {
                                  setNewJobDate(cell.dateISO);
                                  setIsCreatingNew(true);
                                }}
                                className="p-0.5 text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded transition-colors"
                                title="Pianifica intervento per questo giorno"
                              >
                                <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Job Pills List inside Day with Long-Press Delete (gap a 3px) */}
                        <div className="space-y-[3px] flex-1 overflow-hidden">
                          {dayJobs.slice(0, 3).map((job) => {
                            const badge = getStatusBadge(job.status);
                            const isDeleteActive = activeDeleteJobId === job.id;
                            const pressProps = createLongPressCardProps(job);

                            return (
                              <div
                                key={job.id}
                                {...pressProps}
                                className={`p-0.5 px-1 rounded-[3px] border text-[9px] sm:text-[10px] cursor-pointer truncate flex items-center justify-between gap-0.5 select-none transition-all ${
                                  isDeleteActive
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-rose-400'
                                    : badge.bg
                                }`}
                                title={`${job.clientName} - ${job.title} (${job.timeSlot}) · Tieni premuto per eliminare`}
                              >
                                <div className="flex items-center truncate min-w-0">
                                  <span className="font-semibold truncate">{job.clientName}</span>
                                </div>

                                {isDeleteActive && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setJobToDeleteConfirm(job);
                                    }}
                                    className="p-0.5 text-rose-700 hover:text-rose-900 bg-white/80 rounded"
                                    title="Elimina"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {dayJobs.length > 3 && (
                            <button
                              onClick={() => {
                                setCurrentDate(cell.date);
                                setCalendarMode('day');
                              }}
                              className="text-[8px] sm:text-[9px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline block text-center w-full"
                            >
                              +{dayJobs.length - 3} altri
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Day's Interventions Section (below Month Calendar) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] shadow-xs space-y-[3px] mt-[3px]">
                  <div className="flex items-center justify-between px-1.5 pt-1 pb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize truncate">
                        Interventi di {selectedDateObj.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {selectedDayJobs.length}
                      </span>
                    </div>

                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setNewJobDate(selectedDateISO);
                          setIsCreatingNew(true);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-[5px] transition-colors cursor-pointer shadow-2xs shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Aggiungi</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-[3px]">
                    {selectedDayJobs.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 space-y-2">
                        <p>Nessun intervento programmato per questa data.</p>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => {
                              setNewJobDate(selectedDateISO);
                              setIsCreatingNew(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[5px] text-xs font-bold cursor-pointer"
                          >
                            Pianifica lavoro
                          </button>
                        )}
                      </div>
                    ) : (
                      selectedDayJobs.map((job) => {
                        const badge = getStatusBadge(job.status);
                        const isDeleteActive = activeDeleteJobId === job.id;
                        const pressProps = createLongPressCardProps(job);

                        return (
                          <div
                            key={job.id}
                            {...pressProps}
                            onClick={() => setSelectedJobForEdit(job)}
                            className={`p-2 sm:p-2.5 rounded-[5px] border flex items-center justify-between gap-2 cursor-pointer transition-all select-none relative ${
                              isDeleteActive
                                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 ring-2 ring-rose-500/30'
                                : `${badge.bg} hover:shadow-xs`
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[11px] font-bold shrink-0 px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60">
                                {job.timeSlot || 'Fascia non def.'}
                              </span>

                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                  {job.clientName}
                                </div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                                  {job.title}
                                  {job.assignedWorkerName && (
                                    <span className="opacity-80"> · {job.assignedWorkerName}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {isDeleteActive ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setJobToDeleteConfirm(job)}
                                    className="flex items-center gap-1 px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Elimina</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveDeleteJobId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900/80">
                                  {badge.label}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* MODE 3: ANNO (Annual 12-Month Matrix with gap-[3px])         */}
            {/* ============================================================ */}
            {calendarMode === 'year' && (
              <div className="space-y-[3px]">
                {/* Year Summary KPI Banner: gap a 3px */}
                <div className="grid grid-cols-4 gap-[3px]">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] sm:p-2 shadow-xs text-center space-y-0.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase block truncate">Totale Anno</span>
                    <span className="text-lg sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                      {yearStats.total}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] sm:p-2 shadow-xs text-center space-y-0.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase block truncate">Programmati</span>
                    <span className="text-lg sm:text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
                      {yearStats.scheduled}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] sm:p-2 shadow-xs text-center space-y-0.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-sky-600 uppercase block truncate">In Corso</span>
                    <span className="text-lg sm:text-2xl font-bold font-mono text-sky-700 dark:text-sky-400">
                      {yearStats.inProgress}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] sm:p-2 shadow-xs text-center space-y-0.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase block truncate">Completati</span>
                    <span className="text-lg sm:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                      {yearStats.completed}
                    </span>
                  </div>
                </div>

                {/* 12-Months Mini-Grids: gap a 3px */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[3px]">
                  {Array.from({ length: 12 }, (_, monthIndex) => {
                    const monthDate = new Date(currentYear, monthIndex, 1);
                    const monthName = monthDate.toLocaleDateString('it-IT', { month: 'long' });
                    const mJobs = filteredJobs.filter((j) => isJobInMonth(j, currentYear, monthIndex));

                    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
                    const firstDayOfWeek = (new Date(currentYear, monthIndex, 1).getDay() + 6) % 7;

                    return (
                      <div
                        key={monthIndex}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-2 shadow-xs space-y-[3px] flex flex-col justify-between hover:border-emerald-500/60 transition-colors"
                      >
                        {/* Month Card Header */}
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => {
                              setCurrentDate(new Date(currentYear, monthIndex, 1));
                              setCalendarMode('month');
                            }}
                            className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{monthName}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>

                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                              mJobs.length > 0
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {mJobs.length}
                          </span>
                        </div>

                        {/* Mini Weekday Headers */}
                        <div className="grid grid-cols-7 gap-[3px] text-center text-[9px] font-bold text-slate-400">
                          <span>L</span>
                          <span>M</span>
                          <span>M</span>
                          <span>G</span>
                          <span>V</span>
                          <span>S</span>
                          <span>D</span>
                        </div>

                        {/* Mini Day Dots Grid */}
                        <div className="grid grid-cols-7 gap-[3px] text-center">
                          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-5" />
                          ))}

                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const dayNum = i + 1;
                            const dISO = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(
                              dayNum
                            ).padStart(2, '0')}`;
                            const isCurrentDay = dISO === todayStr;
                            const jobsOnDay = filteredJobs.filter((j) => isJobScheduledOnDate(j, dISO));

                            const dayStatus = jobsOnDay.length > 0 ? getDayStatusStyle(jobsOnDay) : null;

                            return (
                              <button
                                key={dayNum}
                                onClick={() => {
                                  setSelectedDateISO(dISO);
                                  setCurrentDate(new Date(currentYear, monthIndex, dayNum));
                                  setCalendarMode('month');
                                }}
                                className={`h-5 w-5 mx-auto rounded-full text-[10px] font-mono flex items-center justify-center transition-all cursor-pointer relative ${
                                  isCurrentDay
                                    ? 'bg-emerald-700 text-white font-bold ring-1 ring-emerald-500'
                                    : dayStatus
                                    ? dayStatus.bg
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title={`${dayNum} ${monthName}: ${jobsOnDay.length} interventi${dayStatus ? ` (${dayStatus.label})` : ''}`}
                              >
                                <span>{dayNum}</span>
                                {dayStatus && !isCurrentDay && (
                                  <span className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${dayStatus.dot}`} />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Quick Month Actions */}
                        <button
                          onClick={() => {
                            setCurrentDate(new Date(currentYear, monthIndex, 1));
                            setCalendarMode('month');
                          }}
                          className="w-full text-center text-[10px] font-semibold text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-800"
                        >
                          Apri mese completo
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Complete Annual Interventions Directory with Long-Press Delete Support (gap a 3px) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] sm:p-2 shadow-xs space-y-[3px]">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Tutti gli Interventi del {currentYear} ({yearJobs.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tieni premuto per eliminare · Clicca per modificare
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-[3px]">
                    {yearJobs.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">
                        Nessun intervento programmato per l'anno {currentYear}.
                      </div>
                    ) : (
                      yearJobs.map((job) => {
                        const badge = getStatusBadge(job.status);
                        const isDeleteActive = activeDeleteJobId === job.id;
                        const pressProps = createLongPressCardProps(job);

                        const displayDate = new Date(job.date).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'short',
                          weekday: 'short',
                        });

                        return (
                          <div
                            key={job.id}
                            {...pressProps}
                            className={`p-1.5 sm:p-2 rounded-[5px] border flex items-center justify-between gap-[3px] cursor-pointer transition-all select-none relative ${
                              isDeleteActive
                                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 ring-2 ring-rose-500/30 shadow-md'
                                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 bg-white dark:bg-slate-900/60 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="text-center shrink-0 w-14 py-0.5 px-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[9px] sm:text-[10px] text-slate-700 dark:text-slate-300 font-bold">
                                {displayDate}
                              </div>

                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                  {job.clientName}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {job.title} · <span className="font-mono">{job.timeSlot}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right Actions: Delete button if active, or worker and status badge */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isDeleteActive ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setJobToDeleteConfirm(job)}
                                    className="flex items-center gap-1 px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-[5px] text-xs font-bold shadow-xs transition-colors cursor-pointer animate-in fade-in"
                                    title="Elimina questo intervento"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Elimina</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveDeleteJobId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                                    title="Annulla"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hidden sm:inline">
                                    {job.assignedWorkerName}
                                  </span>
                                  <span
                                    className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${badge.bg}`}
                                  >
                                    {badge.label}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* MODE 4: GIORNO (Focused Day View with gap-[3px])             */}
            {/* ============================================================ */}
            {calendarMode === 'day' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] sm:p-2 shadow-xs space-y-[3px]">
                {/* Day Header Info */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 capitalize">
                      {currentDate.toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tieni premuto su un lavoro per eliminarlo · Clicca per modificare
                    </p>
                  </div>

                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setNewJobDate(formatLocalDate(currentDate));
                        setIsCreatingNew(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-[5px] shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuovo</span>
                    </button>
                  )}
                </div>

                {/* Day's jobs list with long-press delete */}
                {(() => {
                  const targetDayISO = formatLocalDate(currentDate);
                  const dayJobs = filteredJobs.filter((job) => isJobScheduledOnDate(job, targetDayISO));

                  if (dayJobs.length === 0) {
                    return (
                      <div className="text-center py-10 text-slate-400 dark:text-slate-500 space-y-1">
                        <Clock className="w-7 h-7 mx-auto opacity-40 text-slate-400" />
                        <p className="text-xs font-semibold">Nessun cantiere programmato per questa data</p>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => {
                              setNewJobDate(targetDayISO);
                              setIsCreatingNew(true);
                            }}
                            className="px-3 py-1 bg-emerald-700 text-white rounded-[5px] text-xs font-bold cursor-pointer"
                          >
                            Aggiungi Intervento
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-[3px]">
                      {dayJobs.map((job) => {
                        const badge = getStatusBadge(job.status);
                        const isDeleteActive = activeDeleteJobId === job.id;
                        const pressProps = createLongPressCardProps(job);

                        return (
                          <div
                            key={job.id}
                            {...pressProps}
                            className={`p-2.5 rounded-[5px] border transition-all cursor-pointer shadow-2xs space-y-1.5 select-none relative ${
                              isDeleteActive
                                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 ring-2 ring-rose-500/30'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-emerald-500'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                    {job.timeSlot || 'Fascia non definita'}
                                  </span>
                                  <span
                                    className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${badge.bg}`}
                                  >
                                    {badge.label}
                                  </span>
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                                  {job.clientName}
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{job.title}</p>
                              </div>

                              <div className="text-right">
                                {isDeleteActive ? (
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => setJobToDeleteConfirm(job)}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-[5px] text-xs font-bold shadow-xs cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Elimina</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveDeleteJobId(null)}
                                      className="p-1 text-slate-400 hover:text-slate-600"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  job.price && (
                                    <>
                                      <span className="text-[10px] text-slate-400 block">Tariffa</span>
                                      <span className="text-xs sm:text-sm font-bold font-mono text-emerald-800 dark:text-emerald-400">
                                        € {Number(job.price).toFixed(2)}
                                      </span>
                                    </>
                                  )
                                )}
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1 truncate text-[11px]">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                {job.clientAddress}
                              </span>
                              <span className="flex items-center gap-1 font-semibold shrink-0 text-[11px]">
                                <User className="w-3 h-3 text-slate-400" />
                                {job.assignedWorkerName}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Job Deletion (triggered by long-press) */}
      {jobToDeleteConfirm && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-3 max-w-sm w-full space-y-2.5 shadow-2xl animate-in fade-in zoom-in-95 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <div className="p-1.5 bg-rose-100 dark:bg-rose-950/60 rounded-full shrink-0">
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Elimina Intervento</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Questa operazione non può essere annullata</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-[5px] text-xs space-y-0.5 border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-slate-100">{jobToDeleteConfirm.clientName}</div>
              <div className="text-slate-600 dark:text-slate-300">{jobToDeleteConfirm.title}</div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Data: {jobToDeleteConfirm.date} · {jobToDeleteConfirm.timeSlot}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Assegnato a: {jobToDeleteConfirm.assignedWorkerName}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setJobToDeleteConfirm(null);
                  setActiveDeleteJobId(null);
                }}
                className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[5px] transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteJob(jobToDeleteConfirm.id);
                  setJobToDeleteConfirm(null);
                  setActiveDeleteJobId(null);
                }}
                className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-[5px] shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Elimina Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
