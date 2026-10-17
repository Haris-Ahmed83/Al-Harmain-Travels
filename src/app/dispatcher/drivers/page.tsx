'use client';

import React, { useState } from 'react';
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
  MessageSquare,
  X,
  Sparkles,
} from 'lucide-react';
import { Driver, DriverStatus } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { CardGridSkeleton, EmptyStateView } from '@/components/ui/DataStateSkeletons';

export default function DispatcherDriversPage() {
  const { drivers, updateDriverStatus, ratings, bookings, isDataLoading } = useApp();
  const [reviewModalDriver, setReviewModalDriver] = useState<Driver | null>(null);

  // Helper to get all ratings for a driver
  const getDriverRatings = (driverId: string) => {
    return ratings.filter((r) => r.driver_id === driverId);
  };

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
          {drivers.map((driver) => {
            const driverReviews = getDriverRatings(driver.id);

            return (
              <div
                key={driver.id}
                className="p-6 rounded-3xl bg-card border border-base space-y-4 shadow-xl hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {driver.avatar_url || driver.profile?.avatar_url ? (
                      <img
                        src={driver.avatar_url || driver.profile?.avatar_url || ''}
                        alt={driver.profile?.full_name || 'Captain'}
                        className="w-12 h-12 rounded-2xl object-cover border border-base shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center font-bold text-amber-500 text-lg border border-base">
                        {driver.profile?.full_name?.slice(0, 1) || 'D'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-primary">{driver.profile?.full_name || 'Captain'}</h3>
                      <a
                        href={`tel:${driver.profile?.phone}`}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{driver.profile?.phone || 'No phone'}</span>
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
                      {driver.assigned_vehicle?.plate_number || 'VIP Fleet'} (
                      {driver.assigned_vehicle?.make
                        ? `${driver.assigned_vehicle.make} ${driver.assigned_vehicle.model || ''}`
                        : driver.assigned_vehicle?.model || 'Executive'}
                      )
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Rating:</span>
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {driver.rating !== null && driver.rating !== undefined ? (
                        <span>
                          {Number(driver.rating).toFixed(1)} / 5.0
                          {driver.rating_count ? (
                            <span className="text-[10px] text-muted font-normal ml-1">
                              ({driver.rating_count} reviews)
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-secondary font-medium">New Captain</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Total Completed Rides:</span>
                    <span className="text-primary font-semibold">{driver.total_rides ?? 0}</span>
                  </div>

                  {/* Button to view passenger reviews */}
                  <button
                    type="button"
                    onClick={() => setReviewModalDriver(driver)}
                    className="w-full mt-1.5 bg-card hover:bg-elevated border border-base hover:border-amber-500/40 text-secondary hover:text-primary rounded-xl py-2 px-3 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-amber-500">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Passenger Feedback</span>
                    </span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                      {driverReviews.length} {driverReviews.length === 1 ? 'review' : 'reviews'}
                    </span>
                  </button>
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
            );
          })}
        </div>
      )}

      {/* Driver Passenger Reviews Dossier Modal */}
      {reviewModalDriver && (() => {
        const d = reviewModalDriver;
        const driverReviews = getDriverRatings(d.id);
        const driverName = d.profile?.full_name || d.full_name || 'Captain';

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-card border border-base rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-base pb-4">
                <div className="flex items-center gap-3">
                  {d.avatar_url || d.profile?.avatar_url ? (
                    <img
                      src={d.avatar_url || d.profile?.avatar_url || ''}
                      alt={driverName}
                      className="w-12 h-12 rounded-2xl object-cover border border-base shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg border border-amber-500/20">
                      {driverName.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-primary">{driverName}</h3>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Chauffeur Reviews
                      </span>
                    </div>
                    <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                      <span>★ {d.rating !== null && d.rating !== undefined ? Number(d.rating).toFixed(1) : 'New'} / 5.0</span>
                      <span>&bull;</span>
                      <span>{d.total_rides ?? 0} Completed Trips</span>
                      <span>&bull;</span>
                      <span>{driverReviews.length} Verified Reviews</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReviewModalDriver(null)}
                  className="p-1.5 rounded-xl text-muted hover:text-primary hover:bg-surface transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reviews List Scrollable Area */}
              <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
                {driverReviews.length === 0 ? (
                  <div className="p-8 text-center bg-surface/50 border border-base rounded-2xl space-y-2">
                    <Star className="w-8 h-8 text-muted mx-auto" />
                    <h4 className="text-sm font-bold text-primary">No Reviews Yet</h4>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      This chauffeur has not received passenger reviews yet. When customers rate their completed rides, they will appear here automatically.
                    </p>
                  </div>
                ) : (
                  driverReviews.map((rev) => {
                    // Match booking from AppContext
                    const matchedBooking = bookings.find((b) => b.id === rev.booking_id);
                    const passengerName =
                      rev.booking?.passenger_name ||
                      matchedBooking?.passenger_name ||
                      rev.customer?.full_name ||
                      'Passenger';

                    return (
                      <div
                        key={rev.id}
                        className="p-4 rounded-2xl bg-surface border border-base space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{passengerName}</span>
                            <span className="text-[11px] text-muted">
                              &bull; {formatDateTime(rev.created_at)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= rev.rating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            ))}
                            <span className="font-bold text-amber-600 dark:text-amber-400 ml-1">
                              {rev.rating}.0
                            </span>
                          </div>
                        </div>

                        {/* Booking context */}
                        {(matchedBooking || rev.booking) && (
                          <div className="text-[11px] text-muted bg-input/50 px-2.5 py-1.5 rounded-lg border border-base flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                              {matchedBooking?.booking_reference || (rev.booking as any)?.booking_reference}
                            </span>
                            <span className="truncate max-w-xs">
                              {matchedBooking?.pickup_address || (rev.booking as any)?.pickup_address} &rarr;{' '}
                              {matchedBooking?.destination_address || (rev.booking as any)?.destination_address}
                            </span>
                          </div>
                        )}

                        {/* Feedback comment */}
                        {rev.feedback ? (
                          <p className="text-xs text-primary italic bg-input/30 p-2.5 rounded-xl border border-base">
                            &ldquo;{rev.feedback}&rdquo;
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted italic">No written comment left.</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-base flex items-center justify-between text-xs">
                <span className="text-muted">
                  Showing {driverReviews.length} recorded passenger {driverReviews.length === 1 ? 'rating' : 'ratings'}
                </span>
                <button
                  type="button"
                  onClick={() => setReviewModalDriver(null)}
                  className="px-4 py-2 rounded-xl font-semibold bg-surface hover:bg-elevated border border-base text-primary transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
