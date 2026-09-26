'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Users,
  Compass,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  Building,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-page text-primary py-12 lg:py-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Serving The Guests of The Most Merciful</span>
          </div>
          <h1 className="type-page-hero">
            About <span className="text-amber-500 dark:text-amber-400">Al Harmain Travel</span>
          </h1>
          <p className="type-lead leading-relaxed">
            Pioneering premium religious tourism and chauffeured executive transportation across the holy cities of Makkah Al-Mukarramah, Madinah Al-Munawwarah, and Jeddah.
          </p>
        </div>

        {/* Company Introduction & Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="type-eyebrow">Our Heritage &amp; Purpose</span>
            <h2 className="type-section-title">
              Dedicated to Spiritual Serenity &amp; Unrivaled Reliability
            </h2>
            <p className="type-body">
              Founded with the noble mission to serve the pilgrims (Dhuyuf Al-Rahman), Al Harmain Travel has grown from a specialized Umrah transport provider into an elite fleet management enterprise. We understand that undertaking Hajj or Umrah is a once-in-a-lifetime journey of faith.
            </p>
            <p className="type-muted">
              Every detail—from prompt airport terminal greeters at King Abdulaziz International Airport to modern GMC Denalis with direct Haram permits—is tuned to eliminate transit friction, allowing our guests to focus entirely on their worship.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-card border border-base">
                <div className="type-stat text-amber-500 dark:text-amber-400">150,000+</div>
                <div className="type-caption mt-1">Pilgrims Transported</div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-base">
                <div className="type-fare">99.8%</div>
                <div className="type-caption mt-1">Punctuality Score</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden border border-emerald-900/50 shadow-2xl bg-card">
              <img
                src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1000&q=80"
                alt="Holy Kaaba Makkah"
                className="w-full h-[400px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card border border-emerald-200 dark:border-emerald-700/60 p-5 rounded-2xl shadow-xl hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary">MOT Certified &amp; Insured</div>
                  <div className="text-[11px] text-muted">License #KSA-MOT-99201</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-card border border-base space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-700/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="type-section-title !text-2xl">Our Mission</h3>
            <p className="type-body">
              To deliver an immaculate, peaceful, and prestigious ground transportation experience for pilgrims and visitors to the Kingdom of Saudi Arabia, upholding Islamic principles of hospitality (Karam), dignity, and utmost safety.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-base space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-700/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="type-section-title !text-2xl">Our Vision</h3>
            <p className="type-body">
              To become the most respected sacred transport network in the Middle East, setting benchmark standards in technological dispatch, fleet hygiene, driver excellence, and seamless customer service across the holy sanctuaries.
            </p>
          </div>
        </div>

        {/* Why Choose Us Detailed */}
        <div className="bg-card border border-base rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="type-eyebrow text-amber-500 dark:text-amber-400">Our Commitments</span>
            <h2 className="type-section-title mt-1">Why Pilgrims Choose Al Harmain</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-base tracking-tight">
                <CheckCircle2 className="w-5 h-5" />
                <span>Sanctuary Gate Permissions</span>
              </div>
              <p className="type-caption leading-relaxed">
                Authorized access permits for hotel drop-offs directly at Ibrahim Al-Khalil Street, Ajyad, and the northern Haram courtyard in Madinah.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-base tracking-tight">
                <CheckCircle2 className="w-5 h-5" />
                <span>Sanitized Luxury Fleet</span>
              </div>
              <p className="type-caption leading-relaxed">
                Every vehicle undergoes deep cleaning, fragrance refreshing, and mechanical inspection before each dispatched journey.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-base tracking-tight">
                <CheckCircle2 className="w-5 h-5" />
                <span>Transparent Upfront Pricing</span>
              </div>
              <p className="type-caption leading-relaxed">
                Zero surge pricing, zero hidden luggage charges, and full VAT-compliant invoicing for your records and reimbursables.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 pt-4">
          <h3 className="type-section-title !text-2xl">Let Us Accompany Your Spiritual Itinerary</h3>
          <div>
            <Link
              href="/customer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-lg shadow-amber-950/30"
            >
              <span>Book Your Ride</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
