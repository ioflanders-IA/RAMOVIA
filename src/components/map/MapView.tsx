import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Job, PolygonPoint, Client } from '../../types';
import { useApp } from '../../context/AppContext';
import { MapPin, Search, Layers, Compass } from 'lucide-react';

interface MapViewProps {
  onSelectJob?: (job: Job) => void;
  selectedJobId?: string | null;
}

export const MapView: React.FC<MapViewProps> = ({ onSelectJob, selectedJobId }) => {
  const { jobs, users, clients } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonsLayerRef = useRef<L.LayerGroup | null>(null);

  // Map layer: Street vs Satellite
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');

  // Filters
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter jobs
  const activeJobs = jobs.filter((job) => {
    if (workerFilter !== 'all' && job.assignedWorkerId !== workerFilter) return false;
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (dateFilter === 'today' && job.date !== todayStr) return false;
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [45.65, 9.32],
        zoom: 12,
        zoomControl: true,
      });

      const initialTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = initialTileLayer;

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
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (mapLayer === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }
      ).addTo(map);
    }
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
      if (client.gardenNotes?.polygonPoints && client.gardenNotes.polygonPoints.length >= 3) {
        const latLngs = client.gardenNotes.polygonPoints.map((p: PolygonPoint) => [p.lat, p.lng] as [number, number]);
        const poly = L.polygon(latLngs, {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.3,
          weight: 2,
        });

        poly.bindTooltip(
          `<b>${client.name}</b><br/>Area: ${client.gardenNotes.squareMeters || 'N/D'} mq`,
          { sticky: true }
        );

        polygonsLayer.addLayer(poly);
      }
    });

    // 2. Render Markers for ALL Saved Clients
    clients.forEach((client) => {
      // Find if this client has an active job matching current filters
      const matchingJob = activeJobs.find(
        (j) => j.clientId === client.id || j.clientName.toLowerCase() === client.name.toLowerCase()
      );

      let colorBg = '#059669'; // Default Saved Client Cantiere = Emerald Green
      let statusBadgeLabel = 'Cantiere Registrato';

      if (matchingJob) {
        if (matchingJob.status === 'scheduled') {
          colorBg = '#ea580c'; // Scheduled = Orange
          statusBadgeLabel = '⚡ In Programma';
        } else if (matchingJob.status === 'in_progress') {
          colorBg = '#0284c7'; // In Progress = Cyan/Blue
          statusBadgeLabel = '🌀 In Corso';
        } else if (matchingJob.status === 'completed') {
          colorBg = '#16a34a'; // Completed = Green
          statusBadgeLabel = '✅ Completato';
        }
      }

      const isSelected = matchingJob && selectedJobId === matchingJob.id;

      const customIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="
            position: relative;
            transform: translate(-50%, -100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          ">
            <div style="
              background-color: ${colorBg};
              color: white;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 4px 12px rgba(0,0,0,0.35);
              border: ${isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.4)'};
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
            ">
              <span>📍 ${client.name.replace('Residenza ', '').replace('Condominio ', '').replace('Villa ', 'V. ')}</span>
            </div>
            <div style="
              width: 0; 
              height: 0; 
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 8px solid ${colorBg};
              margin-top: -1px;
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([client.lat || 45.65, client.lng || 9.32], { icon: customIcon });

      const popupHtml = `
        <div style="min-width: 230px; font-family: inherit; font-size: 13px; color: #0f172a;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="
              display: inline-block; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-size: 10px; 
              font-weight: 700; 
              background: ${colorBg}18; 
              color: ${colorBg};
            ">
              ${statusBadgeLabel.toUpperCase()}
            </span>
            <span style="font-size: 11px; color: #059669; font-weight: 700;">${client.gardenNotes?.squareMeters || '0'} mq</span>
          </div>
          <h4 style="margin: 0 0 2px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${client.name}</h4>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #475569;">${client.address}</p>
          
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
  }, [clients, activeJobs, selectedJobId, onSelectJob]);

  return (
    <div className="flex flex-col h-full min-h-[460px] bg-white dark:bg-slate-900 rounded-[7px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-[7px]">
      {/* Map Header & Interactive Filter Bar */}
      <div className="p-[7px] border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-[7px]">
        <div className="flex items-center justify-between gap-[7px]">
          <div className="flex items-center gap-[7px]">
            <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Mappa Cantieri Registrati ({clients.length})
            </span>
          </div>

          {/* Inline Legend in Header */}
          <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-1 rounded-[7px] border border-slate-200 dark:border-slate-800 shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span> Registrato
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block"></span> Prog.
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span> Corso
            </span>
            <span className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-1.5">
              <span className="w-2.5 h-2.5 rounded-xs border border-emerald-500 bg-emerald-500/30 inline-block"></span> Mq
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-[7px] flex-wrap text-xs">
          {/* Layer Switcher: Stradale vs Satellite */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setMapLayer('street')}
              className={`px-2 py-0.5 rounded-[7px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                mapLayer === 'street'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stradale</span>
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`px-2 py-0.5 rounded-[7px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                mapLayer === 'satellite'
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded-[7px] font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setStatusFilter('scheduled')}
              className={`px-2 py-0.5 rounded-[7px] font-medium transition-colors ${
                statusFilter === 'scheduled'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Programmati
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2 py-0.5 rounded-[7px] font-medium transition-colors ${
                statusFilter === 'in_progress'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              In Corso
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2 py-0.5 rounded-[7px] font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Completati
            </button>
          </div>

          {/* Worker Filter */}
          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-emerald-600"
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

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-emerald-600"
          >
            <option value="all">Tutte le date</option>
            <option value="today">Solo Oggi</option>
          </select>
        </div>
      </div>

      {/* Map Render Area */}
      <div className="relative flex-1 w-full min-h-[380px] rounded-[7px] overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />

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
