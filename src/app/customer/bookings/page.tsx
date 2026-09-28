'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Booking, BookingStatus } from '@/types';
import {
  Clock,
  Calendar,
  MapPin,
  Car,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Navigation,
  FileText,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  UserCheck,
  Phone,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerBookingsPage() {
  const { bookings, cancelBooking, settings, currentUser, userRole, drivers, isDataLoading, uploadCustomerPaymentProof } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cancelModalBookingId, setCancelModalBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Change of travel plan');
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [paymentUploadBooking, setPaymentUploadBooking] = useState<Booking | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const userBookings = useMemo(() => {
    const raw =
      userRole === 'admin'
        ? bookings
        : bookings.filter(
            (b) =>
              (currentUser?.id && b.customer_id === currentUser.id) ||
              (currentUser?.phone && b.passenger_phone === currentUser.phone)
          );

    const seen = new Set<string>();
    return raw.filter((b) => {
      const key = b.id || b.booking_reference;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [bookings, currentUser?.id, currentUser?.phone, userRole]);

  const filteredBookings = userBookings.filter((b) => {
    const isCompleted =
      b.status === 'trip_completed' ||
      b.status === 'ride_completed' ||
      b.status === 'payment_completed' ||
      b.status === 'completed';
    const isCancelledOrRejected =
      b.status === 'cancelled' || b.status === 'rejected' || b.status === 'payment_rejected';

    const matchesFilter =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? !isCompleted && !isCancelledOrRejected
        : filterStatus === 'completed'
        ? isCompleted
        : isCancelledOrRejected;

    const matchesSearch =
      b.booking_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.destination_address.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleConfirmCancel = async () => {
    if (!cancelModalBookingId) return;
    await cancelBooking(cancelModalBookingId, cancelReason);
    setCancelModalBookingId(null);
    toast.info('Booking has been cancelled.');
  };

  const handleUploadPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentUploadBooking || !uploadFile) return;
    setIsUploading(true);
    try {
      await uploadCustomerPaymentProof(paymentUploadBooking.id, uploadFile);
      setPaymentUploadBooking(null);
      setUploadFile(null);
    } catch {
      toast.error('Failed to upload payment receipt.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending_review: {
        bg: 'bg-amber-500/15 border-amber-500/40',
        text: 'text-amber-700 dark:text-amber-300',
        label: 'Awaiting Dispatcher Review',
      },
      pending_verification: {
        bg: 'bg-amber-500/15 border-amber-500/40',
        text: 'text-amber-700 dark:text-amber-300',
        label: 'Awaiting Payment Verification',
      },
      payment_rejected: {
        bg: 'bg-rose-500/15 border-rose-500/40',
        text: 'text-rose-700 dark:text-rose-300',
        label: 'Payment Proof Rejected',
      },
      payment_verified: {
        bg: 'bg-blue-500/15 border-blue-500/40',
        text: 'text-blue-700 dark:text-blue-300',
        label: 'Payment Verified',
      },
      confirmed: {
        bg: 'bg-sky-500/15 border-sky-500/40',
        text: 'text-sky-700 dark:text-sky-300',
        label: 'Booking Confirmed',
      },
      driver_assigned: {
        bg: 'bg-teal-500/15 border-teal-500/40',
        text: 'text-teal-700 dark:text-teal-300',
        label: 'Captain Assigned',
      },
      accepted: {
        bg: 'bg-indigo-500/15 border-indigo-500/40',
        text: 'text-indigo-700 dark:text-indigo-300',
        label: 'Captain Accepted',
      },
      driver_accepted: {
        bg: 'bg-indigo-500/15 border-indigo-500/40',
        text: 'text-indigo-700 dark:text-indigo-300',
        label: 'Captain Accepted',
      },
      on_the_way: {
        bg: 'bg-emerald-500/15 border-emerald-500/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        label: 'Captain On The Way',
      },
      driver_arriving: {
        bg: 'bg-emerald-500/15 border-emerald-500/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        label: 'Captain Arriving',
      },
      arrived: {
        bg: 'bg-cyan-500/15 border-cyan-500/40',
        text: 'text-cyan-700 dark:text-cyan-300',
        label: 'Captain Arrived',
      },
      driver_arrived: {
        bg: 'bg-cyan-500/15 border-cyan-500/40',
        text: 'text-cyan-700 dark:text-cyan-300',
        label: 'Captain Arrived',
      },
      started: {
        bg: 'bg-purple-500/15 border-purple-500/40',
        text: 'text-purple-700 dark:text-purple-300',
        label: 'Trip In Progress',
      },
      trip_started: {
        bg: 'bg-purple-500/15 border-purple-500/40',
        text: 'text-purple-700 dark:text-purple-300',
        label: 'Trip In Progress',
      },
      ride_started: {
        bg: 'bg-purple-500/15 border-purple-500/40',
        text: 'text-purple-700 dark:text-purple-300',
        label: 'Trip In Progress',
      },
      completed: {
        bg: 'bg-emerald-500/20 border-emerald-500/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        label: 'Trip Completed',
      },
      trip_completed: {
        bg: 'bg-emerald-500/20 border-emerald-500/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        label: 'Trip Completed',
      },
      ride_completed: {
        bg: 'bg-emerald-500/20 border-emerald-500/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        label: 'Trip Completed',
      },
      payment_completed: {
        bg: 'bg-emerald-500/20 border-emerald-500/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        label: 'Completed & Paid',
      },
      cancelled: {
        bg: 'bg-rose-500/15 border-rose-500/40',
        text: 'text-rose-700 dark:text-rose-300',
        label: 'Cancelled',
      },
      rejected: {
        bg: 'bg-rose-500/15 border-rose-500/40',
        text: 'text-rose-700 dark:text-rose-300',
        label: 'Rejected',
      },
      pending: {
        bg: 'bg-amber-500/15 border-amber-500/40',
        text: 'text-amber-700 dark:text-amber-300',
        label: 'Pending Review',
      },
    };

    const current = map[status] || {
      bg: 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      label: status.replace(/_/g, ' '),
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${current.bg} ${current.text}`}>
        {current.label}
      </span>
    );
  };

  return (
    <div className="page-shell space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-base p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="type-page-title">My VIP Rides & Bookings</h2>
          <p className="type-muted mt-0.5">
            Track verification progress, driver assignments, and booking receipts.
          </p>
        </div>

        <Link
          href="/customer"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
        >
          + Request New Ride
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search booking ref, airport, or hotel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-input border border-base rounded-xl pl-10 pr-4 py-2.5 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-none shrink-0">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active / Pending' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled / Rejected' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-card text-secondary hover:text-primary hover:bg-elevated border border-base'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {isDataLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-card border border-base p-5 rounded-3xl shadow-xl space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between border-b border-base/60 pb-3">
                <div className="h-4 w-36 bg-surface rounded-md" />
                <div className="h-4 w-24 bg-surface rounded-full" />
              </div>
              <div className="space-y-2 py-2">
                <div className="h-3.5 w-3/4 bg-surface rounded-md" />
                <div className="h-3.5 w-1/2 bg-surface rounded-md" />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-base/60">
                <div className="h-4 w-20 bg-surface rounded-md" />
                <div className="h-4 w-16 bg-surface rounded-md" />
              </div>
            </div>
          ))
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center bg-card border border-base rounded-3xl space-y-3">
            <Car className="w-10 h-10 text-muted mx-auto" />
            <h4 className="text-base font-bold text-primary">No Bookings Found</h4>
            <p className="text-xs text-muted">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters or search keyword.'
                : "You haven't requested any rides yet."}
            </p>
          </div>
        ) : (
          filteredBookings.map((b, idx) => {
            const assignedDriver =
              b.driver ||
              (b.assigned_driver_id ? drivers.find((d) => d.id === b.assigned_driver_id) : undefined);

            const canCancel =
              b.status === 'pending_verification' ||
              b.status === 'pending' ||
              b.status === 'confirmed';

            return (
              <div
                key={b.id ? `booking-${b.id}` : `booking-ref-${b.booking_reference || idx}`}
                className="bg-card border border-base hover:border-strong p-5 sm:p-6 rounded-3xl shadow-xl transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                      {b.booking_reference}
                    </span>
                    <span className="text-xs text-muted">&bull; {formatDateTime(b.created_at)}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                      {b.vehicle_type?.replace('_', ' ') || 'Sedan'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      b.booking_method === 'custom'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    }`}>
                      {b.booking_method === 'custom' ? 'Custom Route' : 'Fixed Fare'}
                    </span>
                    {b.trip_type === 'round_trip' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                        Round Trip
                      </span>
                    )}
                    {b.scheduled_at && (
                      <span className="text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Scheduled: {formatDateTime(b.scheduled_at)}
                      </span>
                    )}
                    {b.return_scheduled_at && (
                      <span className="text-[10px] font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Return: {formatDateTime(b.return_scheduled_at)}
                      </span>
                    )}
                  </div>
                  <div>{getStatusBadge(b.status)}</div>
                </div>

                {/* Status Notice Banners */}
                {b.status === 'pending_review' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Awaiting Dispatcher Review:</span> Your custom itinerary has been received. Our operations dispatcher will contact you shortly via phone / WhatsApp (<strong className="text-primary">{b.passenger_phone}</strong>) to confirm vehicle availability, quote the fare, and provide payment details.
                    </div>
                  </div>
                )}

                {b.status === 'pending_verification' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Payment Under Dispatch Verification:</span> Our staff is validating your transferred funds proof. Once confirmed, an executive captain will be assigned to your route.
                    </div>
                  </div>
                )}

                {b.status === 'payment_rejected' && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Payment Proof Rejected:</span>{' '}
                      {b.payment_rejected_reason || 'Bank reference could not be verified by dispatch.'} Please reach out to customer dispatch support or submit a new booking with clear proof.
                    </div>
                  </div>
                )}

                {/* Assigned Captain Banner if Driver Assigned */}
                {assignedDriver && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        {assignedDriver.full_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="font-bold text-primary flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Assigned Captain: {assignedDriver.full_name}
                        </div>
                        <div className="text-muted text-[11px]">
                          {assignedDriver.vehicle?.make} {assignedDriver.vehicle?.model} &bull; Plate: {assignedDriver.vehicle?.license_plate || 'VIP KSA'}
                        </div>
                      </div>
                    </div>
                    {assignedDriver.phone && (
                      <a
                        href={`tel:${assignedDriver.phone}`}
                        className="text-xs px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-bold transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Captain
                      </a>
                    )}
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-secondary">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-primary">Pickup:</strong> {b.pickup_address}
                      </span>
                    </div>

                    {/* Intermediate Stops */}
                    {b.intermediate_stops && b.intermediate_stops.length > 0 && (
                      <div className="space-y-1.5 pl-3 border-l-2 border-dashed border-cyan-500/40 my-1.5">
                        <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block">
                          Intermediate Stops ({b.intermediate_stops.length}):
                        </span>
                        {b.intermediate_stops.map((stop, i) => (
                          <div key={stop.id || i} className="flex items-start gap-1.5 text-secondary text-[11px]">
                            <span className="w-4 h-4 rounded-full bg-cyan-500/15 text-cyan-500 text-[9px] font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span>{stop.address}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-secondary">
                      <Navigation className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-primary">Dropoff:</strong> {b.destination_address}
                      </span>
                    </div>
                    {b.special_instructions && (
                      <div className="text-muted text-[11px] bg-surface/70 p-2.5 rounded-xl border border-base">
                        <strong className="text-secondary">Notes:</strong> {b.special_instructions}
                      </div>
                    )}
                    {b.dispatcher_notes && (
                      <div className="text-[11px] bg-amber-500/10 text-amber-800 dark:text-amber-200 p-2.5 rounded-xl border border-amber-500/30">
                        <strong>Dispatcher Note:</strong> {b.dispatcher_notes}
                      </div>
                    )}
                    {b.cancellation_reason && (
                      <div className="text-rose-700 dark:text-rose-300 text-[11px] bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/30">
                        <strong>Cancellation Reason:</strong> {b.cancellation_reason}
                      </div>
                    )}
                  </div>

                  {/* Pricing and Actions */}
                  <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col items-start sm:items-end justify-between gap-3 text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-base">
                    <div>
                      <span className="text-xs text-muted block">Total Fare</span>
                      {b.booking_method === 'custom' && !b.confirmed_fare && !b.final_fare ? (
                        <div className="flex flex-col sm:items-end">
                          <span className="text-xs font-bold text-amber-500 italic bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 inline-block">
                            To be confirmed by dispatcher
                          </span>
                          <span className="text-[10px] text-muted mt-0.5">Quotation pending review</span>
                        </div>
                      ) : (
                        <div>
                          <span className="type-card-title text-xl font-black text-amber-600 dark:text-amber-400">
                            {formatCurrency(b.confirmed_fare || b.final_fare || b.estimated_fare, settings.currency)}
                          </span>
                          {b.confirmed_fare && (
                            <span className="text-[9px] uppercase font-bold text-emerald-500 block">
                              Dispatcher Confirmed
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end w-full sm:w-auto">
                      {b.payment_screenshot_url ? (
                        <button
                          type="button"
                          onClick={() => setViewReceiptUrl(b.payment_screenshot_url!)}
                          className="bg-surface hover:bg-elevated border border-base text-secondary hover:text-primary text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" /> Payment Proof
                        </button>
                      ) : (b.confirmed_fare || b.final_fare) && b.status !== 'cancelled' && b.status !== 'rejected' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentUploadBooking(b);
                            setUploadFile(null);
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" /> Upload Payment Proof
                        </button>
                      ) : null}

                      {b.status !== 'cancelled' &&
                        b.status !== 'payment_completed' &&
                        b.status !== 'payment_rejected' &&
                        b.status !== 'pending_verification' &&
                        b.status !== 'pending_review' && (
                          <Link
                            href={`/customer/track?ref=${encodeURIComponent(b.booking_reference)}`}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Live Radar
                          </Link>
                        )}

                      {canCancel && (
                        <button
                          onClick={() => setCancelModalBookingId(b.id)}
                          className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50 text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Proof View Modal */}
      {viewReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-base rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Payment Proof
              </div>
              <button
                onClick={() => setViewReceiptUrl(null)}
                className="p-1.5 rounded-xl hover:bg-elevated text-muted hover:text-primary transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-base bg-surface flex items-center justify-center max-h-[480px] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewReceiptUrl}
                alt="Payment Receipt Screenshot"
                className="w-full h-auto object-contain max-h-[440px] rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <a
                href={viewReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Open in new tab &rarr;
              </a>
              <button
                onClick={() => setViewReceiptUrl(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-surface hover:bg-elevated border border-base text-primary cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalBookingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-base rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-primary">Confirm Cancellation</h3>
            <p className="text-xs text-muted">
              Are you sure you want to cancel this booking? Cancellation policy applies.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs text-secondary font-semibold">Cancellation Reason (BR-07)</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-input border border-base rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500"
              >
                <option value="Change of travel plan">Change of travel plan</option>
                <option value="Flight delayed / rescheduled">Flight delayed / rescheduled</option>
                <option value="Booked by mistake">Booked by mistake</option>
                <option value="Found alternative transport">Found alternative transport</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                onClick={() => setCancelModalBookingId(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-elevated border border-base transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow transition-colors cursor-pointer"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Payment Proof Modal */}
      {paymentUploadBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-base rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div>
                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Upload Payment Receipt
                </h3>
                <p className="text-[11px] text-muted">
                  Booking Ref: <strong className="text-amber-500 font-mono">{paymentUploadBooking.booking_reference}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentUploadBooking(null)}
                className="p-1 rounded-xl text-muted hover:text-primary hover:bg-elevated cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-surface rounded-2xl border border-base space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Confirmed Fare:</span>
                <strong className="text-emerald-500 font-black">
                  {formatCurrency(paymentUploadBooking.confirmed_fare || paymentUploadBooking.final_fare || 0, settings.currency)}
                </strong>
              </div>
              {paymentUploadBooking.dispatcher_notes && (
                <div className="text-[11px] text-secondary pt-1 border-t border-base/50">
                  <span className="text-muted">Payment note: </span>
                  {paymentUploadBooking.dispatcher_notes}
                </div>
              )}
            </div>

            <form onSubmit={handleUploadPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary mb-1.5">
                  Select Transfer Screenshot / Receipt (PNG, JPG, WebP)
                </label>
                <input
                  type="file"
                  required
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setUploadFile(f);
                  }}
                  className="w-full text-xs text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentUploadBooking(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-elevated border border-base transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? 'Uploading…' : 'Submit Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

