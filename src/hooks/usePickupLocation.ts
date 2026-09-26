'use client';

/**
 * usePickupLocation — Authoritative GPS Pickup Location Hook for Al Harmain Travels.
 *
 * Requirements addressed:
 * 1. Always request fresh GPS on every mount (maximumAge: 0, no stale cached coordinates).
 * 2. High-accuracy geolocation via getCurrentPosition and continuous watchPosition.
 * 3. Clean up the geolocation watcher on unmount.
 * 4. Reverse-geocode fresh coordinates to display the human-readable pickup address.
 * 5. Distinct handling for permission denied, timeout, unavailable location, and unsupported devices.
 * 6. Never silently fallback to hardcoded coordinates or approximate IP guesses.
 * 7. Provide manual refresh ("Use Current Location") and manual pin/search override support.
 * 8. Re-check on tab visibility if previously denied or errored (user enabled permission in settings).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCurrentLocation,
  watchCurrentLocation,
  reverseGeocode,
  isValidCoordinate,
} from '@/lib/maps/location-service';

export type GpsStatus = 'idle' | 'locating' | 'success' | 'denied' | 'unavailable' | 'timeout' | 'error';

export interface PickupCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ManualPickupPoint {
  latitude: number;
  longitude: number;
  address: string;
}

export interface UsePickupLocationOptions {
  /**
   * Called whenever GPS succeeds/updates and address is resolved.
   * Useful to synchronize state with parent component.
   */
  onPickupResolved?: (coords: PickupCoords, address: string) => void;
  /**
   * If true, skip auto-detection on mount. Default: false.
   */
  skipOnMount?: boolean;
}

export interface UsePickupLocationResult {
  /** Current GPS status */
  status: GpsStatus;
  /** Live user coordinates (from getCurrentPosition & watchPosition) */
  coords: PickupCoords | null;
  /** Reverse-geocoded address string */
  pickupAddress: string | null;
  /** GPS accuracy radius in meters */
  accuracyMeters: number | null;
  /** Human-readable error message */
  errorMessage: string;
  /** Whether user has manually dragged the pin or searched for a custom pickup */
  isManualOverride: boolean;
  /** Re-detect fresh GPS position (e.g. for "Use Current Location" button) */
  refresh: () => Promise<PickupCoords | null>;
  /** Alias for refresh for backward compatibility */
  retry: () => Promise<PickupCoords | null>;
  /** Manually override pickup location (from map drag or search selection) */
  setManualPickup: (point: ManualPickupPoint) => void;
  /** Reset manual override and snap back to live GPS */
  resetToCurrentLocation: () => Promise<PickupCoords | null>;
}

