import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { AlertTriangle, Copy, Check, ShieldCheck, HardHat, ExternalLink, CheckCircle2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loginWithEmail } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setUnauthorizedDomain(null);
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        if (res.unauthorizedDomain || res.error === 'unauthorized_domain') {
          setUnauthorizedDomain(res.unauthorizedDomain || window.location.hostname);
        } else {
          setErrorMsg(res.error || 'Accesso annullato o non riuscito.');
        }
      }
    } catch {
      setErrorMsg('Errore durante l\'accesso con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDomain = (domainToCopy: string) => {
    navigator.clipboard.writeText(domainToCopy);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  const handleDirectAccess = async (role: 'admin' | 'worker') => {
    setLoading(true);
    try {
      if (role === 'admin') {
        await loginWithEmail('andblasi@gmail.com');
      } else {
        await loginWithEmail('operaio.cantiere@ramovia.it');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-[7px] text-slate-900 overflow-hidden">
      {/* Container shifted 100px higher (-mt-[100px]) for mobile and desktop view */}
      <div className="max-w-sm w-full -mt-[60px] sm:-mt-[100px] space-y-[7px] text-center flex flex-col items-center justify-center">
        
        {/* Official Pure RAMOVIA Logo */}
        <div className="flex justify-center pb-1">
          <img
            src="/RAMOVIA_Logo.svg"
            alt="RAMOVIA"
            className="w-36 h-36 sm:w-40 sm:h-40 object-contain drop-shadow-xs"
          />
        </div>

        {/* Domain Authorization Error Guide */}
        {unauthorizedDomain ? (
          <div className="bg-amber-50 border border-amber-300 rounded-[7px] p-[7px] text-xs text-amber-950 space-y-[7px] text-left shadow-md w-full">
            <div className="flex items-center gap-[7px] font-bold text-amber-900">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              <span>Autorizzazione Dominio Firebase Richiesta</span>
            </div>

            <p className="text-[11px] leading-relaxed">
              Per completare l'accesso Google sul tuo progetto Firebase <strong>ramovia-a2c39</strong>, aggiungi il dominio di questa anteprima ai domini autorizzati:
            </p>

            <div className="bg-white border border-amber-200 p-[7px] rounded-[7px] font-mono text-[11px] text-slate-900 flex items-center justify-between gap-[7px]">
              <span className="truncate select-all">{unauthorizedDomain}</span>
              <button
                type="button"
                onClick={() => handleCopyDomain(unauthorizedDomain)}
                className="p-[7px] px-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-[7px] font-sans font-bold text-[10px] shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedDomain ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copia Dominio</span>
                  </>
                )}
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900 leading-snug">
              <li>Apri <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold text-amber-950 flex-inline items-center gap-1">console.firebase.google.com <ExternalLink className="w-3 h-3 inline" /></a> $\rightarrow$ Progetto <strong>ramovia-a2c39</strong></li>
              <li>Vai in <strong>Authentication</strong> $\rightarrow$ scheda <strong>Impostazioni</strong> $\rightarrow$ <strong>Domini autorizzati</strong></li>
              <li>Clicca <strong>Aggiungi dominio</strong> e incolla <code className="bg-white px-1 py-0.5 rounded border border-amber-200">{unauthorizedDomain}</code></li>
            </ol>

            <div className="pt-2 border-t border-amber-200/80 space-y-[7px]">
              <p className="font-bold text-[11px] text-amber-950">
                Vuoi accedere e testare subito la squadra nel frattempo?
              </p>
              <div className="flex gap-[7px]">
                <button
                  type="button"
                  onClick={() => handleDirectAccess('admin')}
                  className="flex-1 p-[7px] px-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-[7px] text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Accedi come Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectAccess('worker')}
                  className="flex-1 p-[7px] px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-[7px] text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Accedi come Operaio</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-[7px]">
            {errorMsg && (
              <div className="p-[7px] bg-rose-50 border border-rose-200 rounded-[7px] text-xs text-rose-800 font-medium text-center w-full">
                {errorMsg}
              </div>
            )}

            {/* Role Selection Box */}
            <div className="bg-white border border-slate-200 rounded-[7px] p-[7px] shadow-sm space-y-[7px] text-left">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block text-center">
                Scegli il tuo ruolo per registrarti / accedere:
              </span>

              <div className="grid grid-cols-2 gap-[7px]">
                {/* Admin Card Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-[7px] rounded-[7px] border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                    selectedRole === 'admin'
                      ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <ShieldCheck className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-emerald-700' : 'text-slate-500'}`} />
                    {selectedRole === 'admin' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">TITOLARE</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Gestione cantieri, squadre e clienti
                    </div>
                  </div>
                </button>

                {/* Worker Card Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('worker')}
                  className={`p-[7px] rounded-[7px] border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                    selectedRole === 'worker'
                      ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <HardHat className={`w-4 h-4 ${selectedRole === 'worker' ? 'text-amber-700' : 'text-slate-500'}`} />
                    {selectedRole === 'worker' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">OPERAIO</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Rapportini, ore e codice squadra
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Google Button reflects chosen role */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2.5 p-[7px] px-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-[7px] text-xs font-bold shadow-md transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Accedi con Google come {selectedRole === 'admin' ? 'Titolare' : 'Operaio'}</span>
              </button>
            </div>

            {/* Direct preview access buttons */}
            <div className="pt-1 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleDirectAccess(selectedRole)}
                className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
              >
                Accesso Diretto Anteprima ({selectedRole === 'admin' ? 'Titolare' : 'Operaio'})
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
