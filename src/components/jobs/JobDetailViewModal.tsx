import React from 'react';
import { Job } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Edit2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Users,
  Euro,
  Tag,
  Wrench,
  Package,
  FileText,
  CheckCircle2,
  AlertCircle,
  Repeat,
} from 'lucide-react';
import { formatItalianDate, formatLocalDate } from '../../utils/dateUtils';
import { getClientColor } from '../../utils/clientColors';
import { getEffectiveJobStatusOnDate } from '../calendar/CalendarView';
import { NATURANDO_LOGO_URL } from './JobModal';

interface JobDetailViewModalProps {
  job: Job;
  selectedDateISO?: string;
  onClose: () => void;
  onEdit: () => void;
}

export const JobDetailViewModal: React.FC<JobDetailViewModalProps> = ({
  job,
  selectedDateISO,
  onClose,
  onEdit,
}) => {
  const { clients, currentUser } = useApp();

  const todayStr = formatLocalDate(new Date());
  const activeDateISO = selectedDateISO || job.date || todayStr;
  const effectiveStatus = getEffectiveJobStatusOnDate(job, activeDateISO, todayStr);

  const client = clients.find(
    (c) => (job.clientId && c.id === job.clientId) || c.name.toLowerCase() === job.clientName.toLowerCase()
  );
  const clientColor = getClientColor(client || { name: job.clientName });

  const isCompleted = effectiveStatus === 'completed';

  const formatShortDateItalian = (dStr: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length < 3) return dStr;
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Strip with Client Color */}
        <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: clientColor }} />

        {/* Modal Header */}
        <div className="p-3.5 pb-2.5 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: clientColor }} />
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
                {job.clientName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pl-4.5 mt-0.5 truncate">
              {formatItalianDate(activeDateISO)} {job.timeSlot && `· ${job.timeSlot}`}
            </p>
          </div>

          {/* Action Buttons in Top Right: Edit and Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                title="Modifica intervento"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Modifica</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Status & Type Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : effectiveStatus === 'in_progress'
                    ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800'
                    : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                {isCompleted ? 'FATTO' : effectiveStatus === 'in_progress' ? 'IN CORSO' : 'IN PROGRAMMA'}
              </span>

              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {job.interventionType === 'generale' ? (
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                    <Repeat className="w-3 h-3" />
                    <span>Periodico ({job.plannedDates?.length || job.sessionsCount || 1} uscite)</span>
                  </span>
                ) : (
                  'Intervento Singolo'
                )}
              </span>
            </div>

            {job.isNaturando && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 rounded border border-emerald-200 dark:border-emerald-800">
                <img src={NATURANDO_LOGO_URL} alt="Naturando" className="h-3.5 max-w-[45px] object-contain" />
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  {job.naturandoPercentage || 20}%
                </span>
              </div>
            )}
          </div>

          {/* Lavorazione / Titolo e Descrizione */}
          <div className="space-y-1 p-2.5 bg-slate-50/70 dark:bg-slate-850 rounded-lg border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Lavorazione da Svolgere
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {job.title}
            </h3>
            {job.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            )}
          </div>

          {/* Squadra / Operai Assegnati */}
          <div className="p-2.5 bg-slate-50/70 dark:bg-slate-850 rounded-lg border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Squadra Assegnata</span>
            </span>
            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
              {job.assignedWorkerName || 'Nessun operaio assegnato'}
            </p>
          </div>

          {/* Dettagli Cliente & Contatti */}
          {(job.clientAddress || job.clientPhone) && (
            <div className="p-2.5 bg-slate-50/70 dark:bg-slate-850 rounded-lg border border-slate-200/70 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Recapito Cantiere
              </span>
              {job.clientAddress && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.clientAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{job.clientAddress}</span>
                </a>
              )}
              {job.clientPhone && (
                <a
                  href={`tel:${job.clientPhone}`}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{job.clientPhone}</span>
                </a>
              )}
            </div>
          )}

          {/* Se Periodico: Elenco Date Pianificate con Stato */}
          {Array.isArray(job.plannedDates) && job.plannedDates.length > 1 && (
            <div className="p-2.5 bg-slate-50/70 dark:bg-slate-850 rounded-lg border border-slate-200/70 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Date Pianificate ({job.plannedDates.length})</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {job.completedDates?.length || 0} completate
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                {job.plannedDates.map((dStr, idx) => {
                  const dateEffStatus = getEffectiveJobStatusOnDate(job, dStr, todayStr);
                  const isDateDone = dateEffStatus === 'completed';
                  const isCurrent = dStr === activeDateISO;

                  return (
                    <div
                      key={dStr}
                      className={`p-1.5 rounded-md border flex items-center justify-between gap-1 text-[11px] font-mono ${
                        isCurrent
                          ? 'ring-1 ring-emerald-500 font-bold bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className={isDateDone ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        #{idx + 1} {formatShortDateItalian(dStr)}
                      </span>
                      {isDateDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tariffa / Accordo Economico */}
          {(job.price !== undefined || job.ratePerSession !== undefined || job.hourlyRate !== undefined) && (
            <div className="p-2.5 bg-slate-50/70 dark:bg-slate-850 rounded-lg border border-slate-200/70 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Euro className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Accordo Economico</span>
              </span>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {job.pricingMode === 'per_session'
                    ? `€ ${job.ratePerSession || 0} / uscita`
                    : job.pricingMode === 'hourly'
                    ? `€ ${job.hourlyRate || 0} / ora (${job.estimatedHoursPerSession || 0}h stimate)`
                    : 'A corpo (Prezzo Fisso)'}
                </span>
                <span className="font-mono font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                  € {job.price?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          )}

          {/* Note Intervento */}
          {job.notes && (
            <div className="p-2.5 bg-slate-50/70 dark:bg-slate-850 rounded-lg border border-slate-200/70 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Note</span>
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {job.notes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Chiudi
          </button>
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={onEdit}
              className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Modifica Intervento</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
