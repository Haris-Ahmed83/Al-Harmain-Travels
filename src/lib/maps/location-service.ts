import { SAUDI_LANDMARKS, calculateDistanceKm, estimateDurationMinutes } from '@/lib/geo';
import { RouteEstimate } from '@/types';

export interface PlaceSuggestion {
  placeId: string;
  title: string;
  subtitle: string;
  address: string;
  latitude: number;
  longitude: number;
  category?: 'airport' | 'holy_site' | 'hotel' | 'hotel_hub' | 'station' | 'city' | 'general';
}

// In-memory caches
const geocodeCache = new Map<string, string>();
const routeCache = new Map<string, RouteEstimate>();

let googleMapsPromise: Promise<boolean> | null = null;
let googleMapsAuthFailed = false;
const authFailureListeners = new Set<() => void>();

export function markGoogleMapsAuthFailed(): void {
  googleMapsAuthFailed = true;
  googleMapsPromise = Promise.resolve(false);
  authFailureListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

export function hasGoogleMapsAuthFailed(): boolean {
  return googleMapsAuthFailed;
}

export function onGoogleMapsAuthFailure(cb: () => void): () => void {
  authFailureListeners.add(cb);
  if (googleMapsAuthFailed) {
    cb();
  }
  return () => {
    authFailureListeners.delete(cb);
  };
}

if (typeof window !== 'undefined') {
  const existingFailure = (window as any).gm_authFailure;
  (window as any).gm_authFailure = () => {
    console.warn('[Al Harmain Maps] Google Maps auth failure (billing/key restriction). Switching to resilient Leaflet engine.');
    markGoogleMapsAuthFailed();
    if (typeof existingFailure === 'function') {
      try { existingFailure(); } catch {}
    }
  };
}

export function getGoogleMapsStatus(): boolean | null {
  if (googleMapsAuthFailed) return false;
  return typeof window !== 'undefined' && !!(window as any).google?.maps?.Map;
}

/**
 * Returns true only if Google Maps is loaded on window and has not failed authentication.
 * With loading=async, checks google.maps.Map to confirm libraries are fully hydrated.
 */
export function isGoogleMapsReady(): boolean {
  if (googleMapsAuthFailed) return false;
  return typeof window !== 'undefined' && !!(window as any).google?.maps?.Map;
}

/**
 * Dynamically load Google Maps JavaScript API with libraries.
 * Ensures the script is injected only once and reused across all navigation/remounts.
 */
export function loadGoogleMaps(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  // 1. Already fully ready — google.maps.Map is populated
  if ((window as any).google?.maps?.Map) {
    return Promise.resolve(true);
  }

  // 2. Reuse the in-flight promise (prevents duplicate script injection)
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('[Al Harmain Maps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined.');
    return Promise.resolve(false);
  }

  googleMapsPromise = new Promise<boolean>((resolve) => {
    // If script is already in DOM (e.g. after HMR / promise reset), poll for readiness
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.maps?.Map) {
        resolve(true);
        return;
      }
      // Poll until the callback fires and google.maps.Map appears
      const poll = setInterval(() => {
        if ((window as any).google?.maps?.Map) {
          clearInterval(poll);
          resolve(true);
        }
      }, 50);
      existing.addEventListener('error', () => {
        clearInterval(poll);
        googleMapsPromise = null;
        resolve(false);
      }, { once: true });
      setTimeout(() => {
        clearInterval(poll);
        resolve(!!(window as any).google?.maps?.Map);
      }, 8000);
      return;
    }

    // Define the callback BEFORE injecting the script.
    // With loading=async + callback + libraries=marker, Google calls this function once
    // ALL constructors are ready: google.maps.Map, InfoWindow, marker.AdvancedMarkerElement.
    // No importLibrary('maps') call is needed — avoiding the extra auth validation pass
    // that was causing the "API key required" overlay on previously working keys.
    const callbackName = '__alharmain_maps_ready__';
    (window as any)[callbackName] = () => {
      try { delete (window as any)[callbackName]; } catch {}
      // Yield one tick so gm_authFailure can fire first if the key is rejected
      setTimeout(() => {
        if (googleMapsAuthFailed) {
          googleMapsPromise = null;
          resolve(false);
        } else {
          resolve(!!(window as any).google?.maps?.Map);
        }
      }, 50);
    };

    // Inject script exactly once
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    // loading=async  → suppresses the "loaded without loading=async" console warning
    // callback=...   → fires our function when all requested libraries are ready
    // libraries=marker → pre-loads AdvancedMarkerElement alongside the core bundle
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=marker&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = (e) => {
      console.warn('[Al Harmain Maps] Script loading error:', e);
      try { delete (window as any)[callbackName]; } catch {}
      
            googleMapsPromise = null;
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

let markerLibraryPromise: Promise<any> | null = null;

/**
 * Loads and returns the AdvancedMarkerElement class using google.maps.importLibrary('marker').
 */
export async function loadMarkerLibrary(): Promise<any> {
  const isLoaded = await loadGoogleMaps();
  if (!isLoaded || typeof window === 'undefined' || !(window as any).google?.maps) {
    return null;
  }
  const google = (window as any).google;
  if (google.maps.marker?.AdvancedMarkerElement) {
    return google.maps.marker.AdvancedMarkerElement;
  }
  if (!markerLibraryPromise) {
    markerLibraryPromise = google.maps.importLibrary('marker')
      .then((lib: any) => lib.AdvancedMarkerElement)
      .catch((err: any) => {
        console.warn('[Al Harmain Maps] Failed to load marker library:', err);
        markerLibraryPromise = null;
        return null;
      });
  }
  return markerLibraryPromise;
}


/**
 * Validate that latitude and longitude are valid finite numbers within geographical bounds.
 */
export function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export const MAX_ACCEPTABLE_GPS_ACCURACY_METERS = 50000;
export const HIGH_ACCURACY_GPS_THRESHOLD_METERS = 100;

/**
 * Request user's current GPS position using hardware/Wi-Fi positioning with high accuracy.
 * Uses maximumAge: 0 to guarantee fresh hardware GPS position without stale cache.
 * Resolves as soon as a valid fix is acquired (typically < 1s) and handles desktop/mobile gracefully.
 */
export async function getCurrentLocation(options?: {
  timeout?: number;
  maximumAge?: number;
  enableHighAccuracy?: boolean;
}): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser or device.');
  }

  const timeoutMs = options?.timeout ?? 5_000;
  const maximumAge = options?.maximumAge ?? 0;
  const enableHighAccuracy = options?.enableHighAccuracy ?? true;

  return new Promise((resolve, reject) => {
    let isDone = false;

    const finishSuccess = (latitude: number, longitude: number, accuracy?: number) => {
      if (isDone) return;
      isDone = true;
      resolve({ latitude, longitude, accuracy });
    };

    const finishError = (err: Error) => {
      if (isDone) return;
      isDone = true;
      reject(err);
    };

    // First attempt: High accuracy hardware/Wi-Fi positioning
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (!isValidCoordinate(latitude, longitude)) {
          finishError(new Error('Received invalid GPS coordinates from device.'));
          return;
        }

        const acc = typeof accuracy === 'number' && Number.isFinite(accuracy) ? accuracy : undefined;
        finishSuccess(latitude, longitude, acc);
      },
      (err) => {
        if (isDone) return;

        // If permission was explicitly denied, fail fast with helpful message
        if (err.code === err.PERMISSION_DENIED) {
          finishError(
            new Error(
              'Location permission was denied. Please allow location access in your browser settings to detect your pickup location.'
            )
          );
          return;
        }

        // Second attempt: Fallback to standard network accuracy if highAccuracy timed out (e.g. desktop PCs)
        if (enableHighAccuracy) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude, accuracy } = pos.coords;
              if (isValidCoordinate(latitude, longitude)) {
                const acc = typeof accuracy === 'number' && Number.isFinite(accuracy) ? accuracy : undefined;
                finishSuccess(latitude, longitude, acc);
                return;
              }
              finishError(new Error('Location information is unavailable. Please ensure location services are enabled.'));
            },
            (fallbackErr) => {
              finishError(new Error(err.message || fallbackErr.message || 'Unable to retrieve location.'));
            },
            {
              enableHighAccuracy: false,
              timeout: 4000,
              maximumAge: 30000,
            }
          );
          return;
        }

        finishError(new Error(err.message || 'Unable to retrieve location.'));
      },
      {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge,
      }
    );
  });
}

