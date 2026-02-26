import { type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ShortcutItem {
  label: string
  icon: LucideIcon
  onClick?: () => void
  href?: string
  ariaLabel?: string
}

export interface ShortcutsPanelProps {
  items: ShortcutItem[]
  className?: string
}

export function ShortcutsPanel({ items, className }: ShortcutsPanelProps) {
  const list = items ?? []
  return (
    <div
      className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
      role="navigation"
      aria-label="Quick actions"
    >
      {list.map((item) => {
        const Icon = item.icon
        const content = (
          <>
            <Card className="cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] hover:border-accent/40 bg-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <span className="font-medium">{item.label}</span>
              </CardContent>
            </Card>
          </>
        )
        if (item.href) {
          return (
            <Link
              key={item.label}
              to={item.href}
              className="block"
              aria-label={item.ariaLabel ?? item.label}
            >
              {content}
            </Link>
          )
        }
        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            aria-label={item.ariaLabel ?? item.label}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
