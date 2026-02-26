import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
  Receipt,
  Bell,
  Shield,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarLink {
  to: string
  label: string
  icon: React.ReactNode
  /** Additional paths that should show this link as active */
  activePaths?: string[]
}

interface SidebarProps {
  links: SidebarLink[]
  title?: string
  className?: string
}

export function Sidebar({ links, title = 'Dashboard', className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <h2 className="font-serif text-lg font-semibold">{title}</h2>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-2 hover:bg-secondary"
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
        {links.map(({ to, label, icon, activePaths }) => {
          const isActive =
            location.pathname === to ||
            location.pathname.startsWith(to + '/') ||
            (Array.isArray(activePaths) &&
              activePaths.some(
                (p) =>
                  location.pathname === p || location.pathname.startsWith(p + '/')
              ))
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

export const hostSidebarLinks: SidebarLink[] = [
  {
    to: '/host/dashboard/listings',
    label: 'Listings',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    to: '/host/listings/new',
    label: 'Create Listing',
    icon: <FileText className="h-5 w-5" />,
    activePaths: ['/host/listings'],
  },
]

export const adminSidebarLinks: SidebarLink[] = [
  { to: '/admin/concierge', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" />, activePaths: ['/admin'] },
  { to: '/admin/inquiries', label: 'Inquiries', icon: <FileText className="h-5 w-5" /> },
  { to: '/admin/exports', label: 'Exports', icon: <FileText className="h-5 w-5" /> },
]

export const profileSidebarLinks: SidebarLink[] = [
  { to: '/profile', label: 'Overview', icon: <User className="h-5 w-5" /> },
  { to: '/profile#inquiries', label: 'My Inquiries', icon: <FileText className="h-5 w-5" /> },
  { to: '/profile#history', label: 'Transaction History', icon: <Receipt className="h-5 w-5" /> },
  { to: '/profile#sessions', label: 'Sessions', icon: <Shield className="h-5 w-5" /> },
  { to: '/profile#notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  { to: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
]
