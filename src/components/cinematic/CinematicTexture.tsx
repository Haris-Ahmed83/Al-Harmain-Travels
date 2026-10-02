'use client';

import React, { useEffect, useRef } from 'react';
import {
  TextureVariant,
  PatternType,
  TexturePresetConfig,
  TEXTURE_VARIANTS,
  colorToRgb,
} from './cinematic-texture-config';

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT INTERFACE
───────────────────────────────────────────────────────────────────────────── */
export interface CinematicTextureProps {
  variant?: TextureVariant;
  intensity?: number; // 0 - 1 scaling factor
  color?: string; // Override gold color
  particleCount?: number; // Override particle count
  patternType?: PatternType; // Override pattern: 'star' | 'arabesque' | 'grid'
  interactive?: boolean; // Enable/disable mouse warp (default: true)
  className?: string;
  parentRef?: React.RefObject<HTMLElement | null>; // Optional container ref
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  driftX: number;
  opacity: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface TextureInstance {
  id: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  container: HTMLElement;
  config: TexturePresetConfig;
  particles: Particle[];
  ripples: Ripple[];
  width: number;
  height: number;
  dpr: number;
  isVisible: boolean;
  rect: DOMRect;
  mouseTargetX: number;
  mouseTargetY: number;
  mouseCurrentX: number;
  mouseCurrentY: number;
  mouseTargetActive: number;
  mouseCurrentActive: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL SHARED MANAGER (ONE RAF LOOP + ONE MOUSE LISTENER FOR ENTIRE SITE)
───────────────────────────────────────────────────────────────────────────── */
class GlobalTextureManager {
  private instances = new Map<string, TextureInstance>();
  private isRafRunning = false;
  private rafId = 0;
  private observer: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private globalMouse = { x: -2000, y: -2000, active: 0 };
  private isInitialized = false;

  private init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Single Window Mouse & Touch Listeners
    window.addEventListener(
      'mousemove',
      (e) => {
        this.globalMouse.x = e.clientX;
        this.globalMouse.y = e.clientY;
        this.globalMouse.active = 1;
      },
      { passive: true }
    );

    window.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length > 0) {
          const t = e.touches[0];
          this.globalMouse.x = t.clientX;
          this.globalMouse.y = t.clientY;
          this.globalMouse.active = 1.0;

          // Trigger instant subtle ripple on touch tap
          this.instances.forEach((inst) => {
            if (!inst.isVisible) return;
            const rect = inst.container.getBoundingClientRect();
            if (
              t.clientX >= rect.left &&
              t.clientX <= rect.right &&
              t.clientY >= rect.top &&
              t.clientY <= rect.bottom
            ) {
              inst.ripples.push({
                x: t.clientX - rect.left,
                y: t.clientY - rect.top,
                radius: 6,
                maxRadius: Math.min(inst.width * 0.4, 260),
                alpha: 0.38 * (inst.config.patternBaseOpacity / 0.08),
              });
            }
          });
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length > 0) {
          this.globalMouse.x = e.touches[0].clientX;
          this.globalMouse.y = e.touches[0].clientY;
          this.globalMouse.active = 1.0;
        }
      },
      { passive: true }
    );

    window.addEventListener('touchend', () => {
      this.globalMouse.active = 0.2;
      setTimeout(() => {
        this.globalMouse.active = 0;
      }, 400);
    });

    window.addEventListener('touchcancel', () => {
      this.globalMouse.active = 0;
    });

    document.addEventListener('mouseleave', () => {
      this.globalMouse.active = 0;
    });

    // Single Shared Passive Scroll Listener: keeps client rect positions aligned without RAF thrashing
    window.addEventListener(
      'scroll',
      () => {
        this.instances.forEach((inst) => {
          if (inst.isVisible) {
            inst.rect = inst.container.getBoundingClientRect();
          }
        });
      },
      { passive: true }
    );

    // Single Click Listener for Ripples
    window.addEventListener(
      'click',
      (e) => {
        this.instances.forEach((inst) => {
          if (!inst.isVisible) return;
          const rect = inst.container.getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            inst.ripples.push({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
              radius: 4,
              maxRadius: Math.min(inst.width * 0.35, 240),
              alpha: 0.35 * (inst.config.patternBaseOpacity / 0.08),
            });
          }
        });
      },
      { passive: true }
    );

    // Single Shared Resize Listener (Window fallback)
    window.addEventListener(
      'resize',
      () => {
        this.instances.forEach((inst) => this.resizeInstance(inst));
      },
      { passive: true }
    );

    // Shared ResizeObserver for dynamic container resizes
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.textureId;
          if (!id) return;
          const inst = this.instances.get(id);
          if (inst) {
            this.resizeInstance(inst);
          }
        });
      });
    }

    // Single Shared IntersectionObserver: animates only instances visible in viewport
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.textureId;
          if (!id) return;
          const inst = this.instances.get(id);
          if (inst) {
            inst.isVisible = entry.isIntersecting;
            if (inst.isVisible) {
              inst.rect = inst.container.getBoundingClientRect();
            }
          }
        });
        this.evaluateLoopState();
      },
      { threshold: 0.01 }
    );
  }

  public register(
    id: string,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    container: HTMLElement,
    config: TexturePresetConfig
  ) {
    this.init();

    // Device / Touch optimizations
    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const particleCount = isTouch
      ? config.particleCountMobile
      : config.particleCountDesktop;

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * (container.clientWidth || 1000),
        y: Math.random() * (container.clientHeight || 500),
        size: Math.random() * 1.8 + 0.8,
        speedY:
          Math.random() * (config.particleMaxSpeed - config.particleMinSpeed) +
          config.particleMinSpeed,
        driftX: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.3 + 0.12,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    const instance: TextureInstance = {
      id,
      canvas,
      ctx,
      container,
      config,
      particles,
      ripples: [],
      width: 0,
      height: 0,
      dpr: 1,
      isVisible: false,
      rect: container.getBoundingClientRect(),
      mouseTargetX: -2000,
      mouseTargetY: -2000,
      mouseCurrentX: -2000,
      mouseCurrentY: -2000,
      mouseTargetActive: 0,
      mouseCurrentActive: 0,
    };

    this.instances.set(id, instance);
    container.dataset.textureId = id;
    this.resizeInstance(instance);
    this.observer?.observe(container);
    this.resizeObserver?.observe(container);

    // Render static state for reduced-motion users
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.drawStaticInstance(instance);
    }
  }

  public unregister(id: string) {
    const inst = this.instances.get(id);
    if (inst) {
      this.observer?.unobserve(inst.container);
      this.resizeObserver?.unobserve(inst.container);
      this.instances.delete(id);
    }
    this.evaluateLoopState();
  }

  private resizeInstance(inst: TextureInstance) {
    if (!inst.canvas || !inst.container) return;
    const rect = inst.container.getBoundingClientRect();
    inst.rect = rect;
    inst.width = rect.width;
    inst.height = rect.height;
    inst.dpr = Math.min(window.devicePixelRatio || 1, 2);

    inst.canvas.width = Math.round(inst.width * inst.dpr);
    inst.canvas.height = Math.round(inst.height * inst.dpr);
    inst.canvas.style.width = `${inst.width}px`;
    inst.canvas.style.height = `${inst.height}px`;

    inst.ctx.setTransform(inst.dpr, 0, 0, inst.dpr, 0, 0);

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.drawStaticInstance(inst);
    }
  }

  private evaluateLoopState() {
    let hasVisible = false;
    for (const inst of this.instances.values()) {
      if (inst.isVisible) {
        hasVisible = true;
        break;
      }
    }

    if (hasVisible && !this.isRafRunning) {
      this.isRafRunning = true;
      this.rafId = requestAnimationFrame(this.renderLoop.bind(this));
    } else if (!hasVisible && this.isRafRunning) {
      this.isRafRunning = false;
      cancelAnimationFrame(this.rafId);
    }
  }

  private renderLoop(time: number) {
    if (!this.isRafRunning) return;

    this.instances.forEach((inst) => {
      if (!inst.isVisible) return;
      this.renderInstance(inst, time);
    });

    this.rafId = requestAnimationFrame(this.renderLoop.bind(this));
  }

  private renderInstance(inst: TextureInstance, time: number) {
    const { ctx, width, height, config, rect } = inst;
    if (!ctx || width <= 0 || height <= 0) return;

    // 1. Mouse coordinate local mapping with smooth lerp
    const localMouseX = this.globalMouse.x - rect.left;
    const localMouseY = this.globalMouse.y - rect.top;

    const isInsideOrNear =
      localMouseX >= -config.lensRadius &&
      localMouseX <= width + config.lensRadius &&
      localMouseY >= -config.lensRadius &&
      localMouseY <= height + config.lensRadius;

    inst.mouseTargetX = localMouseX;
    inst.mouseTargetY = localMouseY;
    inst.mouseTargetActive = isInsideOrNear && this.globalMouse.active ? 1 : 0;

    inst.mouseCurrentX +=
      (inst.mouseTargetX - inst.mouseCurrentX) * config.mouseLerpFactor;
    inst.mouseCurrentY +=
      (inst.mouseTargetY - inst.mouseCurrentY) * config.mouseLerpFactor;
    inst.mouseCurrentActive +=
      (inst.mouseTargetActive - inst.mouseCurrentActive) * 0.07;

    ctx.clearRect(0, 0, width, height);

    // 2. LAYER 3: Cinematic Breathing Glow
    const breath = Math.sin(time * config.breatheSpeed) * 0.5 + 0.5;

    // Emerald & Gold soft atmospheric radial gradients
    const emeraldGrad = ctx.createRadialGradient(
      width * 0.25,
      height * 0.5,
      0,
      width * 0.25,
      height * 0.5,
      Math.max(width * 0.6, 400)
    );
    emeraldGrad.addColorStop(
      0,
      `rgba(${config.emeraldRgb}, ${0.08 + breath * 0.04})`
    );
    emeraldGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = emeraldGrad;
    ctx.fillRect(0, 0, width, height);

    const goldGrad = ctx.createRadialGradient(
      width * 0.75,
      height * 0.6,
      0,
      width * 0.75,
      height * 0.6,
      Math.max(width * 0.5, 350)
    );
    goldGrad.addColorStop(
      0,
      `rgba(${config.goldRgb}, ${0.035 + breath * 0.025})`
    );
    goldGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, width, height);

    // 3. CURSOR SPOTLIGHT
    if (inst.mouseCurrentActive > 0.01) {
      const spot = ctx.createRadialGradient(
        inst.mouseCurrentX,
        inst.mouseCurrentY,
        0,
        inst.mouseCurrentX,
        inst.mouseCurrentY,
        config.spotlightRadius
      );
      spot.addColorStop(
        0,
        `rgba(${config.goldRgb}, ${config.spotlightOpacity * inst.mouseCurrentActive})`
      );
      spot.addColorStop(
        0.5,
        `rgba(${config.emeraldRgb}, ${0.06 * inst.mouseCurrentActive})`
      );
      spot.addColorStop(1, 'transparent');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, width, height);
    }

    // 4. LAYER 1: GEOMETRIC PATTERN WITH MOUSE WARP
    const cellSize = config.patternCellSize;
    const baseRadius = cellSize * 0.44;
    const cols = Math.ceil(width / cellSize) + 2;
    const rows = Math.ceil(height / cellSize) + 2;

    // Ambient drift offset for hero variant
    const driftOffset = config.ambientDrift ? (time * 0.012) % cellSize : 0;

    for (let c = -1; c < cols; c++) {
      for (let r = -1; r < rows; r++) {
        const originX = c * cellSize + driftOffset;
        const originY = r * cellSize + (driftOffset * 0.5);

        let renderX = originX;
        let renderY = originY;
        let starRotation = 0;
        let alpha = config.patternBaseOpacity;

        if (inst.mouseCurrentActive > 0.01) {
          const dx = originX - inst.mouseCurrentX;
          const dy = originY - inst.mouseCurrentY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < config.lensRadius) {
            const normDist = 1 - dist / config.lensRadius;
            const pushFactor = Math.sin(normDist * (Math.PI / 2));
            const angle = Math.atan2(dy, dx);

            // Lens ripple displacement
            const shift =
              pushFactor * config.lensMaxShift * inst.mouseCurrentActive;
            renderX += Math.cos(angle) * shift;
            renderY += Math.sin(angle) * shift;

            // Pattern rotation
            starRotation =
              pushFactor *
              config.starMaxRotation *
              Math.sign(dx || 1) *
              inst.mouseCurrentActive;

            // Lines glow brighter
            alpha +=
              pushFactor *
              (config.patternHoverMaxOpacity - config.patternBaseOpacity) *
              inst.mouseCurrentActive;
          }
        }

        if (config.patternType === 'arabesque') {
          this.drawArabesque(ctx, renderX, renderY, baseRadius, starRotation, alpha, config.goldRgb, config.lineWidth);
        } else if (config.patternType === 'grid') {
          this.drawGrid(ctx, renderX, renderY, baseRadius, starRotation, alpha, config.goldRgb, config.lineWidth);
        } else {
          this.drawStar(ctx, renderX, renderY, baseRadius, starRotation, alpha, config.goldRgb, config.lineWidth);
        }
      }
    }

    // 5. LAYER 2: FLOATING PARTICLES (EMBERS/DUST)
    for (let i = 0; i < inst.particles.length; i++) {
      const p = inst.particles[i];
      p.y -= p.speedY;
      p.x += p.driftX;
      p.pulsePhase += p.pulseSpeed;

      // Mouse swirl & gentle repel
      if (inst.mouseCurrentActive > 0.01) {
        const pdx = p.x - inst.mouseCurrentX;
        const pdy = p.y - inst.mouseCurrentY;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pdist < 150) {
          const pforce = (1 - pdist / 150) * 1.5 * inst.mouseCurrentActive;
          const pangle = Math.atan2(pdy, pdx);
          p.x += Math.cos(pangle) * pforce + Math.sin(pangle) * 0.35;
          p.y += Math.sin(pangle) * pforce - Math.cos(pangle) * 0.35;
        }
      }

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      const currentOpacity =
        p.opacity * (0.65 + Math.sin(p.pulsePhase) * 0.35);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${config.goldRgb}, ${currentOpacity})`;
      ctx.shadowColor = `rgba(${config.goldRgb}, 0.5)`;
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 6. CLICK RIPPLES
    for (let rIdx = inst.ripples.length - 1; rIdx >= 0; rIdx--) {
      const rip = inst.ripples[rIdx];
      rip.radius += 3.5;
      rip.alpha *= 0.94;

      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${config.goldRgb}, ${rip.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (rip.alpha < 0.01 || rip.radius > rip.maxRadius) {
        inst.ripples.splice(rIdx, 1);
      }
    }

    // 7. SOFT VIGNETTES (Optional per preset)
    if (config.vignette) {
      const vigTop = ctx.createLinearGradient(0, 0, 0, 75);
      vigTop.addColorStop(0, 'rgba(7, 34, 26, 0.88)');
      vigTop.addColorStop(1, 'transparent');
      ctx.fillStyle = vigTop;
      ctx.fillRect(0, 0, width, 75);

      const vigBottom = ctx.createLinearGradient(0, height - 70, 0, height);
      vigBottom.addColorStop(0, 'transparent');
      vigBottom.addColorStop(1, 'rgba(7, 34, 26, 0.85)');
      ctx.fillStyle = vigBottom;
      ctx.fillRect(0, height - 70, width, 70);
    }
  }

  private drawStaticInstance(inst: TextureInstance) {
    const { ctx, width, height, config } = inst;
    if (!ctx || width <= 0 || height <= 0) return;
    ctx.clearRect(0, 0, width, height);

    const cellSize = config.patternCellSize;
    const baseRadius = cellSize * 0.44;
    const cols = Math.ceil(width / cellSize) + 1;
    const rows = Math.ceil(height / cellSize) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        this.drawStar(
          ctx,
          c * cellSize,
          r * cellSize,
          baseRadius,
          0,
          config.patternBaseOpacity,
          config.goldRgb,
          config.lineWidth
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROCEDURAL ISLAMIC GEOMETRY DRAWING ROUTINES
  // ─────────────────────────────────────────────────────────────────────────
  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    rotation: number,
    alpha: number,
    goldRgb: string,
    lineWidth: number
  ) {
    if (alpha <= 0.003) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.strokeStyle = `rgba(${goldRgb}, ${alpha})`;
    ctx.lineWidth = lineWidth;

    // Two intersecting squares (Khatim Sulayman 8-point star)
    const halfSide = radius * 0.707;
    ctx.strokeRect(-halfSide, -halfSide, halfSide * 2, halfSide * 2);

    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-halfSide, -halfSide, halfSide * 2, halfSide * 2);

    // Center circular jewel
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawArabesque(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    rotation: number,
    alpha: number,
    goldRgb: string,
    lineWidth: number
  ) {
    if (alpha <= 0.003) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.strokeStyle = `rgba(${goldRgb}, ${alpha})`;
    ctx.lineWidth = lineWidth;

    // Star core
    const halfSide = radius * 0.65;
    ctx.strokeRect(-halfSide, -halfSide, halfSide * 2, halfSide * 2);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-halfSide, -halfSide, halfSide * 2, halfSide * 2);

    // Diagonal lattice crossing lines
    ctx.beginPath();
    ctx.moveTo(-radius * 1.1, 0);
    ctx.lineTo(radius * 1.1, 0);
    ctx.moveTo(0, -radius * 1.1);
    ctx.lineTo(0, radius * 1.1);
    ctx.stroke();

    ctx.restore();
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    rotation: number,
    alpha: number,
    goldRgb: string,
    lineWidth: number
  ) {
    if (alpha <= 0.003) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.strokeStyle = `rgba(${goldRgb}, ${alpha})`;
    ctx.lineWidth = lineWidth;

    // Diamond grid unit
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.9);
    ctx.lineTo(radius * 0.9, 0);
    ctx.lineTo(0, radius * 0.9);
    ctx.lineTo(-radius * 0.9, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}

// Global Singleton Instance
const globalTextureManager = new GlobalTextureManager();

/* ─────────────────────────────────────────────────────────────────────────────
   REUSABLE REACT COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function CinematicTexture({
  variant = 'footer',
  intensity,
  color,
  particleCount,
  patternType,
  interactive = true,
  className = '',
  parentRef,
}: CinematicTextureProps) {
  const localContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = parentRef?.current || localContainerRef.current?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Resolve preset config with optional overrides
    const basePreset = TEXTURE_VARIANTS[variant] || TEXTURE_VARIANTS.footer;
    const config: TexturePresetConfig = {
      ...basePreset,
      patternType: patternType || basePreset.patternType,
      mouseStrength: interactive ? basePreset.mouseStrength : 0,
      lensMaxShift: interactive ? basePreset.lensMaxShift : 0,
    };

    if (intensity !== undefined) {
      config.patternBaseOpacity *= intensity;
      config.patternHoverMaxOpacity *= intensity;
      config.spotlightOpacity *= intensity;
      config.particleBaseOpacity *= intensity;
    }

    if (particleCount !== undefined) {
      config.particleCountDesktop = particleCount;
      config.particleCountMobile = Math.round(particleCount * 0.4);
    }

    if (color) {
      config.goldColor = color;
      config.goldRgb = colorToRgb(color);
    }

    // 2. Generate unique instance ID
    const instanceId = `tex_${Math.random().toString(36).substring(2, 9)}`;

    // 3. Register with global singleton manager
    globalTextureManager.register(instanceId, canvas, ctx, container, config);

    return () => {
      globalTextureManager.unregister(instanceId);
    };
  }, [variant, intensity, color, particleCount, patternType, interactive, parentRef]);

  return (
    <div
      ref={localContainerRef}
      aria-hidden="true"
      className={`absolute inset-0 z-0 pointer-events-none overflow-hidden select-none ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
    </div>
  );
}

export { CinematicTexture as FooterTexture };

