'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPin, Navigation, Compass, Layers } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import MapControls, { MapViewMode } from './MapControls';
import {
  loadGoogleMaps,
  isGoogleMapsReady,
  hasGoogleMapsAuthFailed,
  onGoogleMapsAuthFailure,
  formatDistance,
  formatDuration,
  isValidCoordinate,
} from '@/lib/maps/location-service';

export interface BookingMapProps {
  pickup?: { latitude: number; longitude: number; address?: string } | null;
  destination?: { latitude: number; longitude: number; address?: string } | null;
  stops?: { latitude: number; longitude: number; address?: string }[];
  userLocation?: { latitude: number; longitude: number; accuracy?: number } | null;
  driverLocation?: { latitude: number; longitude: number; heading?: number; label?: string; subText?: string } | null;
  routeCoords?: [number, number][];
  distanceKm?: number;
  durationMinutes?: number;
  interactiveMode?: 'none' | 'pickup' | 'destination';
  onLocationPick?: (lat: number, lng: number) => void;
  onPickupAdjust?: (lat: number, lng: number) => void;
  onDestinationAdjust?: (lat: number, lng: number) => void;
  onRecenterClick?: () => void;
  className?: string;
}

// Custom Luxury Map Styles for Al Harmain Travels
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

// Raw SVG strings for AdvancedMarkerElement .content (no data-URI encoding needed)
const PICKUP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
  <defs>
    <filter id="p-shadow" x="-30%" y="-20%" width="160%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#022c22" flood-opacity="0.45"/>
    </filter>
  </defs>
  <path d="M19 1 C9.6 1 2 8.6 2 18 C2 29.5 19 46 19 46 C19 46 36 29.5 36 18 C36 8.6 28.4 1 19 1 Z" fill="#047857" filter="url(#p-shadow)"/>
  <circle cx="19" cy="18" r="14.5" fill="#059669" stroke="#ffffff" stroke-width="2.5"/>
  <text x="19" y="23.5" font-size="15" font-weight="900" font-family="system-ui, -apple-system, sans-serif" fill="#ffffff" text-anchor="middle">P</text>
</svg>`;

const DEST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
  <defs>
    <filter id="d-shadow" x="-30%" y="-20%" width="160%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#451a03" flood-opacity="0.45"/>
    </filter>
  </defs>
  <path d="M19 1 C9.6 1 2 8.6 2 18 C2 29.5 19 46 19 46 C19 46 36 29.5 36 18 C36 8.6 28.4 1 19 1 Z" fill="#b45309" filter="url(#d-shadow)"/>
  <circle cx="19" cy="18" r="14.5" fill="#f59e0b" stroke="#ffffff" stroke-width="2.5"/>
  <text x="19" y="23.5" font-size="15" font-weight="900" font-family="system-ui, -apple-system, sans-serif" fill="#0f172a" text-anchor="middle">D</text>
</svg>`;

const USER_GPS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
  <defs>
    <radialGradient id="gps-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="#2563eb" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
    </radialGradient>
    <filter id="gps-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#0f172a" flood-opacity="0.45"/>
    </filter>
  </defs>
  <circle cx="19" cy="19" r="18" fill="url(#gps-halo)"/>
  <circle cx="19" cy="19" r="8.5" fill="#ffffff" filter="url(#gps-shadow)"/>
  <circle cx="19" cy="19" r="6" fill="#1a73e8"/>
  <circle cx="19" cy="19" r="2.2" fill="#ffffff"/>
</svg>`;

function getDriverSvg(heading: number = 0): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46">
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
}

function getStopSvg(stopIndex: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
    <defs>
      <filter id="s-shadow-${stopIndex}" x="-30%" y="-20%" width="160%" height="150%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#312e81" flood-opacity="0.5"/>
      </filter>
    </defs>
    <path d="M17 1 C8.7 1 2 7.7 2 16 C2 26.5 17 42 17 42 C17 42 32 26.5 32 16 C32 7.7 25.3 1 17 1 Z" fill="#4f46e5" filter="url(#s-shadow-${stopIndex})"/>
    <circle cx="17" cy="16" r="12" fill="#6366f1" stroke="#ffffff" stroke-width="2"/>
    <text x="17" y="20.5" font-size="12" font-weight="900" font-family="system-ui, -apple-system, sans-serif" fill="#ffffff" text-anchor="middle">${stopIndex}</text>
  </svg>`;
}

/** Wraps a raw SVG string in a div for use as AdvancedMarkerElement content. */
function createMarkerDiv(svgString: string): HTMLDivElement {
  const div = document.createElement('div');
  div.innerHTML = svgString.trim();
  div.style.cssText = 'line-height:0;';
  return div;
}


