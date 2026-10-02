import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { RateServiceType } from '@/types';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('rate_service_types')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching rate_service_types:', error.message);
      return NextResponse.json({ services: [] });
    }

    return NextResponse.json({ services: data || [] });
  } catch (err: unknown) {
    console.error('Error in GET /api/admin/rates/services:', err);
    return NextResponse.json({ services: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description = '',
      is_active = true,
      display_order = 0,
      id,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Service name is required.' }, { status: 400 });
    }

    const cleanId = (id || name).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Check duplicate
    const { data: existing } = await supabaseAdmin
      .from('rate_service_types')
      .select('id')
      .eq('id', cleanId)
      .maybeSingle();

    if (existing && !id) {
      return NextResponse.json(
        { error: `A service type with code "${cleanId}" already exists.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const record: RateServiceType = {
      id: cleanId,
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      is_active: Boolean(is_active),
      display_order: Number(display_order) || 0,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('rate_service_types')
      .upsert(record, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, service: data || record }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create service type';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required.' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('rate_service_types')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, service: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update service type';
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
      return NextResponse.json({ error: 'Service ID is required.' }, { status: 400 });
    }

    // Check if linked to routes
    const { count: routeCount } = await supabaseAdmin
      .from('rate_routes')
      .select('id', { count: 'exact', head: true })
      .eq('service_id', id);

    if (routeCount && routeCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete service type "${id}": It is linked to ${routeCount} route(s). Please delete or reassign those routes first, or deactivate this service type.`,
          canDeactivate: true,
        },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from('rate_service_types')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete service type';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
