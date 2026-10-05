'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Booking } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Car,
  Users,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Settings,
  Briefcase,
  UserCheck,
  FileText,
  Search,
  X,
  Eye,
  ExternalLink,
  Receipt,
  MapPin,
  RefreshCw,
  Phone,
  Plane,
  Calendar,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
  AdminActionButton,
  AdminActionGroup,
  AdminTableCard,
} from '@/components/admin/AdminUIComponents';
import { TableSkeletonRows } from '@/components/ui/DataStateSkeletons';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const { bookings, drivers, vehicles, usersList, settings, isDataLoading, refreshData } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Metrics
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const activeTrips = bookings.filter(
    (b) =>
      b.status === 'driver_assigned' ||
      b.status === 'driver_accepted' ||
      b.status === 'driver_arriving' ||
      b.status === 'driver_arrived' ||
      b.status === 'trip_started' ||
      b.status === 'ride_started'
  ).length;
  const completedTrips = bookings.filter(
    (b) => b.status === 'trip_completed' || b.status === 'ride_completed' || b.status === 'payment_completed'
  ).length;
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length;

  const totalCustomers = usersList.filter((u) => u.role === 'customer').length;
  const totalStaff = usersList.filter((u) => u.role === 'dispatcher').length;
  const totalDrivers = drivers.length;

  const totalRevenue = bookings
    .filter((b) => b.status === 'trip_completed' || b.status === 'ride_completed' || b.status === 'payment_completed')
    .reduce((sum, b) => sum + (b.final_fare || b.estimated_fare || 0), 0);

  const availableDrivers = drivers.filter((d) => d.status === 'available').length;

  // Filtered Bookings for the overview table
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active_trips') {
          const isActive =
            b.status === 'driver_assigned' ||
            b.status === 'driver_accepted' ||
            b.status === 'driver_arriving' ||
            b.status === 'driver_arrived' ||
            b.status === 'trip_started' ||
            b.status === 'ride_started';
          if (!isActive) return false;
        } else if (statusFilter === 'completed') {
          const isDone =
            b.status === 'trip_completed' ||
            b.status === 'ride_completed' ||
            b.status === 'payment_completed';
          if (!isDone) return false;
        } else if (b.status !== statusFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchRef = b.booking_reference?.toLowerCase().includes(q);
        const matchName = b.passenger_name?.toLowerCase().includes(q);
        const matchPhone = b.passenger_phone?.includes(q);
        const matchPickup = b.pickup_address?.toLowerCase().includes(q);
        const matchDest = b.destination_address?.toLowerCase().includes(q);
        const matchVeh = b.vehicle_type?.toLowerCase().includes(q);
        return matchRef || matchName || matchPhone || matchPickup || matchDest || matchVeh;
      }

      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast.success('Admin headquarters data synchronized.');
    } catch {
      toast.error('Failed to sync live data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="page-shell space-y-8 animate-pulse">
        <div className="bg-card border border-base p-8 rounded-3xl h-32" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-card border border-base h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-card border border-base h-40" />
          ))}
        </div>
        <div className="bg-card border border-base rounded-3xl p-6 h-72" />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-8">
      {/* ── 1. Top Executive Banner ────────────────────────────────────────── */}
      <AdminPageHeader
        eyebrow="Executive Headquarters"
        badge="Single Authority Admin"
        title="Al Harmain Management Dashboard"
        description="Comprehensive real-time oversight of verified pilgrims, chauffeur operations, staff dispatchers, and sacred journey finances."
      >
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-surface hover:bg-elevated border border-base text-secondary hover:text-primary transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          title="Refresh headquarters data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          <span>Sync Data</span>
        </button>

        <Link
          href="/admin/users"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>Manage Users</span>
        </Link>
      </AdminPageHeader>

      {/* ── 2. Primary 8 KPI Metric Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <AdminStatCard
          title="Total Customers"
          value={totalCustomers}
          subtitle="Verified Pilgrims"
          icon={<Users className="w-4.5 h-4.5" />}
          tone="green"
        />

        {/* Total Drivers */}
        <AdminStatCard
          title="Active Drivers"
          value={totalDrivers}
          subtitle={`${availableDrivers} Available Now`}
          icon={<Car className="w-4.5 h-4.5" />}
          tone="amber"
        />

        {/* Total Staff */}
        <AdminStatCard
          title="Staff Dispatchers"
          value={totalStaff}
          subtitle="Active Control Room"
          icon={<ShieldCheck className="w-4.5 h-4.5" />}
          tone="blue"
        />

        {/* Pending Bookings */}
        <AdminStatCard
          title="Pending Bookings"
          value={pendingBookings}
          subtitle="Awaiting Confirmation"
          icon={<Clock className="w-4.5 h-4.5" />}
          tone="amber"
        />

        {/* Confirmed Bookings */}
        <AdminStatCard
          title="Confirmed Bookings"
          value={confirmedBookings}
          subtitle="Ready for Driver Match"
          icon={<CheckCircle2 className="w-4.5 h-4.5" />}
          tone="blue"
        />

        {/* Active Trips */}
        <AdminStatCard
          title="Active Trips"
          value={activeTrips}
          subtitle="En Route on Saudi Roads"
          icon={<TrendingUp className="w-4.5 h-4.5" />}
          tone="purple"
        />

        {/* Completed Trips */}
        <AdminStatCard
          title="Completed Trips"
          value={completedTrips}
          subtitle="Safely Arrived"
          icon={<CheckCircle2 className="w-4.5 h-4.5" />}
          tone="green"
        />

        {/* Cancelled Bookings */}
        <AdminStatCard
          title="Cancelled Bookings"
          value={cancelledBookings}
          subtitle="Discontinued Trips"
          icon={<XCircle className="w-4.5 h-4.5" />}
          tone="red"
        />
      </div>

      {/* ── 3. Revenue & Fleet Operational Overview ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 sm:p-7 rounded-3xl bg-card border border-base shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="type-eyebrow text-emerald-600 dark:text-emerald-400 font-bold">Financial Gross</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-primary font-sans tracking-tight">
            {formatCurrency(totalRevenue, settings.currency)}
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Total settled pilgrimage fares including base tariffs, highway distance, and 15% KSA VAT reconciliation.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/reports"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View Full Financial Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-6 sm:p-7 rounded-3xl bg-card border border-base shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="type-eyebrow text-amber-600 dark:text-amber-400 font-bold">Chauffeur Availability</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-primary font-sans tracking-tight">
            {availableDrivers} / {totalDrivers} Ready
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Licensed chauffeurs available for instant dispatch in Makkah, Madinah, and King Abdulaziz Airport (Jeddah).
          </p>
          <div className="pt-2">
            <Link
              href="/admin/users"
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Inspect Chauffeur Roster</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-6 sm:p-7 rounded-3xl bg-card border border-base shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="type-eyebrow text-sky-600 dark:text-sky-400 font-bold">Licensed Vehicles</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-primary font-sans tracking-tight">
            {vehicles.length} Licensed Vehicles
          </div>
          <p className="text-xs text-muted leading-relaxed">
            VIP GMC Yukon Denalis, Mercedes sedans, family SUVs, and HiAce commercial vans under MOT regulation.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/rates"
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Tariff &amp; Vehicle Rates</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. Global Bookings Management Section ──────────────────────────── */}
      <AdminTableCard
        title="Global Bookings Registry"
        subtitle="Complete cross-role reservation log with live status tracking and passenger details"
        badge={`${filteredBookings.length} Bookings`}
        headerAction={
          <Link
            href="/dispatcher/queue"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 transition-colors"
          >
            <span>Dispatcher Live Queue</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        }
        footer={
          <>
            <div>
              Showing <span className="font-bold text-primary">{filteredBookings.length}</span> of{' '}
              <span className="font-bold text-primary">{bookings.length}</span> total reservations
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending ({pendingBookings})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Confirmed ({confirmedBookings})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Active ({activeTrips})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed ({completedTrips})
              </span>
            </div>
          </>
        }
      >
        {/* Search & Filter Pills Toolbar */}
        <div className="p-4 border-b border-base bg-surface/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All (${bookings.length})` },
              { id: 'pending', label: `Pending (${pendingBookings})` },
              { id: 'confirmed', label: `Confirmed (${confirmedBookings})` },
              { id: 'active_trips', label: `Active Trips (${activeTrips})` },
              { id: 'completed', label: `Completed (${completedTrips})` },
              { id: 'cancelled', label: `Cancelled (${cancelledBookings})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-card text-secondary hover:text-primary hover:bg-elevated border border-base'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, passenger, route..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input border border-base rounded-xl pl-10 pr-8 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bookings Table */}
        <table className="w-full text-left text-xs text-secondary">
          <thead className="bg-surface/80 text-muted uppercase font-bold text-[10.5px] tracking-wider border-b border-base">
            <tr>
              <th className="py-3.5 px-4">Booking Ref</th>
              <th className="py-3.5 px-4">Passenger</th>
              <th className="py-3.5 px-4">Journey Route</th>
              <th className="py-3.5 px-4">Vehicle</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Fare</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Receipt className="w-8 h-8 text-muted/50" />
                    <p className="text-sm font-semibold text-primary">No bookings found</p>
                    <p className="text-xs text-muted">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try clearing search filters to see all reservations.'
                        : 'No reservations have been recorded in the system yet.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-elevated/50 transition-colors group">
                  {/* Reference */}
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/25">
                      {b.booking_reference}
                    </span>
                  </td>

                  {/* Passenger */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-primary">{b.passenger_name}</div>
                    <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-muted" />
                      <span>{b.passenger_phone || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Route */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex items-center gap-1.5 text-primary font-medium truncate" title={b.pickup_address}>
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{b.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted truncate text-[11px] mt-0.5" title={b.destination_address}>
                      <span className="text-amber-500 shrink-0">&rarr;</span>
                      <span className="truncate">{b.destination_address}</span>
                    </div>
                  </td>

                  {/* Vehicle */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-bold uppercase text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                      <Car className="w-3 h-3 text-emerald-500" />
                      {b.vehicle_type?.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <AdminStatusBadge status={b.status} />
                  </td>

                  {/* Fare */}
                  <td className="py-3.5 px-4 text-right font-extrabold tabular-nums text-primary font-sans text-sm">
                    {formatCurrency(b.final_fare || b.estimated_fare, settings.currency)}
                  </td>

                  {/* Action Buttons: View -> More (Pattern: View -> Edit -> Delete -> More) */}
                  <td className="py-3.5 px-4 text-center">
                    <AdminActionGroup>
                      <AdminActionButton
                        variant="view"
                        tooltip="Inspect complete booking dossier"
                        onClick={() => setSelectedBooking(b)}
                      />
                      <Link href="/dispatcher/queue" title="Open Dispatcher Queue">
                        <AdminActionButton
                          variant="more"
                          tooltip="Manage in Live Dispatcher Queue"
                        />
                      </Link>
                    </AdminActionGroup>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableCard>

      {/* ── 5. Detailed Booking Dossier Modal ──────────────────────────────── */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-base rounded-3xl p-6 sm:p-7 max-w-xl w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-base pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="type-card-title text-base font-bold text-primary">
                      Booking #{selectedBooking.booking_reference}
                    </h3>
                    <AdminStatusBadge status={selectedBooking.status} size="sm" />
                  </div>
                  <p className="text-xs text-muted">Complete trip reservation record &amp; audit profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-muted hover:text-primary transition-colors p-1 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Route Card */}
              <div className="p-4 rounded-2xl bg-surface border border-base space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted block">Pickup Location</span>
                    <span className="text-primary font-medium text-xs">{selectedBooking.pickup_address}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 pt-2 border-t border-base/60">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted block">Destination Location</span>
                    <span className="text-primary font-medium text-xs">{selectedBooking.destination_address}</span>
                  </div>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-card border border-base space-y-1">
                  <span className="text-[10.5px] font-semibold text-muted block">Passenger Name</span>
                  <span className="font-bold text-primary text-xs">{selectedBooking.passenger_name}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-card border border-base space-y-1">
                  <span className="text-[10.5px] font-semibold text-muted block">Contact Phone</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                    {selectedBooking.passenger_phone || 'N/A'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-card border border-base space-y-1">
                  <span className="text-[10.5px] font-semibold text-muted block">Vehicle Class</span>
                  <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400 text-xs">
                    {selectedBooking.vehicle_type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-card border border-base space-y-1">
                  <span className="text-[10.5px] font-semibold text-muted block">Total Settled Fare</span>
                  <span className="font-bold text-primary font-sans text-sm">
                    {formatCurrency(selectedBooking.final_fare || selectedBooking.estimated_fare, settings.currency)}
                  </span>
                </div>
              </div>

              {/* Timestamp & System IDs */}
              <div className="p-3 rounded-xl bg-surface/50 border border-base font-mono text-[11px] text-muted space-y-1">
                <div>Created At: {formatDateTime(selectedBooking.created_at)}</div>
                <div>Internal UUID: {selectedBooking.id}</div>
                {selectedBooking.assigned_driver_id && (
                  <div>Assigned Driver ID: {selectedBooking.assigned_driver_id}</div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-base">
              <Link
                href="/dispatcher/queue"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
              >
                <span>Open in Dispatcher Queue</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-surface hover:bg-elevated border border-base text-primary cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
