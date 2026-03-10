export default function EarningsProgress({ goals }) {
  if (!goals) return null

  const currentEarnings = Number(goals.current_earnings || 0)
  const dailyTarget = Number(goals.daily_target || 0)
  const safeTarget = dailyTarget > 0 ? dailyTarget : 0
  const pct = safeTarget > 0
    ? Math.min(100, Math.round((currentEarnings / safeTarget) * 100))
    : 0

  const statusColor = {
    ahead: 'text-uber-green',
    on_track: 'text-uber-blue',
    at_risk: 'text-uber-red',
  }[goals.forecast_status] || 'text-uber-gray-500'

  const prettyStatus =
    typeof goals.forecast_status === 'string'
      ? goals.forecast_status.replace('_', ' ')
      : 'on track'

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-uber-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-uber-gray-700">Daily Earnings Target</h3>
        <span className={`text-xs font-semibold uppercase ${statusColor}`}>
          {goals.forecast_status?.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold">₹{currentEarnings.toLocaleString()}</span>
        <span className="text-uber-gray-400 text-sm mb-1">/ ₹{safeTarget.toLocaleString()}</span>
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
        <span>₹{Math.max(0, safeTarget - currentEarnings).toLocaleString()} remaining</span>
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
          <p className="text-lg font-bold">
            {Number.isFinite(goals.goal_probability)
              ? Math.round(goals.goal_probability * 100)
              : 0}
            %
          </p>
          <p className="text-[10px] text-uber-gray-400">Probability</p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-uber-gray-100">
        <div className="text-center">
          <p className="text-xs text-uber-gray-500 font-medium mb-1">Remaining</p>
          <p className="text-lg font-bold text-uber-orange">₹{Math.max(0, safeTarget - currentEarnings).toLocaleString()}</p>
          <p className="text-[10px] text-uber-gray-400 mt-1">to reach target</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-uber-gray-500 font-medium mb-1">Time Worked</p>
          <p className="text-lg font-bold">{goals.current_hours}h</p>
          <p className="text-[10px] text-uber-gray-400 mt-1">of {goals.target_hours}h target</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-uber-gray-500 font-medium mb-1">Trips Today</p>
          <p className="text-lg font-bold">{goals.trips_completed}</p>
          <p className="text-[10px] text-uber-gray-400 mt-1">completed</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-uber-gray-500 font-medium mb-1">Status</p>
          <p
            className={`text-lg font-bold ${
              goals.forecast_status === 'ahead'
                ? 'text-uber-green'
                : goals.forecast_status === 'on_track'
                ? 'text-uber-blue'
                : 'text-uber-red'
            }`}
          >
            {prettyStatus.charAt(0).toUpperCase() + prettyStatus.slice(1)}
          </p>
          <p className="text-[10px] text-uber-gray-400 mt-1">today's pace</p>
        </div>
      </div>
    </div>
  )
}