export default function BookingMap({
  pickup,
  destination,
  stops = [],
  userLocation,
  driverLocation,
  routeCoords = [],
  distanceKm,
  durationMinutes,
  interactiveMode = 'none',
  onLocationPick,
  onPickupAdjust,
  onDestinationAdjust,
  onRecenterClick,
  className = 'h-full w-full min-h-[360px] rounded-3xl overflow-hidden',
}: BookingMapProps) {
  const { isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Engine state: 'google' | 'leaflet' | 'loading'
  const [engine, setEngine] = useState<'google' | 'leaflet' | 'loading'>('loading');
  const [mapMode, setMapMode] = useState<MapViewMode>('standard');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Centering flag to ensure map smoothly centers on GPS coordinates when they arrive
  const hasInitiallyCenteredRef = useRef<boolean>(false);
  const isUserDraggingRef = useRef<boolean>(false);

  // Google Maps references
  const gMapRef = useRef<any>(null);
  const gAdvancedMarkerRef = useRef<any>(null); // holds google.maps.marker.AdvancedMarkerElement class
  const gPickupMarkerRef = useRef<any>(null);
  const gDestMarkerRef = useRef<any>(null);
  const gStopMarkersRef = useRef<any[]>([]);
  const gUserMarkerRef = useRef<any>(null);
  const gDriverMarkerRef = useRef<any>(null);
  const gUserAccuracyCircleRef = useRef<any>(null);
  const gRoutePolylineRef = useRef<any>(null);
  const gRouteGlowPolylineRef = useRef<any>(null);
  const gInfoWindowRef = useRef<any>(null);

  // Leaflet references (fallback)
  const lMapRef = useRef<any>(null);
  const lLayerGroupRef = useRef<any>(null);
  const lTileLayerRef = useRef<any>(null);

  // 1. Initial engine setup: Try Google Maps first, fallback to Leaflet seamlessly
  useEffect(() => {
    let isMounted = true;

    const mountLeaflet = async () => {
      if (!isMounted || !mapContainerRef.current) return;

      // Tear down google map instance if it was partially created
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
        if (!mapContainerRef.current || !isMounted) return;

        mapContainerRef.current.innerHTML = '';

        let initialCenter: [number, number] = [21.4225, 39.8262];
        let initialZoom = 13;

        if (isValidCoordinate(userLocation?.latitude, userLocation?.longitude)) {
          initialCenter = [userLocation.latitude, userLocation.longitude];
          initialZoom = 16;
          hasInitiallyCenteredRef.current = true;
        } else if (isValidCoordinate(pickup?.latitude, pickup?.longitude)) {
          initialCenter = [pickup.latitude, pickup.longitude];
          initialZoom = 16;
          hasInitiallyCenteredRef.current = true;
        }

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView(initialCenter, initialZoom);

        // High-DPI tiles (CartoDB / OpenStreetMap / Satellite)
        let tileUrl = isDark
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        if (mapMode === 'satellite') {
          tileUrl = 'https://server.arcgisonline.com/ArcMap/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        }

        const tileLayer = L.tileLayer(tileUrl, {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        lTileLayerRef.current = tileLayer;
        const layerGroup = L.layerGroup().addTo(map);
        lLayerGroupRef.current = layerGroup;
        lMapRef.current = map;

        map.on('click', (e: any) => {
          if (isValidCoordinate(e.latlng?.lat, e.latlng?.lng) && onLocationPick) {
            onLocationPick(e.latlng.lat, e.latlng.lng);
          }
        });

        map.on('dragstart', () => {
          isUserDraggingRef.current = true;
        });

        setEngine('leaflet');
      } catch (err) {
        console.error('[Al Harmain Maps] Leaflet init error:', err);
        setEngine('leaflet');
      }
    };

    // Global listener for Google Maps authentication or billing failures
    const unsubscribeAuth = onGoogleMapsAuthFailure(() => {
      console.warn('[Al Harmain Maps] Google Maps auth failure detected. Mounting Leaflet immediately.');
      mountLeaflet();
    });

    async function init() {
      if (typeof window === 'undefined' || !isMounted) return;

      // If Google Maps previously failed authentication/billing, skip directly to Leaflet
      if (hasGoogleMapsAuthFailed()) {
        mountLeaflet();
        return;
      }

      const hasGoogle = await loadGoogleMaps().catch(() => false);

      if (!isMounted || !mapContainerRef.current) return;

      // Double-check: loadGoogleMaps may return true but gm_authFailure can fire
      // during importLibrary hydration. If auth failed, go straight to Leaflet.
      if (!hasGoogle || hasGoogleMapsAuthFailed()) {
        mountLeaflet();
        return;
      }

      if ((window as any).google?.maps?.Map) {
        try {
          const google = (window as any).google;

          // Clear container DOM
          mapContainerRef.current.innerHTML = '';

          // Determine initial center
          let centerLat = 21.4225;
          let centerLng = 39.8262;
          let initialZoom = 13;

          if (isValidCoordinate(userLocation?.latitude, userLocation?.longitude)) {
            centerLat = userLocation.latitude;
            centerLng = userLocation.longitude;
            initialZoom = 16;
            hasInitiallyCenteredRef.current = true;
          } else if (isValidCoordinate(pickup?.latitude, pickup?.longitude)) {
            centerLat = pickup.latitude;
            centerLng = pickup.longitude;
            initialZoom = 16;
            hasInitiallyCenteredRef.current = true;
          }

          const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
          const map = new google.maps.Map(mapContainerRef.current, {
            center: { lat: centerLat, lng: centerLng },
            zoom: initialZoom,
            disableDefaultUI: true,
            zoomControl: false,
            mapId,
            mapTypeId: mapMode === 'satellite' ? 'hybrid' : 'roadmap',
            // Note: custom `styles` are incompatible with mapId — use Cloud Map Styling instead
            gestureHandling: 'greedy',
            clickableIcons: false,
          });

          // Wait a short tick for gm_authFailure to fire if the key is restricted/invalid.
          // The overlay fires asynchronously after map construction — catching it here
          // prevents showing a broken Google map before switching to Leaflet.
          await new Promise<void>((r) => setTimeout(r, 300));
          if (!isMounted) return;
          if (hasGoogleMapsAuthFailed()) {
            mountLeaflet();
            return;
          }

          gMapRef.current = map;
          gInfoWindowRef.current = new google.maps.InfoWindow();

          // AdvancedMarkerElement is already loaded by loadGoogleMaps() — grab it directly.
          const AdvancedMarkerElement =
            google.maps.marker?.AdvancedMarkerElement;
          if (AdvancedMarkerElement) {
            gAdvancedMarkerRef.current = AdvancedMarkerElement;
          } else {
            // Fallback: importLibrary just in case
            try {
              const markerLib = await google.maps.importLibrary('marker');
              if (isMounted) {
                gAdvancedMarkerRef.current = markerLib?.AdvancedMarkerElement;
              }
            } catch (markerErr) {
              console.warn('[Al Harmain Maps] Failed to load marker library:', markerErr);
            }
          }

          if (!isMounted) return;

          // Reset marker references for fresh mounting
          gPickupMarkerRef.current = null;
          gDestMarkerRef.current = null;
          gUserMarkerRef.current = null;
          gDriverMarkerRef.current = null;
          gUserAccuracyCircleRef.current = null;
          gRoutePolylineRef.current = null;
          gRouteGlowPolylineRef.current = null;

          // Track manual drag so we don't disrupt user panning
          map.addListener('dragstart', () => {
            isUserDraggingRef.current = true;
          });

          // Handle map background clicks
          map.addListener('click', (e: any) => {
            if (!e.latLng) return;
            const clickedLat = e.latLng.lat();
            const clickedLng = e.latLng.lng();
            if (isValidCoordinate(clickedLat, clickedLng) && onLocationPick) {
              onLocationPick(clickedLat, clickedLng);
            }
          });

          setEngine('google');
          return;
        } catch (err) {
          console.error('[Al Harmain Maps] Google Maps init error, mounting Leaflet:', err);
          mountLeaflet();
          return;
        }
      }

      // If Google Maps is not available, mount Leaflet
      mountLeaflet();
    }

    init();

    return () => {
      isMounted = false;
      unsubscribeAuth();

      // Clear Map-level listeners (safe for both legacy Map and new API)
      const google = typeof window !== 'undefined' ? (window as any).google : null;
      if (google?.maps?.event && gMapRef.current) {
        google.maps.event.clearInstanceListeners(gMapRef.current);
      }

      // AdvancedMarkerElement cleanup: set .map = null to detach and allow GC
      if (gPickupMarkerRef.current) {
        gPickupMarkerRef.current.map = null;
        gPickupMarkerRef.current = null;
      }
      if (gDestMarkerRef.current) {
        gDestMarkerRef.current.map = null;
        gDestMarkerRef.current = null;
      }
      if (gUserMarkerRef.current) {
        gUserMarkerRef.current.map = null;
        gUserMarkerRef.current = null;
      }
      if (gDriverMarkerRef.current) {
        gDriverMarkerRef.current.map = null;
        gDriverMarkerRef.current = null;
      }

      if (gUserAccuracyCircleRef.current) gUserAccuracyCircleRef.current.setMap(null);
      if (gRoutePolylineRef.current) gRoutePolylineRef.current.setMap(null);
      if (gRouteGlowPolylineRef.current) gRouteGlowPolylineRef.current.setMap(null);
      if (gInfoWindowRef.current) gInfoWindowRef.current.close();

      gAdvancedMarkerRef.current = null;
      gUserAccuracyCircleRef.current = null;
      gRoutePolylineRef.current = null;
      gRouteGlowPolylineRef.current = null;
      gInfoWindowRef.current = null;
      gMapRef.current = null;

      if (lMapRef.current) {
        lMapRef.current.remove();
        lMapRef.current = null;
        lLayerGroupRef.current = null;
        lTileLayerRef.current = null;
      }

      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  // 2. Map Mode Layer Application (Google & Leaflet)
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
        tileUrl = isDark
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      }
      try {
        lTileLayerRef.current.setUrl(tileUrl);
      } catch { }
    },
    [isDark]
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

  // Sync theme changes when in standard mode
  useEffect(() => {
    if (mapMode === 'standard') {
      if (engine === 'google') {
        applyGoogleMapMode('standard');
      } else if (engine === 'leaflet') {
        applyLeafletMapMode('standard');
      }
    }
  }, [isDark, engine, mapMode, applyGoogleMapMode, applyLeafletMapMode]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (engine === 'google' && gMapRef.current) {
      gMapRef.current.setZoom((gMapRef.current.getZoom() || 13) + 1);
    } else if (engine === 'leaflet' && lMapRef.current) {
      lMapRef.current.zoomIn();
    }
  }, [engine]);

  const handleZoomOut = useCallback(() => {
    if (engine === 'google' && gMapRef.current) {
      gMapRef.current.setZoom((gMapRef.current.getZoom() || 13) - 1);
    } else if (engine === 'leaflet' && lMapRef.current) {
      lMapRef.current.zoomOut();
    }
  }, [engine]);

  // 3. Google Maps: Update Markers, Draggable Behavior, and Polyline
  useEffect(() => {
    if (engine !== 'google' || !gMapRef.current || !gAdvancedMarkerRef.current || typeof window === 'undefined') return;

    const google = (window as any).google;
    if (!google?.maps) return;

    const AdvancedMarkerElement = gAdvancedMarkerRef.current;
    const map = gMapRef.current;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // Helper to open stylish info bubble (AdvancedMarkerElement uses anchor+map signature)
    const showMarkerInfo = (marker: any, title: string, subtitle: string, badgeColor: string) => {
      if (!gInfoWindowRef.current) return;
      const content = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px 6px; min-width: 140px; color: #0f172a;">
          <div style="display: inline-block; background: ${badgeColor}; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.05em;">
            ${title}
          </div>
          <div style="font-size: 12px; font-weight: 600; line-height: 1.35; color: #0f172a;">
            ${subtitle}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
            ✦ Drag pin to adjust location
          </div>
        </div>
      `;
      gInfoWindowRef.current.setContent(content);
      gInfoWindowRef.current.open({ anchor: marker, map });
    };

    const hasValidUserLoc = isValidCoordinate(userLocation?.latitude, userLocation?.longitude);
    const hasValidPickup = isValidCoordinate(pickup?.latitude, pickup?.longitude);
    const hasValidDest = isValidCoordinate(destination?.latitude, destination?.longitude);

    // A. Current GPS Location Marker
    if (hasValidUserLoc && userLocation) {
      const userPos = { lat: userLocation.latitude, lng: userLocation.longitude };
      bounds.extend(userPos);
      hasPoints = true;

      if (!gUserMarkerRef.current) {
        const el = createMarkerDiv(USER_GPS_SVG);
        gUserMarkerRef.current = new AdvancedMarkerElement({
          position: userPos,
          map,
          content: el,
          title: 'Your Current Location (Live GPS)',
          gmpClickable: true,
          zIndex: 100,
        });

        gUserMarkerRef.current.addEventListener('gmp-click', () => {
          const accText = typeof userLocation.accuracy === 'number' ? ` • ±${Math.round(userLocation.accuracy)}m accuracy` : '';
          showMarkerInfo(
            gUserMarkerRef.current,
            'Current Location',
            `Live GPS Position${accText}<br/><span style="font-size: 10px; color: #64748b;">(${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)})</span>`,
            '#2563eb'
          );
        });
      } else {
        gUserMarkerRef.current.position = userPos;
        gUserMarkerRef.current.map = map;
      }
    } else {
      if (gUserMarkerRef.current) gUserMarkerRef.current.map = null;
    }
    // Remove accuracy radius circle from UI completely
    if (gUserAccuracyCircleRef.current) {
      gUserAccuracyCircleRef.current.setMap(null);
      gUserAccuracyCircleRef.current = null;
    }

    // A2. Driver Live Location Marker (active ride telemetry)
    const hasValidDriverLoc = isValidCoordinate(driverLocation?.latitude, driverLocation?.longitude);
    if (hasValidDriverLoc && driverLocation) {
      const driverPos = { lat: driverLocation.latitude, lng: driverLocation.longitude };
      bounds.extend(driverPos);
      hasPoints = true;

      const driverSvg = getDriverSvg(driverLocation.heading || 0);

      if (!gDriverMarkerRef.current) {
        const el = createMarkerDiv(driverSvg);
        const marker = new AdvancedMarkerElement({
          position: driverPos,
          map,
          content: el,
          title: driverLocation.label || 'Assigned Chauffeur',
          gmpClickable: true,
          zIndex: 150,
        });

        marker.addEventListener('gmp-click', () => {
          showMarkerInfo(
            marker,
            driverLocation.label || 'Assigned Chauffeur',
            driverLocation.subText || 'Live Chauffeur Vehicle Location',
            '#f59e0b'
          );
        });

        gDriverMarkerRef.current = marker;
      } else {
        gDriverMarkerRef.current.position = driverPos;
        // Swap SVG innerHTML in-place for smooth heading updates (avoids re-creating the element)
        if (gDriverMarkerRef.current.content) {
          (gDriverMarkerRef.current.content as HTMLElement).innerHTML = driverSvg.trim();
        }
        gDriverMarkerRef.current.map = map;
      }
    } else if (gDriverMarkerRef.current) {
      gDriverMarkerRef.current.map = null;
      gDriverMarkerRef.current = null;
    }

    // B. Pickup Marker (Draggable via gmpDraggable)
    if (hasValidPickup && pickup) {
      const pickupPos = { lat: pickup.latitude, lng: pickup.longitude };
      bounds.extend(pickupPos);
      hasPoints = true;

      if (!gPickupMarkerRef.current) {
        const el = createMarkerDiv(PICKUP_SVG);
        const marker = new AdvancedMarkerElement({
          position: pickupPos,
          map,
          content: el,
          gmpDraggable: true,
          gmpClickable: true,
          title: pickup.address || 'Pickup Location (Drag to adjust)',
          zIndex: 200,
        });

        marker.addEventListener('gmp-dragend', () => {
          const pos = marker.position;
          if (!pos) return;
          const newLat = typeof (pos as any).lat === 'function' ? (pos as any).lat() : (pos as any).lat;
          const newLng = typeof (pos as any).lng === 'function' ? (pos as any).lng() : (pos as any).lng;
          if (isValidCoordinate(newLat, newLng)) {
            if (onPickupAdjust) {
              onPickupAdjust(newLat, newLng);
            } else if (onLocationPick) {
              onLocationPick(newLat, newLng);
            }
          }
        });

        marker.addEventListener('gmp-click', () => {
          showMarkerInfo(marker, 'Pickup Location', pickup.address || 'Pickup Point', '#047857');
        });

        gPickupMarkerRef.current = marker;
      } else {
        gPickupMarkerRef.current.position = pickupPos;
        gPickupMarkerRef.current.title = pickup.address || 'Pickup Location';
        gPickupMarkerRef.current.map = map;
      }
    } else if (gPickupMarkerRef.current) {
      gPickupMarkerRef.current.map = null;
      gPickupMarkerRef.current = null;
    }

    // C. Destination Marker (Draggable via gmpDraggable)
    if (hasValidDest && destination) {
      const destPos = { lat: destination.latitude, lng: destination.longitude };
      bounds.extend(destPos);
      hasPoints = true;

      if (!gDestMarkerRef.current) {
        const el = createMarkerDiv(DEST_SVG);
        const marker = new AdvancedMarkerElement({
          position: destPos,
          map,
          content: el,
          gmpDraggable: true,
          gmpClickable: true,
          title: destination.address || 'Destination (Drag to adjust)',
          zIndex: 210,
        });

        marker.addEventListener('gmp-dragend', () => {
          const pos = marker.position;
          if (!pos) return;
          const newLat = typeof (pos as any).lat === 'function' ? (pos as any).lat() : (pos as any).lat;
          const newLng = typeof (pos as any).lng === 'function' ? (pos as any).lng() : (pos as any).lng;
          if (isValidCoordinate(newLat, newLng)) {
            if (onDestinationAdjust) {
              onDestinationAdjust(newLat, newLng);
            } else if (onLocationPick) {
              onLocationPick(newLat, newLng);
            }
          }
        });

        marker.addEventListener('gmp-click', () => {
          showMarkerInfo(marker, 'Destination', destination.address || 'Drop-off Destination', '#b45309');
        });

        gDestMarkerRef.current = marker;
      } else {
        gDestMarkerRef.current.position = destPos;
        gDestMarkerRef.current.title = destination.address || 'Destination';
        gDestMarkerRef.current.map = map;
      }
    } else if (gDestMarkerRef.current) {
      gDestMarkerRef.current.map = null;
      gDestMarkerRef.current = null;
    }

    // B2. Intermediate Stops Markers
    gStopMarkersRef.current.forEach((m) => { if (m) m.map = null; });
    gStopMarkersRef.current = [];

    if (stops && stops.length > 0) {
      stops.forEach((st, idx) => {
        if (isValidCoordinate(st.latitude, st.longitude)) {
          const stopPos = { lat: st.latitude, lng: st.longitude };
          bounds.extend(stopPos);
          hasPoints = true;

          const el = createMarkerDiv(getStopSvg(idx + 1));
          const marker = new AdvancedMarkerElement({
            position: stopPos,
            map,
            content: el,
            title: st.address || `Stop ${idx + 1}`,
            gmpClickable: true,
            zIndex: 110 + idx,
          });

          marker.addEventListener('gmp-click', () => {
            showMarkerInfo(marker, `Stop ${idx + 1}`, st.address || `Intermediate Stop ${idx + 1}`, '#4f46e5');
          });

          gStopMarkersRef.current.push(marker);
        }
      });
    }

    // D. Driving Route Polyline & Bounds Fitting
    if (hasValidPickup && hasValidDest && routeCoords.length >= 2) {
      const path = routeCoords
        .filter((c) => isValidCoordinate(c[0], c[1]))
        .map((c) => ({ lat: c[0], lng: c[1] }));
      path.forEach((p) => bounds.extend(p));

      // Glow outline polyline
      if (!gRouteGlowPolylineRef.current) {
        gRouteGlowPolylineRef.current = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#064e3b',
          strokeOpacity: 0.4,
          strokeWeight: 8,
          map,
          zIndex: 50,
        });
      } else {
        gRouteGlowPolylineRef.current.setPath(path);
        gRouteGlowPolylineRef.current.setMap(map);
      }

      // Primary emerald route polyline
      if (!gRoutePolylineRef.current) {
        gRoutePolylineRef.current = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#059669',
          strokeOpacity: 0.95,
          strokeWeight: 4.5,
          map,
          zIndex: 55,
        });
      } else {
        gRoutePolylineRef.current.setPath(path);
        gRoutePolylineRef.current.setMap(map);
      }

      // Automatically fit the map to the selected route with comfortable padding
      try {
        map.fitBounds(bounds, {
          top: 60,
          bottom: 60,
          left: 50,
          right: 50,
        });
      } catch {
        map.fitBounds(bounds);
      }
    } else {
      // Clear polylines if route incomplete
      if (gRouteGlowPolylineRef.current) {
        gRouteGlowPolylineRef.current.setMap(null);
      }
      if (gRoutePolylineRef.current) {
        gRoutePolylineRef.current.setMap(null);
      }

      // Fit map if we have points
      if (hasPoints) {
        if (hasValidPickup && hasValidDest) {
          map.fitBounds(bounds, { top: 70, bottom: 70, left: 60, right: 60 });
        } else if (hasValidUserLoc && userLocation) {
          // Keep map centered on customer's real-time GPS location unless user is actively dragging
          if (!isUserDraggingRef.current || !hasInitiallyCenteredRef.current) {
            map.panTo({ lat: userLocation.latitude, lng: userLocation.longitude });
            if (!hasInitiallyCenteredRef.current) {
              map.setZoom(16);
              hasInitiallyCenteredRef.current = true;
            }
          }
        } else if (hasValidPickup && pickup) {
          if (!isUserDraggingRef.current || !hasInitiallyCenteredRef.current) {
            map.panTo({ lat: pickup.latitude, lng: pickup.longitude });
            if (!hasInitiallyCenteredRef.current) {
              map.setZoom(16);
              hasInitiallyCenteredRef.current = true;
            }
          }
        }
      }
    }
  }, [engine, pickup, destination, stops, userLocation, driverLocation, routeCoords, onPickupAdjust, onDestinationAdjust, onLocationPick]);


  // 4. Leaflet Fallback Layer Updates
  useEffect(() => {
    if (engine !== 'leaflet' || !lMapRef.current || !lLayerGroupRef.current) return;

    let isMounted = true;
    const updateLeaflet = async () => {
      const L = (await import('leaflet')).default;
      if (!isMounted || !lLayerGroupRef.current || !lMapRef.current) return;

      const layerGroup = lLayerGroupRef.current;
      const map = lMapRef.current;
      layerGroup.clearLayers();

      const boundsLatLngs: [number, number][] = [];

      // User location
      if (userLocation && isValidCoordinate(userLocation.latitude, userLocation.longitude)) {
        boundsLatLngs.push([userLocation.latitude, userLocation.longitude]);
        const userIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-lg"></span>
            </div>
          `,
          className: 'custom-user-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const accInfo = typeof userLocation.accuracy === 'number' ? ` • ±${Math.round(userLocation.accuracy)}m accuracy` : '';
        L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
          .bindPopup(`<strong>📍 Current Location</strong><br/><span style="font-size: 11px; color: #2563eb;">Live GPS Coordinate${accInfo}</span>`)
          .addTo(layerGroup);
      }

      // Driver location (Leaflet)
      if (driverLocation && isValidCoordinate(driverLocation.latitude, driverLocation.longitude)) {
        boundsLatLngs.push([driverLocation.latitude, driverLocation.longitude]);
        const driverIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400 opacity-75"></span>
              <div class="w-10 h-10 rounded-2xl bg-slate-900 border-2 border-amber-500 shadow-2xl flex items-center justify-center text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.9 2 11.2 2 11.5V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
              </div>
            </div>
          `,
          className: 'custom-driver-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        L.marker([driverLocation.latitude, driverLocation.longitude], { icon: driverIcon })
          .bindPopup(`<strong>🚘 ${driverLocation.label || 'Assigned Chauffeur'}</strong><br/><span style="font-size: 11px; color: #047857;">${driverLocation.subText || 'Live Chauffeur Vehicle Location'}</span>`)
          .addTo(layerGroup);
      }

      // Pickup
      if (pickup && isValidCoordinate(pickup.latitude, pickup.longitude)) {
        boundsLatLngs.push([pickup.latitude, pickup.longitude]);
        const pickupIcon = L.divIcon({
          html: `
            <div class="flex flex-col items-center">
              <div class="flex items-center justify-center w-8 h-8 rounded-2xl bg-emerald-700 text-white shadow-xl border-2 border-white text-xs font-black ring-4 ring-emerald-500/20">
                P
              </div>
              <div class="w-1.5 h-2 bg-emerald-700 rounded-b shadow"></div>
            </div>
          `,
          className: 'custom-pickup-marker',
          iconSize: [32, 40],
          iconAnchor: [16, 40],
        });
        const pMarker = L.marker([pickup.latitude, pickup.longitude], { icon: pickupIcon, draggable: true }).addTo(layerGroup);
        pMarker.on('dragend', (e: any) => {
          const latlng = e.target.getLatLng();
          if (isValidCoordinate(latlng.lat, latlng.lng)) {
            if (onPickupAdjust) onPickupAdjust(latlng.lat, latlng.lng);
            else if (onLocationPick) onLocationPick(latlng.lat, latlng.lng);
          }
        });
        pMarker.bindPopup(`<strong>Pickup:</strong> ${pickup.address || ''}`);
      }

      // Destination
      if (destination && isValidCoordinate(destination.latitude, destination.longitude)) {
        boundsLatLngs.push([destination.latitude, destination.longitude]);
        const destIcon = L.divIcon({
          html: `
            <div class="flex flex-col items-center">
              <div class="flex items-center justify-center w-8 h-8 rounded-2xl bg-amber-500 text-slate-950 shadow-xl border-2 border-white text-xs font-black ring-4 ring-amber-500/30">
                D
              </div>
              <div class="w-1.5 h-2 bg-amber-500 rounded-b shadow"></div>
            </div>
          `,
          className: 'custom-dest-marker',
          iconSize: [32, 40],
          iconAnchor: [16, 40],
        });
        const dMarker = L.marker([destination.latitude, destination.longitude], { icon: destIcon, draggable: true }).addTo(layerGroup);
        dMarker.on('dragend', (e: any) => {
          const latlng = e.target.getLatLng();
          if (isValidCoordinate(latlng.lat, latlng.lng)) {
            if (onDestinationAdjust) onDestinationAdjust(latlng.lat, latlng.lng);
            else if (onLocationPick) onLocationPick(latlng.lat, latlng.lng);
          }
        });
        dMarker.bindPopup(`<strong>Destination:</strong> ${destination.address || ''}`);
      }

      // Intermediate stops (Leaflet)
      if (stops && stops.length > 0) {
        stops.forEach((st, idx) => {
          if (isValidCoordinate(st.latitude, st.longitude)) {
            boundsLatLngs.push([st.latitude, st.longitude]);
            const stopIcon = L.divIcon({
              html: `
                <div class="relative flex items-center justify-center">
                  <div style="width: 28px; height: 28px; border-radius: 9999px; background: #4f46e5; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
                    ${idx + 1}
                  </div>
                </div>
              `,
              className: 'custom-stop-marker',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });
            L.marker([st.latitude, st.longitude], { icon: stopIcon })
              .bindPopup(`<strong>Stop ${idx + 1}:</strong> ${st.address || 'Intermediate Stop'}`)
              .addTo(layerGroup);
          }
        });
      }

      // Polyline & View Centering
      const hasValidPickup = pickup && isValidCoordinate(pickup.latitude, pickup.longitude);
      const hasValidDest = destination && isValidCoordinate(destination.latitude, destination.longitude);
      const hasValidUserLoc = userLocation && isValidCoordinate(userLocation.latitude, userLocation.longitude);

      const validRouteCoords = routeCoords.filter((c) => isValidCoordinate(c[0], c[1]));
      const linePoints = validRouteCoords.length > 0 ? validRouteCoords : boundsLatLngs;

      if (hasValidPickup && hasValidDest && linePoints.length >= 2) {
        L.polyline(linePoints, {
          color: '#059669',
          weight: 4.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layerGroup);

        try {
          map.fitBounds(L.latLngBounds(linePoints), { padding: [50, 50], maxZoom: 15 });
        } catch { }
      } else if (hasValidUserLoc) {
        if (!isUserDraggingRef.current || !hasInitiallyCenteredRef.current) {
          map.setView([userLocation.latitude, userLocation.longitude], 16, { animate: true });
          hasInitiallyCenteredRef.current = true;
        }
      } else if (hasValidPickup) {
        if (!isUserDraggingRef.current || !hasInitiallyCenteredRef.current) {
          map.setView([pickup.latitude, pickup.longitude], 16, { animate: true });
          hasInitiallyCenteredRef.current = true;
        }
      } else if (boundsLatLngs.length > 0) {
        map.setView(boundsLatLngs[0], 15, { animate: true });
      }
    };

    updateLeaflet();

    return () => {
      isMounted = false;
    };
  }, [engine, pickup, destination, stops, userLocation, driverLocation, routeCoords, onPickupAdjust, onDestinationAdjust, onLocationPick]);

  // Recenter Handler (Centering on accurate live GPS location)
  const handleCurrentLocation = useCallback(async () => {
    isUserDraggingRef.current = false;
    setIsLocating(true);

    if (onRecenterClick) {
      try {
        await onRecenterClick();
      } catch { }
    }

    const target =
      userLocation && isValidCoordinate(userLocation.latitude, userLocation.longitude)
        ? userLocation
        : pickup && isValidCoordinate(pickup.latitude, pickup.longitude)
          ? pickup
          : null;

    if (target) {
      if (engine === 'google' && gMapRef.current) {
        gMapRef.current.panTo({ lat: target.latitude, lng: target.longitude });
        gMapRef.current.setZoom(16);
      } else if (engine === 'leaflet' && lMapRef.current) {
        lMapRef.current.setView([target.latitude, target.longitude], 16, { animate: true });
      }
    }

    setTimeout(() => {
      setIsLocating(false);
    }, 1200);
  }, [engine, userLocation, pickup, onRecenterClick]);

  return (
    <div className={`relative shadow-2xl border border-base bg-surface ${className}`}>
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />

      {/* Unified Luxury HUD Map Controls (Top-Right: Zoom, Current Location, 3-Way Map Mode) */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCurrentLocation={handleCurrentLocation}
        mapMode={mapMode}
        onMapModeChange={handleMapModeChange}
        isLocating={isLocating}
        currentLocationTitle="Center on Your Live GPS Location"
      />

      {/* Floating Route Distance & Time Card on Map */}
      {pickup && destination && distanceKm != null && distanceKm > 0 && (
        <div className="absolute top-4 left-4 z-10 max-w-[calc(100%-4.5rem)] sm:max-w-none bg-card/95 backdrop-blur-md border border-base rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-xl flex items-center gap-2.5 sm:gap-3 text-xs animate-fade-up">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="font-bold text-primary text-xs sm:text-sm">{formatDistance(distanceKm)}</span>
              {durationMinutes != null && durationMinutes > 0 && (
                <>
                  <span className="text-muted">&bull;</span>
                  <span className="font-bold text-amber-500 text-xs sm:text-sm">~{formatDuration(durationMinutes)}</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-muted hidden sm:flex items-center gap-1">
              <span>Drag markers to fine-tune route</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Mode Banner */}
      {interactiveMode !== 'none' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-950/90 text-white px-4 py-2 rounded-full border border-emerald-500/50 shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>Tap anywhere on map to set {interactiveMode === 'pickup' ? 'Pickup' : 'Destination'}</span>
        </div>
      )}

      {/* Luxury Brand Watermark */}
      <div className="absolute bottom-4 left-4 z-10 bg-card/85 dark:bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-base shadow text-[10px] font-medium text-secondary flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-primary">
          {engine === 'google' ? 'Google Maps Platform' : 'Al Harmain Radar'}
        </span>
        <span className="text-muted">&bull;</span>
        <span className="text-[9px] text-muted uppercase tracking-wider">Live Route</span>
      </div>
    </div>
  );
}
