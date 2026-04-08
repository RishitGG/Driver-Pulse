import { useState, useEffect } from 'react'
import { api } from '../api/client'
import StressTips from '../components/StressTips'
import { Shield, CheckCircle2, Circle, AlertCircle, TrendingUp, Lightbulb } from 'lucide-react'

export default function Goals() {
  const [goals, setGoals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [safetyGoals, setSafetyGoals] = useState({
    reduce_stress_events: false,
    smooth_acceleration: false,
    avoid_peak_hours: false,
    defensive_driving: false,
    improve_focus: false,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getGoals()
      .then(g => {
        setGoals(g)
        // Load persisted goals if available
        const persisted = localStorage.getItem('safetyGoals')
        if (persisted) {
          setSafetyGoals(JSON.parse(persisted))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleGoalToggle = (key) => {
    const updated = { ...safetyGoals, [key]: !safetyGoals[key] }
    setSafetyGoals(updated)
    localStorage.setItem('safetyGoals', JSON.stringify(updated))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const goalsList = [
    {
      key: 'reduce_stress_events',
      title: 'Reduce High-Stress Events',
      description: 'Aim to reduce aggressive driving incidents by 50%',
      icon: AlertCircle,
      color: 'text-amber-400'
    },
    {
      key: 'smooth_acceleration',
      title: 'Practice Smooth Acceleration',
      description: 'Focus on gradual acceleration and braking patterns',
      icon: TrendingUp,
      color: 'text-indigo-400'
    },
    {
      key: 'avoid_peak_hours',
      title: 'Avoid Peak Traffic Hours',
      description: 'Drive during off-peak times when possible',
      icon: Shield,
      color: 'text-emerald-400'
    },
    {
      key: 'defensive_driving',
      title: 'Practice Defensive Driving',
      description: 'Anticipate hazards and maintain safe distances',
      icon: Shield,
      color: 'text-blue-400'
    },
    {
      key: 'improve_focus',
      title: 'Minimize Distractions',
      description: 'Keep phone usage low and stay focused on the road',
      icon: Lightbulb,
      color: 'text-purple-400'
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-uber-black border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Safety Goals & Improvements</h1>
        <p className="text-[15px] text-slate-400 mt-1">Track your progress toward becoming a safer driver</p>
      </div>

      {/* Safety Goals */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-emerald-400" />
          <h3 className="text-[16px] font-bold text-white tracking-wide">Your Safety Goals</h3>
        </div>

        <div className="space-y-3">
          {goalsList.map((goal) => {
            const Icon = goal.icon
            const isChecked = safetyGoals[goal.key]
            return (
              <button
                key={goal.key}
                onClick={() => handleGoalToggle(goal.key)}
                className={`w-full text-left p-5 border rounded-2xl transition-all duration-300 flex items-start gap-4 shadow-sm ${
                  isChecked 
                  ? 'bg-slate-800/80 border-indigo-500/50 shadow-[0_4px_20px_rgba(99,102,241,0.15)]' 
                  : 'bg-slate-950/40 border-white/5 hover:bg-slate-800/50 hover:border-white/10'
                }`}
              >
                <div className="mt-0.5 transition-transform duration-300">
                  {isChecked ? (
                    <CheckCircle2 className="w-6 h-6 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)] rounded-full animate-in zoom-in" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-[15px] transition-colors ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                    {goal.title}
                  </p>
                  <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                    {goal.description}
                  </p>
                </div>
                <div className={`p-2 rounded-xl border border-white/5 bg-slate-900 ${isChecked ? 'shadow-inner' : ''}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${goal.color}`} />
                </div>
              </button>
            )
          })}
        </div>

        {saved && (
          <div className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[14px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5" />
            Goals saved successfully!
          </div>
        )}
      </div>

      {/* Progress Summary */}
      {goals && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/20 shadow-xl">
            <p className="text-[12px] font-bold tracking-wider uppercase text-emerald-500/80 mb-2">Safety Score</p>
            <p className="text-4xl font-bold text-emerald-400 drop-shadow-md">
              {Math.max(0, 100 - (goals.stress_events || 0) * 5)}%
            </p>
            <p className="text-[13px] text-emerald-200/60 mt-2 font-medium">Based on stress events this week</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl p-6 border border-indigo-500/20 shadow-xl">
            <p className="text-[12px] font-bold tracking-wider uppercase text-indigo-400/80 mb-2">Active Goals</p>
            <p className="text-4xl font-bold text-indigo-400 drop-shadow-md">
              {Object.values(safetyGoals).filter(Boolean).length} <span className="text-2xl text-indigo-500/50">/ {Object.keys(safetyGoals).length}</span>
            </p>
            <p className="text-[13px] text-indigo-200/60 mt-2 font-medium">You're working on these improvements</p>
          </div>
        </div>
      )}

      {/* Stress tips */}
      <StressTips />
    </div>
  )
}
