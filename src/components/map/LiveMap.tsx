'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  loadGoogleMaps,
  isValidCoordinate,
  hasGoogleMapsAuthFailed,
  onGoogleMapsAuthFailure,
} from '@/lib/maps/location-service';
import { Compass, Plus, Minus, Layers, Navigation, Crosshair, MapPin } from 'lucide-react';
import MapControls, { MapViewMode } from './MapControls';

export interface MarkerPoint {
  lat: number;
  lng: number;
  label: string;
  type: 'pickup' | 'destination' | 'driver' | 'station';
  subText?: string;
  heading?: number;
}

export interface LiveMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MarkerPoint[];
  showRoute?: boolean;
  className?: string;
  interactive?: boolean;
  showControls?: boolean;
  showTelemetry?: boolean;
  telemetrySubtext?: string;
  onLocationSelect?: (lat: number, lng: number, name?: string) => void;
}

// Al Harmain Luxury Vector Map Styles for Google Maps
const darkGoogleMapStyles: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#090d16' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#090d16' }, { weight: 3 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f8fafc' }, { weight: 1.5 }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#06281e' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#10b981' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#044e3a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#065f46' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#fbbf24' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#111827' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#34d399' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#020817' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#020817' }],
  },
];

const lightGoogleMapStyles: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 3 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#ecfdf5' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#d1fae5' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#6ee7b7' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e0f2fe' }],
  },
];

