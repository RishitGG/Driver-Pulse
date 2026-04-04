import { X } from 'lucide-react'

export default function ExplainModal({ event, onClose }) {
  const { explain } = event
  if (!explain) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-slate-950/80">
          <div>
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Why This Happened</p>
            <h3 className="text-xl font-bold flex items-center gap-3 text-white">
              <span className="bg-white/10 w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 shadow-inner">{event.emoji}</span> {event.label.replace(/_/g, ' ')}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 3 feature contributions */}
        <div className="px-6 py-5">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-4">Top Feature Contributions</p>
          <div className="space-y-3">
            {explain.top_features?.map((f, i) => {
              const pct = Math.round(f.contribution * 100)
              const barColor = i === 0 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : i === 1 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
              return (
                <div key={f.feature}>
                  <div className="flex justify-between text-[13px] mb-2">
                    <span className="font-bold text-slate-200">
                      {f.feature.replace(/_/g, ' ')} <span className="text-slate-500 font-normal">{f.direction}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-400">{pct}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct * 3, 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Model inputs */}
        <div className="px-6 py-5 bg-slate-950/50 border-t border-white/5">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-4">Model Inputs (snapshot)</p>
          <div className="grid grid-cols-2 gap-3">
            {explain.model_inputs &&
              Object.entries(explain.model_inputs).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[12px] bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 shadow-inner">
                  <span className="text-slate-400">{k.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-bold text-slate-200">{v}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Summary */}
        {explain.summary && (
          <div className="px-6 py-5 border-t border-white/5 bg-slate-800/30">
            <p className="text-[13px] text-indigo-300 font-medium leading-relaxed">"{explain.summary}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
