import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { calculateDistanceKm, estimateDurationMinutes } from '@/lib/geo';
import { VehicleType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, bookingReference, vehicleType } = body;

    if (!bookingId && !bookingReference) {
      return NextResponse.json(
        { success: false, error: 'bookingId or bookingReference is required.' },
        { status: 400 }
      );
    }

    // 1. Resolve booking from Supabase
    let bookingRow: any = null;
    try {
      let query = supabase.from('bookings').select('*');
      if (bookingId) {
        query = query.or(`id.eq.${bookingId},booking_reference.eq.${bookingId}`);
      } else if (bookingReference) {
        query = query.eq('booking_reference', bookingReference);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        bookingRow = data;
      }
    } catch {
      // Continue to fallback if Supabase query fails
    }

    const isUuid = (str?: string) =>
      typeof str === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // 2. If booking found in Supabase with valid UUID — use atomic RPC to dispatch driver
    if (bookingRow && isUuid(bookingRow.id)) {
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'match_and_assign_driver',
        {
          p_booking_id: bookingRow.id,
          p_vehicle_type: vehicleType || bookingRow.vehicle_type || null,
        }
      );

      if (!rpcError && rpcResult) {
        const result = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult;

        if (result.matched) {
          // Calculate ETA
          const driverLat = result.driver?.location?.latitude ?? 21.4225;
          const driverLng = result.driver?.location?.longitude ?? 39.8262;
          const pickupLat = bookingRow.pickup_latitude ?? driverLat;
          const pickupLng = bookingRow.pickup_longitude ?? driverLng;

          const distKm = calculateDistanceKm(driverLat, driverLng, pickupLat, pickupLng);
          const etaMinutes = Math.max(3, estimateDurationMinutes(distKm));
          const arrivalTime = new Date(Date.now() + etaMinutes * 60 * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          // IMPORTANT: Driver has been DISPATCHED (status = driver_assigned in DB),
          // but they have NOT accepted yet. The customer modal must wait for
          // driver_accepted status via Realtime before showing "confirmed".
          return NextResponse.json({
            success: true,
            dispatched: true,        // a driver was found and notified
            awaitingAcceptance: true, // customer must wait for driver to tap Accept
            bookingId: bookingRow.id,
            bookingReference: bookingRow.booking_reference,
            status: 'driver_assigned',
            pickupAddress: bookingRow.pickup_address,
            destinationAddress: bookingRow.destination_address,
            driver: {
              id: result.driver.id,
              name: result.driver.name,
              photo:
                result.driver.photo ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              rating: Number(result.driver.rating) || 4.95,
              totalRides: Number(result.driver.total_rides) || 48,
              location: {
                latitude: driverLat,
                longitude: driverLng,
              },
            },
            vehicle: {
              vehicleType: result.vehicle.vehicle_type,
              make: result.vehicle.make,
              model: result.vehicle.model,
              color: result.vehicle.color || 'Obsidian Black',
              plateNumber: result.vehicle.plate_number,
            },
            etaMinutes,
            etaFormatted: `${etaMinutes} mins (${arrivalTime})`,
            distanceKm: distKm,
          });
        } else {
          return NextResponse.json({
            success: true,
            dispatched: false,
            awaitingAcceptance: false,
            reason: result.reason || 'no_available_driver',
            message: result.message || 'No available captain in your area at the moment.',
            bookingReference: bookingRow.booking_reference,
          });
        }
      }
    }

    // 3. If no driver matched via RPC or booking not found
    return NextResponse.json({
      success: true,
      dispatched: false,
      awaitingAcceptance: false,
      reason: 'no_available_driver',
      message: 'No available captains for requested vehicle type at this moment.',
      bookingReference: bookingRow?.booking_reference,
    });
  } catch (error: any) {
    console.error('Driver match route error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during driver matching.' },
      { status: 500 }
    );
  }
}
