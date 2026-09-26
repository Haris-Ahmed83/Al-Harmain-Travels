'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { VehicleType, SavedPlace, RecentLocation, LocationPoint, SavedPlaceType, Booking } from '@/types';
import { usePickupLocation } from '@/hooks/usePickupLocation';
import {
  getCurrentLocation,
  reverseGeocode,
  searchPlaces,
  calculateRoute,
  formatDistance,
  formatDuration,
  isSameLocation,
  PlaceSuggestion,
} from '@/lib/maps/location-service';
import { calculateEstimatedFare } from '@/lib/fare-calculator';
import { formatCurrency } from '@/lib/utils';
import {
  MapPin,
  Search,
  Navigation,
  Crosshair,
  Clock,
  Home,
  Briefcase,
  Bookmark,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Car,
  Users,
  Luggage,
  Sparkles,
  ArrowRight,
  ChevronRight,
  X,
  RotateCcw,
  Check,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  UploadCloud,
  FileImage,
  Receipt,
  Building2,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

// Dynamically import BookingMap with SSR disabled (Leaflet requires window)
const BookingMap = dynamic(() => import('@/components/map/BookingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full min-h-[360px] rounded-3xl bg-surface border border-base animate-pulse flex flex-col items-center justify-center text-muted text-sm gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
      <span>Loading Al Harmain Radar Map…</span>
    </div>
  ),
});

