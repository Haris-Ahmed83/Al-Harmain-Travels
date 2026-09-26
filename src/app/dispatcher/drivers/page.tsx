'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Car,
  Phone,
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  Shield,
  UserCheck,
} from 'lucide-react';
import { DriverStatus } from '@/types';
import { CardGridSkeleton, EmptyStateView } from '@/components/ui/DataStateSkeletons';

export default function DispatcherDriversPage() {
  const { drivers, updateDriverStatus, isDataLoading } = useApp();

  return (
    <div className="page-shell space-y-6">
      <div className="bg-card border border-base p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="type-eyebrow">Operations Fleet</span>
          <h1 className="type-page-title mt-1">Driver Roster &amp; Availability Monitor</h1>
          <p className="text-xs text-secondary">
            Real-time status of all active chauffeurs across Western Province zones.
          </p>
        </div>
      </div>

      {isDataLoading ? (
        <CardGridSkeleton count={6} heightClass="h-64" />
      ) : drivers.length === 0 ? (
        <EmptyStateView
          icon={Car}
          title="No Chauffeurs Registered"
          description="No active drivers have been provisioned in the operations fleet yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => (
          <div
            key={driver.id}
            className="p-6 rounded-3xl bg-card border border-base space-y-4 shadow-xl hover:border-emerald-500/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center font-bold text-amber-500 text-lg border border-base">
                  {driver.profile?.full_name?.slice(0, 1) || 'D'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary">{driver.profile?.full_name || 'Captain'}</h3>
                  <a href={`tel:${driver.profile?.phone}`} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{driver.profile?.phone}</span>
                  </a>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  driver.status === 'available'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : driver.status === 'assigned'
                    ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : driver.status === 'on_trip' || driver.status === 'busy'
                    ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                    : 'bg-surface text-muted border border-base'
                }`}
              >
                {driver.status}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface border border-base space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>Vehicle:</span>
                <span className="text-primary font-medium">
                  {driver.assigned_vehicle?.plate_number} ({driver.assigned_vehicle?.model || 'VIP Fleet'})
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Rating:</span>
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {driver.rating} / 5.0
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Total Completed Rides:</span>
                <span className="text-primary font-semibold">{driver.total_rides}</span>
              </div>
            </div>

            {/* Quick Status Toggle for Dispatcher */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-muted">Override Status:</span>
              <select
                value={driver.status}
                onChange={(e) => updateDriverStatus(driver.id, e.target.value as DriverStatus)}
                className="bg-input border border-base rounded-lg px-2.5 py-1 text-[11px] text-primary focus:outline-none focus:border-emerald-500"
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="on_trip">On Trip</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
