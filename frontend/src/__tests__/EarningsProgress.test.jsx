// NOTE: Illustrative test only – runner not wired.
// Shows how EarningsProgress could be tested with a real test setup.

import EarningsProgress from '../components/EarningsProgress'

const mockGoals = {
  daily_target: 1800,
  current_earnings: 900,
  current_velocity: 200,
  required_velocity: 225,
  goal_probability: 0.75,
  current_hours: 4.5,
  target_hours: 10,
  trips_completed: 6,
  forecast_status: 'on_track',
}

// Pseudo-test demonstrating expected derived values.
function exampleUsage() {
  const pct = Math.round((mockGoals.current_earnings / mockGoals.daily_target) * 100)
  const remaining = mockGoals.daily_target - mockGoals.current_earnings

  // In a real test you might assert:
  // expect(screen.getByText(`₹${mockGoals.current_earnings.toLocaleString()}`)).toBeInTheDocument()
  // expect(screen.getByText(`${pct}% achieved`)).toBeInTheDocument()
  // expect(screen.getByText(`₹${remaining.toLocaleString()} remaining`)).toBeInTheDocument()

  return { pct, remaining }
}

export { EarningsProgress, mockGoals, exampleUsage }

