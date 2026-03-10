import { X } from 'lucide-react'

export default function ExplainModal({ event, onClose }) {
  const { explain } = event
  if (!explain) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-uber-gray-100">
          <div>
            <p className="text-xs text-uber-gray-500 uppercase font-semibold tracking-wider">Why This Happened</p>
            <h3 className="text-lg font-bold flex items-center gap-2 mt-0.5">
              {event.emoji} {event.label.replace(/_/g, ' ')}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-uber-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 3 feature contributions */}
        <div className="px-6 py-4">
          <p className="text-xs text-uber-gray-500 font-semibold uppercase tracking-wider mb-3">Top Feature Contributions</p>
          <div className="space-y-3">
            {explain.top_features?.map((f, i) => {
              const pct = Math.round(f.contribution * 100)
              const barColor = i === 0 ? 'bg-uber-red' : i === 1 ? 'bg-uber-orange' : 'bg-uber-yellow'
              return (
                <div key={f.feature}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">
                      {f.feature.replace(/_/g, ' ')} <span className="text-uber-gray-400">{f.direction}</span>
                    </span>
                    <span className="font-mono text-uber-gray-600">{pct}%</span>
                  </div>
                  <div className="h-2 bg-uber-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct * 3, 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Model inputs */}
        <div className="px-6 py-4 bg-uber-gray-50 border-t border-uber-gray-100">
          <p className="text-xs text-uber-gray-500 font-semibold uppercase tracking-wider mb-3">Model Inputs (snapshot)</p>
          <div className="grid grid-cols-2 gap-2">
            {explain.model_inputs &&
              Object.entries(explain.model_inputs).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs bg-white rounded-lg px-3 py-2">
                  <span className="text-uber-gray-500">{k.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-semibold">{v}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Summary */}
        {explain.summary && (
          <div className="px-6 py-4 border-t border-uber-gray-100">
            <p className="text-sm text-uber-gray-600 italic">{explain.summary}</p>
          </div>
        )}
      </div>
    </div>
  )
}
