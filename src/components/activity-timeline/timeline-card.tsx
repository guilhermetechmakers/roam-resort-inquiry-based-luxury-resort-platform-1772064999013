import { Mail, FileText, CreditCard, Activity, Lock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { Activity as ActivityType } from '@/types'
import { cn } from '@/lib/utils'

const EVENT_ICONS: Record<string, React.ReactNode> = {
  email_sent: <Mail className="h-4 w-4" />,
  status_changed: <Activity className="h-4 w-4" />,
  inquiry_created: <Activity className="h-4 w-4" />,
  internal_note_added: <FileText className="h-4 w-4" />,
  note_updated: <FileText className="h-4 w-4" />,
  payment_link_created: <CreditCard className="h-4 w-4" />,
  payment_received: <CreditCard className="h-4 w-4" />,
}

const EVENT_LABELS: Record<string, string> = {
  email_sent: 'Email sent',
  status_changed: 'Status changed',
  inquiry_created: 'Inquiry created',
  internal_note_added: 'Internal note',
  note_updated: 'Note updated',
  payment_link_created: 'Payment link',
  payment_received: 'Payment received',
}

function getEventDescription(activity: ActivityType): string {
  const meta = activity.metadata ?? {}
  if (activity.event_type === 'internal_note_added' || activity.event_type === 'note_updated') {
    return (meta.content as string) ?? ''
  }
  if (activity.event_type === 'status_changed') {
    const from = meta.from as string | undefined
    const to = meta.to as string | undefined
    if (from && to) return `${from} → ${to}`
    return (meta.details as string) ?? 'Status updated'
  }
  if (activity.event_type === 'email_sent') {
    return (meta.subject as string) ?? (meta.details as string) ?? 'Email sent'
  }
  if (activity.event_type === 'payment_link_created' || activity.event_type === 'payment_received') {
    const amount = meta.amount as number | undefined
    return amount != null ? `$${amount.toLocaleString()}` : 'Payment'
  }
  return (meta.details as string) ?? EVENT_LABELS[activity.event_type] ?? activity.event_type
}

export interface TimelineCardProps {
  activity: ActivityType
  className?: string
}

export function TimelineCard({ activity, className }: TimelineCardProps) {
  const icon = EVENT_ICONS[activity.event_type] ?? <Activity className="h-4 w-4" />
  const label = EVENT_LABELS[activity.event_type] ?? activity.event_type.replace(/_/g, ' ')
  const description = getEventDescription(activity)

  return (
    <article
      className={cn(
        'flex gap-4 rounded-lg border border-border bg-card p-4 transition-all duration-300',
        'hover:border-accent/30 hover:shadow-card',
        className
      )}
      role="listitem"
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50',
          activity.is_internal && 'border-amber-500/50 bg-amber-500/10',
          (activity.event_type === 'payment_link_created' || activity.event_type === 'payment_received') &&
            'text-accent'
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium capitalize">{label.replace(/_/g, ' ')}</span>
          {activity.is_internal && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              title="Internal - staff only"
            >
              <Lock className="h-3 w-3" />
              Internal
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{description}</p>
        )}
        <time
          dateTime={activity.timestamp ?? activity.created_at}
          className="mt-2 block text-xs text-muted-foreground"
        >
          {formatDateTime(activity.timestamp ?? activity.created_at ?? '')}
          {activity.actor_name && ` · ${activity.actor_name}`}
        </time>
      </div>
    </article>
  )
}