export default function CustomerHomePage() {
  const {
    currentUser,
    activeCustomerBooking,
    savedPlaces,
    recentLocations,
    addSavedPlace,
    updateSavedPlace,
    deleteSavedPlace,
    addRecentLocation,
    clearRecentLocations,
    createBooking,
    uploadPaymentScreenshot,
    settings,
  } = useApp();

  // Location & Selection State
  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);

  const {
    status: gpsStatus,
    coords: userLocation,
    pickupAddress: detectedAddress,
    accuracyMeters: gpsAccuracy,
    errorMessage: gpsErrorMsg,
    setManualPickup,
    resetToCurrentLocation,
  } = usePickupLocation({
    onPickupResolved: (coords, address) => {
      setPickup({
        address,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    },
  });

  // Search input & suggestions state
  const [activeSearchField, setActiveSearchField] = useState<'pickup' | 'destination' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Interactive map pinning mode
  const [interactiveMode, setInteractiveMode] = useState<'none' | 'pickup' | 'destination'>('none');

  // Route & Estimation State
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Vehicle Selection State
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('vip_gmc');

  // Next-step / Booking Confirmation Modal State
  const [bookingStep, setBookingStep] = useState<'route' | 'details' | 'summary_payment' | 'submitted'>('route');
  const [confirmedBookingRef, setConfirmedBookingRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Payment Screenshot State
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentPreviewUrl, setPaymentPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Additional Passenger Details
  const [passengerName, setPassengerName] = useState<string>(currentUser.full_name || 'Al Harmain Guest');
  const [passengerPhone, setPassengerPhone] = useState<string>(currentUser.phone || '+966 50 123 4567');
  const [passengerCount, setPassengerCount] = useState<number>(3);
  const [journeyDate, setJourneyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [journeyTime, setJourneyTime] = useState<string>('15:00');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // Saved Places Modal State
  const [isSavedPlacesModalOpen, setIsSavedPlacesModalOpen] = useState<boolean>(false);
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null);
  const [placeName, setPlaceName] = useState<string>('');
  const [placeType, setPlaceType] = useState<SavedPlaceType>('custom');
  const [placeAddress, setPlaceAddress] = useState<string>('');
  const [placeLat, setPlaceLat] = useState<number>(0);
  const [placeLng, setPlaceLng] = useState<number>(0);

  // Vehicle classes
  const vehicleOptions: {
    type: VehicleType;
    name: string;
    model: string;
    capacity: number;
    luggage: number;
    tag?: string;
  }[] = [
    {
      type: 'vip_gmc',
      name: 'VIP GMC Yukon XL',
      model: 'Denali Luxury Chauffeur',
      capacity: 7,
      luggage: 6,
      tag: 'Most Popular',
    },
    {
      type: 'suv',
      name: 'Executive SUV',
      model: 'Ford Explorer / Palisade',
      capacity: 5,
      luggage: 4,
    },
    {
      type: 'sedan',
      name: 'Executive Sedan',
      model: 'Toyota Camry / Lexus Hybrid',
      capacity: 4,
      luggage: 2,
    },
    {
      type: 'van',
      name: 'Royal Pilgrimage Van',
      model: 'Toyota HiAce VIP Lounge',
      capacity: 11,
      luggage: 10,
    },
  ];

  // 1. Explicit manual refresh to current GPS location ("Use Current Location")
  const handleUseCurrentLocation = useCallback(async () => {
    toast.loading('Acquiring fresh GPS position…', { id: 'gps-pickup' });
    try {
      const coords = await resetToCurrentLocation();
      if (coords) {
        toast.success('Pickup set to your current GPS position', { id: 'gps-pickup' });
      } else {
        toast.error(gpsErrorMsg || 'Could not acquire GPS position.', { id: 'gps-pickup' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not acquire GPS position.', { id: 'gps-pickup' });
    }
  }, [resetToCurrentLocation, gpsErrorMsg]);

  // Restore destination from session if previously chosen (never restore stale pickup or userLocation)
  useEffect(() => {
    try {
      const savedDest = sessionStorage.getItem('alharmain_customer_destination');
      if (savedDest) {
        const parsed = JSON.parse(savedDest);
        if (parsed?.latitude && parsed?.longitude && parsed?.address) {
          setDestination(parsed);
        }
      }
    } catch {}
  }, []);

  // 2. Debounced Place Search with user location proximity bias
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(searchQuery, userLocation);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, userLocation]);

  // 3. Route Calculation whenever pickup or destination changes
  useEffect(() => {
    if (!pickup || !destination) {
      setRouteCoords([]);
      setDistanceKm(0);
      setDurationMinutes(0);
      setRouteError(null);
      return;
    }

    // Validate if pickup and destination are identical
    if (isSameLocation(pickup, destination)) {
      setRouteError('Pickup and Destination cannot be the same place. Please choose a different destination.');
      setRouteCoords([]);
      setDistanceKm(0);
      setDurationMinutes(0);
      return;
    }

    let isCurrent = true;
    const fetchRoute = async () => {
      setIsRouting(true);
      setRouteError(null);
      try {
        const route = await calculateRoute(
          { lat: pickup.latitude, lng: pickup.longitude },
          { lat: destination.latitude, lng: destination.longitude }
        );
        if (isCurrent) {
          setDistanceKm(route.distanceKm);
          setDurationMinutes(route.durationMinutes);
          setRouteCoords(route.polylineCoords || []);
        }
      } catch {
        if (isCurrent) {
          setRouteError('Could not calculate driving route. Using straight estimate.');
        }
      } finally {
        if (isCurrent) setIsRouting(false);
      }
    };

    fetchRoute();

    return () => {
      isCurrent = false;
    };
  }, [pickup, destination]);

  // 4. Calculate estimated fare for chosen vehicle
  const fareEstimate = useMemo(() => {
    if (distanceKm <= 0) return null;
    return calculateEstimatedFare(selectedVehicle, distanceKm, durationMinutes);
  }, [selectedVehicle, distanceKm, durationMinutes]);

  // 5. Handle Selection from search or places
  const handleSelectPlace = (place: { address: string; latitude: number; longitude: number; placeId?: string | null }) => {
    if (activeSearchField === 'pickup') {
      const newPickup = {
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId,
      };
      setPickup(newPickup);
      setManualPickup(newPickup);
    } else {
      const newDest = {
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId,
      };
      setDestination(newDest);
      try {
        sessionStorage.setItem('alharmain_customer_destination', JSON.stringify(newDest));
      } catch {}
      // Add destination to customer's recent locations
      addRecentLocation({
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        place_id: place.placeId,
      });
    }
    setActiveSearchField(null);
    setSearchQuery('');
    setSuggestions([]);
  };

  // 6. Handle Marker Adjustments (Drag & Drop)
  const handlePickupAdjust = async (lat: number, lng: number) => {
    try {
      const address = await reverseGeocode(lat, lng);
      const newPickup = { address, latitude: lat, longitude: lng };
      setPickup(newPickup);
      setManualPickup(newPickup);
      toast.success(`Pickup adjusted: ${address}`, { id: 'marker-adjust' });
    } catch {
      const fallback = `Pickup (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      const newPickup = { address: fallback, latitude: lat, longitude: lng };
      setPickup(newPickup);
      setManualPickup(newPickup);
    }
  };

  const handleDestinationAdjust = async (lat: number, lng: number) => {
    try {
      const address = await reverseGeocode(lat, lng);
      const newDest = { address, latitude: lat, longitude: lng };
      setDestination(newDest);
      try {
        sessionStorage.setItem('alharmain_customer_destination', JSON.stringify(newDest));
      } catch {}
      addRecentLocation({ address, latitude: lat, longitude: lng });
      toast.success(`Destination adjusted: ${address}`, { id: 'marker-adjust' });
    } catch {
      const fallback = `Destination (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      const newDest = { address: fallback, latitude: lat, longitude: lng };
      setDestination(newDest);
      try {
        sessionStorage.setItem('alharmain_customer_destination', JSON.stringify(newDest));
      } catch {}
    }
  };

  // 7. Handle Map Click Pick
  const handleMapLocationPick = async (lat: number, lng: number) => {
    const targetMode = interactiveMode !== 'none' ? interactiveMode : (!destination ? 'destination' : 'pickup');
    toast.loading('Resolving address…', { id: 'map-pick' });
    try {
      const address = await reverseGeocode(lat, lng);
      toast.dismiss('map-pick');
      if (targetMode === 'pickup') {
        const newPickup = { address, latitude: lat, longitude: lng };
        setPickup(newPickup);
        setManualPickup(newPickup);
        toast.success(`Pickup set: ${address}`);
      } else {
        const newDest = { address, latitude: lat, longitude: lng };
        setDestination(newDest);
        try {
          sessionStorage.setItem('alharmain_customer_destination', JSON.stringify(newDest));
        } catch {}
        addRecentLocation({ address, latitude: lat, longitude: lng });
        toast.success(`Destination set: ${address}`);
      }
    } catch {
      toast.dismiss('map-pick');
      const fallback = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      if (targetMode === 'pickup') {
        const newPickup = { address: fallback, latitude: lat, longitude: lng };
        setPickup(newPickup);
        setManualPickup(newPickup);
      } else {
        const newDest = { address: fallback, latitude: lat, longitude: lng };
        setDestination(newDest);
        try {
          sessionStorage.setItem('alharmain_customer_destination', JSON.stringify(newDest));
        } catch {}
      }
    } finally {
      setInteractiveMode('none');
    }
  };

  // 8. Swap Pickup & Destination
  const handleSwapLocations = () => {
    if (!pickup && !destination) return;
    const tempPickup = pickup;
    const tempDest = destination;
    setPickup(tempDest);
    setDestination(tempPickup);
    if (tempDest) {
      setManualPickup(tempDest);
    }
    if (tempPickup) {
      try {
        sessionStorage.setItem('alharmain_customer_destination', JSON.stringify(tempPickup));
      } catch {}
    }
    toast.info('Swapped pickup and destination');
  };

  // 8. Payment File Handlers
  const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Receipt screenshot size exceeds 10MB limit.');
      return;
    }

    setPaymentFile(file);
    const preview = URL.createObjectURL(file);
    setPaymentPreviewUrl(preview);
    toast.success('Payment receipt screenshot loaded!');
  };

  const removePaymentFile = () => {
    setPaymentFile(null);
    if (paymentPreviewUrl) {
      URL.revokeObjectURL(paymentPreviewUrl);
      setPaymentPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 9. Advance from Details to Summary & Payment (Step 2 -> Step 3)
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim() || !passengerPhone.trim()) {
      toast.error('Please provide lead passenger name and WhatsApp phone.');
      return;
    }
    setBookingStep('summary_payment');
  };

  // 10. Confirm Booking & Payment Submission (Step 3 -> Step 4)
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !destination) {
      toast.error('Please specify both pickup and destination.');
      return;
    }

    if (isSameLocation(pickup, destination)) {
      toast.error('Pickup and destination cannot be the same location.');
      return;
    }

    if (!paymentFile) {
      toast.error('Payment receipt screenshot is required before booking can be submitted.');
      return;
    }

    setIsSubmitting(true);
    try {
      toast.loading('Uploading payment proof to secure storage…', { id: 'booking-upload' });
      const uploadedScreenshotUrl = await uploadPaymentScreenshot(paymentFile);
      toast.dismiss('booking-upload');

      const booking = await createBooking({
        passenger_name: passengerName.trim(),
        passenger_phone: passengerPhone.trim(),
        booking_type: 'immediate',
        pickup_address: pickup.address,
        pickup_latitude: pickup.latitude,
        pickup_longitude: pickup.longitude,
        destination_address: destination.address,
        destination_latitude: destination.latitude,
        destination_longitude: destination.longitude,
        vehicle_type: selectedVehicle,
        passenger_count: passengerCount,
        notes: `Customer Booking: ${journeyDate} at ${journeyTime}. ${specialInstructions ? `Special requests: ${specialInstructions}` : ''}`,
        scheduled_at: `${journeyDate}T${journeyTime}:00Z`,
        payment_screenshot_url: uploadedScreenshotUrl || undefined,
      });

      setConfirmedBookingRef(booking.booking_reference);
      setBookingStep('submitted');
      toast.success(`Booking ${booking.booking_reference} submitted for payment verification!`);
    } catch {
      toast.dismiss('booking-upload');
      toast.error('Failed to reserve ride. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 9. Saved Places Modal Handlers
  const openAddPlaceModal = (type: SavedPlaceType = 'custom') => {
    setEditingPlace(null);
    setPlaceName(type === 'home' ? 'Home' : type === 'work' ? 'Work' : '');
    setPlaceType(type);
    setPlaceAddress(pickup?.address || '');
    setPlaceLat(pickup?.latitude || (userLocation?.latitude || 21.4225));
    setPlaceLng(pickup?.longitude || (userLocation?.longitude || 39.8262));
    setIsSavedPlacesModalOpen(true);
  };

  const openEditPlaceModal = (place: SavedPlace) => {
    setEditingPlace(place);
    setPlaceName(place.name);
    setPlaceType(place.type);
    setPlaceAddress(place.address);
    setPlaceLat(place.latitude);
    setPlaceLng(place.longitude);
    setIsSavedPlacesModalOpen(true);
  };

  const handleSavePlaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim() || !placeAddress.trim()) {
      toast.error('Please provide a name and address for this place.');
      return;
    }

    if (editingPlace) {
      await updateSavedPlace(editingPlace.id, {
        name: placeName.trim(),
        type: placeType,
        address: placeAddress.trim(),
        latitude: placeLat,
        longitude: placeLng,
      });
    } else {
      await addSavedPlace({
        name: placeName.trim(),
        type: placeType,
        address: placeAddress.trim(),
        latitude: placeLat,
        longitude: placeLng,
      });
    }
    setIsSavedPlacesModalOpen(false);
  };

  // Helper home & work place
  const homePlace = savedPlaces.find((p) => p.type === 'home');
  const workPlace = savedPlaces.find((p) => p.type === 'work');
  const customPlaces = savedPlaces.filter((p) => p.type === 'custom');

  return (
    <div className="page-shell space-y-6 pb-24 sm:pb-8">
      {/* 1. Active Journey Banner (if customer has a live trip in progress) */}
      {activeCustomerBooking && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/80 text-emerald-200 text-xs font-bold border border-emerald-500/40">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ACTIVE JOURNEY: {activeCustomerBooking.status.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="text-white font-semibold text-sm">
                Ref: <span className="text-amber-300 font-mono">{activeCustomerBooking.booking_reference}</span> &bull; {activeCustomerBooking.pickup_address} &rarr; {activeCustomerBooking.destination_address}
              </div>
            </div>
            <Link
              href="/customer/track"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs shadow-md transition-all self-start md:self-center"
            >
              <Navigation className="w-4 h-4" />
              <span>Open Live Tracking Radar</span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Welcome Bar with Quick GPS Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="chip mb-1.5 !bg-emerald-800/40 !text-emerald-300 !border-emerald-600/30">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Al Harmain Ride System
          </span>
          <h1 className="type-section-title text-primary">
            Where would you like to go, <span className="text-amber-500">{currentUser.full_name.split(' ')[0]}</span>?
          </h1>
        </div>

        {/* Current Location Badge / Refresh GPS */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {gpsStatus === 'locating' ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Detecting Location…</span>
            </div>
          ) : gpsStatus === 'success' ? (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              title="Click to refresh current GPS location"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-500" />
              <span>GPS Active</span>
              {gpsAccuracy != null && (
                <span className={`font-bold tabular-nums ${
                  gpsAccuracy <= 30 ? 'text-emerald-500 dark:text-emerald-400' :
                  gpsAccuracy <= 80 ? 'text-amber-500 dark:text-amber-400' : 'text-orange-500'
                }`}>
                  ±{gpsAccuracy}m
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              title={gpsErrorMsg || 'Location detection failed. Click to retry.'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>{gpsStatus === 'denied' ? 'Permission Denied · Retry' : 'Use Current Location'}</span>
            </button>
          )}

          <Link
            href="/customer/bookings"
            className="text-xs font-semibold text-secondary hover:text-primary px-3 py-1.5 rounded-xl border border-base bg-card hover:bg-elevated transition-colors"
          >
            My Trips
          </Link>
        </div>
      </div>

      {/* 3. Main Split Experience: Booking Control Drawer + Interactive Map (Map on top on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Booking Card / Drawer: Order 2 on mobile (under map), Order 1 on desktop (left) */}
        <div className="order-2 lg:order-1 lg:col-span-5 space-y-5">
          {/* Main Booking Panel */}
          <div className="bg-card border border-base rounded-3xl p-6 shadow-xl space-y-5">
            {/* Location Inputs (Pickup & Destination) */}
            <div className="space-y-3 relative">
              {/* Vertical connector line */}
              <div className="absolute left-[18px] top-[38px] bottom-[38px] w-0.5 bg-gradient-to-b from-emerald-500 to-amber-500 z-0" />

              {/* Pickup Location Input */}
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-muted mb-1 px-1">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Pickup Location
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      title="Set pickup to your detected GPS coordinates"
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                      <span>Use Current Location</span>
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={() => setInteractiveMode(interactiveMode === 'pickup' ? 'none' : 'pickup')}
                      className={`text-xs hover:underline flex items-center gap-1 ${
                        interactiveMode === 'pickup' ? 'text-amber-500 font-bold' : 'text-secondary'
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      Map Pin
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold shadow">
                    P
                  </div>
                  <input
                    type="text"
                    readOnly
                    onClick={() => {
                      setActiveSearchField('pickup');
                      setSearchQuery(pickup?.address || '');
                    }}
                    value={pickup?.address || 'Detecting pickup location…'}
                    placeholder="Enter pickup location..."
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-input border border-base text-primary font-medium text-xs sm:text-sm focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm truncate"
                  />
                  {pickup && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSearchField('pickup');
                        setSearchQuery('');
                      }}
                      className="absolute right-3 p-1 rounded-lg text-muted hover:text-primary hover:bg-elevated transition-colors"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Swap Button on center-right */}
              <div className="flex justify-end pr-2 -my-2 relative z-20">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  title="Swap pickup and destination"
                  className="w-7 h-7 rounded-full bg-card hover:bg-elevated border border-base text-secondary hover:text-primary shadow-sm flex items-center justify-center transition-all hover:rotate-180"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Destination Input */}
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-muted mb-1 px-1">
                  <span className="font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Where to? (Destination)
                  </span>
                  <button
                    type="button"
                    onClick={() => setInteractiveMode(interactiveMode === 'destination' ? 'none' : 'destination')}
                    className={`text-[11px] hover:underline flex items-center gap-1 ${
                      interactiveMode === 'destination' ? 'text-amber-500 font-bold' : 'text-secondary'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    Map Pin
                  </button>
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-bold shadow">
                    D
                  </div>
                  <input
                    type="text"
                    readOnly
                    onClick={() => {
                      setActiveSearchField('destination');
                      setSearchQuery(destination?.address || '');
                    }}
                    value={destination?.address || ''}
                    placeholder="Search destination, hotel, airport, or landmark…"
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-input border border-base text-primary font-medium text-xs sm:text-sm focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm truncate placeholder:text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSearchField('destination');
                      setSearchQuery('');
                    }}
                    className="absolute right-3 p-1 rounded-lg text-muted hover:text-primary hover:bg-elevated transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Validation Error Message */}
            {routeError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-fade-up">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{routeError}</span>
              </div>
            )}

            {/* Quick Saved Places & Recent Chips */}
            <div className="space-y-2 pt-2 border-t border-base">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-secondary flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                  Saved Places
                </span>
                <button
                  type="button"
                  onClick={() => openAddPlaceModal('custom')}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Place
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Home Place Chip */}
                {homePlace ? (
                  <button
                    type="button"
                    onClick={() => handleSelectPlace(homePlace)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-elevated border border-base text-primary text-xs font-medium transition-all group"
                  >
                    <Home className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Home</span>
                    <span className="text-[10px] text-muted truncate max-w-[90px]">{homePlace.address.split(',')[0]}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAddPlaceModal('home')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface/50 hover:bg-surface border border-dashed border-base text-muted hover:text-primary text-xs transition-colors"
                  >
                    <Home className="w-3.5 h-3.5 text-muted" />
                    <span>+ Add Home</span>
                  </button>
                )}

                {/* Work Place Chip */}
                {workPlace ? (
                  <button
                    type="button"
                    onClick={() => handleSelectPlace(workPlace)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-elevated border border-base text-primary text-xs font-medium transition-all group"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                    <span>Work</span>
                    <span className="text-[10px] text-muted truncate max-w-[90px]">{workPlace.address.split(',')[0]}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAddPlaceModal('work')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface/50 hover:bg-surface border border-dashed border-base text-muted hover:text-primary text-xs transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-muted" />
                    <span>+ Add Work</span>
                  </button>
                )}

                {/* Custom Saved Places */}
                {customPlaces.slice(0, 2).map((cp) => (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => handleSelectPlace(cp)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-elevated border border-base text-primary text-xs font-medium transition-all"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{cp.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Locations Section */}
            {recentLocations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-base">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold text-secondary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted" />
                    Recent Destinations
                  </span>
                  <button
                    type="button"
                    onClick={clearRecentLocations}
                    className="text-[10px] text-muted hover:text-rose-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <div className="space-y-1">
                  {recentLocations.slice(0, 3).map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => handleSelectPlace(rec)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-surface border border-transparent hover:border-base text-xs flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-muted shrink-0 group-hover:text-amber-500" />
                        <span className="text-primary truncate font-medium">{rec.address}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Trip Estimate Summary Card (shown once route is calculated) */}
            {destination && pickup && distanceKm > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-surface to-elevated border border-base space-y-3 animate-fade-up">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-emerald-500" />
                    Trip Estimate
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Live Road Route
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-card/60 border border-base">
                    <div className="text-muted text-[11px]">Distance</div>
                    <div className="text-base font-bold text-primary mt-0.5">
                      {formatDistance(distanceKm)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-base">
                    <div className="text-muted text-[11px]">Estimated Travel Time</div>
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      ~{formatDuration(durationMinutes)}
                    </div>
                  </div>
                </div>

                {/* Vehicle Class Selector */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-semibold text-muted uppercase">Select Vehicle Class</div>
                  <div className="grid grid-cols-2 gap-2">
                    {vehicleOptions.map((v) => {
                      const fare = calculateEstimatedFare(v.type, distanceKm, durationMinutes);
                      return (
                        <button
                          key={v.type}
                          type="button"
                          onClick={() => setSelectedVehicle(v.type)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            selectedVehicle === v.type
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                              : 'bg-card/70 border-base hover:border-strong'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary text-xs truncate">{v.name.split(' ')[0]}</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {fare.total_fare} {settings.currency}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted flex items-center gap-2 mt-1">
                            <span>{v.capacity} seats</span>
                            <span>&bull;</span>
                            <span>{v.luggage} bags</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Continue Booking CTA Button */}
            <button
              type="button"
              disabled={!pickup || !destination || isSameLocation(pickup, destination) || isRouting}
              onClick={() => setBookingStep('details')}
              className="btn-primary w-full py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2"
            >
              {isRouting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                  <span>Calculating route…</span>
                </>
              ) : (
                <>
                  <span>Continue Booking</span>
                  {fareEstimate && (
                    <span className="font-bold bg-slate-950/20 px-2 py-0.5 rounded-md text-xs">
                      {fareEstimate.total_fare} {settings.currency}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Map: Order 1 on mobile (top), Order 2 on desktop (right) */}
        <div className="order-1 lg:order-2 lg:col-span-7 h-[300px] sm:h-[380px] lg:h-[620px] relative lg:sticky lg:top-20 rounded-3xl overflow-hidden shadow-2xl border border-base">
          <BookingMap
            pickup={pickup}
            destination={destination}
            userLocation={userLocation}
            routeCoords={routeCoords}
            distanceKm={distanceKm}
            durationMinutes={durationMinutes}
            interactiveMode={interactiveMode}
            onLocationPick={handleMapLocationPick}
            onPickupAdjust={handlePickupAdjust}
            onDestinationAdjust={handleDestinationAdjust}
            onRecenterClick={handleUseCurrentLocation}
            className="h-full w-full rounded-3xl"
          />
        </div>
      </div>

      {/* 4. Full-featured Address Search Modal / Tray */}
      {activeSearchField && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24 animate-fade-up">
          <div className="bg-card border border-base rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header / Input */}
            <div className="p-4 sm:p-5 border-b border-base flex items-center gap-3">
              <Search className="w-5 h-5 text-emerald-500 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeSearchField === 'pickup'
                    ? 'Search pickup address, hotel, or landmark…'
                    : 'Search destination, airport, market, or city…'
                }
                className="w-full bg-transparent text-primary text-sm sm:text-base placeholder:text-muted focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full hover:bg-elevated text-muted hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveSearchField(null);
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-xl bg-elevated hover:bg-surface text-secondary text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            {/* Content Suggestions */}
            <div className="overflow-y-auto p-3 space-y-1 divide-y divide-base">
              {isSearching && (
                <div className="py-8 text-center text-muted text-xs flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                  <span>Searching locations across Saudi Arabia &amp; region…</span>
                </div>
              )}

              {/* Current GPS Location Option */}
              {activeSearchField === 'pickup' && !searchQuery && (
                <button
                  type="button"
                  onClick={async () => {
                    setActiveSearchField(null);
                    setSearchQuery('');
                    await handleUseCurrentLocation();
                  }}
                  className="w-full text-left p-3 rounded-2xl hover:bg-surface border border-transparent hover:border-base flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Crosshair className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-primary text-xs sm:text-sm flex items-center gap-1.5">
                      <span>Use Current Location</span>
                      {gpsAccuracy != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                          ±{gpsAccuracy}m
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted truncate">
                      {detectedAddress || 'Detecting your GPS location…'}
                    </div>
                  </div>
                </button>
              )}

              {/* Saved Places list in Search */}
              {!searchQuery && savedPlaces.length > 0 && (
                <div className="py-2">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-3 mb-1">
                    Saved Places
                  </div>
                  {savedPlaces.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => handleSelectPlace(sp)}
                      className="w-full text-left p-3 rounded-2xl hover:bg-surface flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        {sp.type === 'home' ? <Home className="w-4 h-4" /> : sp.type === 'work' ? <Briefcase className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-primary text-xs">{sp.name}</div>
                        <div className="text-[11px] text-muted truncate">{sp.address}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Suggestions */}
              {suggestions.map((item) => (
                <button
                  key={item.placeId}
                  type="button"
                  onClick={() => handleSelectPlace(item)}
                  className="w-full text-left p-3 rounded-2xl hover:bg-surface flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-primary text-xs sm:text-sm truncate">{item.title}</div>
                    <div className="text-[11px] text-muted truncate">{item.subtitle || item.address}</div>
                  </div>
                </button>
              ))}

              {searchQuery && !isSearching && suggestions.length === 0 && (
                <div className="py-8 text-center text-muted text-xs">
                  No exact matches found. Try checking the spelling or use the map pin.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Step 2: Passenger Details & Scheduling Modal */}
      {bookingStep === 'details' && pickup && destination && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-up">
          <div className="bg-card border border-base rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="chip !bg-emerald-800/40 !text-emerald-300">Step 2 of 3</span>
                <h3 className="type-card-title text-xl mt-1">Passenger &amp; Schedule Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setBookingStep('route')}
                className="p-1 rounded-xl text-muted hover:text-primary hover:bg-elevated"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Route Overview */}
            <div className="p-4 rounded-2xl bg-surface border border-base space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span className="text-secondary">Pickup: <strong className="text-primary">{pickup.address}</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                <span className="text-secondary">Destination: <strong className="text-amber-500">{destination.address}</strong></span>
              </div>
              <div className="pt-2 border-t border-base flex items-center justify-between text-muted text-[11px]">
                <span>Distance: {formatDistance(distanceKm)}</span>
                <span>Travel Time: ~{formatDuration(durationMinutes)}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {fareEstimate ? `${fareEstimate.total_fare} ${settings.currency}` : ''}
                </span>
              </div>
            </div>

            {/* Passenger & Schedule Form */}
            <form onSubmit={handleDetailsSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="type-label">Lead Passenger Name *</label>
                  <input
                    type="text"
                    required
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="type-label">Passenger Phone (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    placeholder="+966 5x xxx xxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="type-label">Date</label>
                  <input
                    type="date"
                    required
                    value={journeyDate}
                    onChange={(e) => setJourneyDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="type-label">Time</label>
                  <input
                    type="time"
                    required
                    value={journeyTime}
                    onChange={(e) => setJourneyTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="type-label">Passengers</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs text-center font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="type-label">Flight Details or Special Requests</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Flight SV-124, baby seat required, extra luggage assistance."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-input border border-base text-primary placeholder:text-muted text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                <span>Vehicle: <strong>{selectedVehicle.toUpperCase().replace('_', ' ')}</strong></span>
                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  Total Fare: {fareEstimate?.total_fare} {settings.currency}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingStep('route')}
                  className="btn-secondary flex-1 py-3 text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-[2] py-3 text-xs flex items-center justify-center gap-2 font-bold"
                >
                  <span>Proceed to Payment Proof</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Step 3: Booking Summary & Payment Proof Upload Modal */}
      {bookingStep === 'summary_payment' && pickup && destination && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-up">
          <div className="bg-card border border-base rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div>
                <span className="chip !bg-gold-500/20 !text-amber-400">Final Step 3 of 3</span>
                <h3 className="type-card-title text-xl mt-1">Booking Summary &amp; Payment Proof</h3>
              </div>
              <button
                type="button"
                onClick={() => setBookingStep('details')}
                className="p-1.5 rounded-xl text-muted hover:text-primary hover:bg-elevated"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trip Summary Card */}
            <div className="rounded-2xl bg-surface/80 border border-base p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-muted text-[11px] border-b border-base/60 pb-2">
                <span className="font-semibold text-secondary uppercase tracking-wider">Journey Summary</span>
                <span>{journeyDate} at {journeyTime}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 shadow-sm" />
                  <div>
                    <span className="text-muted text-[10px] uppercase font-bold">Pickup</span>
                    <p className="font-semibold text-primary">{pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0 shadow-sm" />
                  <div>
                    <span className="text-muted text-[10px] uppercase font-bold">Destination</span>
                    <p className="font-semibold text-amber-500">{destination.address}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-base/60 text-[11px]">
                <div>
                  <span className="text-muted block text-[10px]">Passenger</span>
                  <span className="font-semibold text-primary truncate block">{passengerName}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">WhatsApp</span>
                  <span className="font-semibold text-primary">{passengerPhone}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">Vehicle</span>
                  <span className="font-semibold text-primary uppercase">{selectedVehicle.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">Passengers</span>
                  <span className="font-semibold text-primary">{passengerCount} Pax</span>
                </div>
              </div>

              {specialInstructions && (
                <div className="pt-2 border-t border-base/60 text-[11px]">
                  <span className="text-muted">Special Requests: </span>
                  <span className="text-secondary italic">{specialInstructions}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-base font-bold text-sm bg-emerald-500/10 p-3 rounded-xl">
                <span className="text-secondary text-xs">Total Fare Due:</span>
                <span className="text-emerald-500 text-base font-black">
                  {fareEstimate?.total_fare} {settings.currency}
                </span>
              </div>
            </div>

            {/* Official Transfer Instructions */}
            <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-500 font-bold">
                <Building2 className="w-4 h-4" />
                <span>Bank Transfer / Payment Instructions</span>
              </div>
              <p className="text-[11px] text-secondary">
                Please transfer the trip fare of <strong>{fareEstimate?.total_fare} {settings.currency}</strong> to complete your request.
              </p>
              <div className="bg-card p-3 rounded-xl border border-base font-mono text-xs space-y-1">
                <div className="flex justify-between text-secondary">
                  <span>Bank Name:</span>
                  <strong className="text-primary">Al Rajhi Bank / SNB</strong>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>Account Name:</span>
                  <strong className="text-primary">Al Harmain VIP Transport</strong>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>Corporate IBAN:</span>
                  <strong className="text-amber-500 select-all">SA44 8000 0456 6080 1012 3456</strong>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>STC Pay / Urpay:</span>
                  <strong className="text-emerald-500 select-all">+966 54 888 1234</strong>
                </div>
              </div>
              <p className="text-[10px] text-muted italic">
                * Note: Your booking will be placed in &quot;Pending Verification&quot; until our operations desk confirms receipt.
              </p>
            </div>

            {/* Payment Proof File Uploader */}
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    Upload Payment Screenshot / Transfer Receipt *
                  </span>
                  <span className="text-[10px] text-muted">Required</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handlePaymentFileChange}
                  className="hidden"
                  id="payment-receipt-upload"
                />

                {!paymentPreviewUrl ? (
                  <label
                    htmlFor="payment-receipt-upload"
                    className="cursor-pointer border-2 border-dashed border-base hover:border-emerald-500/60 rounded-2xl p-6 bg-surface/50 hover:bg-surface flex flex-col items-center justify-center text-center gap-2 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-primary group-hover:text-emerald-400 transition-colors">
                        Click or Drag &amp; Drop Transfer Screenshot
                      </span>
                      <p className="text-[11px] text-muted mt-0.5">
                        PNG, JPG, or WebP (up to 10MB)
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="relative rounded-2xl bg-surface border border-emerald-500/40 p-3 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-semibold text-primary truncate max-w-[80%]">
                        <FileImage className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{paymentFile?.name || 'Payment Receipt'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removePaymentFile}
                        className="text-[11px] text-rose-500 hover:text-rose-400 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="relative rounded-xl overflow-hidden max-h-48 border border-base bg-slate-950 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={paymentPreviewUrl}
                        alt="Payment Screenshot Preview"
                        className="max-h-48 object-contain w-full rounded-xl"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <span>Size: {paymentFile ? (paymentFile.size / 1024).toFixed(1) + ' KB' : ''}</span>
                      <label
                        htmlFor="payment-receipt-upload"
                        className="cursor-pointer text-emerald-500 hover:underline font-semibold"
                      >
                        Replace Image
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingStep('details')}
                  className="btn-secondary flex-1 py-3 text-xs"
                >
                  Back to Details
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !paymentFile}
                  className="btn-primary flex-[2] py-3 text-xs flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                      <span>Submitting Booking &amp; Proof…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Booking Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Step 4: Booking Submitted Success Modal */}
      {bookingStep === 'submitted' && confirmedBookingRef && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-card border border-emerald-500/40 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border-2 border-emerald-500/30 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="type-card-title text-xl">Booking Request Received!</h3>
              <p className="text-xs text-secondary">
                Your reservation and payment receipt have been saved to Supabase.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-base space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Booking Reference:</span>
                <span className="font-mono text-base font-black text-amber-500">{confirmedBookingRef}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] uppercase font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  Pending Verification
                </span>
              </div>
              <p className="text-[11px] text-muted pt-1 border-t border-base/60 leading-relaxed">
                Our central dispatch team will review your payment screenshot. Upon verification, the booking is confirmed and a captain will be assigned.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/customer/bookings"
                className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 font-bold"
              >
                <Clock className="w-4 h-4" />
                <span>View Booking in My Rides</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setBookingStep('route');
                  setConfirmedBookingRef(null);
                  setPaymentFile(null);
                  setPaymentPreviewUrl(null);
                }}
                className="text-xs text-muted hover:text-primary py-2"
              >
                + Book Another Journey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Manage Saved Places Modal */}
      {isSavedPlacesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-card border border-base rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="type-card-title text-lg">
                {editingPlace ? 'Edit Saved Place' : 'Save a New Place'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSavedPlacesModalOpen(false)}
                className="p-1 rounded-xl text-muted hover:text-primary hover:bg-elevated"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlaceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="type-label">Place Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['home', 'work', 'custom'] as SavedPlaceType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setPlaceType(t);
                        if (t === 'home') setPlaceName('Home');
                        else if (t === 'work') setPlaceName('Work');
                      }}
                      className={`py-2 px-3 rounded-xl border font-semibold capitalize text-xs flex items-center justify-center gap-1.5 ${
                        placeType === t
                          ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'bg-surface border-base text-secondary'
                      }`}
                    >
                      {t === 'home' ? <Home className="w-3.5 h-3.5" /> : t === 'work' ? <Briefcase className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="type-label">Label Name *</label>
                <input
                  type="text"
                  required
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="e.g. Home, Work, Aunt's House, Hotel"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="type-label">Full Address *</label>
                <input
                  type="text"
                  required
                  value={placeAddress}
                  onChange={(e) => setPlaceAddress(e.target.value)}
                  placeholder="Street, City, Landmark"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (userLocation) {
                      setPlaceLat(userLocation.latitude);
                      setPlaceLng(userLocation.longitude);
                      try {
                        const addr = await reverseGeocode(userLocation.latitude, userLocation.longitude);
                        if (addr) setPlaceAddress(addr);
                      } catch {}
                      toast.success('Filled with current GPS location');
                    } else {
                      await handleUseCurrentLocation();
                    }
                  }}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Use Current Location
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-base">
                {editingPlace && (
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteSavedPlace(editingPlace.id);
                      setIsSavedPlacesModalOpen(false);
                    }}
                    className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete place"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsSavedPlacesModalOpen(false)}
                    className="btn-secondary py-2.5 px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary py-2.5 px-5 text-xs"
                  >
                    Save Place
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
