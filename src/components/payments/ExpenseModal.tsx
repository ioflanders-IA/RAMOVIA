import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, PaymentMethod } from '../../types';
import { X, Plus, Receipt, Settings2, Trash2 } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CATEGORIES: { id: string; label: string }[] = [
  { id: 'carburante', label: 'Carburante' },
  { id: 'manutenzione', label: 'Manutenzione Attrezzature' },
  { id: 'materiale', label: 'Materiali Cantiere' },
  { id: 'attrezzatura', label: 'Nuova Attrezzatura' },
  { id: 'smaltimento', label: 'Smaltimento / Discarica' },
  { id: 'generale', label: 'Spese Generali' },
];

const STORAGE_KEY = 'ramovia_custom_expense_categories';

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  const { addExpense } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('carburante');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('contanti');
  const [vendor, setVendor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Categories Management
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customCategories));
    } catch (e) {
      console.error('Errore nel salvataggio categorie personalizzate:', e);
    }
  }, [customCategories]);

  if (!isOpen) return null;

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const existsInDefault = DEFAULT_CATEGORIES.some(
      (c) => c.label.toLowerCase() === trimmed.toLowerCase() || c.id.toLowerCase() === trimmed.toLowerCase()
    );
    const existsInCustom = customCategories.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );

    if (!existsInDefault && !existsInCustom) {
      setCustomCategories((prev) => [...prev, trimmed]);
      setCategory(trimmed);
    } else {
      setCategory(trimmed);
    }
    setNewCategoryName('');
  };

  const handleDeleteCustomCategory = (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomCategories((prev) => prev.filter((c) => c !== catToDelete));
    if (category === catToDelete) {
      setCategory('carburante');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!title.trim() || !numAmount || numAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        title: title.trim(),
        amount: Number(numAmount),
        category: category as ExpenseCategory,
        paymentMethod,
        recipientOrVendor: vendor.trim() || undefined,
        date,
        status: 'paid',
      });
      setTitle('');
      setAmount('');
      setVendor('');
      setCategory('carburante');
      setPaymentMethod('contanti');
      setIsManagingCategories(false);
      onClose();
    } catch (err) {
      console.error('Errore durante il salvataggio della spesa:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-[6px] backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] max-w-md w-full p-[6px] space-y-[4px] sm:space-y-[6px] shadow-2xl">
        {/* Header */}
        <div className="bg-slate-900 text-white p-[6px] px-2.5 rounded-[6px] flex items-center justify-between">
          <div className="flex items-center gap-[6px]">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs tracking-wide">Registra Spesa Operativa</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-[6px] space-y-[4px] sm:space-y-[6px] text-xs">
          {/* Descrizione */}
          <div className="space-y-[3px]">
            <label className="font-semibold block text-slate-700 dark:text-slate-300">
              Descrizione Spesa *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Carburante rasaerba, Acquisto concime"
              className="w-full p-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Importo e Data */}
          <div className="grid grid-cols-2 gap-[4px] sm:gap-[6px]">
            <div className="space-y-[3px]">
              <label className="font-semibold block text-slate-700 dark:text-slate-300">
                Importo (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full p-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] font-mono font-bold text-rose-600 dark:text-rose-400 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-[3px]">
              <label className="font-semibold block text-slate-700 dark:text-slate-300">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Categoria e Modalità Pagamento */}
          <div className="grid grid-cols-2 gap-[4px] sm:gap-[6px]">
            <div className="space-y-[3px]">
              <div className="flex items-center justify-between">
                <label className="font-semibold block text-slate-700 dark:text-slate-300">
                  Categoria
                </label>
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <optgroup label="Categorie Predefinite">
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                {customCategories.length > 0 && (
                  <optgroup label="Categorie Personalizzate">
                    {customCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="space-y-[3px]">
              <label className="font-semibold block text-slate-700 dark:text-slate-300">
                Modalità Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="contanti">Contanti</option>
                <option value="pos_carta">POS / Carta di Credito</option>
                <option value="bonifico">Bonifico Bancario</option>
                <option value="assegno">Assegno</option>
                <option value="riba_30_60">RiBa 30/60 gg</option>
              </select>
            </div>
          </div>

          {/* Pannello Gestione Categorie Espandibile */}
          {isManagingCategories && (
            <div className="p-[6px] bg-slate-100 dark:bg-slate-800/80 border border-emerald-500/30 rounded-[6px] space-y-[4px]">
              <div className="flex items-center gap-[4px]">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  placeholder="Nome nuova categoria (es. Pasti, Noleggio)"
                  className="flex-1 p-[4px] px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[4px] text-slate-900 dark:text-slate-100 text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="p-[4px] px-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[4px] text-[11px] font-bold cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Aggiungi</span>
                </button>
              </div>

              {customCategories.length > 0 && (
                <div className="space-y-[3px] pt-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                    Categorie personalizzate create:
                  </span>
                  <div className="flex flex-wrap gap-[4px] max-h-24 overflow-y-auto">
                    {customCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-800 dark:text-slate-200"
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

          {/* Fornitore / Esercente */}
          <div className="space-y-[3px]">
            <label className="font-semibold block text-slate-700 dark:text-slate-300">
              Fornitore / Esercente (Opzionale)
            </label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="es. Eni Station / Agraria Monza"
              className="w-full p-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Bottoni Annulla / Salva */}
          <div className="pt-1 flex justify-end gap-[6px]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[6px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-xs"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-[6px] flex items-center gap-1 transition-colors shadow-xs cursor-pointer text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Salvataggio...' : 'Salva Spesa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
