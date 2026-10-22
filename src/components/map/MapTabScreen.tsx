import React from 'react';
import { MapView } from './MapView';
import { MapPin } from 'lucide-react';

export const MapTabScreen: React.FC = () => {
  return (
    <div className="space-y-[7px] pb-16 md:pb-0">
      {/* Header Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-[7px] px-3 rounded-[7px] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-[7px]">
          <div className="w-8 h-8 rounded-[7px] bg-emerald-800 flex items-center justify-center text-emerald-300 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Mappa Cantieri & Navigazione GPS</h1>
            <p className="text-[10px] text-slate-300">
              Posizione geografica dei giardini, cantieri e perimetri d'intervento in mq
            </p>
          </div>
        </div>
      </div>

      {/* Map Interactive Container with full height viewport adaptation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-sm h-[calc(100vh-210px)] min-h-[500px]">
        <MapView />
      </div>
    </div>
  );
};
