import { useState, useEffect } from 'react'
import { api } from '../api/client'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Car, AlertTriangle, Clock } from 'lucide-react'

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
    { label: 'Avg Daily Earnings', value: `₹${summary.avg_daily_earnings?.toLocaleString()}`, icon: DollarSign, color: 'text-uber-green' },
    { label: 'Avg Daily Trips', value: summary.avg_daily_trips, icon: Car, color: 'text-uber-blue' },
    { label: 'Avg Stress Score', value: summary.avg_stress, icon: AlertTriangle, color: 'text-uber-red' },
    { label: 'Total Earnings', value: `₹${summary.total_earnings?.toLocaleString()}`, icon: TrendingUp, color: 'text-uber-orange' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header + range toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Personal Trends</h1>
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

      {/* Earnings chart */}
      <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-uber-gray-700 mb-4">Earnings Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06C167" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06C167" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
            <XAxis dataKey={range === '7d' ? 'day' : 'date'} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={50} tickFormatter={v => `₹${v}`} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={v => [`₹${v}`, 'Earnings']} />
            <Area type="monotone" dataKey="earnings" stroke="#06C167" fill="url(#earnGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stress + Trips chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-4">Average Stress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis dataKey={range === '7d' ? 'day' : 'date'} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="avg_stress" stroke="#E11900" strokeWidth={2} dot={{ r: 3 }} name="Stress" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-4">Trips Count</h3>
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

      {/* Velocity chart */}
      <div className="bg-white rounded-xl p-5 border border-uber-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-uber-gray-700 mb-4">Earnings Velocity (₹/hr)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#276EF1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#276EF1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
            <XAxis dataKey={range === '7d' ? 'day' : 'date'} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={40} tickFormatter={v => `₹${v}`} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={v => [`₹${v}`, 'Velocity']} />
            <Area type="monotone" dataKey="velocity" stroke="#276EF1" fill="url(#velGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
