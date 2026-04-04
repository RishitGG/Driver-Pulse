import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { Lightbulb, X } from 'lucide-react'

export default function StressTips() {
  const [tips, setTips] = useState([])
  const [dismissed, setDismissed] = useState(new Set())

  useEffect(() => {
    api.getTips().then(res => setTips(res.tips)).catch(() => {})
  }, [])

  const visible = tips.filter(t => !dismissed.has(t.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-bold text-slate-200 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
        Stress-Reduction Tips
      </h3>
      {visible.map(tip => (
        <div key={tip.id} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 relative shadow-lg shadow-amber-500/5 backdrop-blur-sm group hover:-translate-y-1 transition-transform">
          <button
            onClick={() => setDismissed(prev => new Set([...prev, tip.id]))}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-amber-500/20 transition-colors"
          >
            <X className="w-4 h-4 text-amber-400/80" />
          </button>
          <p className="font-bold text-[14px] text-amber-100 mb-1.5 tracking-tight">{tip.title}</p>
          <p className="text-[13px] text-amber-200/70 mb-3 leading-relaxed pr-6">{tip.text}</p>
          <button className="text-xs font-bold text-amber-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-4 py-1.5 rounded-lg transition-all shadow-md">
            {tip.cta}
          </button>
        </div>
      ))}
    </div>
  )
}
