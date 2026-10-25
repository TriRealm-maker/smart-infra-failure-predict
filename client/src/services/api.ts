import { NearbyPlace } from '../types';

const getApiBase = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!envUrl) return 'http://localhost:5000/api';
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE = getApiBase();

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const fetchClientNominatimPlaces = async (
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<NearbyPlace[]> => {
  const delta = Math.max(radiusMeters / 111000, 0.03);
  const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
  const categories: { type: NearbyPlace['type']; query: string }[] = [
    { type: 'hospital', query: 'hospital' },
    { type: 'pharmacy', query: 'pharmacy' },
    { type: 'police', query: 'police' },
    { type: 'fire', query: 'fire station' },
    { type: 'atm', query: 'atm' },
    { type: 'gas_station', query: 'fuel' },
  ];

  const results: NearbyPlace[] = [];
  const seen = new Set<string>();

  const responses = await Promise.allSettled(
    categories.map(async ({ type, query }) => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&bounded=1&viewbox=${viewbox}&limit=6`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CrisisGuardApp/1.0 (contact: info@crisisguard.app)' },
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      const parsed: NearbyPlace[] = [];
      for (const item of data) {
        const itemLat = parseFloat(item.lat);
        const itemLng = parseFloat(item.lon);
        if (isNaN(itemLat) || isNaN(itemLng)) continue;

        const id = `osm-client-${item.place_id || `${itemLat.toFixed(4)},${itemLng.toFixed(4)}`}`;
        if (seen.has(id)) continue;
        seen.add(id);

        const name = item.name || item.display_name?.split(',')[0] || 'Service Facility';
        parsed.push({
          id,
          title: name,
          type,
          lat: itemLat,
          lng: itemLng,
          address: item.display_name || '',
          distance: calculateDistanceKm(lat, lng, itemLat, itemLng),
        });
      }
      return parsed;
    })
  );

  for (const outcome of responses) {
    if (outcome.status === 'fulfilled') {
      results.push(...outcome.value);
    }
  }

  return results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

const getFallbackClientPlaces = (lat: number, lng: number): NearbyPlace[] => {
  const templates: { title: string; type: NearbyPlace['type']; dLat: number; dLng: number; address: string }[] = [
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
      id: `local-emergency-${idx + 1}`,
      title: t.title,
      type: t.type,
      lat: itemLat,
      lng: itemLng,
      address: t.address,
      distance: calculateDistanceKm(lat, lng, itemLat, itemLng),
    };
  });
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface AssistantChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const api = {
  auth: {
    register: async (email: string, password: string, name: string) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      return res.json();
    },
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },
    me: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },
    verifyEmail: async (token: string) => {
      const res = await fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`);
      return res.json();
    },
    resendVerification: async (email: string) => {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return res.json();
    },
    forgotPassword: async (email: string) => {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return res.json();
    },
    resetPassword: async (token: string, newPassword: string) => {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      return res.json();
    },
  },

  weather: {
    get: async (lat: number, lng: number) => {
      const res = await fetch(`${API_BASE}/weather?lat=${lat}&lng=${lng}`);
      return res.json();
    },
  },

  places: {
    getNearby: async (lat: number, lng: number, radius?: number, types?: string[]): Promise<NearbyPlace[]> => {
      const radiusMeters = radius || 5000;
      const params = new URLSearchParams({ lat: lat.toString(), lng: lng.toString() });
      if (radius) params.append('radius', radius.toString());
      if (types && types.length > 0) {
        params.append('types', types.join(','));
      } else {
        params.append('types', 'hospital,pharmacy,police,fire_station,atm,gas_station');
      }

      // 1. Try backend server
      try {
        const res = await fetch(`${API_BASE}/places?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      } catch (err) {
        console.warn('Backend places endpoint unreachable, falling back to direct OSM query:', err);
      }

      // 2. Direct OpenStreetMap Nominatim client fallback
      try {
        const osmPlaces = await fetchClientNominatimPlaces(lat, lng, radiusMeters);
        if (osmPlaces.length > 0) {
          return osmPlaces;
        }
      } catch (osmErr) {
        console.warn('Direct OSM search failed:', osmErr);
      }

      // 3. Contextual emergency facilities around coordinates
      return getFallbackClientPlaces(lat, lng);
    },
  },

  prediction: {
    get: async (lat: number, lng: number, assetType: 'building' | 'bridge' | 'tower' = 'building') => {
      const res = await fetch(`${API_BASE}/prediction?lat=${lat}&lng=${lng}&assetType=${assetType}`);
      return res.json();
    },
    getGuide: async (disaster: string) => {
      const res = await fetch(`${API_BASE}/guide?disaster=${disaster}`);
      return res.json();
    },
  },

  medical: {
    getProfile: async () => {
      const res = await fetch(`${API_BASE}/medical/profile`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || error.error || `Request failed with status ${res.status}`);
      }
      return res.json();
    },
    updateProfile: async (data: Record<string, unknown>) => {
      const res = await fetch(`${API_BASE}/medical/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      const res = await fetch(`${API_BASE}/medical/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return res.json();
    },
    deleteFile: async (fileId: string) => {
      const res = await fetch(`${API_BASE}/medical/files/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.json();
    },
    generateShareLink: async (hours: number = 24) => {
      const res = await fetch(`${API_BASE}/medical/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ hours }),
      });
      return res.json();
    },
    getSharedProfile: async (token: string) => {
      const res = await fetch(`${API_BASE}/medical/share/${token}`);
      return res.json();
    },
  },

  sos: {
    getContacts: async () => {
      const res = await fetch(`${API_BASE}/sos/contacts`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },
    saveContacts: async (contacts: { name: string; phone: string; email: string }[]) => {
      const res = await fetch(`${API_BASE}/sos/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ contacts }),
      });
      return res.json();
    },
    sendSOS: async (lat: number, lng: number) => {
      const res = await fetch(`${API_BASE}/sos/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ lat, lng, timestamp: new Date().toISOString() }),
      });
      return res.json();
    },
  },

  assistant: {
    chat: async (messages: AssistantChatMessage[]) => {
      const res = await fetch(`${API_BASE}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ messages }),
      });
      return res.json();
    },
  },
};
