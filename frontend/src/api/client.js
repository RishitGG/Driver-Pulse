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
