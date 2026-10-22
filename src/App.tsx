import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CalendarView } from './components/calendar/CalendarView';
import { ClientsView } from './components/clients/ClientsView';
import { InventoryView } from './components/inventory/InventoryView';
import { ReportsHub } from './components/report/ReportsHub';
import { WorkerView } from './components/worker/WorkerView';
import { FirebaseConfigModal } from './components/firebase/FirebaseConfigModal';
import { useOnlineStatus } from './hooks/usePWA';
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
  const { currentUser } = useApp();
  const isOnline = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'calendar' | 'clients' | 'inventory' | 'reports'
  >('dashboard');

  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 font-medium">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modalità Offline attiva · I dati inseriti sono salvati in cache locale.</span>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
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
          /* WORKER (OPERAIO) VIEW - Mobile-First & Isolated from Financial Data */
          <>
            {activeTab !== 'reports' ? <WorkerView /> : <ReportsHub />}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Quick Thumb Reachability) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around text-[10px] font-semibold text-slate-600">
        {currentUser.role === 'admin' ? (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                activeTab === 'dashboard' ? 'text-emerald-800 font-bold' : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mb-0.5" />
              <span>Mappa</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                activeTab === 'calendar' ? 'text-emerald-800 font-bold' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-4 h-4 mb-0.5" />
              <span>Squadre</span>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                activeTab === 'clients' ? 'text-emerald-800 font-bold' : 'text-slate-500'
              }`}
            >
              <Users className="w-4 h-4 mb-0.5" />
              <span>Giardini</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                activeTab === 'inventory' ? 'text-emerald-800 font-bold' : 'text-slate-500'
              }`}
            >
              <Package className="w-4 h-4 mb-0.5" />
              <span>Magazzino</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                activeTab === 'reports' ? 'text-emerald-800 font-bold' : 'text-slate-500'
              }`}
            >
              <FileCheck2 className="w-4 h-4 mb-0.5" />
              <span>Rapportini</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center py-1 px-6 rounded-lg transition-colors ${
                activeTab === 'dashboard' ? 'text-emerald-800 font-bold' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span>I Miei Interventi</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center py-1 px-6 rounded-lg transition-colors ${
                activeTab === 'reports' ? 'text-emerald-800 font-bold' : 'text-slate-500'
              }`}
            >
              <FileCheck2 className="w-5 h-5 mb-0.5" />
              <span>Rapportini Chiusi</span>
            </button>
          </>
        )}
      </nav>

      {/* Footer */}
      <footer className="no-print hidden md:block border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">RAMOVIA</span>
            <span>·</span>
            <span>Gestionale Operativo Manutenzione del Verde</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFirebaseModal(true)}
              className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 transition-colors"
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
