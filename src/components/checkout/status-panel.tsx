/**
 * StatusPanel - Success/failure handling based on query parameters or API state.
 */

import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type StatusPanelStatus = 'success' | 'failed' | 'cancelled' | 'pending' | null

export interface StatusPanelProps {
  status: StatusPanelStatus
  isLoading?: boolean
  inquiryId?: string
  reference?: string
}

export function StatusPanel({
  status,
  isLoading = false,
  inquiryId,
  reference,
}: StatusPanelProps) {
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/60 bg-card/50 px-6 py-12"
        role="status"
        aria-label="Loading payment status"
      >
        <Loader2 className="h-12 w-12 animate-spin text-accent" aria-hidden />
        <p className="text-sm text-muted-foreground">Checking payment status…</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-xl border border-green-200/60 bg-green-50/30 px-6 py-8 dark:border-green-900/40 dark:bg-green-950/20"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40"
            aria-hidden
          >
            <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold text-foreground">
              Payment Complete
            </h3>
            <p className="mt-2 text-muted-foreground">
              Thank you. Your payment has been processed successfully.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              {inquiryId && (
                <Link to={`/inquiries/confirmation/${inquiryId}`}>
                  <Button
                    className="bg-accent hover:bg-accent/90"
                    aria-label={`View inquiry ${reference ?? inquiryId}`}
                  >
                    View Inquiry
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <Button variant="outline">My Inquiries</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div
        className="rounded-xl border border-amber-200/60 bg-amber-50/30 px-6 py-8 dark:border-amber-900/40 dark:bg-amber-950/20"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40"
            aria-hidden
          >
            <AlertCircle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold text-foreground">
              Payment Cancelled
            </h3>
            <p className="mt-2 text-muted-foreground">
              Your payment was cancelled. You can try again when you&apos;re ready or contact our
              concierge team for assistance.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              {inquiryId && (
                <Link to={`/checkout/bridge/${inquiryId}`}>
                  <Button className="bg-accent hover:bg-accent/90">Proceed to Payment</Button>
                </Link>
              )}
              <Link to="/contact">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div
        className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10"
            aria-hidden
          >
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold text-foreground">
              Payment Not Completed
            </h3>
            <p className="mt-2 text-muted-foreground">
              Something went wrong with your payment. Please try again or contact our concierge for
              assistance.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link to="/contact">
                <Button className="bg-accent hover:bg-accent/90">Contact Support</Button>
              </Link>
              <Link to="/help">
                <Button variant="outline">Help</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