/**
 * Continuously watch the user's GPS position with high accuracy.
 * Streams real-time device updates to track user motion.
 * Returns a teardown/cleanup function to stop watching when unmounted.
 */
export function watchCurrentLocation(
  onSuccess: (coords: { latitude: number; longitude: number; accuracy?: number }) => void,
  onError?: (err: Error) => void,
  options?: PositionOptions
): () => void {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    onError?.(new Error('Geolocation is not supported by your browser or device.'));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      if (!isValidCoordinate(latitude, longitude)) return;

      const acc = typeof accuracy === 'number' && Number.isFinite(accuracy) ? accuracy : undefined;
      onSuccess({
        latitude,
        longitude,
        accuracy: acc,
      });
    },
    (err) => {
      let message = 'Unable to update location.';
      if (err.code === err.PERMISSION_DENIED) {
        message = 'Location permission was denied. Please allow location access in your browser.';
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        message = 'Location information is unavailable.';
      } else if (err.code === err.TIMEOUT) {
        message = 'Location request timed out.';
      }
      onError?.(new Error(message));
    },
    {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0,
      ...options,
    }
  );

  return () => {
    try {
      navigator.geolocation.clearWatch(watchId);
    } catch {}
  };
}

/**
 * Reverse geocode latitude & longitude to a human-readable address.
 * Tries Server Route (Places API New searchNearby) → OSM Nominatim → Landmark proximity.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Call server route handler with Google Places API (New) searchNearby
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(`/api/places/reverse-geocode?lat=${lat}&lng=${lng}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.address && !data.address.startsWith('Location (')) {
        geocodeCache.set(cacheKey, data.address);
        return data.address;
      }
    }
  } catch {
    // Fall through to Nominatim
  }

  // 2. OpenStreetMap Nominatim reverse geocode fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'AlHarmainTravels/1.0' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        const parts = data.display_name.split(', ');
        const concise = parts.slice(0, 4).join(', ');
        geocodeCache.set(cacheKey, concise);
        return concise;
      }
    }
  } catch {
    // Fall through to landmark proximity
  }

  // 3. Proximity check against curated Saudi landmarks
  let closestLandmark = SAUDI_LANDMARKS[0];
  let minDistance = calculateDistanceKm(lat, lng, closestLandmark.latitude, closestLandmark.longitude);

  for (const landmark of SAUDI_LANDMARKS) {
    const dist = calculateDistanceKm(lat, lng, landmark.latitude, landmark.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closestLandmark = landmark;
    }
  }

  if (minDistance < 2.0) {
    const desc = `Near ${closestLandmark.name}, ${closestLandmark.city}`;
    geocodeCache.set(cacheKey, desc);
    return desc;
  }

  const fallback = `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Search places and addresses.
 * Tries Google Places API (New) Server Handler → OSM Nominatim → curated landmarks.
 */
