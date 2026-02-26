import { Activity, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TimelineCard } from './timeline-card'
import { TimelineFilters } from './timeline-filters'
import type { Activity as ActivityType, ActivityFilters as ActivityFiltersType } from '@/types'
import type { LegacyTimelineEvent } from './timeline-card'
import { cn } from '@/lib/utils'

export interface TimelineListProps {
  activities: (ActivityType | LegacyTimelineEvent)[]
  total?: number
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onRetry?: () => void
  hasMore?: boolean
  onLoadMore?: () => void
  filters?: ActivityFiltersType
  onFiltersChange?: (filters: ActivityFiltersType) => void
  showInternalToggle?: boolean
  emptyMessage?: string
  className?: string
}

function TimelineListSkeleton() {
  return (
    <ul className="space-y-4" role="list" aria-label="Loading activity timeline">
      {[1, 2, 3, 4].map((i) => (
        <li key={i} className="flex gap-4 rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full max-w-[280px]" />
            <Skeleton className="h-3 w-32" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function TimelineList({
  activities,
  isLoading,
  isError = false,
  error,
  onRetry,
  hasMore = false,
  onLoadMore,
  filters,
  onFiltersChange,
  showInternalToggle = true,
  emptyMessage = 'No activity yet',
  className,
}: TimelineListProps) {
  const safeActivities = Array.isArray(activities) ? activities : []

  return (
    <div className={cn('space-y-4', className)}>
      {onFiltersChange && filters && (
        <TimelineFilters
          filters={filters}
          onChange={onFiltersChange}
          showInternalToggle={showInternalToggle}
        />
      )}

      {isLoading ? (
        <TimelineListSkeleton />
      ) : isError ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 px-4 sm:py-16"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-12 w-12 text-destructive/80" aria-hidden />
          <h4 className="mt-4 font-serif text-lg font-semibold text-foreground">
            Unable to load activity
          </h4>
          <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
            {error?.message ?? 'Something went wrong. Please try again.'}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-6 border-accent/40 hover:border-accent hover:bg-accent/10"
              aria-label="Retry loading activity"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          )}
        </div>
      ) : safeActivities.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12 px-4 sm:py-16"
          role="status"
          aria-label="No activity"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/5">
            <Activity className="h-7 w-7 text-accent" aria-hidden />
          </div>
          <h4 className="mt-4 font-serif text-lg font-semibold text-foreground">
            {emptyMessage}
          </h4>
          <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
            Status changes, notes, and payments will appear here as they occur.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-4" role="list" aria-label="Activity timeline">
            {safeActivities.map((activity) => (
              <li key={activity.id}>
                <TimelineCard activity={activity} />
              </li>
            ))}
          </ul>

          {hasMore && onLoadMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="transition-all hover:scale-[1.02]"
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
