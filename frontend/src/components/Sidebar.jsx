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
    <aside className="w-64 bg-slate-900/40 backdrop-blur-xl text-white flex flex-col shrink-0 border-r border-slate-800 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <Activity className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">DriveIntel</span>
      </div>

      {/* User Profile */}
      {user && (
        <div className="px-6 py-5 border-b border-white/5 bg-slate-800/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[15px] font-semibold truncate text-slate-100">{user.name}</p>
              <p className="text-[13px] text-slate-400 truncate">@{user.username}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-amber-400 font-medium">
                <Star className="w-3.5 h-3.5 fill-current drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
                <span>{user.rating}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 text-[13px] text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-white/5">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-300" />
              <span>{user.vehicle_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-300" />
              <span>{user.city}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 border border-white/10 rounded-xl" />
                )}
                {/* Active left glowing bar */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,1)] rounded-r" />
                )}
                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-300'}`} />
                <span className="relative z-10">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-5 border-t border-white/5 bg-slate-900/40">
        <button
          onClick={onLogout}
          className="group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Logout
        </button>
      </div>
    </aside>
  )
}