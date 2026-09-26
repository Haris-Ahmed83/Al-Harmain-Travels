'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Star,
  CheckCircle2,
  Calendar,
  Car,
} from 'lucide-react';

export default function DriverEarningsPage() {
  const { currentUser, drivers, bookings, settings, isDataLoading } = useApp();
  const currentDriver =
    drivers.find((d) => d.id === currentUser.id || d.profile?.id === currentUser.id) ||
    (currentUser.role === 'admin' ? drivers[0] : undefined);

  const driverCompletedRides = bookings.filter(
    (b) =>
      currentDriver &&
      b.assigned_driver_id === currentDriver.id &&
      (b.status === 'ride_completed' || b.status === 'payment_completed' || b.status === 'trip_completed')
  );

  if (isDataLoading) {
    return (
      <div className="page-shell space-y-6">
        <div className="bg-card border border-base p-6 rounded-3xl shadow-xl animate-pulse h-24" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-card border border-base p-5 rounded-3xl shadow-xl animate-pulse h-32 space-y-3">
              <div className="h-4 w-24 bg-surface rounded-md" />
              <div className="h-7 w-20 bg-surface rounded-md" />
            </div>
          ))}
        </div>
        <div className="bg-card border border-base rounded-3xl p-6 shadow-xl animate-pulse h-64" />
      </div>
    );
  }

  if (!currentDriver) {
    return (
      <div className="page-shell py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <Car className="w-7 h-7" />
        </div>
        <h2 className="type-page-title">No Driver Profile Assigned</h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          Your account is awaiting driver profile assignment to display earnings and completed ride telemetry.
        </p>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="bg-card border border-base p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="type-eyebrow">Driver Financials</span>
          <h2 className="type-page-title mt-1">Earnings & Trip History</h2>
          <p className="text-xs text-secondary">
            Transparent breakdown of your net fares, cash receipts, and performance incentives.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-emerald-950/20 via-card to-card border border-emerald-500/30 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Earnings</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="type-page-title">
            {formatCurrency(currentDriver.total_earnings, settings.currency)}
          </span>
          <p className="text-[11px] text-muted mt-2">Lifetime completed journey payouts</p>
        </div>

        <div className="bg-card border border-base p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Collected (FR-61)</span>
            <Banknote className="w-5 h-5" />
          </div>
          <span className="type-stat text-3xl text-amber-600 dark:text-amber-400">
            {formatCurrency(currentDriver.cash_collected, settings.currency)}
          </span>
          <p className="text-[11px] text-muted mt-2">To be reconciled with Al Harmain office</p>
        </div>

        <div className="bg-card border border-base p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Quality Score</span>
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
          <span className="type-page-title">★ {currentDriver.rating}</span>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Eligible for VIP Pilgrim Missions</p>
        </div>
      </div>

      {/* Completed Rides Table */}
      <div className="bg-card border border-base rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-primary">Completed Mission Records</h3>

        {driverCompletedRides.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">
            No completed rides logged in current session. Completed rides will appear here with fare receipts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-secondary">
              <thead className="bg-surface text-secondary uppercase font-bold text-[10px] border-b border-base">
                <tr>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Fare Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base">
                {driverCompletedRides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-500">{ride.booking_reference}</td>
                    <td className="p-3">
                      <span className="font-semibold text-primary">{ride.pickup_address}</span>
                      <span className="text-muted block">&rarr; {ride.destination_address}</span>
                    </td>
                    <td className="p-3 uppercase text-emerald-600 dark:text-emerald-400 font-semibold">{ride.vehicle_type}</td>
                    <td className="p-3 text-secondary">{formatDateTime(ride.created_at)}</td>
                    <td className="p-3 text-right font-bold text-primary">
                      {formatCurrency(ride.final_fare || ride.estimated_fare, settings.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
