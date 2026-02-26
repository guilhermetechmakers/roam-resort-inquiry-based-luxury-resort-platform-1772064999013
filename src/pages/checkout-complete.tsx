/**
 * CheckoutCompletePage - Payment completion page after Stripe redirect.
 * Shows success/failure status based on query params or API.
 * Includes loading skeletons, error states, and accessibility.
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, Navigate } from 'react-router-dom'
import {
  BrandHeader,
  InquirySummaryCard,
  StatusPanel,
  SupportCTASection,
} from '@/components/checkout'
import {
  fetchCheckoutBridgeWithError,
  fetchCheckoutCompleteWithError,
} from '@/api/checkout'
import type { CheckoutBridgeData } from '@/types/checkout'
import type { StatusPanelStatus } from '@/components/checkout/status-panel'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBanner } from '@/components/auth/error-banner'
import { cn } from '@/lib/utils'

function InquirySummarySkeleton() {
  return (
    <Card
      className="rounded-xl border-border/80 bg-card/50 shadow-card"
      aria-hidden
    >
      <CardHeader className="space-y-2">
        <Skeleton className="h-3 w-24 rounded-md bg-muted" />
        <Skeleton className="h-4 w-32 rounded-md bg-muted" />
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 shrink-0 rounded-md bg-muted" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20 rounded-md bg-muted" />
            <Skeleton className="h-5 w-40 rounded-md bg-muted" />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 shrink-0 rounded-md bg-muted" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16 rounded-md bg-muted" />
            <Skeleton className="h-4 w-48 rounded-md bg-muted" />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 shrink-0 rounded-md bg-muted" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-14 rounded-md bg-muted" />
            <Skeleton className="h-4 w-12 rounded-md bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CheckoutCompletePage() {
  const { inquiryId } = useParams<{ inquiryId: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id') ?? null
  const statusParam = searchParams.get('status') ?? null

  const [bridgeData, setBridgeData] = useState<CheckoutBridgeData | null>(null)
  const [status, setStatus] = useState<StatusPanelStatus>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!inquiryId) return
    setFetchError(null)
    setIsLoading(true)

    const [completeResult, bridgeResult] = await Promise.all([
      fetchCheckoutCompleteWithError(inquiryId, sessionId, statusParam),
      fetchCheckoutBridgeWithError(inquiryId),
    ])

    const complete = completeResult.data
    const bridge = bridgeResult.data

    const hasError = completeResult.error ?? bridgeResult.error
    if (hasError) {
      setFetchError(hasError)
      setBridgeData(bridge ?? null)
      setStatus(
        statusParam === 'success'
          ? 'success'
          : statusParam === 'failed' || statusParam === 'cancelled'
            ? (statusParam as StatusPanelStatus)
            : null
      )
    } else {
      setBridgeData(bridge ?? null)
      const resolvedStatus =
        statusParam === 'success' || complete?.status === 'success'
          ? 'success'
          : statusParam === 'failed' ||
              statusParam === 'cancelled' ||
              complete?.status === 'failed'
            ? 'failed'
            : complete?.paymentState === 'paid'
              ? 'success'
              : statusParam
                ? (statusParam as StatusPanelStatus)
                : complete?.status === 'pending'
                  ? 'pending'
                  : null
      setStatus(resolvedStatus)
    }
    setIsLoading(false)
  }, [inquiryId, sessionId, statusParam])

  useEffect(() => {
    const id = setTimeout(() => {
      void loadData()
    }, 0)
    return () => clearTimeout(id)
  }, [loadData])

  if (!inquiryId) {
    return <Navigate to="/" replace />
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      role="application"
      aria-label="Checkout completion"
    >
      <BrandHeader
        reference={bridgeData?.reference}
        destinationName={bridgeData?.destinationName}
      />
      <main
        className="flex-1 px-4 py-8 sm:py-16 lg:py-24"
        role="main"
        aria-label="Payment status and inquiry summary"
      >
        <div className="mx-auto max-w-2xl space-y-8 sm:space-y-10">
          {/* Inline error feedback */}
          {fetchError && (
            <section
              className="animate-fade-in-up"
              role="alert"
              aria-live="assertive"
            >
              <ErrorBanner
                message="We couldn't load your checkout details"
                subMessage={fetchError}
                onRetry={loadData}
              />
            </section>
          )}

          {/* Status Panel */}
          <section
            className={cn(
              'animate-fade-in-up',
              fetchError && 'opacity-90'
            )}
            aria-label="Payment status"
          >
            <StatusPanel
              status={status}
              isLoading={isLoading}
              inquiryId={inquiryId}
              reference={bridgeData?.reference}
            />
          </section>

          {/* Inquiry Summary skeleton when loading */}
          {isLoading && (
            <section
              className="animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
              aria-busy="true"
              aria-label="Loading inquiry summary"
            >
              <InquirySummarySkeleton />
            </section>
          )}

          {/* Inquiry Summary (when we have data) */}
          {bridgeData && !isLoading && (
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

          {/* Support Section */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: '0.15s' }}
            aria-label="Support and help"
          >
            <SupportCTASection />
          </section>
        </div>
      </main>
    </div>
  )
}
