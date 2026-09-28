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
import { resolveFixedFare } from '@/lib/fixed-fare';
import type { VehicleCategory, ServiceType, TerminalCode } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { vehicleCategory, serviceType, terminal } = body as {
      vehicleCategory: VehicleCategory;
      serviceType: ServiceType;
      terminal?: TerminalCode;
    };

    // Basic presence validation
    if (!vehicleCategory || !serviceType) {
      return NextResponse.json(
        { error: 'vehicleCategory and serviceType are required.' },
        { status: 400 },
      );
    }

    // Validate vehicleCategory enum
    const validCategories: VehicleCategory[] = ['sedan', 'staria', 'gmc', 'hiroof'];
    if (!validCategories.includes(vehicleCategory)) {
      return NextResponse.json(
        { error: `Invalid vehicleCategory: "${vehicleCategory}".` },
        { status: 400 },
      );
    }

    // Validate serviceType enum
    const validServices: ServiceType[] = [
      'intercity_jeddah_makkah',
      'intercity_makkah_jeddah',
      'intercity_makkah_madinah',
      'intercity_makkah_madinah_sameday',
      'ziyarat_taif',
      'ziyarat_taif_bani_saad',
      'ziyarat_makkah',
    ];
    if (!validServices.includes(serviceType)) {
      return NextResponse.json(
        { error: `Invalid serviceType: "${serviceType}".` },
        { status: 400 },
      );
    }

    // Validate terminal if provided
    const validTerminals: TerminalCode[] = ['terminal_1', 'terminal_h', 'terminal_n', null];
    if (terminal !== undefined && !validTerminals.includes(terminal)) {
      return NextResponse.json(
        { error: `Invalid terminal: "${terminal}".` },
        { status: 400 },
      );
    }

    // Resolve fare from the authoritative in-code table
    // Note: we use the compiled in-code table (not Supabase) so this endpoint
    // works even if the database is unreachable, and avoids exposing
    // the service-role key in an API route.
    const resolution = resolveFixedFare(vehicleCategory, serviceType, terminal ?? null);

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
