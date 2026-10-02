'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export interface FlagBannerProps {
  id: string;
  type: 'stat' | 'license';
  value?: string;
  numericTarget?: number;
  decimals?: number;
  suffix?: string;
  label: string;
  sublabel?: string;
  licenseNumber?: string;
  index: number;
}

export default function FlagBanner({
  id: _id,
  type,
  value,
  numericTarget,
  decimals = 0,
  suffix = '',
  label,
  sublabel,
  licenseNumber,
  index,
}: FlagBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(media.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, []);

  // Intersection Observer for scroll-triggered reveal & count-up
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Smooth count-up animation
  useEffect(() => {
    if (!isInView || numericTarget === undefined) return;
    if (prefersReducedMotion) {
      setDisplayNumber(numericTarget);
      return;
    }

    const duration = 2000; // 2s smooth count-up
    let startTime: number | null = null;
    let animId = 0;

    const step = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      // Luxury smooth ease-out: cubic-bezier(0.22, 1, 0.36, 1) approximation
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = ease * numericTarget;
      setDisplayNumber(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayNumber(numericTarget);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isInView, numericTarget, prefersReducedMotion]);

  // Format count-up display
  const formattedValue = () => {
    if (numericTarget !== undefined) {
      const num = displayNumber !== null ? displayNumber : (prefersReducedMotion ? numericTarget : 0);
      if (decimals > 0) {
        return num.toFixed(decimals) + suffix;
      }
      return Math.round(num).toLocaleString() + suffix;
    }
    return value || '';
  };

  // Distinct smooth motion timings per banner (6.8s to 8.6s)
  const durations = [7.2, 8.4, 6.8];
  const delays = [0, 1.2, 0.6];
  const swayDuration = durations[index % durations.length];
  const swayDelay = delays[index % delays.length];

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col items-center select-none w-full max-w-[260px] sm:max-w-[270px] mx-auto cursor-pointer transition-transform duration-500 ease-out"
      style={{
        opacity: isInView || prefersReducedMotion ? 1 : 0,
        transform:
          isInView || prefersReducedMotion
            ? 'translateY(0)'
            : 'translateY(24px)',
        transition: prefersReducedMotion
          ? 'none'
          : `opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${index * 120}ms, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${index * 120}ms`,
      }}
    >
      {/* ── 1. Sleek, Minimalist Gold Hanging Rod & Finials ── */}
      <div className="relative w-full flex items-center justify-center z-20">
        {/* Left Finial Orb */}
        <div
          className="w-2 h-2 rounded-full shadow-sm shrink-0"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #f7e8ba 0%, #c9a54c 65%, #8c6e26 100%)',
          }}
        />

        {/* Slim Gold Bar */}
        <div
          className="h-[2px] w-[90%] mx-0.5 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, #8c6e26 0%, #c9a54c 20%, #fbf3dc 50%, #c9a54c 80%, #8c6e26 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />

        {/* Right Finial Orb */}
        <div
          className="w-2 h-2 rounded-full shadow-sm shrink-0"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #f7e8ba 0%, #c9a54c 65%, #8c6e26 100%)',
          }}
        />
      </div>

      {/* Hanging Suspension Cords (Delicate, Clean) */}
      <div className="w-[80%] flex justify-between px-4 z-10 -mt-[1px] mb-[2px]">
        <div className="w-[1px] h-2.5 bg-gradient-to-b from-[#c9a54c] to-[#8c6e26]" />
        <div className="w-[1px] h-2.5 bg-gradient-to-b from-[#c9a54c] to-[#8c6e26]" />
      </div>

      {/* ── 2. Smooth Floating Fabric Banner Body with Gentle 3D Wave ── */}
      <div
        className="relative w-full will-change-transform"
        style={{
          transformOrigin: 'top center',
          animation: prefersReducedMotion
            ? 'none'
            : isHovered
            ? `smoothClothWaveHover ${swayDuration * 0.75}s ease-in-out infinite alternate`
            : `smoothClothWave ${swayDuration}s ease-in-out ${swayDelay}s infinite alternate`,
          filter: prefersReducedMotion
            ? 'drop-shadow(0 10px 16px rgba(7, 33, 24, 0.18))'
            : 'drop-shadow(0 12px 20px rgba(7, 33, 24, 0.22)) drop-shadow(0 2px 6px rgba(0,0,0,0.1))',
        }}
      >
        {/* Banner Fabric Envelope */}
        <div
          className="relative w-full rounded-b-xl overflow-hidden px-4 pt-4 pb-5 text-center transition-all duration-400"
          style={{
            background:
              'linear-gradient(175deg, #0a3827 0%, #06261a 55%, #041911 100%)',
            borderLeft: '1px solid rgba(201, 165, 76, 0.45)',
            borderRight: '1px solid rgba(201, 165, 76, 0.45)',
            borderBottom: '1.5px solid rgba(201, 165, 76, 0.6)',
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Fine Embroidered Gold Border Stitch */}
          <div
            className="absolute inset-1 rounded-b-lg pointer-events-none"
            style={{
              border: '1px dashed rgba(201, 165, 76, 0.35)',
            }}
          />

          {/* Subtle Star Fabric Watermark */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-color-dodge"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, #c9a54c 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          />

          {/* Smooth Silk Sheen Sweep */}
          {!prefersReducedMotion && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(110deg, transparent 25%, rgba(247, 232, 186, 0.12) 48%, rgba(255, 255, 255, 0.22) 52%, rgba(247, 232, 186, 0.1) 56%, transparent 75%)',
                animation: `silkSheenSmooth ${swayDuration * 0.9}s ease-in-out ${swayDelay + 0.3}s infinite`,
              }}
            />
          )}

          {/* Banner Content (Razor-sharp, 100% crisp typography) */}
          <div className="relative z-10 flex flex-col items-center">
            {type === 'license' ? (
              /* MOT CERTIFIED BANNER CONTENT */
              <div className="space-y-2.5">
                {/* Refined Gold Shield Seal */}
                <div
                  className="mx-auto w-10 h-10 rounded-full flex items-center justify-center p-0.5 shadow-md group-hover:scale-105 transition-transform duration-300"
                  style={{
                    background:
                      'linear-gradient(135deg, #f7e8ba 0%, #c9a54c 55%, #8c6e26 100%)',
                    boxShadow: '0 2px 8px rgba(201, 165, 76, 0.25)',
                  }}
                >
                  <div className="w-full h-full rounded-full bg-[#06261a] flex items-center justify-center border border-[#f7e8ba]/40">
                    <ShieldCheck className="w-5 h-5 text-[#f7e8ba]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div
                    className="font-serif text-base sm:text-[17px] font-bold tracking-tight text-[#fbf5e6] leading-tight"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                  >
                    {label}
                  </div>
                  {licenseNumber && (
                    <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold text-[#f7e8ba] bg-[#093827]/90 border border-[#c9a54c]/40">
                      {licenseNumber}
                    </div>
                  )}
                </div>

                {sublabel && (
                  <p className="text-[11px] text-[#ddd8cd] leading-snug max-w-[190px] mx-auto font-sans font-normal opacity-90">
                    {sublabel}
                  </p>
                )}
              </div>
            ) : (
              /* STAT BANNER CONTENT (150,000+ / 99.8%) */
              <div className="space-y-1">
                {/* Professional Crisp Gold Numerals in Serif */}
                <div
                  className="font-serif text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-[#f8edd2]"
                  style={{
                    filter: 'drop-shadow(0 1px 3px rgba(201, 165, 76, 0.3))',
                  }}
                >
                  {formattedValue()}
                </div>

                {/* Label (Crisp Contrast) */}
                <div className="font-sans font-semibold text-xs sm:text-[13px] text-[#fcfaf5] tracking-wide">
                  {label}
                </div>

                {sublabel && (
                  <p className="text-[11px] text-[#ddd8cd] font-normal leading-snug opacity-90 max-w-[180px] mx-auto">
                    {sublabel}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tailored Bottom Apex with Delicate Gold Micro-Finial ── */}
        <div className="relative w-full flex justify-center -mt-[1px]">
          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-b from-[#c9a54c] to-[#8c6e26] shadow-xs" />
        </div>
      </div>

      {/* ── 3. Smooth Shifting Ambient Drop Shadow Beneath ── */}
      <div
        className="w-[70%] h-2.5 rounded-full blur-sm -mt-0.5 pointer-events-none"
        style={{
          background: 'rgba(7, 33, 24, 0.28)',
          animation: prefersReducedMotion
            ? 'none'
            : `shadowSwaySmooth ${swayDuration}s ease-in-out ${swayDelay}s infinite alternate`,
        }}
      />

      {/* ── Pure, Smooth CSS 3D Fabric Motion Keyframes (Zero Text Blur) ── */}
      <style jsx>{`
        @keyframes smoothClothWave {
          0% {
            transform: perspective(700px) rotateY(-2.2deg) rotateZ(-0.6deg) translateY(0px);
          }
          50% {
            transform: perspective(700px) rotateY(1.4deg) rotateZ(0.5deg) translateY(3px);
          }
          100% {
            transform: perspective(700px) rotateY(2.4deg) rotateZ(0.8deg) translateY(6px);
          }
        }

        @keyframes smoothClothWaveHover {
          0% {
            transform: perspective(700px) rotateY(-3.8deg) rotateZ(-1deg) translateY(-2px) scale(1.02);
          }
          50% {
            transform: perspective(700px) rotateY(2.2deg) rotateZ(0.9deg) translateY(2px) scale(1.02);
          }
          100% {
            transform: perspective(700px) rotateY(4deg) rotateZ(1.4deg) translateY(5px) scale(1.02);
          }
        }

        @keyframes silkSheenSmooth {
          0% {
            transform: translateX(-140%) skewX(-20deg);
            opacity: 0;
          }
          18% {
            opacity: 0.9;
          }
          52% {
            transform: translateX(170%) skewX(-20deg);
            opacity: 0.7;
          }
          100% {
            transform: translateX(200%) skewX(-20deg);
            opacity: 0;
          }
        }

        @keyframes shadowSwaySmooth {
          0% {
            transform: translateX(-6px) scaleX(0.92);
            opacity: 0.24;
          }
          100% {
            transform: translateX(6px) scaleX(1.08);
            opacity: 0.36;
          }
        }
      `}</style>
    </div>
  );
}
