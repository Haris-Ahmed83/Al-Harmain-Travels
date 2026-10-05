'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import {
  Car,
  Compass,
  LayoutDashboard,
  Bell,
  Shield,
  User,
  Menu,
  X,
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
  ChevronRight,
  Star,
  Sliders,
  Receipt,
  Phone,
  Sparkles,
  Globe,
} from 'lucide-react';

import BrandLogo from '@/components/ui/BrandLogo';
import CustomerMobileSidebar from '@/components/customer/CustomerMobileSidebar';
import AdminMobileSidebar from '@/components/admin/AdminMobileSidebar';

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
    settings,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCustomerSidebarOpen, setIsCustomerSidebarOpen] = useState(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCloseCustomerSidebar = useCallback(() => {
    setIsCustomerSidebarOpen(false);
  }, []);

  const handleToggleCustomerSidebar = useCallback(() => {
    setIsCustomerSidebarOpen((prev) => !prev);
    setIsNotifOpen(false);
  }, []);

  const handleCloseAdminSidebar = useCallback(() => {
    setIsAdminSidebarOpen(false);
  }, []);

  const handleToggleAdminSidebar = useCallback(() => {
    setIsAdminSidebarOpen((prev) => !prev);
    setIsNotifOpen(false);
  }, []);

  const notifRef = useRef<HTMLDivElement>(null);
  const customerMobileNotifRef = useRef<HTMLDivElement>(null);
  const adminMobileNotifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isCustomer = userRole === 'customer';
  const isCustomerPortal = pathname.startsWith('/customer');
  const isAdminPortal = pathname.startsWith('/admin');
  const isDispatcherPortal = pathname.startsWith('/dispatcher');
  const isDriverPortal = pathname.startsWith('/driver');
  const isAuthRoute =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/verify-phone') ||
    pathname.startsWith('/callback') ||
    pathname.startsWith('/auth');

  const showBookCta =
    (!isAuthenticated || isCustomer) &&
    !isCustomerPortal &&
    !isAdminPortal &&
    !isDispatcherPortal &&
    !isDriverPortal &&
    !isAuthRoute;

  const getAdminPageTitle = (path: string) => {
    if (path === '/admin') return 'Overview';
    if (path.startsWith('/admin/users')) return 'Users & Access';
    if (path.startsWith('/admin/rates')) return 'Rates & Tariff';
    if (path.startsWith('/admin/services')) return 'Services CMS';
    if (path.startsWith('/admin/reports')) return 'Reports & Ledger';
    if (path.startsWith('/admin/audit-logs')) return 'Audit Logs';
    if (path.startsWith('/admin/settings')) return 'System Settings';
    return 'Admin HQ';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideDesktopNotif = notifRef.current?.contains(target);
      const insideMobileNotif = customerMobileNotifRef.current?.contains(target);
      const insideAdminMobileNotif = adminMobileNotifRef.current?.contains(target);
      if (!insideDesktopNotif && !insideMobileNotif && !insideAdminMobileNotif) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileMenuBtnRef.current &&
        !mobileMenuBtnRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCustomerSidebarOpen(false);
    setIsAdminSidebarOpen(false);
    setIsNotifOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Clean, minimal public navigation links (strictly 4 items)
  const publicLinks = [
    { label: 'Home', href: '/', icon: Compass },
    { label: 'About', href: '/about', icon: Info },
    { label: 'Services', href: '/services', icon: Briefcase },
    { label: 'Contact', href: '/contact', icon: PhoneCall },
  ];


  // Dispatcher Portal Navigation (5 modules)
  const dispatcherLinks = [
    { label: 'Radar', href: '/dispatcher', icon: Compass },
    { label: 'Queue', href: '/dispatcher/queue', icon: Clock },
    { label: 'Drivers', href: '/dispatcher/drivers', icon: Car },
    { label: 'Customers', href: '/dispatcher/customers', icon: Users },
    { label: 'New Booking', href: '/dispatcher/new-booking', icon: Briefcase },
  ];

  // Driver Portal Navigation (3 modules)
  const driverLinks = [
    { label: 'Cockpit', href: '/driver', icon: Car },
    { label: 'Earnings', href: '/driver/earnings', icon: DollarSign },
    { label: 'Profile', href: '/driver/profile', icon: User },
  ];

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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-roseGold/10 bg-white md:bg-ivory/80 dark:bg-[#041a13]/90 dark:border-roseGold/15 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* ─────────────────────────────────────────────────────────────
              1. CUSTOMER DASHBOARD MOBILE NAVBAR (< lg screens)
              - Preserves dedicated customer portal layout with sidebar toggle
          ───────────────────────────────────────────────────────────── */}
          {isCustomerPortal && (
            <div className="lg:hidden relative flex items-center justify-between h-16 sm:h-20 w-full transition-all duration-300">
              {/* Left corner: Hamburger menu icon */}
              <div className="flex items-center z-10 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleCustomerSidebar();
                  }}
                  className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200/80 dark:border-emerald-800/40 transition-colors flex items-center justify-center w-10 h-10 shadow-xs cursor-pointer active:scale-95"
                  aria-label={isCustomerSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
                  aria-expanded={isCustomerSidebarOpen}
                >
                  <Menu className="w-5 h-5 transition-transform" />
                </button>
              </div>

              {/* Center: Official Al Harmain Travel Logo (centered) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 select-none">
                <div className="pointer-events-auto">
                  <BrandLogo size="sm" href="/customer" showSubtitle={false} />
                </div>
              </div>

              {/* Right corner: Notification bell icon with unread badge */}
              <div className="flex items-center z-10 shrink-0 gap-1.5">
                <div className="relative" ref={customerMobileNotifRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsNotifOpen((prev) => !prev);
                      if (isCustomerSidebarOpen) setIsCustomerSidebarOpen(false);
                    }}
                    className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200/80 dark:border-emerald-800/40 relative transition-colors flex items-center justify-center w-10 h-10 shadow-xs cursor-pointer active:scale-95"
                    aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                    aria-expanded={isNotifOpen}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Mobile Notification Popover */}
                  {isNotifOpen && (
                    <div className="fixed sm:absolute top-[70px] sm:top-full sm:mt-2 right-2 sm:right-0 w-[min(22rem,calc(100vw-1rem))] bg-white dark:bg-[#07241b] border border-slate-200 dark:border-emerald-800/40 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-50 duration-200">
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
              1B. ADMIN DASHBOARD MOBILE NAVBAR (< lg screens)
              - Mobile menu trigger, page title/breadcrumb, notifications & profile
          ───────────────────────────────────────────────────────────── */}
          {isAdminPortal && (
            <div className="lg:hidden relative flex items-center justify-between h-16 sm:h-20 w-full transition-all duration-300">
              {/* Left corner: Hamburger menu icon */}
              <div className="flex items-center z-10 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleAdminSidebar();
                  }}
                  className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-amber-950/60 border border-slate-200/80 dark:border-amber-800/40 transition-colors flex items-center justify-center w-10 h-10 shadow-xs cursor-pointer active:scale-95"
                  aria-label={isAdminSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
                  aria-expanded={isAdminSidebarOpen}
                >
                  <Menu className="w-5 h-5 text-amber-500" />
                </button>
              </div>

              {/* Center: Admin Brand Logo / Page Title */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 select-none">
                <div className="pointer-events-auto flex items-center gap-1.5">
                  <BrandLogo size="sm" href="/admin" showSubtitle={false} />
                  <span className="hidden xs:inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    <Shield className="w-2.5 h-2.5 text-amber-500" />
                    HQ
                  </span>
                </div>
              </div>

              {/* Right corner: Notification bell icon with unread badge */}
              <div className="flex items-center z-10 shrink-0 gap-1.5">
                <div className="relative" ref={adminMobileNotifRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsNotifOpen((prev) => !prev);
                      if (isAdminSidebarOpen) setIsAdminSidebarOpen(false);
                    }}
                    className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200/80 dark:border-emerald-800/40 relative transition-colors flex items-center justify-center w-10 h-10 shadow-xs cursor-pointer active:scale-95"
                    aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                    aria-expanded={isNotifOpen}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Mobile Notification Popover */}
                  {isNotifOpen && (
                    <div className="fixed sm:absolute top-[70px] sm:top-full sm:mt-2 right-2 sm:right-0 w-[min(22rem,calc(100vw-1rem))] bg-white dark:bg-[#07241b] border border-slate-200 dark:border-emerald-800/40 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-50 duration-200">
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
              2. DESKTOP ROW (lg+) OR PUBLIC PAGES ROW (all screens)
          ───────────────────────────────────────────────────────────── */}
          <div
            className={`${
              (isCustomerPortal || isAdminPortal) ? 'hidden lg:flex' : 'flex'
            } h-16 sm:h-20 items-center justify-between gap-4 transition-all duration-300`}
          >
            {/* Unified Official Brand Logo */}
            <BrandLogo
              size="md"
              href={
                isAdminPortal
                  ? '/admin'
                  : isDispatcherPortal
                  ? '/dispatcher'
                  : isDriverPortal
                  ? '/driver'
                  : '/'
              }
              subtitle={
                isAdminPortal
                  ? 'Executive Admin HQ'
                  : isDispatcherPortal
                  ? 'Fleet Operations HQ'
                  : isDriverPortal
                  ? 'Captain Driver Cockpit'
                  : 'Makkah · Madinah · Jeddah'
              }
            />

            {/* Center Navigation: Portal-specific (Admin Breadcrumb, Dispatcher, Driver, Customer) or Clean Public Links */}
            {isAdminPortal ? (
              <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  Executive Admin HQ
                </span>
                <span className="text-slate-300 dark:text-amber-800 font-mono">/</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {getAdminPageTitle(pathname)}
                </span>
              </div>
            ) : isDispatcherPortal ? (
              <nav
                className="hidden lg:flex items-center gap-1 xl:gap-1.5"
                aria-label="Dispatcher Navigation"
              >
                {dispatcherLinks.map((item) => {
                  const isActive =
                    item.href === '/dispatcher'
                      ? pathname === '/dispatcher'
                      : pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950/50'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            ) : isDriverPortal ? (
              <nav
                className="hidden lg:flex items-center gap-1 xl:gap-2"
                aria-label="Driver Navigation"
              >
                {driverLinks.map((item) => {
                  const isActive =
                    item.href === '/driver'
                      ? pathname === '/driver'
                      : pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-slate-100 dark:hover:bg-emerald-950/50'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isActive
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            ) : isCustomer && pathname.startsWith('/customer') ? (
              <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  VIP Customer Portal
                </span>
                <span className="text-slate-300 dark:text-emerald-800 font-mono">/</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
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
              <nav
                className="hidden lg:flex items-center gap-6 xl:gap-8"
                aria-label="Primary Navigation"
              >
                {publicLinks.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname === item.href || pathname.startsWith(item.href + '/');

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-body flex items-center gap-1 py-4 transition-colors duration-200 hover:text-roseGold font-semibold ${
                        isActive
                          ? 'text-roseGold border-b-2 border-roseGold -mb-[2px]'
                          : 'text-charcoal dark:text-slate-200'
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Quick Live Public Site link on Admin portal */}
              {isAdminPortal && (
                <Link
                  href="/"
                  className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200/80 dark:border-emerald-800/40 transition-all cursor-pointer"
                  title="Visit Public Website"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  <span>Live Site</span>
                </Link>
              )}

              {/* If on Public page but authenticated user is admin: Quick Admin HQ button */}
              {userRole === 'admin' && !isAdminPortal && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shadow-xs"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin HQ</span>
                </Link>
              )}
              {/* Active Trip Tracker Badge (Customer) */}
              {activeCustomerBooking && isCustomer && (
                <Link
                  href="/customer/track"
                  className="hidden md:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-600/50 text-emerald-700 dark:text-emerald-300 text-xs px-3.5 py-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-colors shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-soft-pulse shrink-0" />
                  <span className="font-semibold capitalize">
                    {activeCustomerBooking.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              )}

              {/* Notifications Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200/80 dark:border-emerald-800/40 relative transition-all cursor-pointer active:scale-95"
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                  aria-expanded={isNotifOpen}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-1.5rem))] bg-white dark:bg-[#07241b] border border-slate-200 dark:border-emerald-800/40 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-50 duration-200">
                    <NotificationDropdownContent
                      notifications={notifications}
                      unreadCount={unreadCount}
                      markNotificationAsRead={markNotificationAsRead}
                      clearNotifications={clearNotifications}
                    />
                  </div>
                )}
              </div>

              {/* Authenticated User Menu or Guest Sign In */}
              {isAuthLoading ? (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
              ) : isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 py-1 pl-1.5 pr-2.5 rounded-full bg-slate-100/80 dark:bg-emerald-950/60 hover:bg-slate-200/70 dark:hover:bg-emerald-900/60 border border-slate-200/80 dark:border-emerald-800/40 transition-all cursor-pointer active:scale-95"
                    aria-expanded={isUserMenuOpen}
                    aria-label="Account menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-950 border border-[#d4af37]/40 flex items-center justify-center font-bold text-xs text-amber-300 shadow-xs shrink-0">
                      {currentUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="hidden sm:block text-left leading-none">
                      <div className="text-[12px] font-bold text-slate-900 dark:text-white max-w-[95px] truncate">
                        {currentUser.full_name}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-sm text-[8.5px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(
                          userRole
                        )}`}
                      >
                        {getRoleIcon(userRole)}
                        {userRole}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#07241b] border border-slate-200 dark:border-emerald-800/40 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in-50 duration-200">
                      <div className="px-4 py-3 bg-slate-50 dark:bg-emerald-950/60 border-b border-slate-200 dark:border-emerald-800/30">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.full_name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 truncate mt-0.5">
                          {currentUser.email || 'Verified Account'}
                        </p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <Link
                          href={getDashboardUrl(userRole)}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                          My Dashboard
                        </Link>
                        {userRole === 'customer' && (
                          <Link
                            href="/customer/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                          >
                            <User className="w-3.5 h-3.5 text-teal-500" />
                            Profile &amp; Settings
                          </Link>
                        )}
                        {userRole === 'driver' && (
                          <Link
                            href="/driver/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                          >
                            <User className="w-3.5 h-3.5 text-teal-500" />
                            Driver Profile
                          </Link>
                        )}
                        {userRole === 'admin' && (
                          <Link
                            href="/admin/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                          >
                            <Sliders className="w-3.5 h-3.5 text-amber-500" />
                            System Settings
                          </Link>
                        )}
                        {userRole === 'dispatcher' && (
                          <Link
                            href="/dispatcher/queue"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            Active Queue
                          </Link>
                        )}
                        <div className="border-t border-slate-200 dark:border-emerald-800/30 my-1" />
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200/80 dark:border-emerald-800/40 transition-all cursor-pointer active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Primary Call to Action: Book a Ride */}
              {showBookCta && (
                <Link
                  href="/customer"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-[#d4af37] via-[#f0d484] to-[#d4af37] hover:from-[#c5a030] hover:to-[#dfc15a] shadow-md shadow-amber-500/15 hover:shadow-amber-500/25 transition-all duration-300 active:scale-95 group cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-slate-950 transition-transform group-hover:rotate-45" />
                  <span>Book a Ride</span>
                </Link>
              )}

              {/* Mobile Menu Button for Public Pages */}
              {!isCustomerPortal && !isAdminPortal && (
                <button
                  ref={mobileMenuBtnRef}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-950/60 border border-slate-200/80 dark:border-emerald-800/40 transition-colors flex items-center justify-center w-10 h-10 shadow-xs cursor-pointer active:scale-95"
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-500" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. LUXURY RESPONSIVE MOBILE MENU (Smooth, Reliable, Elegant)
        ───────────────────────────────────────────────────────────── */}
        {!isCustomerPortal && !isAdminPortal && isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden bg-white/98 md:bg-ivory/98 dark:bg-[#041a13]/98 backdrop-blur-2xl border-t border-roseGold/10 dark:border-roseGold/15 shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto animate-in slide-in-from-top-2 fade-in-50 duration-200"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
              {/* Authenticated User Status Bar in Mobile Menu */}
              {isAuthenticated && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-emerald-950/50 border border-slate-200 dark:border-emerald-800/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700 to-teal-950 border border-[#d4af37]/40 flex items-center justify-center font-bold text-sm text-amber-300 shrink-0">
                      {currentUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.full_name}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(
                          userRole
                        )}`}
                      >
                        {getRoleIcon(userRole)}
                        {userRole}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={getDashboardUrl(userRole)}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="shrink-0 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    Dashboard
                  </Link>
                </div>
              )}

              {/* Portal or Public Navigation Links */}
              {isDispatcherPortal ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-2 px-1">
                    Dispatcher Operations
                  </p>
                  <div className="space-y-1">
                    {dispatcherLinks.map((item) => {
                      const isActive =
                        item.href === '/dispatcher'
                          ? pathname === '/dispatcher'
                          : pathname === item.href || pathname.startsWith(item.href + '/');
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                            isActive
                              ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-emerald-950/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                          </div>
                          {isActive ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : isDriverPortal ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-2 px-1">
                    Driver Cockpit
                  </p>
                  <div className="space-y-1">
                    {driverLinks.map((item) => {
                      const isActive =
                        item.href === '/driver'
                          ? pathname === '/driver'
                          : pathname === item.href || pathname.startsWith(item.href + '/');
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                            isActive
                              ? 'text-teal-800 dark:text-teal-300 bg-teal-500/15 border border-teal-500/30 font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-emerald-950/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-teal-500' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                          </div>
                          {isActive ? (
                            <span className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.9)]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-emerald-400/80 mb-2 px-1">
                    Menu
                  </p>
                  <div className="space-y-1">
                    {publicLinks.map((item) => {
                      const isActive =
                        item.href === '/'
                          ? pathname === '/'
                          : pathname === item.href || pathname.startsWith(item.href + '/');

                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-body font-semibold transition-all duration-200 ${
                            isActive
                              ? 'text-roseGold bg-roseGold/10 border border-roseGold/20'
                              : 'text-charcoal dark:text-slate-200 hover:text-roseGold hover:bg-roseGold/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-roseGold' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                          </div>
                          {isActive ? (
                            <span className="w-2 h-2 rounded-full bg-roseGold shadow-[0_0_8px_rgba(197,168,128,0.9)]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mobile Menu Footer Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-emerald-800/30 space-y-3">
                {/* For Admin/Staff Portals: Quick Public Site Switcher */}
                {(isAdminPortal || isDispatcherPortal || isDriverPortal) && (
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-500" />
                      <span>View Public Website</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                )}

                {/* Support Hotline */}
                <div className="flex items-center justify-center gap-2 px-1">
                  <a
                    href={`tel:${settings.support_phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    <span>24/7 Support: {settings.support_phone}</span>
                  </a>
                </div>

                {/* Primary CTA and Auth Controls */}
                {isAuthenticated ? (
                  <div className="space-y-2 pt-1">
                    {isAdminPortal && (
                      <Link
                        href="/admin/settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-[#d4af37] via-[#f0d484] to-[#d4af37] shadow-lg shadow-amber-500/20"
                      >
                        <Sliders className="w-4 h-4" />
                        <span>System Settings</span>
                      </Link>
                    )}
                    {showBookCta && (
                      <Link
                        href="/customer"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-[#d4af37] via-[#f0d484] to-[#d4af37] shadow-lg shadow-amber-500/20"
                      >
                        <Compass className="w-4 h-4" />
                        <span>Book Your Journey</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <Link
                      href="/customer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-[#d4af37] via-[#f0d484] to-[#d4af37] shadow-lg shadow-amber-500/20"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Book a Ride</span>
                    </Link>
                    <Link
                      href="/sign-in"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-800/40 hover:bg-slate-200 dark:hover:bg-emerald-900/60 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Customer Portal Mobile Sidebar Drawer */}
      {isCustomerPortal && (
        <CustomerMobileSidebar
          isOpen={isCustomerSidebarOpen}
          onClose={handleCloseCustomerSidebar}
        />
      )}

      {/* Admin Portal Mobile Sidebar Drawer */}
      {isAdminPortal && (
        <AdminMobileSidebar
          isOpen={isAdminSidebarOpen}
          onClose={handleCloseAdminSidebar}
        />
      )}

      {/* Mobile sticky book bar: only for customers and guests (hidden on all auth flows & customer portal) */}
      {showBookCta && !pathname.startsWith('/customer') && !isAuthRoute && (!isAuthenticated || userRole === 'customer') && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
          <Link
            href="/customer"
            className="pointer-events-auto w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full text-xs font-bold text-slate-950 bg-gradient-to-r from-[#d4af37] via-[#f0d484] to-[#d4af37] shadow-2xl shadow-amber-950/50 hover:scale-[1.01] active:scale-[0.98] transition-all"
          >
            <Compass className="w-4 h-4 text-slate-950" />
            <span>Book Your Journey</span>
            <span aria-hidden className="text-base leading-none">→</span>
          </Link>
        </div>
      )}
    </>
  );
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
      <div className="px-4 py-3 bg-slate-50 dark:bg-emerald-950/60 border-b border-slate-200 dark:border-emerald-800/30 flex items-center justify-between">
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
            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-emerald-900/30">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-slate-300 dark:text-emerald-800/60 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              You&apos;re all caught up
            </p>
            <p className="text-[11px] text-slate-400 dark:text-emerald-400/60 mt-1">
              Trip updates will appear here
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markNotificationAsRead(n.id)}
              className={`w-full text-left px-4 py-3 text-xs transition-colors cursor-pointer ${
                n.read
                  ? 'bg-white dark:bg-transparent text-slate-500 dark:text-slate-400'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-800 dark:text-slate-200'
              } hover:bg-slate-50 dark:hover:bg-emerald-900/30`}
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
