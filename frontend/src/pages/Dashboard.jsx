import { useState, useEffect } from 'react'
import { api } from '../api/client'
import SummaryCard from '../components/SummaryCard'
import TodayTimeline from '../components/TodayTimeline'
import SampleTripCard from '../components/SampleTripCard'
import EarningsProgress from '../components/EarningsProgress'
import StressTips from '../components/StressTips'
import { Car, Clock, DollarSign, AlertTriangle, Target, Activity } from 'lucide-react'

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
          <SummaryCard icon={Car} label="Total Trips" value={dashboard.total_trips} color="text-uber-blue" />
          <SummaryCard icon={Clock} label="Total Hours" value={`${dashboard.total_hours}h`} color="text-uber-gray-600" />
          <SummaryCard icon={DollarSign} label="Earnings" value={`₹${dashboard.total_earnings?.toLocaleString()}`} color="text-uber-green" />
          <SummaryCard icon={AlertTriangle} label="Stress Events" value={dashboard.stress_events} sub={`${dashboard.high_stress_events} high`} color="text-uber-red" />
          <SummaryCard icon={Target} label="Target" value={`${dashboard.pct_target_achieved}%`} sub="achieved" color="text-uber-orange" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Timeline + Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTimeline trips={trips} />
        <EarningsProgress goals={goals} />
      </div>

      {/* Stress Tips */}
      <StressTips />
    </div>
  )
}
