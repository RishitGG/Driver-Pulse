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
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-uber-gray-700 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-uber-yellow" />
        Stress-Reduction Tips
      </h3>
      {visible.map(tip => (
        <div key={tip.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 relative">
          <button
            onClick={() => setDismissed(prev => new Set([...prev, tip.id]))}
            className="absolute top-2 right-2 p-1 rounded hover:bg-amber-100"
          >
            <X className="w-3.5 h-3.5 text-amber-600" />
          </button>
          <p className="font-semibold text-sm text-amber-900 mb-1">{tip.title}</p>
          <p className="text-xs text-amber-700 mb-2">{tip.text}</p>
          <button className="text-xs font-semibold text-amber-800 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-lg transition">
            {tip.cta}
          </button>
        </div>
      ))}
    </div>
  )
}
