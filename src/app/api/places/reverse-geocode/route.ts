import { NextRequest, NextResponse } from 'next/server';

const reverseCache = new Map<string, { address: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function GET(request: NextRequest) {
  const latStr = request.nextUrl.searchParams.get('lat');
  const lngStr = request.nextUrl.searchParams.get('lng');

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'lat and lng parameters are required' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = reverseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ address: cached.address });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 1. Google Places API (New) searchNearby
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
        },
        body: JSON.stringify({
          maxResultCount: 2,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: 300.0,
            },
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const firstPlace = data.places?.[0];
        if (firstPlace?.formattedAddress) {
          const address = firstPlace.formattedAddress;
          reverseCache.set(cacheKey, { address, timestamp: Date.now() });
          return NextResponse.json({ address });
        }
      }
    } catch {
      // Fall through to Nominatim
    }
  }

  // 2. OpenStreetMap Nominatim Fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'AlHarmainTravels/1.0' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        const parts = data.display_name.split(', ');
        const concise = parts.slice(0, 4).join(', ');
        reverseCache.set(cacheKey, { address: concise, timestamp: Date.now() });
        return NextResponse.json({ address: concise });
      }
    }
  } catch {
    // Fall through
  }

  const fallback = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  return NextResponse.json({ address: fallback });
}
