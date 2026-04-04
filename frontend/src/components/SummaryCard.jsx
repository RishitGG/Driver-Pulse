export default function SummaryCard({ icon: Icon, label, value, sub, color = 'text-indigo-400' }) {
  return (
    <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-5 shadow-lg shadow-black/20 border border-white/5 flex items-start gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
      <div className={`p-3 rounded-xl bg-slate-900/50 border border-white/5 group-hover:scale-110 transition-transform ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[13px] text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-bold mt-0.5 text-slate-100 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
