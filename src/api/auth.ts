/**
 * Auth API - centralizes authentication-related API calls.
 * Uses Supabase Auth for register, login, logout, verify, password reset.
 * Profile data via fetchCurrentProfile from profile.ts.
 *
 * Backend: Supabase Auth (auth.users) + Edge Functions for resend-verification.
 * No custom REST backend - Supabase handles auth endpoints.
 */

import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import type { UserRole } from '@/types/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseUserMeta = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseUser(u: any): User | null {
  if (!u || typeof u !== 'object') return null
  const meta = (u.user_metadata ?? {}) as SupabaseUserMeta
  const emailConfirmed =
    !!(u.email_confirmed_at ?? null) || !!(u.confirmed_at === true)
  return {
    id: u.id,
    email: u.email ?? '',
    role: (meta.role as UserRole) ?? 'guest',
    full_name: meta.full_name,
    avatar_url: meta.avatar_url,
    created_at: u.created_at ?? '',
    updated_at: (meta.updated_at as string) ?? u.created_at ?? '',
    is_email_verified: emailConfirmed,
  }
}

export interface RegisterPayload {
  email: string
  password: string
  fullName?: string
}

export interface RegisterResponse {
  user: User
  needsEmailVerification?: boolean
}

/** Register new user (Supabase signUp) */
export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: { full_name: payload.fullName, role: 'guest' },
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify`,
    },
  })
  if (error) throw error
  const u = data?.user ?? null
  const mapped = mapSupabaseUser(u)
  if (!mapped) throw new Error('Signup failed')
  const needsEmailVerification =
    !(u as { email_confirmed_at?: string })?.email_confirmed_at &&
    !(u as { confirmed_at?: boolean })?.confirmed_at
  return { user: mapped, needsEmailVerification: !!needsEmailVerification }
}

export interface LoginPayload {
  email: string
  password: string
}

/** Login (Supabase signInWithPassword) */
export async function login(payload: LoginPayload): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })
  if (error) throw error
  const u = data?.user ?? null
  const mapped = mapSupabaseUser(u)
  if (!mapped) throw new Error('Login failed')
  return mapped
}

/** Logout (Supabase signOut) */
export async function logout(): Promise<void> {
  await supabase.auth.signOut()
}

/** Request password reset email */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/password-reset`,
  })
  if (error) throw error
}

/** Reset password when user has valid recovery session (from email link) */
export async function resetPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  await supabase.auth.signOut()
}
