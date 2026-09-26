'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
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
} from 'lucide-react';
import { TableSkeletonRows } from '@/components/ui/DataStateSkeletons';

export default function AdminDashboardPage() {
  const { bookings, drivers, vehicles, usersList, settings, isDataLoading } = useApp();

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
    .reduce((sum, b) => sum + (b.final_fare || b.estimated_fare), 0);

  const availableDrivers = drivers.filter((d) => d.status === 'available').length;

  if (isDataLoading) {
    return (
      <div className="page-shell space-y-8 animate-pulse">
        <div className="bg-card border border-base p-8 rounded-3xl h-28" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-card border border-base h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-card border border-base h-36" />
          ))}
        </div>
        <div className="bg-card border border-base rounded-3xl p-6 h-64" />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-8">
      {/* Admin Header */}
      <div className="bg-card border border-base p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="type-eyebrow text-amber-500 dark:text-amber-400">Executive Headquarters</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
              Single Authority Admin
            </span>
          </div>
          <h1 className="type-page-title mt-1">
            Al Harmain Management Dashboard
          </h1>
          <p className="type-muted">
            Comprehensive oversight of customers, fleet vehicles, staff dispatchers, and sacred journey finances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-2 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
          <Link
            href="/admin/services"
            className="px-4 py-2.5 rounded-xl bg-surface hover:bg-elevated text-primary border border-base font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            <span>Services CMS</span>
          </Link>
        </div>
      </div>

      {/* 8 Primary Required KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="p-5 rounded-2xl bg-card border border-base shadow-sm">
          <div className="text-xs font-semibold text-muted">Total Customers</div>
          <div className="type-page-title mt-1">{totalCustomers}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Verified Pilgrims</div>
        </div>

        {/* Total Drivers */}
        <div className="p-5 rounded-2xl bg-card border border-base shadow-sm">
          <div className="text-xs font-semibold text-muted">Total Drivers</div>
          <div className="type-page-title mt-1">{totalDrivers}</div>
          <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 font-medium">{availableDrivers} Available Now</div>
        </div>

        {/* Total Staff */}
        <div className="p-5 rounded-2xl bg-card border border-base shadow-sm">
          <div className="text-xs font-semibold text-muted">Total Staff</div>
          <div className="type-page-title mt-1">{totalStaff}</div>
          <div className="text-[10px] text-amber-500 dark:text-amber-400 mt-0.5 font-medium">Active Dispatchers</div>
        </div>

        {/* Pending Bookings */}
        <div className="p-5 rounded-2xl bg-card border border-base shadow-sm">
          <div className="text-xs font-semibold text-muted">Pending Bookings</div>
          <div className="type-stat text-amber-500 dark:text-amber-400 mt-1">{pendingBookings}</div>
          <div className="text-[10px] text-muted mt-0.5">Awaiting Confirmation</div>
        </div>

        {/* Confirmed Bookings */}
        <div className="p-5 rounded-2xl bg-card border border-base shadow-sm">
          <div className="text-xs font-semibold text-muted">Confirmed Bookings</div>
          <div className="type-stat text-blue-500 dark:text-blue-400 mt-1">{confirmedBookings}</div>
          <div className="text-[10px] text-muted mt-0.5">Ready for Assignment</div>
        </div>

        {/* Active Trips */}
        <div className="p-5 rounded-2xl bg-card border border-base shadow-sm">
          <div className="text-xs font-semibold text-muted">Active Trips</div>
          <div className="type-stat text-purple-500 dark:text-purple-400 mt-1">{activeTrips}</div>
          <div className="text-[10px] text-muted mt-0.5">En Route On Roads</div>
        </div>

        {/* Completed Trips */}
        <div className="p-5 rounded-2xl bg-card border border-base shadow-sm">
          <div className="text-xs font-semibold text-muted">Completed Trips</div>
          <div className="type-fare mt-1">{completedTrips}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Safe Destination</div>
        </div>

        {/* Cancelled Bookings */}
        <div className="p-5 rounded-2xl bg-card border border-base shadow-sm">
          <div className="text-xs font-semibold text-muted">Cancelled Bookings</div>
          <div className="type-stat text-rose-500 dark:text-rose-400 mt-1">{cancelledBookings}</div>
          <div className="text-[10px] text-muted mt-0.5">Discontinued Trips</div>
        </div>
      </div>

      {/* Revenue & Operational Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-card border border-base shadow-xl space-y-3">
          <span className="type-eyebrow">Financial Gross</span>
          <div className="type-page-title">
            {formatCurrency(totalRevenue, settings.currency)}
          </div>
          <p className="text-xs text-muted">
            Total settled pilgrimage fares including distance, base charges, and 15% KSA VAT.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-base shadow-xl space-y-3">
          <span className="type-eyebrow text-amber-500 dark:text-amber-400">Fleet Availability</span>
          <div className="type-page-title">
            {availableDrivers} / {totalDrivers} Drivers
          </div>
          <p className="text-xs text-muted">
            Chauffeurs ready for immediate auto-dispatch or manual assignment in Makkah &amp; Jeddah.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-base shadow-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Registered Fleet</span>
          <div className="type-page-title">
            {vehicles.length} Vehicles
          </div>
          <p className="text-xs text-muted">
            Commercial VIP GMCs, luxury sedans, family SUVs, and royal HiAce vans in service.
          </p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-card border border-base rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary">Recent Global Bookings</h3>
            <p className="text-xs text-muted">Latest reservations across all system roles</p>
          </div>
          <Link href="/dispatcher/queue" className="text-xs font-bold text-amber-500 dark:text-amber-400 hover:underline">
            View Live Queue &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-secondary">
            <thead className="bg-surface text-muted uppercase font-bold text-[10px] border-b border-base">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Passenger</th>
                <th className="p-3">Route</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Fare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base">
              {isDataLoading ? (
                <TableSkeletonRows rows={5} cols={6} />
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    No reservations logged in the database yet.
                  </td>
                </tr>
              ) : (
                bookings.slice(0, 6).map((b) => (
                  <tr key={b.id} className="hover:bg-elevated transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-500 dark:text-amber-400">{b.booking_reference}</td>
                    <td className="p-3 font-medium text-primary">{b.passenger_name}</td>
                    <td className="p-3 max-w-xs truncate text-secondary">{b.pickup_address} &rarr; {b.destination_address}</td>
                    <td className="p-3 uppercase text-emerald-600 dark:text-emerald-400 font-medium">{b.vehicle_type}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-surface text-secondary border border-base">
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold tabular-nums text-primary">
                      {formatCurrency(b.final_fare || b.estimated_fare, settings.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
