import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { api } from '../api/client'
import { useState } from 'react'

export default function SampleTripCard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handlePlay = async () => {
    setLoading(true)
    try {
      const trip = await api.getSampleTrip()
      navigate(`/trips/${trip.id}`)
    } catch {
      alert('Failed to load sample trip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-uber-black to-uber-gray-800 rounded-xl p-6 text-white shadow-lg">
      <p className="text-uber-green text-xs font-semibold uppercase tracking-wider mb-2">Quick Start</p>
      <h3 className="text-lg font-bold mb-1">Explore a Sample Trip</h3>
      <p className="text-uber-gray-400 text-sm mb-4">
        See stress detection, earnings tracking, and event explainability in action.
      </p>
      <button
        onClick={handlePlay}
        disabled={loading}
        className="flex items-center gap-2 bg-uber-green hover:bg-uber-green/90 text-black font-semibold
          px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <Play className="w-4 h-4" />
        {loading ? 'Loading…' : 'Play Sample Trip'}
      </button>
    </div>
  )
}
