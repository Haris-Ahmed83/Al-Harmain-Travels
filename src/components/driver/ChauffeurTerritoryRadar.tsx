'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Car,
  Navigation,
  Crosshair,
  Compass,
  Layers,
  Search,
  Filter,
  X,
  MapPin,
  Radio,
  Eye,
  Phone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Star,
  Maximize2,
  Minimize2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Driver, Booking, Vehicle } from '@/types';
import {
  loadGoogleMaps,
  isValidCoordinate,
  hasGoogleMapsAuthFailed,
  onGoogleMapsAuthFailure,
} from '@/lib/maps/location-service';
import { calculateDistanceKm } from '@/lib/geo';
import { formatCurrency } from '@/lib/utils';

export type ChauffeurRadarState = 'available' | 'assigned' | 'on_trip' | 'offline' | 'selected';

export interface TerritoryDefinition {
  id: string;
  name: string;
  shortName: string;
  zoneCode: string;
  cityName: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  description: string;
}

export const VIP_TERRITORIES: TerritoryDefinition[] = [
  {
    id: 'makkah-haram',
    name: 'Makkah Al-Mukarramah Territory',
    shortName: 'Makkah Haram Zone',
    zoneCode: 'MKH-01',
    cityName: 'Makkah',
    lat: 21.4225,
    lng: 39.8262,
    radiusMeters: 5500,
    description: 'Central Holy Mosque (Masjid al-Haram) & Luxury Hotel Belt',
  },
  {
    id: 'jeddah-kaia',
    name: 'Jeddah Airport (KAIA) Hub',
    shortName: 'Jeddah Airport (KAIA)',
    zoneCode: 'JED-01',
    cityName: 'Jeddah',
    lat: 21.6796,
    lng: 39.1565,
    radiusMeters: 6500,
    description: 'King Abdulaziz International Airport (T1, North & VIP Private Aviation)',
  },
  {
    id: 'madinah-haram',
    name: 'Al-Madinah Al-Munawwarah Territory',
    shortName: 'Madinah Sacred Zone',
    zoneCode: 'MED-01',
    cityName: 'Madinah',
    lat: 24.4672,
    lng: 39.6111,
    radiusMeters: 5000,
    description: 'The Prophet’s Mosque (Al-Masjid an-Nabawi) & Central Sanctuary',
  },
];

export interface ChauffeurTerritoryRadarProps {
  currentDriver?: Driver;
  driverPos: { lat: number; lng: number } | null;
  heading?: number;
  gpsActive: boolean;
  gpsError: string | null;
  refreshGps: () => void;
  drivers: Driver[];
  bookings: Booking[];
}

// Light Luxury Custom Google Map Styles (clean high-contrast readability)
const lightLuxuryMapStyles: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 3 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0f172a' }, { weight: 1.5 }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#ecfdf5' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#059669' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e2e8f0' }, { weight: 1 }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#d1fae5' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#a7f3d0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#047857' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e0f2fe' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0369a1' }],
  },
];

// Helper to determine chauffeur state
export function resolveChauffeurState(
  driver: Driver,
  isSelected: boolean,
  activeBooking?: Booking | null
): ChauffeurRadarState {
  if (isSelected) return 'selected';
  if (
    activeBooking &&
    ['on_the_way', 'driver_arriving', 'arrived', 'driver_arrived', 'started', 'trip_started', 'ride_started'].includes(
      activeBooking.status
    )
  ) {
    return 'on_trip';
  }
  if (driver.status === 'on_trip' || driver.status === 'busy') {
    return 'on_trip';
  }
  if (
    driver.status === 'assigned' ||
    (activeBooking && ['driver_assigned', 'accepted', 'driver_accepted'].includes(activeBooking.status))
  ) {
    return 'assigned';
  }
  if (driver.status === 'available') {
    return 'available';
  }
  return 'offline';
}

