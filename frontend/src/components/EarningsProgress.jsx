export default function EarningsProgress({ goals }) {
  if (!goals) return null
  const pct = Math.min(100, Math.round((goals.current_earnings / goals.daily_target) * 100))

  const statusColor = {
    ahead: 'text-uber-green',
    on_track: 'text-uber-blue',
    at_risk: 'text-uber-red',
  }[goals.forecast_status] || 'text-uber-gray-500'

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-uber-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-uber-gray-700">Daily Earnings Target</h3>
        <span className={`text-xs font-semibold uppercase ${statusColor}`}>
          {goals.forecast_status?.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold">₹{goals.current_earnings.toLocaleString()}</span>
        <span className="text-uber-gray-400 text-sm mb-1">/ ₹{goals.daily_target.toLocaleString()}</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-uber-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-uber-green to-uber-blue transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-uber-gray-400">
        <span>{pct}% achieved</span>
        <span>₹{(goals.daily_target - goals.current_earnings).toLocaleString()} remaining</span>
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-uber-gray-100">
        <div className="text-center">
          <p className="text-lg font-bold">₹{goals.current_velocity}</p>
          <p className="text-[10px] text-uber-gray-400">Current ₹/hr</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">₹{goals.required_velocity}</p>
          <p className="text-[10px] text-uber-gray-400">Required ₹/hr</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{Math.round(goals.goal_probability * 100)}%</p>
          <p className="text-[10px] text-uber-gray-400">Probability</p>
        </div>
      </div>
    </div>
  )
}
