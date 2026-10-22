import React, { useState } from 'react';
import { Job, WorkReport } from '../../types';
import { useApp } from '../../context/AppContext';
import { SignaturePad } from '../report/SignaturePad';
import {
  X,
  Camera,
  Package,
  Clock,
  UserCheck,
  CheckCircle2,
  Upload,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReportSubmissionModalProps {
  job: Job;
  initialHours?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportSubmissionModal: React.FC<ReportSubmissionModalProps> = ({
  job,
  initialHours = 3.5,
  onClose,
  onSuccess,
}) => {
  const { currentUser, inventory, submitWorkReport } = useApp();

  const [hours, setHours] = useState<number>(initialHours);
  const [trackingType, setTrackingType] = useState<'timer' | 'manual'>('timer');
  const [startTime, setStartTime] = useState<string>('08:30');
  const [endTime, setEndTime] = useState<string>('12:15');

  // Materials used state initialized with job requirements
  const [materialsUsed, setMaterialsUsed] = useState<
    { itemId: string; name: string; qty: number; unit: string }[]
  >(() => {
    return (job.materialsRequired || []).map((req) => ({
      itemId: req.itemId,
      name: req.name,
      qty: req.qtyNeeded,
      unit: req.unit,
    }));
  });

  // Selected additional material from inventory
  const [selectedExtraMatId, setSelectedExtraMatId] = useState<string>('');

  // Photos: empty by default, loaded from camera/file
  const [photoBefore, setPhotoBefore] = useState<string>('');
  const [photoAfter, setPhotoAfter] = useState<string>('');

  // Signature & Notes
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [clientSigneeName, setClientSigneeName] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');

  // Add extra material
  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExtraMatId) return;
    const item = inventory.find((i) => i.id === selectedExtraMatId);
    if (!item) return;

    if (materialsUsed.some((m) => m.itemId === item.id)) {
      setMaterialsUsed((prev) =>
        prev.map((m) => (m.itemId === item.id ? { ...m, qty: m.qty + 1 } : m))
      );
    } else {
      setMaterialsUsed((prev) => [
        ...prev,
        { itemId: item.id, name: item.name, qty: 1, unit: item.unit },
      ]);
    }
    setSelectedExtraMatId('');
  };

  const handleUpdateMaterialQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setMaterialsUsed((prev) => prev.filter((m) => m.itemId !== itemId));
    } else {
      setMaterialsUsed((prev) =>
        prev.map((m) => (m.itemId === itemId ? { ...m, qty: newQty } : m))
      );
    }
  };

  // Image Upload helpers
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'before' | 'after'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'before') setPhotoBefore(result);
        else setPhotoAfter(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signatureDataUrl) {
      setErrorMsg('Per favore fai apporre la firma al cliente prima di chiudere il rapportino.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    submitWorkReport({
      jobId: job.id,
      jobTitle: job.title,
      clientId: job.clientId,
      clientName: job.clientName,
      clientAddress: job.clientAddress,
      workerId: currentUser.uid,
      workerName: currentUser.displayName,
      date: today,
      startTime,
      endTime,
      totalHours: hours,
      trackingType,
      photosBefore: photoBefore ? [photoBefore] : [],
      photosAfter: photoAfter ? [photoAfter] : [],
      materialsUsed,
      signatureDataUrl,
      clientSigneeName: clientSigneeName || 'Cliente',
      clientNotes,
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#1b4332', '#f97316'],
      });
    } catch {
      // ignore
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block">
              Compilazione Rapportino
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white">{job.clientName}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Timesheet / Ore Lavorate */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                Ore Lavorate (Timesheet)
              </span>

              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTrackingType('timer')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    trackingType === 'timer' ? 'bg-emerald-700 text-white' : 'text-slate-600'
                  }`}
                >
                  Timer
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingType('manual')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    trackingType === 'manual' ? 'bg-emerald-700 text-white' : 'text-slate-600'
                  }`}
                >
                  Manuale
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 font-medium block mb-1">Inizio</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium block mb-1">Fine</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium block mb-1">Ore Totali</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.5"
                  max="14"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold text-emerald-800 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Materiali Utilizzati dal Magazzino Furgone */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" />
                Materiali Utilizzati (Scarico Magazzino)
              </span>
            </div>

            <div className="space-y-2">
              {materialsUsed.map((mat) => (
                <div
                  key={mat.itemId}
                  className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <span className="font-medium text-slate-800 flex-1">{mat.name}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={mat.qty}
                      onChange={(e) =>
                        handleUpdateMaterialQty(mat.itemId, parseFloat(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1 text-right font-mono bg-white border border-slate-300 rounded-md text-xs font-semibold"
                    />
                    <span className="text-slate-500 w-10 text-xs">{mat.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Extra Material from Available Stock */}
            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedExtraMatId}
                onChange={(e) => setSelectedExtraMatId(e.target.value)}
                className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="">+ Aggiungi materiale utilizzato...</option>
                {inventory
                  .filter((i) => i.category === 'material')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.quantity} {m.unit} disponibili)
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg"
              >
                Aggiungi
              </button>
            </div>
          </div>

          {/* Section 3: Foto Prima / Dopo */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-700" />
              Documentazione Fotografica Cantiere
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Foto Prima */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                  <span>Foto Iniziale (Prima)</span>
                  <label className="cursor-pointer text-slate-600 hover:text-emerald-700 flex items-center gap-1 text-[11px]">
                    <Upload className="w-3 h-3" />
                    <span>{photoBefore ? 'Cambia' : 'Carica'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileUpload(e, 'before')}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-200 relative border border-slate-300 flex items-center justify-center">
                  {photoBefore ? (
                    <img
                      src={photoBefore}
                      alt="Prima"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 p-4 text-center">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="text-[11px]">Scatta o carica foto prima</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleFileUpload(e, 'before')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Foto Dopo */}
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <span>Foto Finale (Dopo)</span>
                  <label className="cursor-pointer text-slate-600 hover:text-emerald-700 flex items-center gap-1 text-[11px]">
                    <Upload className="w-3 h-3" />
                    <span>{photoAfter ? 'Cambia' : 'Carica'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileUpload(e, 'after')}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-200 relative border border-slate-300 flex items-center justify-center">
                  {photoAfter ? (
                    <img
                      src={photoAfter}
                      alt="Dopo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 p-4 text-center">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="text-[11px]">Scatta o carica foto dopo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleFileUpload(e, 'after')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Note Intervento */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Note sull'Intervento & Osservazioni
            </label>
            <textarea
              rows={2}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Inserisci note o dettagli sull'intervento eseguito..."
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600"
            />
          </div>

          {/* Section 5: Firma Digitale del Cliente */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                Firma di Accettazione del Cliente
              </span>
            </div>

            <div className="mb-2">
              <input
                type="text"
                placeholder="Nome e cognome di chi firma a schermo..."
                value={clientSigneeName}
                onChange={(e) => setClientSigneeName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-emerald-600"
              />
            </div>

            <SignaturePad onSaveSignature={(dataUrl) => setSignatureDataUrl(dataUrl)} />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Conferma e Invia Rapportino</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
