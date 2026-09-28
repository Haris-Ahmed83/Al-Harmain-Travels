-- ==============================================================================
-- Migration: Fixed-Fare Rate System
-- Project:   Al Harmain Travels
-- Description:
--   Creates the fixed_fare_rates table that stores every approved rate.
--   Adds fixed-fare columns to the bookings table.
--   Seeds all 31 approved rates as specified by management
--   (7 Sedan + 8 Staria + 8 GMC + 8 HiRoof = 31 total).
--   Applies RLS: customers/drivers read-only; only admins can write.
-- ==============================================================================

-- 1. Create ENUM types for vehicle category and service type
-- (Using CHECK constraints instead to stay compatible with existing Supabase setup)

-- 2. Fixed fare rates table
CREATE TABLE IF NOT EXISTS public.fixed_fare_rates (
  id                TEXT        PRIMARY KEY,
  vehicle_category  TEXT        NOT NULL,
  service_type      TEXT        NOT NULL,
  terminal          TEXT        NULL,          -- NULL means "no terminal" (non-airport or sedan)
  fare_amount       NUMERIC(10, 2) NOT NULL CHECK (fare_amount > 0),
  currency          TEXT        NOT NULL DEFAULT 'SAR',
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce valid values
  CONSTRAINT chk_vehicle_category CHECK (
    vehicle_category IN ('sedan', 'staria', 'gmc', 'hiroof')
  ),
  CONSTRAINT chk_service_type CHECK (
    service_type IN (
      'intercity_jeddah_makkah',
      'intercity_makkah_jeddah',
      'intercity_makkah_madinah',
      'intercity_makkah_madinah_sameday',
      'ziyarat_taif',
      'ziyarat_taif_bani_saad',
      'ziyarat_makkah'
    )
  ),
  CONSTRAINT chk_terminal CHECK (
    terminal IS NULL OR terminal IN ('terminal_1', 'terminal_h', 'terminal_n')
  ),

  -- Prevent duplicate active rates for the exact same combination
  CONSTRAINT uq_rate_combination UNIQUE (vehicle_category, service_type, terminal)
);

-- Index for fast lookups during fare resolution
CREATE INDEX IF NOT EXISTS idx_ffr_lookup
  ON public.fixed_fare_rates (vehicle_category, service_type, terminal, is_active);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_fixed_fare_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fixed_fare_updated_at ON public.fixed_fare_rates;
CREATE TRIGGER trg_fixed_fare_updated_at
  BEFORE UPDATE ON public.fixed_fare_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_fixed_fare_updated_at();

-- 3. Add fixed-fare columns to the bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS vehicle_category  TEXT        NULL,
  ADD COLUMN IF NOT EXISTS service_type      TEXT        NULL,
  ADD COLUMN IF NOT EXISTS terminal          TEXT        NULL,
  ADD COLUMN IF NOT EXISTS fixed_fare_amount NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS fare_rate_id      TEXT        NULL REFERENCES public.fixed_fare_rates(id) ON DELETE SET NULL;

-- Constraint on bookings column (informational only, allows NULL for legacy bookings)
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS chk_booking_vehicle_category;
ALTER TABLE public.bookings
  ADD CONSTRAINT chk_booking_vehicle_category CHECK (
    vehicle_category IS NULL OR
    vehicle_category IN ('sedan', 'staria', 'gmc', 'hiroof')
  );

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS chk_booking_service_type;
ALTER TABLE public.bookings
  ADD CONSTRAINT chk_booking_service_type CHECK (
    service_type IS NULL OR
    service_type IN (
      'intercity_jeddah_makkah',
      'intercity_makkah_jeddah',
      'intercity_makkah_madinah',
      'intercity_makkah_madinah_sameday',
      'ziyarat_taif',
      'ziyarat_taif_bani_saad',
      'ziyarat_makkah'
    )
  );

