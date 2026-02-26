/**
 * Checkout API layer.
 * Fetches bridge and completion data from Supabase Edge Functions.
 * Public endpoints - no auth required.
 */

import type { CheckoutBridgeData, CheckoutCompleteData } from '@/types/checkout'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`

/** Fetch inquiry summary for checkout bridge page */
export async function fetchCheckoutBridge(
  inquiryId: string
): Promise<CheckoutBridgeData | null> {
  try {
    const url = `${FUNCTIONS_BASE}/checkout-bridge?inquiryId=${encodeURIComponent(inquiryId)}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    const data = (await res.json().catch(() => ({}))) as CheckoutBridgeData | { error?: string }
    if (!res.ok || (data as { error?: string }).error) {
      return null
    }
    return data as CheckoutBridgeData
  } catch {
    return null
  }
}

/** Fetch payment status for checkout completion page */
export async function fetchCheckoutComplete(
  inquiryId: string,
  sessionId?: string | null,
  statusParam?: string | null
): Promise<CheckoutCompleteData | null> {
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
      return null
    }
    return data as CheckoutCompleteData
  } catch {
    return null
  }
}
