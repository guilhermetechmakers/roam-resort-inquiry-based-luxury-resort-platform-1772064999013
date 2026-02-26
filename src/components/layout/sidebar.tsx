import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SidebarLink } from './sidebar-links'

const STORAGE_KEY_COLLAPSED = 'roam-sidebar-collapsed'

function loadCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_COLLAPSED) === 'true'
  } catch {
    return false
  }
}

interface SidebarProps {
  links: SidebarLink[]
  title?: string
  className?: string
}

export function Sidebar({ links, title = 'Dashboard', className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(loadCollapsedPreference)
  const location = useLocation()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(collapsed))
    } catch {
      // ignore
    }
  }, [collapsed])

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
