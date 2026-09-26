# Database & APIs Reference

## Supabase Client Configuration

Client is initialized in `src/lib/supabase/client.ts`:
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Configured options:
  - `auth.persistSession: true`
  - `auth.autoRefreshToken: true`
  - `realtime.params.eventsPerSecond: 10`

---

## Relational Database Schema (PostgreSQL / Supabase)

### 1. `profiles`
Primary user records extending Supabase Auth.
- `id` (UUID, PK, references `auth.users.id`)
- `role` (`'admin' | 'dispatcher' | 'driver' | 'customer'`)
- `full_name` (TEXT)
- `email` (TEXT, unique)
- `phone` (TEXT)
- `email_verified` (BOOLEAN)
- `phone_verified` (BOOLEAN)
- `avatar_url` (TEXT)
- `date_of_birth` (DATE)
- `gender` (`'male' | 'female' | 'other'`)
- `status` (`'active' | 'suspended' | 'deactivated'`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. `customers`
Customer preferences and profile extension.
- `id` (UUID, PK, references `profiles.id`)
- `emergency_contact` (TEXT)
- `preferred_language` (TEXT, default `'en'`)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 3. `emergency_contacts`
Customer safety contacts.
- `id` (TEXT/UUID, PK)
- `customer_id` (UUID, references `profiles.id`)
- `name` (TEXT)
- `relationship` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `is_primary` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 4. `saved_places`
Fast-select saved addresses (Home, Work, Custom).
- `id` (TEXT/UUID, PK)
- `customer_id` (UUID, references `profiles.id`)
- `name` (TEXT)
- `type` (`'home' | 'work' | 'custom'`)
- `address` (TEXT)
- `latitude` (NUMERIC)
- `longitude` (NUMERIC)
- `place_id` (TEXT)

### 5. `recent_locations`
Recent search history for quick rebooking.
- `id` (TEXT/UUID, PK)
- `customer_id` (UUID, references `profiles.id`)
- `place_id` (TEXT)
- `address` (TEXT)
- `latitude` (NUMERIC)
- `longitude` (NUMERIC)
- `last_used_at` (TIMESTAMPTZ)

### 6. `vehicles`
Fleet vehicle inventory.
- `id` (TEXT/UUID, PK)
- `plate_number` (TEXT, unique)
- `make` (TEXT)
- `model` (TEXT)
- `year` (INTEGER)
- `vehicle_type` (`'sedan' | 'suv' | 'van' | 'vip_gmc' | 'bus'`)
- `color` (TEXT)
- `seating_capacity` (INTEGER)
- `status` (`'available' | 'assigned' | 'maintenance' | 'inactive'`)
- `insurance_expiry` (DATE)
- `inspection_expiry` (DATE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 7. `drivers`
Captain profiles and performance metrics.
- `id` (UUID, PK, references `profiles.id`)
- `license_number` (TEXT)
- `national_id` (TEXT)
- `assigned_vehicle_id` (TEXT, references `vehicles.id`)
- `status` (`'available' | 'assigned' | 'on_trip' | 'busy' | 'offline' | 'on_break' | 'unavailable'`)
- `rating` (NUMERIC)
- `total_rides` (INTEGER)
- `total_earnings` (NUMERIC)
- `cash_collected` (NUMERIC)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 8. `driver_locations`
Realtime tracking table.
- `driver_id` (UUID, PK, references `drivers.id`)
- `latitude` (NUMERIC)
- `longitude` (NUMERIC)
- `heading` (NUMERIC)
- `speed` (NUMERIC)
- `updated_at` (TIMESTAMPTZ)

### 9. `bookings`
Core booking entity.
- `id` (TEXT/UUID, PK)
- `booking_reference` (TEXT, unique)
- `customer_id` (UUID, references `profiles.id`)
- `passenger_name` (TEXT)
- `passenger_phone` (TEXT)
- `booking_type` (`'immediate' | 'scheduled'`)
- `status` (BookingStatus enum)
- `pickup_address` (TEXT), `pickup_latitude` (NUMERIC), `pickup_longitude` (NUMERIC)
- `destination_address` (TEXT), `destination_latitude` (NUMERIC), `destination_longitude` (NUMERIC)
- `scheduled_at` (TIMESTAMPTZ)
- `vehicle_type` (VehicleType enum)
- `assigned_driver_id` (UUID, references `drivers.id`)
- `passenger_count` (INTEGER)
- `notes` (TEXT)
- `estimated_distance_km` (NUMERIC)
- `estimated_duration_min` (NUMERIC)
- `estimated_fare` (NUMERIC)
- `final_fare` (NUMERIC)
- `cancellation_reason` (TEXT), `cancelled_by` (UUID), `cancelled_at` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 10. `services`
CMS catalog for published packages.
- `id` (UUID, PK)
- `title` (TEXT)
- `slug` (TEXT, unique)
- `description` (TEXT)
- `image_url` (TEXT)
- `base_price` (NUMERIC)
- `vehicle_type` (VehicleType enum)
- `features` (TEXT[])
- `is_active` (BOOLEAN)
- `display_order` (INTEGER)

### 11. `system_settings`
System global configurations.
- `id` (TEXT, PK, default `'current'`)
- `company_name`, `company_tagline`, `support_phone`, `support_whatsapp`, `support_email`, `address`, `currency`, `tax_percentage`

---

## Supabase Storage

- **Bucket**: `avatars`
- **Path structure**: `avatars/{userId}-{timestamp}.{ext}`
- **Fallback**: If bucket is not yet provisioned or permissions are restricted, uploads convert the image file to a base64 Data URL so the UI updates smoothly without blocking user action.

---

## Authentication Patterns

- **Sign Up**: `supabase.auth.signUp({ email, password, options: { data: { full_name, phone, role: 'customer' } } })`
- **Email Verification**: When Supabase email confirmations are active, verification status is polled via `supabase.auth.getSession()` looking for `email_confirmed_at`.
- **Demo Mode**: For instantaneous pairing and testing, `AppContext` provides pre-seeded demo accounts in `DEMO_PROFILES`:
  - Customer: `customer@alharmaintravel.com` (`Dr. Abdullah Rahman`)
  - Driver: `driver@alharmaintravel.com` (`Captain Tariq Al-Ghamdi`)
  - Dispatcher: `dispatcher@alharmaintravel.com` (`Fahad Al-Otaibi`)
  - Admin: `admin@alharmaintravel.com` (`Executive Administrator`)
