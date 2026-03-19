import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Trips from './pages/Trips'
import TripDetail from './pages/TripDetail'
import Trends from './pages/Trends'
import Goals from './pages/Goals'
import BatchUpload from './pages/BatchUpload'
import Predict from './pages/Predict'
import Home from './pages/Home'
import AICopilot from './components/AICopilot';

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  // If not logged in, show the Home/Login page
  if (!user) {
    return <Home onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="relative min-h-screen">
      <Routes>
        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:tripId" element={<TripDetail />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/batch" element={<BatchUpload />} />
          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {/* The Floating AI Co-pilot:
          Placing it here ensures it stays on screen as you 
          navigate between Dashboard, Trips, and Goals! 
      */}
      <AICopilot />
    </div>
  )
}