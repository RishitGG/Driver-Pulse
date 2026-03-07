import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Users
export const createUser = (driver_id, name, phone, daily_goal) =>
  api.post('/users', { driver_id, name, phone, daily_goal });

export const getUser = (driver_id) =>
  api.get(`/users/${driver_id}`);

// Trips
export const createTrip = (driver_id, trip_date, elapsed_hours, earnings, trips_completed) =>
  api.post(`/trips/${driver_id}`, { trip_date, elapsed_hours, earnings, trips_completed });

export const getTrips = (driver_id) =>
  api.get(`/trips/${driver_id}`);

// Predictions
export const predictStress = (sensors) =>
  api.post('/predict/stress', sensors);

export const predictEarnings = (state, driver_id) =>
  api.post(`/predict/earnings?driver_id=${driver_id}`, state);

export default api;