// Marker element generator
function buildChauffeurMarkerHtml(
  state: ChauffeurRadarState,
  heading: number,
  name: string,
  plate: string,
  isSelected: boolean
): string {
  const configs = {
    available: {
      color: '#059669',
      glow: 'rgba(16, 185, 129, 0.4)',
      border: '#ffffff',
      pulse: true,
      label: 'Available',
    },
    assigned: {
      color: '#0284c7',
      glow: 'rgba(14, 165, 233, 0.4)',
      border: '#ffffff',
      pulse: false,
      label: 'Assigned',
    },
    on_trip: {
      color: '#7c3aed',
      glow: 'rgba(139, 92, 246, 0.45)',
      border: '#ffffff',
      pulse: true,
      label: 'On Trip',
    },
    offline: {
      color: '#64748b',
      glow: 'rgba(100, 116, 139, 0.25)',
      border: '#ffffff',
      pulse: false,
      label: 'Offline',
    },
    selected: {
      color: '#d97706',
      glow: 'rgba(245, 158, 11, 0.7)',
      border: '#fbbf24',
      pulse: true,
      label: 'Selected',
    },
  }[state];

  const size = isSelected ? 52 : 46;
  const pulseHtml = configs.pulse
    ? `<span style="position: absolute; inset: -5px; border-radius: 9999px; background: ${configs.glow}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.6; pointer-events: none;"></span>`
    : '';

  return `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        ${pulseHtml}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 9999px;
          background: ${configs.color};
          border: 3px solid ${configs.border};
          box-shadow: 0 4px 14px ${configs.glow}, 0 2px 6px rgba(0,0,0,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="${size - 22}" height="${size - 22}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${heading || 0}deg); transition: transform 0.3s ease;">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.9 2 11.2 2 11.6V16c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <!-- Status dot badge -->
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: ${configs.color};
          border: 2px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          z-index: 3;
        "></div>
      </div>
      <!-- Label Tag -->
      <div style="
        margin-top: 4px;
        padding: 2px 8px;
        border-radius: 9999px;
        background: #0f172a;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        white-space: nowrap;
        box-shadow: 0 3px 8px rgba(0,0,0,0.25);
        border: 1px solid ${isSelected ? '#fbbf24' : 'rgba(255,255,255,0.2)'};
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 4px;
        z-index: 2;
      ">
        <span>${name}</span>
        ${plate ? `<span style="color: #94a3b8; font-size: 9px; font-weight: 500;">• ${plate}</span>` : ''}
      </div>
    </div>
  `;
}

