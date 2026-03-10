import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MapPin, TrendingUp, Target, Activity, Upload, PenLine, LogOut, User, Star, Truck } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trips', label: 'Trips', icon: MapPin },
  { to: '/trends', label: 'Trends', icon: TrendingUp },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/predict', label: 'Predict', icon: PenLine },
  { to: '/batch', label: 'Batch Upload', icon: Upload },
]

export default function Sidebar({ user, onLogout }) {
  return (
    <aside className="w-64 bg-uber-black text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-uber-gray-800">
        <Activity className="w-7 h-7 text-uber-green" />
        <span className="text-xl font-bold tracking-tight">DrivePulse</span>
      </div>

      {/* User Profile */}
      {user && (
        <div className="px-6 py-4 border-b border-uber-gray-800 bg-uber-gray-800/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-uber-blue flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-uber-gray-400 truncate">@{user.username}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-yellow-400">
                <Star className="w-3 h-3 fill-current" />
                <span>{user.rating}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs text-uber-gray-300">
            <div className="flex items-center gap-2">
              <Truck className="w-3 h-3" />
              <span>{user.vehicle_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{user.city}</span>
            </div>
          </div>
        </div>
      )}

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

      {/* Logout */}
      <div className="px-3 py-4 border-t border-uber-gray-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-uber-gray-400 hover:text-white hover:bg-uber-gray-800/50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-uber-gray-800 text-xs text-uber-gray-500 text-center">
        DrivePulse v1.0 &middot; 2026
      </div>
    </aside>
  )
}
