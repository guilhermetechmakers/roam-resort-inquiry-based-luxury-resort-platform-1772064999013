/**
 * Password reset API - wraps Supabase Auth for token-driven password reset.
 * Uses Supabase's built-in reset flow: resetPasswordForEmail sends link,
 * user lands with recovery session in hash; updateUser completes reset.
 */

import { supabase } from '@/lib/supabase'

export interface RequestResetResponse {
  success: boolean
  message?: string
  tokenExpiryMinutes?: number
}

export interface ResetPasswordResponse {
  success: boolean
  message?: string
}

export interface ValidateTokenResponse {
  valid: boolean
  userId?: string
  expiresAt?: string
}

/** Request password reset email. Supabase sends link with recovery token. */
export async function postRequestReset(
  email: string
): Promise<RequestResetResponse> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/password-reset`,
  })

  if (error) {
    return {
      success: false,
      message: error.message ?? 'Failed to send reset email',
    }
  }

  return {
    success: true,
    message: 'Check your email for the reset link.',
    tokenExpiryMinutes: 60,
  }
}

/** Reset password when user has valid recovery session from email link. */
export async function postResetPassword({
  password,
}: {
  token?: string
  password: string
}): Promise<ResetPasswordResponse> {
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return {
      success: false,
      message: error.message ?? 'Failed to update password',
    }
  }

  await supabase.auth.signOut()
  return {
    success: true,
    message: 'Password updated successfully.',
  }
}

/**
 * Pre-check if user has valid recovery session.
 * Supabase establishes session from URL hash; we check for active session.
 */
export async function getTokenValidation(): Promise<ValidateTokenResponse> {
  const { data } = await supabase.auth.getSession()
  const session = data?.session ?? null

  if (!session?.user) {
    return { valid: false }
  }

  return {
    valid: true,
    userId: session.user.id,
    expiresAt: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : undefined,
  }
}
