/**
 * API Route: /api/admin/rates
 * Full CRUD for Admin Rate List:
 * - GET: Fetch all fixed fare rates (active and inactive) from Supabase or fallback
 * - POST: Create a new fixed fare rate
 * - PUT: Update an existing fixed fare rate (fare_amount, is_active, terminal, etc.)
 * - DELETE: Delete/remove a fixed fare rate
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAllRatesAsObjects, isAirportRoute, checkRateConflict } from '@/lib/fixed-fare';
import type { FixedFareRate } from '@/types';

export async function GET() {
  try {
    const [ratesRes, vehiclesRes, servicesRes, routesRes, terminalsRes] = await Promise.all([
      supabaseAdmin.from('fixed_fare_rates').select('*').order('created_at', { ascending: true }),
      supabaseAdmin.from('rate_vehicle_types').select('*').order('display_order', { ascending: true }),
      supabaseAdmin.from('rate_service_types').select('*').order('display_order', { ascending: true }),
      supabaseAdmin.from('rate_routes').select('*').order('display_order', { ascending: true }),
      supabaseAdmin.from('rate_terminals').select('*').order('display_order', { ascending: true }),
    ]);

    const rates = ratesRes.data && ratesRes.data.length > 0 ? ratesRes.data : getAllRatesAsObjects();
    const vehicles = vehiclesRes.data || [];
    const services = servicesRes.data || [];
    const routes = routesRes.data || [];
    const terminals = terminalsRes.data || [];

    return NextResponse.json({ rates, vehicles, services, routes, terminals });
  } catch (err: unknown) {
    console.error('Error fetching admin rates:', err);
    return NextResponse.json({
      rates: getAllRatesAsObjects(),
      vehicles: [],
      services: [],
      routes: [],
      terminals: [],
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a bulk vehicle submission
    if (Array.isArray(body.rates)) {
      const { service_type, terminal, is_active = true } = body;

      if (!service_type || !String(service_type).trim()) {
        return NextResponse.json(
          { error: 'Service route is required.' },
          { status: 400 }
        );
      }

      const cleanService = String(service_type).trim();
      const airport = isAirportRoute(cleanService);
      // Non-airport routes force terminal to null
      const effectiveTerminal = airport && terminal && terminal !== 'none'
        ? String(terminal).trim()
        : null;

      // Extract valid vehicle rates (skip blanks)
      const rawRates = body.rates as Array<{ vehicle_category?: string; fare_amount?: any; id?: string }>;
      const validRates: Array<{ vehicle_category: string; fare_amount: number; id?: string }> = [];

      for (const item of rawRates) {
        if (!item.vehicle_category) continue;
        if (item.fare_amount === undefined || item.fare_amount === null || String(item.fare_amount).trim() === '') {
          continue; // Skip blank fare
        }
        const numeric = Number(item.fare_amount);
        if (isNaN(numeric) || numeric <= 0) {
          return NextResponse.json(
            { error: `Fixed fare for ${item.vehicle_category} must be a positive number greater than 0 SAR.` },
            { status: 400 }
          );
        }
        validRates.push({
          vehicle_category: String(item.vehicle_category).trim(),
          fare_amount: numeric,
          id: item.id,
        });
      }

      if (validRates.length === 0) {
        return NextResponse.json(
          { error: 'At least one vehicle category must have a valid fixed fare entered before submission.' },
          { status: 400 }
        );
      }

      // Query existing rates for conflict and duplicate checking
      const { data: existingRows } = await supabaseAdmin
        .from('fixed_fare_rates')
        .select('*')
        .eq('service_type', cleanService);

      const existingRates: FixedFareRate[] = existingRows || [];

      // Check conflicts for each vehicle being saved
      for (const r of validRates) {
        const conflict = checkRateConflict(
          r.vehicle_category,
          cleanService,
          effectiveTerminal,
          existingRates,
          r.id
        );

        // If it conflicts with another active rate that is NOT the same record being edited
        if (conflict.hasConflict && conflict.conflictingRate?.id !== r.id) {
          return NextResponse.json(
            { error: conflict.message || 'Rate conflict detected with an existing active rate.' },
            { status: 400 }
          );
        }
      }

      // Prepare records for atomic upsert
      const now = new Date().toISOString();
      const recordsToUpsert: FixedFareRate[] = validRates.map((r) => {
        // If an existing row has the exact same (vehicle, service, terminal), keep its ID to update it
        const exactExisting = existingRates.find(
          (ex) =>
            ex.vehicle_category === r.vehicle_category &&
            ex.service_type === cleanService &&
            (ex.terminal === effectiveTerminal || (!ex.terminal && !effectiveTerminal))
        );

        const rateId = r.id || exactExisting?.id || `${r.vehicle_category}-${cleanService}${effectiveTerminal ? `-${effectiveTerminal}` : ''}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        return {
          id: rateId,
          vehicle_category: r.vehicle_category as any,
          service_type: cleanService as any,
          terminal: effectiveTerminal as any,
          fare_amount: r.fare_amount,
          currency: 'SAR' as const,
          is_active: Boolean(is_active),
          created_at: exactExisting?.created_at || now,
          updated_at: now,
        };
      });

      const { data, error } = await supabaseAdmin
        .from('fixed_fare_rates')
        .upsert(recordsToUpsert, { onConflict: 'id' })
        .select('*');

      if (error) {
        console.warn('Supabase bulk upsert warning on fixed_fare_rates:', error.message);
        return NextResponse.json({ success: true, rates: recordsToUpsert, warning: error.message });
      }

      return NextResponse.json({ success: true, rates: data || recordsToUpsert }, { status: 201 });
    }

    // Single rate creation (backward-compatible)
    const {
      vehicle_category,
      service_type,
      terminal,
      fare_amount,
      is_active = true,
      id,
    } = body;

    if (!vehicle_category || !service_type) {
      return NextResponse.json(
        { error: 'Vehicle category and service route are required.' },
        { status: 400 }
      );
    }

    const numericFare = Number(fare_amount);
    if (isNaN(numericFare) || numericFare <= 0) {
      return NextResponse.json(
        { error: 'Fixed fare amount must be a positive number.' },
        { status: 400 }
      );
    }

    const cleanService = String(service_type).trim();
    const airport = isAirportRoute(cleanService);
    const effectiveTerminal = airport && terminal && terminal !== 'none'
      ? String(terminal).trim()
      : null;

    // Check conflict against existing rates
    const { data: existingRows } = await supabaseAdmin
      .from('fixed_fare_rates')
      .select('*')
      .eq('service_type', cleanService);

    const existingRates: FixedFareRate[] = existingRows || [];
    const conflict = checkRateConflict(
      vehicle_category.trim(),
      cleanService,
      effectiveTerminal,
      existingRates,
      id
    );

    if (conflict.hasConflict && conflict.conflictingRate?.id !== id) {
      return NextResponse.json(
        { error: conflict.message || 'Rate conflict detected with an existing active rate.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const rateId =
      id ||
      `${vehicle_category.trim()}-${cleanService}${effectiveTerminal ? `-${effectiveTerminal}` : ''}-${Date.now()}`;

    const rateRecord: FixedFareRate = {
      id: rateId,
      vehicle_category: vehicle_category.trim() as any,
      service_type: cleanService as any,
      terminal: effectiveTerminal as any,
      fare_amount: numericFare,
      currency: 'SAR',
      is_active: Boolean(is_active),
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('fixed_fare_rates')
      .upsert(rateRecord, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.warn('Supabase upsert warning on fixed_fare_rates:', error.message);
      return NextResponse.json({ rate: rateRecord, warning: error.message });
    }

    return NextResponse.json({ rate: data || rateRecord }, { status: 201 });
  } catch (err: unknown) {
    console.error('Error creating admin rate:', err);
    const msg = err instanceof Error ? err.message : 'Failed to create rate';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rate ID is required for update.' }, { status: 400 });
    }

    if (updates.fare_amount !== undefined) {
      const numericFare = Number(updates.fare_amount);
      if (isNaN(numericFare) || numericFare <= 0) {
        return NextResponse.json({ error: 'Fare amount must be a positive number.' }, { status: 400 });
      }
      updates.fare_amount = numericFare;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('fixed_fare_rates')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.warn('Supabase update warning on fixed_fare_rates:', error.message);
      return NextResponse.json({ success: true, updated: { id, ...updates }, warning: error.message });
    }

    return NextResponse.json({ success: true, rate: data });
  } catch (err: unknown) {
    console.error('Error updating admin rate:', err);
    const msg = err instanceof Error ? err.message : 'Failed to update rate';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let id = request.nextUrl.searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Rate ID is required for deletion.' }, { status: 400 });
    }

    // Safety check: Check if rate is linked to historical bookings
    const { data: rateRecord } = await supabaseAdmin
      .from('fixed_fare_rates')
      .select('id, vehicle_category, service_type, terminal')
      .eq('id', id)
      .maybeSingle();

    if (rateRecord) {
      const { count: bookingCount } = await supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('fare_rate_id', id);

      if (bookingCount && bookingCount > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete this rate: It is linked to ${bookingCount} existing customer booking(s). To preserve historical receipts and confirmed fares, deactivate this rate instead.`,
            linkedBookings: bookingCount,
            canDeactivate: true,
          },
          { status: 409 }
        );
      }
    }

    const { error } = await supabaseAdmin
      .from('fixed_fare_rates')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete warning on fixed_fare_rates:', error.message);
      return NextResponse.json({ success: true, id, warning: error.message });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    console.error('Error deleting admin rate:', err);
    const msg = err instanceof Error ? err.message : 'Failed to delete rate';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
