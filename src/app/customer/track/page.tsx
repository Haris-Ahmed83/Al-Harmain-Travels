'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Booking, BookingStatus } from '@/types';
import {
  Car,
  Phone,
  MessageSquare,
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  Sparkles,
  MapPin,
  Navigation,
  UserCheck,
  Calendar,
  Check,
  XCircle,
  ChevronRight,
  Send,
  CreditCard,
  Flag,
  Receipt,
  Eye,
  X,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';

interface TrackingStepConfig {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: (props: { className?: string }) => React.ReactNode;
}

const TRACKING_STEPS: TrackingStepConfig[] = [
  {
    id: 1,
    title: 'Submitted',
    subtitle: 'Booking Registered',
    description: 'Your ride request has been received and logged in the dispatch central system.',
    icon: ({ className }) => <Send className={className} />,
  },
  {
    id: 2,
    title: 'Payment Verified',
    subtitle: 'Confirmed by Dispatch',
    description: 'Payment status and transaction verification confirmed by central staff operations.',
    icon: ({ className }) => <CreditCard className={className} />,
  },
  {
    id: 3,
    title: 'Driver Assigned',
    subtitle: 'Chauffeur Selected',
    description: 'A certified VIP captain and executive vehicle have been allocated for your journey.',
    icon: ({ className }) => <UserCheck className={className} />,
  },
  {
    id: 4,
    title: 'Driver Accepted',
    subtitle: 'Mission Confirmed',
    description: 'Your assigned captain has acknowledged and accepted your transport mission.',
    icon: ({ className }) => <CheckCircle2 className={className} />,
  },
  {
    id: 5,
    title: 'Heading to Pickup',
    subtitle: 'Captain En Route',
    description: 'Your chauffeur is actively driving toward your specified pickup address.',
    icon: ({ className }) => <Navigation className={className} />,
  },
  {
    id: 6,
    title: 'Arrived at Pickup',
    subtitle: 'At Pickup Location',
    description: 'Your captain has arrived at the pickup point and is ready for boarding.',
    icon: ({ className }) => <MapPin className={className} />,
  },
  {
    id: 7,
    title: 'Trip Started',
    subtitle: 'Passenger Boarded',
    description: 'Passengers have boarded. Your VIP transport journey is currently underway.',
    icon: ({ className }) => <Car className={className} />,
  },
  {
    id: 8,
    title: 'Trip Completed',
    subtitle: 'Safely Arrived',
    description: 'You have safely reached your destination. Electronic VAT receipt generated.',
    icon: ({ className }) => <Flag className={className} />,
  },
];

/**
 * Deterministically compute the active step index (0-indexed: 0 to 7)
 * based strictly on the selected booking's real Supabase status.
 */
function getActiveStepIndex(status: BookingStatus, assignedDriverId?: string | null): number {
  switch (status) {
    case 'completed':
    case 'trip_completed':
    case 'ride_completed':
    case 'payment_completed':
      return 7; // Step 8: Trip Completed

    case 'started':
    case 'trip_started':
    case 'ride_started':
      return 6; // Step 7: Trip Started

    case 'arrived':
    case 'driver_arrived':
      return 5; // Step 6: Arrived at Pickup

    case 'on_the_way':
    case 'driver_arriving':
      return 4; // Step 5: Heading to Pickup

    case 'accepted':
    case 'driver_accepted':
      return 3; // Step 4: Driver Accepted

    case 'driver_assigned':
      return 2; // Step 3: Driver Assigned

    case 'confirmed':
    case 'payment_verified':
    case 'searching':
      return 1; // Step 2: Payment Verified

    case 'pending_verification':
    case 'pending':
    default:
      if (assignedDriverId) return 2;
      return 0; // Step 1: Submitted
  }
}

export default function CustomerTrackPage() {
  const searchParams = useSearchParams();
  const urlRef = searchParams.get('ref') || searchParams.get('bookingId');

  const {
    currentUser,
    userRole,
    bookings,
    drivers,
    settings,
    submitRating,
    isDataLoading,
  } = useApp();

  // Load the customer's actual bookings from Supabase, sorted by real booking date and time
  const customerBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const matchesUser =
          (currentUser?.id && b.customer_id === currentUser.id) ||
          (currentUser?.phone && b.passenger_phone === currentUser.phone) ||
          userRole === 'admin' ||
          userRole === 'dispatcher';
        return matchesUser;
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduled_at || a.created_at).getTime();
        const dateB = new Date(b.scheduled_at || b.created_at).getTime();
        return dateB - dateA;
      });
  }, [bookings, currentUser, userRole]);

  // Selected booking state
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');

  // Identify the single source of truth for the active booking
  const selectedBooking = useMemo(() => {
    if (selectedBookingId) {
      const found = customerBookings.find(
        (b) => b.id === selectedBookingId || b.booking_reference === selectedBookingId
      );
      if (found) return found;
    }
    if (urlRef) {
      const found = customerBookings.find(
        (b) => b.id === urlRef || b.booking_reference === urlRef
      );
      if (found) return found;
    }
    return customerBookings[0] || null;
  }, [selectedBookingId, urlRef, customerBookings]);

  // Assigned driver for the selected booking
  const assignedDriver = useMemo(() => {
    if (!selectedBooking?.assigned_driver_id) return selectedBooking?.driver || null;
    return (
      drivers.find((d) => d.id === selectedBooking.assigned_driver_id) ||
      selectedBooking.driver ||
      null
    );
  }, [selectedBooking, drivers]);

  // Invoice & Rating state
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [ratingVal, setRatingVal] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  // Active step calculation strictly for the selected booking
  const activeStepIdx = useMemo(() => {
    if (!selectedBooking) return 0;
    return getActiveStepIndex(selectedBooking.status, selectedBooking.assigned_driver_id);
  }, [selectedBooking?.status, selectedBooking?.assigned_driver_id]);

  const isCancelled =
    selectedBooking?.status === 'cancelled' ||
    selectedBooking?.status === 'rejected';

  const isPaymentRejected = selectedBooking?.status === 'payment_rejected';

  const isCompleted =
    selectedBooking?.status === 'completed' ||
    selectedBooking?.status === 'trip_completed' ||
    selectedBooking?.status === 'ride_completed' ||
    selectedBooking?.status === 'payment_completed';

  // Fare & Billing calculations (strictly derived from selected booking)
  const baseFare = Number(selectedBooking?.estimated_fare) || 0;
  const finalFare = selectedBooking?.final_fare != null ? Number(selectedBooking.final_fare) : null;
  const totalFare = finalFare ?? baseFare;
  const vatRate = settings.tax_percentage || 15;
  // In Saudi Arabia (ZATCA), consumer quotes include 15% VAT
  const vatAmount = totalFare > 0 ? (totalFare * vatRate) / (100 + vatRate) : 0;
  const netSubtotal = totalFare > 0 ? totalFare - vatAmount : 0;

  const paymentStatus = selectedBooking?.payment_status?.toLowerCase();
  const bookingStatus = selectedBooking?.status;

  const paymentBadge = useMemo(() => {
    if (!selectedBooking) {
      return {
        label: 'Awaiting Fare',
        bg: 'bg-muted/10 border-base',
        text: 'text-muted',
        icon: <Clock className="w-3.5 h-3.5" />,
      };
    }

    if (bookingStatus === 'payment_rejected' || paymentStatus === 'failed') {
      return {
        label: 'Payment Rejected',
        bg: 'bg-rose-500/10 border-rose-500/30',
        text: 'text-rose-600 dark:text-rose-400',
        icon: <XCircle className="w-3.5 h-3.5" />,
      };
    }

    if (bookingStatus === 'pending_verification' || paymentStatus === 'pending') {
      return {
        label: 'Verification Pending',
        bg: 'bg-amber-500/10 border-amber-500/30',
        text: 'text-amber-600 dark:text-amber-400',
        icon: <Clock className="w-3.5 h-3.5" />,
      };
    }

    if (paymentStatus === 'refunded') {
      return {
        label: 'Fare Refunded',
        bg: 'bg-slate-500/10 border-slate-500/30',
        text: 'text-slate-600 dark:text-slate-400',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
      };
    }

    return {
      label: 'Paid & Verified',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    };
  }, [selectedBooking, bookingStatus, paymentStatus]);

  const paymentMethodLabel = useMemo(() => {
    const method = selectedBooking?.payment?.method;
    if (method === 'cash') return 'Cash on Boarding';
    if (method === 'card') return 'Credit / Debit Card (Mada)';
    if (method === 'online') return 'Online Payment Gateway';
    if (selectedBooking?.payment_screenshot_url) return 'Bank Transfer / Proof Uploaded';
    return 'Electronic Payment / Transfer';
  }, [selectedBooking]);

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !assignedDriver) return;
    submitRating({
      booking_id: selectedBooking.id,
      customer_id: selectedBooking.customer_id || undefined,
      driver_id: assignedDriver.id,
      rating: ratingVal,
      feedback: feedbackText,
      category: 'rating',
    });
    setRatingSubmitted(true);
    toast.success('Thank you for rating your executive chauffeur!');
  };

  if (isDataLoading) {
    return (
      <div className="page-shell py-20 text-center space-y-5 animate-pulse">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-surface border border-base flex items-center justify-center text-muted">
          <div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-primary">Loading Trip Route Overview...</h2>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Retrieving authenticated bookings and status telemetry from Supabase...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedBooking) {
    return (
      <div className="page-shell py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <Car className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="type-page-title">No Bookings Found To Track</h2>
          <p className="text-sm text-secondary max-w-md mx-auto">
            You do not have any registered transportation bookings yet. Create a reservation to track its full route overview and lifecycle progress in real time.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/customer" className="btn-primary">
            Book a Journey
          </Link>
          <Link href="/customer/bookings" className="btn-secondary">
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      {/* Page Header & Multiple Bookings Selector */}
      <div className="bg-card border border-base p-5 sm:p-7 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="type-eyebrow text-emerald-600 dark:text-emerald-400">
                Al Harmain Logistics Telemetry
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <h1 className="text-2xl sm:type-page-title mt-1 flex items-center gap-3 flex-wrap">
              <span>Trip Route Overview</span>
              <span className="text-amber-500 dark:text-amber-400 font-mono text-xl sm:text-2xl">
                #{selectedBooking.booking_reference}
              </span>
            </h1>
            <p className="text-xs text-secondary mt-1">
              Live status progression powered by Al Harmain Central Dispatch and real-time database state.
            </p>
          </div>

          {/* Multiple Bookings Switcher */}
          {customerBookings.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-surface p-2 sm:p-2.5 rounded-2xl border border-base">
              <span className="text-xs text-muted font-medium flex items-center gap-1.5 px-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Select Booking:
              </span>
              <select
                value={selectedBooking.id}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="bg-card text-xs font-semibold text-primary px-3 py-1.5 rounded-xl border border-base focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {customerBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.booking_reference} &bull; {formatDateTime(b.scheduled_at || b.created_at)} ({b.status.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selected Booking Quick Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-base text-xs">
          <div className="bg-surface/60 p-3 rounded-2xl border border-base">
            <span className="text-[10px] uppercase font-bold text-muted block">Passenger</span>
            <span className="font-semibold text-primary text-sm mt-0.5 block">{selectedBooking.passenger_name}</span>
            <span className="text-[11px] text-muted">{selectedBooking.passenger_phone}</span>
          </div>

          <div className="bg-surface/60 p-3 rounded-2xl border border-base">
            <span className="text-[10px] uppercase font-bold text-muted block">Booking Date &amp; Time</span>
            <span className="font-semibold text-primary text-sm mt-0.5 block">
              {formatDateTime(selectedBooking.scheduled_at || selectedBooking.created_at)}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 capitalize">
              {selectedBooking.booking_type} Ride
            </span>
          </div>

          <div className="bg-surface/60 p-3 rounded-2xl border border-base">
            <span className="text-[10px] uppercase font-bold text-muted block">Executive Vehicle</span>
            <span className="font-semibold text-primary text-sm mt-0.5 uppercase block">
              {selectedBooking.vehicle_type?.replace(/_/g, ' ')}
            </span>
            <span className="text-[11px] text-muted">{selectedBooking.passenger_count || 1} Passengers</span>
          </div>

          <div className="bg-surface/60 p-3 rounded-2xl border border-base flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted block">Total Trip Fare</span>
              <span className="font-bold text-amber-500 dark:text-amber-400 text-base mt-0.5 block">
                {formatCurrency(selectedBooking.final_fare || selectedBooking.estimated_fare, settings.currency)}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
              {selectedBooking.payment_status || 'VERIFIED'}
            </span>
          </div>
        </div>

        {/* Cancellation or Rejection Alerts if applicable */}
        {isCancelled && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">Booking Cancelled</span>
              <p className="mt-0.5 text-rose-200">
                {selectedBooking.cancellation_reason || 'This journey reservation was cancelled.'}
              </p>
            </div>
          </div>
        )}

        {isPaymentRejected && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-300">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">Payment Verification Required</span>
              <p className="mt-0.5 text-amber-200">
                {selectedBooking.payment_rejected_reason || 'Payment verification could not be confirmed by dispatch staff. Please check with customer support.'}
              </p>
            </div>
          </div>
        )}
      </div>


      {/* Main Focus: Detailed Trip Route Overview (Vertical Progression Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: The 8 Sequential Timeline Cards */}
        <div className="lg:col-span-8 bg-card border border-base p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="border-b border-base pb-4 flex items-center justify-between">
            <div>
              <h2 className="type-card-title text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-500" />
                Trip Route Overview Timeline
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Exact sequence of VIP transportation stages for booking #{selectedBooking.booking_reference}.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500 dark:text-amber-400">
              {activeStepIdx + 1}/8 Milestones
            </span>
          </div>

          {/* Sequential Step Cards with SVG Connectors */}
          <div className="relative space-y-6 pl-2">
            {TRACKING_STEPS.map((step, idx) => {
              const isDone = idx < activeStepIdx || (idx === 7 && isCompleted);
              const isCurrent = idx === activeStepIdx && !isCompleted;
              const isPending = idx > activeStepIdx;
              const isLast = idx === TRACKING_STEPS.length - 1;

              return (
                <div key={step.id} className="relative flex items-start gap-4 sm:gap-5 group">
                  {/* SVG Vertical Separator Line */}
                  {!isLast && (
                    <div
                      className={`absolute left-[19px] top-10 bottom-[-24px] w-0.5 transition-colors duration-500 ${
                        isDone ? 'bg-emerald-500' : 'bg-surface border-l-2 border-dashed border-base'
                      }`}
                    />
                  )}

                  {/* Step Marker Icon with SVG Badge */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-md ${
                      isDone
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                        : isCurrent
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-4 ring-emerald-400/40 animate-pulse scale-105'
                        : 'bg-surface text-muted border border-base'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      step.icon({ className: 'w-5 h-5' })
                    )}
                  </div>

                  {/* Step Content Body Card */}
                  <div
                    className={`flex-1 p-4 sm:p-5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                        : isDone
                        ? 'bg-surface/50 border-base'
                        : 'bg-surface/20 border-base opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-muted">
                          0{step.id}
                        </span>
                        <h3 className="font-bold text-primary text-base">
                          {step.title}
                        </h3>
                        <span className="text-xs text-muted font-medium">
                          &mdash; {step.subtitle}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isDone && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                            <Check className="w-3 h-3 stroke-[3]" /> Completed
                          </span>
                        )}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            Active Phase
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[11px] font-medium text-muted bg-surface px-2.5 py-0.5 rounded-full border border-base">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-secondary mt-2 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Contextual Step Data: Injected into relevant steps */}
                    {step.id === 1 && (
                      <div className="mt-3 pt-3 border-t border-base/60 text-xs text-muted flex items-center justify-between flex-wrap gap-2">
                        <span>Submitted At: <strong>{formatDateTime(selectedBooking.created_at)}</strong></span>
                        <span className="font-mono">Ref: {selectedBooking.booking_reference}</span>
                      </div>
                    )}

                    {step.id === 2 && isDone && (
                      <div className="mt-3 pt-3 border-t border-base/60 text-xs flex items-center justify-between flex-wrap gap-2 text-emerald-700 dark:text-emerald-300">
                        <span className="flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          Payment status verified &amp; approved by Central Operations.
                        </span>
                        <span className="font-bold uppercase">{selectedBooking.payment_status || 'PAID'}</span>
                      </div>
                    )}

                    {/* Driver details attached to Step 3 & Step 4 */}
                    {(step.id === 3 || step.id === 4) && (isDone || isCurrent) && assignedDriver && (
                      <div className="mt-3 pt-3 border-t border-base/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-card/80 p-3 rounded-xl border border-base">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow">
                            {assignedDriver.profile?.full_name?.charAt(0) || assignedDriver.full_name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <span className="font-bold text-primary block">
                              Captain {assignedDriver.profile?.full_name || assignedDriver.full_name}
                            </span>
                            <span className="text-[11px] text-muted">
                              Vehicle: {assignedDriver.assigned_vehicle?.make || 'VIP'} {assignedDriver.assigned_vehicle?.model || 'Fleet'} &bull; Plate: {assignedDriver.assigned_vehicle?.plate_number || 'VIP-KSA'}
                            </span>
                          </div>
                        </div>

                        {assignedDriver.profile?.phone && (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${assignedDriver.profile.phone}`}
                              className="px-3 py-1.5 rounded-lg bg-surface hover:bg-elevated text-primary text-xs font-semibold flex items-center gap-1.5 border border-base"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-500" /> Call
                            </a>
                            <a
                              href={`https://wa.me/${assignedDriver.profile.phone.replace(/[^0-9]/g, '')}?text=Salam%20Captain%2C%20I%20am%20passenger%20for%20booking%20${selectedBooking.booking_reference}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {step.id === 8 && isCompleted && (
                      <div className="mt-3 pt-3 border-t border-base/60 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                        <span>Journey concluded successfully. We look forward to serving you again.</span>
                        <span className="font-bold">ZATCA Compliant</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chauffeur Card & Billing Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Driver & Vehicle Information Card */}
          {assignedDriver ? (
            <div className="bg-card border border-base rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {assignedDriver.profile?.avatar_url ? (
                    <img
                      src={assignedDriver.profile.avatar_url}
                      alt={assignedDriver.profile?.full_name || 'Captain'}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xl shadow-md border-2 border-emerald-400">
                      {assignedDriver.profile?.full_name?.charAt(0) || assignedDriver.full_name?.charAt(0) || 'C'}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                    Assigned Chauffeur
                  </span>
                  <h3 className="type-card-title truncate text-base mt-0.5">
                    {assignedDriver.profile?.full_name || assignedDriver.full_name || 'Assigned Captain'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {assignedDriver.rating || 5.0}
                    </span>
                    <span className="text-xs text-muted">{assignedDriver.total_rides || 0}+ Rides</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div className="p-4 rounded-2xl bg-surface border border-base space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Assigned Vehicle</span>
                  <span className="font-bold text-primary">
                    {assignedDriver.assigned_vehicle?.make || 'VIP'} {assignedDriver.assigned_vehicle?.model || 'Fleet'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">License Plate</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/30">
                    {assignedDriver.assigned_vehicle?.plate_number || 'KSA-VIP'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Vehicle Type</span>
                  <span className="font-semibold text-secondary uppercase">
                    {assignedDriver.assigned_vehicle?.vehicle_type || selectedBooking.vehicle_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Color</span>
                  <span className="text-secondary">{assignedDriver.assigned_vehicle?.color || 'Obsidian Black'}</span>
                </div>
              </div>

              {/* Direct Passenger Contact Actions */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <a
                  href={`tel:${assignedDriver.profile?.phone || assignedDriver.phone || ''}`}
                  className="py-2.5 px-3 rounded-xl bg-surface hover:bg-elevated text-primary text-xs font-semibold flex items-center justify-center gap-2 border border-base transition-colors shadow-sm"
                >
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Call Captain
                </a>
                <a
                  href={`https://wa.me/${(assignedDriver.profile?.phone || assignedDriver.phone || '').replace(/[^0-9]/g, '')}?text=Salam%20Captain%2C%20I%20am%20passenger%20for%20booking%20${selectedBooking.booking_reference}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 border border-emerald-300 dark:border-emerald-700/50 transition-colors shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-base rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="type-card-title text-sm">Chauffeur Assignment In Queue</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Central dispatch is allocating an executive chauffeur and luxury vehicle for your reservation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fare & Billing Summary Card */}
          <div className="bg-card border border-base rounded-3xl p-6 shadow-xl space-y-5">
            {/* Header: Title + Dynamic Status Badge */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted font-bold block">Fare &amp; Billing</span>
                  <span className="text-[11px] text-muted">Fixed All-Inclusive VIP Rate</span>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${paymentBadge.bg} ${paymentBadge.text}`}
              >
                {paymentBadge.icon}
                {paymentBadge.label}
              </span>
            </div>

            {/* Total Fare Display */}
            <div className="p-4 rounded-2xl bg-surface border border-base flex items-baseline justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted font-bold block">Total Amount</span>
                <div className="type-page-title text-3xl font-extrabold text-primary tracking-tight mt-0.5">
                  {formatCurrency(totalFare, settings.currency)}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                  15% VAT Included
                </span>
                <span className="text-[11px] text-muted block mt-1">ZATCA Standard</span>
              </div>
            </div>

            {/* Rejection Alert Notice (if rejected) */}
            {selectedBooking.payment_rejected_reason && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" /> Payment Verification Notice
                </div>
                <p className="text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
                  {selectedBooking.payment_rejected_reason}
                </p>
              </div>
            )}

            {/* Itemized Fare Breakdown */}
            <div className="p-4 rounded-2xl bg-surface/60 border border-base space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-muted">Base Journey Fare:</span>
                <span className="font-semibold text-primary">{formatCurrency(baseFare, settings.currency)}</span>
              </div>

              {selectedBooking.additional_charges && selectedBooking.additional_charges.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-base/60">
                  {selectedBooking.additional_charges.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-secondary">
                      <span className="text-muted capitalize">
                        {c.charge_type.replace('_', ' ')}:
                      </span>
                      <span className="font-semibold text-amber-500 dark:text-amber-400">
                        +{formatCurrency(c.amount, settings.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {finalFare != null && finalFare !== baseFare && (
                <div className="flex items-center justify-between text-secondary pt-1 border-t border-base/60">
                  <span className="text-muted">Adjusted Final Fare:</span>
                  <span className="font-bold text-primary">{formatCurrency(finalFare, settings.currency)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-secondary pt-1 border-t border-base/60">
                <span className="text-muted">Net Subtotal (excl. VAT):</span>
                <span className="font-medium">{formatCurrency(netSubtotal, settings.currency)}</span>
              </div>

              <div className="flex items-center justify-between text-secondary">
                <span className="text-muted">VAT (15% Included):</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(vatAmount, settings.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-secondary pt-1 border-t border-base/60">
                <span className="text-muted">Payment Method:</span>
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  {paymentMethodLabel}
                </span>
              </div>
            </div>

            {/* Actions: View Slip (if uploaded) & View VAT Invoice */}
            <div className="space-y-2 pt-1">
              {selectedBooking.payment_screenshot_url && (
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-surface hover:bg-elevated text-secondary hover:text-primary text-xs font-semibold flex items-center justify-center gap-2 border border-base transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4 text-emerald-500" />
                  View Payment Slip / Transfer Proof
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowInvoice(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
              >
                <FileText className="w-4 h-4" />
                View Branded VAT Tax Invoice
              </button>
            </div>
          </div>

          {/* 5-Star Rating Modal when trip is completed */}
          {isCompleted && (
            <div className="bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-100/50 dark:from-emerald-950/80 dark:via-slate-900 dark:to-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in text-primary dark:text-white">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Rate Your Journey
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                How was your trip with {assignedDriver?.profile?.full_name || 'your chauffeur'}?
              </h4>

              {ratingSubmitted ? (
                <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-center text-xs text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/40">
                  ✓ Thank you! Your review has been recorded.
                </div>
              ) : (
                <form onSubmit={handleRatingSubmit} className="space-y-3">
                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingVal(star)}
                        className="text-2xl transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= ratingVal
                              ? 'text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Leave a comment for your chauffeur..."
                    className="w-full bg-input border border-base rounded-xl p-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500"
                  />

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-md"
                  >
                    Submit 5-Star Review
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Branded Digital VAT Tax Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-card border border-base rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative print:static print:max-h-none print:w-full print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
            {/* Close Button (hidden during print) */}
            <button
              onClick={() => setShowInvoice(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-surface hover:bg-elevated text-muted hover:text-primary border border-base transition-colors print:hidden"
              aria-label="Close Invoice"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Invoice Top Branding */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-base pb-6 gap-4 pr-10 sm:pr-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-amber-300 font-bold text-xl shadow-lg border border-emerald-400/40">
                  الح
                </div>
                <div>
                  <h3 className="type-card-title text-xl tracking-tight">{settings.company_name || 'Al Harmain Travels'}</h3>
                  <p className="text-xs text-muted mt-0.5">{settings.company_tagline || 'VIP Umrah, Hajj & Executive Transportation'}</p>
                  <p className="text-[11px] text-muted">{settings.address || 'Kingdom of Saudi Arabia'}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs uppercase font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                  Tax Invoice / فاتورة ضريبية
                </span>
                <span className="text-sm font-mono font-bold text-primary block mt-0.5">
                  INV-{selectedBooking.booking_reference.replace(/[^0-9A-Z]/gi, '')}
                </span>
                <p className="text-[11px] text-muted mt-1">
                  Issued: {formatDateTime(selectedBooking.created_at)}
                </p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> ZATCA Standard
                </span>
              </div>
            </div>

            {/* Passenger & Chauffeur Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-surface/40 p-4 rounded-2xl border border-base">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">
                  Billed To / Passenger
                </span>
                <p className="font-bold text-primary text-sm">{selectedBooking.passenger_name}</p>
                <p className="text-muted mt-0.5">{selectedBooking.passenger_phone}</p>
                <p className="text-[11px] text-muted mt-1">
                  Booking Ref: <strong className="font-mono text-primary">{selectedBooking.booking_reference}</strong>
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">
                  Service Chauffeur &amp; Vehicle
                </span>
                <p className="font-bold text-primary text-sm">
                  {assignedDriver?.profile?.full_name || assignedDriver?.full_name || 'Executive Chauffeur'}
                </p>
                <p className="text-muted mt-0.5">
                  {assignedDriver?.assigned_vehicle?.plate_number || 'KSA-VIP'} &bull;{' '}
                  {assignedDriver?.assigned_vehicle?.make || 'VIP'}{' '}
                  {assignedDriver?.assigned_vehicle?.model || 'Fleet'}
                </p>
                <p className="text-[11px] text-muted mt-1 capitalize">
                  Vehicle Class: <strong>{selectedBooking.vehicle_type.replace('_', ' ')}</strong>
                </p>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-base rounded-2xl overflow-hidden text-xs">
              <div className="bg-surface p-3 grid grid-cols-12 font-bold text-muted border-b border-base">
                <span className="col-span-8">Description / الوصف</span>
                <span className="col-span-4 text-right">Amount ({settings.currency})</span>
              </div>
              <div className="divide-y divide-base p-3 space-y-2">
                <div className="grid grid-cols-12 text-secondary">
                  <div className="col-span-8 pr-2">
                    <p className="font-semibold text-primary">VIP Chauffeur Transfer</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {selectedBooking.pickup_address} &rarr; {selectedBooking.destination_address}
                    </p>
                  </div>
                  <span className="col-span-4 text-right font-medium self-center">
                    {formatCurrency(baseFare, settings.currency)}
                  </span>
                </div>

                {selectedBooking.additional_charges?.map((c) => (
                  <div key={c.id} className="grid grid-cols-12 text-secondary pt-2">
                    <span className="col-span-8 text-muted capitalize">
                      {c.charge_type.replace('_', ' ')}: {c.description || 'Highway / Service fee'}
                    </span>
                    <span className="col-span-4 text-right font-medium self-center text-amber-500">
                      +{formatCurrency(c.amount, settings.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & VAT summary */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface/50 border border-base text-xs text-muted w-full sm:w-auto">
                <div className="w-12 h-12 rounded-xl bg-card border border-base flex items-center justify-center text-primary shrink-0">
                  <QrCode className="w-8 h-8 text-secondary" />
                </div>
                <div className="text-[11px]">
                  <p className="font-bold text-primary">ZATCA Compliant E-Invoice</p>
                  <p className="text-muted">Digital cryptographic seal verified</p>
                </div>
              </div>

              <div className="w-full sm:w-72 space-y-2 text-xs bg-surface/60 p-4 rounded-2xl border border-base">
                <div className="flex justify-between text-muted">
                  <span>Subtotal (Net excl. VAT):</span>
                  <span>{formatCurrency(netSubtotal, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>VAT (15% Included):</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(vatAmount, settings.currency)}
                  </span>
                </div>
                <div className="flex justify-between type-card-title border-t border-base pt-2 text-sm">
                  <span className="font-bold">Total Settled:</span>
                  <span className="text-amber-500 dark:text-amber-400 font-extrabold">
                    {formatCurrency(totalFare, settings.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice Footer Actions (hidden on print) */}
            <div className="flex items-center justify-between border-t border-base pt-4 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-surface hover:bg-elevated text-primary text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 border border-base transition-colors"
              >
                <Printer className="w-4 h-4 text-amber-500" /> Print Tax Receipt
              </button>

              <button
                type="button"
                onClick={() => setShowInvoice(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof / Slip Lightbox Modal */}
      {showReceiptModal && selectedBooking?.payment_screenshot_url && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-base rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                <h4 className="type-card-title text-sm">Customer Payment Receipt</h4>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-base bg-black/40 flex items-center justify-center max-h-[65vh]">
              <img
                src={selectedBooking.payment_screenshot_url}
                alt="Payment Slip Proof"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <span>Attached to {selectedBooking.booking_reference}</span>
              <a
                href={selectedBooking.payment_screenshot_url}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
