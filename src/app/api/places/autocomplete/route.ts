import { NextRequest, NextResponse } from 'next/server';

export interface PlaceSuggestion {
  placeId: string;
  title: string;
  subtitle: string;
  address: string;
  latitude: number;
  longitude: number;
  category: 'airport' | 'holy_site' | 'hotel' | 'hotel_hub' | 'station' | 'city' | 'general';
}

// In-memory cache for fast repeated queries
const cache = new Map<string, { data: PlaceSuggestion[]; timestamp: number }>();
const detailCache = new Map<string, any>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function detectCategory(text: string): PlaceSuggestion['category'] {
  const lower = text.toLowerCase();
  if (
    lower.includes('airport') ||
    lower.includes('مطار') ||
    lower.includes('terminal') ||
    lower.includes('jed') ||
    lower.includes('med')
  ) {
    return 'airport';
  }
  if (
    lower.includes('haram') ||
    lower.includes('kaaba') ||
    lower.includes('mosque') ||
    lower.includes('masjid') ||
    lower.includes('nabawi') ||
    lower.includes('arafat') ||
    lower.includes('mina') ||
    lower.includes('muzdalifah') ||
    lower.includes('rawdah')
  ) {
    return 'holy_site';
  }
  if (
    lower.includes('hotel') ||
    lower.includes('residence') ||
    lower.includes('hilton') ||
    lower.includes('pullman') ||
    lower.includes('swissotel') ||
    lower.includes('marriott') ||
    lower.includes('hyatt') ||
    lower.includes('intercontinental') ||
    lower.includes('fairmont') ||
    lower.includes('clock tower') ||
    lower.includes('فندق')
  ) {
    return 'hotel';
  }
  if (
    lower.includes('station') ||
    lower.includes('train') ||
    lower.includes('haramain') ||
    lower.includes('railway') ||
    lower.includes('محطة')
  ) {
    return 'station';
  }
  if (
    lower.includes('makkah') ||
    lower.includes('mecca') ||
    lower.includes('madinah') ||
    lower.includes('medina') ||
    lower.includes('jeddah') ||
    lower.includes('riyadh') ||
    lower.includes('taif') ||
    lower.includes('peshawar') ||
    lower.includes('islamabad')
  ) {
    return 'city';
  }
  return 'general';
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') || '').trim();
  const latStr = request.nextUrl.searchParams.get('lat');
  const lngStr = request.nextUrl.searchParams.get('lng');
  const userLat = latStr ? parseFloat(latStr) : null;
  const userLng = lngStr ? parseFloat(lngStr) : null;

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const biasSuffix = userLat && userLng && !isNaN(userLat) && !isNaN(userLng)
    ? `_${userLat.toFixed(2)}_${userLng.toFixed(2)}`
    : '';
  const cacheKey = `${query.toLowerCase()}${biasSuffix}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ suggestions: cached.data });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ suggestions: [], error: 'API key not configured' });
  }

  try {
    const hasUserBias = userLat != null && userLng != null && !isNaN(userLat) && !isNaN(userLng);
    const locationBias = hasUserBias
      ? {
          circle: {
            center: { latitude: userLat, longitude: userLng },
            radius: 45000.0, // Google Places API enforces max 50000m
          },
        }
      : undefined;

    // 1. First attempt: Places API (New) Text Search (Single fast HTTP call with exact coordinates & addresses)
    const textSearchController = new AbortController();
    const textSearchTimeout = setTimeout(() => textSearchController.abort(), 4000);

    const textSearchBody: any = {
      textQuery: query,
      pageSize: 8,
      languageCode: 'en',
    };
    if (locationBias) {
      textSearchBody.locationBias = locationBias;
    }

    const textSearchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
      },
      body: JSON.stringify(textSearchBody),
      signal: textSearchController.signal,
    }).catch(() => null);
    clearTimeout(textSearchTimeout);

    if (textSearchRes && textSearchRes.ok) {
      const textData = await textSearchRes.json();
      const rawPlaces = textData.places || [];

      if (rawPlaces.length > 0) {
        const directResults: PlaceSuggestion[] = rawPlaces
          .filter((p: any) => p.location?.latitude && p.location?.longitude)
          .map((p: any) => {
            const mainTitle = p.displayName?.text || query;
            const fullAddress = p.formattedAddress || mainTitle;
            const parts = fullAddress.split(', ');
            const subtitle = parts.slice(1, 4).join(', ') || fullAddress;

            return {
              placeId: p.id,
              title: mainTitle,
              subtitle,
              address: fullAddress,
              latitude: p.location.latitude,
              longitude: p.location.longitude,
              category: detectCategory(`${mainTitle} ${fullAddress}`),
            };
          });

        if (directResults.length >= 1) {
          cache.set(cacheKey, { data: directResults, timestamp: Date.now() });
          return NextResponse.json({ suggestions: directResults });
        }
      }
    }

    // 2. Fallback / Supplement: Places API (New) Autocomplete for partial words
    const autocompleteController = new AbortController();
    const autocompleteTimeout = setTimeout(() => autocompleteController.abort(), 3000);

    const autocompleteBody: any = {
      input: query,
      languageCode: 'en',
    };
    if (locationBias) {
      autocompleteBody.locationBias = locationBias;
    }

    const autocompleteRes = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(autocompleteBody),
        signal: autocompleteController.signal,
      }
    ).catch(() => null);
    clearTimeout(autocompleteTimeout);

    if (!autocompleteRes || !autocompleteRes.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const autocompleteData = await autocompleteRes.json();
    const rawSuggestions = autocompleteData.suggestions || [];

    if (rawSuggestions.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // 3. Fetch coordinates & details for top 5 predictions in parallel with strict timeout
    const detailPromises = rawSuggestions.slice(0, 5).map(async (s: any) => {
      const p = s.placePrediction;
      if (!p || !p.placeId) return null;

      if (detailCache.has(p.placeId)) {
        return detailCache.get(p.placeId);
      }

      try {
        const detailController = new AbortController();
        const detailTimeout = setTimeout(() => detailController.abort(), 2000);

        const detailsRes = await fetch(
          `https://places.googleapis.com/v1/places/${encodeURIComponent(p.placeId)}?fields=id,displayName,formattedAddress,location`,
          {
            headers: {
              'X-Goog-Api-Key': apiKey,
            },
            signal: detailController.signal,
          }
        );
        clearTimeout(detailTimeout);

        if (!detailsRes.ok) return null;
        const details = await detailsRes.json();

        if (!details.location?.latitude || !details.location?.longitude) return null;

        const mainTitle =
          p.structuredFormat?.mainText?.text ||
          details.displayName?.text ||
          p.text?.text ||
          query;
        const subtitle =
          p.structuredFormat?.secondaryText?.text || details.formattedAddress || '';
        const fullAddress = details.formattedAddress || p.text?.text || mainTitle;

        const suggestion: PlaceSuggestion = {
          placeId: details.id || p.placeId,
          title: mainTitle,
          subtitle,
          address: fullAddress,
          latitude: details.location.latitude,
          longitude: details.location.longitude,
          category: detectCategory(`${mainTitle} ${fullAddress}`),
        };

        detailCache.set(p.placeId, suggestion);
        return suggestion;
      } catch {
        return null;
      }
    });

    const results = (await Promise.all(detailPromises)).filter(
      Boolean
    ) as PlaceSuggestion[];

    cache.set(cacheKey, { data: results, timestamp: Date.now() });
    return NextResponse.json({ suggestions: results });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
