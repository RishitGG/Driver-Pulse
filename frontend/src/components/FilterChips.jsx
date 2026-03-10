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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
            ${active === p.key
              ? 'bg-uber-black text-white border-uber-black'
              : 'bg-white text-uber-gray-700 border-uber-gray-200 hover:border-uber-gray-400'
            }`}
        >
          <span>{p.emoji}</span>
          {p.label}
        </button>
      ))}
    </div>
  )
}
