import { useState, useCallback } from 'react'
import { Activity, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TimelineCard } from './timeline-card'
import { TimelineFilters } from './timeline-filters'
import type { Activity as ActivityType, ActivityFilters as ActivityFiltersType } from '@/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

export interface TimelineListProps {
  activities: ActivityType[]
  total: number
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  filters?: ActivityFiltersType
  onFiltersChange?: (filters: ActivityFiltersType) => void
  showInternalToggle?: boolean
  emptyMessage?: string
  className?: string
}

export function TimelineList({
  activities,
  total,
  isLoading,
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
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading activity...</p>
        </div>
      ) : safeActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Activity className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-medium">{emptyMessage}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Status changes, notes, and payments will appear here.
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
