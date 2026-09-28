/**
 * Fixed-Fare Rate Engine — Al Harmain Travels
 *
 * This is the SOLE authoritative source for all fixed fares.
 * Fares are NEVER computed from distance, GPS coordinates, duration, or any
 * dynamic value. Every fare corresponds to an exact row in this lookup table.
 *
 * The in-code table mirrors the database `fixed_fare_rates` table exactly.
 * The database is the primary source; this file acts as a compile-time
 * verified fallback and server-side validation layer.
 */

import type {
  VehicleCategory,
  ServiceType,
  TerminalCode,
  FixedFareRate,
  FareResolution,
} from '@/types';

// ─── Canonical Rate Table ──────────────────────────────────────────────────
// All prices in SAR (Saudi Arabian Riyal).
// Treat as immutable. Do NOT add averages, multipliers, or dynamic overrides.

type RateEntry = {
  id: string;
  vehicle_category: VehicleCategory;
  service_type: ServiceType;
  terminal: TerminalCode;
  fare_amount: number;
};

export const FIXED_RATE_TABLE: RateEntry[] = [
  // ── A. Sedan (Toyota Camry / Hyundai Sonata) ───────────────────────────
  { id: 'sedan-jeddah-makkah',            vehicle_category: 'sedan',  service_type: 'intercity_jeddah_makkah',         terminal: null,         fare_amount: 200 },
  { id: 'sedan-makkah-jeddah',            vehicle_category: 'sedan',  service_type: 'intercity_makkah_jeddah',         terminal: null,         fare_amount: 180 },
  { id: 'sedan-makkah-madinah',           vehicle_category: 'sedan',  service_type: 'intercity_makkah_madinah',        terminal: null,         fare_amount: 350 },
  { id: 'sedan-makkah-madinah-sameday',   vehicle_category: 'sedan',  service_type: 'intercity_makkah_madinah_sameday',terminal: null,         fare_amount: 650 },
  { id: 'sedan-taif-ziyarat',             vehicle_category: 'sedan',  service_type: 'ziyarat_taif',                    terminal: null,         fare_amount: 350 },
  { id: 'sedan-taif-bani-saad',           vehicle_category: 'sedan',  service_type: 'ziyarat_taif_bani_saad',          terminal: null,         fare_amount: 500 },
  { id: 'sedan-makkah-ziyarat',           vehicle_category: 'sedan',  service_type: 'ziyarat_makkah',                  terminal: null,         fare_amount: 180 },

  // ── B. Hyundai Staria ──────────────────────────────────────────────────
  { id: 'staria-jeddah-makkah-t1',        vehicle_category: 'staria', service_type: 'intercity_jeddah_makkah',         terminal: 'terminal_1', fare_amount: 300 },
  { id: 'staria-jeddah-makkah-th',        vehicle_category: 'staria', service_type: 'intercity_jeddah_makkah',         terminal: 'terminal_h', fare_amount: 350 },
  { id: 'staria-makkah-jeddah',           vehicle_category: 'staria', service_type: 'intercity_makkah_jeddah',         terminal: null,         fare_amount: 250 },
  { id: 'staria-makkah-madinah',          vehicle_category: 'staria', service_type: 'intercity_makkah_madinah',        terminal: null,         fare_amount: 500 },
  { id: 'staria-makkah-madinah-sameday',  vehicle_category: 'staria', service_type: 'intercity_makkah_madinah_sameday',terminal: null,         fare_amount: 800 },
  { id: 'staria-taif-ziyarat',            vehicle_category: 'staria', service_type: 'ziyarat_taif',                    terminal: null,         fare_amount: 400 },
  { id: 'staria-taif-bani-saad',          vehicle_category: 'staria', service_type: 'ziyarat_taif_bani_saad',          terminal: null,         fare_amount: 600 },
  { id: 'staria-makkah-ziyarat',          vehicle_category: 'staria', service_type: 'ziyarat_makkah',                  terminal: null,         fare_amount: 250 },

  // ── C. GMC — Nusuk ────────────────────────────────────────────────────
  { id: 'gmc-jeddah-makkah-th',           vehicle_category: 'gmc',    service_type: 'intercity_jeddah_makkah',         terminal: 'terminal_h', fare_amount: 650 },
  { id: 'gmc-jeddah-makkah-t1',           vehicle_category: 'gmc',    service_type: 'intercity_jeddah_makkah',         terminal: 'terminal_1', fare_amount: 600 },
  { id: 'gmc-jeddah-makkah-tn',           vehicle_category: 'gmc',    service_type: 'intercity_jeddah_makkah',         terminal: 'terminal_n', fare_amount: 600 },
  { id: 'gmc-makkah-jeddah',              vehicle_category: 'gmc',    service_type: 'intercity_makkah_jeddah',         terminal: null,         fare_amount: 500 },
  { id: 'gmc-makkah-madinah',             vehicle_category: 'gmc',    service_type: 'intercity_makkah_madinah',        terminal: null,         fare_amount: 900 },
  { id: 'gmc-taif-ziyarat',               vehicle_category: 'gmc',    service_type: 'ziyarat_taif',                    terminal: null,         fare_amount: 700 },
  { id: 'gmc-taif-bani-saad',             vehicle_category: 'gmc',    service_type: 'ziyarat_taif_bani_saad',          terminal: null,         fare_amount: 1000 },
  { id: 'gmc-makkah-ziyarat',             vehicle_category: 'gmc',    service_type: 'ziyarat_makkah',                  terminal: null,         fare_amount: 450 },

  // ── D. HiRoof — Nusuk ─────────────────────────────────────────────────
  { id: 'hiroof-jeddah-makkah-th',        vehicle_category: 'hiroof', service_type: 'intercity_jeddah_makkah',         terminal: 'terminal_h', fare_amount: 450 },
  { id: 'hiroof-jeddah-makkah-t1',        vehicle_category: 'hiroof', service_type: 'intercity_jeddah_makkah',         terminal: 'terminal_1', fare_amount: 400 },
  { id: 'hiroof-jeddah-makkah-tn',        vehicle_category: 'hiroof', service_type: 'intercity_jeddah_makkah',         terminal: 'terminal_n', fare_amount: 400 },
  { id: 'hiroof-makkah-jeddah',           vehicle_category: 'hiroof', service_type: 'intercity_makkah_jeddah',         terminal: null,         fare_amount: 300 },
  { id: 'hiroof-makkah-madinah',          vehicle_category: 'hiroof', service_type: 'intercity_makkah_madinah',        terminal: null,         fare_amount: 600 },
  { id: 'hiroof-taif-ziyarat',            vehicle_category: 'hiroof', service_type: 'ziyarat_taif',                    terminal: null,         fare_amount: 500 },
  { id: 'hiroof-taif-bani-saad',          vehicle_category: 'hiroof', service_type: 'ziyarat_taif_bani_saad',          terminal: null,         fare_amount: 750 },
  { id: 'hiroof-makkah-ziyarat',          vehicle_category: 'hiroof', service_type: 'ziyarat_makkah',                  terminal: null,         fare_amount: 300 },
];