export async function searchPlaces(
  query: string,
  userCoords?: { latitude: number; longitude: number } | null
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  // Always filter curated landmarks first for instant local matches
  const landmarkMatches: PlaceSuggestion[] = SAUDI_LANDMARKS.filter(
    (l) =>
      l.name.toLowerCase().includes(trimmed) ||
      l.city.toLowerCase().includes(trimmed)
  ).map((l) => ({
    placeId: l.id,
    title: l.name,
    subtitle: `${l.city}, Saudi Arabia`,
    address: `${l.name}, ${l.city}`,
    latitude: l.latitude,
    longitude: l.longitude,
    category: l.category,
  }));

  // 1. Google Places API (New) via Server Route Handler with location bias
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const biasParams = userCoords
      ? `&lat=${userCoords.latitude}&lng=${userCoords.longitude}`
      : '';
    const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(query)}${biasParams}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
        return [...landmarkMatches.slice(0, 2), ...data.suggestions];
      }
    }
  } catch {
    // Fall through silently without console error
  }

  // 2. OpenStreetMap Nominatim search (free, no billing required)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'AlHarmainTravels/1.0' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const results: any[] = await res.json();
      const nominatimResults: PlaceSuggestion[] = results.map((item, idx) => {
        const parts = (item.display_name || '').split(', ');
        const mainTitle = parts[0] || query;
        const secondary = parts.slice(1, 4).join(', ');

        return {
          placeId: `osm-${item.osm_id || idx}`,
          title: mainTitle,
          subtitle: secondary || 'Address',
          address: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          category: 'general' as const,
        };
      });

      // Deduplicate with curated landmarks
      const combined = [...landmarkMatches];
      for (const nr of nominatimResults) {
        if (
          !combined.some(
            (c) =>
              Math.abs(c.latitude - nr.latitude) < 0.005 &&
              Math.abs(c.longitude - nr.longitude) < 0.005
          )
        ) {
          combined.push(nr);
        }
      }
      return combined.slice(0, 8);
    }
  } catch {
    // Fall through to landmarks only
  }

  return landmarkMatches.slice(0, 6);
}

/**
 * Decode a Google Encoded Polyline string into an array of [lat, lng] tuples.
 * Used to parse the polyline returned by the Routes API (New).
 * Reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coords.push([lat / 1e5, lng / 1e5]);
  }

  return coords;
}

/**
 * Calculate road route, distance, and duration between pickup and destination,
 * with optional intermediate waypoints.
 * Tries Google Routes API (New) → OSRM (free) → Haversine fallback.
 */
