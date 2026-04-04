import { useNavigate } from 'react-router-dom'

const stressColors = {
  low: 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
  medium: 'bg-amber-500/20 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
  high: 'bg-rose-500/20 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
}

export default function TodayTimeline({ trips }) {
  const navigate = useNavigate()
  if (!trips || trips.length === 0) return null

  const minH = Math.min(...trips.map(t => new Date(t.start_time).getHours()))
  const maxH = Math.max(...trips.map(t => new Date(t.end_time).getHours())) + 1
  const span = Math.max(maxH - minH, 1)

  return (
    <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 shadow-lg shadow-black/20 border border-white/5">
      <h3 className="text-[15px] font-bold text-slate-200 mb-5">Today Timeline</h3>

      {/* Hour labels */}
      <div className="relative h-20">
        <div className="absolute inset-x-0 top-0 flex justify-between text-[11px] font-medium text-slate-500 px-1">
          {Array.from({ length: span + 1 }, (_, i) => {
            const h = minH + i
            return <span key={h}>{h % 12 || 12}{h < 12 ? 'a' : 'p'}</span>
          })}
        </div>

        {/* Track */}
        <div className="absolute inset-x-0 top-6 h-10 bg-slate-900/50 rounded-xl border border-white/5">
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
                className={`absolute top-1 h-8 rounded-lg border cursor-pointer
                  transition-all duration-300 hover:scale-y-110 hover:brightness-125 hover:z-10 hover:shadow-lg
                  ${stressColors[t.stress_level] || 'bg-slate-700/50 border-slate-600'}`}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            )
          })}
        </div>
      </div>

      <div className="flex gap-5 mt-4 text-[11px] font-medium text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]" /> Low</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]" /> Medium</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-rose-500/20 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]" /> High</span>
      </div>
    </div>
  )
}