-- 4. RLS Policies
ALTER TABLE public.fixed_fare_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can read active rates (needed for customer fare display)
DROP POLICY IF EXISTS "fixed_fare_rates_read" ON public.fixed_fare_rates;
CREATE POLICY "fixed_fare_rates_read"
  ON public.fixed_fare_rates
  FOR SELECT
  USING (is_active = TRUE OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only admins can insert/update/delete
DROP POLICY IF EXISTS "fixed_fare_rates_admin_write" ON public.fixed_fare_rates;
CREATE POLICY "fixed_fare_rates_admin_write"
  ON public.fixed_fare_rates
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 5. Seed all 28 approved rates
-- Uses ON CONFLICT DO NOTHING to be safe on repeated runs.

INSERT INTO public.fixed_fare_rates
  (id, vehicle_category, service_type, terminal, fare_amount, currency, is_active)
VALUES
  -- A. Sedan
  ('sedan-jeddah-makkah',           'sedan',  'intercity_jeddah_makkah',          NULL,         200,  'SAR', TRUE),
  ('sedan-makkah-jeddah',           'sedan',  'intercity_makkah_jeddah',           NULL,         180,  'SAR', TRUE),
  ('sedan-makkah-madinah',          'sedan',  'intercity_makkah_madinah',          NULL,         350,  'SAR', TRUE),
  ('sedan-makkah-madinah-sameday',  'sedan',  'intercity_makkah_madinah_sameday',  NULL,         650,  'SAR', TRUE),
  ('sedan-taif-ziyarat',            'sedan',  'ziyarat_taif',                      NULL,         350,  'SAR', TRUE),
  ('sedan-taif-bani-saad',          'sedan',  'ziyarat_taif_bani_saad',            NULL,         500,  'SAR', TRUE),
  ('sedan-makkah-ziyarat',          'sedan',  'ziyarat_makkah',                    NULL,         180,  'SAR', TRUE),

  -- B. Hyundai Staria
  ('staria-jeddah-makkah-t1',       'staria', 'intercity_jeddah_makkah',           'terminal_1', 300,  'SAR', TRUE),
  ('staria-jeddah-makkah-th',       'staria', 'intercity_jeddah_makkah',           'terminal_h', 350,  'SAR', TRUE),
  ('staria-makkah-jeddah',          'staria', 'intercity_makkah_jeddah',           NULL,         250,  'SAR', TRUE),
  ('staria-makkah-madinah',         'staria', 'intercity_makkah_madinah',          NULL,         500,  'SAR', TRUE),
  ('staria-makkah-madinah-sameday', 'staria', 'intercity_makkah_madinah_sameday',  NULL,         800,  'SAR', TRUE),
  ('staria-taif-ziyarat',           'staria', 'ziyarat_taif',                      NULL,         400,  'SAR', TRUE),
  ('staria-taif-bani-saad',         'staria', 'ziyarat_taif_bani_saad',            NULL,         600,  'SAR', TRUE),
  ('staria-makkah-ziyarat',         'staria', 'ziyarat_makkah',                    NULL,         250,  'SAR', TRUE),

  -- C. GMC — Nusuk
  ('gmc-jeddah-makkah-th',          'gmc',    'intercity_jeddah_makkah',           'terminal_h', 650,  'SAR', TRUE),
  ('gmc-jeddah-makkah-t1',          'gmc',    'intercity_jeddah_makkah',           'terminal_1', 600,  'SAR', TRUE),
  ('gmc-jeddah-makkah-tn',          'gmc',    'intercity_jeddah_makkah',           'terminal_n', 600,  'SAR', TRUE),
  ('gmc-makkah-jeddah',             'gmc',    'intercity_makkah_jeddah',           NULL,         500,  'SAR', TRUE),
  ('gmc-makkah-madinah',            'gmc',    'intercity_makkah_madinah',          NULL,         900,  'SAR', TRUE),
  ('gmc-taif-ziyarat',              'gmc',    'ziyarat_taif',                      NULL,         700,  'SAR', TRUE),
  ('gmc-taif-bani-saad',            'gmc',    'ziyarat_taif_bani_saad',            NULL,        1000,  'SAR', TRUE),
  ('gmc-makkah-ziyarat',            'gmc',    'ziyarat_makkah',                    NULL,         450,  'SAR', TRUE),

  -- D. HiRoof — Nusuk
  ('hiroof-jeddah-makkah-th',       'hiroof', 'intercity_jeddah_makkah',           'terminal_h', 450,  'SAR', TRUE),
  ('hiroof-jeddah-makkah-t1',       'hiroof', 'intercity_jeddah_makkah',           'terminal_1', 400,  'SAR', TRUE),
  ('hiroof-jeddah-makkah-tn',       'hiroof', 'intercity_jeddah_makkah',           'terminal_n', 400,  'SAR', TRUE),
  ('hiroof-makkah-jeddah',          'hiroof', 'intercity_makkah_jeddah',           NULL,         300,  'SAR', TRUE),
  ('hiroof-makkah-madinah',         'hiroof', 'intercity_makkah_madinah',          NULL,         600,  'SAR', TRUE),
  ('hiroof-taif-ziyarat',           'hiroof', 'ziyarat_taif',                      NULL,         500,  'SAR', TRUE),
  ('hiroof-taif-bani-saad',         'hiroof', 'ziyarat_taif_bani_saad',            NULL,         750,  'SAR', TRUE),
  ('hiroof-makkah-ziyarat',         'hiroof', 'ziyarat_makkah',                    NULL,         300,  'SAR', TRUE)

ON CONFLICT (id) DO NOTHING;

-- 6. Function: server-side fare resolver (used by RPC in booking validation)
CREATE OR REPLACE FUNCTION public.resolve_fixed_fare(
  p_vehicle_category TEXT,
  p_service_type     TEXT,
  p_terminal         TEXT DEFAULT NULL
)
RETURNS TABLE (
  rate_id      TEXT,
  fare_amount  NUMERIC,
  currency     TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ffr.id,
    ffr.fare_amount,
    ffr.currency
  FROM public.fixed_fare_rates ffr
  WHERE
    ffr.vehicle_category = p_vehicle_category
    AND ffr.service_type   = p_service_type
    AND (ffr.terminal IS NULL AND p_terminal IS NULL
         OR ffr.terminal = p_terminal)
    AND ffr.is_active = TRUE
  LIMIT 1;
END;
$$;
