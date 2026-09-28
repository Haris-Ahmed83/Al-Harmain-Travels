'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IntermediateStop,
  LocationPoint,
  TripType,
  VehicleCategory,
  VehicleType,
} from '@/types';
import {
  MapPin,
  Search,
  Crosshair,
  Plus,
  Trash2,
  Navigation,
  Car,
  Users,
  Luggage,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CustomRouteBookingPanelProps {
  pickup: LocationPoint | null;
  destination: LocationPoint | null;
  stops: IntermediateStop[];
  onOpenSearch: (field: 'pickup' | 'destination' | `stop_${number}`) => void;
  onUseCurrentLocation: () => void;
  onAddStop: () => void;
  onRemoveStop: (stopId: string) => void;
  onSwapPickupDestination: () => void;
  distanceKm: number;
  durationMinutes: number;
  isRouting: boolean;
  routeError: string | null;

  // Passenger & Travel State
  passengerName: string;
  setPassengerName: (val: string) => void;
  passengerPhone: string;
  setPassengerPhone: (val: string) => void;
  passengerCount: number;
  setPassengerCount: (val: number) => void;
  journeyDate: string;
  setJourneyDate: (val: string) => void;
  journeyTime: string;
  setJourneyTime: (val: string) => void;
  specialInstructions: string;
  setSpecialInstructions: (val: string) => void;

  // Trip Type & Return Schedule
  tripType: TripType;
  setTripType: (val: TripType) => void;
  returnDate: string;
  setReturnDate: (val: string) => void;
  returnTime: string;
  setReturnTime: (val: string) => void;

  // Vehicle Category
  selectedVehicle: VehicleCategory | null;
  setSelectedVehicle: (val: VehicleCategory | null) => void;

  // Submission
  onSubmitCustomBooking: () => Promise<void>;
  isSubmitting: boolean;
  confirmedBookingRef: string | null;
  onResetCustomBooking: () => void;
}

const CUSTOM_VEHICLE_OPTIONS: {
  category: VehicleCategory;
  vehicleType: VehicleType;
  title: string;
  subtitle: string;
  capacityPax: number;
  capacityLuggage: number;
  perks: string[];
}[] = [
  {
    category: 'sedan',
    vehicleType: 'sedan',
    title: 'Executive Sedan',
    subtitle: 'Toyota Camry / Hyundai Sonata / Lexus ES',
    capacityPax: 3,
    capacityLuggage: 2,
    perks: ['Ideal for individuals & small families', 'Bottled water & mobile chargers', 'Executive chauffeur'],
  },
  {
    category: 'staria',
    vehicleType: 'van',
    title: 'Luxury Family MPV',
    subtitle: 'Hyundai Staria VIP / Executive Van',
    capacityPax: 6,
    capacityLuggage: 5,
    perks: ['Spacious captain seats', 'Ample luggage room for Umrah groups', 'Privacy climate control'],
  },
  {
    category: 'gmc',
    vehicleType: 'vip_gmc',
    title: 'VIP Yukon XL',
    subtitle: 'GMC Yukon / Chevrolet Suburban XL',
    capacityPax: 7,
    capacityLuggage: 6,
    perks: ['VIP Royal class comfort', 'Maximum privacy & luxury tinted glass', 'Supreme long-haul comfort'],
  },
  {
    category: 'hiroof',
    vehicleType: 'van',
    title: 'HiRoof VIP Minibus',
    subtitle: 'Toyota HiAce High Roof VIP',
    capacityPax: 12,
    capacityLuggage: 10,
    perks: ['Full delegation & large group capacity', 'High ceiling & wide walking aisle', 'Huge dedicated luggage hold'],
  },
];

export default function CustomRouteBookingPanel({
  pickup,
  destination,
  stops,
  onOpenSearch,
  onUseCurrentLocation,
  onAddStop,
  onRemoveStop,
  onSwapPickupDestination,
  distanceKm,
  durationMinutes,
  isRouting,
  routeError,

  passengerName,
  setPassengerName,
  passengerPhone,
  setPassengerPhone,
  passengerCount,
  setPassengerCount,
  journeyDate,
  setJourneyDate,
  journeyTime,
  setJourneyTime,
  specialInstructions,
  setSpecialInstructions,

  tripType,
  setTripType,
  returnDate,
  setReturnDate,
  returnTime,
  setReturnTime,

  selectedVehicle,
  setSelectedVehicle,

  onSubmitCustomBooking,
  isSubmitting,
  confirmedBookingRef,
  onResetCustomBooking,
}: CustomRouteBookingPanelProps) {
  const [step, setStep] = useState<'route' | 'vehicle' | 'details' | 'review'>('route');

  const handleProceedToVehicle = () => {
    if (!pickup) {
      toast.error('Please specify your pickup location.');
      return;
    }
    if (!destination) {
      toast.error('Please specify your final destination.');
      return;
    }
    setStep('vehicle');
  };

  const handleProceedToDetails = () => {
    if (!selectedVehicle) {
      toast.error('Please select a preferred vehicle category.');
      return;
    }
    setStep('details');
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim() || !passengerPhone.trim()) {
      toast.error('Please provide your name and WhatsApp contact number.');
      return;
    }
    if (tripType === 'round_trip' && (!returnDate || !returnTime)) {
      toast.error('Please select your return date and pickup time.');
      return;
    }
    setStep('review');
  };

  return (
    <div className="space-y-5">
      {/* ── Progress Indicator ────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-wider overflow-x-auto pb-1">
        {[
          { key: 'route', label: '1. Route & Stops' },
          { key: 'vehicle', label: '2. Vehicle' },
          { key: 'details', label: '3. Schedule & Contact' },
          { key: 'review', label: '4. Dispatch Review' },
        ].map((item, idx) => {
          const stepOrder = ['route', 'vehicle', 'details', 'review'];
          const currentIndex = stepOrder.indexOf(step);
          const isCurrent = step === item.key;
          const isDone = idx < currentIndex;
          return (
            <React.Fragment key={item.key}>
              <span
                className={`px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400 font-bold'
                    : isDone
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'border-base text-muted/60'
                }`}
              >
                {item.label}
              </span>
              {idx < 3 && <span className="text-muted/40">›</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* ════ STEP 1: ROUTE & INTERMEDIATE STOPS ════════════════════════ */}
      {step === 'route' && (
        <div className="bg-card border border-base rounded-3xl shadow-xl overflow-hidden animate-fade-up">
          <div className="px-5 pt-5 pb-4 border-b border-base bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Navigation className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                  Define Your Custom Route
                </h2>
                <p className="text-[11px] text-muted mt-0.5 pl-9">
                  Choose any pickup & destination, and add optional stops along the way.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Trip Type Toggle (One-Way vs Round Trip) */}
            <div>
              <label className="type-label mb-1.5 block">Trip Type</label>
              <div className="grid grid-cols-2 gap-2 bg-surface p-1 rounded-2xl border border-base">
                <button
                  type="button"
                  onClick={() => setTripType('one_way')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    tripType === 'one_way'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>One-Way</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTripType('round_trip')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    tripType === 'round_trip'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Round Trip</span>
                </button>
              </div>
            </div>

            {/* Pickup Input Card */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="type-label flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                  Pickup Location *
                </label>
                <button
                  type="button"
                  onClick={onUseCurrentLocation}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Crosshair className="w-3 h-3" />
                  Current GPS
                </button>
              </div>

              <div
                onClick={() => onOpenSearch('pickup')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onOpenSearch('pickup')}
                className="w-full text-left p-3.5 rounded-2xl border border-base bg-surface hover:bg-elevated hover:border-emerald-500/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className={`text-xs truncate ${pickup ? 'font-semibold text-primary' : 'text-muted'}`}>
                    {pickup?.address || 'Search pickup hotel, terminal, or address…'}
                  </span>
                </div>
                <Search className="w-4 h-4 text-muted group-hover:text-emerald-500 transition-colors shrink-0" />
              </div>
            </div>

            {/* Intermediate Stops Section */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="type-label flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 ring-2 ring-cyan-500/30" />
                  Intermediate Stops (Optional)
                </label>
                {stops.length < 5 && (
                  <button
                    type="button"
                    onClick={onAddStop}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    + Add Stop
                  </button>
                )}
              </div>

              {stops.length === 0 ? (
                <div className="p-3 rounded-2xl border border-dashed border-base/80 bg-surface/30 text-center">
                  <p className="text-[11px] text-muted">
                    No intermediate stops added yet. (e.g. Ziyarat sites, hotel stopovers, shopping).
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      className="p-3 rounded-2xl border border-base bg-surface flex items-center justify-between gap-2 transition-all hover:border-cyan-500/40"
                    >
                      <div
                        onClick={() => onOpenSearch(`stop_${idx}` as any)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onOpenSearch(`stop_${idx}` as any)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-500 text-[10px] font-bold flex items-center justify-center shrink-0 border border-cyan-500/30">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="text-[10px] text-muted block uppercase font-bold">Stop #{idx + 1}</span>
                          <span className={`text-xs truncate block ${stop.address ? 'font-semibold text-primary' : 'text-muted'}`}>
                            {stop.address || 'Select stop location…'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveStop(stop.id)}
                        className="p-1.5 rounded-xl text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                        title="Remove Stop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Input Card */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="type-label flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
                  Final Destination *
                </label>
                {pickup && destination && (
                  <button
                    type="button"
                    onClick={onSwapPickupDestination}
                    className="text-[11px] font-semibold text-muted hover:text-primary flex items-center gap-1 cursor-pointer"
                    title="Swap Pickup and Destination"
                  >
                    Swap ⇄
                  </button>
                )}
              </div>

              <div
                onClick={() => onOpenSearch('destination')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onOpenSearch('destination')}
                className="w-full text-left p-3.5 rounded-2xl border border-base bg-surface hover:bg-elevated hover:border-amber-500/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className={`text-xs truncate ${destination ? 'font-semibold text-primary' : 'text-muted'}`}>
                    {destination?.address || 'Search destination city, hotel, or landmark…'}
                  </span>
                </div>
                <Search className="w-4 h-4 text-muted group-hover:text-amber-500 transition-colors shrink-0" />
              </div>
            </div>

            {/* Navigation Metadata (Route distance only — strictly NO fare) */}
            {distanceKm > 0 && (
              <div className="p-3 rounded-2xl bg-surface/70 border border-base text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-secondary">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Est. Journey Time: <strong className="text-primary">{durationMinutes} min</strong></span>
                </div>
                <div className="text-muted text-[11px]">
                  Approx. <strong className="text-secondary">{distanceKm.toFixed(1)} km</strong>
                </div>
              </div>
            )}

            {routeError && (
              <p className="text-xs text-rose-500 italic bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {routeError}
              </p>
            )}

            {/* Mandatory Dispatcher Confirmation Notice */}
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-700 dark:text-amber-300 block">
                  Fare will be confirmed by our dispatcher.
                </span>
                <span className="text-[11px] text-amber-700/80 dark:text-amber-200/80">
                  Custom routes are priced manually based on stops and availability. You can submit without advance payment.
                </span>
              </div>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleProceedToVehicle}
              disabled={!pickup || !destination}
              className="btn-primary w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
            >
              <span>Continue to Vehicle Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ════ STEP 2: VEHICLE CATEGORY SELECTION ════════════════════════ */}
      {step === 'vehicle' && (
        <div className="bg-card border border-base rounded-3xl shadow-xl overflow-hidden animate-fade-up">
          <div className="px-5 pt-5 pb-4 border-b border-base bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Car className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                  Select Preferred Vehicle
                </h2>
                <p className="text-[11px] text-muted mt-0.5 pl-9">
                  Choose your VIP vehicle category for this custom journey
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('route')}
                className="text-[10px] font-semibold text-muted hover:text-primary px-2.5 py-1.5 rounded-xl bg-elevated border border-base cursor-pointer"
              >
                ← Route
              </button>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {CUSTOM_VEHICLE_OPTIONS.map((item) => {
              const isSelected = selectedVehicle === item.category;
              return (
                <div
                  key={item.category}
                  onClick={() => setSelectedVehicle(item.category)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedVehicle(item.category)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-surface border-base hover:border-amber-500/30 hover:bg-elevated'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-primary">{item.title}</span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted font-medium mt-0.5">{item.subtitle}</p>

                      <div className="flex items-center gap-4 mt-2 text-[11px] text-secondary">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-amber-500" />
                          Up to {item.capacityPax} Pax
                        </span>
                        <span className="flex items-center gap-1">
                          <Luggage className="w-3.5 h-3.5 text-amber-500" />
                          Up to {item.capacityLuggage} Bags
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1">
                        {item.perks.map((p, i) => (
                          <div key={i} className="text-[10px] text-muted flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Mandatory Dispatcher Fare Notice */}
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-700 dark:text-amber-300 block">
                  Fare will be confirmed by our dispatcher.
                </span>
                <span className="text-[11px] text-amber-700/80 dark:text-amber-200/80">
                  No automated fare quotation is shown for custom routes. Our operations desk will review availability and contact you with the best direct rate.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('route')}
                className="btn-secondary flex-1 py-3 text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleProceedToDetails}
                disabled={!selectedVehicle}
                className="btn-primary flex-[2] py-3 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
              >
                <span>Continue to Passenger Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ STEP 3: PASSENGER & SCHEDULE DETAILS ═════════════════════ */}
      {step === 'details' && (
        <div className="bg-card border border-base rounded-3xl shadow-xl overflow-hidden animate-fade-up">
          <div className="px-5 pt-5 pb-4 border-b border-base bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                  Schedule &amp; Passenger Information
                </h2>
                <p className="text-[11px] text-muted mt-0.5 pl-9">
                  Provide your travel date, time, and contact info so our dispatcher can reach you
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('vehicle')}
                className="text-[10px] font-semibold text-muted hover:text-primary px-2.5 py-1.5 rounded-xl bg-elevated border border-base cursor-pointer"
              >
                ← Vehicle
              </button>
            </div>
          </div>

          <form onSubmit={handleProceedToReview} className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="type-label">Lead Passenger Name *</label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="type-label">WhatsApp Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  placeholder="+966 5x xxx xxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="type-label">Pickup Date *</label>
                <input
                  type="date"
                  required
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="type-label">Pickup Time *</label>
                <input
                  type="time"
                  required
                  value={journeyTime}
                  onChange={(e) => setJourneyTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="type-label">Passengers Count</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs text-center font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Round Trip Return Date & Time */}
            {tripType === 'round_trip' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return Journey Schedule</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="type-label">Return Date *</label>
                    <input
                      type="date"
                      required
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="type-label">Return Pickup Time *</label>
                    <input
                      type="time"
                      required
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="type-label">Additional Instructions / Special Requests</label>
              <textarea
                rows={2}
                placeholder="Flight number, waiting request at stops, baby seats, luggage dimensions, etc."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-input border border-base text-primary placeholder:text-muted text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('vehicle')}
                className="btn-secondary flex-1 py-3 text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary flex-[2] py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Review Journey Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ════ STEP 4: REVIEW & DISPATCHER SUBMISSION ════════════════════ */}
      {step === 'review' && (
        <div className="bg-card border border-base rounded-3xl shadow-xl overflow-hidden animate-fade-up">
          <div className="px-5 pt-5 pb-4 border-b border-base bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                  Review Journey &amp; Submit Request
                </h2>
                <p className="text-[11px] text-muted mt-0.5 pl-9">
                  Review your itinerary. No payment is required until our dispatcher confirms the fare.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-[10px] font-semibold text-muted hover:text-primary px-2.5 py-1.5 rounded-xl bg-elevated border border-base cursor-pointer"
              >
                ← Edit Details
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Itinerary Summary */}
            <div className="p-4 rounded-2xl bg-surface border border-base space-y-3">
              <div className="flex items-center justify-between text-muted text-[11px] border-b border-base/60 pb-2">
                <span className="font-bold text-secondary uppercase tracking-wider">Itinerary Details</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {tripType === 'round_trip' ? 'Round Trip' : 'One-Way Journey'}
                </span>
              </div>

              {/* Pickup */}
              {pickup && (
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-muted text-[10px] uppercase font-bold">Pickup</span>
                    <p className="font-semibold text-primary">{pickup.address}</p>
                  </div>
                </div>
              )}

              {/* Intermediate Stops */}
              {stops.map((stop, i) => (
                <div key={stop.id} className="flex items-start gap-2.5 pl-3 border-l-2 border-dashed border-cyan-500/40 my-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-muted text-[10px] uppercase font-bold">Stop #{i + 1}</span>
                    <p className="font-semibold text-secondary">{stop.address}</p>
                  </div>
                </div>
              ))}

              {/* Destination */}
              {destination && (
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-muted text-[10px] uppercase font-bold">Destination</span>
                    <p className="font-semibold text-amber-500">{destination.address}</p>
                  </div>
                </div>
              )}

              {/* Schedule and Vehicle Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-base/60 text-[11px]">
                <div>
                  <span className="text-muted text-[10px] block">Departure</span>
                  <span className="font-semibold text-primary">{journeyDate} at {journeyTime}</span>
                </div>
                {tripType === 'round_trip' && (
                  <div>
                    <span className="text-muted text-[10px] block">Return</span>
                    <span className="font-semibold text-primary">{returnDate} at {returnTime}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted text-[10px] block">Vehicle</span>
                  <span className="font-semibold text-amber-500 capitalize">{selectedVehicle?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-muted text-[10px] block">Passengers</span>
                  <span className="font-semibold text-primary">{passengerCount} Pax</span>
                </div>
                <div>
                  <span className="text-muted text-[10px] block">Passenger</span>
                  <span className="font-semibold text-primary truncate block">{passengerName}</span>
                </div>
                <div>
                  <span className="text-muted text-[10px] block">WhatsApp</span>
                  <span className="font-semibold text-primary truncate block">{passengerPhone}</span>
                </div>
              </div>

              {specialInstructions && (
                <div className="pt-2 border-t border-base/60 text-[11px]">
                  <span className="text-muted">Special Requests: </span>
                  <span className="text-secondary italic">{specialInstructions}</span>
                </div>
              )}
            </div>

            {/* CRITICAL REQUIREMENT: Prominent Notice that Fare Will Be Confirmed by Dispatcher */}
            <div className="rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Fare will be confirmed by our dispatcher.</span>
              </div>
              <p className="text-[11px] text-secondary leading-relaxed">
                Because your journey involves customized routing and stops, our dispatch team will review vehicle availability and calculate our best direct quotation.
              </p>
              <div className="bg-surface/80 p-3 rounded-xl border border-base font-semibold text-[11px] text-primary flex items-center justify-between">
                <span>Estimated Fare:</span>
                <span className="text-amber-500 italic font-bold">To be confirmed by Dispatcher</span>
              </div>
              <p className="text-[10px] text-muted italic">
                * You do not need to make any payment right now. The dispatcher will contact you via WhatsApp / phone to confirm the price and payment options.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="btn-secondary flex-1 py-3.5 text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onSubmitCustomBooking}
                disabled={isSubmitting}
                className="btn-primary flex-[2] py-3.5 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                    <span>Submitting Request…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Custom Booking Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ SUBMISSION CONFIRMATION MODAL ════════════════════════════ */}
      {confirmedBookingRef && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-card border border-amber-500/40 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border-2 border-amber-500/30 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="type-card-title text-xl">Custom Request Submitted!</h3>
              <p className="text-xs text-secondary">
                Your customized route details have reached our dispatch operations desk.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-base space-y-2 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Booking Reference:</span>
                <span className="font-mono text-base font-black text-amber-600 dark:text-amber-400">
                  {confirmedBookingRef}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Booking Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] uppercase font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Pending Review
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Fare:</span>
                <span className="font-bold text-amber-500 italic">To be confirmed by Dispatcher</span>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed mt-2">
                Our dispatcher will contact you at <strong className="text-primary">{passengerPhone}</strong> to confirm vehicle availability, provide the finalized fare, and share payment details.
              </div>
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
                onClick={onResetCustomBooking}
                className="text-xs text-muted hover:text-primary py-2 cursor-pointer"
              >
                + Book Another Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
