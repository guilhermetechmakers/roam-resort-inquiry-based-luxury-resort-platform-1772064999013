import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateShort, formatCurrency } from '@/lib/utils'
import { ReceiptLink } from './receipt-link'
import { cn } from '@/lib/utils'
import type { Inquiry, PaymentState } from '@/types'

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  cancelled: 'Cancelled',
}

const PAYMENT_COLORS: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200',
}

function getPaymentState(inquiry: Inquiry): PaymentState {
  if (inquiry.payment_state) return inquiry.payment_state
  if (inquiry.status === 'cancelled') return 'cancelled'
  if (inquiry.status === 'deposit_paid' || inquiry.status === 'confirmed')
    return 'paid'
  return 'pending'
}

function getDestinationName(inquiry: Inquiry): string {
  const listing = inquiry.listing
  if (typeof listing === 'object' && listing?.title) return listing.title
  return 'Destination'
}

function getInquiryDate(inquiry: Inquiry): string {
  const date = inquiry.created_at ?? inquiry.check_in
  if (!date) return '—'
  return formatDateShort(date)
}

export interface InquiryHistoryRowProps {
  inquiry: Inquiry
  onViewDetails: (inquiry: Inquiry) => void
  onViewReceipt?: (inquiry: Inquiry) => void
}

/**
 * Single row: Destination, Inquiry Date, Status badge, Amount, Actions.
 */
export function InquiryHistoryRow({
  inquiry,
  onViewDetails,
}: InquiryHistoryRowProps) {
  const paymentState = getPaymentState(inquiry)
  const destinationName = getDestinationName(inquiry)
  const inquiryDate = getInquiryDate(inquiry)
  const amount = inquiry.total_amount
  const currency = 'USD'
  const receiptUrl =
    paymentState === 'paid'
      ? (inquiry.receipt_url ?? inquiry.payment_link ?? null)
      : null
  const showReceipt = !!receiptUrl && paymentState === 'paid'

  return (
    <div
      className={cn(
        'group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-300',
        'hover:border-accent/40 hover:shadow-card-hover sm:flex-row sm:items-center sm:justify-between'
      )}
      role="row"
    >
      <div className="flex-1 min-w-0">
        <span className="font-mono text-xs text-muted-foreground">
          {inquiry.reference ?? inquiry.id}
        </span>
        <h4 className="mt-1 font-serif font-semibold text-foreground truncate">
          {destinationName}
        </h4>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{inquiryDate}</span>
          <span
            className={cn(
              'rounded-full border px-3 py-0.5 text-xs font-medium',
              PAYMENT_COLORS[paymentState] ?? 'bg-gray-100 text-gray-700 border-gray-200'
            )}
          >
            {PAYMENT_LABELS[paymentState] ?? paymentState}
          </span>
          {amount != null && typeof amount === 'number' && (
            <span className="font-medium text-foreground">
              {formatCurrency(amount, currency)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showReceipt && receiptUrl && (
          <ReceiptLink
            url={receiptUrl}
            label="Receipt"
            variant="button"
          />
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(inquiry)}
          aria-label={`View details for ${destinationName}`}
          className="transition-transform duration-200 hover:scale-[1.02]"
        >
          Details
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
