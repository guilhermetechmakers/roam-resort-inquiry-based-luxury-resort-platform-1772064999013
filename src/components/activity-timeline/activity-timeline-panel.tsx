import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useActivities } from '@/hooks/use-activities'
import { TimelineList } from './timeline-list'
import type { ActivityFilters } from '@/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

export interface ActivityTimelinePanelProps {
  inquiryId: string
  /** When true (staff), internal activities are included */
  includeInternal?: boolean
  showFilters?: boolean
  emptyMessage?: string
  className?: string
}

export function ActivityTimelinePanel({
  inquiryId,
  includeInternal = false,
  showFilters = true,
  emptyMessage,
  className,
}: ActivityTimelinePanelProps) {
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState<ActivityFilters>({})

  const { data, isLoading, isError, error, refetch } = useActivities({
    inquiryId,
    limit: PAGE_SIZE,
    offset,
    filters,
    includeInternal,
  })

  const activities = data?.activities ?? []
  const total = data?.total ?? 0
  const hasMore = activities.length < total

  const handleLoadMore = useCallback(() => {
    setOffset((prev) => prev + PAGE_SIZE)
  }, [])

  const handleFiltersChange = useCallback((newFilters: ActivityFilters) => {
    setFilters(newFilters)
    setOffset(0)
  }, [])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader>
        <h3 className="font-serif text-lg font-semibold">Activity timeline</h3>
        <p className="text-sm text-muted-foreground">
          Chronological feed of events and updates
        </p>
      </CardHeader>
      <CardContent>
        <TimelineList
          activities={activities}
          total={total}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={handleRetry}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          filters={showFilters ? filters : undefined}
          onFiltersChange={showFilters ? handleFiltersChange : undefined}
          showInternalToggle={includeInternal}
          emptyMessage={emptyMessage}
        />
      </CardContent>
    </Card>
  )
}
