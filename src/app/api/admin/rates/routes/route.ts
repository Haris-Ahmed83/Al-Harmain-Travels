import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { RateRoute } from '@/types';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('rate_routes')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching rate_routes:', error.message);
      return NextResponse.json({ routes: [] });
    }

    return NextResponse.json({ routes: data || [] });
  } catch (err: unknown) {
    console.error('Error in GET /api/admin/rates/routes:', err);
    return NextResponse.json({ routes: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      route_name,
      origin_name,
      destination_name,
      service_id = null,
      is_airport = false,
      is_active = true,
      display_order = 0,
      id,
    } = body;

    if (!route_name || !String(route_name).trim()) {
      return NextResponse.json({ error: 'Route name is required.' }, { status: 400 });
    }
    if (!origin_name || !String(origin_name).trim()) {
      return NextResponse.json({ error: 'Pickup origin name is required.' }, { status: 400 });
    }
    if (!destination_name || !String(destination_name).trim()) {
      return NextResponse.json({ error: 'Destination name is required.' }, { status: 400 });
    }

    const cleanId = (id || route_name).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Duplicate check
    const { data: existing } = await supabaseAdmin
      .from('rate_routes')
      .select('id')
      .eq('id', cleanId)
      .maybeSingle();

    if (existing && !id) {
      return NextResponse.json(
        { error: `A route with ID/slug "${cleanId}" already exists. Please choose a different name or edit the existing route.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const record: RateRoute = {
      id: cleanId,
      service_id: service_id ? String(service_id).trim() : null,
      route_name: String(route_name).trim(),
      origin_name: String(origin_name).trim(),
      destination_name: String(destination_name).trim(),
      is_airport: Boolean(is_airport),
      is_active: Boolean(is_active),
      display_order: Number(display_order) || 0,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('rate_routes')
      .upsert(record, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, route: data || record }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create route';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Route ID is required.' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('rate_routes')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, route: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update route';
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
      return NextResponse.json({ error: 'Route ID is required.' }, { status: 400 });
    }

    // Check if linked to existing customer bookings
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('service_type', id);

    if (bookingCount && bookingCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete route "${id}": It is linked to ${bookingCount} existing customer booking(s). To preserve historical booking records and confirmed fares, please deactivate this route instead.`,
          linkedBookings: bookingCount,
          canDeactivate: true,
        },
        { status: 409 }
      );
    }

    // Check if linked to fixed fare rates
    const { count: rateCount } = await supabaseAdmin
      .from('fixed_fare_rates')
      .select('id', { count: 'exact', head: true })
      .eq('service_type', id);

    if (rateCount && rateCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete route "${id}": It has ${rateCount} fixed fare rate(s) configured. Please delete those rates first, or deactivate this route.`,
          linkedRates: rateCount,
          canDeactivate: true,
        },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from('rate_routes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete route';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
