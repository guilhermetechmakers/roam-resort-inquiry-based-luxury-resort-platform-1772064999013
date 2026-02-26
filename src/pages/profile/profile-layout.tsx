import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ProfileSidebar } from '@/components/profile'

export function ProfileLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex flex-1 min-h-0">
      <ProfileSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  )
}
