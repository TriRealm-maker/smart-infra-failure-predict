const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : 'http://localhost:5000/api';


const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
    getNearby: async (lat: number, lng: number, radius?: number, types?: string[]) => {
      const params = new URLSearchParams({ lat: lat.toString(), lng: lng.toString() });
      if (radius) params.append('radius', radius.toString());
      if (types && types.length > 0) {
        params.append('types', types.join(','));
      } else {
        params.append('types', 'hospital,pharmacy,police,fire_station,atm,gas_station');
      }
      const res = await fetch(`${API_BASE}/places?${params}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || 'Failed to fetch places');
      }
      return res.json();
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
};
