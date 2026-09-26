# Architecture & State Management

## Overview

**Al Harmain Travels** is an enterprise-grade VIP transportation and pilgrimage (Hajj & Umrah) booking and fleet management system. It is built as a single-page and server-rendered hybrid application using Next.js 15 (App Router) and React 19.

## Tech Stack Summary

- **Framework**: Next.js 15.1.7 (App Router, Server Components + Client Components)
- **UI & React**: React 19.0.0, React DOM 19.0.0
- **Language**: TypeScript 5.7.3 (Strict mode, ES2017 target)
- **Styling**: Tailwind CSS 3.4.17 with CSS variables and Tailwind plugin utilities
- **Fonts**: Google Fonts `Cormorant_Garamond` (marketing display serif) & `Plus_Jakarta_Sans` (body sans)
- **Icons**: `lucide-react`
- **Toasts**: `sonner`
- **Mapping & Geolocation**: Hybrid Google Maps JavaScript API (Places, Geocoding, Directions) with Leaflet/OpenStreetMap/OSRM fallbacks
- **Backend & Database**: Supabase (`@supabase/supabase-js` 2.49.1, `@supabase/ssr` 0.5.2) with PostgreSQL, Auth, Realtime, and Storage

---

## Directory Structure

```
├── .env.local                    # Supabase and Google Maps API credentials
├── package.json                  # Dependencies and scripts (dev, build, start, lint)
├── tailwind.config.ts            # Custom design tokens, colors, typography scales
├── tsconfig.json                 # TypeScript path aliases (@/* -> ./src/*)
└── src/
    ├── app/                      # Next.js App Router routes & layouts
    │   ├── layout.tsx            # Root layout with fonts, ThemeProvider, AppProvider, Toaster
    │   ├── globals.css           # Global design tokens, light/dark variables, component utilities
    │   ├── page.tsx              # Public home page / marketing hero & booking teaser
    │   ├── about/                # About page
    │   ├── services/             # Public services catalog
    │   ├── contact/              # Contact & support page
    │   ├── auth/                 # Sign-in, Sign-up, Email verification, Password reset
    │   ├── customer/             # Customer portal (Book, My Trips, Live Track, Profile)
    │   ├── driver/               # Driver cockpit (Assignments, Status, Earnings, Profile)
    │   ├── dispatcher/           # Dispatcher command center (Radar, Queue, Drivers, Customers)
    │   └── admin/                # Admin executive dashboard (Fleet, Users, Services CMS, Settings)
    ├── components/
    │   ├── auth/RouteGuard.tsx   # Role-based route guard for protected views
    │   ├── layout/               # Navbar, Footer, PageShell, ThemeToggle
    │   └── map/                  # BookingMap.tsx, LiveMap.tsx
    ├── context/
    │   ├── AppContext.tsx        # Central business state, RBAC, CRUD, and mock/Supabase sync
    │   └── ThemeContext.tsx      # Dark/light mode theme management
    ├── lib/
    │   ├── fare-calculator.ts    # Formula-based pricing per vehicle type and distance/time
    │   ├── geo.ts                # Curated Saudi landmarks, Haversine formula, travel time estimator
    │   ├── mock-data.ts          # Seed data for demo users, vehicles, drivers, services, bookings
    │   ├── utils.ts              # cn() utility, reference generator, formatters
    │   ├── maps/location-service.ts # Resilient geocoding, autocomplete, GPS watch, route engine
    │   └── supabase/client.ts    # Supabase client initialization
    └── types/
        └── index.ts              # Core TypeScript interfaces & enums across the entire app
```

---

## State Management Architecture

### `AppContext.tsx` — The Single Source of Truth

The application uses React Context (`AppContext`) to provide centralized state, business operations, and persistence across all roles.

#### Core State Containers:
1. **Authentication & Identity**:
   - `userRole`: `'admin' | 'dispatcher' | 'driver' | 'customer'`
   - `currentUser`: `Profile` object containing user details, role, status, verification flags.
   - `isAuthenticated`: Boolean tracking session state.
   - `verificationState`: Transient state for customer email signup & confirmation cooldowns.
   - `switchRole(role)`: Instantly switches active role and loads respective demo profile (for testing and demos).
   - `signIn`, `signUpCustomer`, `signOut`: Auth handlers connected to Supabase Auth with demo fallbacks.

2. **Core Domain Collections**:
   - `bookings`: Array of `Booking` entities with full lifecycle statuses.
   - `drivers`: Fleet of `Driver` profiles with locations, statuses, vehicle assignments, and earnings.
   - `vehicles`: Fleet inventory with plate numbers, seating capacity, insurance and inspection dates.
   - `services`: Published Umrah, airport, and intercity service packages (editable by admin).
   - `usersList`: Staff and customer directory.
   - `emergencyContacts`: Emergency contact directory for customers.
   - `savedPlaces` & `recentLocations`: Fast-fill pickup/drop-off destinations for customers.
   - `settings`: System-wide currency (`SAR`), tax rate (`15%`), support phone, WhatsApp, and headquarters address.
   - `notifications`: Multi-role notification center with unread badges.

3. **Hybrid Remote / Mock Persistence**:
   - On initialization (`useEffect`), `AppContext` attempts to fetch remote rows from Supabase tables: `services`, `profiles`, `emergency_contacts`, `system_settings`, `vehicles`, `saved_places`, `recent_locations`.
   - If Supabase tables are unavailable, empty, or unmigrated, it seamlessly falls back to pre-seeded local records in `src/lib/mock-data.ts`.
   - Operations perform optimistic local state updates while dispatching Supabase mutations in the background wrapped in try/catch blocks. This ensures the application never crashes due to backend network blips or missing tables.

4. **Realtime Driver Subscriptions**:
   - `AppContext` listens to `supabase.channel('public:driver_locations')` for postgres `UPDATE` and `INSERT` events, updating driver coordinates in real time.

---

## Route Protection (`RouteGuard.tsx`)

Protected portal sections use `src/components/auth/RouteGuard.tsx`:
```tsx
<RouteGuard allowedRoles={['admin']}>
  {children}
</RouteGuard>
```
If an unauthenticated user attempts to visit, they are redirected to `/auth/sign-in?redirect=...`.
If an authenticated user lacks the required role, they are gracefully routed to their own portal (e.g. customer -> `/customer`, driver -> `/driver`, dispatcher -> `/dispatcher`).
