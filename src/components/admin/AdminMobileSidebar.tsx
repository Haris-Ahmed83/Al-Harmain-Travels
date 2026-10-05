'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  X,
  Shield,
  ShieldCheck,
  ChevronRight,
  Globe,
  LogOut,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';
import { ADMIN_NAV_SECTIONS } from './AdminDashboardShell';

interface AdminMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminMobileSidebar({ isOpen, onClose }: AdminMobileSidebarProps) {
  const pathname = usePathname();
  const { currentUser, signOut } = useApp();

  // Close sidebar only when pathname actually changes
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Lock body scroll and prevent background gestures when sidebar is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. BACKDROP OVERLAY (Smooth fade with blur)
      ───────────────────────────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-hidden="true"
      />

      {/* ─────────────────────────────────────────────────────────────
          2. OFF-CANVAS MOBILE DRAWER (Slides smoothly from left)
      ───────────────────────────────────────────────────────────── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Admin Navigation Drawer"
        onClick={(e) => e.stopPropagation()}
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-[70] w-[min(360px,88vw)] max-w-sm h-full flex flex-col bg-card text-primary border-r border-base shadow-2xl transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
        style={{
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        }}
      >
        {/* Header: Brand Logo + Close Button */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-base shrink-0">
          <BrandLogo size="sm" href="/admin" subtitle="Executive Admin HQ" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-xl text-muted hover:text-primary hover:bg-elevated border border-base transition-colors w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5 text-amber-500" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-5 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Admin Identity Card */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                {currentUser?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name || 'Admin'}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/70 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-extrabold flex items-center justify-center border border-amber-400/60 shadow-sm text-sm">
                    {currentUser?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card shadow-xs" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-primary truncate">
                    {currentUser?.full_name || 'System Administrator'}
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
                <p className="text-xs text-muted truncate mt-0.5 font-medium">
                  {currentUser?.email || 'admin@alharmaintravels.com'}
                </p>
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/35">
                    <Shield className="w-3 h-3 text-amber-500" />
                    Executive Single Authority
                  </span>
                </div>
              </div>
            </div>

            {/* Quick System Settings Link */}
            <Link
              href="/admin/settings"
              onClick={onClose}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-card hover:bg-elevated border border-base text-xs font-semibold text-secondary hover:text-primary transition-colors shadow-xs group"
            >
              <span className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
                <span>System Configuration</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Organized Navigation Sections */}
          <div className="space-y-5">
            {ADMIN_NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <div className="px-2 pb-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted font-sans">
                    {section.title}
                  </p>
                </div>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/35 font-bold shadow-xs'
                            : 'text-secondary hover:text-primary hover:bg-elevated border border-transparent hover:border-base'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Icon
                            className={`w-5 h-5 shrink-0 ${
                              isActive ? 'text-amber-600 dark:text-amber-400' : 'text-muted'
                            }`}
                          />
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-bold">{item.label}</span>
                            <span
                              className={`text-[10.5px] block truncate font-medium ${
                                isActive
                                  ? 'text-amber-700/90 dark:text-amber-300/90'
                                  : 'text-muted'
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)] shrink-0 ml-2" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted shrink-0 ml-2" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Link to Live Website */}
          <div className="pt-2 border-t border-base space-y-2">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-elevated border border-base transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
                <span>Visit Live Public Website</span>
              </div>
              <ExternalLink className="w-4 h-4 text-muted" />
            </Link>
          </div>
        </div>

        {/* Footer: Sign Out */}
        <div className="p-4 border-t border-base shrink-0 bg-surface/50 space-y-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors shadow-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin HQ</span>
          </button>
          <p className="text-[10px] text-center text-muted">
            KSA Transport Authority Fleet Operations
          </p>
        </div>
      </aside>
    </>
  );
}
