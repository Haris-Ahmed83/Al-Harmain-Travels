'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the location tagline / micro-subtitle */
  showSubtitle?: boolean;
  /** Custom subtitle text (defaults to 'MAKKAH · MADINAH · JEDDAH') */
  subtitle?: string;
  /** Whether clicking the logo navigates to '/' */
  href?: string;
  /** Additional CSS classes on the outer container */
  className?: string;
  /** Compact mode: hides subtitle even on larger screens */
  compact?: boolean;
}

/**
 * Official Al Harmain Travel Luxury Architectural Emblem
 * Symmetrical Saudi architectural sanctuary arch with central dome,
 * twin minarets, and crescent finials rendered in rich metallic gold and royal emerald.
 */
export function BrandEmblem({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`relative ${sizeMap[size]} shrink-0 rounded-2xl p-[1.5px] bg-gradient-to-b from-[#e5c567] via-[#b8922a] to-[#785918] shadow-md shadow-emerald-950/20 group-hover:shadow-amber-500/20 group-hover:scale-[1.03] transition-all duration-300 ${className}`}
    >
      {/* Inner background with deep royal emerald gradient */}
      <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-[#062c20] via-[#041c14] to-[#02130e] flex items-center justify-center overflow-hidden relative">
        {/* Subtle radial gold spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.25)_0%,transparent_70%)] pointer-events-none" />

        {/* Vector Architectural Sacred Sanctuary Mark */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[84%] h-[84%] relative z-10 transition-transform duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="emblemGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdf3cf" />
              <stop offset="40%" stopColor="#d4af37" />
              <stop offset="80%" stopColor="#b8922a" />
              <stop offset="100%" stopColor="#8c6a17" />
            </linearGradient>
            <linearGradient id="emblemGoldLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff8e1" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
            <linearGradient id="domeFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0b5c43" />
              <stop offset="100%" stopColor="#04261b" />
            </linearGradient>
          </defs>

          {/* Outer Royal Islamic Arch Frame */}
          <path
            d="M10 40V24C10 16.268 16.268 10 24 10C31.732 10 38 16.268 38 24V40"
            stroke="url(#emblemGold)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Top Apex Crown Crescent */}
          <path
            d="M24 5.5C25.38 5.5 26.5 6.62 26.5 8C26.5 9.38 25.38 10.5 24 10.5C23.2 10.5 22.48 10.12 22 9.53C22.69 9.37 23.2 8.75 23.2 8C23.2 7.25 22.69 6.63 22 6.47C22.48 5.88 23.2 5.5 24 5.5Z"
            fill="url(#emblemGoldLight)"
          />

          {/* Central Sacred Dome */}
          <path
            d="M18.5 28C18.5 21.5 24 17.5 24 17.5C24 17.5 29.5 21.5 29.5 28H18.5Z"
            fill="url(#domeFill)"
            stroke="url(#emblemGold)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Dome Spire with Crescent */}
          <path
            d="M24 17.5V13.5"
            stroke="url(#emblemGold)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="24" cy="13" r="1.2" fill="url(#emblemGoldLight)" />

          {/* Symmetrical Left Minaret */}
          <path
            d="M12.5 38V22H15.5V38"
            stroke="url(#emblemGold)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Left Minaret Balcony & Cap */}
          <path
            d="M11.5 22H16.5M14 18V22M14 18C14 17 14 16 14 16"
            stroke="url(#emblemGold)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="14" cy="16" r="0.9" fill="url(#emblemGoldLight)" />

          {/* Symmetrical Right Minaret */}
          <path
            d="M32.5 38V22H35.5V38"
            stroke="url(#emblemGold)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Right Minaret Balcony & Cap */}
          <path
            d="M31.5 22H36.5M34 18V22M34 18C34 17 34 16 34 16"
            stroke="url(#emblemGold)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="34" cy="16" r="0.9" fill="url(#emblemGoldLight)" />

          {/* Sanctuary Arched Main Gate (Center Portal) */}
          <path
            d="M20.5 40V33C20.5 30.5 22 29 24 29C26 29 27.5 30.5 27.5 33V40"
            stroke="url(#emblemGold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Horizontal Plinth / Foundation Base */}
          <path
            d="M8 40H40"
            stroke="url(#emblemGold)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M10 42.5H38"
            stroke="url(#emblemGold)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.75"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * Unified Official Brand Logo for Al Harmain Travel.
 * Features the official emblem, luxury display typography, and clear location subtitle.
 */
export default function BrandLogo({
  size = 'md',
  showSubtitle = true,
  subtitle = 'Makkah · Madinah · Jeddah',
  href = '/',
  className = '',
  compact = false,
}: BrandLogoProps) {
  const titleSizeMap = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-[1.35rem]',
    lg: 'text-xl sm:text-2xl',
  };

  const subtitleSizeMap = {
    sm: 'text-[8px] sm:text-[8.5px]',
    md: 'text-[8.5px] sm:text-[9.5px]',
    lg: 'text-[9.5px] sm:text-[10.5px]',
  };

  const content = (
    <div className={`flex items-center gap-2.5 sm:gap-3 group shrink-0 select-none ${className}`}>
      <BrandEmblem size={size} />
      <div className="flex flex-col min-w-0 leading-none">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span
            className={`font-display ${titleSizeMap[size]} font-semibold tracking-heading text-slate-900 dark:text-white transition-colors group-hover:text-emerald-700 dark:group-hover:text-emerald-300`}
          >
            Al Harmain
          </span>
          <span
            className={`font-display ${titleSizeMap[size]} font-medium italic tracking-heading text-[#b8922a] dark:text-[#f0d484] transition-colors`}
          >
            Travel
          </span>
        </div>

        {showSubtitle && !compact && (
          <p
            className={`${subtitleSizeMap[size]} uppercase tracking-[0.2em] font-semibold text-emerald-700/90 dark:text-emerald-400/90 mt-1 truncate transition-opacity hidden xs:block`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl"
        title="Al Harmain Travel — Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
