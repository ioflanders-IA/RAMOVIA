import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryCategory, InventoryItem } from '../../types';
import { InventoryModal } from './InventoryModal';
import {
  Package,
  Wrench,
  AlertTriangle,
  Plus,
  Search,
  ShoppingCart,
  CheckCircle,
  Truck,
  RotateCcw,
  Edit2,
  Trash2,
  Printer,
  Sparkles,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    inventory,
    shoppingList,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    recordEquipmentMaintenance,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'materials' | 'equipment' | 'shopping'>(
    'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<InventoryItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState<InventoryCategory>('material');

  // Filtered lists
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === 'materials') return item.category === 'material';
    if (activeTab === 'equipment') return item.category === 'equipment';
    return true;
  });

  const equipmentAlerts = inventory.filter(
    (i) =>
      i.category === 'equipment' &&
      i.maintenanceIntervalHours &&
      i.currentUsageHours &&
      i.currentUsageHours >= i.maintenanceIntervalHours
  );

  const lowStockMaterials = inventory.filter(
    (i) => i.category === 'material' && i.quantity <= i.minThreshold
  );

  const handleSaveItem = (itemData: any) => {
    if (selectedItemForEdit) {
      updateInventoryItem({ ...selectedItemForEdit, ...itemData });
      setSelectedItemForEdit(null);
    } else {
      addInventoryItem(itemData);
      setIsCreatingNew(false);
    }
  };

  const handlePrintShoppingList = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-700" />
            <span>Magazzino, Attrezzature & Giacenze</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tracciamento consumabili furgone, registro ore macchine e generazione automatica lista della spesa.
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setNewCategoryType('material');
                setIsCreatingNew(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Materiale</span>
            </button>
            <button
              onClick={() => {
                setNewCategoryType('equipment');
                setIsCreatingNew(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Attrezzatura</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Articoli a Magazzino
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {inventory.length}
          </span>
          <span className="text-[11px] text-slate-400">
            {inventory.filter((i) => i.category === 'material').length} materiali ·{' '}
            {inventory.filter((i) => i.category === 'equipment').length} macchine
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Materiali Sotto Scorta
          </span>
          <span className={`text-xl font-bold font-mono mt-1 block ${
            lowStockMaterials.length > 0 ? 'text-amber-700' : 'text-slate-900'
          }`}>
            {lowStockMaterials.length}
          </span>
          <span className="text-[11px] text-amber-700 font-medium">Richiedono riordino</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Allarmi Manutenzione
          </span>
          <span className={`text-xl font-bold font-mono mt-1 block ${
            equipmentAlerts.length > 0 ? 'text-rose-700' : 'text-slate-900'
          }`}>
            {equipmentAlerts.length}
          </span>
          <span className="text-[11px] text-rose-700 font-medium">Ore limite superate</span>
        </div>

        <div
          onClick={() => setActiveTab('shopping')}
          className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 shadow-xs cursor-pointer hover:bg-emerald-100/50 transition-colors"
        >
          <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider block flex items-center justify-between">
            <span>Lista della Spesa</span>
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
          </span>
          <span className="text-xl font-bold font-mono text-emerald-950 mt-1 block">
            {shoppingList.length} articoli
          </span>
          <span className="text-[11px] text-emerald-800 font-medium">Calcolati da cantieri</span>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tutti ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'materials' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Materiali & Concimi
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'equipment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attrezzature & Macchine
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'shopping'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-emerald-900 hover:text-emerald-950 font-bold'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Lista Spesa</span>
            {shoppingList.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'shopping' ? 'bg-emerald-600 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {shoppingList.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        {activeTab !== 'shopping' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per modello o marca..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg shadow-xs focus:outline-emerald-600"
            />
          </div>
        )}
      </div>

      {/* TAB CONTENT: SHOPPING LIST (LISTA DELLA SPESA / DA ACQUISTARE) */}
      {activeTab === 'shopping' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Lista della Spesa Automatica per Fornitori & Consorzio
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Generata automaticamente confrontando le giacenze attuali con i fabbisogni degli interventi programmati questa settimana.
              </p>
            </div>

            <button
              onClick={handlePrintShoppingList}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Lista d'Acquisto</span>
            </button>
          </div>

          {shoppingList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              Nessun articolo da riordinare al momento. Tutte le scorte sono sufficienti per i lavori pianificati!
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Articolo da Acquistare</th>
                    <th className="py-2.5 px-3 text-right">Giacenza Attuale</th>
                    <th className="py-2.5 px-3 text-right">Soglia Minima</th>
                    <th className="py-2.5 px-3 text-right">Necessari Cantieri</th>
                    <th className="py-2.5 px-4 text-right">Quantità da Ordinare</th>
                    <th className="py-2.5 px-3 text-center">Urgenza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shoppingList.map((item) => (
                    <tr key={item.itemId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {item.minThreshold} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sky-700 font-semibold">
                        {item.neededForScheduledJobs} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 text-sm">
                        + {item.toOrder} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.urgency === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.urgency === 'high' ? 'ALTA PRIORITÀ' : 'MEDIA'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD INVENTORY GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => {
            const isEquipment = item.category === 'equipment';
            const isLowStock = !isEquipment && item.quantity <= item.minThreshold;
            const isMaintenanceAlert =
              isEquipment &&
              item.maintenanceIntervalHours &&
              item.currentUsageHours &&
              item.currentUsageHours >= item.maintenanceIntervalHours;

            const usagePercent =
              isEquipment && item.maintenanceIntervalHours && item.currentUsageHours
                ? Math.min(100, Math.round((item.currentUsageHours / item.maintenanceIntervalHours) * 100))
                : 0;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between ${
                  isMaintenanceAlert
                    ? 'border-rose-300 ring-2 ring-rose-50'
                    : isLowStock
                    ? 'border-amber-300 ring-2 ring-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Category icon & actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isEquipment
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {isEquipment ? <Wrench className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                      {isEquipment ? 'Attrezzatura' : 'Materiale'}
                    </span>

                    {currentUser.role === 'admin' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedItemForEdit(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          title="Modifica"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare l'articolo ${item.name}?`)) {
                              deleteInventoryItem(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Elimina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.name}</h3>
                  {item.brand && (
                    <div className="text-[11px] text-slate-500 font-medium">{item.brand}</div>
                  )}

                  {/* Material Specific View */}
                  {!isEquipment && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Giacenza a magazzino</span>
                        <span className="text-base font-bold font-mono text-slate-900">
                          {item.quantity} <span className="text-xs text-slate-500 font-normal">{item.unit}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Soglia minima scorta:</span>
                        <span className="font-mono font-medium">{item.minThreshold} {item.unit}</span>
                      </div>

                      {isLowStock && (
                        <div className="pt-1 flex items-center gap-1 text-[11px] text-amber-800 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Sotto scorta minima! Inserito nella lista spesa.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Equipment Specific View */}
                  {isEquipment && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Ore di lavoro:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {item.currentUsageHours}h / {item.maintenanceIntervalHours}h
                        </span>
                      </div>

                      {/* Usage bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
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

                      {item.assignedWorkerName && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Assegnato: <strong>{item.assignedWorkerName}</strong></span>
                        </div>
                      )}

                      {isMaintenanceAlert && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            <strong>Manutenzione Scaduta!</strong> Cambio olio / affilatura lame obbligatoria.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {isEquipment ? (
                    currentUser.role === 'admin' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const confirmService = prompt(
                            `Inserisci le nuove ore di conteggio per ${item.name} dopo il tagliando (default 0 per azzeramento):`,
                            '0'
                          );
                          if (confirmService !== null) {
                            recordEquipmentMaintenance(item.id, parseInt(confirmService) || 0);
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Registra Tagliando / Manutenzione</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">
                        Stato: {item.status === 'available' ? 'In Servizio' : 'Fermo Macchina'}
                      </span>
                    )
                  ) : (
                    currentUser.role === 'admin' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateInventoryItem({
                              ...item,
                              quantity: Math.max(0, item.quantity - 1),
                            })
                          }
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700"
                        >
                          -
                        </button>
                        <button
                          onClick={() =>
                            updateInventoryItem({
                              ...item,
                              quantity: item.quantity + 1,
                            })
                          }
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700"
                        >
                          +
                        </button>
                      </div>
                    )
                  )}

                  {currentUser.role === 'admin' && item.unitCost ? (
                    <span className="font-mono text-slate-500 text-[11px]">
                      €{item.unitCost} / {item.unit}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inventory Item Modal */}
      {(isCreatingNew || selectedItemForEdit) && (
        <InventoryModal
          item={selectedItemForEdit}
          defaultCategory={newCategoryType}
          onClose={() => {
            setIsCreatingNew(false);
            setSelectedItemForEdit(null);
          }}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
};
