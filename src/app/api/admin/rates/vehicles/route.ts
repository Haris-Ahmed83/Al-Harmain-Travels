import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { RateVehicleType } from '@/types';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('rate_vehicle_types')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching rate_vehicle_types:', error.message);
      return NextResponse.json({ vehicles: [] });
    }

    return NextResponse.json({ vehicles: data || [] });
  } catch (err: unknown) {
    console.error('Error in GET /api/admin/rates/vehicles:', err);
    return NextResponse.json({ vehicles: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      seating_capacity = 4,
      luggage_capacity = 3,
      description = '',
      is_active = true,
      display_order = 0,
      id,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Vehicle name is required.' }, { status: 400 });
    }

    const cleanCategory = (category || name).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const vehicleId = id ? String(id).trim() : cleanCategory;

    const seats = Number(seating_capacity);
    if (isNaN(seats) || seats < 1 || seats > 60) {
      return NextResponse.json({ error: 'Passenger seating capacity must be between 1 and 60.' }, { status: 400 });
    }

    const luggage = Number(luggage_capacity);
    if (isNaN(luggage) || luggage < 0 || luggage > 60) {
      return NextResponse.json({ error: 'Luggage capacity must be 0 or greater.' }, { status: 400 });
    }

    // Check if duplicate ID exists
    const { data: existing } = await supabaseAdmin
      .from('rate_vehicle_types')
      .select('id')
      .eq('id', vehicleId)
      .maybeSingle();

    if (existing && !id) {
      return NextResponse.json(
        { error: `A vehicle type with code "${vehicleId}" already exists. Please use a unique name or edit the existing record.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const record: RateVehicleType = {
      id: vehicleId,
      name: String(name).trim(),
      category: cleanCategory,
      seating_capacity: seats,
      luggage_capacity: luggage,
      description: description ? String(description).trim() : null,
      is_active: Boolean(is_active),
      display_order: Number(display_order) || 0,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('rate_vehicle_types')
      .upsert(record, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, vehicle: data || record }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create vehicle type';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID is required.' }, { status: 400 });
    }

    if (updates.seating_capacity !== undefined) {
      const seats = Number(updates.seating_capacity);
      if (isNaN(seats) || seats < 1 || seats > 60) {
        return NextResponse.json({ error: 'Passenger seating capacity must be between 1 and 60.' }, { status: 400 });
      }
      updates.seating_capacity = seats;
    }

    if (updates.luggage_capacity !== undefined) {
      const luggage = Number(updates.luggage_capacity);
      if (isNaN(luggage) || luggage < 0 || luggage > 60) {
        return NextResponse.json({ error: 'Luggage capacity must be 0 or greater.' }, { status: 400 });
      }
      updates.luggage_capacity = luggage;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('rate_vehicle_types')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, vehicle: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update vehicle type';
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
      return NextResponse.json({ error: 'Vehicle ID is required.' }, { status: 400 });
    }

    // Safety Check: Check if linked to existing bookings
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .or(`vehicle_category.eq.${id},vehicle_type.eq.${id}`);

    if (bookingCount && bookingCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete vehicle type "${id}": It is linked to ${bookingCount} existing customer booking(s). To preserve historical booking records and confirmed fares, please deactivate this vehicle type instead.`,
          linkedBookings: bookingCount,
          canDeactivate: true,
        },
        { status: 409 }
      );
    }

    // Check if linked to fixed fare rates
    const { count: ratesCount } = await supabaseAdmin
      .from('fixed_fare_rates')
      .select('id', { count: 'exact', head: true })
      .eq('vehicle_category', id);

    if (ratesCount && ratesCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete vehicle type "${id}": It is configured in ${ratesCount} active rate(s). Please remove or reassign those fixed rates first, or deactivate this vehicle type.`,
          linkedRates: ratesCount,
          canDeactivate: true,
        },
        { status: 409 }
      );
    }

    // Safety Check: Check if currently assigned to any active drivers
    const { data: assignedDrivers } = await supabaseAdmin
      .from('drivers')
      .select('id, profile:profiles(full_name)')
      .eq('assigned_vehicle_id', id);

    if (assignedDrivers && assignedDrivers.length > 0) {
      const driverNames = assignedDrivers.map((d: any) => d.profile?.full_name || 'Captain').join(', ');
      return NextResponse.json(
        {
          error: `Cannot delete vehicle type "${id}": It is currently assigned to ${assignedDrivers.length} captain(s) (${driverNames}) in User Management. Please unassign or reassign the captain(s) first, or deactivate this vehicle type instead.`,
          linkedDrivers: assignedDrivers.length,
          canDeactivate: true,
        },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from('rate_vehicle_types')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete vehicle type';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
