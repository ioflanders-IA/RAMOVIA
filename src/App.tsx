import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CalendarView } from './components/calendar/CalendarView';
import { ClientsView } from './components/clients/ClientsView';
import { InventoryView } from './components/inventory/InventoryView';
import { ReportsHub } from './components/report/ReportsHub';
import { WorkerView } from './components/worker/WorkerView';
import { WorkerPendingScreen } from './components/worker/WorkerPendingScreen';
import { FirebaseConfigModal } from './components/firebase/FirebaseConfigModal';
import { useOnlineStatus } from './hooks/usePWA';
import { LoginScreen } from './components/auth/LoginScreen';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  FileCheck2,
  Flame,
  WifiOff,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, loadingAuth, logout } = useApp();
  const isOnline = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'calendar' | 'clients' | 'inventory' | 'reports'
  >('dashboard');

  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  // 1. Loading state while checking Firebase Auth session
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-[7px] text-slate-800">
        <div className="bg-white p-[7px] px-6 rounded-[7px] shadow-xl border border-slate-200 flex items-center gap-[7px] text-xs font-bold space-x-2">
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-[7px] py-[7px] flex items-center justify-center gap-[7px] font-medium m-[7px] rounded-[7px]">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modalità Offline attiva · I dati inseriti sono salvati in cache locale.</span>
        </div>
      )}

      {/* Main Content Viewport with 7px spacing */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-[7px] pb-24 md:pb-[7px] space-y-[7px]">
        {currentUser.role === 'admin' ? (
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
            )}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'clients' && <ClientsView />}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'reports' && <ReportsHub />}
          </>
        ) : (
          /* WORKER VIEW - Mobile-First & Isolated */
          <>
            {activeTab !== 'reports' ? <WorkerView /> : <ReportsHub />}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar with 7px spacing */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-[7px] flex items-center justify-around text-[10px] font-semibold text-slate-600 gap-[7px]">
        {currentUser.role === 'admin' ? (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors ${
                activeTab === 'dashboard' ? 'text-emerald-800 font-bold bg-emerald-50' : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Mappa</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors ${
                activeTab === 'calendar' ? 'text-emerald-800 font-bold bg-emerald-50' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Squadre</span>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors ${
                activeTab === 'clients' ? 'text-emerald-800 font-bold bg-emerald-50' : 'text-slate-500'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Giardini</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors ${
                activeTab === 'inventory' ? 'text-emerald-800 font-bold bg-emerald-50' : 'text-slate-500'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Magazzino</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors ${
                activeTab === 'reports' ? 'text-emerald-800 font-bold bg-emerald-50' : 'text-slate-500'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Rapportini</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors flex-1 ${
                activeTab === 'dashboard' ? 'text-emerald-800 font-bold bg-emerald-50' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>I Miei Interventi</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center p-[7px] gap-[7px] rounded-[7px] transition-colors flex-1 ${
                activeTab === 'reports' ? 'text-emerald-800 font-bold bg-emerald-50' : 'text-slate-500'
              }`}
            >
              <FileCheck2 className="w-5 h-5" />
              <span>Rapportini Chiusi</span>
            </button>
          </>
        )}
      </nav>

      {/* Footer */}
      <footer className="no-print hidden md:block border-t border-slate-200 bg-white p-[7px] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-[7px] gap-[7px]">
          <div className="flex items-center gap-[7px]">
            <img src="/RAMOVIA_Logo.svg" alt="RAMOVIA" className="w-5 h-5 object-contain" />
            <span className="font-bold text-slate-700">RAMOVIA</span>
            <span>·</span>
            <span>Progetto Firebase: ramovia-a2c39</span>
          </div>

          <div className="flex items-center gap-[7px]">
            <button
              onClick={() => setShowFirebaseModal(true)}
              className="flex items-center gap-[7px] p-[7px] text-slate-600 hover:text-emerald-700 transition-colors rounded-[7px]"
            >
              <Flame className="w-3.5 h-3.5 text-emerald-700" />
              <span>Configurazione Firebase</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Firebase Modal */}
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
