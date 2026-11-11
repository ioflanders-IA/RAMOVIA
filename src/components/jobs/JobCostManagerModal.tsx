import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Job, JobCostCategory, JobCostItem } from '../../types';
import { Fuel, HardHat, Plus, Trash2, X, Edit2, Check, Wrench, Settings2 } from 'lucide-react';
import { NATURANDO_LOGO_URL } from './JobModal';
import { getJobLaborSummary, getCostCategoryInfo } from '../clients/ClientsView';
import { ManualMaintenanceModal } from '../inventory/ManualMaintenanceModal';
import {
  getCombinedCategoryList,
  getSavedCustomCategories,
  saveCustomCategories,
} from '../../utils/categoryUtils';

interface JobCostManagerModalProps {
  job: Job;
  onClose: () => void;
}

export const JobCostManagerModal: React.FC<JobCostManagerModalProps> = ({ job, onClose }) => {
  const { jobs, users, inventory, expenses, addJobCost, deleteJobCost, updateJob } = useApp();

  const [costCategory, setCostCategory] = useState<JobCostCategory>('benzina');
  const [costName, setCostName] = useState('');
  const [costAmount, setCostAmount] = useState<number>(20);
  const [costNotes, setCostNotes] = useState('');
  const [longPressedCostId, setLongPressedCostId] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<JobCostItem | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Custom Categories Management
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategoriesList, setCustomCategoriesList] = useState<string[]>(() =>
    getSavedCustomCategories()
  );

  const categoryOptions = useMemo(() => {
    return getCombinedCategoryList(expenses, jobs);
  }, [expenses, jobs, customCategoriesList]);

  const handleAddCustomCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const saved = getSavedCustomCategories();
    if (!saved.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...saved, trimmed];
      saveCustomCategories(updated);
      setCustomCategoriesList(updated);
    }
    setCostCategory(trimmed as JobCostCategory);
    setNewCategoryName('');
  };

  const handleDeleteCustomCategory = (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const saved = getSavedCustomCategories();
    const updated = saved.filter((c) => c !== catToDelete);
    saveCustomCategories(updated);
    setCustomCategoriesList(updated);
    if (costCategory === catToDelete) {
      setCostCategory('benzina');
    }
  };

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

  const formatNoDecimals = (val: number) => {
    return Math.abs(val) % 1 === 0 ? Math.round(val).toLocaleString('it-IT') : val.toFixed(2).replace('.', ',');
  };

  let pressTimer: any = null;
  const createCostLongPressProps = (costId: string) => {
    const start = () => {
      pressTimer = setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
        setLongPressedCostId((prev) => (prev === costId ? null : costId));
      }, 450);
    };

    const clear = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    return {
      onMouseDown: () => start(),
      onMouseUp: () => clear(),
      onMouseLeave: () => clear(),
      onTouchStart: () => start(),
      onTouchEnd: () => clear(),
      onTouchMove: () => clear(),
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        setLongPressedCostId((prev) => (prev === costId ? null : costId));
      },
    };
  };

  const startEditCost = (c: JobCostItem) => {
    setEditingCost(c);
    setCostName(c.name);
    setCostAmount(c.amount);
    setCostCategory(c.category);
    setCostNotes(c.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingCost(null);
    setCostName('');
    setCostAmount(20);
    setCostNotes('');
    setLongPressedCostId(null);
  };

  const handleAddOrUpdateCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (costAmount <= 0 || !costName.trim()) return;

    if (editingCost) {
      const updatedCosts = (currentCostJob.costs || []).map((c) =>
        c.id === editingCost.id
          ? {
              ...c,
              category: costCategory,
              name: costName.trim(),
              amount: Number(costAmount),
              notes: costNotes.trim() || undefined,
            }
          : c
      );
      await updateJob({
        ...currentCostJob,
        costs: updatedCosts,
      });
      setEditingCost(null);
      setLongPressedCostId(null);
    } else {
      await addJobCost(currentCostJob.id, {
        category: costCategory,
        name: costName.trim(),
        amount: Number(costAmount),
        notes: costNotes.trim() || undefined,
      });
    }

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

        {/* Financial KPI bar - Always on a single row */}
        <div className="bg-slate-100 dark:bg-slate-800/60 p-1 px-1.5 rounded-[6px] flex items-center justify-between gap-[3px] text-center text-[10px] sm:text-xs">
          <div className="flex-1 min-w-0">
            <span className="text-[8.5px] sm:text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold truncate">Prezzo</span>
            <strong className="font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold block truncate">
              € {formatNoDecimals(currentPrice)}
            </strong>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[8.5px] sm:text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold truncate">Spese</span>
            <strong className="font-mono text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-bold block truncate">
              -€ {formatNoDecimals(currentExpensesTotal)}
            </strong>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[8.5px] sm:text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold truncate">Manodopera</span>
            <strong className="font-mono text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-bold block truncate">
              -€ {formatNoDecimals(currentJobLabor.totalLaborCost)}
            </strong>
          </div>

          {currentIsNaturando && (
            <div className="flex-1 min-w-0">
              <span className="text-[8.5px] sm:text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold truncate">Naturando</span>
              <strong className="font-mono text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-bold block truncate">
                -€ {formatNoDecimals(currentNaturandoCost)}
              </strong>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="text-[8.5px] sm:text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-bold truncate">Margine</span>
            <strong
              className={`font-mono text-xs sm:text-sm font-bold block truncate ${
                currentNetMargin >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
              }`}
            >
              € {formatNoDecimals(currentNetMargin)}
            </strong>
          </div>
        </div>

        {/* Minimal Naturando Single-Row Card - Below Summary Bar */}
        <div
          className={`p-1 px-2 rounded-[6px] border flex items-center justify-between text-xs gap-[3px] transition-all ${
            currentIsNaturando
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/80 shadow-2xs'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src="https://www.iofall.it/Public%20Image/Ramovianatur_logo.svg"
              alt="Naturando"
              className="w-4 h-4 object-contain shrink-0 dark:brightness-0 dark:invert"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              Lavoro per Naturando
            </span>
          </div>

          <div className="flex items-center gap-[3px] shrink-0">
            {currentIsNaturando && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Importo (€)
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={currentNaturandoBase}
                  onChange={async (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    await updateJob({
                      ...currentCostJob,
                      naturandoAmount: val,
                    });
                  }}
                  className="w-16 p-0.5 px-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-emerald-600 text-center"
                />
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                const nextIsNaturando = !currentIsNaturando;
                await updateJob({
                  ...currentCostJob,
                  isNaturando: nextIsNaturando,
                  naturandoAmount:
                    nextIsNaturando && (!currentCostJob.naturandoAmount || currentCostJob.naturandoAmount === 0)
                      ? currentPrice
                      : currentCostJob.naturandoAmount,
                });
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border transition-colors cursor-pointer ${
                currentIsNaturando
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
              }`}
            >
              {currentIsNaturando ? 'SÌ' : 'NO'}
            </button>
          </div>
        </div>

        {/* SEZIONE MANODOPERA PER QUESTO CANTIERE */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 px-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Manodopera</span>
            </div>
            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
              -€ {formatNoDecimals(currentJobLabor.totalLaborCost)}
            </span>
          </div>

          {currentJobLabor.workers.length > 0 ? (
            <div className="space-y-[3px]">
              {currentJobLabor.workers.map((w) => (
                <div
                  key={w.workerId || w.workerName}
                  className="p-1 px-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs gap-[3px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{w.workerName}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border shrink-0 ${
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
                    -€ {formatNoDecimals(w.cost)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 py-1">Nessun operaio assegnato a questo intervento.</div>
          )}
        </div>

        {/* SEZIONE SPESE REGISTRATE */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-1.5 px-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <span>Spese Registrate ({currentCosts.length})</span>
            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
              -€ {formatNoDecimals(currentExpensesTotal)}
            </span>
          </div>

          {currentCosts.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded">
              Nessuna spesa di materiali o carburante registrata.
            </div>
          ) : (
            <div className="space-y-[3px]">
              {currentCosts.map((c) => {
                const catInfo = getCostCategoryInfo(c.category);
                const isLongPressed = longPressedCostId === c.id;
                const longPressProps = createCostLongPressProps(c.id);

                return (
                  <div
                    key={c.id}
                    {...longPressProps}
                    className={`p-1 px-2 bg-white dark:bg-slate-900 rounded border flex items-center justify-between text-xs gap-[3px] select-none transition-all cursor-pointer ${
                      isLongPressed
                        ? 'border-emerald-500 dark:border-emerald-500 ring-1 ring-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
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

                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 text-right">
                        -€ {formatNoDecimals(c.amount)}
                      </span>

                      {/* Icone Azioni Modifica ed Elimina */}
                      {isLongPressed && (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditCost(c);
                            }}
                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity cursor-pointer"
                            title="Modifica Spesa"
                            aria-label="Modifica Spesa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteJobCost(currentCostJob.id, c.id);
                              setLongPressedCostId(null);
                            }}
                            className="p-1 text-rose-600 dark:text-rose-400 hover:opacity-80 transition-opacity cursor-pointer"
                            title="Elimina Spesa"
                            aria-label="Elimina Spesa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form: Inserisci o Modifica Spesa */}
        <form onSubmit={handleAddOrUpdateCost} className="bg-slate-50 dark:bg-slate-800/50 p-1.5 px-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px] text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 pb-0.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {editingCost ? (
                <>
                  <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Modifica Spesa: <span className="font-normal text-slate-600 dark:text-slate-400">{editingCost.name}</span></span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Inserisci Nuova Spesa per l'Intervento</span>
                </>
              )}
            </div>
            {editingCost ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 underline font-semibold cursor-pointer"
              >
                Annulla
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(true)}
                className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="Registra manutenzione per un macchinario e addebita a questo intervento"
              >
                <Wrench className="w-3 h-3" />
                <span>+ Manutenzione Macchinario</span>
              </button>
            )}
          </div>

          {/* Categoria e Importo */}
          <div className="grid grid-cols-2 gap-[3px]">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="font-semibold block text-[11px]">Categoria *</label>
                <button
                  type="button"
                  onClick={() => setIsManagingCategories((prev) => !prev)}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-[3px] cursor-pointer"
                  title="Aggiungi o gestisci categorie di spesa"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>{isManagingCategories ? 'Chiudi' : 'Gestisci'}</span>
                </button>
              </div>

              <select
                value={costCategory}
                onChange={(e) => setCostCategory(e.target.value as JobCostCategory)}
                className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.label}>
                    {c.label}
                  </option>
                ))}
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
                className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold text-rose-600 dark:text-rose-400"
              />
            </div>
          </div>

          {/* Pannello Gestione Categorie Espandibile */}
          {isManagingCategories && (
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 border border-emerald-500/30 rounded space-y-[3px]">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomCategory();
                    }
                  }}
                  placeholder="Nome nuova categoria (es. Bar, Pasti, Noleggio)"
                  className="flex-1 p-1 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="p-1 px-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Aggiungi</span>
                </button>
              </div>

              {customCategoriesList.length > 0 && (
                <div className="space-y-[2px] pt-0.5">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                    Categorie personalizzate create:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {customCategoriesList.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-800 dark:text-slate-200"
                      >
                        <span className="truncate max-w-[120px]">{cat}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomCategory(cat, e)}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                          title={`Elimina ${cat}`}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="font-semibold block text-[11px] mb-0.5">Descrizione Spesa *</label>
            <input
              type="text"
              required
              value={costName}
              onChange={(e) => setCostName(e.target.value)}
              placeholder="es. 10L Benzina decespugliatore, 15 sacchi sfalcio, Colazione bar cantiere"
              className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-semibold block text-[11px] mb-0.5">Note Aggiuntive</label>
            <input
              type="text"
              value={costNotes}
              onChange={(e) => setCostNotes(e.target.value)}
              placeholder="es. Fornitore Eni / Agraria / Bar"
              className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-1.5 pt-0.5">
            {editingCost && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded font-bold text-xs cursor-pointer"
              >
                Annulla
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
            >
              {editingCost ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salva Modifiche</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi Spesa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Standalone Modal Per Aggiungere Manutenzione Macchinario Addebitandola all'Intervento */}
      {showMaintenanceModal && (
        <ManualMaintenanceModal
          onClose={() => setShowMaintenanceModal(false)}
          preselectedJobId={currentCostJob.id}
        />
      )}
    </div>
  );
};
