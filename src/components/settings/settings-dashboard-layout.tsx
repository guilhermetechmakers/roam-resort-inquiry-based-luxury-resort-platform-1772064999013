import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SettingsDashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Settings', to: '/settings' },
]

export function SettingsDashboardLayout({ children, className }: SettingsDashboardLayoutProps) {
  return (
    <div className={cn('min-h-screen', className)}>
      <header className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {(breadcrumbItems ?? []).map((item, i) => (
                <li key={item.to} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="h-4 w-4" />}
                  <Link
                    to={item.to}
                    className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Settings & Preferences
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your profile, notifications, security, and privacy
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          {children}
        </div>
      </div>
    </div>
  )
}
