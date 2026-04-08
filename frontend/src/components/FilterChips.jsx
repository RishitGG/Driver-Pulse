const presets = [
  { key: 'high_stress', label: 'High Stress', emoji: '🔴' },
  { key: 'high_earnings', label: 'High Earnings', emoji: '💰' },
  { key: 'night', label: 'Night Trips', emoji: '🌙' },
  { key: 'short', label: 'Short Trips', emoji: '⚡' },
]

export default function FilterChips({ active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map(p => (
        <button
          key={p.key}
          onClick={() => onSelect(active === p.key ? null : p.key)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-300 border shadow-md
            ${active === p.key
              ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] transform -translate-y-0.5'
              : 'bg-slate-800/60 backdrop-blur-md text-slate-300 border-white/10 hover:border-indigo-400/50 hover:bg-slate-700/80 hover:text-white'
            }`}
        >
          <span>{p.emoji}</span>
          {p.label}
        </button>
      ))}
    </div>
  )
}