// ─── Service meta-data for UI ──────────────────────────────────────────────

export const SERVICE_LABELS: Record<ServiceType, string> = {
  intercity_jeddah_makkah:          'Jeddah → Makkah',
  intercity_makkah_jeddah:          'Makkah → Jeddah',
  intercity_makkah_madinah:         'Makkah → Madinah → Makkah',
  intercity_makkah_madinah_sameday: 'Makkah → Madinah → Makkah (Same Day)',
  ziyarat_taif:                     'Taif Ziyarat',
  ziyarat_taif_bani_saad:           'Taif Ziyarat + Bani Saad',
  ziyarat_makkah:                   'Makkah Ziyarat',
};

export const VEHICLE_LABELS: Record<VehicleCategory, string> = {
  sedan:  'Sedan — Camry / Sonata',
  staria: 'Hyundai Staria',
  gmc:    'GMC — Nusuk',
  hiroof: 'HiRoof — Nusuk',
};

export const TERMINAL_LABELS: Record<NonNullable<TerminalCode>, string> = {
  terminal_1: 'Terminal 1',
  terminal_h: 'Terminal H',
  terminal_n: 'Terminal N',
};

export const VEHICLE_CAPACITY: Record<VehicleCategory, { passengers: number; luggage: number }> = {
  sedan:  { passengers: 4,  luggage: 3 },
  staria: { passengers: 7,  luggage: 6 },
  gmc:    { passengers: 7,  luggage: 6 },
  hiroof: { passengers: 11, luggage: 10 },
};

