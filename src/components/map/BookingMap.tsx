'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPin, Navigation, Compass, Layers } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import {
  loadGoogleMaps,
  isGoogleMapsReady,
  formatDistance,
  formatDuration,
  isValidCoordinate,
} from '@/lib/maps/location-service';

export interface BookingMapProps {
  pickup?: { latitude: number; longitude: number; address?: string } | null;
  destination?: { latitude: number; longitude: number; address?: string } | null;
  userLocation?: { latitude: number; longitude: number; accuracy?: number } | null;
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

// SVG Icon Data URIs for crisp, high-DPI rendering
const PICKUP_ICON_SVG = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
  <defs>
    <filter id="p-shadow" x="-30%" y="-20%" width="160%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#022c22" flood-opacity="0.45"/>
    </filter>
  </defs>
  <path d="M19 1 C9.6 1 2 8.6 2 18 C2 29.5 19 46 19 46 C19 46 36 29.5 36 18 C36 8.6 28.4 1 19 1 Z" fill="#047857" filter="url(#p-shadow)"/>
  <circle cx="19" cy="18" r="14.5" fill="#059669" stroke="#ffffff" stroke-width="2.5"/>
  <text x="19" y="23.5" font-size="15" font-weight="900" font-family="system-ui, -apple-system, sans-serif" fill="#ffffff" text-anchor="middle">P</text>
</svg>
`);

const DEST_ICON_SVG = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
  <defs>
    <filter id="d-shadow" x="-30%" y="-20%" width="160%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#451a03" flood-opacity="0.45"/>
    </filter>
  </defs>
  <path d="M19 1 C9.6 1 2 8.6 2 18 C2 29.5 19 46 19 46 C19 46 36 29.5 36 18 C36 8.6 28.4 1 19 1 Z" fill="#b45309" filter="url(#d-shadow)"/>
  <circle cx="19" cy="18" r="14.5" fill="#f59e0b" stroke="#ffffff" stroke-width="2.5"/>
  <text x="19" y="23.5" font-size="15" font-weight="900" font-family="system-ui, -apple-system, sans-serif" fill="#0f172a" text-anchor="middle">D</text>
</svg>
`);

const USER_GPS_ICON_SVG = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
  <defs>
    <radialGradient id="gps-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="#10b981" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <filter id="gps-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#022c22" flood-opacity="0.5"/>
    </filter>
  </defs>
  <circle cx="19" cy="19" r="18" fill="url(#gps-halo)"/>
  <circle cx="19" cy="19" r="9" fill="#ffffff" filter="url(#gps-shadow)"/>
  <circle cx="19" cy="19" r="6.5" fill="#059669"/>
  <circle cx="19" cy="19" r="2.5" fill="#ffffff"/>
