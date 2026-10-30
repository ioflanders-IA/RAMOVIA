import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Job, PolygonPoint, Client, WeatherData } from '../../types';
import { useApp } from '../../context/AppContext';
import { MapPin, Search, Layers, Compass } from 'lucide-react';
import { formatLocalDate } from '../../utils/dateUtils';
import { getClientColor, getContrastTextColor } from '../../utils/clientColors';
import { fetchWeatherForClients } from '../../services/weatherService';
import { getWeatherSvg } from '../../utils/weatherIcons';

interface MapViewProps {
  onSelectJob?: (job: Job) => void;
  selectedJobId?: string | null;
}

export const MapView: React.FC<MapViewProps> = ({ onSelectJob, selectedJobId }) => {
  const { jobs, users, clients } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonsLayerRef = useRef<L.LayerGroup | null>(null);

  // Map layer: Street vs Satellite
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');

  // Filters
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Weather Map for clients
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherData>>({});

  useEffect(() => {
    if (clients.length === 0) return;
    fetchWeatherForClients(clients)
      .then((map) => setWeatherMap(map))
      .catch((err) => console.warn('Meteo cantieri fetch error:', err));
  }, [clients]);

  const todayStr = formatLocalDate(new Date());

  // Filter jobs
  const activeJobs = jobs.filter((job) => {
    if (
      workerFilter !== 'all' &&
      job.assignedWorkerId !== workerFilter &&
      (!job.assignedWorkerIds || !job.assignedWorkerIds.includes(workerFilter))
    ) {
      return false;
    }
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (dateFilter === 'today' && job.date !== todayStr && (!job.plannedDates || !job.plannedDates.includes(todayStr))) return false;
    return true;
  });

  // Helper to create street or satellite base layer
  const createTileLayer = (type: 'street' | 'satellite') => {
    if (type === 'satellite') {
      return L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Satellite Imagery',
        maxZoom: 20,
        className: 'satellite-tiles',
      });
    }
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      className: 'street-tiles',
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [45.65, 9.32],
        zoom: 12,
        zoomControl: false,
      });
      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      const initialLayer = createTileLayer(mapLayer);
      initialLayer.addTo(map);
      currentTileLayerRef.current = initialLayer;

      markersLayerRef.current = L.layerGroup().addTo(map);
      polygonsLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const invalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    invalidate();
    const t1 = setTimeout(invalidate, 150);
    const t2 = setTimeout(invalidate, 500);

    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        invalidate();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Swap tile layer when mapLayer changes (Stradale / Satellite)
  const isFirstLayerRender = useRef(true);
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isFirstLayerRender.current) {
      isFirstLayerRender.current = false;
      return;
    }

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
      currentTileLayerRef.current = null;
    }

    const newLayer = createTileLayer(mapLayer);
    newLayer.addTo(map);
    if ('bringToBack' in newLayer) {
      (newLayer as any).bringToBack();
    }
    currentTileLayerRef.current = newLayer;

    map.invalidateSize();
    const t1 = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 80);
    const t2 = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mapLayer]);

  // Update Markers for ALL Registered Clients + Active Job Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polygonsLayer = polygonsLayerRef.current;
    if (!map || !markersLayer || !polygonsLayer) return;

    markersLayer.clearLayers();
    polygonsLayer.clearLayers();

    const bounds: [number, number][] = [];

    // 1. Render Polygons for all Clients with polygon data
    clients.forEach((client) => {
      const clientColor = getClientColor(client);
      if (client.gardenNotes?.polygonPoints && client.gardenNotes.polygonPoints.length >= 3) {
        const latLngs = client.gardenNotes.polygonPoints.map((p: PolygonPoint) => [p.lat, p.lng] as [number, number]);
        const poly = L.polygon(latLngs, {
          color: clientColor,
          fillColor: clientColor,
          fillOpacity: 0.35,
          weight: 2,
        });

        poly.bindTooltip(
          `<b>${client.name}</b><br/>Area: ${client.gardenNotes.squareMeters || 'N/D'} mq`,
          { sticky: true }
        );

        polygonsLayer.addLayer(poly);
      }
    });

    // 2. Render Markers for ALL Saved Clients as Segnaposti with Weather Icon
    clients.forEach((client) => {
      // Find if this client has an active job matching current filters
      const matchingJob = activeJobs.find(
        (j) => j.clientId === client.id || j.clientName.toLowerCase() === client.name.toLowerCase()
      );

      const clientColor = getClientColor(client);
      const textColor = getContrastTextColor(clientColor);
      const clientWeather = weatherMap[client.id];
      const weatherSvg = getWeatherSvg(clientWeather, textColor, 17);

      let statusBadgeLabel = 'Cantiere Registrato';
      if (matchingJob) {
        if (matchingJob.status === 'scheduled') {
          statusBadgeLabel = 'In Programma';
        } else if (matchingJob.status === 'in_progress') {
          statusBadgeLabel = 'In Corso';
        } else if (matchingJob.status === 'completed') {
          statusBadgeLabel = 'Completato';
        }
      }

      const isSelected = matchingJob && selectedJobId === matchingJob.id;

      // Segnaposto Pin con solo icona meteo vettoriale (no nomi, no emoticon)
      const customIcon = L.divIcon({
        className: 'custom-weather-pin',
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.38));
            transition: transform 0.15s ease-out;
          ">
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: ${clientColor};
              color: ${textColor};
              display: flex;
              align-items: center;
              justify-content: center;
              border: ${isSelected ? '2.5px solid #ffffff' : '2px solid rgba(255,255,255,0.95)'};
              box-shadow: ${isSelected ? `0 0 0 3px ${clientColor}, 0 4px 10px rgba(0,0,0,0.35)` : '0 2px 4px rgba(0,0,0,0.2)'};
            ">
              ${weatherSvg}
            </div>
            <div style="
              width: 0; 
              height: 0; 
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 7px solid ${clientColor};
              margin-top: -1px;
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([client.lat || 45.65, client.lng || 9.32], { icon: customIcon });

      // Tooltip su hover con il nome del cantiere e meteo sintetico
      marker.bindTooltip(
        `<b>${client.name}</b>${clientWeather ? ` · ${clientWeather.temp}°C (${clientWeather.condition})` : ''}`,
        { direction: 'top', offset: [0, -36] }
      );

      const popupHtml = `
        <div style="min-width: 230px; font-family: inherit; font-size: 13px; color: #0f172a;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="
              display: inline-block; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-size: 10px; 
              font-weight: 700; 
              background: ${clientColor}22; 
              color: ${clientColor};
              border: 1px solid ${clientColor}44;
            ">
              ${statusBadgeLabel.toUpperCase()}
            </span>
            <span style="font-size: 11px; color: ${clientColor}; font-weight: 700;">${client.gardenNotes?.squareMeters || '0'} mq</span>
          </div>
          <h4 style="margin: 0 0 2px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${client.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569;">${client.address}</p>

          <!-- Weather info card in popup with SVG icon -->
          <div style="display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 8px; font-size: 11px;">
            <div style="color: ${clientColor}; display: flex; align-items: center;">
              ${getWeatherSvg(clientWeather, clientColor, 16)}
            </div>
            <div style="flex: 1; color: #334155; line-height: 1.3;">
              <strong>${clientWeather ? `${clientWeather.temp}°C` : '19°C'}</strong> · ${clientWeather?.condition || 'Cielo sereno'}
              ${clientWeather?.rainAlert ? `<br/><span style="color: #dc2626; font-weight: 700;">Allerta Pioggia (${clientWeather.precipitationProbability}%)</span>` : ''}
            </div>
          </div>
          
          ${
            matchingJob
              ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">${matchingJob.title}</div>
              <div style="font-size: 11px; color: #64748b;">Orario: <strong>${matchingJob.timeSlot}</strong></div>
              <div style="font-size: 11px; color: #64748b;">Assegnato a: <strong>${matchingJob.assignedWorkerName}</strong></div>
            </div>
            `
              : `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; font-size: 11px; color: #166534;">
              📞 Tel: <strong>${client.phone || 'N/D'}</strong><br/>
              🔑 Codice cancello: <strong>${client.gardenNotes?.gateCode || 'N/D'}</strong>
            </div>
            `
          }

          <div style="display: flex; gap: 6px;">
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${client.lat},${client.lng}" 
              target="_blank" 
              rel="noreferrer"
              style="
                flex: 1; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 4px; 
                background: #059669; 
                color: white; 
                text-decoration: none; 
                padding: 6px 8px; 
                border-radius: 6px; 
                font-size: 11px; 
                font-weight: 600;
              "
            >
              🧭 Naviga con GPS
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      if (matchingJob && onSelectJob) {
        marker.on('click', () => {
          onSelectJob(matchingJob);
        });
      }

      markersLayer.addLayer(marker);
      bounds.push([client.lat, client.lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [clients, activeJobs, selectedJobId, onSelectJob, weatherMap]);

  return (
    <div className="flex flex-col h-full w-full space-y-2">
      {/* Top Bar: Title & Counter on Left + Stradale/Satellite Switcher in Top Right */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">
            Mappa Cantieri ({clients.length})
          </span>
        </div>

        {/* Stradale e Satellitare in alto a destra */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-0.5 shadow-2xs text-xs">
          <button
            type="button"
            onClick={() => setMapLayer('street')}
            className={`px-2 py-0.5 rounded-[5px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              mapLayer === 'street'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stradale</span>
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('satellite')}
            className={`px-2 py-0.5 rounded-[5px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              mapLayer === 'satellite'
                ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
        </div>
      </div>

      {/* 4 Status Buttons Adapted to Page Width (Tutti smaller) */}
      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-1 shadow-2xs text-xs shrink-0">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors text-center cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Tutti
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('scheduled')}
          className={`py-1 px-1 rounded-[6px] font-medium transition-colors text-center truncate cursor-pointer ${
            statusFilter === 'scheduled'
              ? 'bg-amber-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Programmati
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('in_progress')}
          className={`py-1 px-1 rounded-[6px] font-medium transition-colors text-center truncate cursor-pointer ${
            statusFilter === 'in_progress'
              ? 'bg-sky-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          In Corso
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`py-1 px-1 rounded-[6px] font-medium transition-colors text-center truncate cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Completati
        </button>
      </div>

      {/* Dropdown Filters: Operai on left, "Tutte le date" on the right */}
      <div className="flex items-center justify-between gap-2 w-full text-xs shrink-0">
        <select
          value={workerFilter}
          onChange={(e) => setWorkerFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-emerald-600 flex-1 max-w-[220px]"
        >
          <option value="all">Tutti gli Operai</option>
          {users
            .filter((u) => u.role === 'worker')
            .map((w) => (
              <option key={w.uid} value={w.uid}>
                {w.displayName}
              </option>
            ))}
        </select>

        {/* Sposta "tutte le date" sulla destra */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-emerald-600 shrink-0 ml-auto"
        >
          <option value="all">Tutte le date</option>
          <option value="today">Solo Oggi</option>
        </select>
      </div>

      {/* Map Render Area directly on page */}
      <div className="relative flex-1 w-full min-h-[400px] rounded-[7px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div
          ref={mapContainerRef}
          className="w-full h-full min-h-[400px]"
        />

        {clients.length === 0 && (
          <div className="absolute top-[7px] left-1/2 -translate-x-1/2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 p-[7px] px-3 rounded-[7px] shadow-md text-xs text-slate-600 dark:text-slate-300 flex items-center gap-[7px] pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
            <span>Nessun cantiere salvato. Aggiungi nuovi clienti nella scheda Giardini!</span>
          </div>
        )}
      </div>
    </div>
  );
};
