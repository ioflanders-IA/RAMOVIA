import React, { useState } from 'react';
import { User } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Copy,
  Check,
  Share2,
  LogOut,
  Clock,
  ShieldAlert,
  HardHat,
  ShieldCheck,
} from 'lucide-react';

interface WorkerPendingScreenProps {
  currentUser: User;
  onLogout: () => void;
}

export const WorkerPendingScreen: React.FC<WorkerPendingScreenProps> = ({
  currentUser,
  onLogout,
}) => {
  const { updateUserRole } = useApp();
  const [copied, setCopied] = useState(false);

  const code = currentUser.workerCode || 'OP-PENDING';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSwitchToAdmin = async () => {
    if (confirm('Vuoi modificare il tuo profilo e accedere come Titolare (Admin)?')) {
      await updateUserRole(currentUser.uid, 'admin');
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Ciao! Ho registrato il mio profilo su RAMOVIA. Il mio Codice Operaio è: ${code}. Collegami alla squadra per abilitare i miei cantieri!`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-[7px] text-slate-900">
      <div className="max-w-md mx-auto w-full space-y-[7px] py-4 my-auto">
        
        {/* Brand Header */}
        <div className="text-center space-y-[7px]">
          <div className="w-16 h-16 mx-auto bg-white rounded-[7px] p-[7px] shadow-sm border border-slate-200 flex items-center justify-center">
            <img
              src="/RAMOVIA_Logo.svg"
              alt="RAMOVIA"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">RAMOVIA</h1>
            <p className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase">
              Gestionale Operativo Manutenzione del Verde
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-white border border-slate-200 rounded-[7px] p-[7px] shadow-sm space-y-[7px]">
          <div className="flex items-center gap-[7px] p-[7px] bg-slate-50 rounded-[7px] border border-slate-100">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-10 h-10 rounded-[7px] object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-[7px] bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
                <HardHat className="w-5 h-5 text-amber-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-slate-900 truncate">
                {currentUser.displayName}
              </h2>
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            </div>
            <span className="px-2 py-1 rounded-[7px] bg-amber-100 text-amber-900 text-[10px] font-bold uppercase shrink-0">
              Operaio
            </span>
          </div>

          {/* Code Card */}
          <div className="bg-emerald-950 text-white p-[7px] rounded-[7px] text-center space-y-[7px] shadow-sm">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">
              Il tuo Codice Operaio Univoco
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-400 bg-emerald-900/90 py-2 px-3 rounded-[7px] border border-emerald-700/80 inline-block shadow-inner select-all">
              {code}
            </div>

            <div className="flex items-center justify-center gap-[7px] pt-1">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-[7px] p-[7px] bg-white text-emerald-950 hover:bg-emerald-50 rounded-[7px] text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-800" />
                    <span>Copia Codice</span>
                  </>
                )}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-[7px] p-[7px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-[7px] text-xs font-bold transition-colors shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>Invia su WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Guidance / Next Steps */}
          <div className="bg-amber-50 border border-amber-200 rounded-[7px] p-[7px] text-xs text-amber-900 space-y-[7px]">
            <div className="flex items-center gap-[7px] font-bold text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Attesa Collegamento Squadra</span>
            </div>
            <p className="leading-relaxed">
              Inoltra il codice <strong>{code}</strong> al tuo <strong>Titolare (Admin)</strong>. Non appena il titolare inserisce questo codice nella sezione <em>"Squadra"</em> dell'app, questa schermata si sbloccherà automaticamente!
            </p>
          </div>

          {/* Realtime Pulsing Status */}
          <div className="flex items-center justify-center gap-[7px] p-[7px] bg-slate-50 rounded-[7px] text-xs text-slate-600 font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>In ascolto in tempo reale per la conferma del Titolare...</span>
          </div>

          {/* Switch Role Action if user picked wrong role */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              onClick={handleSwitchToAdmin}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Sei il Titolare dell'azienda? Passa al profilo Admin</span>
            </button>
          </div>
        </div>

        {/* Logout Action */}
        <div className="text-center pt-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-[7px] p-[7px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[7px] text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Disconnetti Account ({currentUser.displayName})</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-400 p-[7px]">
        RAMOVIA Cloud System • Autenticazione Google Sicura & Sincronizzazione Firestore
      </footer>
    </div>
  );
};
