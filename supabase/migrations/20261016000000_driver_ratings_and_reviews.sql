-- ==============================================================================
-- Migration: Post-Ride Driver Rating and Review System
-- Project:   Al Harmain Travels
-- Description:
--   1. Ensures rating_count column on drivers table.
--   2. Adds unique constraint on ratings_feedback.booking_id to enforce one rating per ride.
--   3. Adds check constraint on rating (1 to 5).
--   4. Adds triggers on ratings_feedback and bookings to keep driver rating, rating_count,
--      and total_rides synchronized accurately.
--   5. Configures Row Level Security (RLS) policies for customers, drivers, dispatchers, and admins.
-- ==============================================================================

-- 1. Ensure rating_count column on drivers table
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 2. Add UNIQUE constraint on booking_id in ratings_feedback
ALTER TABLE public.ratings_feedback
  DROP CONSTRAINT IF EXISTS ratings_feedback_booking_id_unique;
ALTER TABLE public.ratings_feedback
  ADD CONSTRAINT ratings_feedback_booking_id_unique UNIQUE (booking_id);

-- 3. Add rating range check constraint (1 to 5)
ALTER TABLE public.ratings_feedback
  DROP CONSTRAINT IF EXISTS ratings_feedback_rating_check;
ALTER TABLE public.ratings_feedback
  ADD CONSTRAINT ratings_feedback_rating_check CHECK (rating >= 1 AND rating <= 5);

-- 4. Create trigger function to update driver rating, rating_count, and completed trips
CREATE OR REPLACE FUNCTION public.update_driver_rating_and_trips()
RETURNS TRIGGER AS $$
DECLARE
  target_driver_id UUID;
  new_avg NUMERIC(3, 2);
  new_count INT;
  new_completed_trips INT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_driver_id := OLD.driver_id;
  ELSE
    target_driver_id := NEW.driver_id;
  END IF;

  IF target_driver_id IS NOT NULL THEN
    SELECT 
      ROUND(AVG(rating)::numeric, 2),
      COUNT(*)
    INTO new_avg, new_count
    FROM public.ratings_feedback
    WHERE driver_id = target_driver_id AND rating IS NOT NULL;

    SELECT COUNT(*)
    INTO new_completed_trips
    FROM public.bookings
    WHERE assigned_driver_id = target_driver_id
      AND status IN ('trip_completed', 'completed', 'payment_completed', 'ride_completed');

    UPDATE public.drivers
    SET 
      rating = new_avg,
      rating_count = COALESCE(new_count, 0),
      total_rides = COALESCE(new_completed_trips, 0),
      updated_at = NOW()
    WHERE id = target_driver_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger to ratings_feedback
DROP TRIGGER IF EXISTS trg_update_driver_rating ON public.ratings_feedback;
CREATE TRIGGER trg_update_driver_rating
AFTER INSERT OR UPDATE OR DELETE ON public.ratings_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_driver_rating_and_trips();

-- 6. Trigger on bookings to keep driver total_rides synced when status or assignment changes
CREATE OR REPLACE FUNCTION public.update_driver_completed_trips_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  driver_to_update UUID;
  new_completed_trips INT;
BEGIN
  driver_to_update := COALESCE(NEW.assigned_driver_id, OLD.assigned_driver_id);

  IF driver_to_update IS NOT NULL THEN
    SELECT COUNT(*)
    INTO new_completed_trips
    FROM public.bookings
    WHERE assigned_driver_id = driver_to_update
      AND status IN ('trip_completed', 'completed', 'payment_completed', 'ride_completed');

    UPDATE public.drivers
    SET 
      total_rides = COALESCE(new_completed_trips, 0),
      updated_at = NOW()
    WHERE id = driver_to_update;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_driver_trips ON public.bookings;
CREATE TRIGGER trg_update_driver_trips
AFTER INSERT OR UPDATE OF status, assigned_driver_id ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_driver_completed_trips_on_booking();

-- 7. Row Level Security (RLS) on ratings_feedback
ALTER TABLE public.ratings_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all ratings_feedback" ON public.ratings_feedback;
DROP POLICY IF EXISTS "Allow read ratings_feedback" ON public.ratings_feedback;
CREATE POLICY "Allow read ratings_feedback"
  ON public.ratings_feedback
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow insert ratings_feedback" ON public.ratings_feedback;
CREATE POLICY "Allow insert ratings_feedback"
  ON public.ratings_feedback
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    rating >= 1 AND rating <= 5
    AND booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.status IN ('trip_completed', 'completed', 'payment_completed', 'ride_completed')
    )
  );

DROP POLICY IF EXISTS "Allow admin modify ratings_feedback" ON public.ratings_feedback;
CREATE POLICY "Allow admin modify ratings_feedback"
  ON public.ratings_feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dispatcher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'dispatcher')
    )
  );
