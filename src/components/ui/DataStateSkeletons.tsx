'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-card border border-base shadow-sm animate-pulse space-y-2">
      <div className="h-3 w-24 bg-surface rounded-md" />
      <div className="h-7 w-16 bg-surface rounded-md mt-1" />
      <div className="h-2.5 w-28 bg-surface rounded-md" />
    </div>
  );
}

export function TableSkeletonRows({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse border-b border-base/60">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="p-3">
              <div
                className="h-3.5 bg-surface rounded-md"
                style={{ width: `${Math.max(40, ((cIdx + 1) * 37) % 85 + 20)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CardGridSkeleton({ count = 6, heightClass = 'h-48' }: { count?: number; heightClass?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`${heightClass} rounded-3xl bg-card border border-base p-5 shadow-xl animate-pulse space-y-4`}
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-surface rounded-md" />
            <div className="h-4 w-16 bg-surface rounded-full" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full bg-surface rounded-md" />
            <div className="h-3 w-4/5 bg-surface rounded-md" />
            <div className="h-3 w-3/5 bg-surface rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyStateView({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}) {
  return (
    <div className="p-12 text-center bg-card border border-base rounded-3xl space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-surface border border-base flex items-center justify-center text-muted mx-auto">
        <Icon className="w-6 h-6 text-muted" />
      </div>
      <h4 className="text-base font-bold text-primary">{title}</h4>
      <p className="text-xs text-muted max-w-sm mx-auto">{description}</p>
      {actionLabel && (
        <div className="pt-2">
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow"
            >
              {actionLabel}
            </a>
          ) : onAction ? (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
