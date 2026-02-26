import { type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  isLoading?: boolean
  variant?: 'default' | 'accent' | 'muted'
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isLoading,
  variant = 'default',
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-accent/30',
        variant === 'accent' && 'border-accent/40 bg-gradient-to-br from-accent/5 to-transparent',
        variant === 'muted' && 'bg-muted/30',
        className
      )}
      role="region"
      aria-label={title}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {Icon && (
          <Icon
            className={cn(
              'h-5 w-5',
              variant === 'accent' ? 'text-accent' : 'text-muted-foreground'
            )}
            aria-hidden
          />
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <span className="font-serif text-2xl font-bold text-foreground">
              {value}
            </span>
            {subtitle != null && subtitle !== '' && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
