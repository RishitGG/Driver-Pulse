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
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-uber-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Home onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={handleLogout} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/:tripId" element={<TripDetail />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/batch" element={<BatchUpload />} />
      </Route>
    </Routes>
  )
}
