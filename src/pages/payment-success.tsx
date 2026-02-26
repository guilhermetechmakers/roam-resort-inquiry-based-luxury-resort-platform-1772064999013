/**
 * PaymentSuccessPage - Public landing after Stripe Payment Link / Checkout redirect.
 * Query params: inquiryId, session_id
 * Minimal branded page; webhook updates payment state.
 */

import { useEffect, useState } from 'react'
import { useSearchParams, Navigate, Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import {
  BrandHeader,
  InquirySummaryCard,
  StatusPanel,
  SupportCTASection,
} from '@/components/checkout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchCheckoutBridge, fetchCheckoutComplete } from '@/api/checkout'
import type { CheckoutBridgeData } from '@/types/checkout'
import type { StatusPanelStatus } from '@/components/checkout/status-panel'

function PaymentSuccessSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" role="status" aria-label="Loading payment details">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Card className="rounded-xl border-border/80 bg-card/50 shadow-card">
        <CardHeader>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-xl border-border/80 bg-card/50 shadow-card">
        <CardHeader>
          <Skeleton className="h-4 w-20" />
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <Skeleton className="h-4 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PaymentErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card
      className="rounded-xl border-destructive/30 bg-destructive/5 px-6 py-8"
      role="alert"
      aria-live="polite"
      aria-label="Unable to load payment status"
    >
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/20"
          aria-hidden
        >
          <AlertCircle className="h-7 w-7 text-destructive" aria-hidden />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-xl font-semibold text-foreground">
            Unable to Load Payment Status
          </h3>
          <p className="mt-2 text-muted-foreground">
            We couldn&apos;t verify your payment status. Please try again or contact our concierge
            team for assistance.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 sm:justify-start">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="bg-accent hover:bg-accent/90"
                aria-label="Retry loading payment status"
              >
                Try Again
              </Button>
            )}
            <Link to="/contact">
              <Button variant="outline" aria-label="Contact support">
                Contact Support
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" aria-label="Return to home">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const inquiryId = searchParams.get('inquiryId') ?? null
  const sessionId = searchParams.get('session_id') ?? null
  const statusParam = searchParams.get('status') ?? 'success'

  const [bridgeData, setBridgeData] = useState<CheckoutBridgeData | null>(null)
  const [status, setStatus] = useState<StatusPanelStatus>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
    setRetryCount((c) => c + 1)
  }

  useEffect(() => {
    if (!inquiryId) return
    let cancelled = false

    const run = async () => {
      const complete = await fetchCheckoutComplete(inquiryId, sessionId, statusParam)
      const bridge = await fetchCheckoutBridge(inquiryId)

      if (cancelled) return

      setBridgeData(bridge ?? null)
      const resolvedStatus =
        statusParam === 'success' || complete?.status === 'success'
          ? 'success'
          : statusParam === 'failed' || complete?.status === 'failed'
            ? 'failed'
            : complete?.paymentState === 'paid'
              ? 'success'
              : (statusParam as StatusPanelStatus) ?? 'success'
      setStatus(resolvedStatus)
      setHasError(!bridge && !complete)
      setIsLoading(false)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [inquiryId, sessionId, statusParam, retryCount])

  if (!inquiryId) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <BrandHeader
        reference={bridgeData?.reference}
        destinationName={bridgeData?.destinationName}
      />
      <main
        className="flex-1 px-4 py-16 sm:py-24"
        role="main"
        aria-label="Payment confirmation"
      >
        <div className="mx-auto max-w-2xl space-y-10">
          <section
            className="animate-fade-in-up"
            aria-label="Payment status"
          >
            {hasError && !isLoading ? (
              <PaymentErrorState onRetry={handleRetry} />
            ) : (
              <StatusPanel
                status={status}
                isLoading={isLoading}
                inquiryId={inquiryId}
                reference={bridgeData?.reference}
              />
            )}
          </section>

          {isLoading && (
            <section
              className="animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
              aria-hidden
            >
              <PaymentSuccessSkeleton />
            </section>
          )}

          {bridgeData && !isLoading && !hasError && (
            <section
              className="animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
              aria-label="Inquiry summary"
            >
              <InquirySummaryCard
                destinationName={bridgeData?.destinationName ?? 'Destination'}
                startDate={bridgeData?.startDate}
                endDate={bridgeData?.endDate}
                guests={bridgeData?.guests ?? 0}
                reference={bridgeData?.reference}
              />
            </section>
          )}

          {!isLoading && (
            <section
              className="animate-fade-in-up"
              style={{ animationDelay: '0.15s' }}
              aria-label="Support and help"
            >
              <SupportCTASection />
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
