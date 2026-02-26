import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { ProfileSidebar } from '@/components/profile'

const STORAGE_KEY_PROFILE_SIDEBAR = 'roam-profile-sidebar-collapsed'

function loadCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_PROFILE_SIDEBAR) === 'true'
  } catch {
    return false
  }
}

export function ProfileLayout() {
  const [collapsed, setCollapsed] = useState(loadCollapsedPreference)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE_SIDEBAR, String(collapsed))
    } catch {
      // ignore
    }
  }, [collapsed])

  return (
    <div className="flex flex-1 min-h-0">
      <ProfileSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  )
}