// Creates an HTMLDivElement containing raw SVG for use as AdvancedMarkerElement content
function createAdvancedMarkerContent(type: MarkerPoint['type'], heading: number = 0): HTMLDivElement {
  const div = document.createElement('div');
  div.style.cssText = 'line-height:0;';

  if (type === 'driver') {
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46">
      <defs>
        <filter id="car-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#059669" flood-opacity="0.6"/>
        </filter>
      </defs>
      <circle cx="23" cy="23" r="21" fill="#047857" fill-opacity="0.3" stroke="#10b981" stroke-width="1.5"/>
      <circle cx="23" cy="23" r="16" fill="#0f172a" stroke="#f59e0b" stroke-width="2.5" filter="url(#car-glow)"/>
      <g transform="translate(15, 15) rotate(${heading}, 8, 8)">
        <path d="M4 1 L12 1 L13 6 L14 8 L14 13 L12 13 L12 15 L10 15 L10 13 L6 13 L6 15 L4 15 L4 13 L2 13 L2 8 L3 6 Z" fill="#fbbf24"/>
        <rect x="4.5" y="3" width="7" height="3" rx="0.5" fill="#0f172a"/>
        <circle cx="4.5" cy="11.5" r="1" fill="#ffffff"/>
        <circle cx="11.5" cy="11.5" r="1" fill="#ffffff"/>
      </g>
    </svg>`;
    return div;
  }

  if (type === 'pickup') {
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
      <defs>
        <filter id="p-shadow" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#022c22" flood-opacity="0.5"/>
        </filter>
      </defs>
      <path d="M19 1 C9.6 1 2 8.6 2 18 C2 29.5 19 45 19 45 C19 45 36 29.5 36 18 C36 8.6 28.4 1 19 1 Z" fill="#047857" filter="url(#p-shadow)"/>
      <circle cx="19" cy="18" r="14" fill="#059669" stroke="#ffffff" stroke-width="2.5"/>
      <text x="19" y="23.5" font-size="14" font-weight="900" font-family="system-ui, sans-serif" fill="#ffffff" text-anchor="middle">P</text>
    </svg>`;
    return div;
  }

  if (type === 'destination') {
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
      <defs>
        <filter id="d-shadow" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#451a03" flood-opacity="0.5"/>
        </filter>
      </defs>
      <path d="M19 1 C9.6 1 2 8.6 2 18 C2 29.5 19 45 19 45 C19 45 36 29.5 36 18 C36 8.6 28.4 1 19 1 Z" fill="#b45309" filter="url(#d-shadow)"/>
      <circle cx="19" cy="18" r="14" fill="#f59e0b" stroke="#ffffff" stroke-width="2.5"/>
      <text x="19" y="23.5" font-size="14" font-weight="900" font-family="system-ui, sans-serif" fill="#0f172a" text-anchor="middle">D</text>
    </svg>`;
    return div;
  }

  // General / station marker
  div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path d="M16 1 C8.8 1 3 6.8 3 14 C3 23 16 39 16 39 C16 39 29 23 29 14 C29 6.8 23.2 1 16 1 Z" fill="#0f172a"/>
    <circle cx="16" cy="14" r="11" fill="#059669" stroke="#ffffff" stroke-width="2"/>
    <circle cx="16" cy="14" r="4" fill="#fbbf24"/>
  </svg>`;
  return div;
}


export default function LiveMap({
  center = [21.4225, 39.8262],
  zoom = 13,
  markers = [],
  showRoute = true,
  className = 'h-80 w-full rounded-3xl overflow-hidden',
  interactive = false,
  showControls = true,
  showTelemetry = true,
  telemetrySubtext,
  onLocationSelect,
}: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<'google' | 'leaflet' | 'loading'>('loading');
  const [mapMode, setMapMode] = useState<MapViewMode>('standard');

  // Google Maps references
  const gMapRef = useRef<any>(null);
  const gAdvancedMarkerRef = useRef<any>(null); // holds google.maps.marker.AdvancedMarkerElement class
  const gMarkersMapRef = useRef<Map<string, any>>(new Map());
  const gPolylineRef = useRef<any>(null);
  const gGlowPolylineRef = useRef<any>(null);
  const gInfoWindowRef = useRef<any>(null);
  const hasFitInitialBoundsRef = useRef<boolean>(false);

  // Leaflet references
  const lMapRef = useRef<any>(null);
  const lLayerGroupRef = useRef<any>(null);
  const lTileLayerRef = useRef<any>(null);

  // Initialize Map Engine (Google Maps with Leaflet fallback)
  useEffect(() => {
    let isMounted = true;

    const mountLeaflet = async () => {
      if (!isMounted || !mapContainerRef.current) return;

      if (gMapRef.current) {
        try {
          const google = (window as any).google;
          if (google?.maps?.event) {
            google.maps.event.clearInstanceListeners(gMapRef.current);
          }
        } catch { }
        gMapRef.current = null;
      }

      try {
        const L = (await import('leaflet')).default;
        if (!isMounted || !mapContainerRef.current) return;

        mapContainerRef.current.innerHTML = '';

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView(center, zoom);

        const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        const tileLayer = L.tileLayer(tileUrl, {
          maxZoom: 20,
          subdomains: 'abcd',
        }).addTo(map);

        lTileLayerRef.current = tileLayer;
        const layerGroup = L.layerGroup().addTo(map);
        lLayerGroupRef.current = layerGroup;
        lMapRef.current = map;

        setTimeout(() => {
          if (isMounted) map.invalidateSize();
        }, 200);

        if (interactive && onLocationSelect) {
          map.on('click', (e: any) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
          });
        }

        setEngine('leaflet');
      } catch (lErr) {
        console.error('[Al Harmain LiveMap] Leaflet fallback failed:', lErr);
      }
    };

    const unsubscribeAuth = onGoogleMapsAuthFailure(() => {
      console.warn('[Al Harmain LiveMap] Google Maps auth failure detected. Mounting Leaflet immediately.');
      mountLeaflet();
    });

    async function init() {
      if (typeof window === 'undefined' || !isMounted || !mapContainerRef.current) return;

      if (hasGoogleMapsAuthFailed()) {
        mountLeaflet();
        return;
      }

      const hasGoogle = await loadGoogleMaps().catch(() => false);

      if (!isMounted || !mapContainerRef.current) return;

      // If auth failed during hydration, fall back immediately
      if (!hasGoogle || hasGoogleMapsAuthFailed()) {
        mountLeaflet();
        return;
      }

      if ((window as any).google?.maps?.Map) {
        try {
          const google = (window as any).google;

          mapContainerRef.current.innerHTML = '';

          const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
          const map = new google.maps.Map(mapContainerRef.current, {
            center: { lat: center[0], lng: center[1] },
            zoom,
            disableDefaultUI: true,
            mapId,
            mapTypeId: mapMode === 'satellite' ? 'hybrid' : 'roadmap',
            // Note: custom `styles` are incompatible with mapId — use Cloud Map Styling instead
            gestureHandling: 'greedy',
            clickableIcons: false,
          });

          // Wait a short tick for gm_authFailure to fire if the key is restricted/invalid
          await new Promise<void>((r) => setTimeout(r, 300));
          if (!isMounted) return;
          if (hasGoogleMapsAuthFailed()) {
            mountLeaflet();
            return;
          }

          gMapRef.current = map;
          gInfoWindowRef.current = new google.maps.InfoWindow();

          // AdvancedMarkerElement is already hydrated by loadGoogleMaps() — grab directly
          const AdvancedMarkerElement = google.maps.marker?.AdvancedMarkerElement;
          if (AdvancedMarkerElement) {
            gAdvancedMarkerRef.current = AdvancedMarkerElement;
          } else {
            try {
              const markerLib = await google.maps.importLibrary('marker');
              if (isMounted) {
                gAdvancedMarkerRef.current = markerLib?.AdvancedMarkerElement;
              }
            } catch (markerErr) {
              console.warn('[Al Harmain LiveMap] Failed to load marker library:', markerErr);
            }
          }

          if (!isMounted) return;

          if (interactive && onLocationSelect) {
            map.addListener('click', (e: any) => {
              if (e.latLng) {
                onLocationSelect(e.latLng.lat(), e.latLng.lng());
              }
            });
          }

          setEngine('google');
          return;
        } catch (err) {
          console.warn('[Al Harmain LiveMap] Google Maps init error, falling back to Leaflet:', err);
          mountLeaflet();
          return;
        }
      }

      mountLeaflet();
    }

    init();

    return () => {
      isMounted = false;
      unsubscribeAuth();

      // AdvancedMarkerElement cleanup: set .map = null to detach and allow GC
      for (const marker of gMarkersMapRef.current.values()) {
        try { marker.map = null; } catch { }
      }
      gMarkersMapRef.current.clear();

      if (gPolylineRef.current) { gPolylineRef.current.setMap(null); gPolylineRef.current = null; }
      if (gGlowPolylineRef.current) { gGlowPolylineRef.current.setMap(null); gGlowPolylineRef.current = null; }
      if (gInfoWindowRef.current) { try { gInfoWindowRef.current.close(); } catch { } }

      gAdvancedMarkerRef.current = null;

      if (lMapRef.current) {
        try { lMapRef.current.remove(); } catch { }
        lMapRef.current = null;
        lLayerGroupRef.current = null;
        lTileLayerRef.current = null;
      }
    };
  }, []);

  // Map Mode Layer Application (Google & Leaflet)
  const applyGoogleMapMode = useCallback(
    (mode: MapViewMode) => {
      if (!gMapRef.current || !(window as any).google?.maps) return;
      const map = gMapRef.current;
      // Custom styles are not supported when mapId is set; Cloud Map Styling handles theming.
      if (mode === 'satellite') {
        map.setMapTypeId('hybrid');
      } else {
        map.setMapTypeId('roadmap');
      }
    },
    []
  );


  const applyLeafletMapMode = useCallback(
    (mode: MapViewMode) => {
      if (!lMapRef.current || !lTileLayerRef.current) return;
      let tileUrl = '';
      if (mode === 'satellite') {
        tileUrl = 'https://server.arcgisonline.com/ArcMap/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      } else {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      }
      try {
        lTileLayerRef.current.setUrl(tileUrl);
      } catch { }
    },
    []
  );

  const handleMapModeChange = useCallback(
    (newMode: MapViewMode) => {
      setMapMode(newMode);
      if (engine === 'google') {
        applyGoogleMapMode(newMode);
      } else if (engine === 'leaflet') {
        applyLeafletMapMode(newMode);
      }
    },
    [engine, applyGoogleMapMode, applyLeafletMapMode]
  );


  // Window resize observer to invalidate Leaflet map size
  useEffect(() => {
    const handleResize = () => {
      if (engine === 'leaflet' && lMapRef.current) {
        lMapRef.current.invalidateSize();
      } else if (engine === 'google' && gMapRef.current && (window as any).google?.maps) {
        (window as any).google.maps.event.trigger(gMapRef.current, 'resize');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [engine]);

  // Handle Markers & Route updates for Google Maps
  useEffect(() => {
    if (engine !== 'google' || !gMapRef.current || !gAdvancedMarkerRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;
    const AdvancedMarkerElement = gAdvancedMarkerRef.current;
    const map = gMapRef.current;
    const currentMarkersMap = gMarkersMapRef.current;
    const incomingKeys = new Set<string>();

    const validPoints: any[] = [];

    markers.forEach((m, idx) => {
      if (!isValidCoordinate(m.lat, m.lng)) return;

      const key = `${m.type}-${idx}`;
      incomingKeys.add(key);
      const pos = new google.maps.LatLng(m.lat, m.lng);
      validPoints.push(pos);

      let marker = currentMarkersMap.get(key);
      if (!marker) {
        const content = createAdvancedMarkerContent(m.type, m.heading || 0);
        marker = new AdvancedMarkerElement({
          position: pos,
          map,
          title: m.label,
          content,
          gmpClickable: true,
          zIndex: m.type === 'driver' ? 100 : m.type === 'pickup' ? 80 : 70,
        });

        marker.addEventListener('gmp-click', () => {
          if (gInfoWindowRef.current) {
            gInfoWindowRef.current.setContent(`
              <div style="font-family: system-ui, sans-serif; padding: 6px 10px; max-width: 240px; color: #0f172a;">
                <div style="font-weight: 700; font-size: 13px; color: #047857;">${m.label}</div>
                ${m.subText ? `<div style="font-size: 11px; color: #64748b; margin-top: 3px;">${m.subText}</div>` : ''}
              </div>
            `);
            gInfoWindowRef.current.open({ anchor: marker, map });
          }
        });

        currentMarkersMap.set(key, marker);
      } else {
        marker.position = pos;
        marker.title = m.label;
        marker.content = createAdvancedMarkerContent(m.type, m.heading || 0);
      }
    });

    for (const [key, marker] of currentMarkersMap.entries()) {
      if (!incomingKeys.has(key)) {
        marker.map = null;
        currentMarkersMap.delete(key);
      }
    }

    // Polyline routing
    if (showRoute && validPoints.length >= 2) {
      if (!gPolylineRef.current) {
        gGlowPolylineRef.current = new google.maps.Polyline({
          path: validPoints,
          geodesic: true,
          strokeColor: '#10b981',
          strokeOpacity: 0.35,
          strokeWeight: 8,
          map,
        });
        gPolylineRef.current = new google.maps.Polyline({
          path: validPoints,
          geodesic: true,
          strokeColor: '#059669',
          strokeOpacity: 0.95,
          strokeWeight: 4,
          map,
        });
      } else {
        gGlowPolylineRef.current?.setPath(validPoints);
        gPolylineRef.current?.setPath(validPoints);
      }
    } else {
      if (gPolylineRef.current) {
        gPolylineRef.current.setMap(null);
        gPolylineRef.current = null;
      }
      if (gGlowPolylineRef.current) {
        gGlowPolylineRef.current.setMap(null);
        gGlowPolylineRef.current = null;
      }
    }

    if (validPoints.length > 0 && !hasFitInitialBoundsRef.current) {
      const bounds = new google.maps.LatLngBounds();
      validPoints.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      hasFitInitialBoundsRef.current = true;
    }
  }, [markers, engine, showRoute]);

  // Leaflet Marker & Polyline updates (fallback)
  useEffect(() => {
    if (engine !== 'leaflet' || !lMapRef.current || !lLayerGroupRef.current) return;

    import('leaflet').then((LModule) => {
      const L = LModule.default;
      const layerGroup = lLayerGroupRef.current;
      const map = lMapRef.current;
      if (!layerGroup || !map) return;
      layerGroup.clearLayers();

      const latlngs: [number, number][] = [];

      markers.forEach((m) => {
        if (!isValidCoordinate(m.lat, m.lng)) return;
        latlngs.push([m.lat, m.lng]);

        let iconHtml = '';
        if (m.type === 'driver') {
          iconHtml = `
            <div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400 opacity-60"></span>
              <div class="relative w-9 h-9 rounded-full bg-slate-950 border-2 border-amber-400 text-amber-300 flex items-center justify-center shadow-2xl text-xs font-bold" style="transform: rotate(${m.heading || 0}deg);">
                🚘
              </div>
            </div>
          `;
        } else if (m.type === 'pickup') {
          iconHtml = `
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white shadow-xl border-2 border-white text-xs font-black">
              P
            </div>
          `;
        } else if (m.type === 'destination') {
          iconHtml = `
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-slate-950 shadow-xl border-2 border-white text-xs font-black">
              D
            </div>
          `;
        } else {
          iconHtml = `
            <div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-white shadow-md border-2 border-white text-[11px]">
              📍
            </div>
          `;
        }

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-live-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(layerGroup);
        if (m.label) {
          marker.bindPopup(`
            <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; color: #0f172a;">
              <strong style="color: #047857;">${m.label}</strong>
              ${m.subText ? `<p style="margin: 3px 0 0 0; color: #475569; font-size: 11px;">${m.subText}</p>` : ''}
            </div>
          `);
        }
      });

      if (showRoute && latlngs.length >= 2) {
        L.polyline(latlngs, {
          color: '#059669',
          weight: 4,
          opacity: 0.9,
          dashArray: '6, 8',
        }).addTo(layerGroup);
      }

      if (latlngs.length >= 2 && !hasFitInitialBoundsRef.current) {
        try {
          map.fitBounds(latlngs, { padding: [40, 40] });
          hasFitInitialBoundsRef.current = true;
        } catch { }
      } else if (latlngs.length === 1 && !hasFitInitialBoundsRef.current) {
        map.panTo(latlngs[0]);
        hasFitInitialBoundsRef.current = true;
      }
    });
  }, [markers, engine, showRoute]);

  // Recenter map action
  const handleRecenter = useCallback(() => {
    if (engine === 'google' && gMapRef.current && (window as any).google?.maps) {
      const google = (window as any).google;
      const validPoints = markers
        .filter((m) => isValidCoordinate(m.lat, m.lng))
        .map((m) => new google.maps.LatLng(m.lat, m.lng));

      if (validPoints.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        validPoints.forEach((p) => bounds.extend(p));
        gMapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      } else if (validPoints.length === 1) {
        gMapRef.current.panTo(validPoints[0]);
        gMapRef.current.setZoom(15);
      } else {
        gMapRef.current.panTo({ lat: center[0], lng: center[1] });
        gMapRef.current.setZoom(zoom);
      }
    } else if (engine === 'leaflet' && lMapRef.current) {
      const latlngs = markers
        .filter((m) => isValidCoordinate(m.lat, m.lng))
        .map((m) => [m.lat, m.lng] as [number, number]);
      if (latlngs.length > 1) {
        lMapRef.current.fitBounds(latlngs, { padding: [40, 40] });
      } else if (latlngs.length === 1) {
        lMapRef.current.setView(latlngs[0], 15);
      } else {
        lMapRef.current.setView(center, zoom);
      }
    }
  }, [markers, center, zoom, engine]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (engine === 'google' && gMapRef.current) {
      gMapRef.current.setZoom((gMapRef.current.getZoom() || zoom) + 1);
    } else if (engine === 'leaflet' && lMapRef.current) {
      lMapRef.current.zoomIn();
    }
  }, [engine, zoom]);

  const handleZoomOut = useCallback(() => {
    if (engine === 'google' && gMapRef.current) {
      gMapRef.current.setZoom((gMapRef.current.getZoom() || zoom) - 1);
    } else if (engine === 'leaflet' && lMapRef.current) {
      lMapRef.current.zoomOut();
    }
  }, [engine, zoom]);



  const driverMarker = markers.find((m) => m.type === 'driver');
  const currentCoords = driverMarker
    ? `${driverMarker.lat.toFixed(4)}° N, ${driverMarker.lng.toFixed(4)}° E`
    : `${center[0].toFixed(4)}° N, ${center[1].toFixed(4)}° E`;

  return (
    <div className={`relative z-10 isolate overflow-hidden ${className}`}>
      {/* Map Canvas Mount */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Luxury HUD Controls (Top-Right) */}
      {showControls && (
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onCurrentLocation={handleRecenter}
          mapMode={mapMode}
          onMapModeChange={handleMapModeChange}
          currentLocationTitle="Recenter Radar on Active Vehicle"
        />
      )}

      {/* Bottom Telemetry & Status Pill */}
      {showTelemetry && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] flex items-center justify-between sm:justify-start gap-2 bg-card/95 dark:bg-slate-950/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl border border-base/80 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-primary">
              Live Radar Telemetry
            </span>
          </div>

          <span className="text-[10px] font-mono text-muted hidden md:inline">
            &bull; {currentCoords}
          </span>

          <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            {engine === 'google' ? 'Google Ultra' : 'CartoDB VIP'}
          </span>
        </div>
      )}
    </div>
  );
}
