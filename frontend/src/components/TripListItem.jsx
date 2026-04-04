import { useNavigate } from 'react-router-dom'
import { Clock, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react'
import ConfidenceBadge from './ConfidenceBadge'

const stressDot = {
  low: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  medium: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  high: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
}

export default function TripListItem({ trip }) {
  const navigate = useNavigate()
  const start = new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const end = new Date(trip.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <button
      onClick={() => navigate(`/trips/${trip.id}`)}
      className="group w-full bg-slate-800/40 backdrop-blur-md rounded-xl p-4 shadow-lg shadow-black/20 border border-white/5
        hover:border-indigo-500/30 hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-indigo-500/10 transition-all duration-300 text-left flex items-center gap-4 relative overflow-hidden"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Stress dot */}
      <div className={`w-3 h-3 rounded-full shrink-0 relative z-10 ${stressDot[trip.stress_level] || 'bg-slate-600'}`} />

      {/* Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-[15px] text-slate-100">{start} → {end}</span>
          <span className="text-xs text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded-full border border-white/5">{trip.duration_min} min</span>
          {trip.surge_multiplier > 1 && (
            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded">
              {trip.surge_multiplier}×
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[13px] text-slate-400">
          <span className="flex items-center gap-1 group-hover:text-slate-300 transition-colors"><DollarSign className="w-3.5 h-3.5" />₹{trip.fare}</span>
          <span className="flex items-center gap-1 group-hover:text-slate-300 transition-colors"><Clock className="w-3.5 h-3.5" />{trip.distance_km} km</span>
          <span className="flex items-center gap-1 group-hover:text-slate-300 transition-colors"><AlertTriangle className="w-3.5 h-3.5" />{trip.events_count} events</span>
        </div>
        {/* Event summary pills */}
        {trip.events_summary && trip.events_summary.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {trip.events_summary.slice(0, 3).map((e, i) => (
              <span
                key={i}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  e.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  e.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {e.label.replace(/_/g, ' ')}
              </span>
            ))}
            {trip.events_summary.length > 3 && (
              <span className="text-[10px] text-slate-500 mt-0.5">+{trip.events_summary.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Stress score */}
      <div className="text-center shrink-0 relative z-10 px-2 drop-shadow-md">
        <div className={`text-xl font-bold ${
          trip.stress_score > 6 ? 'text-rose-400' :
          trip.stress_score > 3 ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {trip.stress_score}
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">stress</div>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-600 shrink-0 relative z-10 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
    </button>
  )
}
