import { useState, useMemo } from 'react'
import { FileText, ExternalLink, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { Inquiry, PaymentState } from '@/types'
import { cn } from '@/lib/utils'

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  cancelled: 'Cancelled',
}

const PAYMENT_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

function getPaymentState(inquiry: Inquiry): PaymentState {
  if (inquiry.payment_state) return inquiry.payment_state
  if (inquiry.status === 'cancelled') return 'cancelled'
  if (inquiry.status === 'deposit_paid' || inquiry.status === 'confirmed')
    return 'paid'
  return 'pending'
}

export interface GuestInquiryHistoryPanelProps {
  inquiries: Inquiry[]
  isLoading?: boolean
  onInquiryClick?: (inquiry: Inquiry) => void
}

export function GuestInquiryHistoryPanel({
  inquiries,
  isLoading,
  onInquiryClick,
}: GuestInquiryHistoryPanelProps) {
  const [paymentFilter, setPaymentFilter] = useState<string>('all')

  const safeInquiries = useMemo(() => {
    const list = Array.isArray(inquiries) ? inquiries : []
    if (paymentFilter === 'all') return list
    return list.filter((i) => getPaymentState(i) === paymentFilter)
  }, [inquiries, paymentFilter])

  const sortedInquiries = useMemo(
    () =>
      [...safeInquiries].sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      ),
    [safeInquiries]
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const list = sortedInquiries ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <h3 className="font-serif text-xl font-semibold">
          Inquiry & transaction history
        </h3>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h4 className="mt-4 font-serif text-lg font-semibold">
              No inquiries yet
            </h4>
            <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
              Your past inquiries and receipts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((inquiry) => {
              const listing = inquiry.listing
              const title =
                typeof listing === 'object' && listing
                  ? listing.title
                  : 'Destination'
              const paymentState = getPaymentState(inquiry)
              const receiptUrl =
                inquiry.receipt_url ?? (paymentState === 'paid' ? inquiry.payment_link : null)

              return (
                <Card
                  key={inquiry.id}
                  className="cursor-pointer transition-all duration-300 hover:border-accent/40 hover:shadow-card-hover"
                  onClick={() => onInquiryClick?.(inquiry)}
                >
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground">
                        {inquiry.reference}
                      </span>
                      <h4 className="mt-1 font-serif font-semibold truncate">
                        {title}
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {inquiry.check_in && (
                          <span>
                            {formatDate(inquiry.check_in)} —{' '}
                            {inquiry.check_out
                              ? formatDate(inquiry.check_out)
                              : '—'}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-3 py-0.5 text-xs font-medium',
                            PAYMENT_COLORS[paymentState] ??
                              'bg-gray-100 text-gray-800'
                          )}
                        >
                          {PAYMENT_LABELS[paymentState] ?? paymentState}
                        </span>
                        {receiptUrl && (
                          <a
                            href={receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="h-4 w-4" />
                            View receipt
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {inquiry.payment_link && paymentState === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={inquiry.payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Pay
                          </a>
                        </Button>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
