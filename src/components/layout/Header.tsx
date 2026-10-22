import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { usePWAInstall } from '../../hooks/usePWA';
import { TeamManagementModal } from '../admin/TeamManagementModal';
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
  LogOut,
  Shield,
  HardHat,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'calendar' | 'clients' | 'inventory' | 'reports';
  onSelectTab: (tab: 'dashboard' | 'calendar' | 'clients' | 'inventory' | 'reports') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const { currentUser, users, switchUser, addUser, clearAllData, logout } = useApp();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
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

  if (!currentUser) return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand Wordmark with Official Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="h-10 w-10 shrink-0 flex items-center justify-center p-0.5 bg-white rounded-xl border border-slate-200/80 shadow-xs group-hover:border-emerald-600 transition-colors">
                <img
                  src="/RAMOVIA_Logo.svg"
                  alt="RAMOVIA"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap leading-tight">
                  RAMOVIA
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 tracking-wider hidden sm:block">
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

          {/* Zone 3: Primary Action, Team, Role Switcher & Direct Logout */}
          <div className="flex items-center gap-[7px] shrink-0">
            
            {/* PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="hidden sm:flex items-center gap-[7px] p-[7px] px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-[7px] shadow-xs transition-colors"
                title="Installa RAMOVIA come applicazione"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installa App</span>
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="hidden sm:flex items-center gap-[7px] p-[7px] px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-[7px] transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Installa su iOS</span>
              </button>
            )}

            {/* Quick Admin Team Button */}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setShowTeamModal(true)}
                className="hidden md:flex items-center gap-[7px] p-[7px] px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-[7px] transition-colors"
                title="Gestione Squadra e Operai"
              >
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                <span>Squadra</span>
              </button>
            )}

            {/* Role Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-[7px] p-[7px] px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[7px] text-xs transition-colors"
                title="Cambia utente o ruolo"
              >
                <div className="w-6 h-6 rounded-[7px] bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.role === 'admin' ? 'A' : 'O'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-slate-800 leading-none truncate max-w-[110px]">
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
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-[7px] shadow-xl p-[7px] z-50 text-xs space-y-[7px]">
                  <div className="p-[7px] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Squadra & Ruolo Attivo
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
                    <div className="pt-2 border-t border-slate-100 mt-1 space-y-[7px]">
                      <button
                        onClick={() => {
                          setShowTeamModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-[7px] p-[7px] text-emerald-800 hover:text-emerald-950 rounded-lg hover:bg-emerald-50 transition-colors text-left font-bold"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Gestione Squadra & Operai</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAddWorkerModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-[7px] p-[7px] text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-50 transition-colors text-left font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Aggiungi Operaio Rapido</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('Confermi di voler cancellare tutti i dati salvati e ripartire da zero?')) {
                            clearAllData();
                            setShowUserMenu(false);
                          }
                        }}
                        className="w-full flex items-center gap-[7px] p-[7px] text-slate-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors text-left"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Azzera Dati</span>
                      </button>
                    </div>
                  )}

                  {/* Disconnetti / Logout in dropdown */}
                  <div className="pt-2 border-t border-slate-100 mt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-[7px] p-[7px] text-rose-700 hover:text-rose-900 rounded-[7px] hover:bg-rose-50 transition-colors text-left font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Disconnetti (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Visible Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-[7px] p-[7px] px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 rounded-[7px] text-xs font-bold transition-colors shadow-xs"
              title="Disconnetti (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Esci</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-[7px] text-slate-600 hover:text-slate-900 rounded-[7px] hover:bg-slate-100 transition-colors md:hidden"
              title="Menu di navigazione"
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

            {/* Common Mobile Actions: Team & Logout */}
            <div className="pt-2 border-t border-slate-200 space-y-[7px]">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowTeamModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-[7px] p-[7px] rounded-lg text-emerald-800 hover:bg-emerald-50 font-bold"
                >
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>Gestione Squadra & Operai</span>
                </button>
              )}

              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-[7px] p-[7px] rounded-lg text-rose-700 hover:bg-rose-50 font-bold"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Disconnetti (Logout)</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Team Management Modal */}
      {showTeamModal && (
        <TeamManagementModal onClose={() => setShowTeamModal(false)} />
      )}

      {/* Add Worker Modal */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-[7px]">
          <div className="w-full max-w-sm rounded-[7px] bg-white p-[7px] shadow-2xl text-slate-900 space-y-[7px] border border-slate-200">
            <div className="flex items-center justify-between p-[7px] border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Aggiungi Nuovo Operaio</h3>
              <button
                onClick={() => setShowAddWorkerModal(false)}
                className="p-[7px] rounded-[7px] text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="p-[7px] space-y-[7px] text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nome e Cognome *</label>
                <input
                  type="text"
                  required
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Nome dell'operaio"
                  className="w-full p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] text-xs outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Telefono</label>
                <input
                  type="text"
                  value={newWorkerPhone}
                  onChange={(e) => setNewWorkerPhone(e.target.value)}
                  placeholder="+39 ..."
                  className="w-full p-[7px] bg-slate-50 border border-slate-200 rounded-[7px] text-xs outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-[7px] pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="p-[7px] px-3 rounded-[7px] bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="p-[7px] px-3.5 rounded-[7px] bg-emerald-800 text-white font-bold hover:bg-emerald-700 transition-colors shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-[7px]">
          <div className="w-full max-w-sm rounded-[7px] bg-white p-[7px] shadow-2xl text-slate-900 space-y-[7px] border border-slate-200">
            <div className="flex items-center justify-between p-[7px] border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Installa RAMOVIA su iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-[7px] rounded-[7px] text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-[7px] space-y-[7px] text-xs text-slate-600 leading-relaxed">
              <p>1. Tocca il pulsante <strong>Condividi</strong> (icona quadrato con freccia) nella barra di Safari in basso.</p>
              <p>2. Scorri verso il basso nel menu e tocca <strong>Aggiungi alla schermata Home</strong>.</p>
              <p>3. RAMOVIA verrà installata con l'icona ufficiale e si aprirà a schermo intero come app nativa.</p>
            </div>
            <div className="p-[7px] pt-0">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-[7px] bg-slate-900 p-[7px] text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                Ho capito
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
