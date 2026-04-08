import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import TripMap from '../components/TripMap'
import SignalCharts from '../components/SignalCharts'
import TimelineSlider from '../components/TimelineSlider'
import EventCard from '../components/EventCard'
import ConfidenceBadge from '../components/ConfidenceBadge'
import { ArrowLeft, Download, Clock, DollarSign, MapPin, Activity } from 'lucide-react'

export default function TripDetail() {
  const { tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSec, setCurrentSec] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playRef = useRef(null)

  useEffect(() => {
    api.getTrip(tripId)
      .then(setTrip)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tripId])

  // Playback
  useEffect(() => {
    if (isPlaying && trip) {
      playRef.current = setInterval(() => {
        setCurrentSec(prev => {
          const next = prev + 10
          if (next >= trip.duration_min * 60) {
            setIsPlaying(false)
            return trip.duration_min * 60
          }
          return next
        })
      }, 500)
    }
    return () => clearInterval(playRef.current)
  }, [isPlaying, trip])

  const handlePlayPause = () => {
    if (currentSec >= (trip?.duration_min || 0) * 60) setCurrentSec(0)
    setIsPlaying(!isPlaying)
  }

  const jumpTo = (sec) => {
    setCurrentSec(sec)
    setIsPlaying(false)
  }

  const handleExport = (format) => {
    if (!trip) return
    let content, filename, mime
    if (format === 'json') {
      content = JSON.stringify(trip, null, 2)
      filename = `${trip.id}.json`
      mime = 'application/json'
    } else {
      // CSV of signals
      const rows = trip.signals.timestamps.map((t, i) =>
        [t, trip.signals.speed[i], trip.signals.accel_magnitude[i], trip.signals.audio_db[i]].join(',')
      )
      content = 'timestamp,speed,accel_magnitude,audio_db\n' + rows.join('\n')
      filename = `${trip.id}_signals.csv`
      mime = 'text/csv'
    }
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-uber-black border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-500">Trip not found</p>
        <Link to="/trips" className="text-indigo-400 text-sm mt-2 inline-block hover:text-indigo-300">Back to trips</Link>
      </div>
    )
  }

  const maxSec = trip.duration_min * 60
  const cursorIndex = trip.route
    ? Math.min(Math.floor((currentSec / maxSec) * trip.route.length), trip.route.length - 1)
    : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/trips" className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Trip {trip.id.substring(0, 8)}...</h1>
            <p className="text-[14px] text-slate-400 mt-0.5">
              {new Date(trip.start_time).toLocaleDateString()} &middot;{' '}
              <span className="font-medium text-slate-300">{new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> –{' '}
              <span className="font-medium text-slate-300">{new Date(trip.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        </div>

        {/* Export */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-slate-800/40 text-[13px] font-bold text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-slate-800/40 text-[13px] font-bold text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> JSON
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 text-center border border-white/5 shadow-lg hover:-translate-y-1 transition-transform cursor-default">
          <Clock className="w-6 h-6 mx-auto text-slate-400 mb-2 drop-shadow-sm" />
          <p className="text-xl font-bold text-slate-100">{trip.duration_min} min</p>
          <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mt-1">Duration</p>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 text-center border border-white/5 shadow-lg hover:-translate-y-1 transition-transform cursor-default">
          <MapPin className="w-6 h-6 mx-auto text-slate-400 mb-2 drop-shadow-sm" />
          <p className="text-xl font-bold text-slate-100">{trip.distance_km} km</p>
          <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mt-1">Distance</p>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 text-center border border-white/5 shadow-lg hover:-translate-y-1 transition-transform cursor-default">
          <DollarSign className="w-6 h-6 mx-auto text-emerald-400 mb-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <p className="text-xl font-bold text-slate-100">₹{trip.fare}</p>
          <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mt-1">
            Fare {trip.surge_multiplier > 1 && <span className="text-indigo-400">({trip.surge_multiplier}× surge)</span>}
          </p>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 text-center border border-white/5 shadow-lg hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden group">
          <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Activity className="w-6 h-6 mx-auto text-rose-400 mb-2 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)] relative z-10" />
          <p className={`text-xl font-bold relative z-10 ${
            trip.stress_score > 6 ? 'text-rose-400' :
            trip.stress_score > 3 ? 'text-amber-400' : 'text-emerald-400'
          }`}>{trip.stress_score}/10</p>
          <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mt-1 relative z-10">Stress Score</p>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 text-center border border-white/5 shadow-lg hover:-translate-y-1 transition-transform cursor-default">
          <div className="w-6 h-6 mx-auto text-amber-400 mb-2 flex items-center justify-center font-black text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">⚡</div>
          <p className="text-xl font-bold text-slate-100">{trip.events_count}</p>
          <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mt-1">Events</p>
        </div>
      </div>

      <h3 className="text-[15px] font-bold text-slate-200 mb-3 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-indigo-400" /> Map Replay
      </h3>
      <div className="h-[450px] rounded-2xl overflow-hidden shadow-xl shadow-black/20 border border-white/10 z-0 relative">
        <TripMap
          route={trip.route}
          events={trip.events}
          cursorIndex={cursorIndex}
          durationSec={maxSec}
        />
      </div>

      {/* Playback slider */}
      <TimelineSlider
        maxSec={maxSec}
        currentSec={currentSec}
        onChange={setCurrentSec}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
      />

      {/* Signal charts + Events side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl shadow-lg">
          <h3 className="text-[15px] font-bold text-slate-200 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400" /> Sensor Telemetry</h3>
          <SignalCharts signals={trip.signals} cursorTime={currentSec} />
        </div>
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl shadow-lg">
          <h3 className="text-[15px] font-bold text-slate-200 mb-6 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">⚡</span>
            Detected Events ({trip.events.length})
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {trip.events.map(ev => (
              <EventCard
                key={ev.id}
                event={ev}
                onJumpTo={jumpTo}
                onFeedback={(id, label) => {
                  setTrip(prev => ({
                    ...prev,
                    events: prev.events.map(e =>
                      e.id === id ? { ...e, feedback: { label } } : e
                    ),
                  }))
                }}
              />
            ))}
            {trip.events.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No events detected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
