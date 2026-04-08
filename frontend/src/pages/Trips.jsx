import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import TripListItem from '../components/TripListItem'
import FilterChips from '../components/FilterChips'
import { Calendar, SlidersHorizontal, Plus, Upload, Download, X } from 'lucide-react'
import { isValidMoney, isValidTimeRange } from '../utils/sanityChecks'

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
    // Basic client-side validation mirroring backend rules
    if (!newTrip.date) {
      setCreateError('Date is required')
      return
    }
    if (!isValidTimeRange(newTrip.start_time, newTrip.end_time)) {
      setCreateError('End time must be after start time')
      return
    }
    if (!isValidMoney(newTrip.distance_km)) {
      setCreateError('Please enter a valid distance')
      return
    }
    if (!isValidMoney(newTrip.fare)) {
      setCreateError('Please enter a valid fare')
      return
    }
    if (newTrip.stress_score !== '' && newTrip.stress_score !== null && newTrip.stress_score !== undefined) {
      const s = Number(newTrip.stress_score)
      if (!Number.isFinite(s) || s < 0 || s > 10) {
        setCreateError('Stress score must be a number between 0 and 10')
        return
      }
    }
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
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Please upload a .csv file')
      return
    }
    // 1 MB soft limit – avoids accidental huge files
    const maxSizeBytes = 1 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setImportError('CSV is too large (max 1MB)')
      return
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Trip History</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 focus-within:border-indigo-500 transition-colors shadow-inner">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-[14px] font-medium text-slate-200 outline-none bg-transparent"
            />
          </div>
          <a
            href="/api/trips/template"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-slate-800/40 text-[14px] font-medium text-slate-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Template
          </a>
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-slate-800/40 text-[14px] font-medium text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition-all shadow-sm disabled:opacity-50"
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[14px] font-bold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" /> Add trip
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all duration-300 shadow-sm ${
              showFilters ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800/40 border-white/10 text-slate-300 hover:border-indigo-400/50 hover:bg-indigo-500/10'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
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
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <p className="text-[15px] font-bold text-slate-200">Advanced Filters</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5 block">Stress Level</label>
              <select
                value={filters.stress}
                onChange={(e) => setFilters(f => ({ ...f, stress: e.target.value }))}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Any</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5 block">Time of Day</label>
              <select
                value={filters.time_of_day}
                onChange={(e) => setFilters(f => ({ ...f, time_of_day: e.target.value }))}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Any</option>
                <option value="morning">Morning (5-12)</option>
                <option value="afternoon">Afternoon (12-17)</option>
                <option value="evening">Evening (17-21)</option>
                <option value="night">Night (21-5)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5 block">Confidence Level</label>
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Any</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5 block">Max Duration (min)</label>
              <input
                type="number"
                value={filters.duration_max}
                onChange={(e) => setFilters(f => ({ ...f, duration_max: e.target.value }))}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                placeholder="∞"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-white/5">
            <button
              onClick={applyFilters}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              Apply Filters
            </button>
            <button
              onClick={() => { clearFilters(); loadTrips() }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-[13px] font-bold tracking-wider uppercase text-slate-500 pl-1">
        {displayTrips.length} trip{displayTrips.length !== 1 ? 's' : ''} found
      </p>

      {/* Trip list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : displayTrips.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-white/5 backdrop-blur-sm">
          <p className="text-xl font-bold text-slate-400 mb-2">No trips found</p>
          <p className="text-[14px] text-slate-500">Try a different date or adjust your filters</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-800/50">
              <div>
                <p className="text-lg font-bold text-white tracking-tight">Add trip</p>
                <p className="text-[13px] text-slate-400">Manual entry (individual trip)</p>
              </div>
              <button
                onClick={() => setShowAddTrip(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitNewTrip} className="p-6 space-y-5">
              {createError && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-[14px] text-rose-400">
                  <strong>Error:</strong> {createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5 block">Date</label>
                  <input
                    type="date"
                    value={newTrip.date}
                    onChange={(e) => setNewTrip(t => ({ ...t, date: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5 block">Start time</label>
                  <input
                    type="time"
                    value={newTrip.start_time}
                    onChange={(e) => setNewTrip(t => ({ ...t, start_time: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5 block">End time</label>
                  <input
                    type="time"
                    value={newTrip.end_time}
                    onChange={(e) => setNewTrip(t => ({ ...t, end_time: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5 block">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newTrip.distance_km}
                    onChange={(e) => setNewTrip(t => ({ ...t, distance_km: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                    placeholder="8.2"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5 block">Fare (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={newTrip.fare}
                    onChange={(e) => setNewTrip(t => ({ ...t, fare: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                    placeholder="310"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1.5 block">Stress score (optional, 0–10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={newTrip.stress_score}
                    onChange={(e) => setNewTrip(t => ({ ...t, stress_score: e.target.value }))}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddTrip(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-[14px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-3 rounded-xl text-[14px] font-bold hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-0.5"
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
