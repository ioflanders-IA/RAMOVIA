import React, { useState } from 'react';
import { Job, PaymentInstallment, PaymentMethod, JobPaymentStatus, JobCostItem, JobCostCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import { JobCostManagerModal } from './JobCostManagerModal';
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
  Wallet,
  Trash2,
  Check,
  Plus,
} from 'lucide-react';
import { formatItalianDate, formatLocalDate } from '../../utils/dateUtils';
import { getClientColor } from '../../utils/clientColors';
import { getEffectiveJobStatusOnDate } from '../calendar/CalendarView';
import { NATURANDO_LOGO_URL } from './JobModal';
import { getJobLaborSummary, getCostCategoryInfo } from '../clients/ClientsView';
import { ManualMaintenanceModal } from '../inventory/ManualMaintenanceModal';

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
  const { clients, currentUser, jobs, users, inventory, updateJob } = useApp();
  const currentJob = jobs.find((j) => j.id === job.id) || job;
  const [showCostManager, setShowCostManager] = useState(false);
  const [maintenanceEquipItem, setMaintenanceEquipItem] = useState<{ id: string; name: string } | null>(null);
  const [showAddIncassoModal, setShowAddIncassoModal] = useState(false);
  const [incassoAmount, setIncassoAmount] = useState<number | ''>('');
  const [incassoDate, setIncassoDate] = useState<string>('');
  const [incassoMethod, setIncassoMethod] = useState<PaymentMethod>('bonifico');
  const [incassoNotes, setIncassoNotes] = useState<string>('');
  const [isSavingIncasso, setIsSavingIncasso] = useState<boolean>(false);

  const todayStr = formatLocalDate(new Date());
  const activeDateISO = selectedDateISO || currentJob.date || todayStr;
  const effectiveStatus = getEffectiveJobStatusOnDate(currentJob, activeDateISO, todayStr);

  const client = clients.find(
    (c) => (currentJob.clientId && c.id === currentJob.clientId) || c.name.toLowerCase() === currentJob.clientName.toLowerCase()
  );
  const clientColor = getClientColor(client || { name: currentJob.clientName });

  const isCompleted = effectiveStatus === 'completed';

  // Costi & Manodopera & Naturando per questo intervento
  const rawCosts = currentJob.costs || [];
  const linkedMaintenances = (inventory || []).flatMap((item) =>
    (item.maintenanceHistory || [])
      .filter((m) => {
        if (m.jobId && m.jobId === currentJob.id) return true;
        if (
          currentJob.date &&
          m.date === currentJob.date &&
          (currentJob.equipmentRequired || []).some(
            (eq) =>
              eq.itemId === item.id ||
              (eq.name && item.name && eq.name.trim().toLowerCase() === item.name.trim().toLowerCase())
          )
        ) {
          return true;
        }
        return false;
      })
      .map((m) => ({
        ...m,
        toolName: item.name || m.itemName || 'Attrezzatura',
      }))
  );

  const extraMaintenanceCosts: JobCostItem[] = linkedMaintenances
    .filter((m) => {
      if (!m.cost || m.cost <= 0) return false;
      const alreadyInCosts = rawCosts.some(
        (c) =>
          c.id === m.id ||
          (Number(c.amount) === Number(m.cost) &&
            (c.name.toLowerCase().includes(m.description.toLowerCase()) ||
              c.name.toLowerCase().includes(m.toolName.toLowerCase())))
      );
      return !alreadyInCosts;
    })
    .map((m) => ({
      id: m.id,
      name: `Manutenzione ${m.toolName}: ${m.description}`,
      category: 'manutenzione' as JobCostCategory,
      amount: m.cost || 0,
      date: m.date,
      notes: m.notes,
    }));

  const combinedCosts: JobCostItem[] = [...rawCosts, ...extraMaintenanceCosts];
  const expensesCost = combinedCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
  const laborSummary = getJobLaborSummary(currentJob, jobs || [], users || [], activeDateISO);
  const isJobNaturando = !!currentJob.isNaturando;
  const price = currentJob.price || 0;
  const naturandoBase = currentJob.naturandoAmount !== undefined && currentJob.naturandoAmount > 0
    ? currentJob.naturandoAmount
    : price;
  const naturandoPct = currentJob.naturandoPercentage !== undefined && currentJob.naturandoPercentage > 0
    ? currentJob.naturandoPercentage
    : 20;
  const naturandoCost = isJobNaturando ? Math.round(((naturandoBase * naturandoPct) / 100) * 100) / 100 : 0;
  const totalAllCost = expensesCost + laborSummary.totalLaborCost + naturandoCost;
  const margin = price - totalAllCost;
  const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;
  const totalCostCount = combinedCosts.length + laborSummary.workers.length + (isJobNaturando ? 1 : 0);

  // Incassi & Acconti
  const installments = currentJob.installments || [];
  const totalPaid = installments.reduce((sum, it) => sum + (it.amount || 0), 0);
  const remainingDue = Math.max(0, price - totalPaid);

  const handleSaveIncasso = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(incassoAmount);
    if (!amt || amt <= 0) return;

    setIsSavingIncasso(true);
    try {
      const currentInst = currentJob.installments || [];
      const newInst: PaymentInstallment = {
        id: `inst_${Date.now()}`,
        amount: amt,
        date: incassoDate || todayStr,
        paymentMethod: incassoMethod,
        notes: incassoNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const updatedInst = [...currentInst, newInst];
      const newPaid = updatedInst.reduce((s, it) => s + (it.amount || 0), 0);
      const jobPrice = currentJob.price || 0;
      const newStatus: JobPaymentStatus =
        newPaid >= jobPrice && jobPrice > 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

      await updateJob({
        ...currentJob,
        installments: updatedInst,
        paidAmount: newPaid,
        paymentStatus: newStatus,
      });

      setShowAddIncassoModal(false);
      setIncassoNotes('');
    } finally {
      setIsSavingIncasso(false);
    }
  };

  const handleDeleteInstallment = async (instId: string) => {
    const updatedInst = (currentJob.installments || []).filter((it) => it.id !== instId);
    const newPaid = updatedInst.reduce((s, it) => s + (it.amount || 0), 0);
    const jobPrice = currentJob.price || 0;
    const newStatus: JobPaymentStatus =
      newPaid >= jobPrice && jobPrice > 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    await updateJob({
      ...currentJob,
      installments: updatedInst,
      paidAmount: newPaid,
      paymentStatus: newStatus,
    });
  };

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
          
          {/* Status & Type Bar - 3px padding, badge on the right */}
          <div className="flex items-center justify-between gap-2 p-[3px] bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                {job.interventionType === 'generale' ? (
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                    <Repeat className="w-3 h-3" />
                    <span>Periodico ({job.plannedDates?.length || job.sessionsCount || 1} uscite)</span>
                  </span>
                ) : (
                  'Intervento Singolo'
                )}
              </span>

              {currentJob.isNaturando && (
                <div className="flex items-center gap-1 shrink-0" title={`Quota Naturando: ${currentJob.naturandoPercentage || 20}%`}>
                  <img src={NATURANDO_LOGO_URL} alt="Naturando" className="h-3.5 max-w-[42px] object-contain" />
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    {currentJob.naturandoPercentage || 20}%
                  </span>
                </div>
              )}
            </div>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border shrink-0 ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                  : effectiveStatus === 'in_progress'
                  ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800'
                  : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {isCompleted ? 'FATTO' : effectiveStatus === 'in_progress' ? 'IN CORSO' : 'IN PROGRAMMA'}
            </span>
          </div>

          {/* Lavorazione / Titolo e Descrizione - senza sfondo né bordo */}
          <div className="space-y-[3px] p-[3px]">
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

          {/* Squadra / Operai Assegnati - senza sfondo né bordo */}
          <div className="space-y-[3px] p-[3px]">
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
                Recapiti
              </span>
              <div className="flex items-center justify-between gap-2">
                {job.clientAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.clientAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline min-w-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{job.clientAddress}</span>
                  </a>
                )}
                {job.clientPhone && (
                  <a
                    href={`tel:${job.clientPhone}`}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 ml-auto"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{job.clientPhone}</span>
                  </a>
                )}
              </div>
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

          {/* Monitoraggio Costi (per Admin) - senza sfondo né bordo */}
          {currentUser?.role === 'admin' && (
            <div className="space-y-[3px] p-[3px] text-xs">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Monitoraggio Costi</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCostManager(true)}
                  className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-[5px] font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  title="Gestisci e inserisci spese e manodopera per questo cantiere"
                >
                  <Fuel className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Gestisci Costi</span>
                </button>
              </div>

              {/* Financial KPI Strip - su un rigo solo */}
              <div className="grid grid-cols-3 gap-[3px] text-center text-[11px] sm:text-xs">
                <div className="bg-white dark:bg-slate-900 p-1 px-1.5 rounded border border-slate-200/70 dark:border-slate-800 flex items-center justify-center font-mono font-bold text-slate-900 dark:text-slate-100 truncate">
                  <span>tot € {price.toFixed(price % 1 === 0 ? 0 : 2)}</span>
                </div>

                <div className="bg-rose-50/40 dark:bg-rose-950/20 p-1 px-1.5 rounded border border-rose-100 dark:border-rose-950/60 flex items-center justify-center font-mono font-bold text-rose-600 dark:text-rose-400 truncate">
                  <span>costi -€ {totalAllCost.toFixed(totalAllCost % 1 === 0 ? 0 : 2)}</span>
                </div>

                <div
                  className={`p-1 px-1.5 rounded border flex items-center justify-center gap-1 truncate ${
                    margin >= 0
                      ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400'
                      : 'bg-rose-950/40 border-rose-900/60 text-rose-400'
                  }`}
                >
                  <span className="text-[10px] font-sans font-bold opacity-90">
                    utile {marginPct}%
                  </span>
                  <span className="text-white text-sm sm:text-base font-extrabold font-mono ml-0.5">
                    € {margin.toFixed(margin % 1 === 0 ? 0 : 2)}
                  </span>
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
                              w.totalJobsToday > 1
                                ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}
                            title={w.totalJobsToday > 1 ? `Costo giornata diviso per ${w.totalJobsToday} interventi` : 'Intervento singolo'}
                          >
                            {w.label || (w.totalJobsToday > 1 ? `Manodopera (1/${w.totalJobsToday})` : 'Manodopera')}
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

              {/* Macchinari ed Attrezzature Usate (Solo macchinari usati con gap a 3px, senza tasti o diciture manutenzione) */}
              {currentJob.equipmentRequired && currentJob.equipmentRequired.length > 0 && (
                <div className="pt-1 space-y-[3px]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Macchinari Usati ({currentJob.equipmentRequired.length})</span>
                  </div>

                  <div className="space-y-[3px]">
                    {currentJob.equipmentRequired.map((eq) => (
                      <div
                        key={eq.itemId || eq.name}
                        className="p-1 px-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-[5px] border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-[3px]"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {eq.name}
                        </span>
                        {eq.hoursUsed !== undefined && (
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            ({eq.hoursUsed}h)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Voci di Spesa Registrate */}
              <div className="pt-1 space-y-[3px]">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span>Voci di Spesa Registrate</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    -€ {expensesCost.toFixed(2)}
                  </span>
                </div>

                {combinedCosts.length > 0 ? (
                  <div className="space-y-[3px] pt-0.5">
                    {combinedCosts.map((c) => {
                      const catInfo = getCostCategoryInfo(c.category);
                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-2 text-xs py-0.5"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                              {c.name}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase border shrink-0 ${catInfo.badgeClass}`}>
                              {catInfo.label}
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
                <div className="pt-1">
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
                </div>
              )}
            </div>
          )}

          {/* Note Intervento */}
          {job.notes && (
            <div className="space-y-[3px] p-[3px]">
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

        {/* Modal Footer: Icon action buttons without text, backgrounds or borders */}
        <div className="p-2 px-[6px] flex items-center justify-end gap-3 shrink-0">
          {currentUser?.role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => {
                  const inst = currentJob.installments || [];
                  const paid = inst.reduce((s, it) => s + (it.amount || 0), 0);
                  const remaining = Math.max(0, (currentJob.price || 0) - paid);
                  setIncassoAmount(remaining > 0 ? remaining : (currentJob.price || 0));
                  setIncassoDate(todayStr);
                  setIncassoMethod(currentJob.paymentMethod || 'bonifico');
                  setIncassoNotes('');
                  setShowAddIncassoModal(true);
                }}
                className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity cursor-pointer"
                title="Aggiungi Incasso"
                aria-label="Aggiungi Incasso"
              >
                <Wallet className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowCostManager(true)}
                className="p-1.5 text-amber-600 dark:text-amber-400 hover:opacity-80 transition-opacity cursor-pointer"
                title="Gestisci Costi"
              >
                <Fuel className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity cursor-pointer"
                title="Modifica Intervento"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Interactive Cost Management Modal */}
      {showCostManager && (
        <JobCostManagerModal
          job={currentJob}
          onClose={() => setShowCostManager(false)}
        />
      )}

      {/* Modal Aggiungi Incasso */}
      {showAddIncassoModal && (
        <div className="fixed inset-0 z-[1100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal Incasso */}
            <div className="p-3 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Registra Incasso
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                    {currentJob.title} • {currentJob.clientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddIncassoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                title="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto">
              {/* Riepilogo Saldo Lavoro */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                    Totale Lavoro
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                    € {price.toFixed(2)}
                  </span>
                </div>

                <div className="p-2 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                  <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider block">
                    Incassato
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    € {totalPaid.toFixed(2)}
                  </span>
                </div>

                <div className="p-2 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                  <span className="text-[9px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider block">
                    Rimanente
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                    € {remainingDue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Acconti già registrati (se presenti) */}
              {installments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                    Acconti Registrati ({installments.length})
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {installments.map((inst, idx) => (
                      <div
                        key={inst.id || idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {formatShortDateItalian(inst.date)}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {inst.paymentMethod === 'bonifico'
                                ? 'Bonifico'
                                : inst.paymentMethod === 'contanti'
                                ? 'Contanti'
                                : inst.paymentMethod === 'pos_carta'
                                ? 'Carta / POS'
                                : inst.paymentMethod === 'assegno'
                                ? 'Assegno'
                                : inst.paymentMethod === 'riba_30_60'
                                ? 'Ri.Ba.'
                                : 'Altro'}
                            </span>
                          </div>
                          {inst.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {inst.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +€ {inst.amount.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteInstallment(inst.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Elimina questo acconto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Nuovo Incasso */}
              <form onSubmit={handleSaveIncasso} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Importo Incasso (€) *
                    </label>
                    {remainingDue > 0 && (
                      <button
                        type="button"
                        onClick={() => setIncassoAmount(remainingDue)}
                        className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold"
                      >
                        Saldo Tutto (€ {remainingDue.toFixed(2)})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      €
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={incassoAmount}
                      onChange={(e) => setIncassoAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Data Incasso
                    </label>
                    <input
                      type="date"
                      required
                      value={incassoDate}
                      onChange={(e) => setIncassoDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-emerald-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Metodo di Pagamento
                    </label>
                    <select
                      value={incassoMethod}
                      onChange={(e) => setIncassoMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-emerald-600 cursor-pointer"
                    >
                      <option value="bonifico">Bonifico Bancario</option>
                      <option value="contanti">Contanti</option>
                      <option value="pos_carta">Carta / POS</option>
                      <option value="assegno">Assegno</option>
                      <option value="riba_30_60">Ri.Ba. (30/60 gg)</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Note / Riferimento (opzionale)
                  </label>
                  <input
                    type="text"
                    value={incassoNotes}
                    onChange={(e) => setIncassoNotes(e.target.value)}
                    placeholder="Es. Acconto 50%, Saldo cantiere..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddIncassoModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingIncasso || !incassoAmount || Number(incassoAmount) <= 0}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingIncasso ? 'Salvataggio...' : 'Registra Incasso'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manual Maintenance Modal */}
      {maintenanceEquipItem && (
        <ManualMaintenanceModal
          equipmentItem={
            maintenanceEquipItem.id
              ? inventory.find((i) => i.id === maintenanceEquipItem.id) || null
              : null
          }
          preselectedJobId={currentJob.id}
          onClose={() => setMaintenanceEquipItem(null)}
        />
      )}
    </div>
  );
};
