import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Building, Mail, Phone, MapPin, FileText, Check, X, Shield, HardHat } from 'lucide-react';

interface AccountModalProps {
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ onClose }) => {
  const { currentUser } = useApp();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [email] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  
  // Company details stored in local storage for invoices / documents
  const [companyName, setCompanyName] = useState(() => {
    try {
      return localStorage.getItem('ramovia_company_name') || 'RAMOVIA Manutenzione Verde';
    } catch {
      return 'RAMOVIA Manutenzione Verde';
    }
  });

  const [vatNumber, setVatNumber] = useState(() => {
    try {
      return localStorage.getItem('ramovia_vat_number') || '';
    } catch {
      return '';
    }
  });

  const [address, setAddress] = useState(() => {
    try {
      return localStorage.getItem('ramovia_company_address') || '';
    } catch {
      return '';
    }
  });

  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('ramovia_company_name', companyName.trim());
      localStorage.setItem('ramovia_vat_number', vatNumber.trim());
      localStorage.setItem('ramovia_company_address', address.trim());
    } catch {
      // ignore
    }
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-[7px] overflow-y-auto">
      <div className="w-full max-w-lg rounded-[7px] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 my-4 space-y-[7px]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white dark:bg-slate-950 p-[7px] px-3 flex items-center justify-between">
          <div className="flex items-center gap-[7px]">
            <div className="w-8 h-8 rounded-[7px] bg-emerald-800 text-white flex items-center justify-center font-bold">
              {currentUser?.role === 'admin' ? <Shield className="w-4 h-4 text-amber-400" /> : <HardHat className="w-4 h-4 text-emerald-300" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Profilo Utente & Dati Aziendali</h2>
              <p className="text-[10px] text-slate-300">
                Gestisci le tue informazioni personali ed i dati dell'impresa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[7px] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-[7px] text-xs text-emerald-800 font-bold flex items-center gap-[7px]">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dati salvati con successo!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-[7px] space-y-[7px] text-xs">
          
          {/* User Account Info Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] space-y-[7px]">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-[7px]">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>Dati Personali & Ruolo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nome e Cognome</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Account (Google)</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full p-[7px] bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-[7px] text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Telefono per Comunicazioni</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 333 ..."
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Ruolo Sistema</label>
                <div className="p-[7px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-[7px] font-bold text-xs uppercase flex items-center justify-between">
                  <span>{currentUser?.role === 'admin' ? 'Titolare (Admin)' : 'Operaio'}</span>
                  {currentUser?.workerCode && (
                    <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                      Codice: {currentUser.workerCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] space-y-[7px]">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-[7px]">
              <Building className="w-3.5 h-3.5 text-emerald-700" />
              <span>Intestazione Azienda Verde</span>
            </h3>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Ragione Sociale / Nome Impresa</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="es. RAMOVIA Giardini S.r.l."
                className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Partita IVA / Codice Fiscale</label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="IT01234567890"
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Indirizzo Sede Operativa</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Via Roma 10, Milano"
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] text-xs"
                />
              </div>
            </div>
          </div>

          <div className="p-[7px] bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-[7px]">
            <button
              type="button"
              onClick={onClose}
              className="p-[7px] px-3.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[7px] font-bold text-xs"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="p-[7px] px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-[7px] font-bold text-xs shadow-xs flex items-center gap-[7px]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salva Profilo & Dati</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
