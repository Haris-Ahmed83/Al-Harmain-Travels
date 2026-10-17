import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Validation regex for standard UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Completed booking statuses that are eligible for rating
const COMPLETED_STATUSES = ['trip_completed', 'completed', 'payment_completed', 'ride_completed'];

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const { booking_id, rating, feedback, customer_id, driver_id } = body;

    // 1. Validate booking_id
    if (!booking_id || typeof booking_id !== 'string' || !UUID_REGEX.test(booking_id)) {
      return NextResponse.json(
        { success: false, error: 'A valid Booking UUID is required.' },
        { status: 400 }
      );
    }

    // 2. Validate rating value (must be integer 1 to 5)
    const numericRating = Number(rating);
    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return NextResponse.json(
        { success: false, error: 'Rating must be an integer between 1 and 5 stars.' },
        { status: 400 }
      );
    }

    // 3. Verify booking exists and is in a completed status
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_reference, status, customer_id, assigned_driver_id')
      .eq('id', booking_id)
      .maybeSingle();

    if (bookingErr || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking journey record not found.' },
        { status: 404 }
      );
    }

    if (!COMPLETED_STATUSES.includes(booking.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Ratings can only be submitted for completed journeys. Current trip status is "${booking.status}".`,
        },
        { status: 400 }
      );
    }

    // 4. Server-side duplicate check (Enforce strictly one rating per ride)
    const { data: existingRating, error: checkErr } = await supabaseAdmin
      .from('ratings_feedback')
      .select('*')
      .eq('booking_id', booking_id)
      .maybeSingle();

    if (checkErr && checkErr.code !== 'PGRST116') {
      console.error('Error checking existing rating:', checkErr);
    }

    if (existingRating) {
      return NextResponse.json(
        {
          success: false,
          alreadyRated: true,
          message: 'Thank you! Your review has been recorded',
          error: 'A review has already been recorded for this journey. Each ride can only be rated once.',
          data: existingRating,
        },
        { status: 409 }
      );
    }

    // 5. Resolve target driver
    const targetDriverId = booking.assigned_driver_id || driver_id;
    if (!targetDriverId || !UUID_REGEX.test(targetDriverId)) {
      return NextResponse.json(
        { success: false, error: 'No assigned chauffeur found for this journey.' },
        { status: 400 }
      );
    }

    // 6. Resolve target customer
    const targetCustomerId =
      booking.customer_id || (customer_id && UUID_REGEX.test(customer_id) ? customer_id : null);

    const cleanFeedback =
      typeof feedback === 'string' && feedback.trim() ? feedback.trim() : null;

    // 7. Insert rating record into Supabase
    const { data: newRating, error: insertErr } = await supabaseAdmin
      .from('ratings_feedback')
      .insert({
        booking_id,
        customer_id: targetCustomerId,
        driver_id: targetDriverId,
        rating: numericRating,
        feedback: cleanFeedback,
        category: 'rating',
      })
      .select()
      .single();

    if (insertErr) {
      // Catch unique constraint violation (duplicate submission)
      if (insertErr.code === '23505' || insertErr.message?.includes('duplicate key') || insertErr.message?.includes('ratings_feedback_booking_id_unique')) {
        const { data: recordedRating } = await supabaseAdmin
          .from('ratings_feedback')
          .select('*')
          .eq('booking_id', booking_id)
          .maybeSingle();

        return NextResponse.json(
          {
            success: false,
            alreadyRated: true,
            message: 'Thank you! Your review has been recorded',
            error: 'A review has already been recorded for this ride.',
            data: recordedRating,
          },
          { status: 409 }
        );
      }

      console.error('Database error inserting rating:', insertErr);
      return NextResponse.json(
        { success: false, error: insertErr.message || 'Failed to save review in database.' },
        { status: 500 }
      );
    }

    // 8. Explicit fallback recalculation for driver stats (guarantee accuracy)
    try {
      const [ratingsRes, completedRidesRes] = await Promise.all([
        supabaseAdmin.from('ratings_feedback').select('rating').eq('driver_id', targetDriverId),
        supabaseAdmin
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_driver_id', targetDriverId)
          .in('status', COMPLETED_STATUSES),
      ]);

      const validRatings = (ratingsRes.data || []).filter(
        (r) => r.rating !== null && r.rating !== undefined && !isNaN(Number(r.rating))
      );
      const avgRating =
        validRatings.length > 0
          ? Number(
              (
                validRatings.reduce((sum, r) => sum + Number(r.rating), 0) / validRatings.length
              ).toFixed(2)
            )
          : null;
      const totalRides = completedRidesRes.count ?? 0;

      await supabaseAdmin
        .from('drivers')
        .update({
          rating: avgRating,
          rating_count: validRatings.length,
          total_rides: totalRides,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetDriverId);
    } catch (statsErr) {
      console.warn('Driver stats recalculation fallback warning:', statsErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! Your review has been recorded',
        data: newRating,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Unexpected error in POST /api/ratings:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error processing rating.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('booking_id');
    const driverId = searchParams.get('driver_id');

    if (bookingId) {
      const { data, error } = await supabaseAdmin
        .from('ratings_feedback')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        isRated: !!data,
        rating: data || null,
      });
    }

    if (driverId) {
      const { data, error } = await supabaseAdmin
        .from('ratings_feedback')
        .select(`
          *,
          booking:bookings(booking_reference, pickup_address, destination_address, passenger_name, created_at),
          customer:profiles!customer_id(full_name, avatar_url, phone)
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        ratings: data || [],
      });
    }

    // Default: Return all ratings with joined booking, driver, and customer details
    const { data, error } = await supabaseAdmin
      .from('ratings_feedback')
      .select(`
        *,
        booking:bookings(booking_reference, pickup_address, destination_address, passenger_name, created_at),
        customer:profiles!customer_id(full_name, avatar_url, phone),
        driver:drivers!driver_id(
          id,
          rating,
          total_rides,
          profile:profiles(full_name, avatar_url)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ratings: data || [],
    });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/ratings:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error fetching ratings.' },
      { status: 500 }
    );
  }
}
