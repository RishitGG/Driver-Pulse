import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout({ user, onLogout }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 relative">
        <Outlet />
      </main>
    </div>
  )
}
