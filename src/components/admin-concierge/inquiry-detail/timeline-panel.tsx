/**
 * TimelinePanel - Chronological list of events (emails, status changes, notes, payments).
 * Safe iteration with Array.isArray; empty state handled gracefully.
 */

import { Mail, RefreshCw, FileText, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AdminTimelineEvent, AdminTimelineEventType } from '@/types/admin'

export interface TimelinePanelProps {
  events: AdminTimelineEvent[] | null | undefined
  className?: string
}

const EVENT_ICONS: Record<AdminTimelineEventType, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  status: RefreshCw,
  note: FileText,
  payment: CreditCard,
}

const EVENT_LABELS: Record<AdminTimelineEventType, string> = {
  email: 'Email sent',
  status: 'Status update',
  note: 'Internal note',
  payment: 'Payment',
}

export function TimelinePanel({ events, className }: TimelinePanelProps) {
  const safeEvents = Array.isArray(events) ? [...events] : []
  const sorted = safeEvents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-border/50">
        <h3 className="font-serif text-lg font-semibold">Activity Timeline</h3>
      </CardHeader>
      <CardContent className="pt-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">No activity yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Status changes, notes, and payments will appear here
            </p>
          </div>
        ) : (
          <ul className="space-y-0" role="list" aria-label="Activity timeline">
            {sorted.map((event, idx) => {
              const Icon = EVENT_ICONS[event.type] ?? FileText
              const label = EVENT_LABELS[event.type] ?? event.type
              const isLast = idx === sorted.length - 1
              return (
                <li
                  key={event.id}
                  className="relative flex gap-4 pb-6 last:pb-0"
                  role="listitem"
                >
                  {!isLast && (
                    <span
                      className="absolute left-[11px] top-8 h-full w-px bg-border"
                      aria-hidden
                    />
                  )}
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
                    aria-hidden
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {event.description ?? '—'}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <time dateTime={event.createdAt}>
                        {event.createdAt ? formatDate(event.createdAt) : '—'}
                      </time>
                      {event.authorName ? (
                        <span>· {event.authorName}</span>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
