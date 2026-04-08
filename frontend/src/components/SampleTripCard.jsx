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
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-indigo-900/20 border border-white/10 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-400/30 transition-colors" />
      <div className="relative z-10">
        <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-2 shadow-emerald-400/20 drop-shadow-md">Quick Start</p>
        <h3 className="text-[20px] font-bold mb-1 tracking-tight group-hover:text-indigo-200 transition-colors">Explore a Sample Trip</h3>
        <p className="text-indigo-200/80 text-[14px] mb-5 leading-relaxed">
          See stress detection, earnings tracking, and event explainability in action.
        </p>
        <button
          onClick={handlePlay}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold
            px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] disabled:opacity-50 transform hover:-translate-y-0.5"
        >
          <Play className="w-4 h-4 fill-current" />
          {loading ? 'Loading…' : 'Play Sample Trip'}
        </button>
      </div>
    </div>
  )
}
