const levelConfig = {
  low: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', label: 'Low' },
  medium: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', label: 'Med' },
  high: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', label: 'High' },
}

export default function ConfidenceBadge({ level, score }) {
  const cfg = levelConfig[level] || levelConfig.low
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] uppercase tracking-wider font-bold shadow-lg ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
      {score !== undefined && <span className="font-mono text-[11px] opacity-90 tracking-normal">{Math.round(score * 100)}%</span>}
    </span>
  )
}
