import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Job } from '../../types';
import { getClientColor } from '../../utils/clientColors';
import { NATURANDO_ICON_SVG, NATURANDO_COMPLETE_SVG } from '../jobs/JobModal';
import {
  CheckCircle2,
  Settings,
  MapPin,
  Wallet,
} from 'lucide-react';

const IT_MONTHS_SHORT = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];

const formatDayAndMonth = (dateStr?: string) => {
  if (!dateStr) return { day: '--', month: '---' };
  try {
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      const day = parts[2].replace(/^0/, '');
      const mIdx = parseInt(parts[1], 10) - 1;
      const month = IT_MONTHS_SHORT[mIdx] || parts[1];
      return { day, month };
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return { day: String(d.getDate()), month: IT_MONTHS_SHORT[d.getMonth()] || '' };
    }
  } catch {
    // fallback
  }
  return { day: dateStr, month: '' };
};

export const NaturandoView: React.FC = () => {
  const { jobs, clients, updateJob } = useApp();

  const [naturandoFilter, setNaturandoFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [naturandoDefaultPercentage, setNaturandoDefaultPercentage] = useState<number>(20);
  const [showNaturandoQuotaSettings, setShowNaturandoQuotaSettings] = useState(false);
  const [editingNaturandoJobId, setEditingNaturandoJobId] = useState<string | null>(null);
  const [editNaturandoAmount, setEditNaturandoAmount] = useState<number>(0);
  const [editNaturandoPct, setEditNaturandoPct] = useState<number>(20);
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({});

  const toggleJobExpanded = (jobId: string) => {
    setExpandedJobIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  // Helper formatting numbers without decimals if integer
  const formatAmountNoCents = (val: number) => {
    return Math.round(val).toLocaleString('it-IT');
  };

  // Naturando computations & handlers
  const naturandoJobs = useMemo(() => {
    return jobs.filter(
      (j) => j.isNaturando === true || j.title?.toLowerCase().includes('naturando') || j.description?.toLowerCase().includes('naturando')
    );
  }, [jobs]);

  const naturandoTotals = useMemo(() => {
    let totalCommunicated = 0;
    let totalDue = 0;
    let totalNet = 0;
    let totalPaid = 0;
    let totalPending = 0;

    naturandoJobs.forEach((job) => {
      const amount = job.naturandoAmount !== undefined && job.naturandoAmount > 0
        ? job.naturandoAmount
        : (job.price || 0);
      const pct = job.naturandoPercentage !== undefined && job.naturandoPercentage > 0
        ? job.naturandoPercentage
        : naturandoDefaultPercentage;
      const due = (amount * pct) / 100;
      const net = amount - due;

      totalCommunicated += amount;
      totalDue += due;
      totalNet += net;

      if (job.naturandoPaid) {
        totalPaid += due;
      } else {
        totalPending += due;
      }
    });

    return { totalCommunicated, totalDue, totalNet, totalPaid, totalPending };
  }, [naturandoJobs, naturandoDefaultPercentage]);

  const filteredNaturandoJobs = useMemo(() => {
    return naturandoJobs.filter((j) => {
      if (naturandoFilter === 'pending') return !j.naturandoPaid;
      if (naturandoFilter === 'paid') return !!j.naturandoPaid;
      return true;
    });
  }, [naturandoJobs, naturandoFilter]);

  const handleToggleNaturandoPaid = async (job: Job) => {
    const nextPaid = !job.naturandoPaid;
    await updateJob({
      ...job,
      isNaturando: true,
      naturandoPaid: nextPaid,
      naturandoPaidDate: nextPaid ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const handleSaveNaturandoValues = async (job: Job) => {
    await updateJob({
      ...job,
      isNaturando: true,
      naturandoAmount: Number(editNaturandoAmount) || 0,
      naturandoPercentage: Number(editNaturandoPct) || 20,
    });
    setEditingNaturandoJobId(null);
  };

  return (
    <div className="space-y-[3px]">
      {/* Header: Logo Naturando allineato a SX e più grande + Tasto percentuale allineato a DX in alto */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2 pt-0 pb-1">
          <div className="flex items-center">
            {/* Logo: Ramovianatur allineato a sinistra e più grande */}
            <img
              src={NATURANDO_COMPLETE_SVG}
              alt="Ramovianatur"
              className="h-12 sm:h-14 md:h-16 w-auto max-w-[240px] sm:max-w-[300px] object-contain shrink-0 dark:brightness-0 dark:invert transition-all"
            />
          </div>

          {/* Tasto percentuale allineato in alto a destra, senza sfondo né bordo */}
          <div className="relative shrink-0 pt-0">
            <button
              type="button"
              onClick={() => setShowNaturandoQuotaSettings((prev) => !prev)}
              className="inline-flex items-center gap-1 bg-transparent border-0 p-0 text-slate-700 dark:text-slate-200 font-bold hover:opacity-80 transition-opacity cursor-pointer shadow-none"
              title="Modifica percentuale quota base"
            >
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                {naturandoDefaultPercentage}%
              </span>
              <Settings className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform ${showNaturandoQuotaSettings ? 'rotate-90 text-emerald-600 dark:text-emerald-400' : ''}`} />
            </button>

            {/* Menu percentuali comparsa allineato a destra */}
            {showNaturandoQuotaSettings && (
              <div className="absolute right-0 top-full mt-1.5 z-30 flex flex-wrap items-center gap-1 p-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-[5px] shadow-lg animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap min-w-[220px]">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mr-1 uppercase">Quota:</span>
                {[10, 15, 20, 25, 30].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setNaturandoDefaultPercentage(pct);
                      setShowNaturandoQuotaSettings(false);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      naturandoDefaultPercentage === pct
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <div className="flex items-center ml-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={naturandoDefaultPercentage}
                    onChange={(e) => setNaturandoDefaultPercentage(parseFloat(e.target.value) || 0)}
                    className="w-12 p-0.5 text-center font-mono font-bold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-emerald-700 dark:text-emerald-400 focus:outline-emerald-600"
                  />
                  <span className="text-[10px] font-bold text-slate-500 ml-0.5">%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4 Card Riepilogo su UN SOLO RIGO (grid-cols-4) con testi leggibili e gap 3px */}
        <div className="grid grid-cols-4 gap-[3px] pt-0.5">
          {/* 1. Lavori */}
          <div className="p-1 sm:p-2 bg-slate-50 dark:bg-slate-800/60 rounded-[5px] border border-slate-200 dark:border-slate-800 min-w-0">
            <span className="text-[8.5px] sm:text-[10px] md:text-xs uppercase font-bold text-slate-500 dark:text-slate-400 block truncate leading-tight">
              Lavori
            </span>
            <span className="text-xs sm:text-sm md:text-base font-extrabold font-mono text-slate-900 dark:text-slate-100 block leading-tight truncate mt-0.5">
              {naturandoJobs.length}
            </span>
          </div>

          {/* 2. Totale Lavori */}
          <div className="p-1 sm:p-2 bg-slate-50 dark:bg-slate-800/60 rounded-[5px] border border-slate-200 dark:border-slate-800 min-w-0">
            <span className="text-[8.5px] sm:text-[10px] md:text-xs uppercase font-bold text-slate-500 dark:text-slate-400 block truncate leading-tight">
              Totale Lavori
            </span>
            <span className="text-xs sm:text-sm md:text-base font-extrabold font-mono text-slate-900 dark:text-slate-100 block leading-tight truncate mt-0.5">
              € {formatAmountNoCents(naturandoTotals.totalCommunicated)}
            </span>
          </div>

          {/* 3. Da Saldare */}
          <div className="p-1 sm:p-2 bg-amber-50/70 dark:bg-amber-950/30 rounded-[5px] border border-amber-200 dark:border-amber-900/60 min-w-0">
            <span className="text-[8.5px] sm:text-[10px] md:text-xs uppercase font-bold text-amber-700 dark:text-amber-400 block truncate leading-tight">
              Da Saldare
            </span>
            <span className="text-xs sm:text-sm md:text-base font-extrabold font-mono text-amber-700 dark:text-amber-400 block leading-tight truncate mt-0.5">
              € {formatAmountNoCents(naturandoTotals.totalPending)}
            </span>
          </div>

          {/* 4. Ricavo Netto */}
          <div className="p-1 sm:p-2 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-[5px] border border-emerald-200 dark:border-emerald-800/60 min-w-0">
            <span className="text-[8.5px] sm:text-[10px] md:text-xs uppercase font-bold text-emerald-800 dark:text-emerald-300 block truncate leading-tight">
              Ricavo Netto
            </span>
            <span className="text-xs sm:text-sm md:text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400 block leading-tight truncate mt-0.5">
              € {formatAmountNoCents(naturandoTotals.totalNet)}
            </span>
          </div>
        </div>
      </div>

      {/* Filtro Stato Naturando con gap 3px */}
      <div className="flex items-center gap-[3px] text-xs font-bold pt-1">
        <button
          type="button"
          onClick={() => setNaturandoFilter('all')}
          className={`py-1 px-2.5 rounded-[5px] border text-center transition-colors cursor-pointer text-xs font-bold ${
            naturandoFilter === 'all'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          Tutti ({naturandoJobs.length})
        </button>
        <button
          type="button"
          onClick={() => setNaturandoFilter('pending')}
          className={`py-1 px-2.5 rounded-[5px] border text-center transition-colors cursor-pointer text-xs font-bold ${
            naturandoFilter === 'pending'
              ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
          }`}
        >
          Da Saldare ({naturandoJobs.filter((j) => !j.naturandoPaid).length})
        </button>
        <button
          type="button"
          onClick={() => setNaturandoFilter('paid')}
          className={`py-1 px-2.5 rounded-[5px] border text-center transition-colors cursor-pointer text-xs font-bold ${
            naturandoFilter === 'paid'
              ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
          }`}
        >
          Saldati ({naturandoJobs.filter((j) => !!j.naturandoPaid).length})
        </button>
      </div>

      {/* Lista Commesse Naturando: Stile compatto Storico Interventi con tasto paga già fuori nella card */}
      <div className="space-y-[3px] pt-0.5">
        {filteredNaturandoJobs.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[5px] border border-slate-200 dark:border-slate-800 space-y-2">
            <img
              src={NATURANDO_COMPLETE_SVG}
              alt="Naturando"
              className="h-10 max-w-[160px] object-contain mx-auto opacity-70 dark:brightness-0 dark:invert"
            />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {naturandoJobs.length === 0
                ? 'Nessun intervento contrassegnato per Naturando.'
                : 'Nessun intervento corrisponde al filtro selezionato.'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Quando crei o modifichi un intervento, attiva il pulsante con il logo di Naturando per associarlo a questa sezione.
            </p>
          </div>
        ) : (
          filteredNaturandoJobs.map((job) => {
            const client = clients.find((c) => c.id === job.clientId);
            const clientColor = client ? getClientColor(client) : undefined;
            const isEditing = editingNaturandoJobId === job.id;
            const isExpanded = !!expandedJobIds[job.id];
            const dayMonth = formatDayAndMonth(job.date);

            const jobAmount =
              job.naturandoAmount !== undefined && job.naturandoAmount > 0
                ? job.naturandoAmount
                : (job.price || 0);

            const jobPct =
              job.naturandoPercentage !== undefined && job.naturandoPercentage > 0
                ? job.naturandoPercentage
                : naturandoDefaultPercentage;

            const naturandoDue = (jobAmount * jobPct) / 100;
            const netRevenue = jobAmount - naturandoDue;
            const isPaid = !!job.naturandoPaid;

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[5px] text-xs hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-colors shadow-2xs overflow-hidden"
                style={clientColor ? { borderLeftWidth: '3px', borderLeftColor: clientColor } : undefined}
              >
                {/* Header Card Compatto stile Storico Interventi: Data grande + Cliente/Titolo + Logo Naturando + Tasto Salda + Quota + Chevron */}
                <div
                  onClick={() => toggleJobExpanded(job.id)}
                  className={`p-2 flex items-center justify-between gap-1.5 cursor-pointer select-none transition-colors ${
                    isExpanded
                      ? 'bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Sinistra: Data (Giorno grande + Mese 3 lettere) + Nome Cliente / Titolo + Logo Naturando */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="flex items-baseline gap-0.5 shrink-0 font-mono">
                      <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none">
                        {dayMonth.day}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 ml-0.5">
                        {dayMonth.month}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 min-w-0 truncate">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                        {client?.name || job.title || 'Intervento'}
                      </span>
                      {job.title && client?.name && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                          · {job.title}
                        </span>
                      )}
                      <img
                        src={NATURANDO_ICON_SVG}
                        alt="Naturando"
                        className="w-3.5 h-3.5 object-contain shrink-0 dark:brightness-0 dark:invert"
                        title="Intervento Naturando"
                      />
                    </div>
                  </div>

                  {/* Destra: Totale in grigio prima dell'icona + Tasto Pagamento con ICONA + Quota da dare con numero ingrandito */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Valore totale in grigio senza parentesi, prima dell'icona */}
                    <span className="font-mono text-[10.5px] sm:text-xs text-slate-400 dark:text-slate-500 font-normal shrink-0">
                      € {formatAmountNoCents(jobAmount)}
                    </span>

                    {/* Tasto Salda / Saldato fatto con ICONA */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleNaturandoPaid(job);
                      }}
                      className={`p-1 rounded-[5px] cursor-pointer transition-colors shadow-2xs shrink-0 flex items-center justify-center ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200'
                          : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                      }`}
                      title={isPaid ? 'Saldato - Clicca per riaprire' : 'Salda quota Naturando'}
                    >
                      {isPaid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Wallet className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>

                    {/* Quota da dare a Naturando con solo il numero ingrandito di poco */}
                    <div className="flex items-baseline gap-0.5 font-mono shrink-0">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        €
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                        {formatAmountNoCents(naturandoDue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dettagli Espansi al Click con grafica minimal 3px */}
                {isExpanded && (
                  <div className="p-[3px] space-y-[3px] border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                    {/* Riga 1: Testo lavorazione a sinistra + Le due azioni in linea a destra */}
                    <div className="flex items-center justify-between gap-1 px-1 pt-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {job.title || 'Lavorazione'}
                      </span>

                      {/* Le due azioni in alto in linea con il testo della lavorazione a dx */}
                      <div className="flex items-center gap-[3px] shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNaturandoJobId(job.id);
                            setEditNaturandoAmount(jobAmount);
                            setEditNaturandoPct(jobPct);
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[5px] cursor-pointer transition-colors shadow-2xs"
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleNaturandoPaid(job)}
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-[5px] cursor-pointer transition-colors shadow-2xs ${
                            isPaid
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-emerald-700 text-white hover:bg-emerald-600'
                          }`}
                        >
                          {isPaid ? 'Riapri' : 'Salda'}
                        </button>
                      </div>
                    </div>

                    {/* Riga 2: Indirizzo e note sotto la lavorazione/azioni */}
                    {(client?.address || job.notes) && (
                      <div className="px-1 space-y-0.5 text-xs">
                        {client?.address && (
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{client.address}</span>
                          </p>
                        )}
                        {job.notes && (
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 italic">
                            {job.notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Riga 3: Tutti i valori su un rigo solo (oppure form modifica) */}
                    {isEditing ? (
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-800/70 rounded-[5px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
                        <div className="grid grid-cols-2 gap-[3px] text-xs">
                          <div className="space-y-0.5">
                            <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                              Importo Comunicato (€)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={editNaturandoAmount}
                              onChange={(e) => setEditNaturandoAmount(parseFloat(e.target.value) || 0)}
                              className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="block text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                              % Quota Naturando
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={editNaturandoPct}
                                onChange={(e) => setEditNaturandoPct(parseFloat(e.target.value) || 0)}
                                className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-xs text-center text-slate-900 dark:text-slate-100"
                              />
                              <span className="text-xs font-bold text-slate-400">%</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setEditingNaturandoJobId(null)}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Annulla
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNaturandoValues(job)}
                            className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white cursor-pointer shadow-xs"
                          >
                            Salva
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-[3px] p-[3px] px-2 bg-slate-50 dark:bg-slate-800/60 rounded-[5px] border border-slate-200 dark:border-slate-800 text-xs font-mono">
                        <div className="min-w-0">
                          <span className="text-[8.5px] uppercase font-sans font-bold text-slate-400 block truncate leading-tight">
                            Comunicato
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 block truncate text-xs">
                            € {formatAmountNoCents(jobAmount)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <span className="text-[8.5px] uppercase font-sans font-bold text-slate-400 block truncate leading-tight">
                            Quota ({jobPct}%)
                          </span>
                          <span className="font-extrabold text-rose-600 dark:text-rose-400 block truncate text-xs">
                            € {naturandoDue.toFixed(2)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <span className="text-[8.5px] uppercase font-sans font-bold text-slate-400 block truncate leading-tight">
                            Tuo Netto ({100 - jobPct}%)
                          </span>
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block truncate text-xs">
                            € {netRevenue.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

