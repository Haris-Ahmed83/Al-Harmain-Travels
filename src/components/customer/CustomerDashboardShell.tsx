'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Compass,
  Clock,
  Navigation,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PhoneCall,
  LogOut,
  ExternalLink,
} from 'lucide-react';

interface CustomerDashboardShellProps {
  children: React.ReactNode;
}

export default function CustomerDashboardShell({ children }: CustomerDashboardShellProps) {
  const pathname = usePathname();
  const { currentUser, activeCustomerBooking, bookings, signOut } = useApp();

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
      const isCompleted =
        b.status === 'trip_completed' ||
        b.status === 'ride_completed' ||
        b.status === 'payment_completed' ||
        b.status === 'completed';
      const isCancelledOrRejected =
        b.status === 'cancelled' || b.status === 'rejected' || b.status === 'payment_rejected';
      return !isCompleted && !isCancelledOrRejected;
    }).length;
  }, [bookings]);

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
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-page text-primary antialiased overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. DESKTOP SIDEBAR (lg+ screen size)
      ───────────────────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 fixed top-[64px] left-0 bottom-0 z-30 h-[calc(100vh-64px)] border-r border-base bg-card/95 backdrop-blur-xl transition-all duration-300 overflow-hidden select-none ${isCollapsed ? 'w-20' : 'w-64'
          }`}
        style={{ height: 'calc(100vh - 64px)' }}
      >
        {/* Top Header / Profile Banner */}
        <div className="p-4 border-b border-base flex items-center justify-between gap-3 shrink-0">
          <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="relative shrink-0">
              {currentUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-10 h-10 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-900 text-amber-400 font-bold flex items-center justify-center border border-emerald-500/40 shadow-sm text-sm">
                  {currentUser.full_name?.charAt(0)?.toUpperCase() || 'P'}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-primary truncate block">
                    {currentUser.full_name?.split(' ')[0] || 'Passenger'}
                  </span>
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  VIP Pilgrim
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={handleToggleCollapse}
              className="p-1.5 rounded-xl text-muted hover:text-primary hover:bg-elevated border border-transparent hover:border-base transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed expand trigger */}
        {isCollapsed && (
          <div className="pt-2 px-3 flex justify-center shrink-0">
            <button
              onClick={handleToggleCollapse}
              className="p-2 rounded-xl text-muted hover:text-primary hover:bg-elevated border border-base transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-hidden" aria-label="Customer Sidebar Navigation">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl font-medium text-xs transition-all relative group ${isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/20'
                  : 'text-secondary hover:text-primary hover:bg-elevated border border-transparent hover:border-base'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <div className="relative shrink-0">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-amber-300' : 'text-emerald-600 dark:text-emerald-400'
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
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badge === 'LIVE'
                            ? 'bg-amber-400 text-slate-950 animate-pulse'
                            : isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] block truncate ${isActive ? 'text-emerald-100' : 'text-muted'
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
          <div className="mx-3 mb-3 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Active Ride
              </span>
              <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                #{activeCustomerBooking.booking_reference.slice(-5)}
              </span>
            </div>
            <p className="text-[11px] text-secondary truncate font-medium">
              {activeCustomerBooking.destination_address || 'Destination'}
            </p>
            <Link
              href="/customer/track"
              className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Navigation className="w-3 h-3" />
              <span>Track Chauffeur</span>
            </Link>
          </div>
        )}

        {/* Sidebar Footer: Support & Sign Out */}
        <div className="p-3 border-t border-base space-y-1.5 bg-surface/40 mt-auto shrink-0">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-secondary hover:text-primary hover:bg-elevated border border-base transition-colors ${isCollapsed ? 'justify-center px-0' : ''
              }`}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                {!isCollapsed && <span className="font-medium">Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-emerald-600 shrink-0" />
                {!isCollapsed && <span className="font-medium">Dark Mode</span>}
              </>
            )}
          </button>

          {/* 24/7 VIP Concierge */}
          {!isCollapsed && (
            <a
              href="https://wa.me/966500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px] text-muted hover:text-primary hover:bg-elevated transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                VIP 24/7 Concierge
              </span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Sign Out */}
          {!isCollapsed && (
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <main
        className={`min-w-0 w-full overflow-x-hidden pb-24 lg:pb-8 transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
      >
        {children}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. MOBILE BOTTOM NAVIGATION BAR (< lg screen size)
          Provides quick, ergonomic, single-tap access to primary modules
      ───────────────────────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-base shadow-2xl px-2 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
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
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-2xl transition-all relative ${isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-muted hover:text-primary'
                  }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-emerald-600 dark:text-emerald-400' : ''
                      }`}
                  />
                  {item.isLive && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                  {item.badge && !item.isLive && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-emerald-600 text-white rounded-full text-[9px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-1 truncate">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
