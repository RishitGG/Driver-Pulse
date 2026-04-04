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
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-uber-gray-500 mt-0.5">
            {selectedDay === 'today' ? 'Today' : 'Yesterday'}, {selectedDay === 'today' ? 'March 8, 2026' : 'March 7, 2026'}
          </p>
        </div>

        {/* Today/Yesterday toggle */}
        <div className="flex bg-uber-gray-100 rounded-lg p-1">
          {['today', 'yesterday'].map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                selectedDay === day
                  ? 'bg-white text-uber-black shadow-sm'
                  : 'text-uber-gray-500 hover:text-uber-gray-700'
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard icon={Zap} label="Total Trips" value={dashboard.total_trips} color="text-uber-blue" />
          <SummaryCard icon={Clock} label="Total Hours" value={`${dashboard.total_hours}h`} color="text-uber-gray-600" />
          <SummaryCard icon={Shield} label="Safety Score" value={`${Math.max(0, 100 - (dashboard.stress_events || 0) * 5)}%`} color="text-uber-green" />
          <SummaryCard icon={AlertTriangle} label="Stress Events" value={dashboard.stress_events} sub={`${dashboard.high_stress_events} high`} color="text-uber-red" />
          <SummaryCard icon={TrendingUp} label="Behavior" value={dashboard.pct_target_achieved ? `${dashboard.pct_target_achieved}% Smooth` : 'Good'} sub="on course" color="text-uber-orange" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Timeline + Behavior Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodayTimeline trips={trips} />
        </div>
        {/* Quick Behavior Summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-uber-gray-100">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-uber-green" />
            Behavior Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 bg-uber-gray-50 rounded">
              <span className="text-uber-gray-600">Smooth trips</span>
              <span className="font-bold">{Math.max(0, (dashboard?.total_trips || 0) - (dashboard?.stress_events || 0))}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-uber-gray-50 rounded">
              <span className="text-uber-gray-600">Stress events</span>
              <span className="font-bold text-uber-orange">{dashboard?.stress_events || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-uber-gray-50 rounded">
              <span className="text-uber-gray-600">High stress</span>
              <span className="font-bold text-uber-red">{dashboard?.high_stress_events || 0}</span>
            </div>
            <button className="w-full mt-2 px-3 py-2 bg-uber-blue text-white text-sm rounded-lg hover:bg-uber-blue/80 transition-colors">
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
