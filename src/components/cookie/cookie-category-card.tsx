import { Shield, BarChart3, Megaphone } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { CookieCategory } from '@/types/cookie'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  essential: Shield,
  analytics: BarChart3,
  marketing: Megaphone,
}

export interface CookieCategoryCardProps {
  category: CookieCategory
  enabled: boolean
  onToggle?: (categoryId: string, enabled: boolean) => void
  className?: string
  style?: React.CSSProperties
}

export function CookieCategoryCard({
  category,
  enabled,
  onToggle,
  className,
  style,
}: CookieCategoryCardProps) {
  const { id, name, description, required } = category ?? {}
  const Icon = id ? (CATEGORY_ICONS[id] ?? Shield) : Shield

  const handleToggle = (checked: boolean) => {
    if (required) return
    onToggle?.(id ?? '', checked)
  }

  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:shadow-card-hover hover:border-accent/30',
        className
      )}
      style={style}
      aria-labelledby={`cookie-category-${id}-heading`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3
                id={`cookie-category-${id}-heading`}
                className="font-serif text-xl font-semibold text-foreground"
              >
                {name}
              </h3>
              {required ? (
                <span className="mt-1 inline-block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Always active
                </span>
              ) : null}
            </div>
          </div>
          {!required ? (
            <Switch
              id={`cookie-toggle-${id}`}
              checked={enabled}
              onCheckedChange={handleToggle}
              aria-label={`Enable or disable ${name}`}
              aria-describedby={`cookie-desc-${id}`}
            />
          ) : (
            <div
              className="flex h-6 w-11 shrink-0 items-center rounded-full bg-accent/30 px-1"
              role="img"
              aria-label={`${name} is always enabled`}
            >
              <div className="h-5 w-5 rounded-full bg-accent" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p
          id={`cookie-desc-${id}`}
          className="text-foreground/90 leading-relaxed"
        >
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
