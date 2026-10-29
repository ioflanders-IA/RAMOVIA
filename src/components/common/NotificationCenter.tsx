import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  FileCheck2,
  Wrench,
  UserPlus,
  CloudRain,
  X,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isJobTimeExpired } from '../../utils/jobTimeUtils';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'report' | 'maintenance' | 'weather' | 'worker' | 'job_expired';
  read: boolean;
  targetTab?: 'dashboard' | 'calendar' | 'clients' | 'inventory' | 'reports';
  jobId?: string;
}

interface NotificationCenterProps {
  onNavigateTab?: (tab: 'dashboard' | 'calendar' | 'clients' | 'inventory' | 'reports') => void;
  placement?: 'bottom-right' | 'sidebar-up';
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigateTab, placement = 'bottom-right' }) => {
  const { jobs, inventory, reports, users, currentUser, updateJob } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Dynamically generate operational notifications from real app state
  const generatedNotifications: AppNotification[] = [];

  // 1. Expired scheduled jobs requiring completion confirmation
  const expiredJobs = jobs.filter((j) => isJobTimeExpired(j));
  expiredJobs.forEach((job) => {
    const notifId = `notif_expired_job_${job.id}`;
    generatedNotifications.push({
      id: notifId,
      title: job.clientName,
      message: `${job.title} (${job.timeSlot})`,
      timestamp: 'Terminato',
      type: 'job_expired',
      read: readIds.includes(notifId),
      targetTab: 'dashboard',
      jobId: job.id,
    });
  });

  // 2. Pending workers needing approval
  const pendingWorkers = users.filter((u) => u.role === 'worker' && u.linkedToAdmin === false);
  if (currentUser?.role === 'admin' && pendingWorkers.length > 0) {
    generatedNotifications.push({
      id: 'notif_pending_workers',
      title: 'Operai in Attesa di Collegamento',
      message: `${pendingWorkers.length} operaio/i registrati in attesa del codice di sblocco squadra.`,
      timestamp: 'Adesso',
      type: 'worker',
      read: readIds.includes('notif_pending_workers'),
      targetTab: 'calendar',
    });
  }

  // 3. Unapproved submitted reports
  const pendingReports = reports.filter((r) => r.status === 'submitted');
  if (pendingReports.length > 0) {
    generatedNotifications.push({
      id: 'notif_pending_reports',
      title: 'Rapportini da Validare',
      message: `${pendingReports.length} rapportino/i inviato/i dagli operai in attesa di firma/approvazione.`,
      timestamp: 'Oggi',
      type: 'report',
      read: readIds.includes('notif_pending_reports'),
      targetTab: 'reports',
    });
  }

  // 4. Equipment maintenance alerts
  const maintenanceNeeded = inventory.filter(
    (i) => i.category === 'equipment' && i.currentUsageHours >= i.maintenanceIntervalHours - 5 && i.maintenanceIntervalHours > 0
  );
  if (maintenanceNeeded.length > 0) {
    generatedNotifications.push({
      id: 'notif_maintenance',
      title: 'Allerta Manutenzione Macchinari',
      message: `${maintenanceNeeded.map((m) => m.name).join(', ')} ha raggiunto le ore limite di lavoro.`,
      timestamp: 'Oggi',
      type: 'maintenance',
      read: readIds.includes('notif_maintenance'),
      targetTab: 'inventory',
    });
  }

  // Filter out dismissed ones
  const activeNotifications = generatedNotifications.filter((n) => !dismissedIds.includes(n.id));
  const unreadCount = activeNotifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setReadIds(activeNotifications.map((n) => n.id));
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    setReadIds((prev) => (prev.includes(notif.id) ? prev : [...prev, notif.id]));
    if (notif.targetTab && onNavigateTab) {
      onNavigateTab(notif.targetTab);
    }
    setIsOpen(false);
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'job_expired':
        return <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'report':
        return <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'worker':
        return <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'weather':
        return <CloudRain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-[7px] text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[7px] transition-colors cursor-pointer"
        title="Centro Notifiche RAMOVIA"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white font-black text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Smooth Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click to close */}
            <div
              className="fixed inset-0 z-[800]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`${
                placement === 'sidebar-up'
                  ? 'absolute left-0 bottom-full mb-2 w-[calc(100vw-20px)] max-w-sm sm:w-88'
                  : 'fixed left-2 right-2 top-14 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-[380px] max-w-md'
              } z-[900] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 p-[3px] space-y-[3px]`}
            >
              {/* Dropdown Header */}
              <div className="bg-slate-900 text-white dark:bg-slate-950 p-[3px] px-2 rounded-[7px] flex items-center justify-between">
                <div className="flex items-center gap-[3px]">
                  <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold tracking-wide">Notifiche Operative</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-[5px] bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      {unreadCount} nuove
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-[3px]">
                  {activeNotifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-slate-300 hover:text-white font-medium underline transition-colors cursor-pointer"
                    >
                      Segna lette
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-[5px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List with gap-[3px] */}
              <div className="max-h-[75vh] sm:max-h-80 overflow-y-auto space-y-[3px]">
                {activeNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
                    <Check className="w-6 h-6 mx-auto text-emerald-500 opacity-60" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Nessuna nuova notifica</p>
                    <p className="text-[11px]">Tutti i cantieri, rapportini e macchinari sono aggiornati.</p>
                  </div>
                ) : (
                  activeNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-[3px] px-2 rounded-[7px] border transition-all cursor-pointer flex items-center justify-between gap-[3px] relative group ${
                        notif.read
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                          : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                      }`}
                    >
                      {/* Client Name & Full Details (No left icon, full non-truncated text) */}
                      <div className="min-w-0 flex-1 space-y-[2px]">
                        <div className="flex flex-wrap items-baseline gap-[3px]">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-normal break-words leading-tight">
                            {notif.title}
                          </h4>
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                            · {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-normal break-words leading-tight">
                          {notif.message}
                        </p>
                      </div>

                      {/* Right actions: Quick Complete button + Dismiss */}
                      <div className="flex items-center gap-[3px] shrink-0 ml-1">
                        {notif.type === 'job_expired' && notif.jobId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const target = jobs.find((j) => j.id === notif.jobId);
                              if (target) {
                                updateJob({ ...target, status: 'completed' });
                              }
                              setDismissedIds((prev) => [...prev, notif.id]);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-[5px] font-bold text-[10px] transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Segna subito ultimato"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ultimato</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDismiss(notif.id, e)}
                          className="opacity-70 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                          title="Rimuovi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
