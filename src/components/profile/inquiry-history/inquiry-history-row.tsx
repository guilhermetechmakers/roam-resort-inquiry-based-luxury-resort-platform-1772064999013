import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateShort, formatCurrency } from '@/lib/utils'
import { ReceiptLink } from './receipt-link'
import { getPaymentState, mapToDisplayStatus } from '@/hooks/use-guest-inquiry-history'
import type { Inquiry } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_BADGE_CLASSES: Record<string, string> = {
  Paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
}

export interface InquiryHistoryRowProps {
  inquiry: Inquiry
  onViewDetails: (inquiry: Inquiry) => void
  onViewReceipt?: (url: string) => void
}

function getDestinationName(inquiry: Inquiry): string {
  const listing = inquiry.listing
  if (typeof listing === 'object' && listing && 'title' in listing) {
    return String(listing.title ?? 'Destination')
  }
  return 'Destination'
}

export function InquiryHistoryRow({
  inquiry,
  onViewDetails,
}: InquiryHistoryRowProps) {
  const destinationName = getDestinationName(inquiry)
  const inquiryDate = inquiry.created_at ?? ''
  const paymentState = getPaymentState(inquiry)
  const displayStatus = mapToDisplayStatus(inquiry)
  const amount = inquiry.total_amount ?? null
  const currency = 'USD'
  const receiptUrl = inquiry.receipt_url ?? (paymentState === 'paid' ? inquiry.payment_link : null) ?? null
  const showReceipt = paymentState === 'paid' && receiptUrl

  return (
    <div
      className={cn(
        'group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-300',
        'hover:border-accent/40 hover:shadow-card-hover',
        'sm:flex-row sm:items-center sm:justify-between'
      )}
      role="row"
    >
      <div className="flex-1 min-w-0">
        <span className="font-mono text-xs text-muted-foreground">
          {inquiry.reference ?? '—'}
        </span>
        <h4 className="mt-1 font-serif font-semibold truncate text-foreground">
          {destinationName}
        </h4>
        <p className="mt-1 text-sm text-muted-foreground">
          {inquiryDate ? formatDateShort(inquiryDate) : '—'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full border px-3 py-0.5 text-xs font-medium',
              STATUS_BADGE_CLASSES[displayStatus] ?? 'bg-muted text-muted-foreground'
            )}
          >
            {displayStatus}
          </span>
          {amount != null && (
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(amount, currency)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(inquiry)}
          aria-label={`View details for ${inquiry.reference}`}
          className="transition-transform duration-200 hover:scale-[1.02]"
        >
          Details
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        {showReceipt && (
          <ReceiptLink
            url={receiptUrl}
            label="Receipt"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 border border-border hover:border-accent/40"
          />
        )}
      </div>
    </div>
  )
}
