'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Car,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Star,
  Award,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function DriverProfilePage() {
  const { currentUser, drivers, isDataLoading } = useApp();

  const driverData =
    drivers.find((d) => d.id === currentUser.id || d.profile?.id === currentUser.id) ||
    (currentUser.role === 'admin' ? drivers[0] : undefined);

  if (isDataLoading) {
    return (
      <div className="page-shell space-y-8 animate-pulse">
        <div className="h-14 w-64 bg-card rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-80 rounded-3xl bg-card border border-base" />
          <div className="md:col-span-2 h-80 rounded-3xl bg-card border border-base" />
        </div>
      </div>
    );
  }

  if (!driverData) {
    return (
      <div className="page-shell py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <Car className="w-7 h-7" />
        </div>
        <h2 className="type-page-title">Driver Credentials Pending</h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          No official MOT chauffeur credentials or assigned vehicle are linked to your profile yet.
        </p>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-8">
      <div className="space-y-1">
        <span className="type-eyebrow">Driver Credentials</span>
        <h1 className="type-page-title">Chauffeur Profile &amp; Vehicle</h1>
        <p className="text-xs text-secondary">
          Official KSA Ministry of Transport driver profile, assigned VIP vehicle, and safety rating.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Driver Card */}
        <div className="p-6 rounded-3xl bg-card border border-base space-y-6 text-center shadow-xl">
          {currentUser.avatar_url || driverData.avatar_url || driverData.profile?.avatar_url ? (
            <img
              src={currentUser.avatar_url || driverData.avatar_url || driverData.profile?.avatar_url || ''}
              alt={currentUser.full_name || 'Driver'}
              className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-xl border border-emerald-500/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-amber-400 font-bold text-3xl flex items-center justify-center mx-auto shadow-xl border border-emerald-500/40">
              {currentUser.full_name?.slice(0, 1) || 'C'}
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-primary">{currentUser.full_name}</h3>
            <p className="text-xs text-secondary">{currentUser.email || 'Verified Driver'}</p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 text-[10px] font-bold uppercase tracking-wider">
              {driverData.status.toUpperCase()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-base space-y-3 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Overall Rating:</span>
              <span className="text-amber-500 font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                {driverData.rating !== null && driverData.rating !== undefined ? (
                  <>
                    <span>{Number(driverData.rating).toFixed(1)} / 5.0</span>
                    {driverData.rating_count ? (
                      <span className="text-[10px] text-muted font-normal">({driverData.rating_count} reviews)</span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-xs text-secondary font-medium">New Captain</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Total Rides Completed:</span>
              <span className="text-primary font-bold">{driverData.total_rides ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">License Number:</span>
              <span className="text-secondary font-mono">{driverData.license_number || 'MOT Verified'}</span>
            </div>
          </div>
        </div>

        {/* Right: Assigned Vehicle Card */}
        <div className="md:col-span-2 p-8 rounded-3xl bg-card border border-base shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-base pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface border border-base flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary">Assigned Fleet Vehicle</h3>
                <p className="text-xs text-secondary">Registered commercial vehicle</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/40 text-xs font-bold font-mono">
              {driverData.assigned_vehicle?.plate_number || 'VIP Fleet'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-surface border border-base space-y-1">
              <span className="text-muted text-[10px] uppercase font-bold">Vehicle Model</span>
              <div className="text-primary font-bold text-sm">
                {driverData.assigned_vehicle?.make ? `${driverData.assigned_vehicle.make} ${driverData.assigned_vehicle.model || ''}` : driverData.assigned_vehicle?.model || 'Executive VIP Fleet'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-base space-y-1">
              <span className="text-muted text-[10px] uppercase font-bold">Vehicle Class</span>
              <div className="text-amber-600 dark:text-amber-400 font-bold text-sm uppercase">
                {driverData.assigned_vehicle?.vehicle_type?.replace('_', ' ') || 'VIP Transportation'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-base space-y-1">
              <span className="text-muted text-[10px] uppercase font-bold">Passenger Seating Capacity</span>
              <div className="text-primary font-bold text-sm">
                {driverData.assigned_vehicle?.seating_capacity || 7} Passengers
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-base space-y-1">
              <span className="text-muted text-[10px] uppercase font-bold">MOT Inspection Status</span>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Valid &amp; Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
