'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Compass,
  ShieldCheck,
  Car,
  Users,
  Plane,
  ArrowRight,
  Award,
  CheckCircle2,
  Phone,
  MapPin,
} from 'lucide-react';

export default function HomePage() {
  const { services, settings } = useApp();
  const activeServices = services.filter((s) => s.is_active).slice(0, 6);

  return (
    <div className="bg-page text-primary">
      {/* Full-bleed hero — brand first, one CTA group, one dominant image */}
      <section className="relative min-h-[88vh] flex items-end sm:items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=2000&q=80')",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/75 to-[#090d16]/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090d16]/90 via-[#090d16]/45 to-transparent" />

        <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-16 pt-28 sm:py-28">
          <div className="max-w-2xl space-y-6 animate-fade-up">
            <p className="type-hero text-white">
              Al Harmain{' '}
              <span className="text-amber-400">Travel</span>
            </p>
            <h1 className="font-sans text-xl sm:text-2xl font-semibold text-white/95 leading-snug max-w-xl tracking-tight">
              VIP chauffeur transfers for Umrah, Hajj &amp; airport journeys across Makkah, Madinah &amp; Jeddah.
            </h1>
            <p className="type-lead text-slate-300 max-w-lg !text-sm sm:!text-base">
              Book in minutes. Licensed captains, live tracking, and calm door-to-door service for your sacred travel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link href="/customer" className="btn-primary type-cta text-base px-7 py-3.5">
                <Compass className="w-5 h-5" />
                Book your journey
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 type-cta font-semibold
                  bg-white/10 text-white border border-white/20 backdrop-blur-md hover:bg-white/15 transition-colors"
              >
                View services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — one job */}
      <section className="py-16 sm:py-20 border-b border-base bg-card/40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-2xl mb-10">
            <p className="chip mb-3">Simple booking</p>
            <h2 className="type-section-title">
              Three steps to a confirmed ride
            </h2>
            <p className="text-muted mt-2 text-sm sm:text-base">
              Clear choices, instant fare estimate, and dispatcher confirmation—no apps required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Choose pickup & destination',
                copy: 'Airports, Haram gates, hotels, and popular pilgrimage landmarks.',
                icon: MapPin,
              },
              {
                step: '2',
                title: 'Pick your vehicle',
                copy: 'Sedan, SUV, VIP GMC, family van, or group bus—with live fare estimate.',
                icon: Car,
              },
              {
                step: '3',
                title: 'Track your captain',
                copy: 'Get confirmation, live status updates, and arrival tracking on your phone.',
                icon: ShieldCheck,
              },
            ].map((item) => (
              <div key={item.step} className="surface-card p-6 flex gap-4">
                <div className="step-dot step-dot-active shrink-0">{item.step}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-primary text-base">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular routes */}
      <section className="py-16 sm:py-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="chip mb-3">Most booked</p>
              <h2 className="type-section-title">
                Popular pilgrim routes
              </h2>
            </div>
            <Link href="/customer" className="btn-brand self-start sm:self-auto">
              Start booking
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              {
                from: 'Jeddah Airport (JED)',
                to: 'Makkah Clock Tower',
                meta: 'Meet & greet · ~75 mins',
                price: 280,
                vehicle: 'SUV / VIP GMC',
              },
              {
                from: 'Makkah Haram',
                to: 'Madinah Prophet’s Mosque',
                meta: 'Hijrah Highway VIP · ~4 hrs',
                price: 750,
                vehicle: 'Luxury GMC XL',
              },
              {
                from: 'Madinah hotel',
                to: 'Holy Sites Ziyarat',
                meta: 'Quba · Uhud · Qiblatayn · ~4 hrs',
                price: 350,
                vehicle: 'Private van',
              },
            ].map((route) => (
              <Link
                key={route.from}
                href="/customer"
                className="group surface-card p-5 hover:border-emerald-600/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{route.from}</p>
                    <div className="flex items-center gap-2 my-1.5 text-muted">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-sm font-semibold text-amber-500 dark:text-amber-400 truncate">
                        {route.to}
                      </p>
                    </div>
                    <p className="text-xs text-muted">{route.meta}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      From {route.price} {settings.currency}
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">{route.vehicle}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Book this route →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 sm:py-20 bg-card/50 border-y border-base">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-2xl mb-10">
            <p className="chip mb-3">Fleet & packages</p>
            <h2 className="type-section-title">
              Transport for every pilgrim &amp; guest
            </h2>
            <p className="text-muted mt-2 text-sm sm:text-base">
              From executive airport pickups to family Umrah vans—comfort, safety, and dignity first.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeServices.map((service) => (
              <article
                key={service.id}
                className="surface-card overflow-hidden flex flex-col group hover:-translate-y-0.5 transition-transform"
              >
                <div className="relative h-44 overflow-hidden bg-elevated">
                  <img
                    src={
                      service.image_url ||
                      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      {service.vehicle_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      From {service.base_price} {settings.currency}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-primary leading-snug">{service.title}</h3>
                  <p className="text-sm text-muted line-clamp-2">{service.description}</p>
                  <ul className="space-y-1.5 pt-1">
                    {service.features.slice(0, 2).map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-secondary">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/customer" className="btn-secondary mt-auto w-full text-xs">
                    Reserve this service
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              See all packages &amp; fleet details
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-16 sm:py-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-2xl mb-10">
            <p className="chip mb-3">Why pilgrims trust us</p>
            <h2 className="type-section-title">
              Built for sacred travel
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Award,
                title: 'MOT licensed',
                copy: 'Accredited operators with Haram access awareness and commercial compliance.',
                tone: 'emerald',
              },
              {
                icon: Plane,
                title: 'Flight tracking',
                copy: 'JED & MED delays adjusted automatically with free standby time.',
                tone: 'amber',
              },
              {
                icon: ShieldCheck,
                title: 'Live GPS safety',
                copy: 'Every ride can be tracked. Support desk available around the clock.',
                tone: 'teal',
              },
              {
                icon: Users,
                title: 'Multilingual captains',
                copy: 'Arabic & English speaking drivers who understand pilgrim needs.',
                tone: 'emerald',
              },
            ].map((item) => (
              <div key={item.title} className="surface-card p-5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 border ${
                    item.tone === 'amber'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      : item.tone === 'teal'
                        ? 'bg-teal-500/10 border-teal-500/30 text-teal-500'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-primary mb-1.5">{item.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-emerald-900/30">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950" />
        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-14 sm:py-16 text-center space-y-5">
          <h2 className="type-section-title text-white">
            Ready when you are
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
            Instant fare estimate, clear confirmation, and a dedicated captain for your journey.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link href="/customer" className="btn-primary px-8 py-3.5">
              <Compass className="w-5 h-5" />
              Book now
            </Link>
            <a href={`tel:${settings.support_phone.replace(/\s/g, '')}`} className="btn-secondary bg-white/5 text-white border-white/20 hover:bg-white/10">
              <Phone className="w-4 h-4" />
              Call {settings.support_phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
