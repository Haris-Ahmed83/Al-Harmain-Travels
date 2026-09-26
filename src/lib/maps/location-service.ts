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

export function getGoogleMapsStatus(): boolean | null {
  return typeof window !== 'undefined' && !!(window as any).google?.maps;
}

/**
 * Returns true only if Google Maps is loaded on window.
 */
export function isGoogleMapsReady(): boolean {
  return typeof window !== 'undefined' && !!(window as any).google?.maps;
}

/**
 * Dynamically load Google Maps JavaScript API with libraries.
 * Ensures the script is injected only once and reused across all navigation/remounts.
 */
export function loadGoogleMaps(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  // 1. If Google Maps is already initialized on window, return true immediately
  if ((window as any).google?.maps) {
    return Promise.resolve(true);
  }

  // 2. If already loading, reuse the in-flight promise
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('[Al Harmain Maps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined.');
    return Promise.resolve(false);
  }

  googleMapsPromise = new Promise<boolean>((resolve) => {
    // Check if script tag was already injected into DOM
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.maps) {
        resolve(true);
        return;
      }

      const poll = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(poll);
          resolve(true);
        }
      }, 50);

      existing.addEventListener('load', () => {
        clearInterval(poll);
        resolve(true);
      }, { once: true });

      existing.addEventListener('error', () => {
        clearInterval(poll);
        googleMapsPromise = null;
        resolve(false);
      }, { once: true });

      setTimeout(() => {
        clearInterval(poll);
        resolve(!!(window as any).google?.maps);
      }, 8000);
      return;
    }

    // Inject script tag exactly once
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = (e) => {
      console.warn('[Al Harmain Maps] Script loading error:', e);
      googleMapsPromise = null;
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
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

/**
 * Request user's current GPS position using navigator.geolocation.getCurrentPosition.
 * Uses high accuracy and maximumAge: 0 to guarantee fresh hardware GPS position without stale cache.
 */
export async function getCurrentLocation(options?: {
  timeout?: number;
  maximumAge?: number;
  enableHighAccuracy?: boolean;
}): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser or device.');
  }

  const timeout = options?.timeout ?? 10_000;
  const maximumAge = options?.maximumAge ?? 0;
  const enableHighAccuracy = options?.enableHighAccuracy ?? true;

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (!isValidCoordinate(latitude, longitude)) {
          reject(new Error('Received invalid GPS coordinates from device.'));
          return;
        }
        resolve({
          latitude,
          longitude,
          accuracy: accuracy ?? undefined,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('Location permission was denied. Please allow location access in your browser settings to detect your pickup location.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable. Please ensure GPS/location services are turned on.'));
            break;
          case err.TIMEOUT:
            reject(new Error('Location request timed out. Please tap "Use Current Location" to retry.'));
            break;
          default:
            reject(new Error(err.message || 'Unable to retrieve your location. Please check device settings.'));
            break;
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge, // CRITICAL: 0 forces fresh GPS read without stale cache
      }
    );
  });
}

/**
 * Continuously watch the user's GPS position with high accuracy.
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
      if (isValidCoordinate(latitude, longitude)) {
        onSuccess({
          latitude,
          longitude,
          accuracy: accuracy ?? undefined,
        });
      }
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
 * Calculate road route, distance, and duration between pickup and destination.
 * Tries Google Routes API (New) → OSRM (free) → Haversine fallback.
 */
export async function calculateRoute(
  pickup: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteEstimate> {
  const cacheKey = `${pickup.lat.toFixed(4)},${pickup.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
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
          body: JSON.stringify({
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
          }),
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

    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
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

  // 3. Haversine straight-line estimate with road curvature factor
  const distKm = calculateDistanceKm(pickup.lat, pickup.lng, destination.lat, destination.lng);
  const durationMin = estimateDurationMinutes(distKm);

  const steps = 10;
  const polylineCoords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const lat = pickup.lat + (destination.lat - pickup.lat) * fraction;
    const lng = pickup.lng + (destination.lng - pickup.lng) * fraction;
    polylineCoords.push([lat, lng]);
  }

  const estimate: RouteEstimate = {
    distanceKm: distKm,
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
