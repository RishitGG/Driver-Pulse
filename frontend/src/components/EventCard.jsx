import { useState } from 'react'
import ConfidenceBadge from './ConfidenceBadge'
import FeedbackButtons from './FeedbackButtons'
import ExplainModal from './ExplainModal'
import { Info, MapPin } from 'lucide-react'

export default function EventCard({ event, onJumpTo, onFeedback }) {
  const [showExplain, setShowExplain] = useState(false)

  const severityColor = {
    low: 'border-l-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.1)]',
    medium: 'border-l-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.1)]',
    high: 'border-l-rose-500 shadow-[0_4px_20px_rgba(244,63,94,0.15)]',
  }[event.severity] || 'border-l-slate-700'

  const time = event.timestamp
    ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : `+${Math.round(event.offset_sec / 60)}m`

  return (
    <>
      <div className={`bg-slate-800/40 backdrop-blur-md rounded-xl border border-white/5 border-l-4 ${severityColor} p-4 shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg drop-shadow-md">{event.emoji}</span>
              <span className="font-semibold text-[15px] text-slate-100">{event.label.replace(/_/g, ' ')}</span>
              <ConfidenceBadge level={event.confidence_level} score={event.confidence} />
            </div>
            <p className="text-[13px] text-slate-400">{time}</p>
            {event.explain?.summary && (
              <p className="text-[13px] text-slate-300 mt-1.5 leading-relaxed">{event.explain.summary}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 relative z-10">
            <button
              onClick={() => setShowExplain(true)}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              title="Why this happened"
            >
              <Info className="w-4 h-4" />
            </button>
            {onJumpTo && (
              <button
                onClick={() => onJumpTo(event.offset_sec)}
                className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors"
                title="Jump to"
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
          <FeedbackButtons
            eventId={event.id}
            current={event.feedback?.label}
            onFeedback={onFeedback}
          />
        </div>
      </div>

      {showExplain && (
        <ExplainModal event={event} onClose={() => setShowExplain(false)} />
      )}
    </>
  )
}
