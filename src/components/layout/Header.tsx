import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { usePWAInstall } from '../../hooks/usePWA';
import { TeamManagementModal } from '../admin/TeamManagementModal';
import { AccountModal } from '../account/AccountModal';
import { SettingsModal } from '../settings/SettingsModal';
import { NotificationCenter } from '../common/NotificationCenter';
import {
  Users,
  Calendar,
  Package,
  FileCheck2,
  LayoutDashboard,
  MapPin,
  Download,
  Plus,
  Shield,
  HardHat,
  X,
  Smartphone,
  Settings,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'map' | 'calendar' | 'clients' | 'inventory' | 'reports' | 'payments' | 'weather';
  onSelectTab: (tab: 'dashboard' | 'map' | 'calendar' | 'clients' | 'inventory' | 'reports' | 'payments' | 'weather') => void;
  onOpenFirebaseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, onOpenFirebaseModal }) => {
  const { currentUser } = useApp();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (!currentUser) return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        <div className="max-w-7xl mx-auto px-3 pt-[25px] pb-[5px] flex items-center justify-between gap-[7px]">
          
          {/* Brand Logo - Ingrandito del 30% (da 32px a 42px su mobile, da 36px a 47px su desktop) */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center text-left focus:outline-none cursor-pointer hover:opacity-90 transition-opacity"
              title="RAMOVIA Dashboard"
            >
              {/* Logo per tema chiaro (gruppo black scuro) */}
              <img
                src="/RAMOVIA_Logo_long.svg"
                alt="RAMOVIA"
                className="h-[42px] sm:h-[47px] w-auto object-contain block dark:hidden"
              />
              {/* Logo per tema scuro (gruppo black bianco) */}
              <img
                src="/RAMOVIA_Logo_long_white.svg"
                alt="RAMOVIA"
                className="h-[42px] sm:h-[47px] w-auto object-contain hidden dark:block"
              />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-[7px] text-xs font-bold text-slate-600 dark:text-slate-300">
            {currentUser.role === 'admin' ? (
              <>
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`p-[7px] px-3 rounded-[7px] transition-colors whitespace-nowrap flex items-center gap-[7px] cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-950 text-white font-bold dark:bg-emerald-800'
                      : 'hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => onSelectTab('map')}
                  className={`p-[7px] px-3 rounded-[7px] transition-colors whitespace-nowrap flex items-center gap-[7px] cursor-pointer ${
                    activeTab === 'map'
                      ? 'bg-emerald-950 text-white font-bold dark:bg-emerald-800'
                      : 'hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mappa</span>
                </button>

                <button
                  onClick={() => onSelectTab('calendar')}
                  className={`p-[7px] px-3 rounded-[7px] transition-colors whitespace-nowrap flex items-center gap-[7px] cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'bg-emerald-950 text-white font-bold dark:bg-emerald-800'
                      : 'hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                  <span>Squadre</span>
                </button>

                <button
                  onClick={() => onSelectTab('clients')}
                  className={`p-[7px] px-3 rounded-[7px] transition-colors whitespace-nowrap flex items-center gap-[7px] cursor-pointer ${
                    activeTab === 'clients'
                      ? 'bg-emerald-950 text-white font-bold dark:bg-emerald-800'
                      : 'hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Giardini</span>
                </button>

                <button
                  onClick={() => onSelectTab('payments')}
                  className={`p-[7px] px-3 rounded-[7px] transition-colors whitespace-nowrap flex items-center gap-[7px] cursor-pointer ${
                    activeTab === 'payments'
                      ? 'bg-emerald-950 text-white font-bold dark:bg-emerald-800'
                      : 'hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                    €
                  </div>
                  <span>Pagamenti</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`p-[7px] px-3 rounded-[7px] transition-colors whitespace-nowrap flex items-center gap-[7px] cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-950 text-white font-bold dark:bg-emerald-800'
                      : 'hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>I Miei Interventi</span>
                </button>
              </>
            )}
          </nav>

          {/* Top Right Tools: Notifications Bell & Desktop Profile/Settings (Hamburger removed) */}
          <div className="flex items-center gap-[7px]">
            
            {/* PWA Install Button (if applicable) */}
            {(!isInstalled && (isInstallable || isIOS)) && (
              <button
                onClick={() => (isIOS ? setShowIOSGuide(true) : install())}
                className="hidden sm:flex items-center gap-[7px] p-[7px] px-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-[7px] shadow-2xs transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installa App</span>
              </button>
            )}

            {/* Notification Center Dropdown */}
            <NotificationCenter onNavigateTab={onSelectTab} />

            {/* Desktop Settings & Profile (visibili solo su desktop, nessun hamburger su mobile) */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="hidden md:flex p-[7px] text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-[7px] transition-colors cursor-pointer"
              title="Impostazioni"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowAccountModal(true)}
              className="hidden md:flex items-center gap-[7px] p-[7px] px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-[7px] text-xs font-semibold transition-colors cursor-pointer"
              title="Profilo Utente"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="max-w-[100px] truncate">{currentUser.displayName || 'Utente'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Account Profile Modal */}
      {showAccountModal && (
        <AccountModal onClose={() => setShowAccountModal(false)} />
      )}

      {/* App Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onOpenFirebaseConfig={onOpenFirebaseModal}
        />
      )}

      {/* Team Management Modal */}
      {showTeamModal && (
        <TeamManagementModal onClose={() => setShowTeamModal(false)} />
      )}

      {/* iOS PWA Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-[7px]">
          <div className="bg-white dark:bg-slate-900 p-[7px] px-4 rounded-[7px] max-w-sm w-full space-y-[7px] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-bold text-xs uppercase text-slate-800 dark:text-slate-200 flex items-center gap-[7px]">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Installa RAMOVIA su iPhone
              </span>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Per installare RAMOVIA come App nativa sul tuo iPhone/iPad:
            </p>

            <ol className="list-decimal list-inside space-y-[7px] text-xs text-slate-700 dark:text-slate-300 pl-1">
              <li>Tocca l'icona <strong>Condividi</strong> in Safari.</li>
              <li>Scorri verso il basso e seleziona <strong>"Aggiungi alla schermata Home"</strong>.</li>
              <li>Conferma toccando <strong>"Aggiungi"</strong>.</li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full p-[7px] bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-[7px] text-xs"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
};
