// NOTE: Illustrative test only – runner not wired.
// Shows intended behaviour for adding trips vs goals aggregation.

import { isValidTimeRange } from '../utils/sanityChecks'

// Minimal shapes copied from backend logic for explanation purposes only.
const TODAY = '2026-03-08'

function goalsFromTrips(trips, goals) {
  const todayTrips = trips.filter(t => t.date === TODAY)
  const current_earnings = todayTrips.reduce((sum, t) => sum + (t.fare || 0), 0)
  const current_hours = todayTrips.reduce((sum, t) => sum + (t.duration_min || 0), 0) / 60

  return {
    ...goals,
    current_earnings,
    current_hours,
  }
}

// Pseudo-test: adding a trip on a non-today date should NOT affect today's goals.
function exampleTripBehaviour() {
  const baseGoals = { daily_target: 1800, current_earnings: 1000, current_hours: 5 }

  const trips = [
    { id: 't1', date: TODAY, fare: 500, duration_min: 30 },
    { id: 't2', date: TODAY, fare: 500, duration_min: 30 },
  ]

  const withTodayGoals = goalsFromTrips(trips, baseGoals)

  const newTripOtherDay = { id: 't3', date: '2026-03-07', fare: 400, duration_min: 40 }
  const withOtherDayTripGoals = goalsFromTrips([...trips, newTripOtherDay], baseGoals)

  // In a real test you might assert:
  // expect(withOtherDayTripGoals.current_earnings).toBe(withTodayGoals.current_earnings)
  // expect(withOtherDayTripGoals.current_hours).toBe(withTodayGoals.current_hours)

  return { withTodayGoals, withOtherDayTripGoals }
}

export { isValidTimeRange, goalsFromTrips, exampleTripBehaviour }

