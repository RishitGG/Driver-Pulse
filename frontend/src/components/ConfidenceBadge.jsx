const levelConfig = {
  low: { bg: 'bg-green-100', text: 'text-green-800', label: 'Low' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Med' },
  high: { bg: 'bg-red-100', text: 'text-red-800', label: 'High' },
}

export default function ConfidenceBadge({ level, score }) {
  const cfg = levelConfig[level] || levelConfig.low
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
      {score !== undefined && <span className="font-mono">{Math.round(score * 100)}%</span>}
    </span>
  )
}
