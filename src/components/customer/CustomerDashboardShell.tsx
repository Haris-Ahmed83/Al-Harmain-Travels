'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Compass,
  Clock,
  Navigation,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  PhoneCall,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { BrandEmblem } from '@/components/ui/BrandLogo';
import { isBookingForCustomer } from '@/lib/assignment-utils';

interface CustomerDashboardShellProps {
  children: React.ReactNode;
}

export default function CustomerDashboardShell({ children }: CustomerDashboardShellProps) {
  const pathname = usePathname();
  const { currentUser, activeCustomerBooking, bookings, signOut } = useApp();
  const { isDark, toggleTheme } = useTheme();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Restore collapsed state preference on mount
  useEffect(() => {
    setHasMounted(true);
    const stored = localStorage.getItem('alharmain-customer-sidebar-collapsed');
    if (stored === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('alharmain-customer-sidebar-collapsed', String(next));
      return next;
    });
  };

  // Count active trips
  const activeBookingsCount = useMemo(() => {
    return bookings.filter((b) => {
      if (!isBookingForCustomer(b, currentUser)) return false;
      const isCompleted =
        b.status === 'trip_completed' ||
        b.status === 'ride_completed' ||
        b.status === 'payment_completed' ||
        b.status === 'completed';
      const isCancelledOrRejected =
        b.status === 'cancelled' || b.status === 'rejected' || b.status === 'payment_rejected';
      return !isCompleted && !isCancelledOrRejected;
    }).length;
  }, [bookings, currentUser]);

  // Primary 4 Customer Navigation Items (single source of truth)
  const navLinks = [
    {
      href: '/customer',
      label: 'Book Ride',
      subtitle: 'Reserve VIP Fleet',
      icon: Compass,
      exact: true,
      badge: null,
    },
    {
      href: '/customer/bookings',
      label: 'My Trips',
      subtitle: 'History & Active',
      icon: Clock,
      exact: false,
      badge: activeBookingsCount > 0 ? activeBookingsCount : null,
    },
    {
      href: '/customer/track',
      label: 'Live Radar',
      subtitle: 'Real-time GPS Radar',
      icon: Navigation,
      exact: false,
      badge: activeCustomerBooking ? 'LIVE' : null,
      isLive: !!activeCustomerBooking,
    },
    {
      href: '/customer/profile',
      label: 'VIP Profile',
      subtitle: 'Account & Places',
      icon: UserCheck,
      exact: false,
      badge: null,
    },
  ];

  return (
    <div className="customer-portal relative min-h-[calc(100vh-5rem)] w-full bg-page text-primary antialiased overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. DESKTOP SIDEBAR (lg+ screen size)
      ───────────────────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 fixed top-20 left-0 bottom-0 z-30 h-[calc(100vh-5rem)] border-r border-base bg-card/95 backdrop-blur-xl transition-all duration-300 overflow-hidden select-none ${isCollapsed ? 'w-16' : 'w-56'
          }`}
      >
        {/* Top Header / Profile Banner */}
        <div className="p-3 border-b border-base flex items-center justify-between gap-2.5 shrink-0">
          <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="relative shrink-0">
              {currentUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-8 h-8 rounded-xl object-cover border-2 border-emerald-500/50 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 text-amber-400 font-bold flex items-center justify-center border border-emerald-500/40 shadow-sm text-xs">
                  {currentUser.full_name?.charAt(0)?.toUpperCase() || 'P'}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-primary truncate block">
                    {currentUser.full_name?.split(' ')[0] || 'Passenger'}
                  </span>
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  VIP Pilgrim
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={handleToggleCollapse}
              className="p-1 rounded-lg text-muted hover:text-primary hover:bg-elevated border border-transparent hover:border-base transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Collapsed expand trigger */}
        {isCollapsed && (
          <div className="pt-2 px-2 flex justify-center shrink-0">
            <button
              onClick={handleToggleCollapse}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-elevated border border-base transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-2 space-y-1 flex-1 overflow-hidden" aria-label="Customer Sidebar Navigation">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium text-xs transition-all relative group ${isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-900/20'
                  : 'text-secondary hover:text-primary hover:bg-elevated border border-transparent hover:border-base'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <div className="relative shrink-0">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                  />
                  {item.isLive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${item.badge === 'LIVE'
                            ? 'bg-amber-400 text-slate-950 animate-pulse'
                            : isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9.5px] block truncate ${isActive ? 'text-emerald-100' : 'text-muted'
                        }`}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Live Active Journey Mini-Card in Sidebar (when trip active) */}
        {!isCollapsed && activeCustomerBooking && (
          <div className="mx-2 mb-2 p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active Ride
              </span>
              <span className="font-mono text-[9px] font-bold text-amber-700 dark:text-amber-400">
                #{activeCustomerBooking.booking_reference.slice(-5)}
              </span>
            </div>
            <p className="text-[10px] text-secondary truncate font-medium">
              {activeCustomerBooking.destination_address || 'Destination'}
            </p>
            <Link
              href="/customer/track"
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Navigation className="w-3 h-3" />
              <span>Track Chauffeur</span>
            </Link>
          </div>
        )}

        {/* Sidebar Footer: Support & Sign Out */}
        <div className="p-2 border-t border-base space-y-1 bg-surface/40 mt-auto shrink-0">
          {/* 24/7 VIP Concierge */}
          {!isCollapsed && (
            <a
              href="https://wa.me/966500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10.5px] text-muted hover:text-primary hover:bg-elevated transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-3 h-3 text-emerald-500" />
                VIP 24/7 Concierge
              </span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}

          {/* Sign Out */}
          {!isCollapsed && (
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10.5px] font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          )}

          {/* Official Brand Badge */}
          <div className="pt-2 border-t border-base/60 flex items-center justify-center">
            {isCollapsed ? (
              <BrandEmblem size="xs" className="scale-90" />
            ) : (
              <div className="flex items-center gap-2 px-1 text-[10px] text-muted w-full">
                <BrandEmblem size="xs" className="scale-75 origin-left" />
                <span className="font-semibold tracking-wide truncate">Al Harmain VIP Chauffeur</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <main
        className={`min-w-0 w-full overflow-x-hidden pb-20 lg:pb-6 transition-all duration-300 ${isCollapsed ? 'lg:pl-16' : 'lg:pl-56'
          }`}
      >
        {children}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. MOBILE BOTTOM NAVIGATION BAR (< lg screen size)
          Provides quick, ergonomic, single-tap access to primary modules
      ───────────────────────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-base shadow-2xl px-2 py-1 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
        aria-label="Mobile Customer Navigation"
      >
        <div className="grid grid-cols-4 gap-1 items-center max-w-md mx-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl transition-all relative ${isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-muted hover:text-primary'
                  }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-4 h-4 transition-transform ${isActive ? 'scale-105 text-emerald-700 dark:text-emerald-400' : ''
                      }`}
                  />
                  {item.isLive && (
                    <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                  {item.badge && !item.isLive && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-emerald-600 text-white rounded-full text-[8.5px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9.5px] tracking-tight mt-0.5 truncate">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
