import React, { useState } from 'react';
import { Client, PolygonPoint, PaymentMethod } from '../../types';
import { X, Check, MapPin, Palette } from 'lucide-react';
import { ClientMapPicker } from './ClientMapPicker';
import { RichNoteBox } from '../common/RichNoteBox';
import { CLIENT_COLOR_OPTIONS, getClientColor } from '../../utils/clientColors';

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
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<PaymentMethod>(client?.preferredPaymentMethod || 'bonifico');
  const [vatOrTaxCode, setVatOrTaxCode] = useState(client?.vatOrTaxCode || '');
  const [color, setColor] = useState<string>(() => client?.color || getClientColor(client));
  const [lat, setLat] = useState<number>(client?.lat || 45.65);
  const [lng, setLng] = useState<number>(client?.lng || 9.32);

  // Garden Notes
  const [squareMeters, setSquareMeters] = useState<number>(client?.gardenNotes?.squareMeters ?? 500);
  const [irrigationDetails, setIrrigationDetails] = useState(client?.gardenNotes?.irrigationDetails || '');
  const [delicatePlants, setDelicatePlants] = useState(client?.gardenNotes?.delicatePlants || '');
  const [gateCode, setGateCode] = useState(client?.gardenNotes?.gateCode || '');
  const [dogPresent, setDogPresent] = useState<boolean>(client?.gardenNotes?.dogPresent || false);
  const [notes, setNotes] = useState(client?.gardenNotes?.notes || '');
  const [polygonPoints, setPolygonPoints] = useState<PolygonPoint[]>(
    client?.gardenNotes?.polygonPoints || []
  );

  const handleLocationChange = (newLat: number, newLng: number, newAddress?: string) => {
    setLat(newLat);
    setLng(newLng);
    if (newAddress) {
      setAddress(newAddress);
    }
  };

  const handlePolygonChange = (points: PolygonPoint[], calculatedMq: number) => {
    setPolygonPoints(points);
    if (calculatedMq > 0) {
      setSquareMeters(calculatedMq);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      preferredPaymentMethod: preferredPaymentMethod || 'bonifico',
      vatOrTaxCode: vatOrTaxCode.trim(),
      color: color.trim() || undefined,
      lat: Number(lat) || 45.65,
      lng: Number(lng) || 9.32,
      gardenNotes: {
        squareMeters: Number(squareMeters) || 0,
        irrigationDetails: irrigationDetails || '',
        delicatePlants: delicatePlants || '',
        gateCode: gateCode || '',
        dogPresent: Boolean(dogPresent),
        notes: notes || '',
        polygonPoints: polygonPoints || [],
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-[7px] overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[7px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-2 max-h-[94vh] flex flex-col space-y-[7px]">
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-[7px] px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-[7px]">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold">
              {client ? 'Modifica Scheda Cliente & Giardino' : 'Nuovo Cliente & Cantiere Giardino'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[7px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-[7px] overflow-y-auto space-y-[7px] text-xs text-slate-700 dark:text-slate-300">
          
          {/* Section 1: Anagrafica Base */}
          <div className="space-y-[7px] bg-slate-50 dark:bg-slate-800/50 p-[7px] rounded-[7px] border border-slate-200 dark:border-slate-700/60">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>📋 Dati Committente & Ubicazione</span>
            </h3>

            <div className="space-y-[7px]">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Nome Cliente / Cantiere *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Condominio Le Rose / Villa Visconti"
                className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[7px] focus:outline-emerald-600 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-[7px] bg-white dark:bg-slate-900 p-[7px] rounded-[7px] border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                  <Palette className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Colore Identificativo (Mappa & Calendario)</span>
                </label>

                {/* Live Preview Badge */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 font-medium">Anteprima:</span>
                  <div
                    className="w-5 h-5 rounded-[4px] text-white font-bold text-[10px] flex items-center justify-center shadow-2xs"
                    style={{ backgroundColor: color }}
                  >
                    {(name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold truncate max-w-[100px]" style={{ color }}>
                    {name || 'Cliente'}
                  </span>
                </div>
              </div>

              {/* Swatches Grid */}
              <div className="flex flex-wrap items-center gap-1.5">
                {CLIENT_COLOR_OPTIONS.map((opt) => {
                  const isSelected = color.toLowerCase() === opt.hex.toLowerCase();
                  return (
                    <button
                      key={opt.hex}
                      type="button"
                      onClick={() => setColor(opt.hex)}
                      title={`${opt.name} (${opt.hex})`}
                      className={`w-6 h-6 rounded-[5px] transition-all flex items-center justify-center cursor-pointer relative ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-slate-900 scale-110 shadow-xs'
                          : 'hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: opt.hex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  );
                })}

                {/* Custom Color Input */}
                <label
                  title="Scegli colore personalizzato"
                  className="h-6 px-2 rounded-[5px] border border-slate-300 dark:border-slate-600 flex items-center gap-1 cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-3.5 h-3.5 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span>Altro</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
              <div className="space-y-[7px]">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Telefono *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 347..."
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[7px] focus:outline-emerald-600 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@..."
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[7px] focus:outline-emerald-600 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
              <div className="space-y-[7px]">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Modalità di Pagamento Preferita</label>
                <select
                  value={preferredPaymentMethod}
                  onChange={(e) => setPreferredPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[7px] focus:outline-emerald-600 text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="bonifico">Bonifico</option>
                  <option value="contanti">Contanti</option>
                  <option value="pos">POS / Carta di Credito</option>
                  <option value="assegno">Assegno</option>
                  <option value="riba">RiBa (Ricevuta Bancaria)</option>
                </select>
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Codice Fiscale / P.IVA</label>
                <input
                  type="text"
                  value={vatOrTaxCode}
                  onChange={(e) => setVatOrTaxCode(e.target.value)}
                  placeholder="es. IT01234567890"
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[7px] focus:outline-emerald-600 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-[7px]">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Indirizzo Cantiere *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="es. Via Roma 12, Milano"
                className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[7px] focus:outline-emerald-600 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Section 2: Interactive Map & Polygon Area Drawing */}
          <div className="space-y-[7px] bg-slate-50 dark:bg-slate-800/50 p-[7px] rounded-[7px] border border-slate-200 dark:border-slate-700/60">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>🗺️ Mappa Ubicazione & Tracciato Area Lavoro</span>
              <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                Calcolo automatico mq
              </span>
            </h3>

            <ClientMapPicker
              address={address}
              lat={lat}
              lng={lng}
              polygonPoints={polygonPoints}
              onLocationChange={handleLocationChange}
              onPolygonChange={handlePolygonChange}
            />
          </div>

          {/* Section 3: Technical Garden Specs & Access */}
          <div className="space-y-[7px] bg-slate-50 dark:bg-slate-800/50 p-[7px] rounded-[7px] border border-slate-200 dark:border-slate-700/60">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
              ⚙️ Caratteristiche Tecniche Giardino & Accesso
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
              <div className="space-y-[7px]">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Superficie Giardino (mq) *
                </label>
                <input
                  type="number"
                  value={squareMeters}
                  onChange={(e) => setSquareMeters(parseInt(e.target.value) || 0)}
                  placeholder="es. 850"
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
                />
              </div>

              <div className="space-y-[7px]">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Codice Cancello / Citofono
                </label>
                <input
                  type="text"
                  value={gateCode}
                  onChange={(e) => setGateCode(e.target.value)}
                  placeholder="#1234 o Int. 4"
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-[7px] p-[7px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-[7px]">
              <input
                type="checkbox"
                id="dogPresentCheck"
                checked={dogPresent}
                onChange={(e) => setDogPresent(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-[7px] border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="dogPresentCheck" className="text-xs font-semibold text-amber-950 dark:text-amber-300 cursor-pointer">
                Presenza Cani in Giardino
              </label>
            </div>
          </div>

          {/* Section 4: NOTE OPERATIVE (Cleaned up: Title "NOTE OPERATIVE", borderless container, 1px spacing) */}
          <div className="space-y-[7px] p-0 bg-transparent border-none">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] pt-1">
              ✏️ NOTE OPERATIVE
            </h3>

            <div className="space-y-[7px]">
              {/* Note Box 1 */}
              <RichNoteBox
                label="Dettagli Impianto Irrigazione (Zone, Centralina, Pressione)"
                value={irrigationDetails}
                onChange={setIrrigationDetails}
                placeholder="es. 6 zone a scomparsa + centralina Hunter nel garage..."
              />

              {/* Note Box 2 */}
              <RichNoteBox
                label="Essenze e Piante Delicate (Specifiche del Verde & Attenzioni)"
                value={delicatePlants}
                onChange={setDelicatePlants}
                placeholder="es. Acero palmato giapponese nel cortile interno, aiuola rose sul lato est..."
              />

              {/* Note Box 3 */}
              <RichNoteBox
                label="Note Aggiuntive, Accessibilità e Istruzioni Cantiere"
                value={notes}
                onChange={setNotes}
                placeholder="es. Punto acqua nel retro, chiavi del cancello nella cassetta di sicurezza..."
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-[7px] border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-[7px]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[7px] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold text-xs shadow-xs transition-colors flex items-center gap-[7px] cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salva Cliente & Giardino</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