/** Services that require an airport terminal selection */
export const TERMINAL_REQUIRED_SERVICES: ServiceType[] = [
  'intercity_jeddah_makkah',
];

/** Vehicles that have terminal-specific pricing */
export const TERMINAL_SPECIFIC_VEHICLES: VehicleCategory[] = [
  'staria', 'gmc', 'hiroof',
];

/** Services that are pure Ziyarat (no pickup/destination needed) */
export const ZIYARAT_SERVICES: ServiceType[] = [
  'ziyarat_makkah', 'ziyarat_taif', 'ziyarat_taif_bani_saad',
];

// ─── Core Fare Resolver ────────────────────────────────────────────────────

/**
 * Resolves the exact fixed fare for a given combination.
 *
 * Rules:
 * - Terminal MUST be provided for Jeddah→Makkah routes (non-sedan vehicles).
 * - Sedan does NOT use terminal-specific pricing for Jeddah→Makkah.
 * - Standard and same-day Makkah→Madinah routes are distinct entries.
 * - Returns `found: false` for any unsupported combination.
 * - NEVER falls back to a default fare or interpolates from another vehicle.
 */
export function resolveFixedFare(
  vehicleCategory: VehicleCategory,
  serviceType: ServiceType,
  terminal?: TerminalCode,
): FareResolution {
  // Normalise terminal: sedan never uses terminal pricing
  const effectiveTerminal: TerminalCode =
    vehicleCategory === 'sedan' ? null : (terminal ?? null);

  // For terminal-required services on non-sedan, terminal must be specified
  if (
    TERMINAL_REQUIRED_SERVICES.includes(serviceType) &&
    vehicleCategory !== 'sedan' &&
    !effectiveTerminal
  ) {
    return {
      found: false,
      reason:
        'Airport terminal is required for this vehicle and route. Please select Terminal 1, H, or N.',
    };
  }

  const match = FIXED_RATE_TABLE.find(
    (r) =>
      r.vehicle_category === vehicleCategory &&
      r.service_type === serviceType &&
      r.terminal === effectiveTerminal,
  );

  if (!match) {
    return {
      found: false,
      reason:
        'This vehicle and route combination does not have a configured fare. ' +
        'Please contact our team for a custom quote.',
    };
  }

  return {
    found: true,
    fare: match.fare_amount,
    currency: 'SAR',
    fareType: 'fixed',
    rateId: match.id,
  };
}

/**
 * Returns all active vehicles that have at least one fare configured for the
 * given service type and (optionally) terminal. Used to filter the vehicle
 * selection cards so we never show unserviceable options.
 */
export function getAvailableVehicles(
  serviceType: ServiceType,
  terminal?: TerminalCode,
): VehicleCategory[] {
  const all: VehicleCategory[] = ['sedan', 'staria', 'gmc', 'hiroof'];
  return all.filter((v) => {
    const result = resolveFixedFare(v, serviceType, terminal);
    return result.found;
  });
}

/**
 * Formats a SAR fare amount as a display string.
 * e.g. 1000 → "SAR 1,000"
 */
export function formatFareSAR(amount: number): string {
  return `SAR ${amount.toLocaleString('en-SA')}`;
}

/**
 * Build a full FixedFareRate object from the in-code table.
 * Useful for seeding the database and admin UI.
 */
export function getAllRatesAsObjects(): FixedFareRate[] {
  const now = new Date().toISOString();
  return FIXED_RATE_TABLE.map((r) => ({
    ...r,
    currency: 'SAR' as const,
    is_active: true,
    created_at: now,
    updated_at: now,
  }));
}
