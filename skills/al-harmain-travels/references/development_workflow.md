# Development Workflow & Best Practices

## 1. Environment & Setup

### Prerequisites
- Node.js 18.18+ or 20+
- npm 9+ or 10+
- Modern browser with Geolocation support

### Environment Variables (`.env.local`)
The application requires the following environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-jwt-token>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
```
*Note: If Google Maps API is missing or lacks billing, the application automatically falls back to OpenStreetMap Nominatim for geocoding, OSRM for routing, and Leaflet for map display.*

---

## 2. Common NPM Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with Hot Module Reloading (HMR) at `http://localhost:3000` |
| `npm run build` | Compiles TypeScript and runs Next.js production build, checking type validity and generating static pages |
| `npm run start` | Runs the production build server |
| `npm run lint` | Runs ESLint across `src/` to identify potential syntax and style violations |

---

## 3. Best Practices for Modifying the Codebase

### Rule 1: Always Preserve Resilient Fallbacks
When interacting with Supabase or Google Maps, never write code that crashes if an API call fails.
- Wrap all network requests in `try/catch`.
- If an API or database query fails, fall back gracefully to local state or mock data in `src/lib/mock-data.ts`.
- Notify the user with a friendly `toast.error()` or `toast.warning()` rather than unhandled rejection.

### Rule 2: Keep Types Centralized
All shared domain types, enums, and API interfaces must live in `src/types/index.ts`. Do not define duplicate ad-hoc types across multiple page files.

### Rule 3: Use `'use client'` Deliberately
Next.js 15 uses React Server Components by default. Mark files with `'use client'` whenever they:
- Use React hooks (`useState`, `useEffect`, `useContext`, `useRef`).
- Access browser APIs (`window`, `document`, `navigator`, `localStorage`).
- Import Leaflet or map components requiring DOM attachments.

### Rule 4: Dynamic Imports for SSR-Incompatible Libraries
Leaflet relies on `window` and `document`. Always import it inside client components or via Next.js dynamic import:
```tsx
const BookingMap = dynamic(() => import('@/components/map/BookingMap'), { ssr: false });
```

### Rule 5: Respect Design Tokens
Avoid hardcoded arbitrary colors (e.g. `bg-[#121212]`). Use the semantic tokens defined in `tailwind.config.ts` and `globals.css`:
- `bg-page`, `bg-card`, `bg-elevated`, `bg-surface`, `bg-input`
- `text-primary`, `text-secondary`, `text-muted`
- `border-base`, `border-strong`, `border-subtle`
- `brand-*` (emerald) and `gold-*` (gold/amber)

### Rule 6: Respect Role Guards and Context Separation
- When creating new portal pages under `/customer`, `/driver`, `/dispatcher`, or `/admin`, always wrap the page content or layout in `<RouteGuard allowedRoles={[...]}>`.
- Expose new business logic through `AppContext.tsx` so all components and views remain synchronized.
