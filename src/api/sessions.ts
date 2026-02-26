/**
 * Sessions API - create, list, revoke sessions via Supabase Edge Functions and tables.
 */

import { supabase } from '@/lib/supabase'

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : ''

/** Create session record after login. Call with auth header. */
export async function createSession(payload?: {
  device_info?: string
  user_agent?: string
}): Promise<{ sessionId: string; createdAt: string; expiresAt: string } | null> {
  if (!FUNCTIONS_URL) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null

  const res = await fetch(`${FUNCTIONS_URL}/session-create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      device_info: payload?.device_info ?? (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'),
      user_agent: payload?.user_agent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
    }),
  })

  if (!res.ok) return null
  const data = (await res.json().catch(() => null)) as {
    sessionId?: string
    createdAt?: string
    expiresAt?: string
  } | null
  if (!data?.sessionId) return null
  return {
    sessionId: data.sessionId,
    createdAt: data.createdAt ?? new Date().toISOString(),
    expiresAt: data.expiresAt ?? new Date().toISOString(),
  }
}

/** Revoke a single session. Pass 'current' or the session UUID when revoking this device. */
export async function revokeSession(sessionId: string): Promise<void> {
  const isCurrentDevice = sessionId === 'current'
  const { getStoredSessionId } = await import('@/api/profile')
  const storedId = getStoredSessionId()
  const revokingThisDevice = isCurrentDevice || (storedId && sessionId === storedId)

  if (!FUNCTIONS_URL) {
    if (revokingThisDevice) await supabase.auth.signOut()
    return
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    if (revokingThisDevice) await supabase.auth.signOut()
    return
  }

  if (sessionId !== 'current') {
    const res = await fetch(`${FUNCTIONS_URL}/session-revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ sessionId }),
    })

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(err?.error ?? 'Failed to revoke session')
    }
  }

  if (revokingThisDevice) {
    await supabase.auth.signOut()
  }
}

/** Revoke all sessions for the current user */
export async function revokeAllSessions(): Promise<void> {
  if (!FUNCTIONS_URL) {
    await supabase.auth.signOut()
    return
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return

  const res = await fetch(`${FUNCTIONS_URL}/session-revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ revokeAll: true }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err?.error ?? 'Failed to revoke sessions')
  }

  await supabase.auth.signOut()
}
