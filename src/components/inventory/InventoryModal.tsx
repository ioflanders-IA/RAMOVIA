import React, { useState } from 'react';
import { InventoryCategory, InventoryItem, InventoryUnit } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Check, ClipboardPaste } from 'lucide-react';

interface InventoryModalProps {
  item?: InventoryItem | null;
  defaultCategory?: InventoryCategory;
  onClose: () => void;
  onSave: (itemData: any) => void;
}

const STIHL_LOGO_URL =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Stihl_Logo.svg/3840px-Stihl_Logo.svg.png?utm_source=it.wikipedia.org&utm_campaign=index&utm_content=thumbnail';

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
  const [brandLogoUrl, setBrandLogoUrl] = useState<string>(item?.brandLogoUrl || '');
  const [imageUrl, setImageUrl] = useState<string>(item?.imageUrl || '');
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

  const handlePasteImageUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setImageUrl(text.trim());
      }
    } catch {
      const fallback = window.prompt("Incolla qui l'URL dell'immagine del prodotto:");
      if (fallback && fallback.trim()) {
        setImageUrl(fallback.trim());
      }
    }
  };

  const handlePasteBrandLogoUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setBrandLogoUrl(text.trim());
      }
    } catch {
      const fallback = window.prompt("Incolla qui l'URL del logo del marchio / produttore:");
      if (fallback && fallback.trim()) {
        setBrandLogoUrl(fallback.trim());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const assignedWorker = users.find((u) => u.uid === assignedToWorkerId);
    const effectiveBrandLogo =
      brandLogoUrl.trim() ||
      (brand.trim().toLowerCase() === 'stihl' ? STIHL_LOGO_URL : undefined);

    onSave({
      name,
      category,
      brand,
      brandLogoUrl: effectiveBrandLogo,
      imageUrl: imageUrl.trim() || undefined,
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
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[7px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-2 space-y-[7px]">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-[7px] px-3 flex items-center justify-between border-b border-slate-800">
          <h2 className="text-sm font-bold text-white">
            {item ? 'Modifica Articolo Magazzino' : 'Nuovo Articolo Magazzino / Attrezzatura'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[7px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-[7px] space-y-[7px] text-xs text-slate-700 dark:text-slate-300">
          <div className="space-y-[7px]">
            <label className="font-semibold text-slate-600 dark:text-slate-300 block">Categoria Articolo</label>
            <div className="grid grid-cols-2 gap-[7px]">
              <button
                type="button"
                onClick={() => setCategory('material')}
                className={`py-1.5 text-center rounded-[7px] border font-semibold transition-colors cursor-pointer ${
                  category === 'material'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                Consumabile
              </button>
              <button
                type="button"
                onClick={() => setCategory('equipment')}
                className={`py-1.5 text-center rounded-[7px] border font-semibold transition-colors cursor-pointer ${
                  category === 'equipment'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                Attrezzatura
              </button>
            </div>
          </div>

          <div className="space-y-[7px]">
            <label className="font-semibold text-slate-600 dark:text-slate-300 block">Descrizione / Modello *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Tosaerba semovente o Concime prato"
              className="w-full p-[7px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-[7px] focus:outline-emerald-600"
            />
          </div>

          {/* Immagine Prodotto con tasto solo icona Incolla */}
          <div className="space-y-[3px]">
            <label className="font-semibold text-slate-600 dark:text-slate-300 block text-[11px]">
              Immagine Prodotto
            </label>
            <div className="flex items-center gap-[6px]">
              {imageUrl ? (
                <div className="relative w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 cursor-pointer"
                    title="Rimuovi"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : null}

              <div className="relative flex-1 flex items-center">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Incolla URL immagine (https://...)"
                  className="w-full p-[7px] pr-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-[7px] focus:outline-emerald-600 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handlePasteImageUrl}
                  className="absolute right-1 p-1 rounded-[5px] bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  title="Incolla URL dagli appunti"
                >
                  <ClipboardPaste className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Produttore / Marchio con supporto Logo e tasto Incolla */}
          <div className="space-y-[3px]">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-600 dark:text-slate-300 block text-xs">
                Produttore / Marchio
              </label>
              <span className="text-[10px] text-slate-400">
                (Incolla logo o digita Stihl)
              </span>
            </div>

            <div className="flex items-center gap-[6px]">
              {/* Logo Preview */}
              {(brandLogoUrl || (brand.trim().toLowerCase() === 'stihl')) ? (
                <div className="relative h-9 px-1.5 py-0.5 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <img
                    src={brandLogoUrl || STIHL_LOGO_URL}
                    alt={brand || 'Logo'}
                    className="h-5 max-w-[70px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setBrandLogoUrl('')}
                    className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 cursor-pointer"
                    title="Rimuovi logo"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : null}

              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBrand(val);
                    if (val.trim().toLowerCase() === 'stihl' && !brandLogoUrl) {
                      setBrandLogoUrl(STIHL_LOGO_URL);
                    }
                  }}
                  placeholder="es. Stihl, Honda..."
                  className="w-full p-[7px] pr-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-[7px] text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={handlePasteBrandLogoUrl}
                  className="absolute right-1 p-1 rounded-[5px] bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  title="Incolla URL logo marchio dagli appunti"
                >
                  <ClipboardPaste className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[7px]">
            <div className="space-y-[7px]">
              <label className="font-semibold text-slate-600 dark:text-slate-300 block">Giacenza *</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full p-[7px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[7px] font-mono font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-[7px]">
              <label className="font-semibold text-slate-600 dark:text-slate-300 block">Unità</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as InventoryUnit)}
                className="w-full p-[7px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[7px] text-slate-900 dark:text-slate-100"
              >
                <option value="pz">Pezzi (pz)</option>
                <option value="sacchi">Sacchi</option>
                <option value="lt">Litri (lt)</option>
                <option value="kg">Chilogrammi (kg)</option>
                <option value="rotoli">Rotoli</option>
              </select>
            </div>

            <div className="space-y-[7px]">
              <label className="font-semibold text-slate-600 dark:text-slate-300 block">Soglia Min *</label>
              <input
                type="number"
                required
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseFloat(e.target.value) || 0)}
                className="w-full p-[7px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[7px] font-mono text-amber-700 dark:text-amber-400 font-bold"
              />
            </div>
          </div>

          {/* Attrezzatura Specific Fields */}
          {category === 'equipment' && (
            <div className="p-[7px] bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-[7px] space-y-[7px]">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px]">
                Manutenzione & Assegnazione
              </span>

              <div className="space-y-[7px]">
                <label className="font-medium text-slate-600 dark:text-slate-300 block">Assegnato all'Operaio</label>
                <select
                  value={assignedToWorkerId}
                  onChange={(e) => setAssignedToWorkerId(e.target.value)}
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-[7px]"
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

              {/* Caselle ore perfettamente allineate orizzontalmente */}
              <div className="grid grid-cols-2 gap-[7px] items-end">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block text-xs h-[28px] flex items-end pb-1 leading-tight">
                    Intervallo Manutenzione (Ore)
                  </label>
                  <input
                    type="number"
                    value={maintenanceIntervalHours}
                    onChange={(e) => setMaintenanceIntervalHours(parseInt(e.target.value) || 50)}
                    className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-[7px] font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block text-xs h-[28px] flex items-end pb-1 leading-tight">
                    Ore Uso Attuali
                  </label>
                  <input
                    type="number"
                    value={currentUsageHours}
                    onChange={(e) => setCurrentUsageHours(parseInt(e.target.value) || 0)}
                    className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-[7px] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-[7px]">
                <label className="font-medium text-slate-600 dark:text-slate-300 block">Stato Operativo</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-[7px] font-medium"
                >
                  <option value="available">Disponibile</option>
                  <option value="maintenance">In Manutenzione</option>
                </select>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-[7px] border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-[7px]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[7px] font-medium cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold shadow-xs flex items-center gap-[7px] cursor-pointer"
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
