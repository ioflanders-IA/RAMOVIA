import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings2, X, Plus, Edit2, Trash2, Check } from 'lucide-react';
import {
  getCombinedCategoryList,
  getSavedCustomCategories,
  saveCustomCategories,
  saveRenamedCategory,
  isSameCategory,
  DEFAULT_CATEGORIES,
} from '../../utils/categoryUtils';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { expenses, jobs, updateExpense, updateJob } = useApp();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryOld, setEditingCategoryOld] = useState<string | null>(null);
  const [editingCategoryNew, setEditingCategoryNew] = useState('');
  const [savedCustom, setSavedCustom] = useState<string[]>(() => getSavedCustomCategories());

  const allCategoryOptions = useMemo(() => {
    return getCombinedCategoryList(expenses, jobs);
  }, [expenses, jobs, savedCustom]);

  if (!isOpen) return null;

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const current = getSavedCustomCategories();
    if (!current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...current, trimmed];
      saveCustomCategories(updated);
      setSavedCustom(updated);
    }
    setNewCategoryName('');
  };

  const startEditing = (categoryLabel: string) => {
    setEditingCategoryOld(categoryLabel);
    setEditingCategoryNew(categoryLabel);
  };

  const handleSaveRename = async (oldName: string) => {
    const trimmedNew = editingCategoryNew.trim();
    if (!trimmedNew || isSameCategory(trimmedNew, oldName)) {
      setEditingCategoryOld(null);
      return;
    }

    // 1. Save in renamed categories map
    saveRenamedCategory(oldName, trimmedNew);

    // 2. Update custom categories array in localStorage if custom
    const currentCustom = getSavedCustomCategories();
    const updatedCustom = currentCustom.map((c) =>
      isSameCategory(c, oldName) ? trimmedNew : c
    );
    if (
      !DEFAULT_CATEGORIES.some((dc) => isSameCategory(dc.label, trimmedNew)) &&
      !updatedCustom.some((c) => c.toLowerCase() === trimmedNew.toLowerCase())
    ) {
      updatedCustom.push(trimmedNew);
    }
    saveCustomCategories(updatedCustom);
    setSavedCustom(updatedCustom);

    // 3. Update existing expenses matching oldName
    const matchingExpenses = expenses.filter((e) => isSameCategory(e.category, oldName));
    for (const exp of matchingExpenses) {
      await updateExpense({
        ...exp,
        category: trimmedNew,
      });
    }

    // 4. Update existing job costs matching oldName
    for (const j of jobs) {
      if (j.costs && j.costs.some((c) => isSameCategory(c.category, oldName))) {
        const updatedCosts = j.costs.map((c) =>
          isSameCategory(c.category, oldName) ? { ...c, category: trimmedNew } : c
        );
        await updateJob({
          ...j,
          costs: updatedCosts,
        });
      }
    }

    setEditingCategoryOld(null);
    setEditingCategoryNew('');
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    const current = getSavedCustomCategories();
    const updated = current.filter((c) => c.toLowerCase() !== catToDelete.toLowerCase());
    saveCustomCategories(updated);
    setSavedCustom(updated);
  };

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/75 p-2 sm:p-3 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] max-w-md w-full p-2.5 sm:p-3 space-y-[4px] shadow-2xl max-h-[85vh] overflow-y-auto text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-2 px-3 rounded-[6px] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Settings2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="font-bold text-xs truncate">Gestione Categorie Spese & Costi</h3>
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

        {/* Input Nuova Categoria */}
        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-[6px] border border-slate-200 dark:border-slate-700 space-y-[3px]">
          <label className="font-semibold block text-slate-700 dark:text-slate-300 text-[11px]">
            Aggiungi Nuova Categoria
          </label>
          <div className="flex items-center gap-1.5">
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
              placeholder="es. Pranzo Lavoro, Materiali Edili, Noleggio"
              className="flex-1 p-1 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-xs cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crea</span>
            </button>
          </div>
        </div>

        {/* Lista Categorie Esistenti */}
        <div className="space-y-[3px]">
          <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider block pt-1">
            Tutte le Categorie Attive ({allCategoryOptions.length})
          </span>

          <div className="space-y-[3px] max-h-72 overflow-y-auto pr-0.5">
            {allCategoryOptions.map((cat) => {
              const isDefault = DEFAULT_CATEGORIES.some(
                (dc) => dc.label.toLowerCase() === cat.label.toLowerCase() || dc.id.toLowerCase() === cat.id.toLowerCase()
              );
              const isEditing = editingCategoryOld === cat.label;

              return (
                <div
                  key={cat.id}
                  className="p-1.5 px-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editingCategoryNew}
                        onChange={(e) => setEditingCategoryNew(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveRename(cat.label);
                          }
                        }}
                        className="flex-1 p-1 bg-white dark:bg-slate-900 border border-emerald-500 rounded text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(cat.label)}
                        className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer shrink-0"
                        title="Salva Rinomina"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryOld(null)}
                        className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded cursor-pointer shrink-0"
                        title="Annulla"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {cat.label}
                        </span>
                        {isDefault && (
                          <span className="text-[8.5px] uppercase font-bold text-slate-400 border border-slate-300 dark:border-slate-700 px-1 rounded shrink-0">
                            Predefinita
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditing(cat.label)}
                          className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Rinomina Categoria"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.label)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Elimina Categoria"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded text-xs cursor-pointer"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
};
