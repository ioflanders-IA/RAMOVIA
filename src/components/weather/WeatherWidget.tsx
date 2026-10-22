import React, { useEffect, useState } from 'react';
import { CloudRain, Sun, Wind, Droplets, AlertTriangle, CloudSun } from 'lucide-react';
import { fetchWeatherForLocation } from '../../services/weatherService';
import { WeatherData, Client } from '../../types';

interface WeatherWidgetProps {
  clients: Client[];
  selectedClientId?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ clients, selectedClientId }) => {
  const [activeClient, setActiveClient] = useState<Client>(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0];
  });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedClientId) {
      const match = clients.find((c) => c.id === selectedClientId);
      if (match) setActiveClient(match);
    }
  }, [selectedClientId, clients]);

  useEffect(() => {
    if (!activeClient) return;

    let isMounted = true;
    setLoading(true);

    fetchWeatherForLocation(activeClient.lat, activeClient.lng)
      .then((data) => {
        if (isMounted) {
          setWeather(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeClient]);

  if (!activeClient) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
      {/* Top Bar: Title & Client Selector */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <CloudSun className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Meteo Cantieri
          </span>
        </div>

        <select
          value={activeClient.id}
          onChange={(e) => {
            const found = clients.find((c) => c.id === e.target.value);
            if (found) setActiveClient(found);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 max-w-[170px] truncate focus:outline-emerald-600"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main Weather Information */}
      {loading ? (
        <div className="py-6 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : weather ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono tracking-tight text-slate-900">
                  {weather.temp}°C
                </span>
                <span className="text-xs text-slate-500 font-medium">Lombardia</span>
              </div>
              <div className="text-xs font-medium text-slate-700 mt-0.5">{weather.condition}</div>
            </div>

            <div className="text-right space-y-1 text-xs text-slate-600 font-mono">
              <div className="flex items-center justify-end gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                <span>Pioggia: <strong>{weather.precipitationProbability}%</strong></span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <Wind className="w-3.5 h-3.5 text-slate-400" />
                <span>Vento: <strong>{weather.windSpeed} km/h</strong></span>
              </div>
            </div>
          </div>

          {/* Rain Alert Box (Critical for Gardening & Landscaping) */}
          {weather.rainAlert ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-snug">
                <strong>Allerta Pioggia ({weather.precipitationProbability}%):</strong> Rischio bagnatura erba per sfalcio e dilavamento trattamenti fitosanitari. Considerare riprogrammazione.
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2 flex items-center gap-2 text-xs text-emerald-900">
              <Sun className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Condizioni ottimali per sfalci, potature e concimazione.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-400 py-3">Dati meteo al momento non disponibili</div>
      )}
    </div>
  );
};
