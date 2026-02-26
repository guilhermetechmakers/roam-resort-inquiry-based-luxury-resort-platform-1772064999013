import { Link, useLocation } from 'react-router-dom'
import {
  User,
  FileText,
  History,
  Shield,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProfileSection =
  | 'overview'
  | 'inquiries'
  | 'history'
  | 'sessions'
  | 'notifications'
  | 'settings'

interface ProfileSidebarLink {
  to: string
  section: ProfileSection
  label: string
  icon: React.ReactNode
}

const profileLinks: ProfileSidebarLink[] = [
  { to: '/profile', section: 'overview', label: 'Overview', icon: <User className="h-5 w-5" /> },
  { to: '/profile/inquiries', section: 'inquiries', label: 'Inquiries', icon: <FileText className="h-5 w-5" /> },
  { to: '/profile/history', section: 'history', label: 'Transaction history', icon: <History className="h-5 w-5" /> },
  { to: '/profile/sessions', section: 'sessions', label: 'Sessions', icon: <Shield className="h-5 w-5" /> },
  { to: '/profile/notifications', section: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  { to: '/profile/settings', section: 'settings', label: 'Account', icon: <Settings className="h-5 w-5" /> },
]

export interface ProfileSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function ProfileSidebar({ collapsed, onToggle }: ProfileSidebarProps) {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <h2 className="font-serif text-lg font-semibold">My account</h2>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md p-2 hover:bg-secondary transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {profileLinks.map(({ to, label, icon }) => {
          const isActive =
            pathname === to || (to !== '/profile' && pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <span className="shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
