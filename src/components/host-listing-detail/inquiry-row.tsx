/**
 * InquiryRow — Single inquiry card in the InquiriesPanel.
 * Shows reference, guest name, dates, inquiry date, and message snippet.
 * Read-only; onView opens MessageModal.
 */

import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { HostListingInquiry } from '@/types/host-listing-detail'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  contacted:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  deposit_paid:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  confirmed:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-muted text-muted-foreground',
}

export interface InquiryRowProps {
  inquiry: HostListingInquiry
  onView: (inquiryId: string) => void
}

/** Truncate message to 2–3 lines (~120 chars) */
function truncateMessage(msg: string | undefined, maxLen = 120): string {
  if (!msg?.trim()) return ''
  const t = msg.trim()
  return t.length > maxLen ? t.slice(0, maxLen) + '…' : t
}

export function InquiryRow({ inquiry, onView }: InquiryRowProps) {
  const reference = inquiry.reference ?? inquiry.id
  const guestName = inquiry.guest_name ?? 'Guest'
  const startDate = inquiry.start_date ? formatDate(inquiry.start_date) : '—'
  const endDate = inquiry.end_date ? formatDate(inquiry.end_date) : '—'
  const inquiryDate = formatDate(inquiry.created_at)
  const snippet = truncateMessage(inquiry.message_preview)
  const status = inquiry.status ?? 'new'
  const statusClass = statusColors[status] ?? 'bg-muted text-muted-foreground'

  return (
    <article
      className={cn(
        'rounded-xl border border-border bg-card p-4 transition-all duration-300',
        'hover:border-accent/30 hover:shadow-card-hover hover:scale-[1.01]',
        'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2'
      )}
      role="article"
      aria-labelledby={`inquiry-ref-${inquiry.id}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              id={`inquiry-ref-${inquiry.id}`}
              className="font-mono text-sm font-semibold text-foreground"
            >
              {reference}
            </span>
            {status && (
              <span
                className={cn(
                  'rounded-full px-2 py-1 text-xs font-medium capitalize',
                  statusClass
                )}
              >
                {status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">
            {guestName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {startDate} — {endDate}
          </p>
          <p className="mt-1 text-xs italic text-muted-foreground">
            Inquired {inquiryDate}
          </p>
          {snippet && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {snippet}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(inquiry.id)}
          className="shrink-0 hover:border-accent hover:bg-accent/10 hover:text-accent"
          aria-label={`View full message for inquiry ${reference}`}
        >
          <MessageSquare className="mr-1.5 h-4 w-4" aria-hidden />
          View Message
        </Button>
      </div>
    </article>
  )
}
