import { Booking, Driver, RateVehicleType, RatingFeedback, Vehicle } from '@/types';

/**
 * Calculates a driver's average rating and total review count from real database records.
 * Returns null for rating if there are no ratings in the database.
 */
export function calculateDriverRating(
  ratings: RatingFeedback[],
  driverId: string
): { rating: number | null; count: number } {
  if (!ratings || !driverId) return { rating: null, count: 0 };

  const validRatings = ratings.filter(
    (r) => r.driver_id === driverId && r.rating !== null && r.rating !== undefined && !isNaN(Number(r.rating))
  );

  if (validRatings.length === 0) {
    return { rating: null, count: 0 };
  }

  const sum = validRatings.reduce((acc, curr) => acc + Number(curr.rating), 0);
  const avg = Number((sum / validRatings.length).toFixed(2));

  return {
    rating: avg,
    count: validRatings.length,
  };
}

/**
 * Calculates a driver's total completed rides count from real bookings.
 */
export function calculateDriverCompletedRides(bookings: Booking[], driverId: string): number {
  if (!bookings || !driverId) return 0;

  return bookings.filter(
    (b) =>
      b.assigned_driver_id === driverId &&
      (b.status === 'trip_completed' || b.status === 'completed' || b.status === 'payment_completed')
  ).length;
}

/**
 * Resolves a complete Vehicle object from assigned_vehicle_id, checking both
 * the physical fleet (vehicles table with real plate numbers) and configured rate vehicle types.
 */
export function resolveDriverVehicle(
  assignedVehicleId: string | null | undefined,
  rateVehicles: RateVehicleType[] = [],
  vehicles: Vehicle[] = []
): Vehicle | null {
  if (!assignedVehicleId) return null;

  // 1. Direct match with physical vehicles table by ID
  const directVehicle = vehicles.find((v) => v.id === assignedVehicleId);
  if (directVehicle) return directVehicle;

  // 2. Match with rateVehicles (by id or category)
  const rateVeh = rateVehicles.find(
    (rv) => rv.id === assignedVehicleId || rv.category === assignedVehicleId
  );

  // 3. Check if there is a physical vehicle in `vehicles` matching that category/type
  if (rateVeh) {
    const matchingPhysical = vehicles.find(
      (v) => v.vehicle_type === rateVeh.category || v.vehicle_type === (rateVeh.id as any)
    );

    if (matchingPhysical) {
      return {
        ...matchingPhysical,
        // Prefer rich rate vehicle naming if cleaner
        make: matchingPhysical.make || rateVeh.name,
        model: matchingPhysical.model || `(${rateVeh.seating_capacity} Seats)`,
        seating_capacity: matchingPhysical.seating_capacity || rateVeh.seating_capacity,
        vehicle_type: rateVeh.category as any,
      };
    }

    // Fallback based on rateVeh specs
    return {
      id: rateVeh.id,
      plate_number: rateVeh.category.toUpperCase(),
      make: rateVeh.name,
      model: `(${rateVeh.seating_capacity} Seats)`,
      vehicle_type: rateVeh.category as any,
      seating_capacity: rateVeh.seating_capacity,
      status: rateVeh.is_active ? 'assigned' : 'inactive',
      created_at: rateVeh.created_at || new Date().toISOString(),
      updated_at: rateVeh.updated_at || new Date().toISOString(),
    };
  }

  // 4. Match with physical vehicles by vehicle_type
  const physicalByType = vehicles.find((v) => v.vehicle_type === (assignedVehicleId as any));
  if (physicalByType) return physicalByType;

  return null;
}

/**
 * Formats driver rating for UI display, handling unrated/new drivers gracefully.
 */
export function formatDriverRating(
  rating: number | null | undefined,
  count: number = 0
): {
  stars: number;
  display: string;
  countLabel: string;
  isNew: boolean;
} {
  if (rating === null || rating === undefined || rating === 0 || isNaN(Number(rating))) {
    return {
      stars: 5,
      display: 'New',
      countLabel: 'No ratings yet',
      isNew: true,
    };
  }

  const num = Number(rating);
  return {
    stars: num,
    display: num.toFixed(1),
    countLabel: `${count} ${count === 1 ? 'review' : 'reviews'}`,
    isNew: false,
  };
}

/**
 * Fetches complete driver information and real statistics from Supabase database using actual driver ID.
 */
export async function fetchDriverDetails(
  supabaseClient: any,
  driverId: string
): Promise<Driver | null> {
  if (!driverId) return null;

  try {
    const [
      driverRes,
      profileRes,
      ratingsRes,
      completedRidesRes,
      vehiclesRes,
      rateVehRes,
    ] = await Promise.all([
      supabaseClient.from('drivers').select('*').eq('id', driverId).maybeSingle(),
      supabaseClient.from('profiles').select('*').eq('id', driverId).maybeSingle(),
      supabaseClient.from('ratings_feedback').select('rating').eq('driver_id', driverId),
      supabaseClient
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_driver_id', driverId)
        .in('status', ['trip_completed', 'completed', 'payment_completed']),
      supabaseClient.from('vehicles').select('*'),
      supabaseClient.from('rate_vehicle_types').select('*'),
    ]);

    if (!driverRes.data) return null;

    const d = driverRes.data;
    const profile = profileRes.data || null;
    const ratingsData = ratingsRes.data || [];
    const validRatings = ratingsData.filter(
      (r: any) => r.rating !== null && r.rating !== undefined && !isNaN(Number(r.rating))
    );

    const avgRating =
      validRatings.length > 0
        ? Number(
            (
              validRatings.reduce((sum: number, r: any) => sum + Number(r.rating), 0) /
              validRatings.length
            ).toFixed(2)
          )
        : null;

    const totalCompletedRides = completedRidesRes.count ?? 0;
    const resolvedVehicle = resolveDriverVehicle(
      d.assigned_vehicle_id,
      rateVehRes.data || [],
      vehiclesRes.data || []
    );

    return {
      ...d,
      profile,
      full_name: profile?.full_name || d.full_name || 'Captain',
      phone: profile?.phone || d.phone || null,
      avatar_url: profile?.avatar_url || d.avatar_url || null,
      rating: avgRating,
      rating_count: validRatings.length,
      total_rides: totalCompletedRides,
      assigned_vehicle: resolvedVehicle,
      vehicle: resolvedVehicle,
    };
  } catch (err) {
    console.warn('Error fetching driver details for', driverId, err);
    return null;
  }
}