export function usePickupLocation(options: UsePickupLocationOptions = {}): UsePickupLocationResult {
  const { onPickupResolved, skipOnMount = false } = options;

  const [status, setStatus] = useState<GpsStatus>('idle');
  const [coords, setCoords] = useState<PickupCoords | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);

  // Lifecycle & callback refs
  const isMountedRef = useRef(true);
  const unwatchRef = useRef<(() => void) | null>(null);
  const onPickupResolvedRef = useRef(onPickupResolved);
  const isManualOverrideRef = useRef(false);
  const lastResolvedCoordsRef = useRef<PickupCoords | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (unwatchRef.current) {
        unwatchRef.current();
        unwatchRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    onPickupResolvedRef.current = onPickupResolved;
  }, [onPickupResolved]);

  // Teardown active watcher helper
  const stopWatcher = useCallback(() => {
    if (unwatchRef.current) {
      unwatchRef.current();
      unwatchRef.current = null;
    }
  }, []);

  // Helper to reverse geocode and update address
  const resolveAddressForCoords = useCallback(async (c: PickupCoords) => {
    try {
      const address = await reverseGeocode(c.latitude, c.longitude);
      if (!isMountedRef.current) return;
      const finalAddress = address || `Pickup at (${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)})`;
      setPickupAddress(finalAddress);

      if (onPickupResolvedRef.current) {
        onPickupResolvedRef.current(c, finalAddress);
      }
    } catch {
      if (!isMountedRef.current) return;
      const fallback = `Pickup at (${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)})`;
      setPickupAddress(fallback);
      if (onPickupResolvedRef.current) {
        onPickupResolvedRef.current(c, fallback);
      }
    }
  }, []);

  // Start continuous watchPosition to track movement
  const startWatcher = useCallback(() => {
    stopWatcher();
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    unwatchRef.current = watchCurrentLocation(
      (newCoords) => {
        if (!isMountedRef.current) return;
        if (!isValidCoordinate(newCoords.latitude, newCoords.longitude)) return;

        setCoords(newCoords);
        if (newCoords.accuracy != null) {
          setAccuracyMeters(Math.round(newCoords.accuracy));
        }

        // If user has not manually pinned a specific place, keep pickup location synced if moved > 25m
        if (!isManualOverrideRef.current) {
          const prev = lastResolvedCoordsRef.current;
          let hasMovedSignificantly = true;
          if (prev) {
            const latDiff = Math.abs(prev.latitude - newCoords.latitude);
            const lngDiff = Math.abs(prev.longitude - newCoords.longitude);
            // ~0.0002 deg is roughly 22 meters
            if (latDiff < 0.0002 && lngDiff < 0.0002) {
              hasMovedSignificantly = false;
            }
          }

          if (hasMovedSignificantly) {
            lastResolvedCoordsRef.current = newCoords;
            resolveAddressForCoords(newCoords);
          }
        }
      },
      (err) => {
        // Non-fatal background watch error (e.g. temporary satellite loss)
        console.warn('[usePickupLocation] Watcher notice:', err.message);
      }
    );
  }, [stopWatcher, resolveAddressForCoords]);

  // Primary Fresh GPS Acquisition
  const detect = useCallback(async (clearOverride = false): Promise<PickupCoords | null> => {
    if (!isMountedRef.current) return null;

    if (clearOverride) {
      isManualOverrideRef.current = false;
      setIsManualOverride(false);
    }

    setStatus('locating');
    setErrorMessage('');

    try {
      const raw = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0, // CRITICAL: Always fresh GPS, no cache!
      });

      if (!isMountedRef.current) return null;

      if (!isValidCoordinate(raw.latitude, raw.longitude)) {
        throw new Error('Received invalid coordinates from location hardware.');
      }

      setCoords(raw);
      setAccuracyMeters(raw.accuracy != null ? Math.round(raw.accuracy) : null);
      setStatus('success');
      lastResolvedCoordsRef.current = raw;

      // Reverse geocode if not in manual override
      if (!isManualOverrideRef.current) {
        await resolveAddressForCoords(raw);
      }

      // Ensure active watcher is running
      startWatcher();

      return raw;
    } catch (err: unknown) {
      if (!isMountedRef.current) return null;

      const message = err instanceof Error ? err.message : 'Location detection failed.';
      const lower = message.toLowerCase();

      if (lower.includes('denied') || lower.includes('permission')) {
        setStatus('denied');
        setErrorMessage('Location permission was denied. Please allow location access in your browser settings, then click "Use Current Location".');
      } else if (lower.includes('unavailable')) {
        setStatus('unavailable');
        setErrorMessage('Location services are currently unavailable. Please check that GPS/location is enabled on your device.');
      } else if (lower.includes('timeout') || lower.includes('timed out')) {
        setStatus('timeout');
        setErrorMessage('Location request timed out. Please tap "Use Current Location" to try again.');
      } else {
        setStatus('error');
        setErrorMessage(message || 'Unable to detect your location. Please check device settings.');
      }

      return null;
    }
  }, [resolveAddressForCoords, startWatcher]);

  // Manual pickup override handler (e.g. user dragged marker or picked from search)
  const setManualPickup = useCallback((point: ManualPickupPoint) => {
    isManualOverrideRef.current = true;
    setIsManualOverride(true);
    setPickupAddress(point.address);
    // Note: coords holds userLocation GPS; pickup state in parent holds the overridden point
  }, []);

  // Snap back to live GPS
  const resetToCurrentLocation = useCallback(async () => {
    return detect(true);
  }, [detect]);

  // Auto-detect on mount
  useEffect(() => {
    if (!skipOnMount) {
      detect(false);
    }
    return () => {
      stopWatcher();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-check when window/tab regains focus if permission was previously blocked or errored
  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === 'visible' &&
        (status === 'denied' || status === 'unavailable' || status === 'timeout')
      ) {
        detect(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [status, detect]);

  return {
    status,
    coords,
    pickupAddress,
    accuracyMeters,
    errorMessage,
    isManualOverride,
    refresh: resetToCurrentLocation,
    retry: resetToCurrentLocation,
    setManualPickup,
    resetToCurrentLocation,
  };
}
