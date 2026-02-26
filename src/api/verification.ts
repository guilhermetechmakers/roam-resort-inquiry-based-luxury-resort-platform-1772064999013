/**
 * Email verification API - wraps Supabase Auth for token verification and resend.
 * Uses Supabase's built-in email confirmation flow.
 */

import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import type { UserRole } from '@/types/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseUserMeta = any

function mapSupabaseUser(
  u: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at?: string; email_confirmed_at?: string } | null
): User | null {
  if (!u) return null
  const meta = (u.user_metadata ?? {}) as SupabaseUserMeta
  return {
    id: u.id,
    email: u.email ?? '',
    role: (meta.role as UserRole) ?? 'guest',
    full_name: meta.full_name as string | undefined,
    avatar_url: meta.avatar_url as string | undefined,
    created_at: u.created_at ?? new Date().toISOString(),
    updated_at: (meta.updated_at as string) ?? u.created_at ?? new Date().toISOString(),
  }
}

export interface VerifyTokenResponse {
  success: boolean
  user?: User
  error?: string
}

/**
 * Verify email via Supabase verifyOtp when token is in query param.
 * For hash-based redirects, Supabase auto-processes; use getSession() instead.
 */
export async function verifyToken(token: string): Promise<VerifyTokenResponse> {
  const trimmed = typeof token === 'string' ? token.trim() : ''
  if (!trimmed) {
    return { success: false, error: 'Invalid or expired token' }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: trimmed,
    type: 'signup',
  })

  if (error) {
    return {
      success: false,
      error: error.message ?? 'Invalid or expired token',
    }
  }

  const user = data?.user ?? null
  const mapped = mapSupabaseUser(user)
  if (!mapped) {
    return { success: false, error: 'Verification failed' }
  }

  return {
    success: true,
    user: mapped,
  }
}

/**
 * Get current session after Supabase processes hash params.
 * Call this when user lands on /verify with hash (access_token, type=signup).
 */
export async function getSessionAfterRedirect(): Promise<VerifyTokenResponse> {
  const { data, error } = await supabase.auth.getSession()
  const session = data?.session ?? null
  const user = session?.user ?? null

  if (error || !user) {
    return {
      success: false,
      error: error?.message ?? 'No valid session',
    }
  }

  const mapped = mapSupabaseUser(user)
  if (!mapped) {
    return { success: false, error: 'Could not load user' }
  }

  return {
    success: true,
    user: mapped,
  }
}

export interface ResendVerificationResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Resend verification email.
 * First tries Supabase auth.resend when user has session.
 * Falls back to Edge Function when no session (e.g. user closed link before verifying).
 */
export async function resendVerification(email?: string): Promise<ResendVerificationResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session ?? null

  if (session?.user?.email) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: session.user.email,
    })

    if (!error) {
      return {
        success: true,
        message: 'Verification email resent. Check your inbox.',
      }
    }
  }

  const emailToUse = email ?? session?.user?.email ?? ''
  const trimmed = typeof emailToUse === 'string' ? emailToUse.trim() : ''
  if (!trimmed) {
    return { success: false, error: 'Email is required to resend verification' }
  }

  try {
    const { data, error: fnError } = await supabase.functions.invoke<
      { success?: boolean; message?: string; error?: string }
    >('resend-verification', {
      body: { email: trimmed },
    })

    const result = data ?? {}
    const success = result?.success ?? false
    const errMsg = result?.error ?? fnError?.message ?? null
    const message = result?.message ?? 'Verification email resent. Check your inbox.'

    if (!success && errMsg) {
      return { success: false, error: errMsg }
    }

    return { success: true, message }
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Failed to resend verification email'
    return { success: false, error: msg }
  }
}
