import { useState, useEffect } from 'react'
import { Mail, Lock, User, Phone, MapPin, Truck, Users, LogIn, UserPlus, Activity } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
             <Activity className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
             <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">DriveIntel</h1>
          </div>
          <p className="text-lg font-medium text-slate-300">Driver Safety & Behavior Analytics Platform</p>
          <p className="text-[15px] text-slate-500 mt-2 tracking-wide">Enterprise-grade detection models operating on the edge.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Demo users */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Demo Accounts</h2>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {demoUsers.map(user => (
                  <button
                    key={user.username}
                    onClick={() => demoLogin(user.username)}
                    className="w-full p-4 border border-white/10 bg-slate-800/40 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-left group shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 duration-300"
                  >
                    <p className="font-bold text-[16px] text-slate-200 group-hover:text-indigo-300 transition-colors">{user.name}</p>
                    <p className="text-[14px] text-slate-400 mt-0.5">@{user.username}</p>
                    <div className="flex items-center gap-4 mt-3 text-[13px] font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{user.city}</span>
                      <span className="flex items-center gap-1.5 text-amber-400/80">
                        ⭐ {user.rating}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8 p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <p className="text-[13px] text-indigo-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">💡 Quick Tip</p>
              <p className="text-[14px] text-indigo-200/80 leading-relaxed">
                Click on any demo user above to auto-fill credentials, then click Continue.
                <br />
                <span className="text-[13px] opacity-70 mt-2 block">Default password: <code className="bg-slate-900 px-1.5 py-0.5 rounded border border-white/10 font-mono text-indigo-300">password123</code></span>
              </p>
            </div>
          </div>

          {/* Right side - Login/Register form */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/5 flex flex-col justify-center">
            {/* Mode toggle */}
            <div className="flex gap-2 mb-8 bg-slate-950/50 p-1.5 rounded-xl border border-white/5 shadow-inner">
              {[
                { key: 'login', label: 'Login', icon: LogIn },
                { key: 'register', label: 'Create Account', icon: UserPlus },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setError(null) }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-[14px] transition-all duration-300 ${
                    mode === key
                      ? 'bg-slate-800 text-white shadow-lg border border-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[14px] font-medium text-rose-400 shadow-inner">
                {error}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-300 uppercase tracking-widest mb-2">
                    <User className="w-4 h-4 inline mr-1.5 opacity-70" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g., alex.kumar"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-300 uppercase tracking-widest mb-2">
                    <Lock className="w-4 h-4 inline mr-1.5 opacity-70" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {loading ? 'Authenticating...' : 'Secure Login'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm text-white placeholder-slate-600"
                      placeholder="username"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm text-white placeholder-slate-600"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm text-white placeholder-slate-600"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm text-white placeholder-slate-600"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm text-white placeholder-slate-600"
                      placeholder="+91 XXXXXXXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={registerForm.city}
                      onChange={(e) => setRegisterForm({...registerForm, city: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm text-white placeholder-slate-600"
                      placeholder="Mumbai"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={registerForm.vehicle_type}
                      onChange={(e) => setRegisterForm({...registerForm, vehicle_type: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm text-white text-slate-200"
                    >
                      <option>Sedan</option>
                      <option>SUV</option>
                      <option>Hatchback</option>
                      <option>Pickup</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={registerForm.vehicle_number}
                    onChange={(e) => setRegisterForm({...registerForm, vehicle_number: e.target.value})}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm text-white placeholder-slate-600"
                    placeholder="MH01AB1234"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      Shift Preference
                    </label>
                    <select
                      value={registerForm.shift_preference}
                      onChange={(e) => setRegisterForm({...registerForm, shift_preference: e.target.value})}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm text-white text-slate-200"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="full_day">Full Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                      Exp. (months)
                    </label>
                    <input
                      type="number"
                      value={registerForm.experience_months}
                      onChange={(e) => setRegisterForm({...registerForm, experience_months: parseInt(e.target.value)})}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-sm text-white placeholder-slate-600"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {loading ? 'Registering...' : 'Complete & Launch'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-[14px] font-medium text-slate-500 tracking-wide">
          <p>Next-Gen Edge Intelligence ⚡</p>
        </div>
      </div>
    </div>
  )
}
