import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Trips from './pages/Trips'
import TripDetail from './pages/TripDetail'
import Trends from './pages/Trends'
import Goals from './pages/Goals'
import BatchUpload from './pages/BatchUpload'
import Predict from './pages/Predict'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
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
