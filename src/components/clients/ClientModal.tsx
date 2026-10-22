import React, { useState } from 'react';
import { Client } from '../../types';
import { X, Check } from 'lucide-react';

interface ClientModalProps {
  client?: Client | null;
  onClose: () => void;
  onSave: (clientData: any) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({ client, onClose, onSave }) => {
  const [name, setName] = useState(client?.name || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [address, setAddress] = useState(client?.address || '');
  const [lat, setLat] = useState<number>(client?.lat || 45.65);
  const [lng, setLng] = useState<number>(client?.lng || 9.32);

  // Garden Notes
  const [squareMeters, setSquareMeters] = useState<number>(client?.gardenNotes.squareMeters || 500);
  const [irrigationDetails, setIrrigationDetails] = useState(client?.gardenNotes.irrigationDetails || '');
  const [delicatePlants, setDelicatePlants] = useState(client?.gardenNotes.delicatePlants || '');
  const [gateCode, setGateCode] = useState(client?.gardenNotes.gateCode || '');
  const [dogPresent, setDogPresent] = useState<boolean>(client?.gardenNotes.dogPresent || false);
  const [notes, setNotes] = useState(client?.gardenNotes.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      phone,
      email,
      address,
      lat: Number(lat),
      lng: Number(lng),
      gardenNotes: {
        squareMeters: Number(squareMeters),
        irrigationDetails,
        delicatePlants,
        gateCode,
        dogPresent,
        notes,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold">
            {client ? 'Modifica Scheda Cliente & Giardino' : 'Nuovo Cliente & Cantiere Giardino'}
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
          {/* Anagrafica Base */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Dati Committente
            </h3>

            <div>
              <label className="font-medium text-slate-600 block mb-1">Nome Cliente / Cantiere *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Villa Visconti"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-600 block mb-1">Telefono *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-600 block mb-1">Indirizzo Cantiere *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Via Roma 12"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-600 block mb-1">Latitudine</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="font-medium text-slate-600 block mb-1">Longitudine</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Scheda Tecnica Giardino */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
              Caratteristiche Tecniche Giardino & Accesso
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-600 block mb-1">Superficie Giardino (mq)</label>
                <input
                  type="number"
                  value={squareMeters}
                  onChange={(e) => setSquareMeters(parseInt(e.target.value) || 0)}
                  placeholder="es. 850"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Codice Cancello / Citofono</label>
                <input
                  type="text"
                  value={gateCode}
                  onChange={(e) => setGateCode(e.target.value)}
                  placeholder="#1234 o Int. 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50/80 border border-amber-200 rounded-lg">
              <input
                type="checkbox"
                id="dogPresentCheck"
                checked={dogPresent}
                onChange={(e) => setDogPresent(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="dogPresentCheck" className="text-xs font-semibold text-amber-950 cursor-pointer">
                Presenza Cani in Giardino
              </label>
            </div>

            <div>
              <label className="font-medium text-slate-600 block mb-1">Dettagli Impianto Irrigazione</label>
              <input
                type="text"
                value={irrigationDetails}
                onChange={(e) => setIrrigationDetails(e.target.value)}
                placeholder="es. 6 zone a scomparsa + centralina"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-medium text-slate-600 block mb-1">Essenze e Piante Delicate</label>
              <textarea
                rows={2}
                value={delicatePlants}
                onChange={(e) => setDelicatePlants(e.target.value)}
                placeholder="es. Acero palmato, aiuola rose..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-medium text-slate-600 block mb-1">Note Aggiuntive e Accessibilità</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="es. Punto acqua nel retro..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salva Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
