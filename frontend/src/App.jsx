import React, { useState } from 'react';
import * as api from './api';

export default function App() {
  const [page, setPage] = useState('home'); // home, register, login, dashboard
  const [driver, setDriver] = useState(null);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🚗 DrivePulse</h1>
        <p style={styles.subtitle}>Stress Detection & Earnings Forecasting</p>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        <button
          onClick={() => setPage('home')}
          style={{
            ...styles.navBtn,
            background: page === 'home' ? '#000' : '#fff',
            color: page === 'home' ? '#fff' : '#000',
          }}
        >
          Home
        </button>
        {!driver && (
          <>
            <button
              onClick={() => setPage('register')}
              style={{
                ...styles.navBtn,
                background: page === 'register' ? '#000' : '#fff',
                color: page === 'register' ? '#fff' : '#000',
              }}
            >
              Register
            </button>
            <button
              onClick={() => setPage('login')}
              style={{
                ...styles.navBtn,
                background: page === 'login' ? '#000' : '#fff',
                color: page === 'login' ? '#fff' : '#000',
              }}
            >
              Login
            </button>
          </>
        )}
        {driver && (
          <button
            onClick={() => {
              setPage('dashboard');
            }}
            style={{
              ...styles.navBtn,
              background: page === 'dashboard' ? '#000' : '#fff',
              color: page === 'dashboard' ? '#fff' : '#000',
            }}
          >
            Dashboard
          </button>
        )}
        {driver && (
          <button
            onClick={() => setDriver(null)}
            style={styles.logoutBtn}
          >
            Logout ({driver.driver_id})
          </button>
        )}
      </nav>

      {/* Pages */}
      <main style={styles.main}>
        {page === 'home' && <HomePage />}
        {page === 'register' && <RegisterPage onSuccess={(d) => { setDriver(d); setPage('dashboard'); }} />}
        {page === 'login' && <LoginPage onSuccess={(d) => { setDriver(d); setPage('dashboard'); }} />}
        {page === 'dashboard' && driver && <DashboardPage driver={driver} setDriver={setDriver} />}
      </main>
    </div>
  );
}

function HomePage() {
  return (
    <div style={styles.card}>
      <h2>Welcome to DrivePulse</h2>
      <p>Track your driving stress and earnings in real-time.</p>
      <ul style={{ textAlign: 'left', display: 'inline-block' }}>
        <li>🚨 Detect stress situations</li>
        <li>💰 Forecast earnings velocity</li>
        <li>📊 Track your daily progress</li>
      </ul>
    </div>
  );
}

function RegisterPage({ onSuccess }) {
  const [form, setForm] = useState({
    driver_id: '',
    name: '',
    phone: '',
    daily_goal: 1200,
  });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createUser(
        form.driver_id,
        form.name,
        form.phone,
        form.daily_goal
      );
      setMsg('✓ Registered! Logging in...');
      setTimeout(() => onSuccess(res.data), 500);
    } catch (err) {
      setMsg(`✗ Error: ${err.response?.data?.detail || 'Registration failed'}`);
    }
  };

  return (
    <div style={styles.card}>
      <h2>Register as Driver</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Driver ID"
          value={form.driver_id}
          onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
          style={styles.input}
          required
        />
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={styles.input}
          required
        />
        <input
          type="tel"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          style={styles.input}
          required
        />
        <input
          type="number"
          placeholder="Daily Goal (₹)"
          value={form.daily_goal}
          onChange={(e) => setForm({ ...form, daily_goal: parseFloat(e.target.value) })}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>Register</button>
      </form>
      {msg && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{msg}</p>}
    </div>
  );
}

