import { useNavigate } from 'react-router-dom'

const stressColors = {
  low: 'bg-uber-green/20 border-uber-green',
  medium: 'bg-uber-yellow/20 border-uber-yellow',
  high: 'bg-uber-red/20 border-uber-red',
}

export default function TodayTimeline({ trips }) {
  const navigate = useNavigate()
  if (!trips || trips.length === 0) return null

  const minH = Math.min(...trips.map(t => new Date(t.start_time).getHours()))
  const maxH = Math.max(...trips.map(t => new Date(t.end_time).getHours())) + 1
  const span = Math.max(maxH - minH, 1)

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-uber-gray-100">
      <h3 className="text-sm font-semibold text-uber-gray-700 mb-4">Today Timeline</h3>

      {/* Hour labels */}
      <div className="relative h-20">
        <div className="absolute inset-x-0 top-0 flex justify-between text-[10px] text-uber-gray-400 px-1">
          {Array.from({ length: span + 1 }, (_, i) => {
            const h = minH + i
            return <span key={h}>{h % 12 || 12}{h < 12 ? 'a' : 'p'}</span>
          })}
        </div>

        {/* Track */}
        <div className="absolute inset-x-0 top-6 h-10 bg-uber-gray-100 rounded-lg">
          {trips.map((t) => {
            const startH = new Date(t.start_time).getHours() + new Date(t.start_time).getMinutes() / 60
            const endH = new Date(t.end_time).getHours() + new Date(t.end_time).getMinutes() / 60
            const left = ((startH - minH) / span) * 100
            const width = Math.max(((endH - startH) / span) * 100, 2)

            return (
              <button
                key={t.id}
                onClick={() => navigate(`/trips/${t.id}`)}
                title={`${t.id} — ₹${t.fare} — ${t.stress_level} stress`}
                className={`absolute top-1 h-8 rounded-md border-2 cursor-pointer
                  transition-transform hover:scale-105 hover:z-10
                  ${stressColors[t.stress_level] || 'bg-uber-gray-200 border-uber-gray-300'}`}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            )
          })}
        </div>
      </div>

      <div className="flex gap-4 mt-2 text-[10px] text-uber-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-uber-green/30 border border-uber-green" /> Low</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-uber-yellow/30 border border-uber-yellow" /> Medium</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-uber-red/30 border border-uber-red" /> High</span>
      </div>
    </div>
  )
}
