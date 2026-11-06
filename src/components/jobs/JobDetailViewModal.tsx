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
  HardHat,
  Fuel,
} from 'lucide-react';
import { formatItalianDate, formatLocalDate } from '../../utils/dateUtils';
import { getClientColor } from '../../utils/clientColors';
import { getEffectiveJobStatusOnDate } from '../calendar/CalendarView';
import { NATURANDO_LOGO_URL } from './JobModal';
import { getJobLaborSummary, getCostCategoryInfo } from '../clients/ClientsView';

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
  const { clients, currentUser, jobs, users } = useApp();

  const todayStr = formatLocalDate(new Date());
  const activeDateISO = selectedDateISO || job.date || todayStr;
  const effectiveStatus = getEffectiveJobStatusOnDate(job, activeDateISO, todayStr);

  const client = clients.find(
    (c) => (job.clientId && c.id === job.clientId) || c.name.toLowerCase() === job.clientName.toLowerCase()
  );
  const clientColor = getClientColor(client || { name: job.clientName });

  const isCompleted = effectiveStatus === 'completed';

  // Costi & Manodopera & Naturando per questo intervento
  const costs = job.costs || [];
  const expensesCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0);
  const laborSummary = getJobLaborSummary(job, jobs || [], users || []);
  const isJobNaturando = !!job.isNaturando;
  const price = job.price || 0;
  const naturandoBase = job.naturandoAmount !== undefined && job.naturandoAmount > 0
    ? job.naturandoAmount
    : price;
  const naturandoPct = job.naturandoPercentage !== undefined && job.naturandoPercentage > 0
    ? job.naturandoPercentage
    : 20;
  const naturandoCost = isJobNaturando ? Math.round(((naturandoBase * naturandoPct) / 100) * 100) / 100 : 0;
  const totalAllCost = expensesCost + laborSummary.totalLaborCost + naturandoCost;
  const margin = price - totalAllCost;
  const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;
  const totalCostCount = costs.length + laborSummary.workers.length + (isJobNaturando ? 1 : 0);

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
        <div className="p-2.5 px-[6px] pb-2 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: clientColor }} />
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
                {job.clientName}
              </h2>
            </div>
            {/* Data su un rigo e orario su un altro */}
            <div className="pl-4.5 mt-1 space-y-0.5">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {formatItalianDate(activeDateISO)}
              </p>
              {job.timeSlot && (
                <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                  {job.timeSlot}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons in Top Right: Solo Chiudi (tasto modifica rimosso in alto) */}
          <div className="flex items-center gap-1.5 shrink-0">
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

        {/* Scrollable Content Body with 6px padding from borders and 6px gap between cards */}
        <div className="p-[6px] space-y-[6px] overflow-y-auto flex-1 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Status & Type Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                    : effectiveStatus === 'in_progress'
                    ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800'
                    : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                {isCompleted ? 'FATTO' : effectiveStatus === 'in_progress' ? 'IN CORSO' : 'IN PROGRAMMA'}
              </span>

              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
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

          {/* Lavorazione / Titolo e Descrizione - gap a 3px dentro la card */}
          <div className="space-y-[3px] p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
              Lavorazione da Svolgere
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {job.title}
            </h3>
            {job.description && (
              job.description.includes('<') && job.description.includes('>') ? (
                <div
                  className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              )
            )}
          </div>

          {/* Squadra / Operai Assegnati - gap a 3px dentro la card */}
          <div className="space-y-[3px] p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Squadra Assegnata</span>
            </span>
            <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
              {job.assignedWorkerName || 'Nessun operaio assegnato'}
            </p>
          </div>

          {/* Dettagli Cliente & Contatti - gap a 3px dentro la card */}
          {(job.clientAddress || job.clientPhone) && (
            <div className="space-y-[3px] p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
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

          {/* Se Periodico: Elenco Date Pianificate con Stato - gap a 3px dentro la card */}
          {Array.isArray(job.plannedDates) && job.plannedDates.length > 1 && (
            <div className="space-y-[3px] p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between pb-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Date Pianificate ({job.plannedDates.length})</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {job.completedDates?.length || 0} completate
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-[6px] pt-0.5">
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
                          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/60'
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

          {/* Tariffa / Accordo Economico - gap a 3px dentro la card */}
          {(job.price !== undefined || job.ratePerSession !== undefined || job.hourlyRate !== undefined) && (
            <div className="space-y-[3px] p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                <Euro className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Accordo Economico</span>
              </span>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-slate-600 dark:text-slate-300 font-medium">
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

          {/* Monitoraggio Costi & Manodopera & Naturando (per Admin) */}
          {currentUser?.role === 'admin' && (
            <div className="space-y-[3px] p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-xs">
              {/* Financial KPI Strip */}
              <div className="grid grid-cols-3 gap-[3px] text-center">
                <div className="bg-white dark:bg-slate-900 p-1 px-1.5 rounded border border-slate-200/70 dark:border-slate-800">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Prezzo
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                    € {price.toFixed(2)}
                  </div>
                </div>

                <div className="bg-rose-50/40 dark:bg-rose-950/20 p-1 px-1.5 rounded border border-rose-100 dark:border-rose-950/60">
                  <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                    <span>Costi</span>
                    <span className="text-[8px] font-semibold opacity-80">
                      ({totalCostCount})
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    -€ {totalAllCost.toFixed(2)}
                  </div>
                </div>

                <div
                  className={`p-1 px-1.5 rounded border ${
                    margin >= 0
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-950/60'
                      : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-100 dark:border-amber-950/60'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider ${
                      margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <span>Margine</span>
                    {price > 0 && (
                      <span className="text-[8px] font-mono font-semibold">
                        {marginPct}%
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-xs font-mono font-bold ${
                      margin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    € {margin.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Manodopera Cantiere */}
              <div className="pt-1 space-y-[3px]">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Manodopera Cantiere</span>
                  </div>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    -€ {laborSummary.totalLaborCost.toFixed(2)}
                  </span>
                </div>

                {laborSummary.workers.length > 0 ? (
                  <div className="space-y-[3px] pt-0.5">
                    {laborSummary.workers.map((w) => (
                      <div
                        key={w.workerId || w.workerName}
                        className="flex items-center justify-between gap-2 text-xs py-0.5"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {w.workerName}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border shrink-0 ${
                              w.dayType === 'mezza giornata'
                                ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {w.dayType === 'mezza giornata' ? 'Mezza giornata' : 'Giornata intera'}
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0 text-right">
                          -€ {w.cost.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic">
                    Nessun operaio assegnato a questo intervento.
                  </div>
                )}
              </div>

              {/* Voci di Spesa Registrate */}
              <div className="pt-1 space-y-[3px]">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span>Voci di Spesa Registrate</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    -€ {expensesCost.toFixed(2)}
                  </span>
                </div>

                {costs.length > 0 ? (
                  <div className="space-y-[3px] pt-0.5">
                    {costs.map((c) => {
                      const catInfo = getCostCategoryInfo(c.category);
                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-2 text-xs py-0.5"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border shrink-0 ${catInfo.badgeClass}`}>
                              {catInfo.label}
                            </span>
                            <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                              {c.name}
                            </span>
                          </div>
                          <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0 text-right">
                            -€ {c.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic pt-0.5">
                    Nessuna spesa extra registrata.
                  </div>
                )}
              </div>

              {/* Quota Spettante a Naturando */}
              {isJobNaturando && (
                <div className="pt-1 space-y-[3px]">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={NATURANDO_LOGO_URL}
                        alt="Naturando"
                        className="h-3 max-w-[50px] object-contain rounded"
                      />
                      <span>Quota Dovuta a Naturando</span>
                    </div>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      -€ {naturandoCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs py-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border shrink-0 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                        Naturando {naturandoPct}%
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                        Importo: € {(job.naturandoAmount !== undefined && job.naturandoAmount > 0 ? job.naturandoAmount : price).toFixed(2)}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0 text-right">
                      -€ {naturandoCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Note Intervento - gap a 3px dentro la card */}
          {job.notes && (
            <div className="space-y-[3px] p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Note</span>
              </span>
              {job.notes.includes('<') && job.notes.includes('>') ? (
                <div
                  className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: job.notes }}
                />
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {job.notes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-2.5 px-[6px] bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
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
