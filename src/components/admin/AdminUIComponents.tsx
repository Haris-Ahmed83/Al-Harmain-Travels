'use client';

import React from 'react';
import {
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Car,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   1. ACTIVITY-BASED COLOR MAPPING & BADGES
   Green: Active, Verified, Confirmed, Completed, Available, Accepted, Success
   Red: Delete, Failed, Rejected, Cancelled, Inactive, Suspended, Deactivated
   Amber/Yellow: Pending, Waiting, Warning, Requires attention
   Blue: Information, View, Navigation, General actions, Assigned
   Purple: Special/admin-level actions, VIP, In-Progress, Trip Started
   Neutral/Gray: Secondary actions, inactive UI, metadata
───────────────────────────────────────────────────────────────────────────── */

export type ActivityTone = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'neutral';

export function getActivityTone(status?: string | null): ActivityTone {
  if (!status) return 'neutral';
  const s = status.toLowerCase().replace(/[\s-]/g, '_');

  // Green
  if (
    [
      'active',
      'verified',
      'confirmed',
      'completed',
      'ride_completed',
      'trip_completed',
      'payment_completed',
      'available',
      'accepted',
      'driver_accepted',
      'success',
      'published',
      'valid',
      'certified',
    ].includes(s)
  ) {
    return 'green';
  }

  // Red
  if (
    [
      'delete',
      'deleted',
      'failed',
      'rejected',
      'cancelled',
      'canceled',
      'inactive',
      'deactivated',
      'suspended',
      'critical',
      'error',
      'expired',
      'hidden',
    ].includes(s)
  ) {
    return 'red';
  }

  // Amber / Yellow
  if (
    [
      'pending',
      'waiting',
      'warning',
      'unverified',
      'awaiting',
      'unassigned',
      'scheduled',
      'maintenance',
      'payment_pending',
    ].includes(s)
  ) {
    return 'amber';
  }

  // Blue
  if (
    [
      'info',
      'view',
      'assigned',
      'driver_assigned',
      'dispatcher',
      'staff',
      'navigation',
      'open',
    ].includes(s)
  ) {
    return 'blue';
  }

  // Purple
  if (
    [
      'admin',
      'administrator',
      'vip',
      'vip_gmc',
      'trip_started',
      'ride_started',
      'driver_arriving',
      'driver_arrived',
      'en_route',
      'in_progress',
      'special',
    ].includes(s)
  ) {
    return 'purple';
  }

  return 'neutral';
}

interface AdminStatusBadgeProps {
  status: string;
  label?: string;
  tone?: ActivityTone;
  showDot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function AdminStatusBadge({
  status,
  label,
  tone,
  showDot = true,
  size = 'md',
  className = '',
}: AdminStatusBadgeProps) {
  const effectiveTone = tone || getActivityTone(status);
  const displayLabel = label || status.replace(/_/g, ' ');

  const toneClasses: Record<ActivityTone, { container: string; dot: string }> = {
    green: {
      container:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15',
      dot: 'bg-emerald-500',
    },
    red: {
      container:
        'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/15',
      dot: 'bg-rose-500',
    },
    amber: {
      container:
        'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/15',
      dot: 'bg-amber-500',
    },
    blue: {
      container:
        'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/15',
      dot: 'bg-sky-500',
    },
    purple: {
      container:
        'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/15',
      dot: 'bg-purple-500',
    },
    neutral: {
      container:
        'bg-surface text-secondary border-base hover:bg-elevated',
      dot: 'bg-muted',
    },
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5 font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider border transition-colors shadow-2xs select-none ${sizeClasses} ${toneClasses[effectiveTone].container} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${toneClasses[effectiveTone].dot} ${
            effectiveTone === 'green' || effectiveTone === 'amber' ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. ACCESSIBLE ACTION BUTTONS (View → Edit → Delete → More)
   Icons are visible, clickable areas are generous (min 36x36px) with tooltips.
───────────────────────────────────────────────────────────────────────────── */

export type ActionButtonVariant = 'view' | 'edit' | 'delete' | 'more' | 'primary' | 'secondary';

interface AdminActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ActionButtonVariant;
  tooltip: string;
  icon?: React.ReactNode;
  label?: string;
}

export function AdminActionButton({
  variant,
  tooltip,
  icon,
  label,
  className = '',
  disabled,
  ...props
}: AdminActionButtonProps) {
  const variantStyles: Record<ActionButtonVariant, string> = {
    view: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/25 hover:border-sky-500/40 focus-visible:ring-sky-500',
    edit: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25 hover:border-amber-500/40 focus-visible:ring-amber-500',
    delete:
      'text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/25 hover:border-rose-500/40 focus-visible:ring-rose-500',
    more: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/25 hover:border-purple-500/40 focus-visible:ring-purple-500',
    primary:
      'text-white bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-sm focus-visible:ring-emerald-500',
    secondary:
      'text-secondary hover:text-primary bg-surface hover:bg-elevated border-base focus-visible:ring-amber-500',
  };

  const defaultIcons: Record<ActionButtonVariant, React.ReactNode> = {
    view: <Eye className="w-4 h-4 shrink-0" />,
    edit: <Pencil className="w-4 h-4 shrink-0" />,
    delete: <Trash2 className="w-4 h-4 shrink-0" />,
    more: <MoreVertical className="w-4 h-4 shrink-0" />,
    primary: <CheckCircle2 className="w-4 h-4 shrink-0" />,
    secondary: <ChevronRight className="w-4 h-4 shrink-0" />,
  };

  const effectiveIcon = icon || defaultIcons[variant];

  return (
    <button
      type="button"
      title={tooltip}
      aria-label={tooltip}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-95 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {effectiveIcon}
      {label && <span className="font-medium text-xs">{label}</span>}
    </button>
  );
}

export function AdminActionGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-1.5 sm:gap-2 ${className}`}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. UNIFIED PAGE HEADER
───────────────────────────────────────────────────────────────────────────── */

interface AdminPageHeaderProps {
  eyebrow?: string;
  badge?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function AdminPageHeader({
  eyebrow = 'Administration HQ',
  badge,
  title,
  description,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="bg-card border border-base p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
      <div className="space-y-1.5 max-w-3xl z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="type-eyebrow text-amber-600 dark:text-amber-400 font-bold">
            {eyebrow}
          </span>
          {badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <Shield className="w-3 h-3 text-emerald-500" />
              {badge}
            </span>
          )}
        </div>
        <h1 className="type-page-title text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-secondary leading-relaxed">
          {description}
        </p>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. STANDARDIZED KPI / STAT CARD
───────────────────────────────────────────────────────────────────────────── */

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: ActivityTone;
  trend?: string;
  onClick?: () => void;
  className?: string;
}

export function AdminStatCard({
  title,
  value,
  subtitle,
  icon,
  tone = 'neutral',
  trend,
  onClick,
  className = '',
}: AdminStatCardProps) {
  const iconTones: Record<ActivityTone, string> = {
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    red: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    neutral: 'bg-surface text-secondary border-base',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-card border border-base shadow-xs hover:border-strong hover:shadow-md transition-all flex flex-col justify-between group ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-muted group-hover:text-primary transition-colors">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${iconTones[tone]}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-primary font-sans tracking-tight">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            {trend && (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {trend}
              </span>
            )}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. STANDARDIZED DATA TABLE WRAPPER
───────────────────────────────────────────────────────────────────────────── */

interface AdminTableCardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  totalCount?: number;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AdminTableCard({
  title,
  subtitle,
  badge,
  totalCount,
  headerAction,
  children,
  footer,
  className = '',
}: AdminTableCardProps) {
  const displayBadge = badge || (typeof totalCount === 'number' ? `${totalCount} records` : undefined);

  return (
    <div
      className={`bg-card border border-base rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}
    >
      {(title || headerAction) && (
        <div className="p-5 sm:p-6 border-b border-base flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/30">
          <div>
            <div className="flex items-center gap-2">
              {title && <h2 className="text-base sm:text-lg font-bold text-primary">{title}</h2>}
              {displayBadge && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface text-secondary border border-base">
                  {displayBadge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}

      <div className="overflow-x-auto">{children}</div>

      {footer && (
        <div className="p-4 border-t border-base bg-surface/30 text-xs text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {footer}
        </div>
      )}
    </div>
  );
}
