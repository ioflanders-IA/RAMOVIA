import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Users,
  Package,
  FileCheck2,
  Settings,
  Shield,
  HardHat,
  LogOut,
  Sun,
  Moon,
  CloudSun,
  CreditCard,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { NotificationCenter } from '../common/NotificationCenter';

interface DesktopSidebarProps {
  activeTab: 'dashboard' | 'map' | 'calendar' | 'clients' | 'inventory' | 'reports' | 'payments' | 'weather';
  onSelectTab: (tab: 'dashboard' | 'map' | 'calendar' | 'clients' | 'inventory' | 'reports' | 'payments' | 'weather') => void;
  onOpenAccount: () => void;
  onOpenSettings: () => void;
  onOpenTeamModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAccount,
  onOpenSettings,
  onOpenTeamModal,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { currentUser, logout } = useApp();
  const { effectiveTheme, toggleTheme } = useTheme();

  if (!currentUser) return null;

  return (
    <aside
      className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 p-[7px] space-y-[7px] shadow-xs select-none transition-all duration-200 ${
        isCollapsed ? 'w-[60px]' : 'w-[210px]'
      }`}
    >
      {/* Top Header & RAMOVIA Brand Logo + Collapse Toggle */}
      <div className="p-[7px] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        {!isCollapsed ? (
          <>
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center text-left focus:outline-none cursor-pointer hover:opacity-90 transition-opacity min-w-0"
              title="RAMOVIA Dashboard"
            >
              <img
                src="/RAMOVIA_Logo_long.svg"
                alt="RAMOVIA"
                className="h-[38px] w-auto object-contain block"
              />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-[7px] text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-[7px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Comprimi barra laterale (solo icone)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center w-full gap-[7px]">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center justify-center focus:outline-none cursor-pointer hover:opacity-90 transition-opacity"
              title="RAMOVIA Dashboard"
            >
              <img
                src="/RAMOVIA_Logo.svg"
                alt="RAMOVIA"
                className="w-7 h-7 object-contain block"
              />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-[7px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Espandi barra laterale"
            >
              <PanelLeftOpen className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Links List */}
      <nav className="flex-1 overflow-y-auto space-y-[7px] pr-[2px]">
        {currentUser.role === 'admin' ? (
          <>
            {/* Dashboard */}
            <button
              onClick={() => onSelectTab('dashboard')}
              title="Dashboard"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Dashboard</span>}
            </button>

            {/* Mappa Cantieri */}
            <button
              onClick={() => onSelectTab('map')}
              title="Mappa Cantieri"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'map'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Mappa Cantieri</span>}
            </button>

            {/* Calendario */}
            <button
              onClick={() => onSelectTab('calendar')}
              title="Calendario"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'calendar'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 text-sky-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Calendario</span>}
            </button>

            {/* Giardini & Clienti */}
            <button
              onClick={() => onSelectTab('clients')}
              title="Giardini & Clienti"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'clients'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Giardini & Clienti</span>}
            </button>

            {/* Magazzino & Mezzi */}
            <button
              onClick={() => onSelectTab('inventory')}
              title="Magazzino & Mezzi"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'inventory'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 text-purple-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Magazzino</span>}
            </button>

            {/* Rapportini Lavoro */}
            <button
              onClick={() => onSelectTab('reports')}
              title="Rapportini Lavoro"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'reports'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-rose-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Rapportini</span>}
            </button>

            {/* Incassi & Pagamenti */}
            <button
              onClick={() => onSelectTab('payments')}
              title="Incassi & Pagamenti"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'payments'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Pagamenti</span>}
            </button>

            {/* Meteo Cantieri */}
            <button
              onClick={() => onSelectTab('weather')}
              title="Meteo Cantieri"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'weather'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CloudSun className="w-4 h-4 text-amber-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Meteo</span>}
            </button>
          </>
        ) : (
          /* WORKER NAVIGATION LINKS */
          <>
            <button
              onClick={() => onSelectTab('dashboard')}
              title="I Miei Interventi"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Interventi</span>}
            </button>

            <button
              onClick={() => onSelectTab('map')}
              title="Mappa Cantieri"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'map'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Mappa</span>}
            </button>

            <button
              onClick={() => onSelectTab('reports')}
              title="Rapportini Lavoro"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'reports'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-rose-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Rapportini</span>}
            </button>

            <button
              onClick={() => onSelectTab('weather')}
              title="Meteo Cantieri"
              className={`w-full flex items-center gap-[7px] p-[7px] rounded-[7px] text-xs font-bold transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : 'px-2.5 text-left'
              } ${
                activeTab === 'weather'
                  ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CloudSun className="w-4 h-4 text-amber-500 shrink-0" />
              {!isCollapsed && <span className="truncate">Meteo</span>}
            </button>
          </>
        )}
      </nav>

      {/* Bottom Profile & Actions Card */}
      <div className="pt-[7px] border-t border-slate-200 dark:border-slate-800 space-y-[7px] shrink-0">
        
        {/* Profile Card & Notification Center Row */}
        {!isCollapsed ? (
          <div className="flex items-center gap-[7px]">
            <button
              onClick={onOpenAccount}
              className="flex-1 p-[7px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-[7px] flex items-center justify-between gap-[7px] hover:border-emerald-600 transition-colors text-left group cursor-pointer min-w-0"
              title="Gestisci Profilo Utente"
            >
              <div className="flex items-center gap-[7px] min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    className="w-7 h-7 rounded-[7px] object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-[7px] bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    {currentUser.role === 'admin' ? (
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <HardHat className="w-3.5 h-3.5 text-emerald-300" />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.role === 'admin' ? 'Amministratore' : 'Operatore'}
                  </div>
                </div>
              </div>
            </button>

            {/* Notification Center button beside account */}
            <div className="shrink-0">
              <NotificationCenter
                onNavigateTab={(tab) => onSelectTab(tab as any)}
                placement="sidebar-up"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-[7px]">
            <button
              onClick={onOpenAccount}
              className="w-full p-[7px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-[7px] flex items-center justify-center hover:border-emerald-600 transition-colors cursor-pointer"
              title="Gestisci Profilo Utente"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-7 h-7 rounded-[7px] object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-[7px] bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  {currentUser.role === 'admin' ? (
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <HardHat className="w-3.5 h-3.5 text-emerald-300" />
                  )}
                </div>
              )}
            </button>

            <div className="shrink-0">
              <NotificationCenter
                onNavigateTab={(tab) => onSelectTab(tab as any)}
                placement="sidebar-up"
              />
            </div>
          </div>
        )}

        {/* Quick Action Icons Row */}
        <div className={`grid gap-[7px] ${isCollapsed ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-[7px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-600 rounded-[7px] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title={`Tema: ${effectiveTheme === 'dark' ? 'Scuro' : 'Chiaro'}`}
          >
            {effectiveTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-[7px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-600 rounded-[7px] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Impostazioni"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Team Management (if admin) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenTeamModal}
              className="p-[7px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-600 rounded-[7px] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Gestione Squadre"
            >
              <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </button>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="p-[7px] bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-[7px] text-rose-700 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
            title="Esci dall'Account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

    </aside>
  );
};
