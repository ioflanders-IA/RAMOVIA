import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, MapPin, Pentagon as PolygonIcon, Trash2, RotateCcw, Maximize2, X, Check, CornerUpLeft, Layers, Compass } from 'lucide-react';
import { PolygonPoint } from '../../types';

interface ClientMapPickerProps {
  address: string;
  lat: number;
  lng: number;
  polygonPoints?: PolygonPoint[];
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  onPolygonChange: (points: PolygonPoint[], calculatedMq: number) => void;
}

// Haversine / Geodesic area calculation for polygon on Earth in square meters
function calculatePolygonAreaSqMeters(points: PolygonPoint[]): number {
  if (!points || points.length < 3) return 0;

  const R = 6378137; // Earth's mean radius in meters
  let area = 0;

  if (points.length > 2) {
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      const lat1Rad = (p1.lat * Math.PI) / 180;
      const lat2Rad = (p2.lat * Math.PI) / 180;
      const deltaLngRad = ((p2.lng - p1.lng) * Math.PI) / 180;

      area += (deltaLngRad) * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
    }
    area = (area * R * R) / 2;
  }

  return Math.round(Math.abs(area));
}

export const ClientMapPicker: React.FC<ClientMapPickerProps> = ({
  address,
  lat,
  lng,
  polygonPoints = [],
  onLocationChange,
  onPolygonChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fullMapContainerRef = useRef<HTMLDivElement>(null);

  const mapInstanceRef = useRef<L.Map | null>(null);
  const fullMapInstanceRef = useRef<L.Map | null>(null);
  const inlineTileLayerRef = useRef<L.TileLayer | null>(null);
  const fullTileLayerRef = useRef<L.TileLayer | null>(null);

  const markerRef = useRef<L.Marker | null>(null);
  const fullMarkerRef = useRef<L.Marker | null>(null);

  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const fullPolygonLayerRef = useRef<L.Polygon | null>(null);

  const vertexMarkersRef = useRef<L.CircleMarker[]>([]);
  const fullVertexMarkersRef = useRef<L.CircleMarker[]>([]);

  // Map layer: satellite (recommended for tracing garden borders) vs street
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('satellite');

  const [mode, setMode] = useState<'pin' | 'polygon'>('pin');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(address);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentPoints, setCurrentPoints] = useState<PolygonPoint[]>(polygonPoints);

  const calculatedMq = calculatePolygonAreaSqMeters(currentPoints);

  // Sync currentPoints back to parent ClientModal safely via Effect
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const newMq = calculatePolygonAreaSqMeters(currentPoints);
    onPolygonChange(currentPoints, newMq);
  }, [currentPoints]);

  // Clean SVG Pin Marker Icon
  const createPinIcon = () =>
    L.divIcon({
      className: 'custom-pin-icon-clean',
      html: `
        <div style="
          position: relative;
          transform: translate(-50%, -100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <svg width="28" height="38" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.4));">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="#10b981"/>
          </svg>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  // Initialize Regular Inline Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = lat || 45.65;
      const initialLng = lng || 9.32;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: true,
      });

      const initialTile = L.tileLayer(
        mapLayer === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: mapLayer === 'satellite' ? 'Tiles &copy; Esri' : '&copy; OpenStreetMap',
          maxZoom: 19,
        }
      ).addTo(map);
      inlineTileLayerRef.current = initialTile;

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: createPinIcon(),
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onLocationChange(position.lat, position.lng);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }
  }, []);

  // Initialize Full Screen Map when opened
  useEffect(() => {
    if (!isFullScreen || !fullMapContainerRef.current) return;

    const initialLat = lat || 45.65;
    const initialLng = lng || 9.32;

    const fullMap = L.map(fullMapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      zoomControl: true,
    });

    const initialFullTile = L.tileLayer(
      mapLayer === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: mapLayer === 'satellite' ? 'Tiles &copy; Esri' : '&copy; OpenStreetMap',
        maxZoom: 19,
      }
    ).addTo(fullMap);
    fullTileLayerRef.current = initialFullTile;

    const fullMarker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: createPinIcon(),
    }).addTo(fullMap);

    fullMarker.on('dragend', () => {
      const position = fullMarker.getLatLng();
      onLocationChange(position.lat, position.lng);
    });

    fullMarkerRef.current = fullMarker;
    fullMapInstanceRef.current = fullMap;

    // Click handler for full screen map vertex tracing
    const handleFullMapClick = (e: L.LeafletMouseEvent) => {
      if (mode === 'pin') {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (fullMarkerRef.current) {
          fullMarkerRef.current.setLatLng([newLat, newLng]);
        }
        onLocationChange(newLat, newLng);
      } else if (mode === 'polygon') {
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
        setCurrentPoints((prev) => [...prev, newPoint]);
      }
    };

    fullMap.on('click', handleFullMapClick);

    setTimeout(() => {
      fullMap.invalidateSize();
    }, 150);

    return () => {
      fullMap.off('click', handleFullMapClick);
      fullMap.remove();
      fullMapInstanceRef.current = null;
    };
  }, [isFullScreen, mode]);

  // Swap tile layer on both maps when mapLayer changes (Stradale / Satellite)
  useEffect(() => {
    const inlineMap = mapInstanceRef.current;
    if (inlineMap) {
      if (inlineTileLayerRef.current) inlineMap.removeLayer(inlineTileLayerRef.current);
      inlineTileLayerRef.current = L.tileLayer(
        mapLayer === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: mapLayer === 'satellite' ? 'Tiles &copy; Esri' : '&copy; OpenStreetMap',
          maxZoom: 19,
        }
      ).addTo(inlineMap);
    }

    const fullMap = fullMapInstanceRef.current;
    if (fullMap) {
      if (fullTileLayerRef.current) fullMap.removeLayer(fullTileLayerRef.current);
      fullTileLayerRef.current = L.tileLayer(
        mapLayer === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: mapLayer === 'satellite' ? 'Tiles &copy; Esri' : '&copy; OpenStreetMap',
          maxZoom: 19,
        }
      ).addTo(fullMap);
    }
  }, [mapLayer]);

  // Sync mode click listeners on Inline Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (mode === 'pin') {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        }
        onLocationChange(newLat, newLng);
      } else if (mode === 'polygon') {
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
        setCurrentPoints((prev) => [...prev, newPoint]);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [mode]);

  // Sync Polygon Layer Rendering for Inline & Full Screen Maps
  useEffect(() => {
    // Inline Map Polygon
    const map = mapInstanceRef.current;
    if (map) {
      if (polygonLayerRef.current) {
        map.removeLayer(polygonLayerRef.current);
        polygonLayerRef.current = null;
      }
      vertexMarkersRef.current.forEach((vm) => map.removeLayer(vm));
      vertexMarkersRef.current = [];

      if (currentPoints.length > 0) {
        const latLngs = currentPoints.map((p) => [p.lat, p.lng] as [number, number]);
        if (currentPoints.length >= 2) {
          const poly = L.polygon(latLngs, {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.35,
            weight: 3,
            dashArray: '6, 6',
          }).addTo(map);
          polygonLayerRef.current = poly;
        }

        currentPoints.forEach((p) => {
          const vm = L.circleMarker([p.lat, p.lng], {
            radius: 5,
            color: '#047857',
            fillColor: '#ffffff',
            fillOpacity: 1,
            weight: 2,
          }).addTo(map);
          vertexMarkersRef.current.push(vm);
        });
      }
    }

    // Full Screen Map Polygon
    const fullMap = fullMapInstanceRef.current;
    if (fullMap) {
      if (fullPolygonLayerRef.current) {
        fullMap.removeLayer(fullPolygonLayerRef.current);
        fullPolygonLayerRef.current = null;
      }
      fullVertexMarkersRef.current.forEach((vm) => fullMap.removeLayer(vm));
      fullVertexMarkersRef.current = [];

      if (currentPoints.length > 0) {
        const latLngs = currentPoints.map((p) => [p.lat, p.lng] as [number, number]);
        if (currentPoints.length >= 2) {
          const poly = L.polygon(latLngs, {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.35,
            weight: 3,
            dashArray: '6, 6',
          }).addTo(fullMap);
          fullPolygonLayerRef.current = poly;
        }

        currentPoints.forEach((p) => {
          const vm = L.circleMarker([p.lat, p.lng], {
            radius: 6,
            color: '#047857',
            fillColor: '#ffffff',
            fillOpacity: 1,
            weight: 2,
          }).addTo(fullMap);
          fullVertexMarkersRef.current.push(vm);
        });
      }
    }
  }, [currentPoints, isFullScreen]);

  // Geocoding function using OpenStreetMap Nominatim
  const handleGeocodeSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const result = results[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 17);
          markerRef.current.setLatLng([newLat, newLng]);
        }

        if (fullMapInstanceRef.current && fullMarkerRef.current) {
          fullMapInstanceRef.current.setView([newLat, newLng], 17);
          fullMarkerRef.current.setLatLng([newLat, newLng]);
        }

        onLocationChange(newLat, newLng, result.display_name);
      } else {
        setSearchError('Indirizzo non trovato. Trascina la puntina manualmente sulla mappa.');
      }
    } catch {
      setSearchError('Errore durante la ricerca indirizzo. Verifica la connessione.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearPolygon = () => {
    setCurrentPoints([]);
  };

  // Remove last placed vertex point (Undo)
  const handleUndoLastPoint = () => {
    if (currentPoints.length === 0) return;
    setCurrentPoints((prev) => prev.slice(0, -1));
  };

  const handleOpenFullScreenPolygon = () => {
    setMode('polygon');
    setIsFullScreen(true);
  };

  return (
    <div className="space-y-[7px]">
      {/* Search Bar & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-[7px]">
        {/* Geocoding Input */}
        <div className="flex items-center gap-[7px] flex-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGeocodeSearch();
                }
              }}
              placeholder="Cerca via, civico, città (es. Viale Parioli 74, Roma)"
              className="w-full p-[7px] pl-8 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[7px] text-xs text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="button"
            onClick={handleGeocodeSearch}
            disabled={isSearching}
            className="p-[7px] px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-[7px] text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isSearching ? (
              <span className="animate-spin text-xs">🌀</span>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Trova</span>
              </>
            )}
          </button>
        </div>

        {/* Layer Switcher & Mode Selector */}
        <div className="flex items-center gap-[7px] flex-wrap text-xs">
          {/* Stradale vs Satellite Switch */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-[7px] shrink-0 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMapLayer('street')}
              className={`px-2 py-0.5 rounded-[5px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                mapLayer === 'street'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Stradale</span>
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`px-2 py-0.5 rounded-[5px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                mapLayer === 'satellite'
                  ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Satellite</span>
            </button>
          </div>

          <div className="flex items-center gap-[7px] bg-slate-100 dark:bg-slate-800 p-1 rounded-[7px] shrink-0">
            <button
              type="button"
              onClick={() => setMode('pin')}
              className={`px-2.5 py-1 rounded-[7px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'pin'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Sposta Segnaposto</span>
            </button>

            <button
              type="button"
              onClick={handleOpenFullScreenPolygon}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[7px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PolygonIcon className="w-3.5 h-3.5" />
              <span>Traccia Area Giardino</span>
              <Maximize2 className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {searchError && (
        <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-[7px] rounded-[7px] border border-amber-200 dark:border-amber-800">
          ⚠️ {searchError}
        </div>
      )}

      {/* Inline Map Frame */}
      <div className="relative w-full h-[240px] rounded-[7px] border border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Area Indicator in Bottom Right Corner (Fixed min-width) */}
        <div className="absolute bottom-[24px] right-[8px] z-[400] bg-slate-900/90 text-emerald-400 border border-emerald-800/80 rounded-[7px] p-[5px] px-3 shadow-md flex items-center justify-center gap-1.5 text-xs font-mono font-bold tabular-nums min-w-[115px] select-none">
          <PolygonIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{calculatedMq} mq</span>
          {currentPoints.length > 0 && (
            <button
              type="button"
              onClick={handleClearPolygon}
              className="ml-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Resetta tracciato"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Full-Screen Polygon Tracing Modal Overlay */}
      {isFullScreen && (
        <div className="fixed inset-0 z-[2500] bg-slate-950/95 backdrop-blur-md flex flex-col p-[7px] space-y-[7px]">
          {/* Full Screen Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-2 px-3 flex items-center justify-between text-white shrink-0 shadow-lg">
            <div className="flex items-center gap-2">
              <PolygonIcon className="w-5 h-5 text-emerald-400 shrink-0" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Traccia Area
              </h2>
            </div>

            {/* Actions & Satellite Switcher */}
            <div className="flex items-center gap-3">
              {/* Stradale vs Satellite Switch in Fullscreen */}
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-[6px] border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setMapLayer('street')}
                  className={`px-2 py-0.5 rounded-[4px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    mapLayer === 'street'
                      ? 'bg-slate-950 text-white shadow-2xs font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Stradale</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapLayer('satellite')}
                  className={`px-2 py-0.5 rounded-[4px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    mapLayer === 'satellite'
                      ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-3 h-3" />
                  <span>Satellite</span>
                </button>
              </div>

              {/* Indietro / Undo last point button */}
              {currentPoints.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndoLastPoint}
                  className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                  title="Indietro (Annulla ultimo punto)"
                >
                  <CornerUpLeft className="w-5 h-5" />
                </button>
              )}

              {/* Reset all points */}
              {currentPoints.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearPolygon}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Resetta tutti i vertici"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              {/* Save Area */}
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                title="Salva Area"
              >
                <Check className="w-6 h-6" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Chiudi"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Full Screen Map Viewport */}
          <div className="relative flex-1 w-full rounded-[7px] border border-slate-800 overflow-hidden shadow-2xl">
            <div ref={fullMapContainerRef} className="w-full h-full" />

            {/* Fixed-Width Square Meter Badge in Bottom Right Corner (Where indicated in red box) */}
            <div className="absolute bottom-[24px] right-[8px] z-[400] bg-slate-900/90 text-emerald-400 border border-emerald-800/80 rounded-[7px] p-[6px] px-3 shadow-xl flex items-center justify-center gap-1.5 text-xs font-mono font-bold tabular-nums min-w-[120px] select-none">
              <PolygonIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{calculatedMq} mq</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
