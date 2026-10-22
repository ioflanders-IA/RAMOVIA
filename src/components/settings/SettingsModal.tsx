import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Bell, Clock, Database, Download, Check, X, ShieldAlert, Flame } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onOpenFirebaseConfig?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onOpenFirebaseConfig }) => {
  const { clients, jobs, inventory, reports } = useApp();

  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [defaultStartTime, setDefaultStartTime] = useState('08:00');
  const [defaultEndTime, setDefaultEndTime] = useState('17:00');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('ramovia_setting_weather', String(weatherAlerts));
      localStorage.setItem('ramovia_setting_maint', String(maintenanceAlerts));
      localStorage.setItem('ramovia_setting_start', defaultStartTime);
      localStorage.setItem('ramovia_setting_end', defaultEndTime);
    } catch {
      // ignore
    }
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 1000);
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      clients,
      jobs,
      inventory,
      reports,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RAMOVIA_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-[7px] overflow-y-auto">
      <div className="w-full max-w-lg rounded-[7px] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 my-4 space-y-[7px]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white dark:bg-slate-950 p-[7px] px-3 flex items-center justify-between">
          <div className="flex items-center gap-[7px]">
            <Settings className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Impostazioni Applicazione</h2>
              <p className="text-[10px] text-slate-300">Configura notifiche, orari predefiniti e backup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[7px] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-[7px] text-xs text-emerald-800 font-bold flex items-center gap-[7px]">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Impostazioni salvate!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-[7px] space-y-[7px] text-xs">
          
          {/* Notifications Settings */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] space-y-[7px]">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-[7px]">
              <Bell className="w-3.5 h-3.5 text-emerald-700" />
              <span>Avvisi & Notifiche Operative</span>
            </h3>

            <label className="flex items-center justify-between p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] cursor-pointer">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Allerta meteo pioggia nei cantieri</span>
              <input
                type="checkbox"
                checked={weatherAlerts}
                onChange={(e) => setWeatherAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded-[7px]"
              />
            </label>

            <label className="flex items-center justify-between p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] cursor-pointer">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Avviso scadenze manutenzione macchinari</span>
              <input
                type="checkbox"
                checked={maintenanceAlerts}
                onChange={(e) => setMaintenanceAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded-[7px]"
              />
            </label>
          </div>

          {/* Default Hours */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] space-y-[7px]">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-[7px]">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Orario Lavorativo Predefinito</span>
            </h3>

            <div className="grid grid-cols-2 gap-[7px]">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Inizio Cantiere</label>
                <input
                  type="time"
                  value={defaultStartTime}
                  onChange={(e) => setDefaultStartTime(e.target.value)}
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Fine Cantiere</label>
                <input
                  type="time"
                  value={defaultEndTime}
                  onChange={(e) => setDefaultEndTime(e.target.value)}
                  className="w-full p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Firebase & Data Backup */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] space-y-[7px]">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-[7px]">
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span>Backup & Configurazione Cloud</span>
            </h3>

            <div className="flex flex-col sm:flex-row gap-[7px]">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 p-[7px] px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-[7px] font-bold text-xs flex items-center justify-center gap-[7px] transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Scarica Backup JSON</span>
              </button>

              {onOpenFirebaseConfig && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFirebaseConfig();
                  }}
                  className="flex-1 p-[7px] px-3 bg-emerald-950 text-emerald-200 hover:bg-emerald-900 border border-emerald-800 rounded-[7px] font-bold text-xs flex items-center justify-center gap-[7px] transition-colors"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configura Firebase</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-[7px] bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-[7px]">
            <button
              type="button"
              onClick={onClose}
              className="p-[7px] px-3.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[7px] font-bold text-xs"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="p-[7px] px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-[7px] font-bold text-xs shadow-xs flex items-center gap-[7px]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salva Impostazioni</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
