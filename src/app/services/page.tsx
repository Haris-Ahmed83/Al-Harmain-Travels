'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Car,
  Compass,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Users,
  Luggage,
} from 'lucide-react';

export default function ServicesPage() {
  const { services, settings } = useApp();

  const activeServices = services.filter((s) => s.is_active);

  return (
    <div className="min-h-screen bg-page text-primary py-12 lg:py-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Al Harmain Signature Offerings</span>
          </div>
          <h1 className="type-page-hero">
            Our chauffeur &amp; <span className="text-amber-500 dark:text-amber-400">travel services</span>
          </h1>
          <p className="type-lead">
            Clear packages for Umrah, airport arrivals, intercity transfers, and ziyarat tours—pick what fits your group.
          </p>
        </div>

        {/* Dynamic Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeServices.length === 0 ? (
            <div className="col-span-3 text-center py-16 bg-card border border-base rounded-3xl">
              <p className="text-muted">No active services currently listed.</p>
            </div>
          ) : (
            activeServices.map((service) => (
              <div
                key={service.id}
                className="bg-card border border-base rounded-3xl overflow-hidden hover:border-emerald-500/60 transition-all duration-300 flex flex-col group hover:-translate-y-1 shadow-lg"
              >
                {/* Service Image Banner */}
                <div className="relative h-56 overflow-hidden bg-elevated">
                  <img
                    src={service.image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Price Tag */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md text-amber-400 text-xs font-bold border border-amber-400/30 shadow">
                    From {service.base_price} {settings.currency}
                  </div>

                  {/* Vehicle Tag */}
                  <div className="absolute bottom-3 left-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/90 border border-emerald-700/50 text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                    <Car className="w-3.5 h-3.5" />
                    <span>{service.vehicle_type.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-primary group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-muted text-xs sm:text-sm mt-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Feature Highlights */}
                  <div className="space-y-2 pt-3 border-t border-base">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      Package Includes:
                    </div>
                    {service.features && service.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-secondary">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="pt-2">
                    <Link
                      href="/customer"
                      className="w-full py-3 px-4 rounded-xl text-center text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Book This Service</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Fleet Class Overview */}
        <div className="bg-card border border-base rounded-3xl p-8 sm:p-12 space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="type-eyebrow">Our Vehicle Classes</span>
            <h2 className="type-section-title mt-1">
              Maintained to Sovereign Standards
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-surface border border-base space-y-2">
              <span className="type-eyebrow text-amber-500 dark:text-amber-400">Executive Sedan</span>
              <h4 className="type-card-title">Toyota Camry / Lexus ES</h4>
              <p className="type-caption">Up to 3 passengers with 2 large luggage bags. Ideal for solo or couple pilgrims.</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-base space-y-2">
              <span className="type-eyebrow">Premium Family SUV</span>
              <h4 className="type-card-title">Hyundai Palisade / Ford Explorer</h4>
              <p className="type-caption">Up to 5 passengers with 4 large suitcases. Perfect for nuclear families.</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-base space-y-2">
              <span className="type-eyebrow text-amber-500 dark:text-amber-400">VIP Ultra Luxury</span>
              <h4 className="type-card-title">GMC Yukon XL Denali</h4>
              <p className="type-caption">Up to 7 passengers in executive leather comfort with expansive trunk volume.</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-base space-y-2">
              <span className="type-eyebrow text-teal-600 dark:text-teal-400">Family Caravan Van</span>
              <h4 className="type-card-title">Toyota HiAce Royal Lounge</h4>
              <p className="type-caption">Up to 11 passengers with dedicated rear luggage compartment.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
