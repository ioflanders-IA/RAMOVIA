import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';
import {
  X,
  LayoutDashboard,
  MapPin,
  Calendar,
  Users,
  Package,
  FileCheck2,
  User,
  Settings,
  Shield,
  HardHat,
  LogOut,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'dashboard' | 'map' | 'calendar' | 'workers' | 'clients' | 'inventory' | 'reports' | 'payments' | 'weather';
  onSelectTab: (tab: 'dashboard' | 'map' | 'calendar' | 'workers' | 'clients' | 'inventory' | 'reports' | 'payments' | 'weather') => void;
  onOpenAccount: () => void;
  onOpenSettings: () => void;
  onOpenTeamModal: () => void;
}

export const HamburgerDrawer: React.FC<HamburgerDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenAccount,
  onOpenSettings,
  onOpenTeamModal,
}) => {
  const { currentUser, logout } = useApp();
  const { themeMode, effectiveTheme, toggleTheme } = useTheme();

  if (!currentUser) return null;

  const handleNavClick = (tab: 'dashboard' | 'map' | 'calendar' | 'workers' | 'clients' | 'inventory' | 'reports' | 'payments' | 'weather') => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[1200] bg-white dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-800 rounded-t-[14px] p-[7px] shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col space-y-[7px]"
          >
            {/* Top Handle Bar */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-1 shrink-0" />

            {/* Top Row: User Card & Minimal Textless Theme Toggle */}
            <div className="p-[7px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-[7px] flex items-center justify-between gap-[7px] shrink-0">
              <div className="flex items-center gap-[7px] min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    className="w-9 h-9 rounded-[7px] object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-[7px] bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0">
                    {currentUser.role === 'admin' ? <Shield className="w-5 h-5 text-amber-400" /> : <HardHat className="w-5 h-5 text-emerald-300" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.role === 'admin' ? 'Titolare (Admin)' : 'Operaio Cantiere'}
                  </div>
                </div>
              </div>

              {/* Minimal Textless Light/Dark Theme Switcher */}
              <div className="flex items-center gap-[7px] shrink-0">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-600 rounded-[7px] text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
                  title={`Tema attuale: ${effectiveTheme === 'dark' ? 'Scuro' : 'Chiaro'} (Clicca per cambiare)`}
                >
                  {effectiveTheme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-700" />
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="p-[7px] text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-[7px] hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Menu Items List */}
            <div className="overflow-y-auto space-y-[7px] p-[7px] text-xs font-bold">
              
              {/* Main Navigation Links */}
              <div className="space-y-[7px]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block">
                  Navigazione Principale
                </span>

                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`w-full p-[7px] px-3 rounded-[7px] flex items-center gap-[7px] transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                  <span>HOME</span>
                </button>

                <button
                  onClick={() => handleNavClick('map')}
                  className={`w-full p-[7px] px-3 rounded-[7px] flex items-center gap-[7px] transition-colors ${
                    activeTab === 'map'
                      ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Mappa Cantieri</span>
                </button>

                <button
                  onClick={() => handleNavClick('calendar')}
                  className={`w-full p-[7px] px-3 rounded-[7px] flex items-center gap-[7px] transition-colors ${
                    activeTab === 'calendar'
                      ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>Calendario</span>
                </button>

                <button
                  onClick={() => handleNavClick('workers')}
                  className={`w-full p-[7px] px-3 rounded-[7px] flex items-center gap-[7px] transition-colors ${
                    activeTab === 'workers'
                      ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <HardHat className="w-4 h-4 text-amber-500" />
                  <span>Operai & Presenze</span>
                </button>

                <button
                  onClick={() => handleNavClick('clients')}
                  className={`w-full p-[7px] px-3 rounded-[7px] flex items-center gap-[7px] transition-colors ${
                    activeTab === 'clients'
                      ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Clienti & Schede Giardini</span>
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => handleNavClick('payments')}
                    className={`w-full p-[7px] px-3 rounded-[7px] flex items-center gap-[7px] transition-colors ${
                      activeTab === 'payments'
                        ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      €
                    </div>
                    <span>Pagamenti & Finanze</span>
                  </button>
                )}

                <button
                  onClick={() => handleNavClick('inventory')}
                  className={`w-full p-[7px] px-3 rounded-[7px] flex items-center gap-[7px] transition-colors ${
                    activeTab === 'inventory'
                      ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Package className="w-4 h-4 text-teal-500" />
                  <span>Magazzino & Attrezzature</span>
                </button>

                <button
                  onClick={() => handleNavClick('reports')}
                  className={`w-full p-[7px] px-3 rounded-[7px] flex items-center gap-[7px] transition-colors ${
                    activeTab === 'reports'
                      ? 'bg-emerald-950 text-white dark:bg-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-500" />
                  <span>Rapportini di Lavoro</span>
                </button>
              </div>

              {/* Company & Settings Section */}
              <div className="space-y-[7px] pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block">
                  Profilo & Impostazioni
                </span>

                <button
                  onClick={() => {
                    onClose();
                    onOpenAccount();
                  }}
                  className="w-full p-[7px] px-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-[7px] flex items-center gap-[7px] transition-colors"
                >
                  <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>Profilo & Dati Aziendali</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full p-[7px] px-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-[7px] flex items-center gap-[7px] transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>Impostazioni Applicazione</span>
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTeamModal();
                    }}
                    className="w-full p-[7px] px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-[7px] flex items-center gap-[7px] transition-colors"
                  >
                    <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Gestione Squadra & Operai</span>
                  </button>
                )}
              </div>

              {/* Logout Action */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="w-full p-[7px] px-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-[7px] flex items-center justify-center gap-[7px] font-bold transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Disconnetti (Logout)</span>
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
