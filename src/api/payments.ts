/**
 * Payments API layer.
 * Create links, mark paid, export CSV via Supabase Edge Functions and client.
 */

import { supabase } from '@/lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''

export interface CreatePaymentLinkPayload {
  inquiryId: string
  amount: number
  currency?: string
  useCheckoutSession?: boolean
  accountId?: string
  expiresInDays?: number
  items?: Array<{ name: string; quantity: number; unitPrice: number; description?: string }>
  notes?: string
}

export interface CreatePaymentLinkResponse {
  success: boolean
  paymentLinkUrl: string
  stripeLinkId?: string
  stripeCheckoutSessionId?: string
  expiresAt?: string
}

export interface MarkPaidPayload {
  inquiryId: string
  paymentId?: string
  notes?: string
  reconciliation?: { status?: string; notes?: string }
}

/** Create Stripe payment link or checkout session */
export async function createPaymentLink(
  payload: CreatePaymentLinkPayload
): Promise<CreatePaymentLinkResponse> {
  const { data: { session } } = await supabase.auth.getSession()
  const url = `${SUPABASE_URL}/functions/v1/create-stripe-link`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
    },
    body: JSON.stringify(payload),
  })
  const data = (await res.json().catch(() => ({}))) as CreatePaymentLinkResponse & { error?: string }
  if (!res.ok || !data.paymentLinkUrl) {
    throw new Error(data.error ?? 'Failed to create payment link')
  }
  return data
}

/** Mark payment as received with optional reconciliation notes */
export async function markPaymentPaid(payload: MarkPaidPayload): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const url = `${SUPABASE_URL}/functions/v1/payments-mark-paid`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
    },
    body: JSON.stringify(payload),
  })
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'Failed to mark payment')
  }
}

/** Export payments as CSV (via Edge Function) */
export async function exportPaymentsCsv(inquiryId?: string): Promise<Blob> {
  const { data: { session } } = await supabase.auth.getSession()
  const params = inquiryId ? `?inquiryId=${encodeURIComponent(inquiryId)}` : ''
  const url = `${SUPABASE_URL}/functions/v1/payments-export${params}`
  const res = await fetch(url, {
    headers: {
      Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
    },
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? 'Failed to export')
  }
  return res.blob()
}