</svg>
`);

export default function BookingMap({
  pickup,
  destination,
  userLocation,
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

  // Centering flag to ensure map smoothly centers on GPS coordinates when they arrive
  const hasInitiallyCenteredRef = useRef<boolean>(false);

  // Google Maps references
  const gMapRef = useRef<any>(null);
  const gPickupMarkerRef = useRef<any>(null);
  const gDestMarkerRef = useRef<any>(null);
  const gUserMarkerRef = useRef<any>(null);
  const gUserAccuracyCircleRef = useRef<any>(null);
  const gRoutePolylineRef = useRef<any>(null);
  const gRouteGlowPolylineRef = useRef<any>(null);
  const gInfoWindowRef = useRef<any>(null);

  // Leaflet references (fallback)
  const lMapRef = useRef<any>(null);
  const lLayerGroupRef = useRef<any>(null);

  // 1. Initial engine setup: Try Google Maps first, fallback to Leaflet
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (typeof window === 'undefined' || !isMounted) return;

      const hasGoogle = await loadGoogleMaps().catch(() => false);

      if (!isMounted || !mapContainerRef.current) return;

      if (hasGoogle && (window as any).google?.maps) {
        try {
          const google = (window as any).google;

          // Clear any leftover DOM from previous instances before mounting Google Maps
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

          const map = new google.maps.Map(mapContainerRef.current, {
            center: { lat: centerLat, lng: centerLng },
            zoom: initialZoom,
            disableDefaultUI: true,
            zoomControl: true,
            zoomControlOptions: {
              position: google.maps.ControlPosition.RIGHT_TOP,
            },
            styles: isDark ? darkGoogleMapStyles : lightGoogleMapStyles,
            gestureHandling: 'greedy',
            clickableIcons: false,
          });

          gMapRef.current = map;
          gInfoWindowRef.current = new google.maps.InfoWindow();

          // Reset marker references for fresh mounting
          gPickupMarkerRef.current = null;
          gDestMarkerRef.current = null;
          gUserMarkerRef.current = null;
          gUserAccuracyCircleRef.current = null;
          gRoutePolylineRef.current = null;
          gRouteGlowPolylineRef.current = null;

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
          console.error('[Al Harmain Maps] Google Maps init error:', err);
        }
      }

      // Fallback: Leaflet
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

        L.control.zoom({ position: 'topright' }).addTo(map);

        // OpenStreetMap free tiles (no API key required)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        lLayerGroupRef.current = layerGroup;
        lMapRef.current = map;

        map.on('click', (e: any) => {
          if (isValidCoordinate(e.latlng?.lat, e.latlng?.lng) && onLocationPick) {
            onLocationPick(e.latlng.lat, e.latlng.lng);
          }
        });

        setEngine('leaflet');
      } catch (err) {
        console.error('[Al Harmain Maps] Leaflet init error:', err);
        setEngine('leaflet');
      }
    }

    init();

    return () => {
      isMounted = false;

      // Clean up Google Maps markers and listeners
      const google = typeof window !== 'undefined' ? (window as any).google : null;
      if (google?.maps?.event) {
        if (gMapRef.current) {
          google.maps.event.clearInstanceListeners(gMapRef.current);
        }
        if (gPickupMarkerRef.current) {
          google.maps.event.clearInstanceListeners(gPickupMarkerRef.current);
          gPickupMarkerRef.current.setMap(null);
        }
        if (gDestMarkerRef.current) {
          google.maps.event.clearInstanceListeners(gDestMarkerRef.current);
          gDestMarkerRef.current.setMap(null);
        }
        if (gUserMarkerRef.current) {
          google.maps.event.clearInstanceListeners(gUserMarkerRef.current);
          gUserMarkerRef.current.setMap(null);
        }
      } else {
        if (gPickupMarkerRef.current) gPickupMarkerRef.current.setMap(null);
        if (gDestMarkerRef.current) gDestMarkerRef.current.setMap(null);
        if (gUserMarkerRef.current) gUserMarkerRef.current.setMap(null);
      }

      if (gUserAccuracyCircleRef.current) gUserAccuracyCircleRef.current.setMap(null);
      if (gRoutePolylineRef.current) gRoutePolylineRef.current.setMap(null);
      if (gRouteGlowPolylineRef.current) gRouteGlowPolylineRef.current.setMap(null);
      if (gInfoWindowRef.current) gInfoWindowRef.current.close();

      gPickupMarkerRef.current = null;
      gDestMarkerRef.current = null;
      gUserMarkerRef.current = null;
      gUserAccuracyCircleRef.current = null;
      gRoutePolylineRef.current = null;
      gRouteGlowPolylineRef.current = null;
      gInfoWindowRef.current = null;
      gMapRef.current = null;

      if (lMapRef.current) {
        lMapRef.current.remove();
        lMapRef.current = null;
        lLayerGroupRef.current = null;
      }

      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  // 2. Google Maps: Update Theme Styles dynamically
  useEffect(() => {
    if (engine === 'google' && gMapRef.current) {
      gMapRef.current.setOptions({
        styles: isDark ? darkGoogleMapStyles : lightGoogleMapStyles,
      });
    }
  }, [isDark, engine]);

  // 3. Google Maps: Update Markers, Draggable Behavior, and Polyline
  useEffect(() => {
    if (engine !== 'google' || !gMapRef.current || typeof window === 'undefined') return;

    const google = (window as any).google;
    if (!google?.maps) return;

    const map = gMapRef.current;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // Helper to open stylish info bubble
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
      gInfoWindowRef.current.open(map, marker);
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
        gUserMarkerRef.current = new google.maps.Marker({
          position: userPos,
          map,
          title: 'Your Current GPS Location',
          icon: {
            url: USER_GPS_ICON_SVG,
            scaledSize: new google.maps.Size(38, 38),
            anchor: new google.maps.Point(19, 19),
          },
          zIndex: 100,
        });

        gUserMarkerRef.current.addListener('click', () => {
          showMarkerInfo(gUserMarkerRef.current, 'Current Location', 'Your live detected GPS coordinate', '#059669');
        });
      } else {
        gUserMarkerRef.current.setPosition(userPos);
        gUserMarkerRef.current.setMap(map);
      }

      // Accuracy circle if accuracy is known
      if (typeof userLocation.accuracy === 'number' && userLocation.accuracy > 0 && userLocation.accuracy < 500) {
        if (!gUserAccuracyCircleRef.current) {
          gUserAccuracyCircleRef.current = new google.maps.Circle({
            map,
            center: userPos,
            radius: userLocation.accuracy,
            fillColor: '#10b981',
            fillOpacity: 0.12,
            strokeColor: '#059669',
            strokeOpacity: 0.35,
            strokeWeight: 1,
            clickable: false,
          });
        } else {
          gUserAccuracyCircleRef.current.setCenter(userPos);
          gUserAccuracyCircleRef.current.setRadius(userLocation.accuracy);
          gUserAccuracyCircleRef.current.setMap(map);
        }
      } else if (gUserAccuracyCircleRef.current) {
        gUserAccuracyCircleRef.current.setMap(null);
      }
    } else {
      if (gUserMarkerRef.current) gUserMarkerRef.current.setMap(null);
      if (gUserAccuracyCircleRef.current) gUserAccuracyCircleRef.current.setMap(null);
    }

    // B. Pickup Marker (Draggable)
    if (hasValidPickup && pickup) {
      const pickupPos = { lat: pickup.latitude, lng: pickup.longitude };
      bounds.extend(pickupPos);
      hasPoints = true;

      if (!gPickupMarkerRef.current) {
        const marker = new google.maps.Marker({
          position: pickupPos,
          map,
          draggable: true,
          title: pickup.address || 'Pickup Location (Drag to adjust)',
          icon: {
            url: PICKUP_ICON_SVG,
            scaledSize: new google.maps.Size(38, 48),
            anchor: new google.maps.Point(19, 48),
          },
          animation: google.maps.Animation.DROP,
          zIndex: 200,
        });

        marker.addListener('dragend', (e: any) => {
          if (!e.latLng) return;
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          if (isValidCoordinate(newLat, newLng)) {
            if (onPickupAdjust) {
              onPickupAdjust(newLat, newLng);
            } else if (onLocationPick) {
              onLocationPick(newLat, newLng);
            }
          }
        });

        marker.addListener('click', () => {
          showMarkerInfo(marker, 'Pickup Location', pickup.address || 'Pickup Point', '#047857');
        });

        gPickupMarkerRef.current = marker;
      } else {
        gPickupMarkerRef.current.setPosition(pickupPos);
        gPickupMarkerRef.current.setTitle(pickup.address || 'Pickup Location');
        gPickupMarkerRef.current.setMap(map);
      }
    } else if (gPickupMarkerRef.current) {
      gPickupMarkerRef.current.setMap(null);
      gPickupMarkerRef.current = null;
    }

    // C. Destination Marker (Draggable)
    if (hasValidDest && destination) {
      const destPos = { lat: destination.latitude, lng: destination.longitude };
      bounds.extend(destPos);
      hasPoints = true;

      if (!gDestMarkerRef.current) {
        const marker = new google.maps.Marker({
          position: destPos,
          map,
          draggable: true,
          title: destination.address || 'Destination (Drag to adjust)',
          icon: {
            url: DEST_ICON_SVG,
            scaledSize: new google.maps.Size(38, 48),
            anchor: new google.maps.Point(19, 48),
          },
          animation: google.maps.Animation.DROP,
          zIndex: 210,
        });

        marker.addListener('dragend', (e: any) => {
          if (!e.latLng) return;
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          if (isValidCoordinate(newLat, newLng)) {
            if (onDestinationAdjust) {
              onDestinationAdjust(newLat, newLng);
            } else if (onLocationPick) {
              onLocationPick(newLat, newLng);
            }
          }
        });

        marker.addListener('click', () => {
          showMarkerInfo(marker, 'Destination', destination.address || 'Drop-off Destination', '#b45309');
        });

        gDestMarkerRef.current = marker;
      } else {
        gDestMarkerRef.current.setPosition(destPos);
        gDestMarkerRef.current.setTitle(destination.address || 'Destination');
        gDestMarkerRef.current.setMap(map);
      }
    } else if (gDestMarkerRef.current) {
      gDestMarkerRef.current.setMap(null);
      gDestMarkerRef.current = null;
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
        } else if (hasValidPickup && pickup) {
          map.panTo({ lat: pickup.latitude, lng: pickup.longitude });
          if (!hasInitiallyCenteredRef.current) {
            map.setZoom(16);
            hasInitiallyCenteredRef.current = true;
          }
        } else if (hasValidUserLoc && userLocation) {
          map.panTo({ lat: userLocation.latitude, lng: userLocation.longitude });
          if (!hasInitiallyCenteredRef.current) {
            map.setZoom(16);
            hasInitiallyCenteredRef.current = true;
          }
        }
      }
    }
  }, [engine, pickup, destination, userLocation, routeCoords, onPickupAdjust, onDestinationAdjust, onLocationPick]);

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
              <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 border-2 border-white shadow-lg"></span>
            </div>
          `,
          className: 'custom-user-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
          .bindPopup('<strong>📍 Current Location</strong>')
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
        } catch {}
      } else if (hasValidPickup) {
        map.setView([pickup.latitude, pickup.longitude], 16, { animate: true });
        hasInitiallyCenteredRef.current = true;
      } else if (hasValidUserLoc) {
        map.setView([userLocation.latitude, userLocation.longitude], 16, { animate: true });
        hasInitiallyCenteredRef.current = true;
      } else if (boundsLatLngs.length > 0) {
        map.setView(boundsLatLngs[0], 15, { animate: true });
      }
    };

    updateLeaflet();

    return () => {
      isMounted = false;
    };
  }, [engine, pickup, destination, userLocation, routeCoords, onPickupAdjust, onDestinationAdjust, onLocationPick]);

  // Recenter Handler
  const handleRecenter = useCallback(() => {
    if (onRecenterClick) {
      onRecenterClick();
    }

    const target = (userLocation && isValidCoordinate(userLocation.latitude, userLocation.longitude))
      ? userLocation
      : (pickup && isValidCoordinate(pickup.latitude, pickup.longitude))
      ? pickup
      : null;

    if (!target) return;

    if (engine === 'google' && gMapRef.current) {
      gMapRef.current.panTo({ lat: target.latitude, lng: target.longitude });
      gMapRef.current.setZoom(16);
    } else if (engine === 'leaflet' && lMapRef.current) {
      lMapRef.current.setView([target.latitude, target.longitude], 16, { animate: true });
    }
  }, [engine, userLocation, pickup, onRecenterClick]);

  return (
    <div className={`relative shadow-2xl border border-base bg-surface ${className}`}>
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />

      {/* Engine Indicator & Controls Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
        {/* Use Current Location / Recenter GPS Control */}
        {(userLocation || pickup) && (
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Use Current Location"
            title="Use Current Location / Recenter map"
            className="p-2.5 sm:px-3 sm:py-2 rounded-2xl bg-card/95 hover:bg-card text-primary border border-base shadow-xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold hover:border-emerald-500/50 cursor-pointer"
          >
            <Crosshair className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Use Current Location</span>
          </button>
        )}
      </div>

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
