import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MapPin, TrendingUp, Target, Activity, Upload, PenLine } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trips', label: 'Trips', icon: MapPin },
  { to: '/trends', label: 'Trends', icon: TrendingUp },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/predict', label: 'Predict', icon: PenLine },
  { to: '/batch', label: 'Batch Upload', icon: Upload },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-uber-black text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-uber-gray-800">
        <Activity className="w-7 h-7 text-uber-green" />
        <span className="text-xl font-bold tracking-tight">DrivePulse</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-uber-gray-800 text-white'
                  : 'text-uber-gray-400 hover:text-white hover:bg-uber-gray-800/50'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-uber-gray-800 text-xs text-uber-gray-500">
        DrivePulse v1.0 &middot; Hackathon 2026
      </div>
    </aside>
  )
}
