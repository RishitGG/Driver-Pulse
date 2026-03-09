const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export const api = {
  // Authentication
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  listUsers: () => request('/auth/users'),

  // Dashboard
  getDashboard: () => request('/dashboard'),
  getProfile: () => request('/profile'),

  // Trips
  getTrips: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const q = qs.toString();
    return request(`/trips${q ? '?' + q : ''}`);
  },
  getTrip: (id) => request(`/trips/${id}`),
  getSampleTrip: () => request('/sample-trip'),
  createTrip: (payload) =>
    request('/trips', { method: 'POST', body: JSON.stringify(payload) }),
  importTripsCsv: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${BASE}/trips/import-csv`, { method: 'POST', body: formData })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Import failed (${res.status})`)
    }
    return res.json()
  },

  // Events
  getTripEvents: (tripId) => request(`/trips/${tripId}/events`),
  postFeedback: (eventId, label, comment = null) =>
    request(`/events/${eventId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ label, comment }),
    }),

  // Goals
  getGoals: () => request('/goals'),
  setGoal: (daily_target) =>
    request('/goals', { method: 'POST', body: JSON.stringify({ daily_target }) }),

  // Metrics
  getMetrics: (range = '7d') => request(`/metrics?range=${range}`),

  // Tips
  getTips: () => request('/tips'),
};
