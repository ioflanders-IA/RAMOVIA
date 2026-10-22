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
      i.maintenanceIntervalHours > 0 &&
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
    <div className="space-y-[7px]">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-[7px]">
            <Package className="w-5 h-5 text-emerald-700" />
            <span>Magazzino, Attrezzature & Giacenze</span>
          </h1>
          <p className="text-xs text-slate-500 mt-[7px]">
            Monitoraggio scorte, registro ore di utilizzo macchine e calcolo automatico fabbisogni.
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <div className="flex items-center gap-[7px] shrink-0">
            <button
              onClick={() => {
                setNewCategoryType('material');
                setIsCreatingNew(true);
              }}
              className="flex items-center gap-[7px] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-[7px] shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Materiale</span>
            </button>
            <button
              onClick={() => {
                setNewCategoryType('equipment');
                setIsCreatingNew(true);
              }}
              className="flex items-center gap-[7px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-[7px] shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Attrezzatura</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[7px]">
        <div className="bg-white border border-slate-200 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Articoli a Magazzino
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 block">
            {inventory.length}
          </span>
          <span className="text-[11px] text-slate-400 block">
            {inventory.filter((i) => i.category === 'material').length} materiali ·{' '}
            {inventory.filter((i) => i.category === 'equipment').length} macchine
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Materiali Sotto Scorta
          </span>
          <span className={`text-xl font-bold font-mono block ${
            lowStockMaterials.length > 0 ? 'text-amber-700' : 'text-slate-900'
          }`}>
            {lowStockMaterials.length}
          </span>
          <span className="text-[11px] text-amber-700 font-medium block">Richiedono riordino</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Allarmi Manutenzione
          </span>
          <span className={`text-xl font-bold font-mono block ${
            equipmentAlerts.length > 0 ? 'text-rose-700' : 'text-slate-900'
          }`}>
            {equipmentAlerts.length}
          </span>
          <span className="text-[11px] text-rose-700 font-medium block">Ore limite raggiunte</span>
        </div>

        <div
          onClick={() => setActiveTab('shopping')}
          className="bg-emerald-50/70 border border-emerald-200 rounded-[7px] p-[7px] shadow-xs cursor-pointer hover:bg-emerald-100/50 transition-colors space-y-[7px]"
        >
          <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider block flex items-center justify-between">
            <span>Lista della Spesa</span>
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
          </span>
          <span className="text-xl font-bold font-mono text-emerald-950 block">
            {shoppingList.length} articoli
          </span>
          <span className="text-[11px] text-emerald-800 font-medium block">Calcolati da cantieri</span>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px] border-b border-slate-200 pb-[7px]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-[7px] bg-slate-100 p-[7px] rounded-[7px] flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tutti ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
              activeTab === 'materials' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Materiali & Concimi
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
              activeTab === 'equipment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attrezzature & Macchine
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors flex items-center gap-[7px] ${
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
              placeholder="Cerca per articolo o marca..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-[7px] shadow-xs focus:outline-emerald-600"
            />
          </div>
        )}
      </div>

      {/* TAB CONTENT: SHOPPING LIST (LISTA DELLA SPESA / DA ACQUISTARE) */}
      {activeTab === 'shopping' ? (
        <div className="bg-white border border-slate-200 rounded-[7px] p-[7px] shadow-xs space-y-[7px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[7px] border-b border-slate-200 pb-[7px]">
            <div>
              <div className="flex items-center gap-[7px]">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-[7px]">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Lista della Spesa Automatica
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-[7px]">
                Generata dal confronto tra le giacenze attuali e i materiali necessari per gli interventi programmati.
              </p>
            </div>

            <button
              onClick={handlePrintShoppingList}
              className="flex items-center gap-[7px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-[7px] shrink-0 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Lista Spesa</span>
            </button>
          </div>

          {shoppingList.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs space-y-[7px]">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <p>Nessun articolo da riordinare al momento. Scorte sufficienti per i lavori pianificati.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-[7px] overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Articolo da Acquistare</th>
                    <th className="py-2.5 px-2 text-right">Giacenza Attuale</th>
                    <th className="py-2.5 px-2 text-right">Soglia Minima</th>
                    <th className="py-2.5 px-2 text-right">Richiesti dai Cantieri</th>
                    <th className="py-2.5 px-3 text-right">Quantità da Ordinare</th>
                    <th className="py-2.5 px-2 text-center">Urgenza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shoppingList.map((item) => (
                    <tr key={item.itemId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{item.name}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                        {item.minThreshold} {item.unit}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-sky-700 font-semibold">
                        {item.neededForScheduledJobs} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                        + {item.toOrder} {item.unit}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-[7px] text-[10px] font-bold ${
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
      ) : filteredInventory.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[7px] p-[7px] text-center space-y-[7px] shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-[7px] bg-slate-100 flex items-center justify-center text-slate-400">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-[7px]">
              <h3 className="text-sm font-bold text-slate-800">Nessun articolo a magazzino</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchTerm
                  ? 'Nessun risultato corrispondente ai criteri di ricerca inseriti.'
                  : 'Il magazzino è attualmente vuoto. Inserisci i materiali da consumo (concimi, sementi, terriccio) o le macchine (tosaerba, decespugliatori) per monitorare scorte e manutenzioni.'}
              </p>
            </div>
            {currentUser?.role === 'admin' && !searchTerm && (
              <div className="pt-2 flex items-center justify-center gap-[7px] flex-wrap">
                <button
                  onClick={() => {
                    setNewCategoryType('material');
                    setIsCreatingNew(true);
                  }}
                  className="inline-flex items-center gap-[7px] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-[7px] shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Aggiungi Materiale</span>
                </button>
                <button
                  onClick={() => {
                    setNewCategoryType('equipment');
                    setIsCreatingNew(true);
                  }}
                  className="inline-flex items-center gap-[7px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-[7px] shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Aggiungi Attrezzatura</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[7px]">
          {filteredInventory.map((item) => {
            const isEquipment = item.category === 'equipment';
            const isLowStock = !isEquipment && item.quantity <= item.minThreshold;
            const isMaintenanceAlert =
              isEquipment &&
              item.maintenanceIntervalHours > 0 &&
              item.currentUsageHours >= item.maintenanceIntervalHours;

            const usagePercent =
              isEquipment && item.maintenanceIntervalHours > 0
                ? Math.min(100, Math.round((item.currentUsageHours / item.maintenanceIntervalHours) * 100))
                : 0;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-[7px] p-[7px] shadow-xs transition-all flex flex-col justify-between space-y-[7px] ${
                  isMaintenanceAlert
                    ? 'border-rose-300 ring-2 ring-rose-50'
                    : isLowStock
                    ? 'border-amber-300 ring-2 ring-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-[7px]">
                  {/* Category icon & actions */}
                  <div className="flex items-start justify-between gap-[7px]">
                    <span
                      className={`inline-flex items-center gap-[7px] px-2 py-0.5 rounded-[7px] text-[10px] font-bold uppercase tracking-wider ${
                        isEquipment
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {isEquipment ? <Wrench className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                      {isEquipment ? 'Attrezzatura' : 'Materiale'}
                    </span>

                    {currentUser?.role === 'admin' && (
                      <div className="flex items-center gap-[7px]">
                        <button
                          onClick={() => setSelectedItemForEdit(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-[7px]"
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
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-[7px]"
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
                    <div className="p-[7px] bg-slate-50 border border-slate-200/80 rounded-[7px] space-y-[7px]">
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
                        <div className="pt-1 flex items-center gap-[7px] text-[11px] text-amber-800 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Sotto scorta minima! Inserito nella lista spesa.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Equipment Specific View */}
                  {isEquipment && (
                    <div className="p-[7px] bg-slate-50 border border-slate-200/80 rounded-[7px] space-y-[7px]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Ore di lavoro:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {item.currentUsageHours}h / {item.maintenanceIntervalHours}h
                        </span>
                      </div>

                      {/* Usage bar */}
                      <div className="w-full bg-slate-200 rounded-[7px] h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-[7px] transition-all ${
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
                        <div className="flex items-center gap-[7px] text-[11px] text-slate-600">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Assegnato: <strong>{item.assignedWorkerName}</strong></span>
                        </div>
                      )}

                      {isMaintenanceAlert && (
                        <div className="p-[7px] bg-rose-50 border border-rose-200 rounded-[7px] text-rose-900 text-xs flex items-center gap-[7px]">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            <strong>Manutenzione richiesta!</strong> Ore limite raggiunte.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="pt-[7px] border-t border-slate-100 flex items-center justify-between text-xs">
                  {isEquipment ? (
                    currentUser?.role === 'admin' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const confirmService = prompt(
                            `Inserisci le nuove ore per ${item.name} dopo la manutenzione (default 0 per reset):`,
                            '0'
                          );
                          if (confirmService !== null) {
                            recordEquipmentMaintenance(item.id, parseInt(confirmService) || 0);
                          }
                        }}
                        className="flex items-center gap-[7px] px-2.5 py-1 text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-slate-200 rounded-[7px] font-medium transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Registra Manutenzione</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">
                        Stato: {item.status === 'available' ? 'Disponibile' : 'In Manutenzione'}
                      </span>
                    )
                  ) : (
                    currentUser?.role === 'admin' && (
                      <div className="flex items-center gap-[7px]">
                        <button
                          onClick={() =>
                            updateInventoryItem({
                              ...item,
                              quantity: Math.max(0, item.quantity - 1),
                            })
                          }
                          className="w-6 h-6 rounded-[7px] bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700"
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
                          className="w-6 h-6 rounded-[7px] bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700"
                        >
                          +
                        </button>
                      </div>
                    )
                  )}
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