function LoginPage({ onSuccess }) {
  const [driver_id, setDriverId] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.getUser(driver_id);
      setMsg('✓ Logged in!');
      setTimeout(() => onSuccess(res.data), 500);
    } catch (err) {
      setMsg(`✗ Error: ${err.response?.data?.detail || 'Driver not found'}`);
    }
  };

  return (
    <div style={styles.card}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Driver ID"
          value={driver_id}
          onChange={(e) => setDriverId(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>
      {msg && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{msg}</p>}
    </div>
  );
}

function DashboardPage({ driver, setDriver }) {
  const [tab, setTab] = useState('stress'); // stress, earnings, trips
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load trips
  React.useEffect(() => {
    (async () => {
      try {
        const res = await api.getTrips(driver.driver_id);
        setTrips(res.data);
      } catch (err) {
        console.error('Failed to load trips', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [driver, refreshKey]);

  const reloadTrips = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div style={styles.card}>
      <h2>Dashboard: {driver.name}</h2>
      <p>Daily Goal: ₹{driver.daily_goal}</p>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setTab('stress')}
          style={{
            ...styles.tabBtn,
            borderBottom: tab === 'stress' ? '2px solid #000' : 'none',
          }}
        >
          Stress Detection
        </button>
        <button
          onClick={() => setTab('earnings')}
          style={{
            ...styles.tabBtn,
            borderBottom: tab === 'earnings' ? '2px solid #000' : 'none',
          }}
        >
          Earnings Forecast
        </button>
        <button
          onClick={() => setTab('trips')}
          style={{
            ...styles.tabBtn,
            borderBottom: tab === 'trips' ? '2px solid #000' : 'none',
          }}
        >
          Trip History
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'stress' && <StressTab driverId={driver.driver_id} onPrediction={reloadTrips} />}
      {tab === 'earnings' && <EarningsTab driverId={driver.driver_id} dailyGoal={driver.daily_goal} onPrediction={reloadTrips} />}
      {tab === 'trips' && <TripsTab trips={trips} loading={loading} />}
    </div>
  );
}

function StressTab({ driverId, onPrediction }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sensors, setSensors] = useState({
    motion_max: 1.5,
    motion_mean: 0.8,
    motion_p95: 2.5,
    motion_std: 0.5,
    brake_intensity: 1.0,
    lateral_max: 0.7,
    z_dev_max: 0.4,
    speed_mean: 35.0,
    speed_at_brake: 30.0,
    speed_drop: 5.0,
    spikes_above3: 5,
    spikes_above5: 1,
    audio_db_max: 85.0,
    audio_db_mean: 70.0,
    audio_db_p90: 80.0,
    audio_db_std: 5.0,
    audio_class_max: 2,
    audio_class_mean: 1.5,
    sustained_max: 5,
    sustained_sum: 10,
    cadence_var_mean: 8.0,
    cadence_var_max: 12.0,
    argument_frac: 0.3,
    loud_frac: 0.4,
    audio_leads_motion: -2.0,
    audio_onset_sec: 10.0,
    brake_t_sec: 15.0,
    is_low_speed: 0,
    both_elevated: 0,
    audio_only: 0,
  });

  const handleSensorChange = (key, value) => {
    setSensors({ ...sensors, [key]: parseFloat(value) || value });
  };

  const handlePredictStress = async () => {
    setLoading(true);
    try {
      const res = await api.predictStress(sensors);
      setResult(res.data);
      onPrediction();
    } catch (err) {
      alert('Prediction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.tabContent}>
      <h3>Stress Detection - Enter Sensor Data</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
        {Object.keys(sensors).map((key) => (
          <div key={key}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{key}</label>
            <input
              type="number"
              value={sensors[key]}
              onChange={(e) => handleSensorChange(key, e.target.value)}
              style={{ ...styles.input, width: '100%' }}
              step="0.1"
            />
          </div>
        ))}
      </div>

      <button onClick={handlePredictStress} style={styles.button} disabled={loading}>
        {loading ? 'Predicting...' : '🔮 Predict Stress'}
      </button>

      {result && (
        <div style={styles.result}>
          <p><strong>Situation:</strong> {result.emoji} {result.situation_name}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</p>
          <p><strong>Should Notify:</strong> {result.should_notify ? '✓ Yes' : '✗ No'}</p>
          <p><strong>Inference Time:</strong> {result.inference_ms}ms</p>
          <button 
            onClick={() => saveStressTrip(result)}
            style={{ ...styles.button, marginTop: '10px' }}
          >
            💾 Save to Trip History
          </button>
        </div>
      )}
    </div>
  );
}

function EarningsTab({ driverId, dailyGoal, onPrediction }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    elapsed_hours: 3.5,
    current_velocity: 180.0,
    velocity_delta: 12.5,
    trips_completed: 7,
    trip_rate: 2.0,
    hour_of_day: 14,
    is_morning_rush: 0,
    is_lunch_rush: 1,
    velocity_last_1: 175.0,
    velocity_last_2: 168.0,
    velocity_last_3: 155.0,
    rolling_velocity_3: 172.5,
    rolling_velocity_5: 169.8,
    goal_pressure: 30.0,
  });

  const handleStateChange = (key, value) => {
    setState({ ...state, [key]: parseFloat(value) || value });
  };

  const handlePredictEarnings = async () => {
    setLoading(true);
    try {
      const res = await api.predictEarnings(state, driverId);
      setResult(res.data);
      onPrediction();
    } catch (err) {
      alert('Prediction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.tabContent}>
      <h3>Earnings Forecast - Enter Driver State</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left', maxWidth: '600px', margin: '20px auto' }}>
        {Object.keys(state).map((key) => (
          <div key={key}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>{key}</label>
            <input
              type="number"
              value={state[key]}
              onChange={(e) => handleStateChange(key, e.target.value)}
              style={{ ...styles.input, width: '100%' }}
              step="0.1"
            />
          </div>
        ))}
      </div>

      <button onClick={handlePredictEarnings} style={styles.button} disabled={loading}>
        {loading ? 'Predicting...' : '🔮 Forecast Earnings'}
      </button>

      {result && (
        <div style={styles.result}>
          <p><strong>Predicted Velocity:</strong> ₹{result.predicted_velocity}/hr</p>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Hours to Goal:</strong> {result.estimated_hours_to_goal} hrs</p>
          <p><strong>Goal Probability:</strong> {result.goal_probability}%</p>
        </div>
      )}
    </div>
  );
}

function TripsTab({ trips, loading }) {
  return (
    <div style={styles.tabContent}>
      <h3>Trip History</h3>
      {loading ? (
        <p>Loading trips...</p>
      ) : trips.length === 0 ? (
        <p>No trips yet.</p>
      ) : (
        <ul style={{ textAlign: 'left', display: 'inline-block' }}>
          {trips.map((trip) => (
            <li key={trip.id}>
              <strong>{trip.trip_date}</strong> | {trip.trips_completed} trips | ₹{trip.earnings} | {trip.elapsed_hours}h
              {trip.stress_situation && ` | Stress: ${trip.stress_situation}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    backgroundColor: '#000',
    color: '#fff',
    padding: '30px',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 5px 0',
    fontSize: '32px',
  },
  subtitle: {
    margin: '0',
    fontSize: '14px',
    opacity: 0.8,
  },
  nav: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #ccc',
    padding: '10px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  navBtn: {
    padding: '10px 20px',
    border: '1px solid #000',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  logoutBtn: {
    padding: '10px 20px',
    border: '1px solid #ccc',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '12px',
  },
  main: {
    padding: '30px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    padding: '30px',
    borderRadius: '4px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '20px',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  },
  button: {
    padding: '12px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  tabs: {
    display: 'flex',
    gap: '0',
    borderBottom: '2px solid #ccc',
    marginTop: '20px',
  },
  tabBtn: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: '20px 0',
    textAlign: 'center',
  },
  result: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    marginTop: '20px',
    borderRadius: '4px',
    textAlign: 'left',
    display: 'inline-block',
  },
};
