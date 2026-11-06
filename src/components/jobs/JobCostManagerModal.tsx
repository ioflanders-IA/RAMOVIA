import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Job, JobCostCategory } from '../../types';
import { Fuel, HardHat, Plus, Trash2, X } from 'lucide-react';
import { NATURANDO_LOGO_URL } from './JobModal';
import { getJobLaborSummary, getCostCategoryInfo } from '../clients/ClientsView';

interface JobCostManagerModalProps {
  job: Job;
  onClose: () => void;
}

export const JobCostManagerModal: React.FC<JobCostManagerModalProps> = ({ job, onClose }) => {
  const { jobs, users, addJobCost, deleteJobCost } = useApp();

  const [costCategory, setCostCategory] = useState<JobCostCategory>('benzina');
  const [costName, setCostName] = useState('');
  const [costAmount, setCostAmount] = useState<number>(20);
  const [costNotes, setCostNotes] = useState('');

  // Keep live job instance updated
  const currentCostJob = useMemo(() => {
    return jobs.find((j) => j.id === job.id) || job;
  }, [jobs, job]);

  const currentCosts = currentCostJob.costs || [];
  const currentExpensesTotal = currentCosts.reduce((s, c) => s + (c.amount || 0), 0);
  const currentJobLabor = getJobLaborSummary(currentCostJob, jobs, users);
  const currentIsNaturando = !!currentCostJob.isNaturando;
  const currentNaturandoBase =
    currentCostJob.naturandoAmount !== undefined && currentCostJob.naturandoAmount > 0
      ? currentCostJob.naturandoAmount
      : currentCostJob.price || 0;
  const currentNaturandoPct =
    currentCostJob.naturandoPercentage !== undefined && currentCostJob.naturandoPercentage > 0
      ? currentCostJob.naturandoPercentage
      : 20;
  const currentNaturandoCost = currentIsNaturando
    ? Math.round(((currentNaturandoBase * currentNaturandoPct) / 100) * 100) / 100
    : 0;

  const currentAllCosts = currentExpensesTotal + currentJobLabor.totalLaborCost + currentNaturandoCost;
  const currentPrice = currentCostJob.price || 0;
  const currentNetMargin = currentPrice - currentAllCosts;

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (costAmount <= 0 || !costName.trim()) return;

    await addJobCost(currentCostJob.id, {
      category: costCategory,
      name: costName.trim(),
      amount: Number(costAmount),
      notes: costNotes.trim() || undefined,
    });

    setCostName('');
    setCostAmount(20);
    setCostNotes('');
  };

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 p-2 sm:p-3 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-lg w-full p-2.5 sm:p-3 space-y-[3px] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-2 px-3 rounded-[6px] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Fuel className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="font-bold text-xs truncate">
              Costi & Manodopera: {currentCostJob.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 shrink-0 cursor-pointer"
            title="Chiudi gestione costi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Financial KPI bar */}
        <div
          className={`grid ${
            currentIsNaturando ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-4'
          } gap-[3px] bg-slate-100 dark:bg-slate-800/60 p-2 rounded-[6px] text-xs text-center`}
        >
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold">Prezzo</span>
            <strong className="font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              € {currentPrice.toFixed(2)}
            </strong>
          </div>

          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold">Spese Materiali</span>
            <strong className="font-mono text-xs sm:text-sm text-rose-600 dark:text-rose-400">
              -€ {currentExpensesTotal.toFixed(2)}
            </strong>
          </div>

          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold">Manodopera</span>
            <strong className="font-mono text-xs sm:text-sm text-amber-600 dark:text-amber-400">
              -€ {currentJobLabor.totalLaborCost.toFixed(2)}
            </strong>
          </div>

          {currentIsNaturando && (
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">Naturando</span>
              <strong className="font-mono text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                -€ {currentNaturandoCost.toFixed(2)}
              </strong>
            </div>
          )}

          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-bold">Margine Netto</span>
            <strong
              className={`font-mono text-xs sm:text-sm ${
                currentNetMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
              }`}
            >
              € {currentNetMargin.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* SEZIONE MANODOPERA PER QUESTO CANTIERE */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Manodopera Cantiere ({currentJobLabor.workers.length} operai)</span>
            </div>
            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
              -€ {currentJobLabor.totalLaborCost.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 italic pb-0.5">
            Calcolo automatico uscite: se l'operaio svolge 2 o più interventi nello stesso giorno, il costo è ripartito a metà (mezza giornata).
          </p>

          {currentJobLabor.workers.length > 0 ? (
            <div className="space-y-[3px]">
              {currentJobLabor.workers.map((w) => (
                <div
                  key={w.workerId || w.workerName}
                  className="p-1 px-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{w.workerName}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border shrink-0 ${
                        w.dayType === 'mezza giornata'
                          ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {w.dayType === 'mezza giornata' ? 'Mezza Giornata (2 cantieri oggi)' : 'Giornata Intera (1 cantiere oggi)'}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0 text-right">
                    -€ {w.cost.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 py-1">Nessun operaio assegnato a questo intervento.</div>
          )}
        </div>

        {/* SEZIONE SPESE REGISTRATE */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <span>Spese Registrate ({currentCosts.length})</span>
            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
              -€ {currentExpensesTotal.toFixed(2)}
            </span>
          </div>

          {currentCosts.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded">
              Nessuna spesa di materiali o carburante registrata.
            </div>
          ) : (
            <div className="space-y-[3px] max-h-36 overflow-y-auto">
              {currentCosts.map((c) => {
                const catInfo = getCostCategoryInfo(c.category);
                return (
                  <div
                    key={c.id}
                    className="p-1 px-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{c.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono border shrink-0 ${catInfo.badgeClass}`}>
                          {catInfo.label}
                        </span>
                      </div>
                      {c.notes && <div className="text-[10px] text-slate-400 truncate">{c.notes}</div>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 text-right">
                        -€ {c.amount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteJobCost(currentCostJob.id, c.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Elimina costo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SEZIONE QUOTA COMMESSA NATURANDO */}
        {currentIsNaturando && (
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-1.5">
                <img
                  src={NATURANDO_LOGO_URL}
                  alt="Naturando"
                  className="h-3.5 max-w-[55px] object-contain rounded"
                />
                <span>Quota Dovuta a Naturando ({currentNaturandoPct}%)</span>
              </div>
              <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                -€ {currentNaturandoCost.toFixed(2)}
              </span>
            </div>
            <div className="p-1 px-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shrink-0">
                  Naturando {currentNaturandoPct}%
                </span>
                <span className="text-slate-700 dark:text-slate-300 truncate">
                  Importo: € {(currentCostJob.naturandoAmount !== undefined && currentCostJob.naturandoAmount > 0 ? currentCostJob.naturandoAmount : currentPrice).toFixed(2)}
                </span>
              </div>
              <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0 text-right">
                -€ {currentNaturandoCost.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Form: Inserisci Nuova Spesa */}
        <form onSubmit={handleAddCost} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px] text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 pb-0.5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Inserisci Nuova Spesa per l'Intervento</span>
          </div>

          <div className="grid grid-cols-2 gap-[3px]">
            <div>
              <label className="font-semibold block text-[11px] mb-0.5">Categoria *</label>
              <select
                value={costCategory}
                onChange={(e) => setCostCategory(e.target.value as JobCostCategory)}
                className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
              >
                <option value="benzina">Benzina / Carburante</option>
                <option value="sacchi">Sacchi Smaltimento</option>
                <option value="materiale">Materiale & Concimi</option>
                <option value="smaltimento">Smaltimento Verde</option>
                <option value="noleggio">Noleggio Mezzi</option>
                <option value="manodopera">Altra Manodopera</option>
                <option value="altro">Altro Costo</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block text-[11px] mb-0.5">Importo (€) *</label>
              <input
                type="number"
                step="0.5"
                required
                value={costAmount}
                onChange={(e) => setCostAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold text-rose-600"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block text-[11px] mb-0.5">Descrizione Spesa *</label>
            <input
              type="text"
              required
              value={costName}
              onChange={(e) => setCostName(e.target.value)}
              placeholder="es. 10L Benzina decespugliatore, 15 sacchi sfalcio"
              className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
            />
          </div>

          <div>
            <label className="font-semibold block text-[11px] mb-0.5">Note Aggiuntive</label>
            <input
              type="text"
              value={costNotes}
              onChange={(e) => setCostNotes(e.target.value)}
              placeholder="es. Fornitore Eni / Agraria"
              className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
            />
          </div>

          <div className="flex justify-end pt-0.5">
            <button
              type="submit"
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Spesa</span>
            </button>
          </div>
        </form>

        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs cursor-pointer transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
