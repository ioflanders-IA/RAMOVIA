import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { usePWAInstall } from '../../hooks/usePWA';
import {
  Shield,
  HardHat,
  Lock,
  Mail,
  User,
  ArrowRight,
  Download,
  Smartphone,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { users, login, loginWithEmail, registerAccount } = useApp();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<'quick' | 'credentials' | 'register'>('quick');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('worker');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await loginWithEmail(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Credenziali non valide. Verifica l\'email inserita.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await registerAccount(regName, regEmail, regRole, regPhone);
      if (!res.success) {
        setErrorMsg(res.error || 'Errore durante la registrazione.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-6 p-[7px]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-[7px]">
        
        {/* Brand Logo & Presentation */}
        <div className="text-center space-y-[7px]">
          <div className="inline-block p-[7px] bg-white rounded-[7px] shadow-md border border-slate-200">
            <img
              src="/RAMOVIA_Logo.svg"
              alt="RAMOVIA"
              className="h-20 w-20 mx-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">RAMOVIA</h1>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mt-0.5">
              Gestionale Operativo Manutenzione del Verde
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mx-auto sm:w-full sm:max-w-md space-y-[7px]">
        <div className="bg-white p-[7px] shadow-xl rounded-[7px] border border-slate-200 space-y-[7px]">
          
          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-[7px] rounded-[7px] text-xs font-bold text-slate-600 gap-[7px]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('quick');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-[7px] transition-colors text-center ${
                activeTab === 'quick' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Accesso Squadra
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('credentials');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-[7px] transition-colors text-center ${
                activeTab === 'credentials' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Accedi con Email
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-[7px] transition-colors text-center ${
                activeTab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Registrati
            </button>
          </div>

          {errorMsg && (
            <div className="p-[7px] bg-rose-50 border border-rose-200 rounded-[7px] text-xs text-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: QUICK ACCESS FOR FIELD WORKERS / MANAGERS */}
          {activeTab === 'quick' && (
            <div className="space-y-[7px]">
              <div className="text-xs text-slate-500">
                Seleziona il tuo profilo per accedere rapidamente dal tablet o cellulare di cantiere:
              </div>

              <div className="space-y-[7px]">
                {users.map((user) => {
                  const isAdmin = user.role === 'admin';
                  return (
                    <button
                      key={user.uid}
                      type="button"
                      onClick={() => login(user)}
                      className="w-full flex items-center justify-between p-[7px] rounded-[7px] border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
                    >
                      <div className="flex items-center gap-[7px]">
                        <div
                          className={`w-9 h-9 rounded-[7px] flex items-center justify-center font-bold text-xs ${
                            isAdmin
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {isAdmin ? <Shield className="w-4 h-4 text-amber-700" /> : <HardHat className="w-4 h-4 text-emerald-700" />}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-900">
                            {user.displayName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {isAdmin ? 'Titolare (Admin) · Accesso Completo' : 'Operaio · Vista Mobile Cantiere'}
                          </div>
                        </div>
                      </div>

                      <div className="text-slate-400 group-hover:text-emerald-700 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS (EMAIL / PASSWORD) */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsLogin} className="space-y-[7px] text-xs">
              <div className="space-y-[7px]">
                <label className="block text-slate-700 font-semibold">Indirizzo Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="titolare@azienda.it o operaio@azienda.it"
                    className="w-full pl-8 pr-3 p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] text-xs focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-[7px]">
                <label className="block text-slate-700 font-semibold">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-3 p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] text-xs focus:outline-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-[7px]"
              >
                <span>Accedi a RAMOVIA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: REGISTER NEW USER / OPERATOR */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-[7px] text-xs">
              <div className="space-y-[7px]">
                <label className="block text-slate-700 font-semibold">Nome e Cognome *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Mario Rossi"
                    className="w-full pl-8 pr-3 p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] text-xs focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-[7px]">
                <label className="block text-slate-700 font-semibold">Email Aziendale *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="mario@azienda.it"
                    className="w-full pl-8 pr-3 p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] text-xs focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-[7px]">
                <label className="block text-slate-700 font-semibold">Ruolo Operativo *</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] text-xs font-semibold focus:outline-emerald-600"
                >
                  <option value="worker">Operaio (Visualizzazione Lavori Assegnati)</option>
                  <option value="admin">Titolare / Amministratore (Controllo Totale)</option>
                </select>
              </div>

              <div className="space-y-[7px]">
                <label className="block text-slate-700 font-semibold">Telefono (facoltativo)</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+39 340 0000000"
                  className="w-full p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] text-xs focus:outline-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-[7px]"
              >
                <span>Registra Account</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick FAQ note on worker assignments */}
          <div className="pt-[7px] border-t border-slate-100 text-[11px] text-slate-500 space-y-[7px]">
            <div className="font-semibold text-slate-700 flex items-center gap-[7px]">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Come funziona l'accesso e l'assegnazione?</span>
            </div>
            <p className="text-slate-600">
              Il titolare assegna gli interventi all'operaio dal calendario. L'operaio accede con il suo profilo da cantiere e trova immediatamente il percorso, la scheda del giardino e la firma cliente.
            </p>
          </div>
        </div>

        {/* PWA Install Promotion Box */}
        {!isInstalled && (
          <div className="bg-emerald-950 text-white rounded-[7px] p-[7px] shadow-md flex items-center justify-between gap-[7px] text-xs">
            <div className="flex items-center gap-[7px]">
              <img src="/RAMOVIA_Logo.svg" alt="App" className="w-8 h-8 object-contain shrink-0" />
              <div>
                <div className="font-bold text-white">Installa l'App RAMOVIA</div>
                <div className="text-[11px] text-emerald-300">
                  Funziona su PC, Android e iPhone anche offline.
                </div>
              </div>
            </div>

            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-[7px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[7px] font-bold shrink-0 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installa</span>
              </button>
            )}

            {isIOS && (
              <span className="text-[10px] text-emerald-300 bg-emerald-900/60 p-[7px] rounded-[7px]">
                Safari: Condividi &gt; Aggiungi a Home
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