export async function calculateRoute(
  pickup: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  waypoints?: { lat: number; lng: number }[]
): Promise<RouteEstimate> {
  const validWaypoints = (waypoints || []).filter(
    (w) => isValidCoordinate(w?.lat, w?.lng)
  );

  const waypointsKey = validWaypoints.length > 0
    ? `|stops:${validWaypoints.map((w) => `${w.lat.toFixed(4)},${w.lng.toFixed(4)}`).join(';')}`
    : '';
  const cacheKey = `${pickup.lat.toFixed(4)},${pickup.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}${waypointsKey}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Ensure Google Maps is loaded
  await loadGoogleMaps().catch(() => false);

  // 1. Google Routes API (New) — replaces the legacy DirectionsService
  //    Uses a direct REST fetch so no extra JS SDK library is required.
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (googleApiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const requestBody: any = {
        origin: {
          location: { latLng: { latitude: pickup.lat, longitude: pickup.lng } },
        },
        destination: {
          location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        languageCode: 'en-US',
        units: 'METRIC',
      };

      if (validWaypoints.length > 0) {
        requestBody.intermediates = validWaypoints.map((w) => ({
          location: { latLng: { latitude: w.lat, longitude: w.lng } },
        }));
      }

      const res = await fetch(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey,
            'X-Goog-FieldMask':
              'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.routes?.length > 0) {
          const route = data.routes[0];
          const distKm = parseFloat((route.distanceMeters / 1000).toFixed(1));
          // duration is returned as e.g. "1234s"
          const durationSec = parseInt((route.duration || '0s').replace('s', ''), 10);
          const durationMin = Math.ceil(durationSec / 60);
          const polylineCoords = decodePolyline(route.polyline.encodedPolyline);

          const estimate: RouteEstimate = {
            distanceKm: distKm,
            durationMinutes: durationMin,
            polylineCoords,
            source: 'google',
          };
          routeCache.set(cacheKey, estimate);
          return estimate;
        }
      }
    } catch {
      // Fall through to OSRM
    }
  }

  // 2. Open Source Routing Machine (OSRM) — completely free, no key needed
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const waypointsCoordStr = validWaypoints.length > 0
      ? ';' + validWaypoints.map((w) => `${w.lng},${w.lat}`).join(';')
      : '';
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat}${waypointsCoordStr};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.length > 0) {
        const route = data.routes[0];
        const distKm = parseFloat((route.distance / 1000).toFixed(1));
        const durationMin = Math.ceil(route.duration / 60);
        // GeoJSON coords are [lon, lat] → convert to Leaflet [lat, lon]
        const polylineCoords: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        const estimate: RouteEstimate = {
          distanceKm: distKm,
          durationMinutes: durationMin,
          polylineCoords,
          source: 'osrm',
        };
        routeCache.set(cacheKey, estimate);
        return estimate;
      }
    }
  } catch {
    // Fall through to Haversine
  }

  // 3. Haversine straight-line estimate with road curvature factor across legs
  const allPoints = [pickup, ...validWaypoints, destination];
  let distKm = 0;
  const polylineCoords: [number, number][] = [];

  for (let p = 0; p < allPoints.length - 1; p++) {
    const from = allPoints[p];
    const to = allPoints[p + 1];
    distKm += calculateDistanceKm(from.lat, from.lng, to.lat, to.lng);

    const steps = 10;
    for (let i = (p === 0 ? 0 : 1); i <= steps; i++) {
      const fraction = i / steps;
      const lat = from.lat + (to.lat - from.lat) * fraction;
      const lng = from.lng + (to.lng - from.lng) * fraction;
      polylineCoords.push([lat, lng]);
    }
  }

  const durationMin = estimateDurationMinutes(distKm);

  const estimate: RouteEstimate = {
    distanceKm: parseFloat(distKm.toFixed(1)),
    durationMinutes: durationMin,
    polylineCoords,
    source: 'haversine',
  };
  routeCache.set(cacheKey, estimate);
  return estimate;
}

/**
 * Format distance string nicely (e.g. "850 m" or "12.6 km")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format travel duration string (e.g. "28 min" or "2 hr 15 min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (remMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remMinutes} min`;
}

/**
 * Check if two coordinate locations are identical or within 60 meters
 */
export function isSameLocation(
  loc1: { latitude: number; longitude: number },
  loc2: { latitude: number; longitude: number },
  thresholdMeters = 60
): boolean {
  const distKm = calculateDistanceKm(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude);
  return distKm * 1000 <= thresholdMeters;
}
