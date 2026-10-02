/**
 * POST /api/fares/validate
 *
 * Server-side authoritative fare validator.
 * The client submits { vehicleCategory, serviceType, terminal? }.
 * This endpoint resolves the exact approved fare and returns it.
 *
 * The returned fare is what MUST be saved with the booking.
 * The client MUST NOT send a fare amount — only the route/vehicle parameters.
 * This prevents client-side fare tampering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveFixedFare } from '@/lib/fixed-fare';
import type { VehicleCategory, ServiceType, TerminalCode } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { vehicleCategory, serviceType, terminal } = body as {
      vehicleCategory: VehicleCategory | string;
      serviceType: ServiceType | string;
      terminal?: TerminalCode | string | null;
    };

    // Basic presence validation
    if (!vehicleCategory || !serviceType) {
      return NextResponse.json(
        { error: 'vehicleCategory and serviceType are required.' },
        { status: 400 },
      );
    }

    const effectiveTerminal = terminal && terminal.trim() ? terminal.trim() : null;

    // 1. Check authoritative database first
    try {
      let query = supabaseAdmin
        .from('fixed_fare_rates')
        .select('*')
        .eq('vehicle_category', vehicleCategory)
        .eq('service_type', serviceType);

      if (effectiveTerminal) {
        query = query.eq('terminal', effectiveTerminal);
      } else {
        query = query.is('terminal', null);
      }

      const { data: dbRates, error: dbErr } = await query;

      if (!dbErr && dbRates && dbRates.length > 0) {
        const match = dbRates[0];
        if (!match.is_active) {
          return NextResponse.json(
            {
              found: false,
              error: 'This rate has been deactivated by administration and is no longer available for booking.',
            },
            { status: 422 },
          );
        }

        return NextResponse.json({
          found: true,
          fare: Number(match.fare_amount),
          currency: match.currency || 'SAR',
          fareType: 'fixed',
          rateId: match.id,
        });
      }
    } catch (dbCheckErr) {
      console.warn('DB check warning during fare validation:', dbCheckErr);
    }

    // 2. Fallback to compile-time rate table if not in DB or if DB offline
    const resolution = resolveFixedFare(vehicleCategory, serviceType, effectiveTerminal);

    if (!resolution.found) {
      return NextResponse.json(
        { error: resolution.reason, found: false },
        { status: 422 },
      );
    }

    return NextResponse.json({
      found: true,
      fare: resolution.fare,
      currency: resolution.currency,
      fareType: resolution.fareType,
      rateId: resolution.rateId,
    });
  } catch (err: unknown) {
    console.error('[/api/fares/validate] error:', err);
    return NextResponse.json(
      { error: 'Internal server error during fare validation.' },
      { status: 500 },
    );
  }
}

