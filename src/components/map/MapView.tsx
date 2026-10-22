import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Job } from '../../types';
import { useApp } from '../../context/AppContext';
import { Calendar, CheckCircle2, Clock, MapPin, Navigation, User, AlertTriangle } from 'lucide-react';

interface MapViewProps {
  onSelectJob?: (job: Job) => void;
  selectedJobId?: string | null;
}

export const MapView: React.FC<MapViewProps> = ({ onSelectJob, selectedJobId }) => {
  const { jobs, users } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'week'

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
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
        center: [42.0, 12.5],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Map instance is kept or cleanup on unmount
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (filteredJobs.length === 0) return;

    const bounds: [number, number][] = [];

    filteredJobs.forEach((job) => {
      const isSelected = selectedJobId === job.id;

      // Color coding
      let colorBg = '#ea580c'; // scheduled = orange
      let statusLabel = 'Programmato';
      if (job.status === 'in_progress') {
        colorBg = '#0284c7'; // in progress = cyan/blue
        statusLabel = 'In Corso';
      } else if (job.status === 'completed') {
        colorBg = '#16a34a'; // completed = green
        statusLabel = 'Completato';
      }

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
              font-weight: 600;
              box-shadow: 0 4px 10px rgba(0,0,0,0.25);
              border: ${isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.4)'};
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
            ">
              <span>${job.clientName.replace('Residenza ', '').replace('Condominio ', '').replace('Villa ', 'V. ')}</span>
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

      const marker = L.marker([job.lat, job.lng], { icon: customIcon });

      const popupHtml = `
        <div style="min-width: 220px; font-family: inherit; font-size: 13px; color: #1e293b;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="
              display: inline-block; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-size: 10px; 
              font-weight: 700; 
              background: ${colorBg}15; 
              color: ${colorBg};
            ">
              ${statusLabel.toUpperCase()}
            </span>
            <span style="font-size: 11px; color: #64748b; font-family: monospace;">${job.timeSlot}</span>
          </div>
          <h4 style="margin: 0 0 2px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${job.clientName}</h4>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #475569;">${job.clientAddress}</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px;">
            <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">${job.title}</div>
            <div style="font-size: 11px; color: #64748b;">Assegnato a: <strong>${job.assignedWorkerName}</strong></div>
          </div>
          <div style="display: flex; gap: 6px;">
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}" 
              target="_blank" 
              rel="noreferrer"
              style="
                flex: 1; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 4px; 
                background: #1e293b; 
                color: white; 
                text-decoration: none; 
                padding: 6px 8px; 
                border-radius: 6px; 
                font-size: 11px; 
                font-weight: 500;
              "
            >
              Naviga
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectJob) {
          onSelectJob(job);
        }
      });

      markersLayer.addLayer(marker);
      bounds.push([job.lat, job.lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredJobs, selectedJobId, onSelectJob]);

  return (
    <div className="flex flex-col h-full bg-white rounded-[7px] border border-slate-200 shadow-sm overflow-hidden space-y-[7px]">
      {/* Map Header & Interactive Filter Bar */}
      <div className="p-[7px] border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-[7px]">
        <div className="flex items-center gap-[7px]">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Mappa Cantieri & Cantieri Attivi
          </span>
          <span className="text-xs text-slate-500 font-mono">({filteredJobs.length} interventi)</span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-[7px] flex-wrap text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-[7px] bg-white border border-slate-200 rounded-[7px] p-[7px]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded-[7px] font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setStatusFilter('scheduled')}
              className={`px-2 py-1 rounded-[7px] font-medium transition-colors ${
                statusFilter === 'scheduled' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Programmati
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2 py-1 rounded-[7px] font-medium transition-colors ${
                statusFilter === 'in_progress' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Corso
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2 py-1 rounded-[7px] font-medium transition-colors ${
                statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completati
            </button>
          </div>

          {/* Worker Filter */}
          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-[7px] px-2.5 py-1 text-xs text-slate-700 focus:outline-emerald-600"
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
            className="bg-white border border-slate-200 rounded-[7px] px-2.5 py-1 text-xs text-slate-700 focus:outline-emerald-600"
          >
            <option value="all">Tutte le date</option>
            <option value="today">Solo Oggi</option>
          </select>
        </div>
      </div>

      {/* Map Render Area */}
      <div className="relative flex-1 min-h-[360px] w-full">
        <div ref={mapContainerRef} className="w-full h-full" />

        {filteredJobs.length === 0 && (
          <div className="absolute top-[7px] left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur-xs border border-slate-200 p-[7px] rounded-[7px] shadow-md text-xs text-slate-600 flex items-center gap-[7px] pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>Nessun cantiere programmato sulla mappa</span>
          </div>
        )}

        {/* Floating Quick Legend */}
        <div className="absolute bottom-[7px] left-[7px] z-[400] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-[7px] p-[7px] shadow-md text-[11px] text-slate-700 flex items-center gap-[7px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            <span>Programmato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            <span>In Corso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Completato</span>
          </div>
        </div>
      </div>
    </div>
  );
};
