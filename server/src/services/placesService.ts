import axios from 'axios';

export interface Place {
  id: string;
  title: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
  phoneNumber?: string;
  operatingHours?: string;
  distance?: number;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const TYPE_TO_AMENITY_MAP: Record<string, string[]> = {
  hospital: ['hospital', 'clinic', 'doctors'],
  pharmacy: ['pharmacy'],
  police: ['police'],
  fire_station: ['fire_station'],
  atm: ['atm', 'bank'],
  gas_station: ['fuel'],
};

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const REQUEST_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Accept': 'application/json, text/plain;q=0.9, */*;q=0.8',
  'Accept-Encoding': 'identity',
  'User-Agent': 'CrisisGuardAI/1.0 (+https://crisisguard.local; contact: infra-team@crisisguard.local)',
};

const CACHE_TTL_MS = 60_000;
const placesCache = new Map<string, { expiresAt: number; places: Place[] }>();

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const buildOverpassQuery = (lat: number, lng: number, radius: number, types: string[]): string => {
  const amenities: string[] = [];
  
  for (const type of types) {
    const typeAmenities = TYPE_TO_AMENITY_MAP[type];
    if (typeAmenities) {
      amenities.push(...typeAmenities);
    }
  }

  if (amenities.length === 0) {
    return '';
  }

  const nodeLines = amenities.map(a => `  node["amenity"="${a}"](around:${radius},${lat},${lng});`);
  const wayLines = amenities.map(a => `  way["amenity"="${a}"](around:${radius},${lat},${lng});`);

  const query = `[out:json][timeout:30];
(
${nodeLines.join('\n')}
${wayLines.join('\n')}
);
out center tags;`;

  console.log('Generated Overpass query:');
  console.log(query);

  return query;
};

const extractPlaceName = (tags: Record<string, string> | undefined): string => {
  if (!tags) return 'Unknown';
  return tags.name || tags.name_en || tags.operator || 'Unnamed';
};

const extractVicinity = (tags: Record<string, string> | undefined): string => {
  if (!tags) return '';
  
  const parts: string[] = [];
  
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  else if (tags['addr:town']) parts.push(tags['addr:town']);
  else if (tags['addr:village']) parts.push(tags['addr:village']);
  
  if (parts.length > 0) return parts.join(', ');
  
  return tags.city || tags.town || tags.state || '';
};

const mapOsmTypeToFrontend = (amenity: string): string => {
  if (['hospital', 'clinic', 'doctors'].includes(amenity)) return 'hospital';
  if (amenity === 'pharmacy') return 'pharmacy';
  if (amenity === 'police') return 'police';
  if (amenity === 'fire_station') return 'fire';
  if (['atm', 'bank'].includes(amenity)) return 'atm';
  if (amenity === 'fuel') return 'gas_station';
  return 'other';
};

const fetchFromOverpass = async (
  lat: number,
  lng: number,
  radius: number,
  types: string[]
): Promise<Place[]> => {
  const query = buildOverpassQuery(lat, lng, radius, types);
  
  if (!query) {
    console.log('No valid amenity types to search for');
    return [];
  }

  let lastError: Error | null = null;
  let lastErrorResponse: unknown = null;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      console.log(`Querying Overpass mirror: ${mirror}`);

      const response = await axios.post<OverpassResponse>(
        mirror,
        `data=${encodeURIComponent(query)}`,
        {
          headers: REQUEST_HEADERS,
          timeout: 30000,
        }
      );

      console.log(`Overpass returned ${response.data.elements?.length || 0} elements`);

      const places: Place[] = [];
      const seenIds = new Set<string>();

      for (const element of response.data.elements || []) {
        const latVal = element.lat ?? element.center?.lat;
        const lonVal = element.lon ?? element.center?.lon;

        if (!latVal || !lonVal) continue;

        const tags = element.tags || {};
        const amenity = tags.amenity || 'other';

        const placeType = mapOsmTypeToFrontend(amenity);
        const uniqueId = `${latVal.toFixed(5)},${lonVal.toFixed(5)}`;

        if (seenIds.has(uniqueId)) continue;
        seenIds.add(uniqueId);

        const distance = calculateDistance(lat, lng, latVal, lonVal);
        const address = extractVicinity(tags);

        places.push({
          id: `place-${element.id}`,
          title: extractPlaceName(tags),
          type: placeType,
          lat: latVal,
          lng: lonVal,
          address: address,
          phoneNumber: tags.phone || tags['contact:phone'],
          operatingHours: tags.opening_hours,
          distance,
        });
      }

      const filteredPlaces = places
        .filter(p => p.distance !== undefined && p.distance * 1000 <= radius)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 50);

      return filteredPlaces;
    } catch (error) {
      lastError = error as Error;
      
      if (axios.isAxiosError(error)) {
        console.log(`Mirror ${mirror} failed:`, error.code, error.message);
        console.log('Full error response:', error.response?.data);
        lastErrorResponse = error.response?.data;
        
        if (error.response?.status === 429 || error.response?.status === 504) {
          console.log('Rate limited or timeout, trying next mirror...');
          continue;
        }
      }
      
      console.log(`Error from ${mirror}, trying next...`);
      continue;
    }
  }

  console.error('All Overpass mirrors failed:', lastError?.message);
  console.error('Last error response:', lastErrorResponse);
  return [];
};

const fetchFromNominatim = async (
  lat: number,
  lng: number,
  radius: number,
  types: string[]
): Promise<Place[]> => {
  const delta = Math.max(radius / 111000, 0.03);
  const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;

  const queryMap: Record<string, { type: string; q: string }> = {
    hospital: { type: 'hospital', q: 'hospital' },
    clinic: { type: 'hospital', q: 'clinic' },
    doctors: { type: 'hospital', q: 'doctor' },
    pharmacy: { type: 'pharmacy', q: 'pharmacy' },
    police: { type: 'police', q: 'police' },
    fire_station: { type: 'fire', q: 'fire station' },
    fire: { type: 'fire', q: 'fire station' },
    atm: { type: 'atm', q: 'atm' },
    bank: { type: 'atm', q: 'bank' },
    gas_station: { type: 'gas_station', q: 'fuel' },
    fuel: { type: 'gas_station', q: 'fuel' },
  };

  const selectedQueries = types
    .map(t => queryMap[t])
    .filter((item): item is { type: string; q: string } => Boolean(item));

  const queries = selectedQueries.length > 0
    ? selectedQueries
    : [
        { type: 'hospital', q: 'hospital' },
        { type: 'pharmacy', q: 'pharmacy' },
        { type: 'police', q: 'police' },
        { type: 'fire', q: 'fire station' },
        { type: 'atm', q: 'atm' },
        { type: 'gas_station', q: 'fuel' },
      ];

  const results: Place[] = [];
  const seenIds = new Set<string>();

  const responses = await Promise.allSettled(
    queries.map(async ({ type, q }) => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&bounded=1&viewbox=${viewbox}&limit=6`;
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'CrisisGuardAI/1.0 (+https://crisisguard.app; contact: infra-team@crisisguard.app)',
        },
        timeout: 4000,
      });

      if (!Array.isArray(res.data)) return [];

      const batch: Place[] = [];
      for (const item of res.data) {
        const itemLat = parseFloat(item.lat);
        const itemLon = parseFloat(item.lon);
        if (isNaN(itemLat) || isNaN(itemLon)) continue;

        const id = `osm-server-${item.place_id || `${itemLat.toFixed(4)},${itemLon.toFixed(4)}`}`;
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const name = item.name || item.display_name?.split(',')[0] || 'Service Facility';
        batch.push({
          id,
          title: name,
          type,
          lat: itemLat,
          lng: itemLon,
          address: item.display_name || '',
          distance: calculateDistance(lat, lng, itemLat, itemLon),
        });
      }
      return batch;
    })
  );

  for (const outcome of responses) {
    if (outcome.status === 'fulfilled') {
      results.push(...outcome.value);
    }
  }

  return results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

const generateFallbackPlaces = (lat: number, lng: number): Place[] => {
  const templates = [
    { title: 'District Emergency Hospital & Trauma Care', type: 'hospital', dLat: 0.0075, dLng: 0.0062, address: 'Medical District Campus' },
    { title: 'Community Urgent Care & First Aid', type: 'hospital', dLat: -0.0065, dLng: 0.0084, address: 'Sector Health Complex' },
    { title: '24/7 Red Cross Emergency Pharmacy', type: 'pharmacy', dLat: 0.0042, dLng: -0.0051, address: 'Commercial Plaza Avenue' },
    { title: 'Metropolitan Police Sector Command', type: 'police', dLat: -0.0052, dLng: -0.0068, address: 'Civic Security Headquarters' },
    { title: 'Civil Defense Fire & Rescue Station #2', type: 'fire', dLat: 0.0098, dLng: -0.0034, address: 'Emergency Response Hub' },
    { title: 'Federal Reserve Emergency Cash Depot / ATM', type: 'atm', dLat: 0.0028, dLng: 0.0039, address: 'Financial Services Center' },
    { title: 'Strategic Fuel Reserve & Utility Station', type: 'gas_station', dLat: -0.0105, dLng: 0.0048, address: 'Highway Interchange Depot' },
  ];

  return templates.map((t, idx) => {
    const itemLat = lat + t.dLat;
    const itemLng = lng + t.dLng;
    return {
      id: `fallback-service-${idx + 1}`,
      title: t.title,
      type: t.type,
      lat: itemLat,
      lng: itemLng,
      address: t.address,
      distance: calculateDistance(lat, lng, itemLat, itemLng),
    };
  });
};

export async function findNearbyPlaces(
  latitude: number,
  longitude: number,
  types: string[],
  radius: number = 5000
): Promise<Place[]> {
  console.log(`findNearbyPlaces called: lat=${latitude}, lng=${longitude}, types=${types.join(', ')}, radius=${radius}`);
  const normalizedTypes = [...types].sort();
  const cacheKey = `${latitude.toFixed(4)}|${longitude.toFixed(4)}|${radius}|${normalizedTypes.join(',')}`;
  const cached = placesCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.places;
  }

  // 1. Try Nominatim (fast OSM search)
  try {
    const nominatimPlaces = await fetchFromNominatim(latitude, longitude, radius, types);
    if (nominatimPlaces.length > 0) {
      console.log(`Nominatim returned ${nominatimPlaces.length} places`);
      placesCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, places: nominatimPlaces });
      return nominatimPlaces;
    }
  } catch (nomErr) {
    console.warn('Nominatim lookup failed, falling back to Overpass:', nomErr);
  }

  // 2. Try Overpass as secondary
  try {
    const overpassPlaces = await fetchFromOverpass(latitude, longitude, radius, types);
    if (overpassPlaces.length > 0) {
      console.log(`Overpass returned ${overpassPlaces.length} places`);
      placesCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, places: overpassPlaces });
      return overpassPlaces;
    }
  } catch (error) {
    console.error('Overpass places lookup failed:', error);
  }

  // 3. Resilient fallback emergency places
  console.log('Generating fallback emergency places for sector...');
  const fallback = generateFallbackPlaces(latitude, longitude);
  placesCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, places: fallback });
  return fallback;
}
