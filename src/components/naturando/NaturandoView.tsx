import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Job } from '../../types';
import { getClientColor } from '../../utils/clientColors';
import { NATURANDO_LOGO_URL, NATURANDO_COMPLETE_SVG } from '../jobs/JobModal';
import {
  CheckCircle2,
  Clock,
  Settings,
  DollarSign,
  Briefcase,
  TrendingUp,
  Percent,
} from 'lucide-react';

export const NaturandoView: React.FC = () => {
  const { jobs, clients, updateJob } = useApp();

  const [naturandoFilter, setNaturandoFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [naturandoDefaultPercentage, setNaturandoDefaultPercentage] = useState<number>(20);
  const [showNaturandoQuotaSettings, setShowNaturandoQuotaSettings] = useState(false);
  const [editingNaturandoJobId, setEditingNaturandoJobId] = useState<string | null>(null);
  const [editNaturandoAmount, setEditNaturandoAmount] = useState<number>(0);
  const [editNaturandoPct, setEditNaturandoPct] = useState<number>(20);

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
    <div className="space-y-[7px]">
      {/* Header Card: Logo Naturando centrale + Regolatore Percentuale con Ingranaggio */}
      <div className="space-y-2">
        <div className="flex flex-col items-center justify-center gap-1.5 py-1">
          <div className="flex items-center justify-center gap-3">
            {/* Logo: Ramovianatur complete.svg senza bordi o sfondo per entrambi i temi */}
            <img
              src={NATURANDO_COMPLETE_SVG}
              alt="Ramovianatur"
              className="h-10 sm:h-12 w-auto max-w-[210px] sm:max-w-[250px] object-contain shrink-0 dark:brightness-0 dark:invert transition-all"
            />

            {/* Quota Base con rotella ingranaggio vicino */}
            <button
              type="button"
              onClick={() => setShowNaturandoQuotaSettings((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
              title="Modifica percentuale quota base"
            >
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Quota:</span>
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">{naturandoDefaultPercentage}%</span>
              <Settings className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform ${showNaturandoQuotaSettings ? 'rotate-90 text-emerald-600 dark:text-emerald-400' : ''}`} />
            </button>
          </div>

          {/* Percentuali a comparsa quando si clicca sull'ingranaggio */}
          {showNaturandoQuotaSettings && (
            <div className="flex flex-wrap items-center justify-center gap-1 p-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-[7px] shadow-sm animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mr-1 uppercase">Quota Base:</span>
              {[10, 15, 20, 25, 30].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setNaturandoDefaultPercentage(pct)}
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

        {/* KPI Summary Grid per Naturando - 4 card di riepilogo senza didascalie */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
          {/* 1. Lavori */}
          <div className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/60 rounded-[6px] border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block truncate">
              Lavori
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-slate-900 dark:text-slate-100 block leading-tight">
              {naturandoJobs.length}
            </span>
          </div>

          {/* 2. Totale Lavori */}
          <div className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800/60 rounded-[6px] border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block truncate">
              Totale Lavori
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-slate-900 dark:text-slate-100 block leading-tight">
              € {formatAmountNoCents(naturandoTotals.totalCommunicated)}
            </span>
          </div>

          {/* 3. Da Saldare */}
          <div className="p-1.5 sm:p-2 bg-amber-50/70 dark:bg-amber-950/30 rounded-[6px] border border-amber-200 dark:border-amber-900/60">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block truncate">
              Da Saldare
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-amber-700 dark:text-amber-400 block leading-tight">
              € {formatAmountNoCents(naturandoTotals.totalPending)}
            </span>
          </div>

          {/* 4. Ricavo Netto (alla fine) */}
          <div className="p-1.5 sm:p-2 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-[6px] border border-emerald-200 dark:border-emerald-800/60">
            <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block truncate">
              Ricavo Netto
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400 block leading-tight">
              € {formatAmountNoCents(naturandoTotals.totalNet)}
            </span>
          </div>
        </div>
      </div>

      {/* Filtro Stato Naturando */}
      <div className="flex items-center gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setNaturandoFilter('all')}
          className={`py-1.5 px-3 rounded-[5px] border text-center transition-colors cursor-pointer ${
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
          className={`py-1.5 px-3 rounded-[5px] border text-center transition-colors cursor-pointer ${
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
          className={`py-1.5 px-3 rounded-[5px] border text-center transition-colors cursor-pointer ${
            naturandoFilter === 'paid'
              ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
          }`}
        >
          Saldati ({naturandoJobs.filter((j) => !!j.naturandoPaid).length})
        </button>
      </div>

      {/* Lista Commesse Naturando */}
      <div className="space-y-[3px]">
        {filteredNaturandoJobs.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[7px] border border-slate-200 dark:border-slate-800 space-y-2">
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
                className={`p-2.5 bg-white dark:bg-slate-900 border rounded-[7px] space-y-2 transition-all ${
                  isPaid
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
                style={clientColor ? { borderLeftWidth: '4.5px', borderLeftColor: clientColor } : undefined}
              >
                {/* Header Riga Lavoro */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {client?.name || 'Cliente non specificato'}
                      </span>
                      {client?.address && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          · {client.address}
                        </span>
                      )}
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                        {job.date}
                      </span>
                    </div>
                    {job.title && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                        {job.title}
                      </p>
                    )}
                  </div>

                  {/* Badge Stato Saldo Naturando */}
                  <div className="shrink-0">
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Saldato {job.naturandoPaidDate ? `(${job.naturandoPaidDate})` : ''}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Da Saldare</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Breakdown Finanziario o Form Modifica Rapida */}
                {isEditing ? (
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/70 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                          Importo Comunicato (€)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editNaturandoAmount}
                          onChange={(e) => setEditNaturandoAmount(parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                          % Spettante a Naturando
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={editNaturandoPct}
                            onChange={(e) => setEditNaturandoPct(parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-xs text-center text-slate-900 dark:text-slate-100"
                          />
                          <span className="text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingNaturandoJobId(null)}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveNaturandoValues(job)}
                        className="px-3 py-1 rounded text-xs font-bold bg-emerald-700 text-white cursor-pointer shadow-xs"
                      >
                        Salva
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-[6px] border border-slate-200 dark:border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-[9px] uppercase font-sans font-bold text-slate-400 block">
                        Comunicato
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        € {formatAmountNoCents(jobAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-sans font-bold text-slate-400 block">
                        Quota Naturando ({jobPct}%)
                      </span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400">
                        € {naturandoDue.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-sans font-bold text-slate-400 block">
                        Tuo Netto ({100 - jobPct}%)
                      </span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                        € {netRevenue.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNaturandoJobId(job.id);
                          setEditNaturandoAmount(jobAmount);
                          setEditNaturandoPct(jobPct);
                        }}
                        className="p-1 px-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded cursor-pointer transition-colors"
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleNaturandoPaid(job)}
                        className={`p-1 px-2.5 text-[10px] font-bold rounded cursor-pointer transition-colors shadow-2xs ${
                          isPaid
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-emerald-700 text-white hover:bg-emerald-600'
                        }`}
                      >
                        {isPaid ? 'Riapri' : 'Salda'}
                      </button>
                    </div>
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
