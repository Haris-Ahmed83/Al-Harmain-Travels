import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { calculateDistanceKm, estimateDurationMinutes } from '@/lib/geo';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required.' }, { status: 400 });
    }

    // Resolve booking from Supabase
    let query = supabase.from('bookings').select(`
      *,
      assigned_driver:drivers(
        id,
        rating,
        total_rides,
        profile:profiles(full_name, avatar_url),
        assigned_vehicle:rate_vehicle_types(name, category, seating_capacity),
        location:driver_locations(latitude, longitude, heading)
      )
    `);

    // Match by id or booking_reference
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('booking_reference', id);
    }

    const { data: booking, error } = await query.maybeSingle();

    if (error || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    let sanitizedDriver = null;
    let etaMinutes = null;
    let etaFormatted = null;

    if (booking.assigned_driver) {
      const d = booking.assigned_driver;
      const driverLat = d.location?.latitude ?? 21.4225;
      const driverLng = d.location?.longitude ?? 39.8262;
      const pickupLat = booking.pickup_latitude ?? driverLat;
      const pickupLng = booking.pickup_longitude ?? driverLng;

      const distKm = calculateDistanceKm(driverLat, driverLng, pickupLat, pickupLng);
      etaMinutes = Math.max(2, estimateDurationMinutes(distKm));
      const arrivalTime = new Date(Date.now() + etaMinutes * 60 * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      etaFormatted = `${etaMinutes} mins (${arrivalTime})`;

      sanitizedDriver = {
        id: d.id,
        name: d.profile?.full_name || 'Captain',
        photo: d.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: Number(d.rating) || 5.0,
        totalRides: Number(d.total_rides) || 0,
        vehicle: d.assigned_vehicle ? {
          make: d.assigned_vehicle.name,
          model: `(${d.assigned_vehicle.seating_capacity} Seats)`,
          color: 'Obsidian Black',
          plateNumber: d.assigned_vehicle.category?.toUpperCase() || 'VIP KSA',
          vehicleType: d.assigned_vehicle.category,
        } : null,
        location: {
          latitude: driverLat,
          longitude: driverLng,
          heading: d.location?.heading || 0,
        },
      };
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingReference: booking.booking_reference,
        status: booking.status,
        pickupAddress: booking.pickup_address,
        pickupLatitude: booking.pickup_latitude,
        pickupLongitude: booking.pickup_longitude,
        destinationAddress: booking.destination_address,
        destinationLatitude: booking.destination_latitude,
        destinationLongitude: booking.destination_longitude,
        vehicleType: booking.vehicle_type,
        scheduledAt: booking.scheduled_at,
        estimatedFare: booking.estimated_fare,
        finalFare: booking.final_fare,
      },
      driver: sanitizedDriver,
      etaMinutes,
      etaFormatted,
    });
  } catch (err: any) {
    console.error('Booking detail error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
