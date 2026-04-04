import { useState, useEffect } from 'react'
import {
  Activity, Send, RotateCcw, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Zap, Info, Loader2, MapPin, DollarSign
} from 'lucide-react'
import RiskZonesPreviewMap from '../components/RiskZonesPreviewMap'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const SEVERITY_BG = { low: 'bg-emerald-500/10 border-emerald-500/30', medium: 'bg-amber-500/10 border-amber-500/30', high: 'bg-rose-500/10 border-rose-500/30' }
const SEVERITY_TEXT = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-rose-400' }
const SITUATION_COLORS = {
  NORMAL: '#10b981', TRAFFIC_STOP: '#6366f1', SPEED_BREAKER: '#f59e0b',
  CONFLICT: '#f43f5e', ESCALATING: '#9f1239', ARGUMENT_ONLY: '#fb923c', MUSIC_OR_CALL: '#8b5cf6',
}
const FORECAST_BG = { ahead: 'bg-emerald-500/10 border-emerald-500/30', on_track: 'bg-indigo-500/10 border-indigo-500/30', at_risk: 'bg-rose-500/10 border-rose-500/30' }
const FORECAST_TEXT = { ahead: 'text-emerald-400', on_track: 'text-indigo-400', at_risk: 'text-rose-400' }

export default function Predict() {
  const [mode, setMode] = useState('stress')
  const [featureDefs, setFeatureDefs] = useState([])
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingFeatures, setLoadingFeatures] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [collapsedGroups, setCollapsedGroups] = useState({})

  // Load feature definitions when mode changes
  useEffect(() => {
    setLoadingFeatures(true)
    setResult(null)
    setError(null)
    fetch(`/api/features/${mode}`)
      .then(r => r.json())
      .then(data => {
        setFeatureDefs(data.features)
        const defaults = {}
        data.features.forEach(f => { defaults[f.name] = f.default })
        setValues(defaults)
        setCollapsedGroups({})
      })
      .catch(e => setError('Failed to load feature definitions'))
      .finally(() => setLoadingFeatures(false))
  }, [mode])

  const handleChange = (name, rawVal) => {
    setValues(prev => ({ ...prev, [name]: rawVal === '' ? '' : Number(rawVal) }))
  }

  const handleReset = () => {
    const defaults = {}
    featureDefs.forEach(f => { defaults[f.name] = f.default })
    setValues(defaults)
    setResult(null)
    setError(null)
  }

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = {}
      featureDefs.forEach(f => {
        payload[f.name] = values[f.name] === '' ? 0 : Number(values[f.name])
      })
      const res = await fetch(`/api/predict/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `Error ${res.status}`)
      }
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (group) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  // Group features
  const groups = {}
  featureDefs.forEach(f => {
    if (!groups[f.group]) groups[f.group] = []
    groups[f.group].push(f)
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Safety Prediction</h1>
        <p className="text-[15px] text-slate-400 mt-1">
          Detect stress situations and analyze driver behavior from sensor data
        </p>
      </div>

      {/* High-risk zones — demo map (illustrative overlays, not live incident data) */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 shadow-2xl backdrop-blur-xl">
        <div className="p-6 pb-4 border-b border-rose-500/10">
          <h3 className="font-bold text-rose-400 mb-1 flex items-center gap-2"><MapPin className="w-5 h-5"/> High-risk route awareness (demo)</h3>
          <p className="text-[13px] text-rose-200/70 leading-relaxed">
            Illustrative zones around Bangalore — a future product could flag historically accident-prone segments before you drive them. Overlays below are demo data only.
          </p>
        </div>
        <RiskZonesPreviewMap />
      </div>

      {/* Mode toggle - Stress only */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('stress')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold transition-all duration-300 ${
            mode === 'stress'
              ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-500'
              : 'bg-slate-800/40 text-slate-400 border border-white/5 hover:bg-slate-700/50 hover:text-white'
          }`}
        >
          <Activity size={18} /> Stress Detection
        </button>
      </div>

      {loadingFeatures ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-slate-400 font-medium">Loading features…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input form — left 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-slate-800/50">
                <h2 className="text-[15px] font-bold text-white tracking-wide">
                  Input Features ({featureDefs.length})
                </h2>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>

              <div className="divide-y divide-white/5">
                {Object.entries(groups).map(([groupName, fields]) => (
                  <div key={groupName}>
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(groupName)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-slate-950/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-[12px] font-bold uppercase tracking-wider text-slate-300">
                        {groupName} ({fields.length})
                      </span>
                      {collapsedGroups[groupName]
                        ? <ChevronDown size={16} className="text-slate-500" />
                        : <ChevronUp size={16} className="text-slate-500" />
                      }
                    </button>

                    {/* Fields */}
                    {!collapsedGroups[groupName] && (
                      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                        {fields.map(f => (
                          <div key={f.name}>
                            <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">
                              {f.label}
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={values[f.name] ?? ''}
                              onChange={e => handleChange(f.name, e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950/50 text-[14px] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600"
                              placeholder={String(f.default)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="px-6 py-5 border-t border-white/10 flex items-center gap-4 bg-slate-950/50">
                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[14px] font-bold hover:from-indigo-400 hover:to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {loading ? 'Predicting…' : 'Run Prediction'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl border border-white/10 text-[14px] font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Clear Fields
                </button>
              </div>
            </div>

            {/* Hint box */}
            <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 shadow-inner">
              <Info size={18} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-[13px] text-indigo-200/80 leading-relaxed">
                These are 30-second window features from accelerometer, gyroscope, and microphone sensors. Defaults represent a calm driving scenario.
              </p>
            </div>
          </div>

          {/* Result panel — right 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl px-5 py-4 flex items-start gap-3 shadow-inner">
                <AlertTriangle size={18} className="text-rose-400 mt-0.5 flex-shrink-0" />
                <p className="text-[14px] font-medium text-rose-300">{error}</p>
              </div>
            )}

            {!result && !error && (
              <div className="bg-slate-900/40 rounded-3xl border border-white/5 shadow-inner p-10 text-center backdrop-blur-sm h-full flex flex-col justify-center min-h-[300px]">
                <div className="w-16 h-16 mx-auto bg-slate-800/80 border border-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Zap size={28} className="text-slate-500" />
                </div>
                <p className="text-[15px] text-slate-300 font-bold mb-1">
                  Ready for prediction
                </p>
                <p className="text-[13px] text-slate-500">
                  Fill in values and hit "Run Prediction" to see analysis
                </p>
              </div>
            )}

            {result && <StressResult result={result} />}
          </div>
        </div>
      )}
    </div>
  )
}


/* ─── Stress result card ────────────────────────────────── */
function StressResult({ result }) {
  const sev = result.severity || 'low'
  const conf = result.confidence || 0
  const confPct = (conf * 100).toFixed(1)

  // Build probability chart data
  const probaData = result.all_probabilities
    ? Object.entries(result.all_probabilities).map(([name, val]) => ({
        name: name.replace(/_/g, ' '),
        value: +(val * 100).toFixed(1),
        fill: SITUATION_COLORS[name] || '#999',
      }))
    : []

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Main result */}
      <div className={`rounded-3xl border ${SEVERITY_BG[sev]} p-6 shadow-xl backdrop-blur-md`}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-black/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/5">
            {result.emoji}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {result.situation_name?.replace(/_/g, ' ')}
            </h3>
            <p className={`text-[12px] font-bold tracking-wider uppercase mt-1 ${SEVERITY_TEXT[sev]}`}>
              {sev} Severity
            </p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-5 bg-black/20 rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">
            <span>Model Confidence</span>
            <span className="text-white">{confPct}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                conf >= 0.85 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : conf >= 0.65 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
              }`}
              style={{ width: `${confPct}%` }}
            />
          </div>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-2 mt-5">
          {result.should_notify && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold tracking-wider uppercase shadow-sm">
              🔔 Notify
            </span>
          )}
          {result.is_safety_critical && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold tracking-wider uppercase shadow-sm animate-pulse">
              🚨 Critical
            </span>
          )}
          {!result.should_notify && !result.is_safety_critical && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wider uppercase shadow-sm">
              <CheckCircle size={14} /> Clear
            </span>
          )}
        </div>
      </div>

      {/* Top features */}
      {result.top_features?.length > 0 && (
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl p-6">
          <h4 className="text-[12px] font-bold tracking-wider uppercase text-slate-300 mb-4 border-b border-white/5 pb-2">Key Drivers</h4>
          <div className="space-y-3">
            {result.top_features.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-950/30 px-4 py-3 rounded-xl border border-white/5 transition-colors hover:border-slate-700">
                <span className="text-[13px] text-slate-300 font-mono tracking-tight">{f.feature}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 bg-black/40 px-2 py-1 rounded border border-white/5">z={f.z_score}</span>
                  <span className="text-[14px] font-bold text-white">{f.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Probability distribution */}
      {probaData.length > 0 && (
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl p-6">
          <h4 className="text-[12px] font-bold tracking-wider uppercase text-slate-300 mb-4 border-b border-white/5 pb-2">Class Distribution</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={probaData} layout="vertical" margin={{ left: -15, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={10} fill="#64748b" />
              <YAxis type="category" dataKey="name" width={110} fontSize={10} fill="#cbd5e1" tick={{ fill: '#cbd5e1' }} />
              <Tooltip 
                formatter={v => `${v}%`} 
                contentStyle={{ fontSize: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', backdropFilter: 'blur(8px)' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
                {probaData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}


/* ─── Earnings result card ──────────────────────────────── */
function EarningsResult({ result }) {
  if (result.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-sm text-red-700">{result.error}</p>
      </div>
    )
  }

  const vel = result.predicted_velocity
  const forecast = result.forecast_status || 'on_track'
  const fBg = FORECAST_BG[forecast] || FORECAST_BG.on_track
  const fText = FORECAST_TEXT[forecast] || FORECAST_TEXT.on_track

  return (
    <div className="space-y-4">
      {/* Main result */}
      <div className={`rounded-xl border-2 ${fBg} p-5`}>
        <div className="flex items-center gap-3 mb-2">
          <DollarSign size={28} className={fText} />
          <div>
            <h3 className="text-lg font-bold text-white">
              ₹{vel?.toFixed(2)}<span className="text-sm font-normal text-slate-400">/hr</span>
            </h3>
            <p className={`text-sm font-semibold ${fText}`}>
              {forecast.replace(/_/g, ' ').toUpperCase()}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {result.target_velocity != null && (
            <Stat label="Target Velocity" value={`₹${result.target_velocity}/hr`} />
          )}
          {result.current_velocity != null && (
            <Stat label="Current Velocity" value={`₹${result.current_velocity}/hr`} />
          )}
          {result.remaining_earnings != null && (
            <Stat label="Remaining" value={`₹${result.remaining_earnings}`} />
          )}
          {result.hours_to_target != null && (
            <Stat label="Hours to Target" value={result.hours_to_target.toFixed(1)} />
          )}
        </div>
      </div>

      {/* Velocity comparison */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl p-6">
        <h4 className="text-[12px] font-bold tracking-wider uppercase text-slate-300 mb-4 border-b border-white/5 pb-2">Velocity Comparison</h4>
        <div className="space-y-4">
          <VelBar label="Current" value={result.current_velocity || 0} max={Math.max(vel || 0, result.target_velocity || 0, result.current_velocity || 0) * 1.2} color="#6366f1" />
          <VelBar label="Predicted" value={vel || 0} max={Math.max(vel || 0, result.target_velocity || 0, result.current_velocity || 0) * 1.2} color="#10b981" />
          {result.target_velocity != null && (
            <VelBar label="Target" value={result.target_velocity} max={Math.max(vel || 0, result.target_velocity || 0, result.current_velocity || 0) * 1.2} color="#f43f5e" />
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-black/20 rounded-xl px-4 py-3 border border-white/5 shadow-inner">
      <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-1">{label}</p>
      <p className="text-[15px] font-bold text-slate-200">{value}</p>
    </div>
  )
}

function VelBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-[11px] font-bold tracking-wider uppercase mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200">₹{value.toFixed(0)}/hr</span>
      </div>
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}80` }} />
      </div>
    </div>
  )
}
