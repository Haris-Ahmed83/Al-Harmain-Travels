import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { RateTerminal } from '@/types';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('rate_terminals')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching rate_terminals:', error.message);
      return NextResponse.json({ terminals: [] });
    }

    return NextResponse.json({ terminals: data || [] });
  } catch (err: unknown) {
    console.error('Error in GET /api/admin/rates/terminals:', err);
    return NextResponse.json({ terminals: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      route_id = null,
      description = '',
      is_active = true,
      display_order = 0,
      id,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Terminal name is required.' }, { status: 400 });
    }

    const cleanCode = (code || name).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const terminalId = (id || cleanCode).trim();

    // Check duplicate
    const { data: existing } = await supabaseAdmin
      .from('rate_terminals')
      .select('id')
      .eq('id', terminalId)
      .maybeSingle();

    if (existing && !id) {
      return NextResponse.json(
        { error: `A terminal with code/ID "${terminalId}" already exists.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const record: RateTerminal = {
      id: terminalId,
      name: String(name).trim(),
      code: cleanCode,
      route_id: route_id ? String(route_id).trim() : null,
      description: description ? String(description).trim() : null,
      is_active: Boolean(is_active),
      display_order: Number(display_order) || 0,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('rate_terminals')
      .upsert(record, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, terminal: data || record }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create terminal';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Terminal ID is required.' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('rate_terminals')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, terminal: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update terminal';
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
      return NextResponse.json({ error: 'Terminal ID is required.' }, { status: 400 });
    }

    // Check if linked to bookings
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('terminal', id);

    if (bookingCount && bookingCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete terminal "${id}": It is linked to ${bookingCount} existing customer booking(s). To preserve historical booking records, please deactivate this terminal instead.`,
          linkedBookings: bookingCount,
          canDeactivate: true,
        },
        { status: 409 }
      );
    }

    // Check if linked to active fixed fare rates
    const { count: rateCount } = await supabaseAdmin
      .from('fixed_fare_rates')
      .select('id', { count: 'exact', head: true })
      .eq('terminal', id);

    if (rateCount && rateCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete terminal "${id}": It is configured in ${rateCount} fixed rate(s). Please remove or reassign those fixed rates first, or deactivate this terminal.`,
          linkedRates: rateCount,
          canDeactivate: true,
        },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from('rate_terminals')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete terminal';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
