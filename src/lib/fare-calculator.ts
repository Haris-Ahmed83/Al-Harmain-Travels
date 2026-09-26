import { VehicleType, FareRule } from '@/types';

export const DEFAULT_FARE_RULES: Record<VehicleType, FareRule> = {
  sedan: {
    id: 'rule-sedan',
    vehicle_type: 'sedan',
    base_fare: 25.0,
    per_km_rate: 3.5,
    per_minute_rate: 0.5,
    waiting_charge_per_min: 1.0,
    minimum_fare: 35.0,
    cancellation_fee: 20.0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  suv: {
    id: 'rule-suv',
    vehicle_type: 'suv',
    base_fare: 45.0,
    per_km_rate: 5.0,
    per_minute_rate: 0.75,
    waiting_charge_per_min: 1.5,
    minimum_fare: 60.0,
    cancellation_fee: 30.0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  vip_gmc: {
    id: 'rule-vip_gmc',
    vehicle_type: 'vip_gmc',
    base_fare: 90.0,
    per_km_rate: 8.5,
    per_minute_rate: 1.5,
    waiting_charge_per_min: 2.5,
    minimum_fare: 120.0,
    cancellation_fee: 50.0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  van: {
    id: 'rule-van',
    vehicle_type: 'van',
    base_fare: 70.0,
    per_km_rate: 7.0,
    per_minute_rate: 1.2,
    waiting_charge_per_min: 2.0,
    minimum_fare: 95.0,
    cancellation_fee: 40.0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  bus: {
    id: 'rule-bus',
    vehicle_type: 'bus',
    base_fare: 150.0,
    per_km_rate: 12.0,
    per_minute_rate: 2.0,
    waiting_charge_per_min: 4.0,
    minimum_fare: 200.0,
    cancellation_fee: 80.0,
    is_active: true,
    created_at: new Date().toISOString(),
  },
};

export interface FareCalculationResult {
  base_fare: number;
  distance_charge: number;
  time_charge: number;
  estimated_distance_km: number;
  estimated_duration_min: number;
  subtotal: number;
  total_fare: number;
}

export function calculateEstimatedFare(
  vehicleType: VehicleType,
  distanceKm: number,
  durationMin: number,
  customRule?: FareRule
): FareCalculationResult {
  const rule = customRule || DEFAULT_FARE_RULES[vehicleType] || DEFAULT_FARE_RULES.sedan;

  const baseFare = rule.base_fare;
  const distanceCharge = distanceKm * rule.per_km_rate;
  const timeCharge = durationMin * rule.per_minute_rate;
  const rawSubtotal = baseFare + distanceCharge + timeCharge;
  const finalTotal = Math.max(rawSubtotal, rule.minimum_fare);

  return {
    base_fare: parseFloat(baseFare.toFixed(2)),
    distance_charge: parseFloat(distanceCharge.toFixed(2)),
    time_charge: parseFloat(timeCharge.toFixed(2)),
    estimated_distance_km: distanceKm,
    estimated_duration_min: durationMin,
    subtotal: parseFloat(rawSubtotal.toFixed(2)),
    total_fare: Math.round(finalTotal),
  };
}
