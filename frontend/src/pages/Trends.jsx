import { useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts'
import { TrendingDown, AlertTriangle, Car, Shield, Zap } from 'lucide-react'

export default function Trends() {
  const [range, setRange] = useState('7d')
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getMetrics(range)
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [range])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-uber-black border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!metrics) return null

  const { days, summary } = metrics

  const summaryCards = [
    { label: 'Avg Daily Trips', value: summary.avg_daily_trips, icon: Car, color: 'text-uber-blue' },
    { label: 'Avg Stress Score', value: summary.avg_stress?.toFixed(1), icon: AlertTriangle, color: 'text-uber-red' },
    { label: 'High Stress Events', value: summary.high_stress_events || 0, icon: Zap, color: 'text-uber-orange' },
    { label: 'Safety Score', value: `${Math.max(0, 100 - ((summary.avg_stress || 0) * 10))}%`, icon: Shield, color: 'text-uber-green' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header + range toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Driver Behavior Trends</h1>
          <p className="text-sm text-uber-gray-500 mt-1">Analyze your driving patterns over time</p>
        </div>
        <div className="flex bg-uber-gray-100 rounded-lg p-1">
          {[{ key: '7d', label: 'Week' }, { key: '30d', label: 'Month' }].map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                range === r.key
                  ? 'bg-white text-uber-black shadow-sm'
                  : 'text-uber-gray-500 hover:text-uber-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-uber-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Stress + Trips chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-uber-red" />
            Stress Level Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis dataKey={range === '7d' ? 'day' : 'date'} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="avg_stress" stroke="#E11900" strokeWidth={2} dot={{ r: 3 }} name="Avg Stress" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-4 flex items-center gap-2">
            <Car className="w-4 h-4 text-uber-blue" />
            Daily Trips
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis dataKey={range === '7d' ? 'day' : 'date'} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="trips" fill="#276EF1" radius={[4, 4, 0, 0]} name="Trips" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Driver Behavior Analysis */}
      <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-uber-gray-700 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-uber-green" />
          Driver Safety Pattern
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="safeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06C167" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06C167" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
            <XAxis dataKey={range === '7d' ? 'day' : 'date'} tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={40} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={v => [`${v}%`, 'Safety Score']} />
            <Area 
              type="monotone" 
              dataKey={(d) => Math.max(0, 100 - ((d.avg_stress || 0) * 10))}
              stroke="#06C167" 
              fill="url(#safeGrad)" 
              strokeWidth={2}
              name="Safety Score"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tips */}
      <div className="bg-uber-blue/5 border border-uber-blue/20 rounded-xl p-4">
        <p className="text-sm text-uber-gray-700">
          <span className="font-semibold">💡 Insight:</span> Your stress levels are{' '}
          {summary.avg_stress > 6 ? 'elevated. Consider taking breaks during long driving sessions.' : 'stabilizing. Keep up the good defensive driving habits!'}
        </p>
      </div>
    </div>
  )
}
