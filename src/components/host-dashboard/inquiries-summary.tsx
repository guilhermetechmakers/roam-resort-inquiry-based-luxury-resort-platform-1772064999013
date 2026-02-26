import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import type { InquirySummary } from '@/api/host-dashboard'
import { cn } from '@/lib/utils'

export interface InquiriesSummaryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingTitle: string
  inquiries: InquirySummary[]
  isLoading?: boolean
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  contacted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  deposit_paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-muted text-muted-foreground',
}

export function InquiriesSummary({
  open,
  onOpenChange,
  listingTitle,
  inquiries,
  isLoading,
}: InquiriesSummaryProps) {
  const list = Array.isArray(inquiries) ? inquiries : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="inquiries-summary-desc"
      >
        <DialogHeader>
          <DialogTitle>Inquiries — {listingTitle}</DialogTitle>
          <DialogDescription id="inquiries-summary-desc">
            Read-only summary. Concierge manages full inquiry details in the admin
            panel.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-muted"
                  aria-hidden
                />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-lg border border-border bg-secondary/30 py-12 text-center">
              <p className="text-muted-foreground">No inquiries yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Inquiries will appear here when guests submit requests.
              </p>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {list.map((inquiry) => (
                <li
                  key={inquiry.id}
                  className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {inquiry.reference}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium capitalize',
                        statusColors[inquiry.status] ?? 'bg-muted text-muted-foreground'
                      )}
                    >
                      {inquiry.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(inquiry.created_at)}
                  </p>
                  {inquiry.message?.trim() && (
                    <p className="mt-2 line-clamp-2 text-sm text-foreground">
                      {inquiry.message}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
