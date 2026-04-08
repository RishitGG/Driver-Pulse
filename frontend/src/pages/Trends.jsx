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
    { label: 'Avg Daily Trips', value: summary.avg_daily_trips, icon: Car, color: 'text-indigo-400' },
    { label: 'Avg Stress Score', value: summary.avg_stress?.toFixed(1), icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'High Stress Events', value: summary.high_stress_events || 0, icon: Zap, color: 'text-rose-400' },
    { label: 'Safety Score', value: `${Math.max(0, 100 - ((summary.avg_stress || 0) * 10))}%`, icon: Shield, color: 'text-emerald-400' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header + range toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Driver Behavior Trends</h1>
          <p className="text-[15px] text-slate-400 mt-1">Analyze your driving patterns over time</p>
        </div>
        <div className="flex bg-slate-900/60 backdrop-blur-md rounded-xl p-1.5 border border-white/5 shadow-inner">
          {[{ key: '7d', label: 'Week' }, { key: '30d', label: 'Month' }].map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-5 py-2 rounded-lg text-[14px] font-bold transition-all duration-300 ${
                range === r.key
                  ? 'bg-slate-800 text-white shadow-md border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-white/5 shadow-xl hover:-translate-y-1 transition-transform group">
            <Icon className={`w-6 h-6 ${color} mb-3 group-hover:scale-110 transition-transform`} />
            <p className="text-2xl font-bold text-slate-100">{value}</p>
            <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Stress + Trips chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/5 shadow-xl">
          <h3 className="text-[15px] font-bold text-slate-200 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Stress Level Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey={range === '7d' ? 'day' : 'date'} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', backdropFilter: 'blur(8px)' }} />
              <Line type="monotone" dataKey="avg_stress" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Avg Stress" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/5 shadow-xl">
          <h3 className="text-[15px] font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-400" />
            Daily Trips
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey={range === '7d' ? 'day' : 'date'} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', backdropFilter: 'blur(8px)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="trips" fill="#6366f1" radius={[4, 4, 0, 0]} name="Trips" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Driver Behavior Analysis */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/5 shadow-xl">
        <h3 className="text-[15px] font-bold text-slate-200 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Driver Safety Pattern
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={days} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="safeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
            <XAxis dataKey={range === '7d' ? 'day' : 'date'} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} width={40} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', backdropFilter: 'blur(8px)' }} formatter={v => [`${v}%`, 'Safety Score']} />
            <Area 
              type="monotone" 
              dataKey={(d) => Math.max(0, 100 - ((d.avg_stress || 0) * 10))}
              stroke="#10b981" 
              fill="url(#safeGrad)" 
              strokeWidth={3}
              name="Safety Score"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tips */}
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 flex items-start gap-3 shadow-inner">
        <Zap className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
        <p className="text-[14px] text-indigo-200/90 leading-relaxed">
          <span className="font-bold text-indigo-300">Insight:</span> Your stress levels are{' '}
          {summary.avg_stress > 6 ? 'elevated. Consider taking breaks during long driving sessions to improve safety and comfort.' : 'stabilizing. Keep up the good defensive driving habits!'}
        </p>
      </div>
    </div>
  )
}
