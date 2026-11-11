import React, { useState, useMemo } from 'react';
import { InventoryItem, Job } from '../../types';
import {
  Wrench,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  User,
  Plus,
  Truck,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';

interface EquipmentDetailModalProps {
  item: InventoryItem;
  jobs: Job[];
  onClose: () => void;
  onOpenMaintenance?: (item: InventoryItem) => void;
}

const IT_MONTHS_SHORT = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'DIC'];

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

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  item,
  jobs,
  onClose,
  onOpenMaintenance,
}) => {
  const [activeTab, setActiveTab] = useState<'usage' | 'maintenance'>('usage');

  // Calcolo cronologia utilizzi nei cantieri
  const usageHistory = useMemo(() => {
    return jobs
      .filter((j) => {
        return (j.equipmentRequired || []).some(
          (eq) =>
            eq.itemId === item.id ||
            (eq.name && item.name && eq.name.trim().toLowerCase() === item.name.trim().toLowerCase())
        );
      })
      .map((j) => {
        const req = (j.equipmentRequired || []).find(
          (eq) =>
            eq.itemId === item.id ||
            (eq.name && item.name && eq.name.trim().toLowerCase() === item.name.trim().toLowerCase())
        );
        return {
          jobId: j.id,
          jobTitle: j.title,
          clientName: j.clientName,
          clientAddress: j.clientAddress,
          date: j.date || '',
          hoursUsed: req?.hoursUsed || 0,
          assignedWorkerName: j.assignedWorkerName || '',
          status: j.status,
        };
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [jobs, item]);

  const totalJobHours = useMemo(() => {
    return usageHistory.reduce((s, u) => s + (Number(u.hoursUsed) || 0), 0);
  }, [usageHistory]);

  const maintenances = useMemo(() => {
    const list = item.maintenanceHistory || [];
    return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [item.maintenanceHistory]);

  const totalMaintenanceCost = useMemo(() => {
    return maintenances.reduce((s, m) => s + (Number(m.cost) || 0), 0);
  }, [maintenances]);

  const isMaintenanceAlert =
    item.maintenanceIntervalHours > 0 &&
    item.currentUsageHours >= item.maintenanceIntervalHours;

  const usagePercent =
    item.maintenanceIntervalHours > 0
      ? Math.min(100, Math.round((item.currentUsageHours / item.maintenanceIntervalHours) * 100))
      : 0;

  // Gestione logo brand
  const isBrandUrl = item.brand && (item.brand.toLowerCase().includes('http://') || item.brand.toLowerCase().includes('https://'));
  const cleanBrand = isBrandUrl ? '' : (item.brand || '').trim();
  const brandLogo =
    item.brandLogoUrl?.trim() ||
    (isBrandUrl ? item.brand?.trim() : null) ||
    (cleanBrand.toLowerCase() === 'stihl'
      ? 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Stihl_Logo.svg/3840px-Stihl_Logo.svg.png?utm_source=it.wikipedia.org&utm_campaign=index&utm_content=thumbnail'
      : null);

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/75 p-2 sm:p-3 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-lg w-full p-[3px] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header compatto a 3PX */}
        <div className="bg-slate-900 text-white p-2 px-2.5 rounded-[6px] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-8 h-8 rounded-[5px] object-cover border border-slate-700 bg-slate-800 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-[5px] bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-xs truncate leading-tight">{item.name}</h3>
              <div className="flex items-center gap-2 pt-0.5">
                {brandLogo ? (
                  <img
                    src={brandLogo}
                    alt={cleanBrand || item.name}
                    className="h-3 max-w-[50px] object-contain"
                  />
                ) : cleanBrand ? (
                  <span className="text-[10px] text-slate-400 font-medium">{cleanBrand}</span>
                ) : null}
                {item.assignedWorkerName && (
                  <span className="text-[9.5px] text-emerald-400 flex items-center gap-0.5">
                    <Truck className="w-2.5 h-2.5" />
                    <span>{item.assignedWorkerName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onOpenMaintenance && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMaintenance(item);
                }}
                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[5px] font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                title="Registra manutenzione per questo attrezzo"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Manutenzione</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-[5px] cursor-pointer transition-colors"
              title="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="p-1 space-y-[3px] overflow-y-auto flex-1">
          {/* KPI Strip: 4 card su un rigo con grafica a 3PX */}
          <div className="grid grid-cols-4 gap-[3px] w-full text-center">
            {/* Ore Lavoro Attuali */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-1 px-1 rounded-[5px] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[8px] font-bold uppercase text-slate-400 truncate">Ore Lavoro</span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                {item.currentUsageHours}h
              </span>
              <span className="text-[8px] text-slate-400 truncate">
                lim. {item.maintenanceIntervalHours}h
              </span>
            </div>

            {/* Uscite Cantieri */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-1 px-1 rounded-[5px] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[8px] font-bold uppercase text-slate-400 truncate">Cantieri</span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                {usageHistory.length}
              </span>
              <span className="text-[8px] text-slate-400 truncate">
                tot {totalJobHours}h
              </span>
            </div>

            {/* Manutenzioni eseguite */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-1 px-1 rounded-[5px] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[8px] font-bold uppercase text-slate-400 truncate">Manutenzioni</span>
              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                {maintenances.length}
              </span>
              <span className="text-[8px] text-slate-400 truncate">
                {totalMaintenanceCost > 0 ? `€ ${Math.round(totalMaintenanceCost)}` : '0 spese'}
              </span>
            </div>

            {/* Stato Operativo */}
            <div className={`p-1 px-1 rounded-[5px] border flex flex-col justify-between ${
              isMaintenanceAlert
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
            }`}>
              <span className="text-[8px] font-bold uppercase opacity-80 truncate">Stato</span>
              <span className="text-[10px] font-extrabold truncate">
                {isMaintenanceAlert ? 'Allarme' : 'Operativo'}
              </span>
              <span className="text-[8px] opacity-75 truncate">
                {isMaintenanceAlert ? 'Manut. obblig.' : `${usagePercent}% ciclo`}
              </span>
            </div>
          </div>

          {/* Barra d'uso / manutenzione progress */}
          <div className="p-1 px-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-[5px] border border-slate-200/70 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>Avanzamento ciclo manutenzione:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {item.currentUsageHours}h / {item.maintenanceIntervalHours}h ({usagePercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 100
                    ? 'bg-rose-600'
                    : usagePercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, usagePercent)}%` }}
              />
            </div>
          </div>

          {/* Tab Navigation: Utilizzi vs Manutenzioni (senza parola cronologia e senza numeretti) */}
          <div className="grid grid-cols-2 gap-[3px] pt-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('usage')}
              className={`py-1.5 px-2 text-xs font-bold rounded-[5px] border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'usage'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Utilizzi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('maintenance')}
              className={`py-1.5 px-2 text-xs font-bold rounded-[5px] border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'maintenance'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Manutenzioni</span>
            </button>
          </div>

          {/* TAB 1: UTILIZZI */}
          {activeTab === 'usage' && (
            <div className="space-y-[3px]">
              {usageHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-[5px] border border-slate-100 dark:border-slate-800">
                  Nessun utilizzo in cantiere registrato finora per questo macchinario.
                </div>
              ) : (
                usageHistory.map((u, idx) => {
                  const dm = formatDayAndMonth(u.date);
                  return (
                    <div
                      key={u.jobId + '_' + idx}
                      className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[5px] flex items-center justify-between text-xs gap-2 hover:border-emerald-500/50 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Data badge con larghezza fissa (non si sposta in base a giorno/mese) */}
                        <div className="w-12 shrink-0 font-mono flex items-baseline gap-1">
                          <span className="w-5 text-right text-sm font-black text-emerald-700 dark:text-emerald-400 leading-none">
                            {dm.day}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase text-slate-500">
                            {dm.month}
                          </span>
                        </div>

                        {/* Dettagli cantiere ordinati e perfettamente allineati */}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                            {u.clientName || u.jobTitle}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {u.jobTitle}
                          </div>
                          {u.assignedWorkerName && (
                            <div className="text-[9.5px] text-slate-400 flex items-center gap-1 truncate pt-0.5">
                              <User className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{u.assignedWorkerName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ore usate */}
                      <div className="text-right shrink-0">
                        <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-[4px] font-mono font-bold text-[11px]">
                          {u.hoursUsed}h
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: MANUTENZIONI */}
          {activeTab === 'maintenance' && (
            <div className="space-y-[3px]">
              {maintenances.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-[5px] border border-slate-100 dark:border-slate-800 space-y-2">
                  <p>Nessun intervento di manutenzione registrato per questa attrezzatura.</p>
                  {onOpenMaintenance && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenMaintenance(item);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[5px] text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Registra la prima manutenzione</span>
                    </button>
                  )}
                </div>
              ) : (
                maintenances.map((m) => {
                  const dm = formatDayAndMonth(m.date);
                  return (
                    <div
                      key={m.id}
                      className="p-1 px-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[5px] space-y-[2px] hover:border-amber-500/50 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Data badge con larghezza fissa (non si sposta in base a giorno/mese) */}
                          <div className="w-12 shrink-0 font-mono flex items-baseline gap-1">
                            <span className="w-5 text-right text-sm font-black text-amber-600 dark:text-amber-400 leading-none">
                              {dm.day}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase text-slate-500">
                              {dm.month}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                              {m.description}
                            </div>
                            {m.jobTitle && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                Cantiere: {m.jobTitle}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Costo se registrato */}
                        {m.cost !== undefined && m.cost > 0 && (
                          <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400 shrink-0">
                            -€ {Math.round(m.cost)}
                          </span>
                        )}
                      </div>

                      {/* Dettagli extra se presenti: ore dopo reset e note */}
                      {(m.newHours !== undefined || m.notes) && (
                        <div className="pt-0.5 flex items-center justify-between text-[9.5px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                          {m.newHours !== undefined && (
                            <span>Ore resettate a: <strong className="font-mono text-slate-600 dark:text-slate-300">{m.newHours}h</strong></span>
                          )}
                          {m.notes && <span className="italic truncate max-w-[200px]">{m.notes}</span>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
