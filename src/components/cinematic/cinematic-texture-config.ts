/**
 * Config & Presets for CinematicTexture
 * Easily tweakable presets for all sections across the website.
 */

export type TextureVariant = 'footer' | 'hero' | 'light' | 'dark' | 'minimal';
export type PatternType = 'star' | 'arabesque' | 'grid';

export interface TexturePresetConfig {
  goldColor: string;
  goldRgb: string;
  emeraldRgb: string;
  patternBaseOpacity: number;
  patternHoverMaxOpacity: number;
  patternCellSize: number;
  lineWidth: number;
  patternType: PatternType;

  // Mouse & Lens
  mouseStrength: number;
  lensRadius: number;
  lensMaxShift: number;
  starMaxRotation: number;
  spotlightRadius: number;
  spotlightOpacity: number;
  mouseLerpFactor: number;

  // Floating Particles (Embers/Dust)
  particleCountDesktop: number;
  particleCountMobile: number;
  particleMinSpeed: number;
  particleMaxSpeed: number;
  particleBaseOpacity: number;

  // Ambient Flow & Breathing
  breatheSpeed: number;
  ambientDrift: boolean; // Continuous subtle drift even without mouse
  vignette: boolean;
}

export function colorToRgb(colorStr: string): string {
  if (!colorStr) return '212, 175, 55';
  const clean = colorStr.trim();
  if (clean.startsWith('#')) {
    let hex = clean.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
  }
  const rgbMatch = clean.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`;
  }
  if (/^\d+,\s*\d+,\s*\d+$/.test(clean)) {
    return clean;
  }
  return '212, 175, 55';
}

export const TEXTURE_VARIANTS: Record<TextureVariant, TexturePresetConfig> = {
  // 1. FOOTER: The original dark green + gold look (default, unchanged)
  footer: {
    goldColor: '#d4af37',
    goldRgb: '212, 175, 55',
    emeraldRgb: '11, 71, 54',
    patternBaseOpacity: 0.08,
    patternHoverMaxOpacity: 0.26,
    patternCellSize: 76,
    lineWidth: 1.0,
    patternType: 'star',

    mouseStrength: 1.0,
    lensRadius: 210,
    lensMaxShift: 18,
    starMaxRotation: 0.45,
    spotlightRadius: 280,
    spotlightOpacity: 0.14,
    mouseLerpFactor: 0.08,

    particleCountDesktop: 34,
    particleCountMobile: 28,
    particleMinSpeed: 0.18,
    particleMaxSpeed: 0.55,
    particleBaseOpacity: 0.25,

    breatheSpeed: 0.0009,
    ambientDrift: false,
    vignette: true,
  },

  // 2. HERO: Stronger and more cinematic with larger glow and ambient drift
  hero: {
    goldColor: '#dfc15a',
    goldRgb: '223, 193, 90',
    emeraldRgb: '14, 90, 68',
    patternBaseOpacity: 0.11,
    patternHoverMaxOpacity: 0.32,
    patternCellSize: 84,
    lineWidth: 1.15,
    patternType: 'star',

    mouseStrength: 1.2,
    lensRadius: 260,
    lensMaxShift: 24,
    starMaxRotation: 0.55,
    spotlightRadius: 340,
    spotlightOpacity: 0.20,
    mouseLerpFactor: 0.07,

    particleCountDesktop: 46,
    particleCountMobile: 36,
    particleMinSpeed: 0.22,
    particleMaxSpeed: 0.65,
    particleBaseOpacity: 0.32,

    breatheSpeed: 0.0012,
    ambientDrift: true, // Slowly drifts across hero
    vignette: true,
  },

  // 3. LIGHT: For cream/white sections. Very subtle green and gold lines at 3-4% opacity so text remains crystal clear
  light: {
    goldColor: '#b8922a',
    goldRgb: '184, 146, 42',
    emeraldRgb: '11, 71, 54',
    patternBaseOpacity: 0.035, // 3.5% delicate opacity
    patternHoverMaxOpacity: 0.12,
    patternCellSize: 72,
    lineWidth: 0.85,
    patternType: 'star',

    mouseStrength: 0.75,
    lensRadius: 170,
    lensMaxShift: 10,
    starMaxRotation: 0.22,
    spotlightRadius: 220,
    spotlightOpacity: 0.06, // Soft champagne warm glow
    mouseLerpFactor: 0.09,

    particleCountDesktop: 12,
    particleCountMobile: 12,
    particleMinSpeed: 0.12,
    particleMaxSpeed: 0.35,
    particleBaseOpacity: 0.14,

    breatheSpeed: 0.0006,
    ambientDrift: false,
    vignette: false,
  },

  // 4. DARK: For non-footer dark sections (e.g. Services Banner)
  dark: {
    goldColor: '#c5a059',
    goldRgb: '197, 160, 89',
    emeraldRgb: '7, 34, 26',
    patternBaseOpacity: 0.07,
    patternHoverMaxOpacity: 0.24,
    patternCellSize: 80,
    lineWidth: 1.0,
    patternType: 'arabesque',

    mouseStrength: 1.0,
    lensRadius: 210,
    lensMaxShift: 16,
    starMaxRotation: 0.4,
    spotlightRadius: 280,
    spotlightOpacity: 0.12,
    mouseLerpFactor: 0.08,

    particleCountDesktop: 26,
    particleCountMobile: 22,
    particleMinSpeed: 0.16,
    particleMaxSpeed: 0.48,
    particleBaseOpacity: 0.22,

    breatheSpeed: 0.0008,
    ambientDrift: false,
    vignette: true,
  },

  // 5. MINIMAL: Pattern only, tiny mouse glow, zero particles (lightest on CPU/GPU)
  minimal: {
    goldColor: '#d4af37',
    goldRgb: '212, 175, 55',
    emeraldRgb: '11, 71, 54',
    patternBaseOpacity: 0.045,
    patternHoverMaxOpacity: 0.15,
    patternCellSize: 76,
    lineWidth: 0.85,
    patternType: 'grid',

    mouseStrength: 0.6,
    lensRadius: 150,
    lensMaxShift: 8,
    starMaxRotation: 0.15,
    spotlightRadius: 180,
    spotlightOpacity: 0.05,
    mouseLerpFactor: 0.1,

    particleCountDesktop: 0,
    particleCountMobile: 0,
    particleMinSpeed: 0,
    particleMaxSpeed: 0,
    particleBaseOpacity: 0,

    breatheSpeed: 0.0005,
    ambientDrift: false,
    vignette: false,
  },
};

export const FOOTER_TEXTURE_CONFIG = TEXTURE_VARIANTS.footer;

