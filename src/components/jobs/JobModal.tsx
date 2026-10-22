import React, { useState } from 'react';
import { Job, JobStatus, MaterialRequirement } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Check, Trash2, Package } from 'lucide-react';

interface JobModalProps {
  job?: Job | null;
  initialDate?: string;
  onClose: () => void;
  onSave: (jobData: any) => void;
}

export const JobModal: React.FC<JobModalProps> = ({ job, initialDate, onClose, onSave }) => {
  const { clients, users, inventory } = useApp();

  const [clientId, setClientId] = useState<string>(job?.clientId || clients[0]?.id || '');
  const [assignedWorkerId, setAssignedWorkerId] = useState<string>(
    job?.assignedWorkerId || users.find((u) => u.role === 'worker')?.uid || ''
  );
  const [date, setDate] = useState<string>(
    job?.date || initialDate || new Date().toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState<string>(job?.timeSlot || '08:30 - 12:30');
  const [status, setStatus] = useState<JobStatus>(job?.status || 'scheduled');
  const [title, setTitle] = useState<string>(job?.title || '');
  const [description, setDescription] = useState<string>(job?.description || '');
  const [notes, setNotes] = useState<string>(job?.notes || '');

  // Materials Required
  const [materialsRequired, setMaterialsRequired] = useState<MaterialRequirement[]>(
    job?.materialsRequired || []
  );
  const [selectedMatId, setSelectedMatId] = useState<string>('');
  const [selectedMatQty, setSelectedMatQty] = useState<number>(1);

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedWorker = users.find((u) => u.uid === assignedWorkerId);

  const handleAddMaterial = () => {
    if (!selectedMatId) return;
    const invItem = inventory.find((i) => i.id === selectedMatId);
    if (!invItem) return;

    if (materialsRequired.some((m) => m.itemId === invItem.id)) {
      setMaterialsRequired((prev) =>
        prev.map((m) =>
          m.itemId === invItem.id ? { ...m, qtyNeeded: m.qtyNeeded + selectedMatQty } : m
        )
      );
    } else {
      setMaterialsRequired((prev) => [
        ...prev,
        {
          itemId: invItem.id,
          name: invItem.name,
          qtyNeeded: selectedMatQty,
          unit: invItem.unit,
        },
      ]);
    }
    setSelectedMatId('');
    setSelectedMatQty(1);
  };

  const handleRemoveMaterial = (itemId: string) => {
    setMaterialsRequired((prev) => prev.filter((m) => m.itemId !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedWorker) return;

    onSave({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientAddress: selectedClient.address,
      clientPhone: selectedClient.phone,
      lat: selectedClient.lat,
      lng: selectedClient.lng,
      assignedWorkerId: selectedWorker.uid,
      assignedWorkerName: selectedWorker.displayName,
      date,
      timeSlot,
      status,
      title,
      description,
      notes,
      materialsRequired,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold">
            {job ? 'Modifica Intervento' : 'Pianifica Nuovo Intervento'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          
          {/* Client Selection */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Committente / Cantiere *</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-emerald-600"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.address} ({c.gardenNotes.squareMeters} mq)
                </option>
              ))}
            </select>
          </div>

          {/* Worker, Date, TimeSlot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Operaio Assegnato *</label>
              <select
                required
                value={assignedWorkerId}
                onChange={(e) => setAssignedWorkerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-emerald-600"
              >
                {users
                  .filter((u) => u.role === 'worker')
                  .map((w) => (
                    <option key={w.uid} value={w.uid}>
                      {w.displayName}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Data Intervento *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fascia Oraria</label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="es. 08:30 - 12:30"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Titolo Intervento *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Sfalcio prato e potatura siepe"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-emerald-600 font-semibold"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descrizione Intervento</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dettagli lavorazione..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Note per l'Operaio</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Attenzione cancelli o istruzioni speciali..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          {/* Materials Required Section */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-700" />
              Materiali Richiesti dal Magazzino
            </span>

            {materialsRequired.length > 0 && (
              <div className="space-y-1.5">
                {materialsRequired.map((mat) => (
                  <div
                    key={mat.itemId}
                    className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <span className="font-medium text-slate-800">{mat.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-800">
                        {mat.qtyNeeded} {mat.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(mat.itemId)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selector to add requirement */}
            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedMatId}
                onChange={(e) => setSelectedMatId(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value="">Seleziona materiale da associare...</option>
                {inventory
                  .filter((i) => i.category === 'material')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.quantity} {m.unit} disponibili)
                    </option>
                  ))}
              </select>

              <input
                type="number"
                min="1"
                value={selectedMatQty}
                onChange={(e) => setSelectedMatQty(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-right"
              />

              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs"
              >
                Aggiungi
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="pt-2 border-t border-slate-200">
            <label className="font-semibold text-slate-700 block mb-1">Stato Lavoro</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            >
              <option value="scheduled">Programmato</option>
              <option value="in_progress">In Corso</option>
              <option value="completed">Completato</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salva Intervento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
