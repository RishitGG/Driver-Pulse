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
      color: 'text-uber-red'
    },
    {
      key: 'smooth_acceleration',
      title: 'Practice Smooth Acceleration',
      description: 'Focus on gradual acceleration and braking patterns',
      icon: TrendingUp,
      color: 'text-uber-orange'
    },
    {
      key: 'avoid_peak_hours',
      title: 'Avoid Peak Traffic Hours',
      description: 'Drive during off-peak times when possible',
      icon: Shield,
      color: 'text-uber-green'
    },
    {
      key: 'defensive_driving',
      title: 'Practice Defensive Driving',
      description: 'Anticipate hazards and maintain safe distances',
      icon: Shield,
      color: 'text-uber-blue'
    },
    {
      key: 'improve_focus',
      title: 'Minimize Distractions',
      description: 'Keep phone usage low and stay focused on the road',
      icon: Lightbulb,
      color: 'text-uber-purple'
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Safety Goals & Improvements</h1>
        <p className="text-sm text-uber-gray-500 mt-1">Track your progress toward becoming a safer driver</p>
      </div>

      {/* Safety Goals */}
      <div className="bg-white rounded-xl p-6 border border-uber-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-uber-green" />
          <h3 className="text-sm font-semibold text-uber-gray-700">Your Safety Goals</h3>
        </div>

        <div className="space-y-3">
          {goalsList.map((goal) => {
            const Icon = goal.icon
            const isChecked = safetyGoals[goal.key]
            return (
              <button
                key={goal.key}
                onClick={() => handleGoalToggle(goal.key)}
                className="w-full text-left p-4 border border-uber-gray-200 rounded-lg hover:bg-uber-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-uber-green" />
                    ) : (
                      <Circle className="w-5 h-5 text-uber-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${isChecked ? 'text-uber-gray-900' : 'text-uber-gray-700'}`}>
                      {goal.title}
                    </p>
                    <p className="text-xs text-uber-gray-500 mt-1">
                      {goal.description}
                    </p>
                  </div>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${goal.color}`} />
                </div>
              </button>
            )
          })}
        </div>

        {saved && (
          <div className="mt-4 p-3 bg-uber-green/10 text-uber-green text-sm rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Goals saved!
          </div>
        )}
      </div>

      {/* Progress Summary */}
      {goals && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-uber-green/10 to-uber-blue/10 rounded-xl p-4 border border-uber-green/20">
            <p className="text-xs text-uber-gray-600 font-medium">Safety Score</p>
            <p className="text-2xl font-bold text-uber-green mt-1">
              {Math.max(0, 100 - (goals.stress_events || 0) * 5)}%
            </p>
            <p className="text-xs text-uber-gray-500 mt-2">Based on stress events this week</p>
          </div>
          <div className="bg-gradient-to-br from-uber-blue/10 to-uber-purple/10 rounded-xl p-4 border border-uber-blue/20">
            <p className="text-xs text-uber-gray-600 font-medium">Active Goals</p>
            <p className="text-2xl font-bold text-uber-blue mt-1">
              {Object.values(safetyGoals).filter(Boolean).length} / {Object.keys(safetyGoals).length}
            </p>
            <p className="text-xs text-uber-gray-500 mt-2">You're working on these improvements</p>
          </div>
        </div>
      )}

      {/* Stress tips */}
      <StressTips />
    </div>
  )
}
