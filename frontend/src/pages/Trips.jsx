import { useState, useEffect } from 'react'
import { api } from '../api/client'
import TripListItem from '../components/TripListItem'
import FilterChips from '../components/FilterChips'
import { Search, Calendar, SlidersHorizontal } from 'lucide-react'

export default function Trips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('2026-03-08')
  const [preset, setPreset] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    stress: '',
    earnings_min: '',
    earnings_max: '',
    duration_min: '',
    duration_max: '',
    time_of_day: '',
  })
  const [confidenceFilter, setConfidenceFilter] = useState('')

  useEffect(() => {
    loadTrips()
  }, [date, preset])

  const loadTrips = async () => {
    setLoading(true)
    try {
      const params = { date }
      if (preset) params.preset = preset
      if (filters.stress) params.stress = filters.stress
      if (filters.earnings_min) params.earnings_min = filters.earnings_min
      if (filters.earnings_max) params.earnings_max = filters.earnings_max
      if (filters.duration_min) params.duration_min = filters.duration_min
      if (filters.duration_max) params.duration_max = filters.duration_max
      if (filters.time_of_day) params.time_of_day = filters.time_of_day

      const res = await api.getTrips(params)
      setTrips(res.trips)
    } catch (err) {
      console.error('Failed to load trips:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    setPreset(null)
    loadTrips()
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({ stress: '', earnings_min: '', earnings_max: '', duration_min: '', duration_max: '', time_of_day: '' })
    setPreset(null)
    setConfidenceFilter('')
  }

  // Client-side confidence filtering on events
  let displayTrips = trips
  if (confidenceFilter) {
    displayTrips = trips.filter(t => {
      if (!t.events_summary) return true
      return t.events_summary.some(e => {
        // We don't have confidence in summary, use stress_level as proxy
        if (confidenceFilter === 'high') return t.stress_level === 'high'
        if (confidenceFilter === 'medium') return t.stress_level === 'medium'
        if (confidenceFilter === 'low') return t.stress_level === 'low'
        return true
      })
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trip History</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-uber-gray-200 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-uber-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm outline-none bg-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-uber-black text-white border-uber-black' : 'border-uber-gray-200 hover:border-uber-gray-400'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick filter presets */}
      <FilterChips active={preset} onSelect={(p) => { setPreset(p); clearFilters() }} />

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-uber-gray-100 space-y-4">
          <p className="text-sm font-semibold text-uber-gray-700">Advanced Filters</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-uber-gray-500 mb-1 block">Stress Level</label>
              <select
                value={filters.stress}
                onChange={(e) => setFilters(f => ({ ...f, stress: e.target.value }))}
                className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="">Any</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-uber-gray-500 mb-1 block">Time of Day</label>
              <select
                value={filters.time_of_day}
                onChange={(e) => setFilters(f => ({ ...f, time_of_day: e.target.value }))}
                className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="">Any</option>
                <option value="morning">Morning (5-12)</option>
                <option value="afternoon">Afternoon (12-17)</option>
                <option value="evening">Evening (17-21)</option>
                <option value="night">Night (21-5)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-uber-gray-500 mb-1 block">Confidence Level</label>
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="">Any</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-uber-gray-500 mb-1 block">Min Earnings (₹)</label>
              <input
                type="number"
                value={filters.earnings_min}
                onChange={(e) => setFilters(f => ({ ...f, earnings_min: e.target.value }))}
                className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-uber-gray-500 mb-1 block">Max Earnings (₹)</label>
              <input
                type="number"
                value={filters.earnings_max}
                onChange={(e) => setFilters(f => ({ ...f, earnings_max: e.target.value }))}
                className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="∞"
              />
            </div>
            <div>
              <label className="text-xs text-uber-gray-500 mb-1 block">Max Duration (min)</label>
              <input
                type="number"
                value={filters.duration_max}
                onChange={(e) => setFilters(f => ({ ...f, duration_max: e.target.value }))}
                className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="∞"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="bg-uber-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-uber-gray-800"
            >
              Apply Filters
            </button>
            <button
              onClick={() => { clearFilters(); loadTrips() }}
              className="px-4 py-2 rounded-lg text-sm text-uber-gray-500 hover:bg-uber-gray-100"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-uber-gray-500">
        {displayTrips.length} trip{displayTrips.length !== 1 ? 's' : ''} found
      </p>

      {/* Trip list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-uber-black border-t-transparent rounded-full" />
        </div>
      ) : displayTrips.length === 0 ? (
        <div className="text-center py-12 text-uber-gray-400">
          <p className="text-lg mb-1">No trips found</p>
          <p className="text-sm">Try a different date or adjust your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayTrips.map(trip => (
            <TripListItem key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
