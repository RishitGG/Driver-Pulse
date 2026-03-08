import { useNavigate } from 'react-router-dom'
import { Clock, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react'
import ConfidenceBadge from './ConfidenceBadge'

const stressDot = {
  low: 'bg-uber-green',
  medium: 'bg-uber-yellow',
  high: 'bg-uber-red',
}

export default function TripListItem({ trip }) {
  const navigate = useNavigate()
  const start = new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const end = new Date(trip.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <button
      onClick={() => navigate(`/trips/${trip.id}`)}
      className="w-full bg-white rounded-xl p-4 shadow-sm border border-uber-gray-100
        hover:border-uber-gray-300 transition-colors text-left flex items-center gap-4"
    >
      {/* Stress dot */}
      <div className={`w-3 h-3 rounded-full shrink-0 ${stressDot[trip.stress_level] || 'bg-uber-gray-300'}`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{start} → {end}</span>
          <span className="text-xs text-uber-gray-400">{trip.duration_min} min</span>
          {trip.surge_multiplier > 1 && (
            <span className="text-[10px] font-bold text-uber-blue bg-blue-50 px-1.5 py-0.5 rounded">
              {trip.surge_multiplier}×
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-uber-gray-500">
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />₹{trip.fare}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trip.distance_km} km</span>
          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{trip.events_count} events</span>
        </div>
        {/* Event summary pills */}
        {trip.events_summary && trip.events_summary.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {trip.events_summary.slice(0, 3).map((e, i) => (
              <span
                key={i}
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  e.severity === 'high' ? 'bg-red-100 text-red-700' :
                  e.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}
              >
                {e.label.replace(/_/g, ' ')}
              </span>
            ))}
            {trip.events_summary.length > 3 && (
              <span className="text-[10px] text-uber-gray-400">+{trip.events_summary.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Stress score */}
      <div className="text-center shrink-0">
        <div className={`text-lg font-bold ${
          trip.stress_score > 6 ? 'text-uber-red' :
          trip.stress_score > 3 ? 'text-uber-yellow' : 'text-uber-green'
        }`}>
          {trip.stress_score}
        </div>
        <div className="text-[10px] text-uber-gray-400">stress</div>
      </div>

      <ChevronRight className="w-4 h-4 text-uber-gray-300 shrink-0" />
    </button>
  )
}
