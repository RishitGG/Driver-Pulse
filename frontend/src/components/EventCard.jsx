import { useState } from 'react'
import ConfidenceBadge from './ConfidenceBadge'
import FeedbackButtons from './FeedbackButtons'
import ExplainModal from './ExplainModal'
import { Info, MapPin } from 'lucide-react'

export default function EventCard({ event, onJumpTo, onFeedback }) {
  const [showExplain, setShowExplain] = useState(false)

  const severityColor = {
    low: 'border-l-uber-green',
    medium: 'border-l-uber-yellow',
    high: 'border-l-uber-red',
  }[event.severity] || 'border-l-uber-gray-300'

  const time = event.timestamp
    ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : `+${Math.round(event.offset_sec / 60)}m`

  return (
    <>
      <div className={`bg-white rounded-lg border border-uber-gray-100 border-l-4 ${severityColor} p-4 shadow-sm`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{event.emoji}</span>
              <span className="font-semibold text-sm">{event.label.replace(/_/g, ' ')}</span>
              <ConfidenceBadge level={event.confidence_level} score={event.confidence} />
            </div>
            <p className="text-xs text-uber-gray-500">{time}</p>
            {event.explain?.summary && (
              <p className="text-xs text-uber-gray-600 mt-1">{event.explain.summary}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowExplain(true)}
              className="p-1.5 rounded-lg hover:bg-uber-gray-100 text-uber-gray-500 transition-colors"
              title="Why this happened"
            >
              <Info className="w-4 h-4" />
            </button>
            {onJumpTo && (
              <button
                onClick={() => onJumpTo(event.offset_sec)}
                className="p-1.5 rounded-lg hover:bg-uber-gray-100 text-uber-blue transition-colors"
                title="Jump to"
              >
                <MapPin className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-uber-gray-100">
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
