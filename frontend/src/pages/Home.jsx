import { useState, useEffect } from 'react'
import { Mail, Lock, User, Phone, MapPin, Truck, Users, LogIn, UserPlus } from 'lucide-react'

export default function Home({ onLoginSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [demoUsers, setDemoUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    city: '',
    vehicle_type: 'Sedan',
    vehicle_number: '',
    shift_preference: 'morning',
    avg_hours_per_day: 7.0,
    avg_earnings_per_hour: 180,
    experience_months: 0,
  })

  // Load demo users
  useEffect(() => {
    fetch('/api/auth/users')
      .then(r => r.json())
      .then(users => setDemoUsers(users))
      .catch(() => {})
      .finally(() => setLoadingUsers(false))
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Login failed')
      }
      const user = await res.json()
      localStorage.setItem('user', JSON.stringify(user))
      onLoginSuccess(user)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Registration failed')
      }
      const user = await res.json()
      // Auto-login after registration
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password,
        }),
      })
      const fullUser = await loginRes.json()
      localStorage.setItem('user', JSON.stringify(fullUser))
      onLoginSuccess(fullUser)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = (username) => {
    setLoginForm({ username, password: '' })
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-uber-blue via-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-uber-black mb-2">DrivePulse</h1>
          <p className="text-lg text-uber-gray-600">Smart Stress Detection & Earnings Tracking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Demo users */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-uber-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-uber-blue" />
              <h2 className="text-xl font-bold text-uber-black">Demo Users</h2>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-uber-blue border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {demoUsers.map(user => (
                  <button
                    key={user.username}
                    onClick={() => demoLogin(user.username)}
                    className="w-full p-4 border-2 border-uber-gray-200 rounded-lg hover:border-uber-blue hover:bg-blue-50 transition-all text-left group"
                  >
                    <p className="font-semibold text-uber-black group-hover:text-uber-blue">{user.name}</p>
                    <p className="text-sm text-uber-gray-600">@{user.username}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-uber-gray-500">
                      <span>{user.city}</span>
                      <span className="flex items-center gap-1">
                        ⭐ {user.rating}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-uber-blue border-opacity-30">
              <p className="text-xs text-uber-blue font-medium">💡 Tip</p>
              <p className="text-sm text-uber-blue mt-1">
                Click on any demo user above, then click Continue to login.
                <br />
                <span className="text-xs">Default password: <code className="bg-white px-1 rounded">password123</code></span>
              </p>
            </div>
          </div>

          {/* Right side - Login/Register form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-uber-gray-100">
            {/* Mode toggle */}
            <div className="flex gap-2 mb-6 bg-uber-gray-100 p-1 rounded-lg">
              {[
                { key: 'login', label: 'Login', icon: LogIn },
                { key: 'register', label: 'Register', icon: UserPlus },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setError(null) }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium transition-colors ${
                    mode === key
                      ? 'bg-white text-uber-black shadow-sm'
                      : 'text-uber-gray-600 hover:text-uber-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-uber-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    className="w-full px-4 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition"
                    placeholder="e.g., alex.kumar"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-uber-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-4 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-uber-blue text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Logging in...' : 'Continue to Dashboard'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-uber-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                      className="w-full px-3 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition text-sm"
                      placeholder="username"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-uber-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      className="w-full px-3 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-uber-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition text-sm"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-uber-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition text-sm"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-uber-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition text-sm"
                      placeholder="+91 XXXXXXXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-uber-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={registerForm.city}
                      onChange={(e) => setRegisterForm({...registerForm, city: e.target.value})}
                      className="w-full px-3 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition text-sm"
                      placeholder="Mumbai"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-uber-gray-700 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={registerForm.vehicle_type}
                      onChange={(e) => setRegisterForm({...registerForm, vehicle_type: e.target.value})}
                      className="w-full px-3 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition text-sm"
                    >
                      <option>Sedan</option>
                      <option>SUV</option>
                      <option>Hatchback</option>
                      <option>Pickup</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-uber-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={registerForm.vehicle_number}
                    onChange={(e) => setRegisterForm({...registerForm, vehicle_number: e.target.value})}
                    className="w-full px-3 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition text-sm"
                    placeholder="MH01AB1234"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-uber-gray-700 mb-1">
                      Shift Preference
                    </label>
                    <select
                      value={registerForm.shift_preference}
                      onChange={(e) => setRegisterForm({...registerForm, shift_preference: e.target.value})}
                      className="w-full px-3 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition text-sm"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="full_day">Full Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-uber-gray-700 mb-1">
                      Exp. (months)
                    </label>
                    <input
                      type="number"
                      value={registerForm.experience_months}
                      onChange={(e) => setRegisterForm({...registerForm, experience_months: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-uber-gray-200 rounded-lg focus:border-uber-blue focus:outline-none transition text-sm"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-uber-green text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors mt-4"
                >
                  {loading ? 'Registering...' : 'Create Account & Login'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-uber-gray-600">
          <p>Your stress detection and earnings companion 🚗✨</p>
        </div>
      </div>
    </div>
  )
}
