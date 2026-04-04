import { useState, useEffect } from 'react'
import { api } from '../api/client'
import SummaryCard from '../components/SummaryCard'
import TodayTimeline from '../components/TodayTimeline'
import SampleTripCard from '../components/SampleTripCard'
import StressTips from '../components/StressTips'
import { Zap, Clock, Shield, AlertTriangle, TrendingUp, Activity } from 'lucide-react'

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [trips, setTrips] = useState([])
  const [goals, setGoals] = useState(null)
  const [selectedDay, setSelectedDay] = useState('today')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = '2026-03-08'
  const yesterday = '2026-03-07'

  useEffect(() => {
    loadData()
  }, [selectedDay])

  const loadData = async () => {
    setLoading(true)
    try {
      setError('')
      const [dash, tripRes, goalsRes] = await Promise.all([
        api.getDashboard(),
        api.getTrips({ date: selectedDay === 'today' ? today : yesterday }),
        api.getGoals(),
      ])
      setDashboard(dash)
      setTrips(tripRes.trips)
      setGoals(goalsRes)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError('Unable to load latest dashboard data. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-uber-black border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Dashboard</h1>
          <p className="text-[15px] font-medium text-slate-400 mt-1">
            {selectedDay === 'today' ? 'Today' : 'Yesterday'}, {selectedDay === 'today' ? 'March 8, 2026' : 'March 7, 2026'}
          </p>
        </div>

        {/* Today/Yesterday toggle */}
        <div className="flex bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-xl p-1 shadow-inner">
          {['today', 'yesterday'].map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 capitalize ${
                selectedDay === day
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Start */}
      <SampleTripCard />

      {/* Summary Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
          <SummaryCard icon={Zap} label="Total Trips" value={dashboard.total_trips} color="text-indigo-400" />
          <SummaryCard icon={Clock} label="Total Hours" value={`${dashboard.total_hours}h`} color="text-slate-400" />
          <SummaryCard icon={Shield} label="Safety Score" value={`${Math.max(0, 100 - (dashboard.stress_events || 0) * 5)}%`} color="text-emerald-400" />
          <SummaryCard icon={AlertTriangle} label="Stress Events" value={dashboard.stress_events} sub={`${dashboard.high_stress_events} high`} color="text-rose-400" />
          <SummaryCard icon={TrendingUp} label="Behavior" value={dashboard.pct_target_achieved ? `${dashboard.pct_target_achieved}% Smooth` : 'Good'} sub="on course" color="text-amber-400" />
        </div>
      )}

      {error && (
        <p className="text-[13px] text-rose-400 font-medium">
          {error}
        </p>
      )}

      {/* Timeline + Behavior Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodayTimeline trips={trips} />
        </div>
        {/* Quick Behavior Summary */}
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 shadow-lg shadow-black/20 border border-white/5 hover:border-slate-700 transition-all">
          <h3 className="text-[15px] font-bold text-slate-200 mb-5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Behavior Summary
          </h3>
          <div className="space-y-3 px-1">
            <div className="flex items-center justify-between p-3.5 bg-slate-900/50 rounded-xl border border-white/5">
              <span className="text-slate-400 font-medium text-[14px]">Smooth trips</span>
              <span className="font-bold text-emerald-400 drop-shadow-sm text-lg tracking-tight">{Math.max(0, (dashboard?.total_trips || 0) - (dashboard?.stress_events || 0))}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-900/50 rounded-xl border border-white/5">
              <span className="text-slate-400 font-medium text-[14px]">Stress events</span>
              <span className="font-bold text-amber-400 drop-shadow-sm text-lg tracking-tight">{dashboard?.stress_events || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-900/50 rounded-xl border border-white/5">
              <span className="text-slate-400 font-medium text-[14px]">High stress</span>
              <span className="font-bold text-rose-400 drop-shadow-sm text-lg tracking-tight">{dashboard?.high_stress_events || 0}</span>
            </div>
            <button className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5">
              View Safety Goals →
            </button>
          </div>
        </div>
      </div>

      {/* Stress Tips */}
      <StressTips />
    </div>
  )
}
