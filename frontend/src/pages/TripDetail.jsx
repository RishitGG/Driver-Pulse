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
        <p className="text-lg text-uber-gray-500">Trip not found</p>
        <Link to="/trips" className="text-uber-blue text-sm mt-2 inline-block">Back to trips</Link>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/trips" className="p-2 rounded-lg hover:bg-uber-gray-100 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Trip {trip.id}</h1>
            <p className="text-sm text-uber-gray-500">
              {new Date(trip.start_time).toLocaleDateString()} &middot;{' '}
              {new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
              {new Date(trip.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-uber-gray-200 text-sm hover:border-uber-gray-400 transition"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-uber-gray-200 text-sm hover:border-uber-gray-400 transition"
          >
            <Download className="w-4 h-4" /> JSON
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-4 text-center border border-uber-gray-100">
          <Clock className="w-5 h-5 mx-auto text-uber-gray-400 mb-1" />
          <p className="text-lg font-bold">{trip.duration_min} min</p>
          <p className="text-[10px] text-uber-gray-400">Duration</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-uber-gray-100">
          <MapPin className="w-5 h-5 mx-auto text-uber-gray-400 mb-1" />
          <p className="text-lg font-bold">{trip.distance_km} km</p>
          <p className="text-[10px] text-uber-gray-400">Distance</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-uber-gray-100">
          <DollarSign className="w-5 h-5 mx-auto text-uber-green mb-1" />
          <p className="text-lg font-bold">₹{trip.fare}</p>
          <p className="text-[10px] text-uber-gray-400">
            Fare {trip.surge_multiplier > 1 && `(${trip.surge_multiplier}× surge)`}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-uber-gray-100">
          <Activity className="w-5 h-5 mx-auto text-uber-red mb-1" />
          <p className={`text-lg font-bold ${
            trip.stress_score > 6 ? 'text-uber-red' :
            trip.stress_score > 3 ? 'text-uber-yellow' : 'text-uber-green'
          }`}>{trip.stress_score}/10</p>
          <p className="text-[10px] text-uber-gray-400">Stress Score</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-uber-gray-100">
          <p className="text-lg font-bold">{trip.events_count}</p>
          <p className="text-[10px] text-uber-gray-400">Events</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-uber-gray-700 mb-2">Risk along route</h3>
      <div className="h-[400px] rounded-xl overflow-hidden shadow-sm border border-uber-gray-100">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-3">Sensor Signals</h3>
          <SignalCharts signals={trip.signals} cursorTime={currentSec} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-3">
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
              <p className="text-sm text-uber-gray-400 text-center py-8">No events detected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
