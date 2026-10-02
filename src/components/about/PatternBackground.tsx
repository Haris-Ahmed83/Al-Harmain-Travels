'use client';

import React, { useEffect, useRef } from 'react';

interface PatternBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export default function PatternBackground({
  className = '',
  children,
}: PatternBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isVisible = true;
    let scrollYOffset = 0;

    // Mouse & Drag Interactive Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let curMouseX = 0;
    let curMouseY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Resize handler
    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (prefersReducedMotion) {
        drawStatic();
      }
    };

    // Scroll listener for subtle parallax (moves slower than content)
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        scrollYOffset = window.scrollY * 0.12;
      }
    };

    // Pointer events for gentle mouse & drag reaction
    const handlePointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      const w = window.innerWidth || 1200;
      const h = window.innerHeight || 800;
      const nx = (e.clientX / w - 0.5) * 36; // max +/- 18px shift
      const ny = (e.clientY / h - 0.5) * 36;

      if (isDragging) {
        const dx = (e.clientX - dragStartX) * 0.15;
        const dy = (e.clientY - dragStartY) * 0.15;
        targetMouseX = nx + dx;
        targetMouseY = ny + dy;
      } else {
        targetMouseX = nx;
        targetMouseY = ny;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    // Gold dust particles (subtle, slow floating)
    const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 32;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      size: Math.random() * 1.5 + 0.8,
      speedY: Math.random() * 0.16 + 0.06,
      driftX: (Math.random() - 0.5) * 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.012 + 0.006,
      opacity: Math.random() * 0.3 + 0.12,
    }));

    // Draw 8-pointed Islamic geometric star (Khatim Sulayman)
    const drawStar = (
      cx: number,
      cy: number,
      radius: number,
      alpha: number
    ) => {
      if (alpha <= 0.002) return;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`; // Faint gold pattern lines at 4-6%
      ctx.lineWidth = 0.85;

      const half = radius * 0.707;
      ctx.strokeRect(-half, -half, half * 2, half * 2);

      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-half, -half, half * 2, half * 2);

      // Inner jewel circle
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      const cellSize = 80;
      const baseRadius = cellSize * 0.44;
      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          drawStar(c * cellSize, r * cellSize, baseRadius, 0.048);
        }
      }
    };

    // Animation loop (slow 60s+ parallax drift, gentle light beam, floating gold dust)
    let startTime = performance.now();
    const render = (time: number) => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Smooth lerp for mouse/drag offset
      curMouseX += (targetMouseX - curMouseX) * 0.05;
      curMouseY += (targetMouseY - curMouseY) * 0.05;

      const elapsed = (time - startTime) * 0.001; // seconds
      ctx.clearRect(0, 0, width, height);

      // 1. Moving soft warm gold light glow with mouse interaction
      const beamX = width * (0.35 + Math.sin(elapsed * 0.06) * 0.25) + curMouseX * 1.5;
      const beamY = height * (0.45 + Math.cos(elapsed * 0.04) * 0.2) + curMouseY * 1.5;
      const beamGrad = ctx.createRadialGradient(
        beamX,
        beamY,
        0,
        beamX,
        beamY,
        Math.max(width * 0.6, 520)
      );
      beamGrad.addColorStop(0, 'rgba(212, 175, 55, 0.07)');
      beamGrad.addColorStop(0.5, 'rgba(11, 71, 54, 0.05)');
      beamGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Slow parallax drift of Islamic geometric star pattern (4-6% opacity)
      const cellSize = 86;
      const baseRadius = cellSize * 0.44;
      const driftX = (elapsed * 1.8 + curMouseX * 0.4) % cellSize;
      const driftY = (elapsed * 0.9 + scrollYOffset * 0.3 + curMouseY * 0.4) % cellSize;

      const cols = Math.ceil(width / cellSize) + 2;
      const rows = Math.ceil(height / cellSize) + 2;

      for (let c = -1; c < cols; c++) {
        for (let r = -1; r < rows; r++) {
          const x = c * cellSize + driftX;
          const y = r * cellSize + driftY;
          drawStar(x, y, baseRadius, 0.05); // 5% opacity
        }
      }

      // 3. Floating gold dust particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speedY;
        p.x += p.driftX;
        p.pulse += p.pulseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const pulseAlpha = p.opacity * (0.65 + Math.sin(p.pulse) * 0.35);
        ctx.beginPath();
        ctx.arc(p.x + curMouseX * 0.2, p.y + curMouseY * 0.2, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${pulseAlpha})`;
        ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    // IntersectionObserver to pause loop when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );
    observer.observe(container);

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });

    if (!prefersReducedMotion) {
      animId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#041710] text-[#f8f6f0] ${className}`}
      style={{
        background: 'linear-gradient(180deg, #041710 0%, #062117 50%, #03140e 100%)',
      }}
    >
      {/* Canvas for animated Islamic star pattern + gold dust + light glow + drag/mouse parallax */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Fine Film Grain Noise Texture (3.5% opacity) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-[1] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* Soft Vignette Overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 60%, rgba(2, 10, 7, 0.65) 100%)',
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
