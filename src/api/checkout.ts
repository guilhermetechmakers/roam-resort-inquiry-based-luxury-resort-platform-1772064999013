/**
 * Checkout API layer.
 * Fetches bridge and completion data from Supabase Edge Functions.
 * Public endpoints - no auth required.
 */

import type { CheckoutBridgeData, CheckoutCompleteData } from '@/types/checkout'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`

export interface CheckoutApiResult<T> {
  data: T | null
  error: string | null
}

/** Fetch inquiry summary for checkout bridge page */
export async function fetchCheckoutBridge(
  inquiryId: string
): Promise<CheckoutBridgeData | null> {
  const result = await fetchCheckoutBridgeWithError(inquiryId)
  return result.error ? null : result.data
}

/** Fetch inquiry summary with error info for inline feedback */
export async function fetchCheckoutBridgeWithError(
  inquiryId: string
): Promise<CheckoutApiResult<CheckoutBridgeData>> {
  try {
    const url = `${FUNCTIONS_BASE}/checkout-bridge?inquiryId=${encodeURIComponent(inquiryId)}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    const data = (await res.json().catch(() => ({}))) as CheckoutBridgeData | { error?: string }
    if (!res.ok || (data as { error?: string }).error) {
      const msg = (data as { error?: string }).error ?? `Request failed (${res.status})`
      return { data: null, error: msg }
    }
    return { data: data as CheckoutBridgeData, error: null }
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : 'Unable to load checkout details',
    }
  }
}

/** Fetch payment status for checkout completion page */
export async function fetchCheckoutComplete(
  inquiryId: string,
  sessionId?: string | null,
  statusParam?: string | null
): Promise<CheckoutCompleteData | null> {
  const result = await fetchCheckoutCompleteWithError(
    inquiryId,
    sessionId,
    statusParam
  )
  return result.error ? null : result.data
}

/** Fetch payment status with error info for inline feedback */
export async function fetchCheckoutCompleteWithError(
  inquiryId: string,
  sessionId?: string | null,
  statusParam?: string | null
): Promise<CheckoutApiResult<CheckoutCompleteData>> {
  try {
    const params = new URLSearchParams({ inquiryId })
    if (sessionId) params.set('session_id', sessionId)
    if (statusParam) params.set('status', statusParam)
    const url = `${FUNCTIONS_BASE}/checkout-complete?${params.toString()}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    const data = (await res.json().catch(() => ({}))) as CheckoutCompleteData | { error?: string }
    if (!res.ok || (data as { error?: string }).error) {
      const msg = (data as { error?: string }).error ?? `Request failed (${res.status})`
      return { data: null, error: msg }
    }
    return { data: data as CheckoutCompleteData, error: null }
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : 'Unable to load payment status',
    }
  }
}
