import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchWeatherForClients } from '../../services/weatherService';
import { WeatherData } from '../../types';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Droplets,
  Wind,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  CloudRain,
  Sun,
  Calendar,
} from 'lucide-react';

interface WeatherViewProps {
  onBack: () => void;
}

export const WeatherView: React.FC<WeatherViewProps> = ({ onBack }) => {
  const { clients, jobs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'good'>('all');
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherData>>({});
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayJobs = useMemo(() => jobs.filter((j) => j.date === todayStr), [jobs, todayStr]);

  const loadWeatherData = useCallback((forceRefresh = false) => {
    if (clients.length === 0) return;
    setLoading(true);
    fetchWeatherForClients(clients, forceRefresh)
      .then((map) => {
        setWeatherMap(map);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Errore caricamento meteo:', err);
        setLoading(false);
      });
  }, [clients]);

  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  const alertClientsCount = useMemo(() => {
    return clients.filter((c) => weatherMap[c.id]?.rainAlert).length;
  }, [clients, weatherMap]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;

      const w = weatherMap[c.id];
      if (statusFilter === 'alert') {
        return w?.rainAlert === true;
      }
      if (statusFilter === 'good') {
        return w && !w.rainAlert;
      }
      return true;
    });
  }, [clients, searchTerm, statusFilter, weatherMap]);

  return (
    <div className="space-y-[7px]">
      
      {/* Top Header - Strict 7px Spacing & Border */}
      <div className="flex items-center justify-between gap-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs">
        {/* Left: Back button to Dashboard */}
        <button
          onClick={onBack}
          className="flex items-center gap-[7px] p-[7px] px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-[7px] border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
          title="Torna alla Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* Right: Only 'Meteo' title and borderless/backgroundless refresh icon */}
        <div className="flex items-center gap-[7px]">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Meteo
          </h1>
          <button
            onClick={() => loadWeatherData(true)}
            disabled={loading}
            className="p-1 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 bg-transparent border-0 cursor-pointer disabled:opacity-50 transition-colors"
            title="Ricarica Meteo"
            aria-label="Ricarica Meteo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filters Bar - Strict 7px Spacing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-[7px]">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca cantiere o indirizzo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[7px] text-slate-900 dark:text-slate-100 focus:outline-emerald-600 placeholder:text-slate-400"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-[7px] shrink-0 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-[7px] px-3 text-xs font-bold rounded-[7px] border transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Tutti ({clients.length})
          </button>
          <button
            onClick={() => setStatusFilter('alert')}
            className={`p-[7px] px-3 text-xs font-bold rounded-[7px] border transition-colors flex items-center gap-[7px] ${
              statusFilter === 'alert'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-slate-200 dark:border-slate-700 hover:bg-amber-50/50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Allerte ({alertClientsCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('good')}
            className={`p-[7px] px-3 text-xs font-bold rounded-[7px] border transition-colors flex items-center gap-[7px] ${
              statusFilter === 'good'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ottimali ({clients.length - alertClientsCount})</span>
          </button>
        </div>
      </div>

      {/* Cantieri Weather Cards Grid - Strict 7px Spacing */}
      {clients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] py-12 text-center text-xs text-slate-500 shadow-xs">
          Nessun cantiere registrato nell'applicazione. Aggiungi un cantiere nella sezione Clienti per monitorarne il meteo.
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[7px] py-12 text-center text-xs text-slate-500 shadow-xs">
          Nessun cantiere corrisponde ai filtri di ricerca impostati.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[7px]">
          {filteredClients.map((client) => {
            const weather = weatherMap[client.id];
            const isAlert = weather?.rainAlert;
            const clientJobsToday = todayJobs.filter(
              (j) => j.clientId === client.id || j.clientName === client.name
            );

            return (
              <div
                key={client.id}
                className={`rounded-[7px] border p-[7px] shadow-xs flex flex-col justify-between space-y-[7px] transition-all ${
                  isAlert
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header Row: Client Name, Address & SQM */}
                <div className="space-y-[7px]">
                  <div className="flex items-start justify-between gap-[7px]">
                    <div className="min-w-0">
                      <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {client.name}
                      </h2>
                      <div className="flex items-center gap-[7px] text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    </div>

                    {client.gardenNotes?.squareMeters && (
                      <span className="font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded-[7px] border border-emerald-200 dark:border-emerald-800 shrink-0">
                        {client.gardenNotes.squareMeters} mq
                      </span>
                    )}
                  </div>

                  {/* Weather Alert or Optimal Badge */}
                  <div>
                    {isAlert ? (
                      <div className="inline-flex items-center gap-[7px] p-[7px] py-1 rounded-[7px] bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Allerta Meteo (Pioggia {weather?.precipitationProbability}%)</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-[7px] p-[7px] py-1 rounded-[7px] bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold">
                        <Sun className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Condizioni Ottimali</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weather Info & Metrics */}
                <div className="pt-[7px] border-t border-slate-100 dark:border-slate-800/80 space-y-[7px]">
                  {weather ? (
                    <div className="space-y-[7px]">
                      <div className="flex items-baseline justify-between gap-[7px]">
                        <div className="flex items-baseline gap-[7px]">
                          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                            {weather.temp}°C
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            {weather.condition}
                          </span>
                        </div>

                        {weather.isRaining && (
                          <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                            <CloudRain className="w-3.5 h-3.5 animate-bounce" />
                            <span>In corso</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-[7px] text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-[7px] rounded-[7px]">
                        <div className="flex items-center gap-[7px]">
                          <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>Pioggia: <strong>{weather.precipitationProbability}%</strong></span>
                        </div>
                        <div className="flex items-center gap-[7px]">
                          <Wind className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Vento: <strong>{weather.windSpeed} km/h</strong></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-[7px] py-3 text-center text-xs text-slate-400">
                      Caricamento dati meteo in corso...
                    </div>
                  )}

                  {/* Operational Gardening Note */}
                  <div className="text-[10px] p-[7px] rounded-[7px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    {isAlert ? (
                      <span className="text-amber-800 dark:text-amber-300 font-semibold">
                        Attenzione: rischio bagnatura erba o dilavamento. Valuta rinvio sfalci.
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400">
                        Terreno idoneo: condizioni ottimali per taglio erba, siepi e potature.
                      </span>
                    )}
                  </div>

                  {/* Scheduled Jobs Today indicator */}
                  {clientJobsToday.length > 0 && (
                    <div className="p-[7px] rounded-[7px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-[7px]">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{clientJobsToday.length} intervento/i oggi</span>
                      </div>
                      <span className="font-mono text-[9px] text-emerald-800 dark:text-emerald-300">
                        {clientJobsToday[0].assignedWorkerName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="p-[7px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shadow-xs">
        <span>Dati meteo live forniti da Open-Meteo API</span>
        <button
          onClick={onBack}
          className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold text-xs"
        >
          Torna alla Dashboard
        </button>
      </div>

    </div>
  );
};
