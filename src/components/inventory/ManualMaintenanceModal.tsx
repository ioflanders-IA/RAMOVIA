import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, Job } from '../../types';
import { Wrench, X, Check, Calendar, DollarSign, RotateCcw, Briefcase, FileText } from 'lucide-react';

interface ManualMaintenanceModalProps {
  equipmentItem?: InventoryItem | null;
  preselectedJobId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

const PRESET_DESCRIPTIONS = [
  'Affilatura catena',
  'Cambio olio & filtro',
  'Sostituzione candela',
  'Riparazione lama',
  'Ingrassaggio testina',
  'Revisione generale',
  'Sostituzione filo/rocchetto',
];

export const ManualMaintenanceModal: React.FC<ManualMaintenanceModalProps> = ({
  equipmentItem,
  preselectedJobId,
  onClose,
  onSaved,
}) => {
  const { inventory, jobs, recordEquipmentMaintenance } = useApp();

  const equipmentList = useMemo(() => {
    return inventory.filter((i) => i.category === 'equipment');
  }, [inventory]);

  const [selectedItemId, setSelectedItemId] = useState<string>(
    equipmentItem?.id || (equipmentList.length > 0 ? equipmentList[0].id : '')
  );

  const activeEquipment = useMemo(() => {
    return inventory.find((i) => i.id === selectedItemId) || equipmentItem || null;
  }, [inventory, selectedItemId, equipmentItem]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState<string>(todayStr);
  const [description, setDescription] = useState<string>('Affilatura catena');
  const [cost, setCost] = useState<number>(25);
  const [resetHours, setResetHours] = useState<boolean>(true);
  const [customHours, setCustomHours] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const [selectedJobId, setSelectedJobId] = useState<string>(preselectedJobId || '');
  const [chargeToJob, setChargeToJob] = useState<boolean>(!!preselectedJobId);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter available jobs sorted by date descending
  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [jobs]);

  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !description.trim()) return;

    try {
      setIsSubmitting(true);
      const newUsageHours = resetHours ? 0 : Math.max(0, Number(customHours) || 0);

      await recordEquipmentMaintenance(selectedItemId, {
        newUsageHours,
        date,
        description: description.trim(),
        cost: Number(cost) || 0,
        jobId: chargeToJob && selectedJobId ? selectedJobId : undefined,
        jobTitle: chargeToJob && selectedJob ? `${selectedJob.clientName} - ${selectedJob.title}` : undefined,
        notes: notes.trim() || undefined,
        chargeToJob: chargeToJob && !!selectedJobId && Number(cost) > 0,
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving manual maintenance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/75 p-2 sm:p-3 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-lg w-full p-2.5 sm:p-3 space-y-[3px] shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-2 px-3 rounded-[6px] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="font-bold text-xs truncate">
              {activeEquipment ? `Manutenzione: ${activeEquipment.name}` : 'Registra Manutenzione Attrezzatura'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 shrink-0 cursor-pointer"
            title="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-[3px] text-xs pt-1">
          {/* Seleziona Attrezzo se non bloccato */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
            <label className="font-semibold block text-[11px] text-slate-700 dark:text-slate-300">
              Attrezzatura / Macchinario *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 font-medium"
              required
            >
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} {eq.brand ? `(${eq.brand})` : ''} - Ore attuali: {eq.currentUsageHours}h / {eq.maintenanceIntervalHours}h
                </option>
              ))}
            </select>

            {activeEquipment && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Ore attuali prima del reset: <strong className="font-mono text-slate-800 dark:text-slate-200">{activeEquipment.currentUsageHours}h</strong></span>
                {activeEquipment.lastMaintenanceDate && (
                  <span>Ultima manutenzione: <strong className="font-mono text-slate-700 dark:text-slate-300">{activeEquipment.lastMaintenanceDate}</strong></span>
                )}
              </div>
            )}
          </div>

          {/* Dettagli Manutenzione: Data & Costo */}
          <div className="grid grid-cols-2 gap-[3px]">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
              <label className="font-semibold block text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-600" />
                <span>Data Esecuzione *</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
              <label className="font-semibold block text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-amber-500" />
                <span>Costo Manutenzione (€)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                placeholder="es. 30"
                className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono font-bold text-rose-600 dark:text-rose-400"
              />
            </div>
          </div>

          {/* Descrizione Intervento / Tipo */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
            <label className="font-semibold block text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FileText className="w-3 h-3 text-emerald-600" />
              <span>Tipo di Manutenzione Eseguita *</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="es. Affilatura catena motosega, cambio lama rasaerba"
              className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium"
            />

            {/* Quick preset tags */}
            <div className="flex flex-wrap gap-1 pt-1">
              {PRESET_DESCRIPTIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDescription(preset)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                    description === preset
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Ore di lavoro & Reset */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetHours}
                  onChange={(e) => setResetHours(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <RotateCcw className="w-3 h-3 text-emerald-600" />
                <span>Azzera ore di lavoro a 0h (Reset manutenzione)</span>
              </label>
            </div>

            {!resetHours && (
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Imposta ore residue manuali:</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={customHours}
                  onChange={(e) => setCustomHours(parseFloat(e.target.value) || 0)}
                  className="w-20 p-1 text-center font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
                />
                <span className="text-[11px] text-slate-500">ore</span>
              </div>
            )}
          </div>

          {/* Collegamento Intervento (Addebito Spesa al Cantiere) */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
            <div className="flex items-center justify-between pb-0.5">
              <label className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chargeToJob}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setChargeToJob(checked);
                    if (checked && !selectedJobId && sortedJobs.length > 0) {
                      setSelectedJobId(sortedJobs[0].id);
                    }
                  }}
                  className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                <span>Addebita il costo come spesa all'intervento</span>
              </label>
              {chargeToJob && cost > 0 && (
                <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  -€ {Math.round(cost)}
                </span>
              )}
            </div>

            {chargeToJob && (
              <div className="pt-1 space-y-[3px]">
                <label className="font-semibold block text-[10.5px] text-slate-500">
                  Seleziona Intervento (Cantiere) di riferimento:
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 font-medium"
                  required={chargeToJob}
                >
                  <option value="">-- Seleziona un intervento --</option>
                  {sortedJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.date} | {j.clientName} - {j.title}
                    </option>
                  ))}
                </select>

                <p className="text-[10px] text-slate-500 italic">
                  Il costo verrà automaticamente aggiunto come voce di spesa nella gestione costi dell'intervento selezionato.
                </p>
              </div>
            )}
          </div>

          {/* Note Opzionali */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
            <label className="font-semibold block text-[11px] text-slate-700 dark:text-slate-300">
              Note Aggiuntive (Officina, ricambi utilizzati)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Officina Agraria, catena Stihl nuova montata"
              className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs"
            />
          </div>

          {/* Bottoni Azione */}
          <div className="flex items-center justify-end gap-1.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-bold text-xs cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedItemId || !description.trim()}
              className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Salvataggio...' : 'Salva Manutenzione'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
