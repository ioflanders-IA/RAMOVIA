import React, { useState } from 'react';
import { InventoryCategory, InventoryItem, InventoryUnit } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Check } from 'lucide-react';

interface InventoryModalProps {
  item?: InventoryItem | null;
  defaultCategory?: InventoryCategory;
  onClose: () => void;
  onSave: (itemData: any) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  item,
  defaultCategory = 'material',
  onClose,
  onSave,
}) => {
  const { users } = useApp();

  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState<InventoryCategory>(item?.category || defaultCategory);
  const [brand, setBrand] = useState(item?.brand || '');
  const [quantity, setQuantity] = useState<number>(item?.quantity ?? 10);
  const [unit, setUnit] = useState<InventoryUnit>(item?.unit || 'pz');
  const [minThreshold, setMinThreshold] = useState<number>(item?.minThreshold ?? 5);

  // Equipment specific
  const [assignedToWorkerId, setAssignedToWorkerId] = useState<string>(item?.assignedToWorkerId || '');
  const [maintenanceIntervalHours, setMaintenanceIntervalHours] = useState<number>(
    item?.maintenanceIntervalHours ?? 50
  );
  const [currentUsageHours, setCurrentUsageHours] = useState<number>(item?.currentUsageHours ?? 0);
  const [status, setStatus] = useState<'available' | 'maintenance'>(item?.status || 'available');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const assignedWorker = users.find((u) => u.uid === assignedToWorkerId);

    onSave({
      name,
      category,
      brand,
      quantity: Number(quantity),
      unit,
      minThreshold: Number(minThreshold),
      assignedToWorkerId: assignedToWorkerId || null,
      assignedWorkerName: assignedWorker ? assignedWorker.displayName : undefined,
      maintenanceIntervalHours: category === 'equipment' ? Number(maintenanceIntervalHours) : 0,
      currentUsageHours: category === 'equipment' ? Number(currentUsageHours) : 0,
      status: category === 'equipment' ? status : 'available',
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-[7px] overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-[7px] shadow-2xl border border-slate-200 overflow-hidden my-2 space-y-[7px]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-[7px] px-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">
            {item ? 'Modifica Articolo Magazzino' : 'Nuovo Articolo Magazzino / Attrezzatura'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[7px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-[7px] space-y-[7px] text-xs text-slate-700">
          <div className="space-y-[7px]">
            <label className="font-semibold text-slate-600 block">Categoria Articolo</label>
            <div className="grid grid-cols-2 gap-[7px]">
              <button
                type="button"
                onClick={() => setCategory('material')}
                className={`py-1.5 text-center rounded-[7px] border font-semibold transition-colors ${
                  category === 'material'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Materiale / Consumabile
              </button>
              <button
                type="button"
                onClick={() => setCategory('equipment')}
                className={`py-1.5 text-center rounded-[7px] border font-semibold transition-colors ${
                  category === 'equipment'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Attrezzatura / Macchina
              </button>
            </div>
          </div>

          <div className="space-y-[7px]">
            <label className="font-semibold text-slate-600 block">Descrizione / Modello *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Tosaerba semovente o Concime prato"
              className="w-full p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] focus:outline-emerald-600"
            />
          </div>

          <div className="space-y-[7px]">
            <label className="font-semibold text-slate-600 block">Produttore / Marchio</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="es. Stihl, Honda..."
              className="w-full p-[7px] bg-slate-50 border border-slate-200 rounded-[7px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-[7px]">
            <div className="space-y-[7px]">
              <label className="font-semibold text-slate-600 block">Giacenza *</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] font-mono font-bold text-slate-900"
              />
            </div>

            <div className="space-y-[7px]">
              <label className="font-semibold text-slate-600 block">Unità</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as InventoryUnit)}
                className="w-full p-[7px] bg-slate-50 border border-slate-200 rounded-[7px]"
              >
                <option value="pz">Pezzi (pz)</option>
                <option value="sacchi">Sacchi</option>
                <option value="lt">Litri (lt)</option>
                <option value="kg">Chilogrammi (kg)</option>
                <option value="rotoli">Rotoli</option>
              </select>
            </div>

            <div className="space-y-[7px]">
              <label className="font-semibold text-slate-600 block">Soglia Min *</label>
              <input
                type="number"
                required
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseFloat(e.target.value) || 0)}
                className="w-full p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] font-mono text-amber-800"
              />
            </div>
          </div>

          {/* Attrezzatura Specific Fields */}
          {category === 'equipment' && (
            <div className="p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] space-y-[7px]">
              <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
                Manutenzione & Assegnazione
              </span>

              <div className="space-y-[7px]">
                <label className="font-medium text-slate-600 block">Assegnato all'Operaio</label>
                <select
                  value={assignedToWorkerId}
                  onChange={(e) => setAssignedToWorkerId(e.target.value)}
                  className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px]"
                >
                  <option value="">Non assegnato</option>
                  {users
                    .filter((u) => u.role === 'worker')
                    .map((w) => (
                      <option key={w.uid} value={w.uid}>
                        {w.displayName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-[7px]">
                <div className="space-y-[7px]">
                  <label className="font-medium text-slate-600 block">Intervallo Manutenzione (Ore)</label>
                  <input
                    type="number"
                    value={maintenanceIntervalHours}
                    onChange={(e) => setMaintenanceIntervalHours(parseInt(e.target.value) || 50)}
                    className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] font-mono"
                  />
                </div>

                <div className="space-y-[7px]">
                  <label className="font-medium text-slate-600 block">Ore Uso Attuali</label>
                  <input
                    type="number"
                    value={currentUsageHours}
                    onChange={(e) => setCurrentUsageHours(parseInt(e.target.value) || 0)}
                    className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-[7px]">
                <label className="font-medium text-slate-600 block">Stato Operativo</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-[7px] bg-white border border-slate-200 rounded-[7px] font-medium"
                >
                  <option value="available">Disponibile</option>
                  <option value="maintenance">In Manutenzione</option>
                </select>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-[7px] border-t border-slate-200 flex items-center justify-end gap-[7px]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-[7px] font-medium"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold shadow-xs flex items-center gap-[7px]"
            >
              <Check className="w-4 h-4" />
              <span>Salva in Magazzino</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
