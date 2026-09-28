-- ==============================================================================
-- Migration: Custom Route Booking System
-- Project:   Al Harmain Travels
-- Description:
--   Supports Custom Route Bookings alongside Fixed-Fare Bookings.
--   1. Makes estimated_fare nullable (custom routes do not have predefined or computed fares).
--   2. Updates booking status CHECK constraint to include 'pending_review'.
--   3. Adds columns for booking_method ('fixed' | 'custom'), trip_type ('one_way' | 'round_trip'),
--      intermediate_stops JSONB, confirmed_fare, dispatcher_notes, and return_scheduled_at.
--   4. Makes payments.amount nullable for pending reviews prior to dispatcher fare confirmation.
-- ==============================================================================

-- 1. Make estimated_fare nullable
ALTER TABLE public.bookings ALTER COLUMN estimated_fare DROP NOT NULL;

-- 2. Update status constraint to include pending_review
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (
  status IN (
    'pending_review',
    'pending_verification',
    'payment_rejected',
    'payment_verified',
    'pending',
    'pending_confirmation',
    'confirmed',
    'searching',
    'driver_assigned',
    'accepted',
    'driver_accepted',
    'on_the_way',
    'driver_arriving',
    'arrived',
    'driver_arrived',
    'started',
    'trip_started',
    'ride_started',
    'completed',
    'trip_completed',
    'ride_completed',
    'cancelled',
    'rejected',
    'no_show',
    'payment_pending',
    'payment_completed'
  )
);

-- 3. Add custom route columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_method TEXT NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS trip_type TEXT DEFAULT 'one_way',
  ADD COLUMN IF NOT EXISTS intermediate_stops JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS confirmed_fare NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS dispatcher_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS return_scheduled_at TIMESTAMPTZ NULL;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS chk_booking_method;
ALTER TABLE public.bookings ADD CONSTRAINT chk_booking_method CHECK (booking_method IN ('fixed', 'custom'));

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS chk_trip_type;
ALTER TABLE public.bookings ADD CONSTRAINT chk_trip_type CHECK (trip_type IS NULL OR trip_type IN ('one_way', 'round_trip'));

-- 4. Allow null amount in payments
ALTER TABLE public.payments ALTER COLUMN amount DROP NOT NULL;
