/**
 * Support API - Contact form submission.
 * Calls Supabase Edge Function support-contact.
 * Public endpoint - no auth required.
 */

import type { ContactPayload, ContactResponse } from '@/types/about-help'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`

export async function submitContact(
  payload: ContactPayload
): Promise<ContactResponse | null> {
  try {
    const url = `${FUNCTIONS_BASE}/support-contact`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    const data = (await res.json().catch(() => ({}))) as
      | ContactResponse
      | { error?: string; message?: string }
    if (!res.ok) {
      const errMsg =
        (data as { message?: string }).message ??
        (data as { error?: string }).error ??
        'Failed to send message'
      throw new Error(errMsg)
    }
    return data as ContactResponse
  } catch (err) {
    throw err
  }
}
