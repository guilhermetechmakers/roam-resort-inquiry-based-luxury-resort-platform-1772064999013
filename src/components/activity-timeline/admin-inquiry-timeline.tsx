import { useMemo, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useActivities } from '@/hooks/use-activities'
import { TimelineList } from './timeline-list'
import { buildTimelineEvents } from '@/api/admin-inquiry-detail'
import type { Inquiry, ActivityFilters } from '@/types'
import type { AdminInquiryDetailNote, AdminInquiryPayment } from '@/types/admin'
import type { Activity } from '@/types'
import type { LegacyTimelineEvent } from './timeline-card'
import { cn } from '@/lib/utils'

/** Convert AdminTimelineEvent to Activity-like shape for TimelineCard */
function legacyToActivity(
  evt: { id: string; inquiryId: string; type: string; description: string; createdAt: string; authorName?: string }
): LegacyTimelineEvent {
  return {
    id: evt.id,
    inquiryId: evt.inquiryId,
    type: evt.type,
    description: evt.description,
    createdAt: evt.createdAt,
    authorName: evt.authorName,
  }
}

export interface AdminInquiryTimelineProps {
  inquiryId: string
  inquiry: Inquiry | null
  notes: AdminInquiryDetailNote[]
  payments: AdminInquiryPayment[]
  activityLog: Array<{ id: string; action: string; performed_by_role?: string; note?: string; created_at: string }>
  className?: string
}

/** Admin timeline: activities table primary, legacy events as fallback */
export function AdminInquiryTimeline({
  inquiryId,
  inquiry,
  notes,
  payments,
  activityLog,
  className,
}: AdminInquiryTimelineProps) {
  const [filters, setFilters] = useState<ActivityFilters>({})

  const { data: activitiesData, isLoading } = useActivities({
    inquiryId,
    limit: 50,
    offset: 0,
    filters,
    includeInternal: true,
  })

  const mergedActivities = useMemo(() => {
    const activities = activitiesData?.activities ?? []
    if (activities.length > 0) {
      return activities as (Activity | LegacyTimelineEvent)[]
    }
    const legacy = buildTimelineEvents(inquiry ?? null, notes ?? [], payments ?? [], activityLog ?? [])
    return legacy.map(legacyToActivity)
  }, [activitiesData?.activities, inquiry, notes, payments, activityLog])

  const hasActivitiesFromTable = (activitiesData?.activities ?? []).length > 0

  const handleFiltersChange = useCallback((newFilters: ActivityFilters) => {
    setFilters(newFilters)
  }, [])

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
          activities={mergedActivities}
          total={mergedActivities.length}
          isLoading={isLoading}
          hasMore={false}
          filters={hasActivitiesFromTable ? filters : undefined}
          onFiltersChange={hasActivitiesFromTable ? handleFiltersChange : undefined}
          showInternalToggle={true}
          emptyMessage="No activity yet"
        />
      </CardContent>
    </Card>
  )
}
