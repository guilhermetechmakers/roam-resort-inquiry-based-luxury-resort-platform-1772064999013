/**
 * CheckoutBridgePage - Public bridge when landing from Stripe payment link.
 * Shows inquiry summary, redirect notice, CTA to proceed to Stripe, and support section.
 */

import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { CreditCard, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BrandHeader,
  InquirySummaryCard,
  RedirectNotice,
  SupportCTASection,
} from '@/components/checkout'
import { fetchCheckoutBridge } from '@/api/checkout'
import type { CheckoutBridgeData } from '@/types/checkout'

function BridgeSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
      <div className="flex flex-col items-center">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="mt-6 h-10 w-72" />
        <Skeleton className="mt-4 h-6 w-48" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

export function CheckoutBridgePage() {
  const { inquiryId } = useParams<{ inquiryId: string }>()
  const [data, setData] = useState<CheckoutBridgeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!inquiryId) {
      setIsLoading(false)
      setError(true)
      return
    }
    let cancelled = false
    fetchCheckoutBridge(inquiryId)
      .then((res) => {
        if (!cancelled) {
          setData(res ?? null)
          setError(!res)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [inquiryId])

  if (!inquiryId) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <BrandHeader />
        <main className="flex-1 px-4 py-16 sm:py-24">
          <BridgeSkeleton />
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <BrandHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <p className="text-muted-foreground">Inquiry not found or link may have expired.</p>
          <Link to="/contact" className="mt-6">
            <Button variant="outline">Contact Support</Button>
          </Link>
          <Link to="/" className="mt-4">
            <Button variant="ghost">Return Home</Button>
          </Link>
        </main>
      </div>
    )
  }

  const paymentLinkUrl = data?.paymentLinkUrl ?? null
  const isPaid = (data?.paymentState ?? '') === 'paid'

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader reference={data?.reference} destinationName={data?.destinationName} />
      <main className="flex-1 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl space-y-10">
          {/* Hero / Summary */}
          <section className="text-center animate-fade-in-up">
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10"
              aria-hidden
            >
              <CreditCard className="h-10 w-10 text-accent" />
            </div>
            <h1 className="mt-8 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Complete Your Payment
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              You are about to complete payment for your Roam Resort inquiry. You will be
              redirected back to Roam Resort after payment.
            </p>
          </section>

          {/* Inquiry Summary Card */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <InquirySummaryCard
              destinationName={data?.destinationName ?? 'Destination'}
              startDate={data?.startDate}
              endDate={data?.endDate}
              guests={data?.guests ?? 0}
              reference={data?.reference}
            />
          </section>

          {/* Redirect Notice */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <RedirectNotice />
          </section>

          {/* CTA to Stripe */}
          {isPaid ? (
            <section className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-muted-foreground mb-4">Your payment has already been received.</p>
              <Link to={`/inquiries/confirmation/${inquiryId}`}>
                <Button size="lg" className="bg-accent hover:bg-accent/90">
                  View Inquiry
                </Button>
              </Link>
            </section>
          ) : paymentLinkUrl ? (
            <section className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <a
                href={paymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-accent hover:bg-accent/90 min-w-[200px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  aria-label="Proceed to secure payment"
                >
                  Proceed to Payment
                  <ExternalLink className="ml-2 h-5 w-5" aria-hidden />
                </Button>
              </a>
              <p className="mt-4 text-xs text-muted-foreground">
                You will be taken to Stripe&apos;s secure checkout.
              </p>
            </section>
          ) : (
            <section className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-muted-foreground">
                No payment link is available for this inquiry. Please contact our concierge.
              </p>
              <Link to="/contact" className="mt-4 inline-block">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </section>
          )}

          {/* Support Section */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <SupportCTASection />
          </section>
        </div>
      </main>
    </div>
  )
}
