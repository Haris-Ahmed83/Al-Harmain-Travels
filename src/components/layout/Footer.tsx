'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Mail, MapPin, ShieldCheck, MessageCircle } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Completely remove footer from all dashboard portals (customer, driver, dispatcher, admin)
  const isDashboard =
    Boolean(pathname) &&
    (pathname.startsWith('/customer') ||
      pathname.startsWith('/driver') ||
      pathname.startsWith('/dispatcher') ||
      pathname.startsWith('/admin'));

  // Completely remove footer from all auth flows (sign-in, sign-up, forgot-password, reset-password, verify, callback, etc.)
  const isAuthPage =
    Boolean(pathname) &&
    (pathname.startsWith('/sign-in') ||
      pathname.startsWith('/sign-up') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/verify-email') ||
      pathname.startsWith('/verify-phone') ||
      pathname.startsWith('/callback') ||
      pathname.startsWith('/auth'));

  if (isDashboard || isAuthPage) {
    return null;
  }
  return (
    <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-emerald-900/30 text-slate-500 dark:text-slate-400 text-sm pb-24 sm:pb-0">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-amber-400 font-bold">
                الح
              </div>
              <span className="font-display text-xl font-semibold tracking-heading text-slate-900 dark:text-white">
                Al Harmain Travel
              </span>
            </div>
            <p className="type-body-sm mb-4 max-w-xs text-slate-500 dark:text-slate-400">
              Licensed VIP transfers for Umrah, Hajj, and airport journeys across Makkah, Madinah, and Jeddah.
            </p>
            <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold type-caption">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              KSA MOT licensed transport
            </div>
          </div>

          <div>
            <h4 className="type-eyebrow text-slate-800 dark:text-white mb-3">
              Quick links
            </h4>
            <ul className="space-y-2.5 type-body-sm">
              <li>
                <Link href="/customer" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Book a journey
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Services &amp; fleet
                </Link>
              </li>
              <li>
                <Link href="/customer/track" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Track my ride
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Contact support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="type-eyebrow text-slate-800 dark:text-white mb-3">
              Popular routes
            </h4>
            <ul className="space-y-2.5 type-body-sm text-slate-500 dark:text-slate-400">
              <li>Jeddah Airport ⇄ Makkah</li>
              <li>Makkah ⇄ Madinah</li>
              <li>Madinah Airport ⇄ Hotels</li>
              <li>Ziyarat holy sites tours</li>
            </ul>
          </div>

          <div>
            <h4 className="type-eyebrow text-slate-800 dark:text-white mb-3">
              Need help?
            </h4>
            <ul className="space-y-3 type-body-sm">
              <li>
                <a
                  href="tel:+966548881234"
                  className="flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                  +966 54 888 1234 · 24/7
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/966548881234"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  WhatsApp dispatch desk
                </a>
              </li>
              <li>
                <a
                  href="mailto:bookings@alharmaintravels.com"
                  className="flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                  bookings@alharmaintravels.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Ibrahim Al Khalil St, Makkah</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 type-caption text-slate-400">
          <p>&copy; {new Date().getFullYear()} Al Harmain Travels. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="hover:text-emerald-500 transition-colors">
              Staff sign in
            </Link>
            <Link href="/contact" className="hover:text-emerald-500 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
