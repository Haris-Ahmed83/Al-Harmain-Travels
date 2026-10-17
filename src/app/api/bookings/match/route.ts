import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { calculateDistanceKm, estimateDurationMinutes } from '@/lib/geo';
import { VehicleType } from '@/types';
import { fetchDriverDetails } from '@/lib/driver-stats';

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
          const realDriverDetails = await fetchDriverDetails(supabase, result.driver.id);

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
              name: realDriverDetails?.profile?.full_name || realDriverDetails?.full_name || result.driver.name,
              phone: realDriverDetails?.profile?.phone || realDriverDetails?.phone || result.driver.phone || null,
              photo: realDriverDetails?.avatar_url || realDriverDetails?.profile?.avatar_url || null,
              rating: realDriverDetails?.rating ?? null,
              rating_count: realDriverDetails?.rating_count ?? 0,
              totalRides: realDriverDetails?.total_rides ?? 0,
              location: {
                latitude: driverLat,
                longitude: driverLng,
              },
            },
            vehicle: {
              vehicleType: realDriverDetails?.assigned_vehicle?.vehicle_type || result.vehicle.vehicle_type,
              make: realDriverDetails?.assigned_vehicle?.make || result.vehicle.make,
              model: realDriverDetails?.assigned_vehicle?.model || result.vehicle.model,
              color: realDriverDetails?.assigned_vehicle?.color || result.vehicle.color || 'Obsidian Black',
              plateNumber: realDriverDetails?.assigned_vehicle?.plate_number || result.vehicle.plate_number,
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
