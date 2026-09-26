# Maps & Geolocation Architecture

## Hybrid Mapping Strategy

The mapping system in Al Harmain Travels provides a resilient 3-tier architecture that guarantees map rendering, place searching, geocoding, and routing function seamlessly even if Google Maps API keys are invalid, restricted, rate-limited, or lack billing:

```
┌────────────────────────────────────────────────────────┐
│              Al Harmain Location Engine                │
│         (src/lib/maps/location-service.ts)             │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   Tier 1: Google    Tier 2: OSM       Tier 3: Offline
   Maps JS API       Nominatim/OSRM    Curated Landmarks
```

---

## 1. High-Precision GPS Geolocation (`getCurrentLocation`)

Located in `src/lib/maps/location-service.ts`:
Rather than calling `navigator.geolocation.getCurrentPosition` once (which frequently returns inaccurate cell-tower estimates or stale cached coordinates), Al Harmain Travels uses a continuous multi-reading hardware stabilization strategy:

1. **`watchPosition` with `maximumAge: 0`**: Forces hardware GPS fixes without cached readings.
2. **Dynamic Accuracy Radius Tracking**: Evaluates each fix's `coords.accuracy` (in meters).
3. **Accuracy Thresholds**:
   - `ACCURACY_INSTANT_OK = 30m`: If reading is within 30 meters, resolves immediately.
   - `MIN_WAIT_MS = 3000ms` & `ACCURACY_GOOD_ENOUGH = 80m`: If after 3 seconds the reading is within 80m, resolves.
   - `MAX_WAIT_MS = 12000ms`: After 12 seconds, resolves with the best fix collected so far.
   - **Fallback**: If hardware GPS fails or times out, falls back to low-accuracy network geolocation (`enableHighAccuracy: false`).

---

## 2. Reverse Geocoding (`reverseGeocode`)

Translates `(latitude, longitude)` into a human-readable address with caching in `geocodeCache`:
1. **Google Maps Geocoder**: Queries `google.maps.Geocoder` when ready.
2. **OpenStreetMap Nominatim**: Free HTTP fallback with 6s abort controller timeout (`https://nominatim.openstreetmap.org/reverse`).
3. **Curated Saudi Landmarks**: Computes Haversine distance to predefined holy sites, terminals, and stations in `SAUDI_LANDMARKS`. If within 2.0 km, labels it `"Near [Landmark Name], [City]"`.

---

## 3. Place Search & Autocomplete (`searchPlaces`)

1. **Instant Curated Landmark Matches**: Immediately filters `SAUDI_LANDMARKS` (Makkah Clock Tower, Haram Gates, Jeddah Airport T1 & North, Madinah Prophet's Mosque, Haramain Train Stations, etc.) for sub-millisecond suggestions.
2. **Google Places Autocomplete**: Queries `AutocompleteService` and hydrates place geometry via `PlacesService.getDetails`.
3. **OSM Nominatim Search**: Queries `https://nominatim.openstreetmap.org/search` with deduplication against curated landmarks.

---

## 4. Route Calculation & Polylines (`calculateRoute`)

Returns `RouteEstimate` (`distanceKm`, `durationMinutes`, `polylineCoords`, `source`):
1. **Google Directions Service**: Calls `google.maps.DirectionsService.route` for driving travel mode, extracting `overview_path` coordinates and leg statistics.
2. **OSRM (Open Source Routing Machine)**: Free routing engine via `https://router.project-osrm.org/route/v1/driving/`, converting GeoJSON `[lon, lat]` into Leaflet `[lat, lon]` polylines.
3. **Haversine Straight-line Fallback**: Uses `calculateDistanceKm(lat1, lon1, lat2, lon2)` with a 1.25 road curvature factor and `estimateDurationMinutes(dist)` with highway vs urban speed profiles (30 km/h urban, 60 km/h mixed, 90 km/h highway). Generates 10-step interpolated polyline coordinates.

---

## 5. Map Components

### `BookingMap.tsx`
- Used on `/customer/book` and booking modals.
- Supports interactive pin selection (`pickup`, `destination`).
- Custom dark luxury vector styling with emerald highways and gold accents.
- Embedded luxury pill showing live distance (`formatDistance`) and travel time (`formatDuration`).
- Automatic bounding box fitting (`fitBounds`) when both pickup and drop-off coordinates are set.

### `LiveMap.tsx`
- Used on `/dispatcher` (fleet radar) and `/customer/track` (live ride tracking).
- Dynamic Leaflet rendering with customizable markers (`pickup`, `destination`, `driver`, `station`).
- Renders driver heading and vehicle icons.
- Handles Leaflet cleanup and resize invalidation on mount.
