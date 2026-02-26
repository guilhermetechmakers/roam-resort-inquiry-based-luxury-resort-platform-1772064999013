/**
 * PaymentSuccessPage - Public landing after Stripe Payment Link / Checkout redirect.
 * Query params: inquiryId, session_id
 * Minimal branded page; webhook updates payment state.
 */

import { useEffect, useState } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import {
  BrandHeader,
  InquirySummaryCard,
  StatusPanel,
  SupportCTASection,
} from '@/components/checkout'
import { fetchCheckoutBridge, fetchCheckoutComplete } from '@/api/checkout'
import type { CheckoutBridgeData } from '@/types/checkout'
import type { StatusPanelStatus } from '@/components/checkout/status-panel'

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const inquiryId = searchParams.get('inquiryId') ?? null
  const sessionId = searchParams.get('session_id') ?? null
  const statusParam = searchParams.get('status') ?? 'success'

  const [bridgeData, setBridgeData] = useState<CheckoutBridgeData | null>(null)
  const [status, setStatus] = useState<StatusPanelStatus>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      setIsLoading(false)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [inquiryId, sessionId, statusParam])

  if (!inquiryId) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader
        reference={bridgeData?.reference}
        destinationName={bridgeData?.destinationName}
      />
      <main className="flex-1 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl space-y-10">
          <section className="animate-fade-in-up">
            <StatusPanel
              status={status}
              isLoading={isLoading}
              inquiryId={inquiryId}
              reference={bridgeData?.reference}
            />
          </section>

          {bridgeData && !isLoading && (
            <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <InquirySummaryCard
                destinationName={bridgeData?.destinationName ?? 'Destination'}
                startDate={bridgeData?.startDate}
                endDate={bridgeData?.endDate}
                guests={bridgeData?.guests ?? 0}
                reference={bridgeData?.reference}
              />
            </section>
          )}

          <section className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <SupportCTASection />
          </section>
        </div>
      </main>
    </div>
  )
}
