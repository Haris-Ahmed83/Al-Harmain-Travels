'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Receipt,
  DollarSign,
  FileText,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Globe,
  LogOut,
  Shield,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { BrandEmblem } from '@/components/ui/BrandLogo';

export interface AdminNavItem {
  href: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string | number | null;
  badgeTone?: 'green' | 'amber' | 'blue' | 'purple' | 'neutral';
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: 'Core HQ',
    items: [
      {
        href: '/admin',
        label: 'Overview',
        subtitle: 'Executive Cockpit',
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        href: '/admin/users',
        label: 'Users & Access',
        subtitle: 'Staff, Drivers & Pilgrims',
        icon: Users,
      },
      {
        href: '/admin/services',
        label: 'Services CMS',
        subtitle: 'Marketing & Packages',
        icon: Sparkles,
      },
    ],
  },
  {
    title: 'Tariff & Finance',
    items: [
      {
        href: '/admin/rates',
        label: 'Rates & Tariff',
        subtitle: 'Fixed Fare Master',
        icon: Receipt,
      },
      {
        href: '/admin/reports',
        label: 'Reports & Ledger',
        subtitle: 'Reconciliation & Tax',
        icon: DollarSign,
      },
    ],
  },
  {
    title: 'Governance',
    items: [
      {
        href: '/admin/audit-logs',
        label: 'Audit Logs',
        subtitle: 'Security & Activities',
        icon: FileText,
      },
      {
        href: '/admin/settings',
        label: 'System Settings',
        subtitle: 'Company & Dynamic Fare',
        icon: Sliders,
      },
    ],
  },
];

interface AdminDashboardShellProps {
  children: React.ReactNode;
}

export default function AdminDashboardShell({ children }: AdminDashboardShellProps) {
  const pathname = usePathname();
  const { currentUser, signOut, bookings, usersList } = useApp();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Restore collapsed state preference on mount
  useEffect(() => {
    setHasMounted(true);
    const stored = localStorage.getItem('alharmain-admin-sidebar-collapsed');
    if (stored === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('alharmain-admin-sidebar-collapsed', String(next));
      return next;
    });
  };

  // Dynamic badges for nav items
  const pendingBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.status === 'pending').length;
  }, [bookings]);

  return (
    <div className="relative min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] w-full bg-page text-primary antialiased">
      {/* ─────────────────────────────────────────────────────────────
          1. FIXED DESKTOP SIDEBAR (lg+ screen size)
      ───────────────────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 fixed top-16 sm:top-20 left-0 bottom-0 z-30 h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] border-r border-base bg-card/95 backdrop-blur-xl transition-all duration-300 overflow-hidden select-none shadow-sm ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
        aria-label="Executive Admin Navigation"
      >
        {/* Top Header / Admin Identity Banner */}
        <div className="p-4 border-b border-base flex items-center justify-between gap-3 shrink-0">
          <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="relative shrink-0">
              {currentUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-500/70 shadow-sm"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-extrabold flex items-center justify-center border border-amber-400/60 shadow-sm text-sm">
                  {currentUser.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card shadow-xs" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-primary truncate block">
                    {currentUser.full_name?.split(' ')[0] || 'Administrator'}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-wide text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                    <Shield className="w-3 h-3 text-amber-500" />
                    Single Authority
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={handleToggleCollapse}
              className="p-2 rounded-xl text-muted hover:text-primary hover:bg-elevated border border-transparent hover:border-base transition-colors cursor-pointer shrink-0"
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
              className="p-2.5 rounded-xl text-muted hover:text-primary hover:bg-elevated border border-base transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Navigation Sections */}
        <nav
          className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 overscroll-contain"
          aria-label="Admin Navigation Links"
        >
          {ADMIN_NAV_SECTIONS.map((section, sIdx) => (
            <div key={section.title} className="space-y-1.5">
              {!isCollapsed ? (
                <div className="px-3 pt-1 pb-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted font-sans">
                    {section.title}
                  </p>
                </div>
              ) : (
                sIdx > 0 && <div className="border-t border-base/70 my-2 mx-1" />
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? `${item.label} — ${item.subtitle}` : undefined}
                    className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/35 font-bold shadow-xs'
                        : 'text-secondary hover:text-primary hover:bg-elevated border border-transparent hover:border-base'
                    } ${isCollapsed ? 'justify-center px-0 py-3' : ''}`}
                  >
                    <div className="relative shrink-0 flex items-center justify-center">
                      <Icon
                        className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted group-hover:text-amber-500'
                        }`}
                      />
                    </div>

                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate text-xs font-bold">{item.label}</span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)] shrink-0" />
                          )}
                        </div>
                        <span
                          className={`text-[10.5px] block truncate font-medium ${
                            isActive
                              ? 'text-amber-700/90'
                              : 'text-muted group-hover:text-secondary'
                          }`}
                        >
                          {item.subtitle}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Live Public Site & Sign Out */}
        <div className="p-3.5 border-t border-base space-y-2 bg-surface/40 mt-auto shrink-0">
          {/* Live Public Website Link */}
          {!isCollapsed ? (
            <Link
              href="/"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-elevated border border-transparent hover:border-base transition-colors group"
            >
              <span className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="truncate">Public Live Website</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-muted group-hover:text-primary shrink-0" />
            </Link>
          ) : (
            <Link
              href="/"
              title="Visit Public Website"
              className="w-full flex items-center justify-center py-2.5 rounded-xl text-secondary hover:text-amber-500 hover:bg-elevated transition-colors"
            >
              <Globe className="w-5 h-5 text-amber-500" />
            </Link>
          )}

          {/* Sign Out */}
          {!isCollapsed ? (
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-300/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out Admin HQ</span>
            </button>
          ) : (
            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="w-full flex items-center justify-center py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}

          {/* Official Brand Stamp */}
          <div className="pt-2 border-t border-base/60">
            {isCollapsed ? (
              <div className="flex justify-center">
                <BrandEmblem size="xs" className="scale-90" />
              </div>
            ) : (
              <div className="flex items-center justify-between text-[10px] text-muted px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <BrandEmblem size="xs" className="scale-75 origin-left" />
                  <span className="font-semibold text-primary truncate">Al Harmain Travels</span>
                </div>
                <span className="shrink-0 text-amber-500 font-bold">HQ</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. INDEPENDENT MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <main
        className={`min-w-0 w-full overflow-x-hidden transition-all duration-300 pb-16 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