export default function ChauffeurTerritoryRadar({
  currentDriver,
  driverPos,
  heading = 0,
  gpsActive,
  gpsError,
  refreshGps,
  drivers = [],
  bookings = [],
}: ChauffeurTerritoryRadarProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<'google' | 'leaflet' | 'loading'>('loading');
  const [mapMode, setMapMode] = useState<'standard' | 'satellite'>('standard');

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned' | 'on_trip' | 'offline'>('all');
  const [territoryFilter, setTerritoryFilter] = useState<string>('all');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Map Instance References
  const gMapRef = useRef<any>(null);
  const gAdvancedMarkerRef = useRef<any>(null);
  const gMarkersMapRef = useRef<Map<string, any>>(new Map());
  const gCirclesMapRef = useRef<Map<string, any>>(new Map());

  const lMapRef = useRef<any>(null);
  const lMarkersLayerRef = useRef<any>(null);
  const lCirclesLayerRef = useRef<any>(null);
  const lTileLayerRef = useRef<any>(null);

  // Resolve drivers with live coordinates & active bookings
  const unifiedDrivers = useMemo(() => {
    return drivers.map((d) => {
      // If current driver, ensure live GPS coordinates take precedence
      let lat = d.location?.latitude;
      let lng = d.location?.longitude;
      let hd = d.location?.heading || 0;
      let sp = d.location?.speed || 0;

      if (currentDriver && d.id === currentDriver.id && driverPos) {
        lat = driverPos.lat;
        lng = driverPos.lng;
        hd = heading;
      }

      // Find active booking for this driver
      const activeBooking = bookings.find(
        (b) =>
          (b.assigned_driver_id === d.id || b.driver?.id === d.id) &&
          !['completed', 'trip_completed', 'ride_completed', 'cancelled', 'rejected'].includes(b.status)
      );

      // Determine nearest territory
      let closestTerritory: { territory: TerritoryDefinition; distanceKm: number } | null = null;
      if (lat && lng && isValidCoordinate(lat, lng)) {
        for (const terr of VIP_TERRITORIES) {
          const dist = calculateDistanceKm(lat, lng, terr.lat, terr.lng);
          if (!closestTerritory || dist < closestTerritory.distanceKm) {
            closestTerritory = { territory: terr, distanceKm: dist };
          }
        }
      }

      const radarState = resolveChauffeurState(d, d.id === selectedDriverId, activeBooking);

      return {
        driver: d,
        lat,
        lng,
        heading: hd,
        speed: sp,
        activeBooking,
        closestTerritory,
        radarState,
        fullName: d.profile?.full_name || d.full_name || 'VIP Chauffeur',
        plateNumber: d.vehicle?.plate_number || d.assigned_vehicle?.plate_number || 'KSA 7788',
        model: `${d.vehicle?.make || 'VIP'} ${d.vehicle?.model || 'Fleet'}`,
        category: d.vehicle?.vehicle_type || 'vip_gmc',
      };
    });
  }, [drivers, currentDriver, driverPos, heading, bookings, selectedDriverId]);

  // Determine active count per territory
  const territoryStats = useMemo(() => {
    const stats: Record<string, { count: number; isActive: boolean }> = {};
    VIP_TERRITORIES.forEach((t) => {
      const activeDrivers = unifiedDrivers.filter((ud) => {
        if (!ud.lat || !ud.lng) return false;
        const dist = calculateDistanceKm(ud.lat, ud.lng, t.lat, t.lng);
        return dist <= t.radiusMeters / 1000 + 4; // within hub radius + buffer
      });
      stats[t.id] = {
        count: activeDrivers.length,
        isActive: activeDrivers.length > 0,
      };
    });
    return stats;
  }, [unifiedDrivers]);

  // Filtered drivers based on Search, Status & Territory
  const filteredDrivers = useMemo(() => {
    return unifiedDrivers.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.fullName.toLowerCase().includes(q);
        const matchesPlate = item.plateNumber.toLowerCase().includes(q);
        const matchesModel = item.model.toLowerCase().includes(q);
        const matchesTerritory = item.closestTerritory?.territory.name.toLowerCase().includes(q);
        if (!matchesName && !matchesPlate && !matchesModel && !matchesTerritory) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'available' && item.radarState !== 'available') return false;
        if (statusFilter === 'assigned' && item.radarState !== 'assigned') return false;
        if (statusFilter === 'on_trip' && item.radarState !== 'on_trip') return false;
        if (statusFilter === 'offline' && item.radarState !== 'offline') return false;
      }

      // 3. Territory Filter
      if (territoryFilter !== 'all') {
        const matchedTerr = VIP_TERRITORIES.find((t) => t.id === territoryFilter);
        if (matchedTerr && item.lat && item.lng) {
          const dist = calculateDistanceKm(item.lat, item.lng, matchedTerr.lat, matchedTerr.lng);
          if (dist > matchedTerr.radiusMeters / 1000 + 6) return false;
        } else if (!item.lat || !item.lng) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedDrivers, searchQuery, statusFilter, territoryFilter]);

  // Selected Driver Details
  const selectedDriverData = useMemo(() => {
    if (!selectedDriverId) return null;
    return unifiedDrivers.find((d) => d.driver.id === selectedDriverId) || null;
  }, [selectedDriverId, unifiedDrivers]);

  // Status counts for filter chips
  const counts = useMemo(() => {
    return {
      all: unifiedDrivers.length,
      available: unifiedDrivers.filter((d) => d.radarState === 'available').length,
      assigned: unifiedDrivers.filter((d) => d.radarState === 'assigned').length,
      on_trip: unifiedDrivers.filter((d) => d.radarState === 'on_trip').length,
      offline: unifiedDrivers.filter((d) => d.radarState === 'offline').length,
    };
  }, [unifiedDrivers]);

  // Initial Center
  const defaultCenter = useMemo<[number, number]>(() => {
    if (driverPos && isValidCoordinate(driverPos.lat, driverPos.lng)) {
      return [driverPos.lat, driverPos.lng];
    }
    return [21.4225, 39.8262]; // Makkah default
  }, [driverPos]);

  // Map Initialization (Google Maps with Leaflet fallback)
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
        } catch {}
        gMapRef.current = null;
      }

      try {
        const L = (await import('leaflet')).default;
        if (!isMounted || !mapContainerRef.current) return;

        mapContainerRef.current.innerHTML = '';

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView(defaultCenter, 12);

        const tileUrl =
          mapMode === 'satellite'
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

        const tileLayer = L.tileLayer(tileUrl, {
          maxZoom: 20,
          subdomains: 'abcd',
        }).addTo(map);

        lTileLayerRef.current = tileLayer;
        lCirclesLayerRef.current = L.layerGroup().addTo(map);
        lMarkersLayerRef.current = L.layerGroup().addTo(map);
        lMapRef.current = map;

        setTimeout(() => {
          if (isMounted) map.invalidateSize();
        }, 200);

        setEngine('leaflet');
      } catch (lErr) {
        console.error('[Al Harmain ChauffeurRadar] Leaflet initialization failed:', lErr);
      }
    };

    const unsubscribeAuth = onGoogleMapsAuthFailure(() => {
      console.warn('[Al Harmain ChauffeurRadar] Google Maps auth failure. Switching to Leaflet.');
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
            center: { lat: defaultCenter[0], lng: defaultCenter[1] },
            zoom: 12,
            disableDefaultUI: true,
            mapId,
            mapTypeId: mapMode === 'satellite' ? 'hybrid' : 'roadmap',
            gestureHandling: 'greedy',
            clickableIcons: false,
          });

          await new Promise<void>((r) => setTimeout(r, 250));
          if (!isMounted) return;
          if (hasGoogleMapsAuthFailed()) {
            mountLeaflet();
            return;
          }

          gMapRef.current = map;

          const AdvancedMarkerElement = google.maps.marker?.AdvancedMarkerElement;
          if (AdvancedMarkerElement) {
            gAdvancedMarkerRef.current = AdvancedMarkerElement;
          } else {
            try {
              const markerLib = await google.maps.importLibrary('marker');
              if (isMounted) {
                gAdvancedMarkerRef.current = markerLib?.AdvancedMarkerElement;
              }
            } catch (err) {
              console.warn('[Al Harmain ChauffeurRadar] Failed to load marker library:', err);
            }
          }

          if (!isMounted) return;
          setEngine('google');
          return;
        } catch (err) {
          console.warn('[Al Harmain ChauffeurRadar] Google Maps init error, mounting Leaflet:', err);
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
    };
  }, []);

  // Sync Map Mode (Roadmap vs Satellite)
  useEffect(() => {
    if (engine === 'google' && gMapRef.current && (window as any).google?.maps) {
      gMapRef.current.setMapTypeId(mapMode === 'satellite' ? 'hybrid' : 'roadmap');
    } else if (engine === 'leaflet' && lMapRef.current && lTileLayerRef.current) {
      import('leaflet').then((LModule) => {
        const L = LModule.default;
        lTileLayerRef.current.remove();
        const tileUrl =
          mapMode === 'satellite'
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        const newLayer = L.tileLayer(tileUrl, { maxZoom: 20, subdomains: 'abcd' }).addTo(lMapRef.current);
        lTileLayerRef.current = newLayer;
      });
    }
  }, [mapMode, engine]);

  // Render Territory Boundaries (Subtle transparent circles)
  useEffect(() => {
    if (engine === 'google' && gMapRef.current && (window as any).google?.maps) {
      const google = (window as any).google;
      const currentCircles = gCirclesMapRef.current;

      VIP_TERRITORIES.forEach((terr) => {
        const stat = territoryStats[terr.id];
        const isActive = stat?.isActive;

        let circle = currentCircles.get(terr.id);
        const circleOptions = {
          strokeColor: isActive ? '#059669' : '#94a3b8',
          strokeOpacity: isActive ? 0.6 : 0.35,
          strokeWeight: isActive ? 1.8 : 1.2,
          fillColor: isActive ? '#10b981' : '#cbd5e1',
          fillOpacity: isActive ? 0.08 : 0.03,
          map: gMapRef.current,
          center: { lat: terr.lat, lng: terr.lng },
          radius: terr.radiusMeters,
          clickable: true,
          zIndex: 10,
        };

        if (!circle) {
          circle = new google.maps.Circle(circleOptions);
          circle.addListener('click', () => {
            setTerritoryFilter(terr.id);
            gMapRef.current.panTo({ lat: terr.lat, lng: terr.lng });
            gMapRef.current.setZoom(13);
          });
          currentCircles.set(terr.id, circle);
        } else {
          circle.setOptions(circleOptions);
        }
      });
    } else if (engine === 'leaflet' && lMapRef.current && lCirclesLayerRef.current) {
      import('leaflet').then((LModule) => {
        const L = LModule.default;
        const layer = lCirclesLayerRef.current;
        if (!layer) return;
        layer.clearLayers();

        VIP_TERRITORIES.forEach((terr) => {
          const stat = territoryStats[terr.id];
          const isActive = stat?.isActive;

          const circle = L.circle([terr.lat, terr.lng], {
            color: isActive ? '#059669' : '#94a3b8',
            weight: isActive ? 1.8 : 1.2,
            opacity: isActive ? 0.6 : 0.35,
            fillColor: isActive ? '#10b981' : '#cbd5e1',
            fillOpacity: isActive ? 0.08 : 0.03,
            radius: terr.radiusMeters,
          }).addTo(layer);

          circle.on('click', () => {
            setTerritoryFilter(terr.id);
            lMapRef.current.setView([terr.lat, terr.lng], 13);
          });
        });
      });
    }
  }, [engine, territoryStats]);

  // Render Markers on Map (Google Maps & Leaflet)
  useEffect(() => {
    const validChauffeurs = filteredDrivers.filter(
      (d) => d.lat !== undefined && d.lng !== undefined && isValidCoordinate(d.lat, d.lng)
    );

    if (engine === 'google' && gMapRef.current && (window as any).google?.maps) {
      const google = (window as any).google;
      const map = gMapRef.current;
      const AdvancedMarkerElement = gAdvancedMarkerRef.current;
      const markersMap = gMarkersMapRef.current;
      const activeKeys = new Set<string>();

      validChauffeurs.forEach((item) => {
        const key = `driver-${item.driver.id}`;
        activeKeys.add(key);

        const pos = new google.maps.LatLng(item.lat!, item.lng!);
        const isSelected = item.driver.id === selectedDriverId;
        const state: ChauffeurRadarState = isSelected ? 'selected' : item.radarState;

        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = buildChauffeurMarkerHtml(
          state,
          item.heading,
          item.fullName.split(' ')[1] || item.fullName.split(' ')[0],
          item.plateNumber,
          isSelected
        );

        let marker = markersMap.get(key);
        if (!marker) {
          if (AdvancedMarkerElement) {
            marker = new AdvancedMarkerElement({
              position: pos,
              map,
              title: `${item.fullName} (${item.plateNumber})`,
              content: contentDiv,
              gmpClickable: true,
              zIndex: isSelected ? 200 : 90,
            });

            marker.addEventListener('gmp-click', () => {
              setSelectedDriverId(item.driver.id);
              map.panTo(pos);
            });
          } else {
            // Fallback to classic marker
            marker = new google.maps.Marker({
              position: pos,
              map,
              title: item.fullName,
              zIndex: isSelected ? 200 : 90,
            });
            marker.addListener('click', () => {
              setSelectedDriverId(item.driver.id);
              map.panTo(pos);
            });
          }
          markersMap.set(key, marker);
        } else {
          if (marker.position) {
            marker.position = pos;
          }
          if (marker.content) {
            marker.content = contentDiv;
          }
          marker.zIndex = isSelected ? 200 : 90;
        }
      });

      // Cleanup removed markers
      for (const [key, marker] of markersMap.entries()) {
        if (!activeKeys.has(key)) {
          marker.map = null;
          markersMap.delete(key);
        }
      }
    } else if (engine === 'leaflet' && lMapRef.current && lMarkersLayerRef.current) {
      import('leaflet').then((LModule) => {
        const L = LModule.default;
        const layer = lMarkersLayerRef.current;
        if (!layer) return;
        layer.clearLayers();

        validChauffeurs.forEach((item) => {
          const isSelected = item.driver.id === selectedDriverId;
          const state: ChauffeurRadarState = isSelected ? 'selected' : item.radarState;

          const html = buildChauffeurMarkerHtml(
            state,
            item.heading,
            item.fullName.split(' ')[1] || item.fullName.split(' ')[0],
            item.plateNumber,
            isSelected
          );

          const customIcon = L.divIcon({
            html,
            className: 'chauffeur-leaflet-marker',
            iconSize: [isSelected ? 52 : 46, isSelected ? 52 : 46],
            iconAnchor: [isSelected ? 26 : 23, isSelected ? 26 : 23],
          });

          const marker = L.marker([item.lat!, item.lng!], {
            icon: customIcon,
            zIndexOffset: isSelected ? 1000 : 200,
          }).addTo(layer);

          marker.on('click', () => {
            setSelectedDriverId(item.driver.id);
            lMapRef.current.setView([item.lat!, item.lng!], 14);
          });
        });
      });
    }
  }, [engine, filteredDrivers, selectedDriverId]);

  // Recenter / Fit Bounds handler
  const handleRecenter = useCallback(() => {
    if (driverPos && isValidCoordinate(driverPos.lat, driverPos.lng)) {
      if (engine === 'google' && gMapRef.current) {
        gMapRef.current.panTo({ lat: driverPos.lat, lng: driverPos.lng });
        gMapRef.current.setZoom(14);
      } else if (engine === 'leaflet' && lMapRef.current) {
        lMapRef.current.setView([driverPos.lat, driverPos.lng], 14);
      }
      toast.success('Radar centered on your live vehicle position');
      return;
    }

    // Fit all visible drivers
    const points = filteredDrivers
      .filter((d) => d.lat !== undefined && d.lng !== undefined && isValidCoordinate(d.lat, d.lng))
      .map((d) => ({ lat: d.lat!, lng: d.lng! }));

    if (points.length > 0) {
      if (engine === 'google' && gMapRef.current && (window as any).google?.maps) {
        const google = (window as any).google;
        const bounds = new google.maps.LatLngBounds();
        points.forEach((p) => bounds.extend(p));
        gMapRef.current.fitBounds(bounds, { top: 90, right: 60, bottom: 90, left: 60 });
      } else if (engine === 'leaflet' && lMapRef.current) {
        const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);
        lMapRef.current.fitBounds(latlngs, { padding: [60, 60] });
      }
    } else {
      // Default to Makkah
      if (engine === 'google' && gMapRef.current) {
        gMapRef.current.panTo({ lat: 21.4225, lng: 39.8262 });
        gMapRef.current.setZoom(12);
      } else if (engine === 'leaflet' && lMapRef.current) {
        lMapRef.current.setView([21.4225, 39.8262], 12);
      }
    }
  }, [driverPos, engine, filteredDrivers]);

  // Zoom controls
  const handleZoomIn = () => {
    if (engine === 'google' && gMapRef.current) {
      gMapRef.current.setZoom((gMapRef.current.getZoom() || 12) + 1);
    } else if (engine === 'leaflet' && lMapRef.current) {
      lMapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (engine === 'google' && gMapRef.current) {
      gMapRef.current.setZoom((gMapRef.current.getZoom() || 12) - 1);
    } else if (engine === 'leaflet' && lMapRef.current) {
      lMapRef.current.zoomOut();
    }
  };

  // Territory selection & jump
  const handleSelectTerritory = (terrId: string) => {
    setTerritoryFilter(terrId);
    if (terrId === 'all') {
      handleRecenter();
      return;
    }
    const terr = VIP_TERRITORIES.find((t) => t.id === terrId);
    if (terr) {
      if (engine === 'google' && gMapRef.current) {
        gMapRef.current.panTo({ lat: terr.lat, lng: terr.lng });
        gMapRef.current.setZoom(13);
      } else if (engine === 'leaflet' && lMapRef.current) {
        lMapRef.current.setView([terr.lat, terr.lng], 13);
      }
    }
  };

  return (
    <div className="relative z-10 isolate bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden flex flex-col transition-all">
      {/* ─────────────────────────────────────────────────────────────
          1. RADAR HEADER BAR (LIGHT LUXURY)
      ───────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200/80 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Live Chauffeur Radar & GPS Cockpit
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">&bull;</span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Al Harmain Central Fleet Dispatch
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Chauffeur Positioning & Territory Radar
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Real-time VIP satellite positioning broadcasting chauffeur coordinates to central operations across Holy
            Mosque precincts, KAIA airport corridors, and regional VIP hubs.
          </p>
        </div>

        {/* Telemetry pill */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          {driverPos && (
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2 shadow-sm">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="font-semibold text-slate-900">
                {driverPos.lat.toFixed(4)}° N, {driverPos.lng.toFixed(4)}° E
              </span>
            </div>
          )}

          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
              driverPos
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : gpsError
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                driverPos ? 'bg-emerald-500' : gpsError ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span>{driverPos ? 'Broadcasting Live GPS' : gpsError ? 'GPS Attention' : 'Acquiring GPS...'}</span>
          </div>

          {gpsError && (
            <button
              type="button"
              onClick={refreshGps}
              className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry GPS</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PRIMARY RADAR MAP CANVAS WITH FLOATING VIP HUD
      ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 isolate w-full h-[540px] sm:h-[620px] lg:h-[680px] bg-slate-100 overflow-hidden">
        {/* Map Container Mount */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* ─────────────────────────────────────────────────────────────
            2.1 POLISHED TOP CONTROL HUD (DESKTOP & TABLET)
        ───────────────────────────────────────────────────────────── */}
        <div className="absolute top-3 left-3 right-3 z-[400] pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 transition-all">
            {/* Search Input (44px target) */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chauffeur, plate, vehicle..."
                className="w-full h-11 pl-10 pr-9 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-7 h-7 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Status Filters (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('available')}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'available'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Available</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    statusFilter === 'available' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {counts.available}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('assigned')}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'assigned'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-sky-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                <span>Assigned</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    statusFilter === 'assigned' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {counts.assigned}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('on_trip')}
                className={`h-9 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'on_trip'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-purple-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                <span>On Trip</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    statusFilter === 'on_trip' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {counts.on_trip}
                </span>
              </button>
            </div>

            {/* Territory Filter Dropdown / Selector (44px target) */}
            <div className="hidden sm:flex items-center">
              <select
                value={territoryFilter}
                onChange={(e) => handleSelectTerritory(e.target.value)}
                className="h-11 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all"
                aria-label="Filter Territory"
              >
                <option value="all">🗺️ All Saudi VIP Territories</option>
                {VIP_TERRITORIES.map((terr) => (
                  <option key={terr.id} value={terr.id}>
                    {terr.shortName} ({territoryStats[terr.id]?.count || 0} Chauffeurs)
                  </option>
                ))}
              </select>
            </div>

            {/* Right Action Icons: Map Mode, Recenter, Zoom (+/-) (All 44px touch targets) */}
            <div className="flex items-center gap-1.5 justify-end">
              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className={`h-11 px-3 rounded-xl lg:hidden text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isMobileFiltersOpen
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>Filters</span>
                {statusFilter !== 'all' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                )}
              </button>

              {/* Map Type Toggle (Satellite vs Standard) (44px target) */}
              <button
                type="button"
                onClick={() => setMapMode(mapMode === 'satellite' ? 'standard' : 'satellite')}
                title={mapMode === 'satellite' ? 'Switch to Standard Vector Map' : 'Switch to Satellite View'}
                aria-label="Toggle Satellite / Standard Map"
                className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                  mapMode === 'satellite'
                    ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>

              {/* Recenter / Focus Button (44px target) */}
              <button
                type="button"
                onClick={handleRecenter}
                title="Recenter Radar on Active Vehicle"
                aria-label="Recenter Radar on Active Vehicle"
                className="h-11 w-11 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Crosshair className="w-4 h-4" />
              </button>

              {/* Zoom In Button (44px target) */}
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In (+)"
                aria-label="Zoom In"
                className="h-11 w-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Zoom Out Button (44px target) */}
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out (−)"
                aria-label="Zoom Out"
                className="h-11 w-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              2.2 MOBILE EXPANDABLE FILTER DRAWER
          ───────────────────────────────────────────────────────────── */}
          {isMobileFiltersOpen && (
            <div className="mt-2 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl space-y-3 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Chauffeur Status Filter:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setIsMobileFiltersOpen(false);
                    }}
                    className={`h-11 px-3 rounded-xl text-xs font-bold border flex items-center justify-between ${
                      statusFilter === 'all'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>All Chauffeurs</span>
                    <span className="font-mono">{counts.all}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('available');
                      setIsMobileFiltersOpen(false);
                    }}
                    className={`h-11 px-3 rounded-xl text-xs font-bold border flex items-center justify-between ${
                      statusFilter === 'available'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <span>Available</span>
                    <span className="font-mono">{counts.available}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('assigned');
                      setIsMobileFiltersOpen(false);
                    }}
                    className={`h-11 px-3 rounded-xl text-xs font-bold border flex items-center justify-between ${
                      statusFilter === 'assigned'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-sky-50 border-sky-200 text-sky-800'
                    }`}
                  >
                    <span>Assigned</span>
                    <span className="font-mono">{counts.assigned}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('on_trip');
                      setIsMobileFiltersOpen(false);
                    }}
                    className={`h-11 px-3 rounded-xl text-xs font-bold border flex items-center justify-between ${
                      statusFilter === 'on_trip'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-purple-50 border-purple-200 text-purple-800'
                    }`}
                  >
                    <span>On Trip</span>
                    <span className="font-mono">{counts.on_trip}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Territory Focus:
                </span>
                <select
                  value={territoryFilter}
                  onChange={(e) => {
                    handleSelectTerritory(e.target.value);
                    setIsMobileFiltersOpen(false);
                  }}
                  className="w-full h-11 px-3 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 outline-none"
                >
                  <option value="all">🗺️ All Saudi VIP Territories</option>
                  {VIP_TERRITORIES.map((terr) => (
                    <option key={terr.id} value={terr.id}>
                      {terr.shortName} ({territoryStats[terr.id]?.count || 0} Chauffeurs)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2.3 SELECTED CHAUFFEUR FLOATING INFORMATION PANEL
        ───────────────────────────────────────────────────────────── */}
        {selectedDriverData && (
          <div className="absolute bottom-3 left-3 z-[400] max-w-sm sm:max-w-md w-[calc(100%-24px)] sm:w-auto pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-4 sm:p-5 space-y-3.5">
              {/* Header: Driver Name, Status Badge & Close button */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm shadow-md border-2 border-amber-400/40">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        {selectedDriverData.fullName}
                      </h4>
                      {currentDriver && selectedDriverData.driver.id === currentDriver.id && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-700 font-bold">{selectedDriverData.plateNumber}</span>
                      <span>&bull;</span>
                      <span>{selectedDriverData.model}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      selectedDriverData.radarState === 'available'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedDriverData.radarState === 'assigned'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : selectedDriverData.radarState === 'on_trip'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : selectedDriverData.radarState === 'selected'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {selectedDriverData.radarState.replace('_', ' ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDriverId(null)}
                    title="Close Details"
                    aria-label="Close Driver Details"
                    className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chauffeur Stats & Territory */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rating & Trips</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{selectedDriverData.driver.rating ? selectedDriverData.driver.rating.toFixed(2) : '4.95'}</span>
                    <span className="text-slate-400">({selectedDriverData.driver.total_rides || 0} rides)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Territory Sector</span>
                  <p className="font-semibold text-slate-800 truncate" title={selectedDriverData.closestTerritory?.territory.name}>
                    {selectedDriverData.closestTerritory?.territory.shortName || 'En Route Corridor'}
                  </p>
                </div>
              </div>

              {/* Coordinates & Telemetry */}
              {selectedDriverData.lat && selectedDriverData.lng && (
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span>
                      {selectedDriverData.lat.toFixed(4)}° N, {selectedDriverData.lng.toFixed(4)}° E
                    </span>
                  </div>
                  <span className="text-slate-500 font-medium">
                    {selectedDriverData.speed ? `${Math.round(selectedDriverData.speed)} km/h` : 'Stationary'}
                  </span>
                </div>
              )}

              {/* Active Assignment / Mission (from real bookings backend data) */}
              {selectedDriverData.activeBooking ? (
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-900">
                      {selectedDriverData.activeBooking.booking_reference}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full">
                      {selectedDriverData.activeBooking.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-700 text-[11px]">
                    <p className="line-clamp-1">
                      <strong className="text-slate-900">From:</strong> {selectedDriverData.activeBooking.pickup_address}
                    </p>
                    <p className="line-clamp-1">
                      <strong className="text-slate-900">To:</strong> {selectedDriverData.activeBooking.destination_address}
                    </p>
                    {selectedDriverData.activeBooking.passenger_name && (
                      <p className="text-slate-600">
                        <strong className="text-slate-900">Pax:</strong> {selectedDriverData.activeBooking.passenger_name}{' '}
                        {selectedDriverData.activeBooking.passenger_phone && `(${selectedDriverData.activeBooking.passenger_phone})`}
                      </p>
                    )}
                  </div>

                  {selectedDriverData.activeBooking.passenger_phone && (
                    <a
                      href={`tel:${selectedDriverData.activeBooking.passenger_phone}`}
                      className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Passenger
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>On Standby &bull; Awaiting dispatch intake in territory hub.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            2.4 COMPACT MAP LEGEND (BOTTOM-RIGHT)
        ───────────────────────────────────────────────────────────── */}
        <div className="absolute bottom-3 right-3 z-[400] pointer-events-auto">
          {isLegendOpen ? (
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl text-xs space-y-2.5 min-w-[210px] animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-slate-900 text-xs">Radar Legend</span>
                <button
                  type="button"
                  onClick={() => setIsLegendOpen(false)}
                  className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chauffeur States */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chauffeur States</span>
                <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>Available Chauffeur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                    <span>Assigned Journey</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span>On Active Trip</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                    <span>Offline / Standby</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300"></span>
                    <span className="font-bold text-amber-900">Selected Marker</span>
                  </div>
                </div>
              </div>

              {/* Territory Boundaries */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Territories</span>
                <div className="space-y-1 text-[11px] text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-emerald-600 bg-emerald-100"></span>
                    <span>Active Hub (Chauffeur Present)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-slate-400 bg-slate-100"></span>
                    <span>Standby Hub (Monitoring)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsLegendOpen(true)}
              className="h-10 px-3 rounded-xl bg-white/95 hover:bg-white text-slate-700 text-xs font-bold border border-slate-200/90 shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Map Legend</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RADAR FOOTER HUD: TERRITORY PRESETS & REALTIME STATUS
      ───────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 sm:px-6 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 text-xs">Quick Territory Pan:</span>
          {VIP_TERRITORIES.map((terr) => (
            <button
              key={terr.id}
              type="button"
              onClick={() => handleSelectTerritory(terr.id)}
              className={`h-8 px-2.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                territoryFilter === terr.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {terr.shortName}
            </button>
          ))}
          {territoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => handleSelectTerritory('all')}
              className="h-8 px-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold transition-all cursor-pointer"
            >
              Reset View
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Supabase Realtime Telemetry Synced
          </span>
          <span>&bull;</span>
          <span className="font-mono text-slate-700 font-bold">
            {engine === 'google' ? 'Google Maps Ultra' : 'CartoDB VIP Vector'}
          </span>
        </div>
      </div>
    </div>
  );
}
