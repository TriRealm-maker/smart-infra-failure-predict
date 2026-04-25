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

  try {
    const places = await fetchFromOverpass(latitude, longitude, radius, types);
    placesCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, places });
    
    console.log(`Total places found: ${places.length}`);
    return places;
  } catch (error) {
    console.error('Error fetching places:', error);
    return [];
  }
}
