---
name: al-harmain-travels
description: "Expert guide, architectural manual, and development standard for the Al Harmain Travels codebase. Covers the full-stack VIP Umrah, Hajj & City transportation platform built with Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Google Maps & Leaflet hybrid engine, Supabase (Auth, PostgreSQL, Realtime, Storage), and multi-role portals (Customer, Driver, Dispatcher, Admin). Trigger this skill whenever working on, modifying, debugging, refactoring, or extending Al Harmain Travels features, including booking workflows, dispatch logic, fare calculation, map and GPS navigation, Supabase integrations, authentication and RBAC, state management, or UI components."
---

# Al Harmain Travels — Project Skill Guide

This skill provides an authoritative manual for navigating, understanding, and developing within the **Al Harmain Travels** codebase without breaking existing functionality.

---

## 1. Quick Repository Map

```
Al Harmain Travels/
├── .env.local                    # Environment keys: Supabase URL, Anon Key, Google Maps Key
├── package.json                  # Next.js 15, React 19, Supabase, Leaflet, Sonner, Tailwind
├── tailwind.config.ts            # Emerald (`brand-*`), Gold (`gold-*`), semantic tokens & fonts
├── tsconfig.json                 # Path aliases (@/* -> ./src/*)
└── src/
    ├── app/                      # App router: Marketing, Auth, Customer, Driver, Dispatcher, Admin
    ├── components/
    │   ├── auth/RouteGuard.tsx   # Client-side RBAC guard
    │   ├── layout/               # Navbar, Footer, PageShell, ThemeToggle
    │   └── map/                  # BookingMap.tsx, LiveMap.tsx
    ├── context/
    │   ├── AppContext.tsx        # Central domain store (bookings, drivers, vehicles, auth, CMS)
    │   └── ThemeContext.tsx      # Dark / light mode state
    ├── lib/
    │   ├── fare-calculator.ts    # Deterministic rate engine per vehicle type
    │   ├── geo.ts                # Curated Saudi landmarks, Haversine, highway travel times
    │   ├── mock-data.ts          # Resilient seed data for demo profiles and initial records
    │   ├── utils.ts              # cn() utility, reference generator, formatters
    │   ├── maps/location-service.ts # 3-tier geocoding, autocomplete, GPS watch, route engine
    │   └── supabase/client.ts    # Supabase browser client
    └── types/
        └── index.ts              # Unified domain types and interfaces
```

---

## 2. Core Architecture & Tech Stack

1. **Framework & Runtime**:
   - **Next.js 15.1.7** with App Router.
   - **React 19** (`react`, `react-dom`).
   - **TypeScript 5.7.3** with strict typing.
2. **Design & Styling**:
   - **Tailwind CSS 3.4.17** with dark mode as default (`html.dark`).
   - **Dual Typography**: `Cormorant_Garamond` (marketing display serif) and `Plus_Jakarta_Sans` (UI sans).
   - Semantic CSS tokens: `--bg-page`, `--bg-card`, `--bg-elevated`, `--text-primary`, `--border-base`.
3. **Database & Services**:
   - **Supabase**: PostgreSQL database, Auth (email confirmations & sessions), Realtime (`driver_locations` table subscriptions), and Storage (`avatars` bucket).
4. **Mapping & Routing (Hybrid Architecture)**:
   - Tier 1: Google Maps JS API (Places Autocomplete, Directions, Geocoding).
   - Tier 2: OpenStreetMap Nominatim (Search & Reverse Geocode) + OSRM (Driving directions).
   - Tier 3: Curated holy landmarks in Makkah, Madinah, and Jeddah with Haversine distance calculations.
   - Visual Map: Google Maps with custom dark luxury styling, with Leaflet dynamic fallback.

---

## 3. Four Role Portals (RBAC)

Access is guarded by `src/components/auth/RouteGuard.tsx`:

| Role | Portal Path | Key Features & Responsibilities |
| :--- | :--- | :--- |
| **Customer** | `/customer/*` | Interactive ride booking, trip history (`/bookings`), live vehicle radar (`/track`), saved places, emergency contacts, profile edit. |
| **Driver** | `/driver/*` | Driver cockpit, online/offline status switch, trip acceptance & execution, extra charges (tolls, parking), cash collection tracking, earnings overview (`/earnings`). |
| **Dispatcher** | `/dispatcher/*` | Fleet radar with live vehicle markers, trip queue (`/queue`), manual telephone booking intake (`/new-booking`), driver assignment & auto-dispatch, customer directory. |
| **Admin** | `/admin/*` | Executive KPI dashboard, fleet vehicle inventory (`/fleet`), staff & driver onboarding (`/users`), Umrah/Airport service package CMS (`/services`), financial reports (`/reports`), audit logs, system settings (`/settings`). |

