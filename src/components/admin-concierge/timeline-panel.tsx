import { Mail, FileText, CreditCard, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AdminTimelineEvent } from '@/types/admin'

export interface TimelinePanelProps {
  events: AdminTimelineEvent[]
  className?: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  status: <Activity className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
}

const TYPE_LABELS: Record<string, string> = {
  email: 'Email',
  status: 'Status',
  note: 'Note',
  payment: 'Payment',
}

export function TimelinePanel({ events, className }: TimelinePanelProps) {
  const safeEvents = Array.isArray(events) ? events : []

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader>
        <h3 className="font-serif text-lg font-semibold">Activity timeline</h3>
        <p className="text-sm text-muted-foreground">
          Chronological feed of events
        </p>
      </CardHeader>
      <CardContent>
        {safeEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
            <Activity className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">No activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Status changes, notes, and payments will appear here.
            </p>
          </div>
        ) : (
          <ul
            className="relative space-y-0"
            role="list"
            aria-label="Activity timeline"
          >
            {safeEvents.map((event, idx) => {
              const icon = TYPE_ICONS[event.type] ?? <Activity className="h-4 w-4" />
              const label = TYPE_LABELS[event.type] ?? event.type
              const isLast = idx === safeEvents.length - 1

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
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground',
                      event.type === 'payment' && 'text-accent',
                      event.type === 'status' && 'text-accent'
                    )}
                  >
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {event.description}
                    </p>
                    <time
                      dateTime={event.createdAt}
                      className="mt-1 block text-xs text-muted-foreground"
                    >
                      {formatDateTime(event.createdAt)}
                      {event.authorName && ` · ${event.authorName}`}
                    </time>
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
