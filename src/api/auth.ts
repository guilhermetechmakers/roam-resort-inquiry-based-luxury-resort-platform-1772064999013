/**
 * Auth API - wraps Supabase Auth for login, signup, password reset, session.
 * All responses validated with null/undefined guards per runtime safety rules.
 */

import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/auth'
import type { User } from '@/types'

export interface LoginPayload {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupPayload {
  name: string
  email: string
  password: string
}

export interface AuthSessionResponse {
  user: User | null
  token: string | null
  expiresAt: string | null
}

function mapSupabaseUser(
  u: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at?: string } | null
): User | null {
  if (!u) return null
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>
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

/** Login with email/password */
export async function login(payload: LoginPayload): Promise<{ sessionToken: string; user: User }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  if (error) throw error

  const session = data?.session ?? null
  const user = data?.user ?? null

  if (!session || !user) {
    throw new Error('Login failed: no session returned')
  }

  const mappedUser = mapSupabaseUser(user)
  if (!mappedUser) throw new Error('Login failed: could not map user')

  return {
    sessionToken: session.access_token ?? '',
    user: mappedUser,
  }
}

/** Sign up with email/password */
export async function signup(
  payload: SignupPayload
): Promise<{ user: User; needsEmailVerification?: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.name,
        role: 'guest' as UserRole,
      },
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify`,
    },
  })

  if (error) throw error

  const user = data?.user ?? null
  if (!user) throw new Error('Signup failed: no user returned')

  const mappedUser = mapSupabaseUser(user)
  if (!mappedUser) throw new Error('Signup failed: could not map user')

  const needsEmailVerification =
    !user.email_confirmed_at && !user.confirmed_at

  return {
    user: mappedUser,
    needsEmailVerification: needsEmailVerification ?? undefined,
  }
}

/** Request password reset email */
export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/password-reset`,
  })

  if (error) throw error
  return { ok: true }
}

/** Reset password (when user has valid recovery token from email link) */
export async function resetPassword(newPassword: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) throw error
  return { ok: true }
}

/** Get current session */
export async function getCurrentSession(): Promise<AuthSessionResponse | null> {
  const { data } = await supabase.auth.getSession()
  const session = data?.session ?? null
  const user = session?.user ?? null

  if (!session || !user) return null

  return {
    user: mapSupabaseUser(user),
    token: session.access_token ?? null,
    expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
  }
}

/** Logout */
export async function logout(): Promise<{ ok: boolean }> {
  await supabase.auth.signOut()
  return { ok: true }
}
