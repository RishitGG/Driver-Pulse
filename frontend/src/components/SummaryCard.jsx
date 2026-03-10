export default function SummaryCard({ icon: Icon, label, value, sub, color = 'text-uber-black' }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-uber-gray-100 flex items-start gap-4">
      <div className={`p-3 rounded-lg bg-uber-gray-50 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-uber-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-uber-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
