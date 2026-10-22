import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { usePWAInstall } from '../../hooks/usePWA';
import {
  Users,
  Calendar,
  Package,
  FileCheck2,
  LayoutDashboard,
  Download,
  ChevronDown,
  Menu,
  X,
  Smartphone,
  Plus,
  Trash2,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'calendar' | 'clients' | 'inventory' | 'reports';
  onSelectTab: (tab: 'dashboard' | 'calendar' | 'clients' | 'inventory' | 'reports') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser, users, switchUser, addUser, clearAllData } = useApp();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;
    addUser({
      displayName: newWorkerName.trim(),
      email: '',
      phone: newWorkerPhone.trim(),
      role: 'worker',
      active: true,
    });
    setNewWorkerName('');
    setNewWorkerPhone('');
    setShowAddWorkerModal(false);
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-900 flex items-center justify-center text-emerald-400 font-extrabold text-lg shadow-sm">
                R
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                  RAMOVIA
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 tracking-wider -mt-1 hidden sm:block">
                  GESTIONALE DEL VERDE
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-600">
            {currentUser.role === 'admin' ? (
              <>
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-950 text-white font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => onSelectTab('calendar')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'calendar'
                      ? 'bg-emerald-950 text-white font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendario</span>
                </button>

                <button
                  onClick={() => onSelectTab('clients')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'clients'
                      ? 'bg-emerald-950 text-white font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Clienti & Giardini</span>
                </button>

                <button
                  onClick={() => onSelectTab('inventory')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'inventory'
                      ? 'bg-emerald-950 text-white font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Magazzino</span>
                </button>

                <button
                  onClick={() => onSelectTab('reports')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'bg-emerald-950 text-white font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Rapportini</span>
                </button>
              </>
            ) : (
              /* Worker View Navigation Links */
              <>
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-950 text-white font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>I Miei Interventi</span>
                </button>

                <button
                  onClick={() => onSelectTab('reports')}
                  className={`px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'bg-emerald-950 text-white font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Rapportini Inviati</span>
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Primary Action & Role Switcher */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installa App</span>
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Installa su iOS</span>
              </button>
            )}

            {/* Role Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.role === 'admin' ? 'A' : 'O'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-slate-800 leading-none truncate max-w-[120px]">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-emerald-800 font-semibold uppercase leading-none mt-0.5">
                    {currentUser.role === 'admin' ? 'Titolare (Admin)' : 'Operaio'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* User Switcher Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Seleziona Ruolo Attivo
                  </div>

                  <div className="py-1 space-y-1">
                    {users.map((u) => (
                      <button
                        key={u.uid}
                        onClick={() => {
                          switchUser(u.uid);
                          onSelectTab('dashboard');
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                          u.uid === currentUser.uid
                            ? 'bg-emerald-50 text-emerald-950 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              u.role === 'admin' ? 'bg-amber-600 text-white' : 'bg-emerald-700 text-white'
                            }`}
                          >
                            {u.role === 'admin' ? 'A' : 'O'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{u.displayName}</div>
                            <div className="text-[10px] text-slate-500">
                              {u.role === 'admin' ? 'Accesso Completo' : 'Vista Mobile Cantiere'}
                            </div>
                          </div>
                        </div>

                        {u.uid === currentUser.uid && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </button>
                    ))}
                  </div>

                  {currentUser.role === 'admin' && (
                    <div className="pt-2 border-t border-slate-100 mt-1 space-y-1">
                      <button
                        onClick={() => {
                          setShowAddWorkerModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-emerald-800 hover:text-emerald-950 rounded-lg hover:bg-emerald-50 transition-colors text-left font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Aggiungi Operaio</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('Confermi di voler cancellare tutti i dati salvati e ripartire da zero?')) {
                            clearAllData();
                            setShowUserMenu(false);
                          }
                        }}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors text-left"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Azzera Dati</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2 text-xs font-semibold">
            {currentUser.role === 'admin' ? (
              <>
                <button
                  onClick={() => {
                    onSelectTab('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl ${
                    activeTab === 'dashboard' ? 'bg-emerald-950 text-white font-bold' : 'text-slate-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard (Mappa & Meteo)</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTab('calendar');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl ${
                    activeTab === 'calendar' ? 'bg-emerald-950 text-white font-bold' : 'text-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Calendario Squadre</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTab('clients');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl ${
                    activeTab === 'clients' ? 'bg-emerald-950 text-white font-bold' : 'text-slate-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Clienti & Schede Giardino</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTab('inventory');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl ${
                    activeTab === 'inventory' ? 'bg-emerald-950 text-white font-bold' : 'text-slate-700'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Magazzino & Spesa</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTab('reports');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl ${
                    activeTab === 'reports' ? 'bg-emerald-950 text-white font-bold' : 'text-slate-700'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Rapportini di Lavoro</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onSelectTab('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl ${
                    activeTab === 'dashboard' ? 'bg-emerald-950 text-white font-bold' : 'text-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>I Miei Interventi</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTab('reports');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl ${
                    activeTab === 'reports' ? 'bg-emerald-950 text-white font-bold' : 'text-slate-700'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>I Miei Rapportini</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Add Worker Modal */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Aggiungi Nuovo Operaio</h3>
              <button
                onClick={() => setShowAddWorkerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-600 block mb-1">Nome e Cognome *</label>
                <input
                  type="text"
                  required
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Nome dell'operaio"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Telefono</label>
                <input
                  type="text"
                  value={newWorkerPhone}
                  onChange={(e) => setNewWorkerPhone(e.target.value)}
                  placeholder="+39 ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white font-bold"
                >
                  Salva Operaio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* iOS Install Prompt Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Installa RAMOVIA su iPhone / iPad
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              1. Tocca il pulsante <strong>Condividi</strong> nella barra di Safari in basso.<br />
              2. Scorri verso il basso e tocca <strong>Aggiungi alla schermata Home</strong>.<br />
              3. Avvia RAMOVIA direttamente come app nativa a schermo intero senza barre del browser!
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
};
