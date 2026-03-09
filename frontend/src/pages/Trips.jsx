import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import TripListItem from '../components/TripListItem'
import FilterChips from '../components/FilterChips'
import { Calendar, SlidersHorizontal, Plus, Upload, Download, X } from 'lucide-react'

export default function Trips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('2026-03-08')
  const [preset, setPreset] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddTrip, setShowAddTrip] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newTrip, setNewTrip] = useState({
    date: '2026-03-08',
    start_time: '',
    end_time: '',
    distance_km: '',
    fare: '',
    stress_score: '',
  })

  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSummary, setImportSummary] = useState(null)
  const importInputRef = useRef(null)
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

  useEffect(() => {
    setNewTrip(t => ({ ...t, date }))
  }, [date])

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

  const submitNewTrip = async (e) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const payload = {
        date: newTrip.date,
        start_time: newTrip.start_time,
        end_time: newTrip.end_time,
        distance_km: Number(newTrip.distance_km),
        fare: Number(newTrip.fare),
      }
      if (newTrip.stress_score !== '' && newTrip.stress_score !== null && newTrip.stress_score !== undefined) {
        payload.stress_score = Number(newTrip.stress_score)
      }
      await api.createTrip(payload)
      setShowAddTrip(false)
      setNewTrip(t => ({ ...t, start_time: '', end_time: '', distance_km: '', fare: '', stress_score: '' }))
      await loadTrips()
    } catch (err) {
      setCreateError(err?.message || 'Failed to add trip')
    } finally {
      setCreating(false)
    }
  }

  const handleImportTripsCsv = async (file) => {
    if (!file) return
    setImportError('')
    setImportSummary(null)
    setImporting(true)
    try {
      const res = await api.importTripsCsv(file)
      setImportSummary(res.summary)
      await loadTrips()
    } catch (err) {
      setImportError(err?.message || 'Import failed')
    } finally {
      setImporting(false)
      if (importInputRef.current) importInputRef.current.value = ''
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
          <a
            href="/api/trips/template"
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-uber-gray-200 text-sm hover:border-uber-gray-400 transition"
          >
            <Download className="w-4 h-4" /> Template
          </a>
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-uber-gray-200 text-sm hover:border-uber-gray-400 transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> {importing ? 'Importing…' : 'Import CSV'}
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleImportTripsCsv(e.target.files?.[0])}
          />
          <button
            onClick={() => { setShowAddTrip(true); setCreateError('') }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-uber-black text-white text-sm font-medium hover:bg-uber-gray-800 transition"
          >
            <Plus className="w-4 h-4" /> Add trip
          </button>
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

      {/* Import feedback (mobile + status) */}
      {(importError || importSummary) && (
        <div className={`rounded-xl p-4 text-sm border ${
          importError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {importError ? (
            <span><strong>Import failed:</strong> {importError}</span>
          ) : (
            <span>
              <strong>Imported:</strong> {importSummary.created} created, {importSummary.errors} errors (from {importSummary.total_rows} rows)
            </span>
          )}
          <div className="mt-3 flex gap-2 md:hidden">
            <a
              href="/api/trips/template"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-current/20 text-sm"
            >
              <Download className="w-4 h-4" /> Template
            </a>
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-current/20 text-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> {importing ? 'Importing…' : 'Import CSV'}
            </button>
          </div>
        </div>
      )}

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

      {/* Add Trip Modal */}
      {showAddTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-uber-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-uber-gray-100">
              <div>
                <p className="text-sm font-semibold text-uber-gray-700">Add trip</p>
                <p className="text-xs text-uber-gray-400">Manual entry (individual trip)</p>
              </div>
              <button
                onClick={() => setShowAddTrip(false)}
                className="p-2 rounded-lg hover:bg-uber-gray-100 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitNewTrip} className="p-5 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <strong>Error:</strong> {createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-uber-gray-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={newTrip.date}
                    onChange={(e) => setNewTrip(t => ({ ...t, date: e.target.value }))}
                    className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-uber-gray-500 mb-1 block">Start time</label>
                  <input
                    type="time"
                    value={newTrip.start_time}
                    onChange={(e) => setNewTrip(t => ({ ...t, start_time: e.target.value }))}
                    className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-uber-gray-500 mb-1 block">End time</label>
                  <input
                    type="time"
                    value={newTrip.end_time}
                    onChange={(e) => setNewTrip(t => ({ ...t, end_time: e.target.value }))}
                    className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-uber-gray-500 mb-1 block">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newTrip.distance_km}
                    onChange={(e) => setNewTrip(t => ({ ...t, distance_km: e.target.value }))}
                    className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    placeholder="8.2"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-uber-gray-500 mb-1 block">Fare (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={newTrip.fare}
                    onChange={(e) => setNewTrip(t => ({ ...t, fare: e.target.value }))}
                    className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    placeholder="310"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-uber-gray-500 mb-1 block">Stress score (optional, 0–10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={newTrip.stress_score}
                    onChange={(e) => setNewTrip(t => ({ ...t, stress_score: e.target.value }))}
                    className="w-full border border-uber-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddTrip(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm text-uber-gray-500 hover:bg-uber-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-uber-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-uber-gray-800 disabled:opacity-50"
                >
                  {creating ? 'Adding…' : 'Add trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
