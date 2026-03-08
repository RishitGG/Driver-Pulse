import { useState, useEffect } from 'react'
import { api } from '../api/client'
import EarningsProgress from '../components/EarningsProgress'
import StressTips from '../components/StressTips'
import { Target, Save, CheckCircle } from 'lucide-react'

export default function Goals() {
  const [goals, setGoals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [targetInput, setTargetInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getGoals()
      .then(g => {
        setGoals(g)
        setTargetInput(g.daily_target)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.setGoal(Number(targetInput))
      setGoals(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Failed to save goal')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-uber-black border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Personalization & Goals</h1>

      {/* Set target */}
      <div className="bg-white rounded-xl p-6 border border-uber-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-uber-blue" />
          <h3 className="text-sm font-semibold text-uber-gray-700">Daily Earnings Target</h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-uber-gray-400 text-sm">₹</span>
            <input
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-uber-gray-200 rounded-lg text-lg font-semibold outline-none focus:border-uber-blue transition"
              placeholder="1800"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-colors
              ${saved
                ? 'bg-uber-green text-white'
                : 'bg-uber-black text-white hover:bg-uber-gray-800'
              } disabled:opacity-50`}
          >
            {saved ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Target'}</>
            )}
          </button>
        </div>

        <p className="text-xs text-uber-gray-400 mt-2">
          Set your daily earnings target. Your progress will be tracked in real-time on the dashboard.
        </p>
      </div>

      {/* Current progress */}
      <EarningsProgress goals={goals} />

      {/* Goal milestones */}
      {goals && (
        <div className="bg-white rounded-xl p-6 border border-uber-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-uber-gray-700 mb-4">Today&apos;s Progress</h3>
          <div className="space-y-4">
            {[25, 50, 75, 100].map(pct => {
              const amount = Math.round(goals.daily_target * pct / 100)
              const reached = goals.current_earnings >= amount
              return (
                <div key={pct} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    reached ? 'bg-uber-green text-white' : 'bg-uber-gray-100 text-uber-gray-400'
                  }`}>
                    {reached ? '✓' : `${pct}%`}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${reached ? 'text-uber-gray-700' : 'text-uber-gray-400'}`}>
                      ₹{amount.toLocaleString()} milestone
                    </p>
                  </div>
                  <span className={`text-xs ${reached ? 'text-uber-green font-semibold' : 'text-uber-gray-300'}`}>
                    {reached ? 'Reached' : 'Pending'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stress tips */}
      <StressTips />
    </div>
  )
}
