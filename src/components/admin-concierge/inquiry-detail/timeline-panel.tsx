/**
 * TimelinePanel - Chronological list of events (emails, status changes, notes, payments).
 * Safe iteration with Array.isArray; empty state, loading, and error states handled.
 * Uses design tokens (accent, muted, border, card) for theming.
 */

import { Mail, RefreshCw, FileText, CreditCard, AlertCircle, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AdminTimelineEvent, AdminTimelineEventType } from '@/types/admin'

export interface TimelinePanelProps {
  events: AdminTimelineEvent[] | null | undefined
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onRetry?: () => void
  /** When provided, empty state shows "Add note" CTA that invokes this callback */
  onAddNoteClick?: () => void
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

function TimelineSkeleton() {
  return (
    <ul className="space-y-0" role="list" aria-label="Loading activity timeline">
      {[1, 2, 3].map((i) => (
        <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
          <Skeleton className="h-6 w-6 shrink-0 rounded-full" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full max-w-[200px]" />
            <Skeleton className="h-3 w-20" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function TimelinePanel({
  events,
  isLoading = false,
  isError = false,
  error,
  onRetry,
  onAddNoteClick,
  className,
}: TimelinePanelProps) {
  const safeEvents = Array.isArray(events) ? [...events] : []
  const sorted = safeEvents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-border">
        <h3 className="font-serif text-lg font-semibold text-foreground">Activity Timeline</h3>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <TimelineSkeleton />
        ) : isError ? (
          <div
            className="flex flex-col items-center justify-center py-12 px-4 text-center sm:py-16"
            role="alert"
            aria-live="polite"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" aria-hidden />
            </div>
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
                className="mt-6 border-accent/40 hover:border-accent hover:bg-accent/10 hover:text-accent-foreground"
                aria-label="Retry loading activity"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            )}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 px-4 text-center sm:py-16"
            role="status"
            aria-label="No activity"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
              <RefreshCw className="h-7 w-7 text-accent" aria-hidden />
            </div>
            <h4 className="mt-4 font-serif text-lg font-semibold text-foreground">
              No activity yet
            </h4>
            <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
              Status changes, notes, and payments will appear here as they occur.
            </p>
            {onAddNoteClick && (
              <Button
                variant="default"
                size="sm"
                onClick={onAddNoteClick}
                className="mt-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                aria-label="Add note to start activity"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add note
              </Button>
            )}
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
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent"
                    aria-hidden
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {event.description ?? '—'}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <time dateTime={event.createdAt ?? ''}>
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
