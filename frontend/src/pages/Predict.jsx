import { useState, useEffect } from 'react'
import {
  Activity, Send, RotateCcw, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Zap, Info, Loader2,
} from 'lucide-react'
import RiskZonesPreviewMap from '../components/RiskZonesPreviewMap'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const SEVERITY_BG = { low: 'bg-green-50 border-green-200', medium: 'bg-yellow-50 border-yellow-200', high: 'bg-red-50 border-red-200' }
const SEVERITY_TEXT = { low: 'text-green-700', medium: 'text-yellow-700', high: 'text-red-700' }
const SITUATION_COLORS = {
  NORMAL: '#06C167', TRAFFIC_STOP: '#276EF1', SPEED_BREAKER: '#FFC043',
  CONFLICT: '#E11900', ESCALATING: '#A3000B', ARGUMENT_ONLY: '#FF6937', MUSIC_OR_CALL: '#7356BF',
}
const FORECAST_BG = { ahead: 'bg-green-50 border-green-200', on_track: 'bg-blue-50 border-blue-200', at_risk: 'bg-red-50 border-red-200' }
const FORECAST_TEXT = { ahead: 'text-green-700', on_track: 'text-blue-700', at_risk: 'text-red-700' }

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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-uber-gray-800">Safety Prediction</h1>
        <p className="text-sm text-uber-gray-500 mt-1">
          Detect stress situations and analyze driver behavior from sensor data
        </p>
      </div>

      {/* High-risk zones — demo map (illustrative overlays, not live incident data) */}
      <div className="mb-6 overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="p-4 pb-3">
          <h3 className="font-semibold text-orange-900 mb-1">High-risk route awareness (demo)</h3>
          <p className="text-sm text-orange-800/90">
            Illustrative zones around Bangalore — a future product could flag historically accident-prone segments before you drive them. Overlays below are demo data only.
          </p>
        </div>
        <RiskZonesPreviewMap />
      </div>

      {/* Mode toggle - Stress only */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('stress')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            mode === 'stress'
              ? 'bg-uber-black text-white shadow-lg'
              : 'bg-uber-gray-100 text-uber-gray-600 hover:bg-uber-gray-200'
          }`}
        >
          <Activity size={16} /> Stress Detection
        </button>
      </div>

      {loadingFeatures ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-uber-gray-400" />
          <span className="ml-2 text-uber-gray-500">Loading features…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input form — left 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-uber-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-uber-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-uber-gray-700">
                  Input Features ({featureDefs.length})
                </h2>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-uber-gray-500 hover:text-uber-gray-700 transition-colors"
                >
                  <RotateCcw size={12} /> Reset to defaults
                </button>
              </div>

              <div className="divide-y divide-uber-gray-50">
                {Object.entries(groups).map(([groupName, fields]) => (
                  <div key={groupName}>
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(groupName)}
                      className="w-full flex items-center justify-between px-5 py-3 bg-uber-gray-50 hover:bg-uber-gray-100 transition-colors"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-uber-gray-500">
                        {groupName} ({fields.length})
                      </span>
                      {collapsedGroups[groupName]
                        ? <ChevronDown size={14} className="text-uber-gray-400" />
                        : <ChevronUp size={14} className="text-uber-gray-400" />
                      }
                    </button>

                    {/* Fields */}
                    {!collapsedGroups[groupName] && (
                      <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {fields.map(f => (
                          <div key={f.name}>
                            <label className="block text-xs font-medium text-uber-gray-600 mb-1">
                              {f.label}
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={values[f.name] ?? ''}
                              onChange={e => handleChange(f.name, e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-uber-gray-200 text-sm text-uber-gray-800 focus:outline-none focus:ring-2 focus:ring-uber-blue focus:border-transparent transition-all"
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
              <div className="px-5 py-4 border-t border-uber-gray-100 flex items-center gap-3">
                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-uber-black text-white text-sm font-semibold hover:bg-uber-gray-800 disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {loading ? 'Predicting…' : 'Run Prediction'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-full border border-uber-gray-200 text-sm text-uber-gray-600 hover:bg-uber-gray-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Hint box */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                These are 30-second window features from accelerometer, gyroscope, and microphone sensors. Defaults represent a calm driving scenario.
              </p>
            </div>
          </div>

          {/* Result panel — right 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!result && !error && (
              <div className="bg-white rounded-xl border border-uber-gray-100 shadow-sm p-8 text-center">
                <Zap size={40} className="mx-auto text-uber-gray-300 mb-3" />
                <p className="text-sm text-uber-gray-500 font-medium">
                  Fill in values and hit "Run Prediction"
                </p>
                <p className="text-xs text-uber-gray-400 mt-1">
                  Results will appear here
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
    <div className="space-y-4">
      {/* Main result */}
      <div className={`rounded-xl border-2 ${SEVERITY_BG[sev]} p-5`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{result.emoji}</span>
          <div>
            <h3 className="text-lg font-bold text-uber-gray-800">
              {result.situation_name?.replace(/_/g, ' ')}
            </h3>
            <p className={`text-sm font-semibold ${SEVERITY_TEXT[sev]}`}>
              {sev.toUpperCase()} severity
            </p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-uber-gray-600 mb-1">
            <span>Confidence</span>
            <span className="font-bold">{confPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                conf >= 0.85 ? 'bg-green-500' : conf >= 0.65 ? 'bg-yellow-500' : 'bg-red-400'
              }`}
              style={{ width: `${confPct}%` }}
            />
          </div>
        </div>

        {/* Flags */}
        <div className="flex gap-2 mt-4">
          {result.should_notify && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
              🔔 Notify
            </span>
          )}
          {result.is_safety_critical && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
              🚨 Safety
            </span>
          )}
          {!result.should_notify && !result.is_safety_critical && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
              <CheckCircle size={12} /> No alerts
            </span>
          )}
        </div>
      </div>

      {/* Top features */}
      {result.top_features?.length > 0 && (
        <div className="bg-white rounded-xl border border-uber-gray-100 shadow-sm p-5">
          <h4 className="text-sm font-semibold text-uber-gray-700 mb-3">Top Contributing Features</h4>
          <div className="space-y-2">
            {result.top_features.map((f, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-uber-gray-700 font-mono">{f.feature}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-uber-gray-500">z={f.z_score}</span>
                  <span className="text-xs font-semibold text-uber-gray-700">{f.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Probability distribution */}
      {probaData.length > 0 && (
        <div className="bg-white rounded-xl border border-uber-gray-100 shadow-sm p-5">
          <h4 className="text-sm font-semibold text-uber-gray-700 mb-3">Class Probabilities</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={probaData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
              <YAxis type="category" dataKey="name" width={100} fontSize={11} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
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
            <h3 className="text-lg font-bold text-uber-gray-800">
              ₹{vel?.toFixed(2)}<span className="text-sm font-normal text-uber-gray-500">/hr</span>
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
      <div className="bg-white rounded-xl border border-uber-gray-100 shadow-sm p-5">
        <h4 className="text-sm font-semibold text-uber-gray-700 mb-3">Velocity Comparison</h4>
        <div className="space-y-3">
          <VelBar label="Current" value={result.current_velocity || 0} max={Math.max(vel || 0, result.target_velocity || 0, result.current_velocity || 0) * 1.2} color="#276EF1" />
          <VelBar label="Predicted" value={vel || 0} max={Math.max(vel || 0, result.target_velocity || 0, result.current_velocity || 0) * 1.2} color="#06C167" />
          {result.target_velocity != null && (
            <VelBar label="Target" value={result.target_velocity} max={Math.max(vel || 0, result.target_velocity || 0, result.current_velocity || 0) * 1.2} color="#E11900" />
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/60 rounded-lg px-3 py-2">
      <p className="text-xs text-uber-gray-500">{label}</p>
      <p className="text-sm font-bold text-uber-gray-800">{value}</p>
    </div>
  )
}

function VelBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-uber-gray-600">{label}</span>
        <span className="font-semibold text-uber-gray-800">₹{value.toFixed(0)}/hr</span>
      </div>
      <div className="w-full h-2 bg-uber-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
