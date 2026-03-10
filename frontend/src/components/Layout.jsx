import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout({ user, onLogout }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto bg-uber-gray-50 p-6">
        <Outlet />
      </main>
    </div>
  )
}
