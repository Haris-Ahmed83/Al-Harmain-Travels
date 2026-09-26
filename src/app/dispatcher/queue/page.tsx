'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { SAUDI_LANDMARKS } from '@/lib/geo';
import { VehicleType, Booking, BookingStatus } from '@/types';
import {
  PhoneCall,
  PlusCircle,
  Search,
  Filter,
  Car,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  Zap,
  X,
  User,
  ShieldAlert,
  ShieldCheck,
  Eye,
  RefreshCw,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { TableSkeletonRows } from '@/components/ui/DataStateSkeletons';
import { toast } from 'sonner';
import { checkDriverOverlap } from '@/lib/assignment-utils';

export default function DispatcherQueuePage() {
  const {
    bookings,
    drivers,
    createBooking,
    confirmBooking,
    verifyPayment,
    rejectPayment,
    assignDriver,
    reassignDriver,
    autoAssignDriver,
    settings,
    isDataLoading,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalBooking, setAssignModalBooking] = useState<Booking | null>(null);
  const [isReassignMode, setIsReassignMode] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  
  // Verification Modal State
  const [verifyModalBooking, setVerifyModalBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('Transaction reference not found in bank statement');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Quick receipt view modal
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form for dispatcher creating booking for call-in customer
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [pickupLm, setPickupLm] = useState(SAUDI_LANDMARKS[0].id);
  const [destLm, setDestLm] = useState(SAUDI_LANDMARKS[2].id);
  const [vType, setVType] = useState<VehicleType>('vip_gmc');
  const [pax, setPax] = useState(2);
  const [notes, setNotes] = useState('');

  const pendingVerificationCount = bookings.filter((b) => b.status === 'pending_verification').length;

  const handlePhoneBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) {
      toast.error('Customer name and phone are required for dispatch.');
      return;
    }

    const p = SAUDI_LANDMARKS.find((l) => l.id === pickupLm) || SAUDI_LANDMARKS[0];
    const d = SAUDI_LANDMARKS.find((l) => l.id === destLm) || SAUDI_LANDMARKS[2];

    const booking = await createBooking({
      passenger_name: custName,
      passenger_phone: custPhone,
      booking_type: 'immediate',
      pickup_address: `${p.name} (${p.city})`,
      pickup_latitude: p.latitude,
      pickup_longitude: p.longitude,
      destination_address: `${d.name} (${d.city})`,
      destination_latitude: d.latitude,
      destination_longitude: d.longitude,
      vehicle_type: vType,
      passenger_count: pax,
      notes: `[Phone Booking via Dispatch] ${notes}`,
    });

    // Auto-verify phone reservation created by staff directly
    await confirmBooking(booking.id);
    await autoAssignDriver(booking.id);
    setModalOpen(false);
    setCustName('');
    setCustPhone('');
    toast.success(`Booking ${booking.booking_reference} registered and auto-dispatched!`);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalBooking || !selectedDriverId) return;

    if (isReassignMode) {
      await reassignDriver(assignModalBooking.id, selectedDriverId);
    } else {
      await assignDriver(assignModalBooking.id, selectedDriverId);
    }

    setAssignModalBooking(null);
    setSelectedDriverId('');
    setIsReassignMode(false);
  };

  const handleVerifySubmit = async () => {
    if (!verifyModalBooking) return;
    await verifyPayment(verifyModalBooking.id);
    setVerifyModalBooking(null);
    setShowRejectForm(false);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModalBooking) return;
    const finalReason = customRejectReason.trim() || rejectReason;
    await rejectPayment(verifyModalBooking.id, finalReason);
    setVerifyModalBooking(null);
    setShowRejectForm(false);
    setCustomRejectReason('');
  };

  const activeFleetDrivers = drivers.filter((d) => d.status !== 'offline');

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.booking_reference.toLowerCase().includes(search.toLowerCase()) ||
      b.passenger_name.toLowerCase().includes(search.toLowerCase()) ||
      b.passenger_phone.includes(search) ||
      b.pickup_address.toLowerCase().includes(search.toLowerCase()) ||
      b.destination_address.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending_verification') return b.status === 'pending_verification';
    if (statusFilter === 'confirmed') return b.status === 'confirmed';
    if (statusFilter === 'assigned') return b.status === 'driver_assigned';
    if (statusFilter === 'active') {
      return (
        b.status === 'driver_accepted' ||
        b.status === 'accepted' ||
        b.status === 'driver_arriving' ||
        b.status === 'on_the_way' ||
        b.status === 'driver_arrived' ||
        b.status === 'arrived' ||
        b.status === 'trip_started' ||
        b.status === 'started' ||
        b.status === 'ride_started'
      );
    }
    if (statusFilter === 'completed') {
      return (
        b.status === 'trip_completed' ||
        b.status === 'ride_completed' ||
        b.status === 'payment_completed' ||
        b.status === 'completed'
      );
    }
    if (statusFilter === 'rejected') {
      return b.status === 'cancelled' || b.status === 'rejected' || b.status === 'payment_rejected';
    }
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending_verification':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Awaiting Verification
          </span>
        );
      case 'payment_rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Payment Rejected
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Confirmed / Ready
          </span>
        );
      case 'driver_assigned':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> Driver Assigned
          </span>
        );
      case 'accepted':
      case 'driver_accepted':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Driver Accepted
          </span>
        );
      case 'on_the_way':
      case 'driver_arriving':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Car className="w-3 h-3" /> On The Way
          </span>
        );
      case 'arrived':
      case 'driver_arrived':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Arrived
          </span>
        );
      case 'started':
      case 'trip_started':
      case 'ride_started':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Car className="w-3 h-3" /> Trip In Progress
          </span>
        );
      case 'completed':
      case 'trip_completed':
      case 'ride_completed':
      case 'payment_completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="page-shell space-y-6">
      {/* Header */}
      <div className="bg-card border border-base p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="type-eyebrow">Staff / Dispatch Operations</span>
          <h1 className="type-page-title mt-1">Bookings Queue &amp; VIP Chauffeur Dispatch</h1>
          <p className="text-xs text-secondary">
            Verify passenger transfer proofs, schedule VIP departures, and assign executive drivers.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <PhoneCall className="w-4 h-4" />
          <span>+ Create Call-In Booking</span>
        </button>
      </div>

      {/* Pending Payment Verification Banner Alert */}
      {pendingVerificationCount > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                {pendingVerificationCount} Booking{pendingVerificationCount > 1 ? 's' : ''} Awaiting Payment Proof Verification
              </h4>
              <p className="text-xs text-amber-400/80">
                Customers have uploaded bank transfer receipts. Verify funds to release bookings for driver assignment.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('pending_verification')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow self-end sm:self-auto shrink-0"
          >
            Review Pending &rarr;
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-card p-1 rounded-2xl border border-base text-xs">
          {[
            { id: 'all', label: 'All' },
            {
              id: 'pending_verification',
              label: `Pending Payment ${pendingVerificationCount > 0 ? `(${pendingVerificationCount})` : ''}`,
              highlight: pendingVerificationCount > 0,
            },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'active', label: 'Active Trips' },
            { id: 'completed', label: 'Completed' },
            { id: 'rejected', label: 'Rejected / Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : tab.highlight
                  ? 'text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative md:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search passenger, phone, ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-input border border-base rounded-xl pl-10 pr-4 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Bookings Queue Table */}
      <div className="bg-card border border-base rounded-3xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs text-secondary">
          <thead className="bg-surface text-secondary uppercase font-bold text-[10px] border-b border-base">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Passenger &amp; Contact</th>
              <th className="p-3">Route (Pickup &rarr; Drop-off)</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment Proof</th>
              <th className="p-3">Assigned Chauffeur</th>
              <th className="p-3 text-right">Fare</th>
              <th className="p-3 text-center">Dispatch Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base">
            {isDataLoading ? (
              <TableSkeletonRows rows={6} cols={9} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted text-xs">
                  No bookings match the specified criteria.
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const assignedDriver =
                  b.driver || (b.assigned_driver_id ? drivers.find((d) => d.id === b.assigned_driver_id) : null);

                return (
                  <tr key={b.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-500 whitespace-nowrap">
                      <div>{b.booking_reference}</div>
                      <span className="text-[10px] text-muted block">{formatDateTime(b.created_at)}</span>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-primary">{b.passenger_name}</p>
                      <a
                        href={`tel:${b.passenger_phone}`}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px]"
                      >
                        {b.passenger_phone}
                      </a>
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="line-clamp-1 font-medium text-primary">{b.pickup_address}</p>
                      <p className="line-clamp-1 text-muted text-[11px]">&rarr; {b.destination_address}</p>
                      {b.notes && (
                        <p className="text-[10px] text-muted italic line-clamp-1 mt-0.5">Note: {b.notes}</p>
                      )}
                    </td>
                    <td className="p-3 uppercase text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {b.vehicle_type?.replace('_', ' ') || 'Sedan'}
                    </td>
                    <td className="p-3 whitespace-nowrap">{getStatusBadge(b.status)}</td>
                    <td className="p-3 whitespace-nowrap">
                      {b.payment_screenshot_url ? (
                        <button
                          type="button"
                          onClick={() => setViewScreenshotUrl(b.payment_screenshot_url!)}
                          className="px-2 py-1 bg-card hover:bg-card-hover border border-base rounded-lg text-[11px] text-amber-400 flex items-center gap-1 font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View Proof
                        </button>
                      ) : (
                        <span className="text-muted text-[11px] italic">No receipt</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {assignedDriver ? (
                        <div>
                          <span className="text-primary font-bold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            {assignedDriver.profile?.full_name || assignedDriver.full_name || 'Assigned Driver'}
                          </span>
                          <span className="text-[10px] text-muted block">
                            {assignedDriver.vehicle?.model || assignedDriver.assigned_vehicle?.model || 'Fleet Vehicle'} &bull;{' '}
                            {assignedDriver.vehicle?.plate_number || assignedDriver.assigned_vehicle?.plate_number || 'VIP'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold tabular-nums text-primary whitespace-nowrap">
                      {formatCurrency(b.final_fare || b.estimated_fare, settings.currency)}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Step 1: Payment Verification Action */}
                        {b.status === 'pending_verification' && (
                          <button
                            onClick={() => {
                              setVerifyModalBooking(b);
                              setShowRejectForm(false);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition-colors flex items-center gap-1"
                            title="Verify or Reject Payment Proof"
                          >
                            <ShieldAlert className="w-3 h-3" /> Review Payment
                          </button>
                        )}

                        {/* Step 2: Driver Assignment Action (after verification / confirmed) */}
                        {b.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => {
                                setAssignModalBooking(b);
                                setIsReassignMode(false);
                                setSelectedDriverId(activeFleetDrivers[0]?.id || '');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors flex items-center gap-1"
                              title="Assign an available driver"
                            >
                              <UserCheck className="w-3 h-3" /> Assign Driver
                            </button>
                            <button
                              onClick={() => autoAssignDriver(b.id)}
                              className="p-1 rounded-lg text-[11px] bg-surface hover:bg-amber-500 hover:text-slate-950 text-amber-500 border border-base transition-colors"
                              title="Auto-match nearest available driver"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Step 3: Driver Reassignment Action */}
                        {b.status === 'driver_assigned' && (
                          <button
                            onClick={() => {
                              setAssignModalBooking(b);
                              setIsReassignMode(true);
                              setSelectedDriverId(activeFleetDrivers[0]?.id || '');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-card hover:bg-card-hover border border-base text-secondary hover:text-primary transition-colors flex items-center gap-1"
                            title="Reassign to a different chauffeur"
                          >
                            <RefreshCw className="w-3 h-3 text-cyan-400" /> Reassign
                          </button>
                        )}

                        {/* Status detail when already active */}
                        {b.status !== 'pending_verification' &&
                          b.status !== 'confirmed' &&
                          b.status !== 'driver_assigned' && (
                            <span className="text-[11px] text-muted italic">In Progress / Logged</span>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Proof Verification Modal */}
      {verifyModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-base rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="type-card-title">Verify Bank Transfer Proof</h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModalBooking(null)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Booking Summary */}
            <div className="bg-surface p-3.5 rounded-2xl border border-base space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Booking Reference:</span>
                <span className="font-mono font-bold text-amber-400">
                  {verifyModalBooking.booking_reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Passenger:</span>
                <span className="font-bold text-primary">
                  {verifyModalBooking.passenger_name} ({verifyModalBooking.passenger_phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Route:</span>
                <span className="text-primary truncate max-w-[280px]">
                  {verifyModalBooking.pickup_address} &rarr; {verifyModalBooking.destination_address}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-base">
                <span className="text-muted font-semibold">Expected Fare:</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatCurrency(
                    verifyModalBooking.final_fare || verifyModalBooking.estimated_fare,
                    settings.currency
                  )}
                </span>
              </div>
            </div>

            {/* Uploaded Screenshot Preview */}
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                Uploaded Payment Screenshot / Receipt:
              </label>
              {verifyModalBooking.payment_screenshot_url ? (
                <div className="rounded-2xl overflow-hidden border border-base bg-black/40 max-h-72 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={verifyModalBooking.payment_screenshot_url}
                    alt="Customer Payment Receipt"
                    className="max-h-64 w-auto object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="p-4 bg-muted/20 border border-base rounded-2xl text-center text-xs text-muted">
                  No screenshot uploaded by customer.
                </div>
              )}
            </div>

            {/* Action Buttons or Reject Form */}
            {!showRejectForm ? (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Proof
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyModalBooking(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface text-secondary hover:bg-card-hover transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifySubmit}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Verify &amp; Confirm Booking
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRejectSubmit} className="space-y-3 pt-2 border-t border-base">
                <div className="space-y-1 text-xs">
                  <label className="text-secondary font-bold text-rose-400">
                    Reason for Payment Proof Rejection:
                  </label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-rose-500"
                  >
                    <option value="Transaction reference not found in bank statement">
                      Transaction reference not found in bank statement
                    </option>
                    <option value="Transferred amount does not match booking total fare">
                      Transferred amount does not match booking total fare
                    </option>
                    <option value="Screenshot is blurred, unreadable, or missing transaction ID">
                      Screenshot is blurred, unreadable, or missing transaction ID
                    </option>
                    <option value="Account name or timestamp does not match booking details">
                      Account name or timestamp does not match booking details
                    </option>
                    <option value="other">Other reason (specify below)</option>
                  </select>
                </div>

                {rejectReason === 'other' && (
                  <div className="space-y-1 text-xs">
                    <label className="text-secondary font-semibold">Custom Explanation</label>
                    <input
                      type="text"
                      required
                      value={customRejectReason}
                      onChange={(e) => setCustomRejectReason(e.target.value)}
                      placeholder="Enter specific reason for rejection..."
                      className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-muted hover:text-primary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Manual Driver Assignment & Reassignment Modal */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAssignSubmit}
            className="bg-card border border-base rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-500" />
                <h3 className="type-card-title">
                  {isReassignMode ? 'Reassign VIP Chauffeur' : 'Assign Available VIP Chauffeur'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalBooking(null)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 bg-surface p-3 rounded-xl border border-base">
              <div>
                <span className="text-muted">Booking: </span>
                <span className="text-amber-500 font-bold">{assignModalBooking.booking_reference}</span>
              </div>
              <div>
                <span className="text-muted">Route: </span>
                <span className="text-primary">
                  {assignModalBooking.pickup_address} &rarr; {assignModalBooking.destination_address}
                </span>
              </div>
              <div>
                <span className="text-muted">Vehicle Class Required: </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  {assignModalBooking.vehicle_type?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                Select Fleet Chauffeur ({activeFleetDrivers.length} on duty)
              </label>
              {activeFleetDrivers.length === 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  No chauffeurs are currently on duty in the fleet pool.
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full bg-input border border-base rounded-xl px-3 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500"
                  >
                    {activeFleetDrivers.map((d) => {
                      const conflict = assignModalBooking
                        ? checkDriverOverlap(
                            bookings.filter((bk) => bk.assigned_driver_id === d.id),
                            assignModalBooking
                          )
                        : { hasOverlap: false };
                      const activeAssignedCount = bookings.filter(
                        (bk) =>
                          bk.assigned_driver_id === d.id &&
                          bk.status !== 'cancelled' &&
                          bk.status !== 'completed' &&
                          bk.status !== 'trip_completed'
                      ).length;

                      return (
                        <option key={d.id} value={d.id}>
                          {conflict.hasOverlap ? '⚠️ [CONFLICT] ' : ''}
                          {d.profile?.full_name || d.full_name || 'Captain'} &bull;{' '}
                          {d.vehicle?.make || d.assigned_vehicle?.make || 'Fleet'} (
                          {d.vehicle?.plate_number || d.assigned_vehicle?.plate_number || 'VIP'})
                          {activeAssignedCount > 0 ? ` [${activeAssignedCount} trips booked]` : ' [Free schedule]'}
                        </option>
                      );
                    })}
                  </select>

                  {/* Overlap schedule conflict warning */}
                  {(() => {
                    if (!assignModalBooking || !selectedDriverId) return null;
                    const conflict = checkDriverOverlap(
                      bookings.filter((bk) => bk.assigned_driver_id === selectedDriverId),
                      assignModalBooking
                    );
                    if (!conflict.hasOverlap) return null;
                    return (
                      <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Schedule Collision Detected
                        </div>
                        <p>{conflict.message}</p>
                        <p className="text-[11px] text-rose-400/80">
                          Overlapping assignments for the same chauffeur are prevented. Please select another chauffeur.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface text-secondary hover:bg-elevated hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !selectedDriverId ||
                  activeFleetDrivers.length === 0 ||
                  Boolean(
                    assignModalBooking &&
                      selectedDriverId &&
                      checkDriverOverlap(
                        bookings.filter((bk) => bk.assigned_driver_id === selectedDriverId),
                        assignModalBooking
                      ).hasOverlap
                  )
                }
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow transition-all"
              >
                {isReassignMode ? 'Confirm Reassignment' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick View Screenshot Modal */}
      {viewScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-base rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Customer Payment Proof
              </div>
              <button
                onClick={() => setViewScreenshotUrl(null)}
                className="p-1 rounded-lg hover:bg-card-hover text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-base bg-black/40 flex items-center justify-center max-h-[480px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewScreenshotUrl}
                alt="Payment Receipt Screenshot"
                className="w-full h-auto object-contain max-h-[450px]"
              />
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <a
                href={viewScreenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Open full resolution &rarr;
              </a>
              <button
                onClick={() => setViewScreenshotUrl(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-muted-surface hover:bg-card-hover border border-base text-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telephone Booking Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handlePhoneBooking}
            className="bg-card border border-base rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-base pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-500" />
                <h3 className="type-card-title">Telephone Booking (Staff Dispatch)</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-secondary font-semibold">Caller Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Sheikh Salem"
                  className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-secondary font-semibold">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="+966 5X XXX XXXX"
                  className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-secondary font-semibold">Pickup Location</label>
              <select
                value={pickupLm}
                onChange={(e) => setPickupLm(e.target.value)}
                className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
              >
                {SAUDI_LANDMARKS.map((l) => (
                  <option key={`p-${l.id}`} value={l.id}>
                    {l.city}: {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-secondary font-semibold">Destination</label>
              <select
                value={destLm}
                onChange={(e) => setDestLm(e.target.value)}
                className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
              >
                {SAUDI_LANDMARKS.map((l) => (
                  <option key={`d-${l.id}`} value={l.id}>
                    {l.city}: {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-secondary font-semibold">Vehicle Class</label>
                <select
                  value={vType}
                  onChange={(e) => setVType(e.target.value as VehicleType)}
                  className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
                >
                  <option value="vip_gmc">VIP GMC Yukon XL</option>
                  <option value="suv">Family SUV</option>
                  <option value="sedan">Executive Sedan</option>
                  <option value="van">Royal Van</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-secondary font-semibold">Passenger Count</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={pax}
                  onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                  className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-secondary font-semibold">Dispatch Notes / Flight Info</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Terminal details, luggage count..."
                className="w-full bg-input border border-base rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface text-secondary hover:bg-elevated hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Create &amp; Dispatch
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
