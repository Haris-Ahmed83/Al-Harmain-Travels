'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { DriverStatus, AdditionalChargeType, Booking } from '@/types';
import {
  Car,
  Navigation,
  CheckCircle2,
  Phone,
  PlusCircle,
  Clock,
  Compass,
  MapPin,
  Bell,
  ShieldCheck,
  User,
  Calendar,
  Lock,
  ArrowRight,
  AlertCircle,
  Layers,
  ExternalLink,
  Trophy,
  Star,
  Wallet,
  CalendarCheck,
  Sparkles,
  Radio,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  categorizeDriverAssignments,
  getWorkflowStep,
} from '@/lib/assignment-utils';

const LiveMap = dynamic(() => import('@/components/map/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-2xl bg-surface animate-pulse flex items-center justify-center text-muted text-xs">
      Loading Driver Cockpit Navigation...
    </div>
  ),
});

type AssignmentTab = 'today' | 'tomorrow' | 'upcoming' | 'completed';

export default function DriverCockpitPage() {
  const {
    currentUser,
    userRole,
    drivers,
    bookings,
    updateDriverStatus,
    updateDriverLocation,
    driverAcceptBooking,
    driverRejectBooking,
    driverUpdateRideStatus,
    addAdditionalCharge,
    settings,
    isDataLoading,
  } = useApp();

  // Active driver selection
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    currentUser.role === 'driver' ? currentUser.id : ''
  );

  const currentDriver =
    drivers.find((d) => d.id === currentUser.id || d.profile?.id === currentUser.id) ||
    (selectedDriverId ? drivers.find((d) => d.id === selectedDriverId) : undefined) ||
    (userRole === 'admin' ? drivers[0] : undefined);

  // Tab State
  const [activeTab, setActiveTab] = useState<AssignmentTab>('today');

  // Categorize assignments chronologically and enforce single-active-assignment rule
  const {
    today: todayAssignments,
    tomorrow: tomorrowAssignments,
    upcoming: upcomingAssignments,
    completed: completedAssignments,
    activeAssignment,
    actionableAssignmentId,
  } = useMemo(() => {
    if (!currentDriver?.id) {
      return {
        today: [],
        tomorrow: [],
        upcoming: [],
        completed: [],
        activeAssignment: null,
        actionableAssignmentId: null,
      };
    }
    return categorizeDriverAssignments(currentDriver.id, bookings);
  }, [currentDriver?.id, bookings]);

  // Decline assignment modal state
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [bookingToDecline, setBookingToDecline] = useState<Booking | null>(null);
  const [declineReason, setDeclineReason] = useState('Vehicle maintenance required');

  // Additional charge modal
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [chargeType, setChargeType] = useState<AdditionalChargeType>('toll');
  const [chargeAmount, setChargeAmount] = useState<number>(25);
  const [chargeDesc, setChargeDesc] = useState<string>('Airport Express Toll');

  // Browser Geolocation watching
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [heading, setHeading] = useState<number>(currentDriver?.location?.heading || 0);
  const [driverPos, setDriverPos] = useState({
    lat: currentDriver?.location?.latitude || 21.685,
    lng: currentDriver?.location?.longitude || 39.157,
  });
  const isTracking = gpsActive;

  // Continuously stream driver GPS position while active
  useEffect(() => {
    let watchId: number | null = null;

    if (gpsActive && currentDriver && typeof window !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading: gpsHeading, speed } = pos.coords;
          setDriverPos({ lat: latitude, lng: longitude });
          if (gpsHeading !== null && !isNaN(gpsHeading)) {
            setHeading(gpsHeading);
          }
          updateDriverLocation(
            currentDriver.id,
            latitude,
            longitude,
            gpsHeading || 0,
            speed || 0
          );
        },
        (err) => {
          console.warn('Driver GPS watcher error:', err.message);
          if (err.code === 1) {
            toast.error('Location permission was denied. Please enable GPS permissions in your browser.');
            setGpsActive(false);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [gpsActive, currentDriver?.id, updateDriverLocation]);

  // Automatically deactivate GPS when there is no active in-progress ride
  useEffect(() => {
    if (!activeAssignment && gpsActive) {
      setGpsActive(false);
    }
  }, [activeAssignment, gpsActive]);

  if (isDataLoading) {
    return (
      <div className="page-shell space-y-6 animate-pulse">
        <div className="p-6 rounded-3xl bg-card border border-base h-28" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-card border border-base h-32" />
          <div className="p-6 rounded-3xl bg-card border border-base h-32" />
          <div className="p-6 rounded-3xl bg-card border border-base h-32" />
          <div className="p-6 rounded-3xl bg-card border border-base h-32" />
        </div>
        <div className="p-6 rounded-3xl bg-card border border-base h-80" />
      </div>
    );
  }

  if (!currentDriver) {
    return (
      <div className="page-shell py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg">
          <Car className="w-8 h-8" />
        </div>
        <h2 className="type-page-title">Chauffeur Profile Pending Provisioning</h2>
        <p className="text-sm text-secondary max-w-md mx-auto">
          Your driver account is registered, but your vehicle and chauffeur credentials are being configured by central operations.
        </p>
      </div>
    );
  }

  const toggleGps = () => {
    if (!gpsActive) {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, heading: gpsHeading, speed } = pos.coords;
            setDriverPos({ lat: latitude, lng: longitude });
            if (gpsHeading !== null && !isNaN(gpsHeading)) {
              setHeading(gpsHeading);
            }
            if (currentDriver) {
              updateDriverLocation(currentDriver.id, latitude, longitude, gpsHeading || 0, speed || 0);
            }
            setGpsActive(true);
            toast.success('Live GPS Sharing Activated! Broadcasting telemetry to dispatch & passenger.');
          },
          (err) => {
            toast.error(`Unable to retrieve GPS: ${err.message}. Please allow location access.`);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        toast.error('Browser Geolocation is not supported on this device.');
      }
    } else {
      setGpsActive(false);
      toast.info('GPS Tracking Session Paused.');
    }
  };

  const handleStartDriving = async (bookingId: string) => {
    await driverUpdateRideStatus(bookingId, 'driver_arriving');
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, heading: gpsHeading, speed } = pos.coords;
          setDriverPos({ lat: latitude, lng: longitude });
          if (gpsHeading !== null && !isNaN(gpsHeading)) {
            setHeading(gpsHeading);
          }
          if (currentDriver) {
            updateDriverLocation(currentDriver.id, latitude, longitude, gpsHeading || 0, speed || 0);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
      setGpsActive(true);
    }
  };

  const handleCompleteTrip = async (bookingId: string) => {
    await driverUpdateRideStatus(bookingId, 'trip_completed');
    setGpsActive(false);
  };

  const handleStatusChange = (status: DriverStatus) => {
    updateDriverStatus(currentDriver.id, status);
    toast.success(`Chauffeur status set to: ${status.toUpperCase().replace('_', ' ')}`);
  };

  const handleAcceptRide = async (bookingId: string) => {
    await driverAcceptBooking(bookingId);
  };

  const handleOpenDeclineModal = (booking: Booking) => {
    setBookingToDecline(booking);
    setDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!bookingToDecline) return;
    await driverRejectBooking(bookingToDecline.id, declineReason);
    setDeclineModalOpen(false);
    setBookingToDecline(null);
  };

  const handleAddCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;
    addAdditionalCharge(activeAssignment.id, {
      charge_type: chargeType,
      amount: chargeAmount,
      description: chargeDesc,
    });
    setChargeModalOpen(false);
    toast.success(`Charge of ${chargeAmount} ${settings.currency} added.`);
  };

  // Helper formatting functions
  const formatPickupClock = (isoString?: string | null) => {
    if (!isoString) return 'ASAP (Immediate)';
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  };

  const formatPickupFull = (isoString?: string | null) => {
    if (!isoString) return 'Immediate On-Demand';
    return formatDateTime(isoString);
  };

  // 6-step workflow definition
  const WORKFLOW_STEPS = [
    { num: 1, key: 'assigned', label: 'Assigned' },
    { num: 2, key: 'accepted', label: 'Accepted' },
    { num: 3, key: 'on_the_way', label: 'En Route' },
    { num: 4, key: 'arrived', label: 'At Pickup' },
    { num: 5, key: 'started', label: 'In Progress' },
    { num: 6, key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="page-shell space-y-6 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. EXECUTIVE CHAUFFEUR COCKPIT HERO HEADER
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-base p-6 sm:p-7 rounded-3xl shadow-xl transition-all relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Chauffeur identity */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-emerald-500/15 text-emerald-400 font-bold flex items-center justify-center text-2xl sm:text-3xl border-2 border-emerald-500/40 shadow-lg shadow-emerald-950/20">
                {currentDriver.profile?.full_name?.charAt(0) || currentDriver.full_name?.charAt(0) || 'C'}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card ring-2 ring-card shadow ${
                  currentDriver.status === 'available'
                    ? 'bg-emerald-500'
                    : currentDriver.status === 'on_trip'
                    ? 'bg-purple-500'
                    : currentDriver.status === 'assigned'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                title={`Status: ${currentDriver.status}`}
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> VIP Executive Chauffeur
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 px-2.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-700/50 shadow-sm">
                  {currentDriver.vehicle?.plate_number || currentDriver.assigned_vehicle?.plate_number || 'VIP KSA 7788'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
                {currentDriver.profile?.full_name || currentDriver.full_name || 'Captain Tariq'}
              </h1>
              <p className="text-xs text-secondary flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  {currentDriver.vehicle?.make || currentDriver.assigned_vehicle?.make || 'GMC'}{' '}
                  {currentDriver.vehicle?.model || currentDriver.assigned_vehicle?.model || 'Yukon XL'}
                </span>
                <span>&bull;</span>
                <a
                  href={`tel:${currentDriver.phone || '+966501234567'}`}
                  className="hover:text-emerald-500 transition-colors underline-offset-2 hover:underline"
                >
                  {currentDriver.phone || '+966 50 123 4567'}
                </a>
              </p>
            </div>
          </div>

          {/* Quick Chauffeur Controls: Switcher, GPS share, & Duty status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Driver switcher (useful for multi-driver fleet management) */}
            {drivers.length > 1 && (
              <div className="flex items-center gap-2 bg-surface px-3 py-2 rounded-xl border border-base shadow-sm">
                <User className="w-3.5 h-3.5 text-muted shrink-0" />
                <span className="text-[11px] font-semibold text-secondary hidden sm:inline">Chauffeur:</span>
                <select
                  value={currentDriver.id}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="bg-transparent text-xs text-primary font-bold focus:outline-none cursor-pointer pr-1"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id} className="bg-card text-primary">
                      {d.profile?.full_name || d.full_name || 'Captain'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* GPS Toggle */}
            <button
              onClick={toggleGps}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-sm ${
                gpsActive
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/30 animate-pulse'
                  : 'bg-surface border-base text-secondary hover:text-primary hover:border-emerald-500/40'
              }`}
            >
              <Compass className={`w-4 h-4 ${gpsActive ? 'text-emerald-500' : 'text-muted'}`} />
              <span>{gpsActive ? 'GPS Sharing: ON' : 'Start GPS Share'}</span>
            </button>

            {/* Duty status segment buttons */}
            <div className="flex items-center bg-surface p-1 rounded-xl border border-base shadow-inner">
              {(['available', 'on_break', 'offline'] as DriverStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    currentDriver.status === st
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PERFORMANCE KPI METRICS BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completed Trips */}
        <div className="bg-card border border-base p-5 rounded-3xl shadow-sm hover:border-emerald-500/30 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted">
              Completed Trips
            </span>
            <div className="text-2xl font-extrabold text-primary">
              {completedAssignments.length > 0 ? completedAssignments.length : currentDriver.total_rides}
            </div>
            <span className="text-[11px] text-secondary block">Verified VIP missions</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* Rating */}
        <div className="bg-card border border-base p-5 rounded-3xl shadow-sm hover:border-amber-500/30 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted">
              Chauffeur Rating
            </span>
            <div className="text-2xl font-extrabold text-amber-500 flex items-center gap-1">
              <span>★ {currentDriver.rating || 5.0}</span>
            </div>
            <span className="text-[11px] text-secondary block">5.0 Customer Standard</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-card border border-base p-5 rounded-3xl shadow-sm hover:border-emerald-500/30 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted">
              Total Earnings
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              {formatCurrency(currentDriver.total_earnings, settings.currency)}
            </div>
            <span className="text-[11px] text-secondary block">Paid &amp; confirmed fares</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Roster Workload */}
        <div className="bg-card border border-base p-5 rounded-3xl shadow-sm hover:border-sky-500/30 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-muted">
              Mission Status
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2">
              {activeAssignment ? (
                <span className="text-emerald-500 flex items-center gap-1.5 text-base sm:text-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  1 Active Mission
                </span>
              ) : (
                <span>
                  {todayAssignments.length + tomorrowAssignments.length + upcomingAssignments.length} Scheduled
                </span>
              )}
            </div>
            <span className="text-[11px] text-secondary block">
              {activeAssignment ? 'Currently en route' : 'Standing by for next assignment'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ACTIVE VIP MISSION CONTROLLER (If an assignment is active)
      ───────────────────────────────────────────────────────────── */}
      {activeAssignment && (
        <div className="bg-gradient-to-br from-emerald-950/20 via-card to-card border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/30 pb-4">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Current VIP Mission In Progress &bull; Single-Active Rule Enforced
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-primary">
                Ref #{activeAssignment.booking_reference} &bull; {activeAssignment.passenger_name}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/50 uppercase tracking-wider">
                {getWorkflowStep(activeAssignment.status).label}
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-surface px-3 py-1 rounded-xl border border-base shadow-sm">
                {formatCurrency(activeAssignment.final_fare || activeAssignment.estimated_fare, settings.currency)}
              </span>
            </div>
          </div>

          {/* 6-STAGE ASSIGNMENT WORKFLOW TRACKER */}
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-base space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Mission Progress Stepper
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                Step {getWorkflowStep(activeAssignment.status).step} of 6
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {WORKFLOW_STEPS.map((step) => {
                const currentStepNum = getWorkflowStep(activeAssignment.status).step;
                const isPassed = step.num < currentStepNum;
                const isCurrent = step.num === currentStepNum;

                return (
                  <div
                    key={step.num}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isCurrent
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500/50'
                        : isPassed
                        ? 'bg-surface border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'bg-card/40 border-base text-muted opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-[11px]">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="font-mono font-bold">0{step.num}</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold leading-tight">{step.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Route, Passenger Details & Live Cockpit Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Route Details & Action utilities */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-base space-y-3 text-xs shadow-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">
                      Pickup Address
                    </span>
                    <span className="font-semibold text-primary text-sm leading-snug block">
                      {activeAssignment.pickup_address}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-3 border-t border-base">
                  <Navigation className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">
                      Destination Dropoff
                    </span>
                    <span className="font-semibold text-primary text-sm leading-snug block">
                      {activeAssignment.destination_address}
                    </span>
                  </div>
                </div>
              </div>

              {activeAssignment.notes && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200">
                  <strong className="font-bold">Passenger Notes:</strong> {activeAssignment.notes}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${activeAssignment.pickup_latitude},${activeAssignment.pickup_longitude}&destination=${activeAssignment.destination_latitude},${activeAssignment.destination_longitude}&travelmode=driving`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-surface hover:bg-elevated text-primary text-xs font-bold flex items-center gap-2 border border-base shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4 text-emerald-500" /> Google Maps Navigation
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>

                {activeAssignment.passenger_phone && (
                  <a
                    href={`tel:${activeAssignment.passenger_phone}`}
                    className="py-2.5 px-4 rounded-xl bg-surface hover:bg-elevated text-primary text-xs font-bold flex items-center gap-2 border border-base shadow-sm transition-all"
                  >
                    <Phone className="w-4 h-4 text-amber-500" /> Call Passenger
                  </a>
                )}

                <button
                  onClick={() => setChargeModalOpen(true)}
                  className="py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2 border border-amber-500/30 transition-all"
                >
                  <PlusCircle className="w-4 h-4" /> Add Toll / Parking Fee
                </button>
              </div>
            </div>

            {/* Embedded Live Cockpit Map */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-emerald-500/40 shadow-xl">
                <LiveMap
                  center={[driverPos.lat, driverPos.lng]}
                  zoom={12}
                  markers={[
                    {
                      lat: driverPos.lat,
                      lng: driverPos.lng,
                      label: 'Your Vehicle',
                      type: 'driver',
                      subText: currentDriver.vehicle?.plate_number || 'VIP Chauffeur',
                      heading: heading || 0,
                    },
                    {
                      lat: activeAssignment.pickup_latitude,
                      lng: activeAssignment.pickup_longitude,
                      label: 'Pickup',
                      type: 'pickup',
                      subText: activeAssignment.pickup_address,
                    },
                    {
                      lat: activeAssignment.destination_latitude,
                      lng: activeAssignment.destination_longitude,
                      label: 'Destination',
                      type: 'destination',
                      subText: activeAssignment.destination_address,
                    },
                  ]}
                  showRoute={true}
                  className="h-72 sm:h-80 w-full"
                />
              </div>
            </div>
          </div>

          {/* Sequential Step-by-Step Status Controls */}
          <div className="border-t border-base pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-secondary">
              Total Booking Fare:{' '}
              <strong className="text-amber-500 dark:text-amber-400 text-base font-bold font-mono">
                {formatCurrency(activeAssignment.final_fare || activeAssignment.estimated_fare, settings.currency)}
              </strong>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Step 2: Accepted -> Start driving to pickup */}
              {(activeAssignment.status === 'accepted' || activeAssignment.status === 'driver_accepted') && (
                <button
                  onClick={() => handleStartDriving(activeAssignment.id)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <Navigation className="w-4 h-4" /> Start Heading to Pickup (Broadcast Live GPS) &rarr;
                </button>
              )}

              {/* Step 3: Heading to pickup -> Arrived at pickup */}
              {(activeAssignment.status === 'on_the_way' || activeAssignment.status === 'driver_arriving') && (
                <button
                  onClick={() => driverUpdateRideStatus(activeAssignment.id, 'driver_arrived')}
                  className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-cyan-950/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <MapPin className="w-4 h-4" /> Mark Arrived at Pickup
                </button>
              )}

              {/* Step 4: Arrived -> Passenger boarded & Trip Started */}
              {(activeAssignment.status === 'arrived' || activeAssignment.status === 'driver_arrived') && (
                <button
                  onClick={() => driverUpdateRideStatus(activeAssignment.id, 'trip_started')}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-950/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <Car className="w-4 h-4" /> Passenger Boarded &bull; Start Trip
                </button>
              )}

              {/* Step 5: Started -> Completed */}
              {(activeAssignment.status === 'started' ||
                activeAssignment.status === 'trip_started' ||
                activeAssignment.status === 'ride_started') && (
                <button
                  onClick={() => handleCompleteTrip(activeAssignment.id)}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete Trip Successfully (End GPS)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3.5 CHAUFFEUR RADAR & LIVE TELEMETRY COCKPIT MAP (STANDBY)
      ───────────────────────────────────────────────────────────── */}
      {!activeAssignment && (
        <div className="bg-card border border-base rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
                  Live Chauffeur Radar & GPS Telemetry
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
                Chauffeur Positioning & Territory Radar
              </h2>
              <p className="text-xs text-secondary">
                Real-time satellite positioning broadcasting your vehicle coordinates to Al Harmain Central Dispatch.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="bg-surface px-3 py-1.5 rounded-xl border border-base text-xs font-mono text-secondary flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span className="text-primary font-bold">{driverPos.lat.toFixed(4)}° N, {driverPos.lng.toFixed(4)}° E</span>
              </div>
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {isTracking ? 'Broadcasting 5G' : 'GPS Offline'}
              </span>
            </div>
          </div>

          {/* Interactive Map Component */}
          <div className="rounded-2xl overflow-hidden border border-base shadow-lg">
            <LiveMap
              center={[driverPos.lat, driverPos.lng]}
              zoom={13}
              markers={[
                {
                  lat: driverPos.lat,
                  lng: driverPos.lng,
                  label: currentDriver?.profile?.full_name || currentDriver?.full_name || 'Captain Chauffeur',
                  type: 'driver',
                  subText: `${currentDriver?.vehicle?.plate_number || 'VIP KSA 7788'} • Active Chauffeur`,
                  heading: heading || 0,
                },
              ]}
              showRoute={false}
              className="h-80 sm:h-96 w-full"
            />
          </div>

          {/* Quick Hub Territory Presets */}
          <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-secondary pt-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">Territory Presets:</span>
              <button
                type="button"
                onClick={() => setDriverPos({ lat: 21.4225, lng: 39.8262 })}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-elevated border border-base text-secondary hover:text-primary transition-colors font-medium text-[11px]"
              >
                Makkah Haram
              </button>
              <button
                type="button"
                onClick={() => setDriverPos({ lat: 21.6796, lng: 39.1565 })}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-elevated border border-base text-secondary hover:text-primary transition-colors font-medium text-[11px]"
              >
                Jeddah Airport (KAIA)
              </button>
              <button
                type="button"
                onClick={() => setDriverPos({ lat: 24.4672, lng: 39.6111 })}
                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-elevated border border-base text-secondary hover:text-primary transition-colors font-medium text-[11px]"
              >
                Madinah Haram
              </button>
            </div>

            <div className="text-[11px] text-muted flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Chauffeur telemetry synced to Supabase Realtime</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. DRIVER ASSIGNMENT MODULE TABS
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-base rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-base pb-5">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CalendarCheck className="w-3.5 h-3.5" /> Trip Roster Management
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-primary tracking-tight">
              Assigned VIP Journeys
            </h2>
            <p className="text-xs text-secondary">
              Chronologically sorted by date and scheduled pickup time. Complete prior trips to unlock subsequent journeys.
            </p>
          </div>

          {/* Date-Based Navigation Tabs */}
          <div className="flex items-center gap-2 bg-surface p-1.5 px-2 rounded-2xl border border-base shadow-inner overflow-x-auto max-w-full shrink-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'today'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                  : 'text-secondary hover:text-primary hover:bg-card/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Today
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'today' ? 'bg-white/25 text-white' : 'bg-card text-muted border border-base'
                }`}
              >
                {todayAssignments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tomorrow')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'tomorrow'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                  : 'text-secondary hover:text-primary hover:bg-card/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Tomorrow
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'tomorrow' ? 'bg-white/25 text-white' : 'bg-card text-muted border border-base'
                }`}
              >
                {tomorrowAssignments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'upcoming'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                  : 'text-secondary hover:text-primary hover:bg-card/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Upcoming
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'upcoming' ? 'bg-white/25 text-white' : 'bg-card text-muted border border-base'
                }`}
              >
                {upcomingAssignments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/20'
                  : 'text-secondary hover:text-primary hover:bg-card/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'completed' ? 'bg-white/25 text-white' : 'bg-card text-muted border border-base'
                }`}
              >
                {completedAssignments.length}
              </span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB CONTENT 1: TODAY'S ASSIGNMENTS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {todayAssignments.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-surface border border-base space-y-3">
                <Car className="w-12 h-12 text-muted mx-auto" />
                <h3 className="text-base font-bold text-primary">No Assignments Scheduled for Today</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  Your roster for today is clear. Dispatch operations will notify you when new bookings are matched.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAssignments.map((assignment, index) => {
                  const isCurrentActive = activeAssignment?.id === assignment.id;
                  const isActionable = actionableAssignmentId === assignment.id;
                  const stepInfo = getWorkflowStep(assignment.status);

                  return (
                    <div
                      key={assignment.id}
                      className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                        isCurrentActive
                          ? 'bg-emerald-950/15 border-emerald-500 shadow-xl ring-1 ring-emerald-500/30'
                          : isActionable
                          ? 'bg-card border-amber-500/50 shadow-lg'
                          : 'bg-surface border-base opacity-90 hover:opacity-100'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base pb-4">
                        <div className="flex items-center gap-3">
                          {/* Chronological order index */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shadow-sm ${
                              isCurrentActive
                                ? 'bg-emerald-500 text-slate-950'
                                : isActionable
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-card text-muted border border-base'
                            }`}
                          >
                            #{index + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary text-sm sm:text-base">
                                {assignment.booking_reference}
                              </span>
                              <span className="text-[10px] text-muted uppercase font-bold tracking-wider">
                                &bull; {assignment.vehicle_type?.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-secondary flex items-center gap-2 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="font-bold text-primary">
                                Pickup: {formatPickupClock(assignment.scheduled_at)}
                              </span>
                              <span className="text-[11px] text-muted">
                                ({formatPickupFull(assignment.scheduled_at)})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badges & Fare */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Assignment Status Pill */}
                          {isCurrentActive ? (
                            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Active Mission
                            </span>
                          ) : isActionable ? (
                            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
                              <Bell className="w-3 h-3" /> Actionable &bull; Next In Line
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-surface text-muted border border-base flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-muted" /> Locked &bull; Queued
                            </span>
                          )}

                          {/* Trip Status Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border ${stepInfo.badgeClass}`}
                          >
                            Trip: {stepInfo.label}
                          </span>

                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base ml-1">
                            {formatCurrency(
                              assignment.final_fare || assignment.estimated_fare,
                              settings.currency
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
                        {/* Route Locations */}
                        <div className="p-4 rounded-2xl bg-surface border border-base space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-muted block">
                                Pickup Address
                              </span>
                              <span className="font-semibold text-primary leading-snug">
                                {assignment.pickup_address}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 pt-2.5 border-t border-base">
                            <Navigation className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-muted block">
                                Destination
                              </span>
                              <span className="font-semibold text-primary leading-snug">
                                {assignment.destination_address}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Customer Information */}
                        <div className="p-4 rounded-2xl bg-surface border border-base flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-muted">
                              <span>Customer / Passenger:</span>
                              <span className="font-bold text-primary">{assignment.passenger_name}</span>
                            </div>
                            <div className="flex items-center justify-between text-muted">
                              <span>Contact Phone:</span>
                              <span className="font-semibold text-primary">
                                {assignment.passenger_phone || 'Confidential'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-muted">
                              <span>Passengers:</span>
                              <span className="font-semibold text-primary">
                                {assignment.passenger_count || 1} Persons
                              </span>
                            </div>
                            {assignment.notes && (
                              <div className="text-[11px] text-muted italic pt-1 truncate">
                                Note: {assignment.notes}
                              </div>
                            )}
                          </div>

                          {assignment.passenger_phone && (
                            <div className="pt-1 flex items-center justify-end">
                              <a
                                href={`tel:${assignment.passenger_phone}`}
                                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call Passenger
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-4 mt-4 border-t border-base flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-muted flex items-center gap-1.5">
                          {isActionable ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Ready for your action
                            </span>
                          ) : (
                            <span className="text-secondary flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-muted" /> Locked: Must complete active mission first
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div>
                          {isActionable ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Step 1: Assigned -> Accept or Decline */}
                              {assignment.status === 'driver_assigned' && (
                                <>
                                  <button
                                    onClick={() => handleAcceptRide(assignment.id)}
                                    className="py-2.5 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-4 h-4" /> Accept Assignment
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeclineModal(assignment)}
                                    className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-surface hover:bg-rose-500/10 hover:text-rose-500 text-secondary border border-base transition-colors"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}

                              {/* Step 2: Accepted -> Start Heading to Pickup */}
                              {(assignment.status === 'driver_accepted' || assignment.status === 'accepted') && (
                                <button
                                  onClick={() => handleStartDriving(assignment.id)}
                                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1.5"
                                >
                                  <Navigation className="w-4 h-4" /> Start Heading to Pickup
                                </button>
                              )}

                              {/* Step 3: Heading to Pickup -> Mark Arrived */}
                              {(assignment.status === 'driver_arriving' || assignment.status === 'on_the_way') && (
                                <button
                                  onClick={() => driverUpdateRideStatus(assignment.id, 'driver_arrived')}
                                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all flex items-center gap-1.5"
                                >
                                  <MapPin className="w-4 h-4" /> Mark Arrived at Pickup
                                </button>
                              )}

                              {/* Step 4: Arrived -> Start Trip */}
                              {(assignment.status === 'driver_arrived' || assignment.status === 'arrived') && (
                                <button
                                  onClick={() => driverUpdateRideStatus(assignment.id, 'trip_started')}
                                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all flex items-center gap-1.5"
                                >
                                  <Car className="w-4 h-4" /> Passenger Boarded &bull; Start Trip
                                </button>
                              )}

                              {/* Step 5: Started -> Complete Trip */}
                              {(assignment.status === 'trip_started' ||
                                assignment.status === 'started' ||
                                assignment.status === 'ride_started') && (
                                <button
                                  onClick={() => handleCompleteTrip(assignment.id)}
                                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Complete Trip Successfully
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="px-4 py-2 rounded-xl bg-surface text-muted text-xs border border-base flex items-center gap-2 cursor-not-allowed">
                              <Lock className="w-3.5 h-3.5 text-muted" />
                              <span>Queued &bull; Awaiting active trip completion</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB CONTENT 2: TOMORROW'S ASSIGNMENTS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'tomorrow' && (
          <div className="space-y-4">
            {tomorrowAssignments.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-surface border border-base space-y-3">
                <Calendar className="w-12 h-12 text-muted mx-auto" />
                <h3 className="text-base font-bold text-primary">No Assignments Scheduled for Tomorrow</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  You currently have no scheduled pickups for tomorrow.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tomorrowAssignments.map((assignment, idx) => (
                  <div
                    key={assignment.id}
                    className="p-5 sm:p-6 rounded-3xl bg-surface border border-base space-y-4 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base pb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-card flex items-center justify-center text-xs font-mono font-bold text-muted border border-base">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-primary text-base">
                            {assignment.booking_reference}
                          </div>
                          <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5" /> Scheduled Tomorrow at{' '}
                            {formatPickupClock(assignment.scheduled_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          Scheduled
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                          {formatCurrency(
                            assignment.final_fare || assignment.estimated_fare,
                            settings.currency
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-card border border-base space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-primary font-medium">{assignment.pickup_address}</span>
                        </div>
                        <div className="flex items-start gap-2.5 pt-2 border-t border-base">
                          <Navigation className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-primary font-medium">{assignment.destination_address}</span>
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-card border border-base space-y-1.5 text-muted">
                        <div>Passenger: <strong className="text-primary">{assignment.passenger_name}</strong></div>
                        <div>Vehicle: <strong className="text-primary uppercase">{assignment.vehicle_type?.replace(/_/g, ' ')}</strong></div>
                        <div>Passengers: <strong className="text-primary">{assignment.passenger_count || 1} Persons</strong></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-base flex items-center justify-between text-xs text-secondary">
                      <span>Will unlock automatically on scheduled date after completing preceding trips.</span>
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-muted" /> Scheduled Tomorrow
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB CONTENT 3: UPCOMING ASSIGNMENTS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {upcomingAssignments.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-surface border border-base space-y-3">
                <Layers className="w-12 h-12 text-muted mx-auto" />
                <h3 className="text-base font-bold text-primary">No Future Assignments Found</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  Future trips beyond tomorrow will be listed here chronologically once dispatched.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAssignments.map((assignment, idx) => (
                  <div
                    key={assignment.id}
                    className="p-5 sm:p-6 rounded-3xl bg-surface border border-base space-y-4 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base pb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-card flex items-center justify-center text-xs font-mono font-bold text-muted border border-base">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-primary text-base">
                            {assignment.booking_reference}
                          </div>
                          <div className="text-xs text-sky-400 font-semibold flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" /> {formatPickupFull(assignment.scheduled_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          Upcoming Reservation
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                          {formatCurrency(
                            assignment.final_fare || assignment.estimated_fare,
                            settings.currency
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-card border border-base space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-primary font-medium">{assignment.pickup_address}</span>
                        </div>
                        <div className="flex items-start gap-2.5 pt-2 border-t border-base">
                          <Navigation className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-primary font-medium">{assignment.destination_address}</span>
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-card border border-base space-y-1.5 text-muted">
                        <div>Passenger: <strong className="text-primary">{assignment.passenger_name}</strong></div>
                        <div>Vehicle: <strong className="text-primary uppercase">{assignment.vehicle_type?.replace(/_/g, ' ')}</strong></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB CONTENT 4: COMPLETED MISSIONS HISTORICAL LEDGER
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedAssignments.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-surface border border-base space-y-3">
                <CheckCircle2 className="w-12 h-12 text-muted mx-auto" />
                <h3 className="text-base font-bold text-primary">No Completed Missions Recorded</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  When you successfully complete your assigned trips, their historical earnings and details will be logged here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedAssignments.map((ride) => (
                  <div
                    key={ride.id}
                    className="bg-surface border border-base p-4 sm:p-5 rounded-2xl shadow-sm hover:border-emerald-500/40 transition-all space-y-3"
                  >
                    {/* Top Row: Ref, Passenger, Status & Fare */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-amber-500 dark:text-amber-400 text-sm">
                          {ride.booking_reference}
                        </span>
                        <span className="text-primary font-bold text-sm">
                          &bull; {ride.passenger_name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      </div>

                      {/* Prominent Price */}
                      <div className="text-left sm:text-right">
                        <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-base sm:text-lg block">
                          {formatCurrency(ride.final_fare || ride.estimated_fare, settings.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Route */}
                    <div className="text-xs text-secondary flex flex-wrap items-center gap-2">
                      <span className="font-medium text-primary">{ride.pickup_address}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="font-medium text-primary">{ride.destination_address}</span>
                    </div>

                    {/* Bottom Row: Date Timestamp (Clean, isolated, NEVER colliding with price) */}
                    <div className="pt-2 border-t border-base/40 flex items-center justify-between text-[11px] text-muted">
                      <span>Vehicle: {ride.vehicle_type?.replace(/_/g, ' ').toUpperCase() || 'VIP FLEET'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Completed on {formatDateTime(ride.updated_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. DECLINE ASSIGNMENT MODAL
      ───────────────────────────────────────────────────────────── */}
      {declineModalOpen && bookingToDecline && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-base rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-primary">Decline Assignment</h3>
            <p className="text-xs text-secondary">
              Please specify the reason for declining trip #{bookingToDecline.booking_reference}. It will be returned to Dispatch to reassign.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-secondary font-semibold">Reason for Declining</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-rose-500"
              >
                <option value="Vehicle maintenance required">Vehicle maintenance required</option>
                <option value="Rest / prayer break required">Rest / prayer break required</option>
                <option value="Heavy traffic / out of corridor">Heavy traffic / out of corridor</option>
                <option value="Shift concluding">Shift concluding</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeclineModalOpen(false);
                  setBookingToDecline(null);
                }}
                className="px-4 py-2 rounded-xl text-xs text-muted hover:text-primary transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. ADDITIONAL CHARGE MODAL
      ───────────────────────────────────────────────────────────── */}
      {chargeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCharge}
            className="bg-card border border-base rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-primary">Add Additional Charge</h3>
            <div className="space-y-1.5">
              <label className="text-xs text-secondary font-semibold">Charge Type</label>
              <select
                value={chargeType}
                onChange={(e) => setChargeType(e.target.value as AdditionalChargeType)}
                className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
              >
                <option value="toll">Highway Toll Gate (Darb/Salik)</option>
                <option value="parking">Airport Terminal Parking</option>
                <option value="waiting">Extended Waiting Time</option>
                <option value="extra_luggage">Excess Luggage Handling</option>
                <option value="special_service">Ziyarat Waiting / Special Service</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-secondary font-semibold">Amount ({settings.currency})</label>
              <input
                type="number"
                min={1}
                value={chargeAmount}
                onChange={(e) => setChargeAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-secondary font-semibold">Description / Note</label>
              <input
                type="text"
                value={chargeDesc}
                onChange={(e) => setChargeDesc(e.target.value)}
                className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setChargeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
              >
                Add Charge
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
