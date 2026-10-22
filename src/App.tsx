import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MapTabScreen } from './components/map/MapTabScreen';
import { CalendarView } from './components/calendar/CalendarView';
import { ClientsView } from './components/clients/ClientsView';
import { InventoryView } from './components/inventory/InventoryView';
import { ReportsHub } from './components/report/ReportsHub';
import { WorkerView } from './components/worker/WorkerView';
import { WorkerPendingScreen } from './components/worker/WorkerPendingScreen';
import { FirebaseConfigModal } from './components/firebase/FirebaseConfigModal';
import { HamburgerDrawer } from './components/navigation/HamburgerDrawer';
import { AccountModal } from './components/account/AccountModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { TeamManagementModal } from './components/admin/TeamManagementModal';
import { useOnlineStatus } from './hooks/usePWA';
import { LoginScreen } from './components/auth/LoginScreen';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Users,
  Package,
  FileCheck2,
  Menu,
  Flame,
  WifiOff,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, loadingAuth, logout } = useApp();
  const isOnline = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'map' | 'calendar' | 'clients' | 'inventory' | 'reports'
  >('dashboard');

  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // 1. Loading state while checking Firebase Auth session
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-[7px] text-slate-800 dark:text-slate-200">
        <div className="bg-white dark:bg-slate-900 p-[7px] px-6 rounded-[7px] shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-[7px] text-xs font-bold space-x-2">
          <div className="w-5 h-5 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
          <span>Sincronizzazione RAMOVIA Cloud in corso...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state: Login required
  if (!currentUser) {
    return <LoginScreen />;
  }

  // 3. Worker pending linking state: Registered with Google but not yet linked by Admin
  if (currentUser.role === 'worker' && currentUser.linkedToAdmin === false) {
    return <WorkerPendingScreen currentUser={currentUser} onLogout={logout} />;
  }

  // 4. Fully authenticated view
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenFirebaseModal={() => setShowFirebaseModal(true)}
      />

      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-[7px] py-[7px] flex items-center justify-center gap-[7px] font-medium m-[7px] rounded-[7px] shrink-0">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modalità Offline attiva · I dati inseriti sono salvati in cache locale.</span>
        </div>
      )}

      {/* Main Content Viewport with strict 7px spacing */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-[7px] pb-24 md:pb-[7px] space-y-[7px]">
        {currentUser.role === 'admin' ? (
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
            )}
            {activeTab === 'map' && <MapTabScreen />}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'clients' && <ClientsView />}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'reports' && <ReportsHub />}
          </>
        ) : (
          /* WORKER VIEW - Mobile-First & Isolated */
          <>
            {activeTab === 'map' ? (
              <MapTabScreen />
            ) : activeTab === 'reports' ? (
              <ReportsHub />
            ) : (
              <WorkerView />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar with 7px spacing & Hamburger Menu Button */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-[7px] flex items-center justify-around text-[10px] font-semibold text-slate-600 dark:text-slate-400 gap-[7px]">
        {currentUser.role === 'admin' ? (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors ${
                activeTab === 'map'
                  ? 'text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Mappa</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors ${
                activeTab === 'calendar'
                  ? 'text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Squadre</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors ${
                activeTab === 'clients'
                  ? 'text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Giardini</span>
            </button>

            {/* Hamburger Drawer Trigger on Bottom Bar */}
            <button
              onClick={() => setHamburgerOpen(true)}
              className="flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
            >
              <Menu className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Menu</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors flex-1 ${
                activeTab === 'dashboard'
                  ? 'text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>I Miei Interventi</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors flex-1 ${
                activeTab === 'reports'
                  ? 'text-emerald-800 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <FileCheck2 className="w-5 h-5" />
              <span>Rapportini</span>
            </button>

            <button
              onClick={() => setHamburgerOpen(true)}
              className="flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] text-slate-700 dark:text-slate-200 hover:text-emerald-800 transition-colors flex-1"
            >
              <Menu className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <span>Menu</span>
            </button>
          </>
        )}
      </nav>

      {/* Footer */}
      <footer className="no-print hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-[7px] text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-[7px] gap-[7px]">
          <div className="flex items-center gap-[7px]">
            <img src="/RAMOVIA_Logo.svg" alt="RAMOVIA" className="w-5 h-5 object-contain" />
            <span className="font-bold text-slate-700 dark:text-slate-200">RAMOVIA</span>
            <span>·</span>
            <span>Progetto Firebase: ramovia-a2c39</span>
          </div>

          <div className="flex items-center gap-[7px]">
            <button
              onClick={() => setShowFirebaseModal(true)}
              className="flex items-center gap-[7px] p-[7px] text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors rounded-[7px]"
            >
              <Flame className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Configurazione Firebase</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Hamburger Drawer */}
      <HamburgerDrawer
        isOpen={hamburgerOpen}
        onClose={() => setHamburgerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAccount={() => setShowAccountModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenTeamModal={() => setShowTeamModal(true)}
      />

      {/* Account Profile Modal */}
      {showAccountModal && (
        <AccountModal onClose={() => setShowAccountModal(false)} />
      )}

      {/* App Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onOpenFirebaseConfig={() => setShowFirebaseModal(true)}
        />
      )}

      {/* Team Management Modal */}
      {showTeamModal && (
        <TeamManagementModal onClose={() => setShowTeamModal(false)} />
      )}

      {/* Firebase Config Modal */}
      {showFirebaseModal && (
        <FirebaseConfigModal onClose={() => setShowFirebaseModal(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