---

## 4. Booking Lifecycle & Business Logic

### Status Sequence
`pending` ➔ `confirmed` (dispatcher) ➔ `driver_assigned` ➔ `driver_accepted` (driver) ➔ `driver_arriving` ➔ `driver_arrived` ➔ `trip_started` ➔ `trip_completed` ➔ `payment_completed` (or `payment_pending`).

### Guard Rules
- Cancelled or rejected bookings **cannot** be confirmed, assigned, or restarted.
- Once a trip is `trip_started` or `trip_completed`, cancellation is disallowed.
- Completed trips cannot be reverted to `trip_started`.

### Pricing Calculation (`src/lib/fare-calculator.ts`)
$$\text{Raw Subtotal} = \text{Base Fare} + (\text{Distance Km} \times \text{Per Km Rate}) + (\text{Duration Min} \times \text{Per Min Rate})$$
$$\text{Total Fare} = \max(\text{Raw Subtotal}, \text{Minimum Fare})$$

Rates vary by vehicle type:
- `sedan`: Base 25 SAR, 3.50 SAR/km, Min 35 SAR
- `suv`: Base 45 SAR, 5.00 SAR/km, Min 60 SAR
- `vip_gmc`: Base 90 SAR, 8.50 SAR/km, Min 120 SAR
- `van`: Base 70 SAR, 7.00 SAR/km, Min 95 SAR
- `bus`: Base 150 SAR, 12.00 SAR/km, Min 200 SAR

---

## 5. Coding & Development Standards

When extending or modifying Al Harmain Travels, adhere to these fundamental principles:

1. **Preserve Resilient Fallbacks**:
   - Never write code that assumes Supabase or Google Maps will respond without error.
   - Always wrap API calls in `try/catch` blocks. If an endpoint or table is unmigrated, fall back to local state and `src/lib/mock-data.ts`.
2. **Centralize Types**:
   - All domain models must reside in `src/types/index.ts`. Never create divergent or duplicate interfaces in local component files.
3. **Use Client Directives Accurately**:
   - Add `'use client'` to components consuming React hooks, Context, or browser globals (`window`, `navigator`, `localStorage`, `leaflet`).
4. **Dynamic Imports for Map Libraries**:
   - Leaflet references browser DOM nodes on module evaluation. Always dynamically import Leaflet or client map components with `{ ssr: false }`.
5. **Stick to Design Tokens**:
   - Use semantic color classes (`bg-page`, `bg-card`, `bg-elevated`, `text-primary`, `border-base`) rather than hardcoded hex codes.
   - For brand accents, use `brand-*` (emerald) and `gold-*` (warm gold).
6. **Unified Notifications**:
   - Pair transient alerts with `toast.*` from `sonner`.
   - Record durable business events into `AppContext.addNotification(...)` so users can review notifications in the Navbar drawer.

---

## 6. Progressive Disclosure References

For deep dive details on specific subsystems, consult the modular documentation in `references/`:

- **[Architecture & State](references/architecture_and_state.md)**: `AppContext` state layout, remote/local sync, notifications, and demo profiles.
- **[Booking & Dispatch Lifecycle](references/booking_and_dispatch_lifecycle.md)**: Full state machine diagrams, dispatch flows, fare formulas, and additional charge handling.
- **[Maps & Geolocation](references/maps_and_geolocation.md)**: Hardware GPS multi-reading filter (`watchPosition`), reverse geocoding fallback tier, OSRM/Google routing, and custom dark vector map styles.
- **[Database & APIs](references/database_and_apis.md)**: Supabase PostgreSQL schema, RLS guidelines, real-time channel subscriptions, and auth lifecycle.
- **[UI/UX & Design System](references/ui_ux_and_design_system.md)**: Light/dark mode tokens, typography scale, responsive page shells, status badge designs, and WCAG accessibility standards.
- **[Development Workflow](references/development_workflow.md)**: Scripts, testing workflows, environment setup, and feature extension best practices.
