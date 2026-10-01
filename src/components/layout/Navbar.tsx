'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import ThemeToggle from '@/components/layout/ThemeToggle';
import {
  Car,
  Compass,
  LayoutDashboard,
  Bell,
  Shield,
  User,
  Menu,
  X,
  MapPin,
  Clock,
  LogIn,
  LogOut,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  PhoneCall,
  Info,
  ChevronDown,
  Star,
  Sliders,
  Receipt,
} from 'lucide-react';

import CustomerMobileSidebar from '@/components/customer/CustomerMobileSidebar';

export default function Navbar() {
  const pathname = usePathname();
  const {
    userRole,
    currentUser,
    isAuthenticated,
    isAuthLoading,
    signOut,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    activeCustomerBooking,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCustomerSidebarOpen, setIsCustomerSidebarOpen] = useState(false);

  const handleCloseCustomerSidebar = useCallback(() => {
    setIsCustomerSidebarOpen(false);
  }, []);

  const handleToggleCustomerSidebar = useCallback(() => {
    setIsCustomerSidebarOpen((prev) => !prev);
    setIsNotifOpen(false);
  }, []);

  const notifRef = useRef<HTMLDivElement>(null);
  const customerMobileNotifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isCustomer = userRole === 'customer';
  const isCustomerPortal = pathname.startsWith('/customer');
  const isAuthRoute =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/verify-phone') ||
    pathname.startsWith('/callback') ||
    pathname.startsWith('/auth');
  const showBookCta = (!isAuthenticated || isCustomer) && !pathname.startsWith('/customer') && !isAuthRoute;
  const isMarketingPath =
    pathname === '/' ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/services') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/auth');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideDesktopNotif = notifRef.current?.contains(target);
      const insideMobileNotif = customerMobileNotifRef.current?.contains(target);
      if (!insideDesktopNotif && !insideMobileNotif) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCustomerSidebarOpen(false);
    setIsNotifOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const publicLinks = [
    { label: 'Home', href: '/', icon: Compass },
    { label: 'About', href: '/about', icon: Info },
    { label: 'Services', href: '/services', icon: Briefcase },
    { label: 'Contact', href: '/contact', icon: PhoneCall },
  ];

  const roleNavItems: Record<UserRole, { label: string; href: string; icon: typeof Car }[]> = {
    customer: [
      { label: 'Book ride', href: '/customer', icon: Compass },
      { label: 'My trips', href: '/customer/bookings', icon: Clock },
      { label: 'Track', href: '/customer/track', icon: MapPin },
      { label: 'Profile', href: '/customer/profile', icon: User },
    ],
    driver: [
      { label: 'Cockpit', href: '/driver', icon: Car },
      { label: 'Earnings', href: '/driver/earnings', icon: DollarSign },
      { label: 'Profile', href: '/driver/profile', icon: User },
    ],
    dispatcher: [
      { label: 'Radar', href: '/dispatcher', icon: Compass },
      { label: 'Queue', href: '/dispatcher/queue', icon: Clock },
      { label: 'Drivers', href: '/dispatcher/drivers', icon: Car },
      { label: 'Customers', href: '/dispatcher/customers', icon: Users },
      { label: 'New booking', href: '/dispatcher/new-booking', icon: Briefcase },
    ],
    admin: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Fleet', href: '/admin/fleet', icon: Car },
      { label: 'Rates', href: '/admin/rates', icon: Receipt },
      { label: 'Services', href: '/admin/services', icon: Star },
      { label: 'Reports', href: '/admin/reports', icon: DollarSign },
      { label: 'Audit', href: '/admin/audit-logs', icon: FileText },
      { label: 'Settings', href: '/admin/settings', icon: Sliders },
    ],
  };

  const currentRoleNav = roleNavItems[userRole] ?? roleNavItems.customer;

  const getDashboardUrl = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'dispatcher':
        return '/dispatcher';
      case 'driver':
        return '/driver';
      default:
        return '/customer';
    }
  };

  const getCtaConfig = () => {
    if (!isAuthenticated || userRole === 'customer') {
      return { href: '/customer', label: 'Book now', icon: Compass };
    }
    if (userRole === 'admin') {
      return { href: '/admin', label: 'Admin HQ', icon: Shield };
    }
    if (userRole === 'dispatcher') {
      return { href: '/dispatcher/new-booking', label: 'New booking', icon: Compass };
    }
    if (userRole === 'driver') {
      return { href: '/driver', label: 'Cockpit', icon: Car };
    }
    return { href: '/customer', label: 'Book now', icon: Compass };
  };

  const cta = getCtaConfig();

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/60';
      case 'dispatcher':
        return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60';
      case 'driver':
        return 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3" />;
      case 'dispatcher':
        return <Compass className="w-3 h-3" />;
      case 'driver':
        return <Car className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl type-nav transition-colors ${active
      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/30'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/60 text-slate-900 dark:text-white shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* ─────────────────────────────────────────────────────────────
              1. CUSTOMER DASHBOARD MOBILE NAVBAR (< lg screens)
              - Left corner: Hamburger menu icon (three lines)
              - Center: Al Harmain Travels Logo (perfectly centered horizontally)
              - Right corner: Notification Bell with unread badge
          ───────────────────────────────────────────────────────────── */}
          {isCustomerPortal && (
            <div className="lg:hidden relative flex items-center justify-between h-[64px] w-full">
              {/* Left corner: Hamburger menu icon */}
              <div className="flex items-center z-10 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleCustomerSidebar();
                  }}
                  className="p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-colors flex items-center justify-center w-10 h-10 shadow-sm cursor-pointer"
                  aria-label={isCustomerSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
                  aria-expanded={isCustomerSidebarOpen}
                >
                  <Menu className="w-5 h-5 transition-transform" />
                </button>
              </div>

              {/* Center: The Al Harmain Travels logo, perfectly centered horizontally */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 select-none">
                <Link
                  href="/customer"
                  className="flex items-center gap-2 group shrink-0 pointer-events-auto"
                  title="Al Harmain Customer Portal"
                >
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-950 flex items-center justify-center shadow-md border border-emerald-500/30 group-hover:border-amber-400/50 transition-colors shrink-0">
                    <span className="text-base font-bold text-amber-400 tracking-tighter">الح</span>
                  </div>
                  <div className="flex items-baseline gap-1 leading-none">
                    <span className="font-display text-lg sm:text-[1.375rem] font-semibold tracking-heading text-slate-900 dark:text-white">
                      Al Harmain
                    </span>
                    <span className="font-display text-lg sm:text-[1.375rem] font-semibold tracking-heading text-amber-500 dark:text-amber-400">
                      Travel
                    </span>
                  </div>
                </Link>
              </div>

              {/* Right corner: Notification bell icon with unread badge */}
              <div className="flex items-center z-10 shrink-0">
                <div className="relative" ref={customerMobileNotifRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsNotifOpen((prev) => !prev);
                      if (isCustomerSidebarOpen) setIsCustomerSidebarOpen(false);
                    }}
                    className="p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 relative transition-colors flex items-center justify-center w-10 h-10 shadow-sm cursor-pointer"
                    aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                    aria-expanded={isNotifOpen}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Mobile Notification Popover */}
                  {isNotifOpen && (
                    <div className="fixed sm:absolute top-[68px] sm:top-full sm:mt-2 right-2 sm:right-0 w-[min(22rem,calc(100vw-1rem))] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-50 duration-200">
                      <NotificationDropdownContent
                        notifications={notifications}
                        unreadCount={unreadCount}
                        markNotificationAsRead={markNotificationAsRead}
                        clearNotifications={clearNotifications}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              2. DESKTOP ROW (lg+) OR NON-CUSTOMER ROW (all screens)
          ───────────────────────────────────────────────────────────── */}
          <div className={`${isCustomerPortal ? 'hidden lg:flex' : 'flex'} items-center justify-between h-[64px] gap-3`}>
            <Link href="/" className="flex items-center gap-2.5 group shrink-0 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-950 flex items-center justify-center shadow-md border border-emerald-500/30 group-hover:border-amber-400/50 transition-colors">
                <span className="text-lg font-bold text-amber-400 tracking-tighter">الح</span>
              </div>
              <div className="hidden sm:block min-w-0">
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="font-display text-[1.375rem] font-semibold tracking-heading text-slate-900 dark:text-white">
                    Al Harmain
                  </span>
                  <span className="font-display text-[1.375rem] font-semibold tracking-heading text-amber-500 dark:text-amber-400">
                    Travel
                  </span>
                </div>
                <p className="text-2xs text-emerald-600/80 dark:text-emerald-400/80 tracking-label uppercase font-semibold mt-1">
                  Makkah · Madinah · Jeddah
                </p>
              </div>
            </Link>

            {/* Center Navigation */}
            {isCustomer && pathname.startsWith('/customer') ? (
              <div className="hidden lg:flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  VIP Customer Portal
                </span>
                <span className="text-slate-300 dark:text-slate-700 font-mono text-xs">/</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {pathname === '/customer'
                    ? 'Book a Ride'
                    : pathname.startsWith('/customer/bookings')
                    ? 'My Trips & History'
                    : pathname.startsWith('/customer/track')
                    ? 'Live Vehicle Radar'
                    : pathname.startsWith('/customer/profile')
                    ? 'VIP Profile & Settings'
                    : 'Overview'}
                </span>
              </div>
            ) : (
              <nav className="hidden lg:flex items-center gap-0.5" aria-label="Primary">
                {(isAuthenticated && !isMarketingPath ? currentRoleNav : publicLinks).map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href + '/'));
                  return (
                    <Link key={item.href} href={item.href} className={navLinkClass(isActive)}>
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                {isAuthenticated && isMarketingPath && (
                  <Link href={getDashboardUrl(userRole)} className={navLinkClass(false)}>
                    <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                    <span>My portal</span>
                  </Link>
                )}
              </nav>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />

              {activeCustomerBooking && isCustomer && (
                <Link
                  href="/customer/track"
                  className="hidden md:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-600/50 text-emerald-700 dark:text-emerald-300 text-[11px] px-3 py-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-soft-pulse shrink-0" />
                  <span className="font-semibold capitalize">
                    {activeCustomerBooking.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              )}

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 relative transition-colors"
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                  aria-expanded={isNotifOpen}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-1.5rem))] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <NotificationDropdownContent
                      notifications={notifications}
                      unreadCount={unreadCount}
                      markNotificationAsRead={markNotificationAsRead}
                      clearNotifications={clearNotifications}
                    />
                  </div>
                )}
              </div>

              {isAuthLoading ? (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
              ) : isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 py-1.5 pl-1.5 pr-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                    aria-expanded={isUserMenuOpen}
                    aria-label="Account menu"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-950 border border-emerald-700/40 flex items-center justify-center font-bold text-sm text-amber-400 shrink-0">
                      {currentUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="hidden sm:block text-left leading-none">
                      <div className="text-[12px] font-bold text-slate-900 dark:text-white max-w-[100px] truncate">
                        {currentUser.full_name}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(userRole)}`}
                      >
                        {getRoleIcon(userRole)}
                        {userRole}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.full_name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {currentUser.email || 'Verified account'}
                        </p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <Link
                          href={getDashboardUrl(userRole)}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                          My dashboard
                        </Link>
                        {userRole === 'customer' && (
                          <Link
                            href="/customer/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <User className="w-3.5 h-3.5 text-teal-500" />
                            Profile &amp; settings
                          </Link>
                        )}
                        {userRole === 'driver' && (
                          <Link
                            href="/driver/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <User className="w-3.5 h-3.5 text-teal-500" />
                            Driver profile
                          </Link>
                        )}
                        {userRole === 'admin' && (
                          <Link
                            href="/admin/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Sliders className="w-3.5 h-3.5 text-amber-500" />
                            System settings
                          </Link>
                        )}
                        {userRole === 'dispatcher' && (
                          <Link
                            href="/dispatcher/queue"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            Active queue
                          </Link>
                        )}
                        <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/sign-in"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign in
                  </Link>
                  <Link href="/sign-up" className="btn-brand !py-2 !px-4 !text-xs !shadow-md">
                    Sign up
                  </Link>
                </div>
              )}

              {showBookCta && (
                <Link href={cta.href} className="hidden sm:inline-flex btn-primary !py-2 !px-4 !text-xs">
                  <cta.icon className="w-3.5 h-3.5" />
                  {cta.label}
                </Link>
              )}

              {!isCustomerPortal && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                  aria-label="Toggle menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {!isCustomerPortal && isMobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-4 shadow-2xl max-h-[calc(100vh-64px)] overflow-y-auto">
            {isAuthenticated && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-950 flex items-center justify-center font-bold text-amber-400">
                  {currentUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.full_name}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getRoleBadgeStyle(userRole)}`}
                  >
                    {getRoleIcon(userRole)}
                    {userRole}
                  </span>
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
                {isAuthenticated ? 'Your portal' : 'Explore'}
              </p>
              <div className="space-y-1">
                {(isAuthenticated ? currentRoleNav : publicLinks).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold ${isActive
                          ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
              {isAuthenticated ? (
                <>
                  {showBookCta && (
                    <Link
                      href="/customer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="btn-primary w-full"
                    >
                      <Compass className="w-4 h-4" />
                      Book a journey
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/sign-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-secondary text-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-brand text-center"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Customer Portal Mobile Sidebar Drawer (slides smoothly left to right) */}
      {isCustomerPortal && (
        <CustomerMobileSidebar
          isOpen={isCustomerSidebarOpen}
          onClose={handleCloseCustomerSidebar}
        />
      )}

      {/* Mobile sticky book bar: only for customers and guests (hidden on all auth flows & customer portal) */}
      {showBookCta && !pathname.startsWith('/customer') && !isAuthRoute && (!isAuthenticated || userRole === 'customer') && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
          <Link
            href="/customer"
            className="pointer-events-auto btn-primary w-full shadow-2xl shadow-amber-950/40 py-3.5"
          >
            <Compass className="w-4 h-4" />
            Book your journey
            <ArrowRightSafe />
          </Link>
        </div>
      )}
    </>
  );
}

function ArrowRightSafe() {
  return <span aria-hidden className="text-base leading-none">→</span>;
}

interface NotificationDropdownProps {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    timestamp: string | number | Date;
    read: boolean;
  }>;
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

function NotificationDropdownContent({
  notifications,
  unreadCount,
  markNotificationAsRead,
  clearNotifications,
}: NotificationDropdownProps) {
  return (
    <>
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-amber-500" />
          Notifications
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
              {unreadCount} new
            </span>
          )}
        </span>
        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              You&apos;re all caught up
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Trip updates will appear here
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markNotificationAsRead(n.id)}
              className={`w-full text-left px-4 py-3 text-xs transition-colors ${
                n.read
                  ? 'bg-white dark:bg-slate-900/40 text-slate-500'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200'
              } hover:bg-slate-50 dark:hover:bg-slate-800/60`}
            >
              <div className="flex items-center justify-between mb-0.5 gap-2">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {n.title}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(n.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="line-clamp-2 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                {n.message}
              </p>
            </button>
          ))
        )}
      </div>
    </>
  );
}
