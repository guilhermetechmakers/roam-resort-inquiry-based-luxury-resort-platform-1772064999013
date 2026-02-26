import * as React from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { auditLog } from '@/lib/audit-logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseUserMeta = any
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  supabaseUser: SupabaseUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string, fullName?: string, role?: 'guest' | 'host' | 'concierge') => Promise<{ user: User; needsEmailVerification?: boolean }>
  signOut: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  requestPasswordReset: (email: string) => Promise<void>
}

export const AuthContext = React.createContext<AuthContextValue | null>(null)

function mapSupabaseUser(u: SupabaseUser | null): User | null {
  if (!u) return null
  const meta = (u.user_metadata ?? {}) as SupabaseUserMeta
  const emailConfirmed = !!(u.email_confirmed_at ?? (u as { confirmed_at?: boolean })?.confirmed_at)
  return {
    id: u.id,
    email: u.email ?? '',
    role: (meta.role as UserRole) ?? 'guest',
    full_name: meta.full_name,
    avatar_url: meta.avatar_url,
    created_at: u.created_at,
    updated_at: (u as { updated_at?: string }).updated_at ?? u.created_at,
    is_email_verified: emailConfirmed,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    supabaseUser: null,
    isLoading: true,
    isAuthenticated: false,
  })

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setState({
        user: mapSupabaseUser(u),
        supabaseUser: u,
        isLoading: false,
        isAuthenticated: !!u,
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setState({
        user: mapSupabaseUser(u),
        supabaseUser: u,
        isLoading: false,
        isAuthenticated: !!u,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = React.useCallback(async (email: string, password: string) => {
    auditLog('login_attempt', { email })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      auditLog('login_failure', { email, error: error.message })
      throw error
    }
    auditLog('login_success', { email, userId: data?.user?.id })
    const u = data?.user ?? null
    const mapped = mapSupabaseUser(u)
    if (!mapped) throw new Error('Login failed')
    try {
      const { createSession } = await import('@/api/sessions')
      const { setStoredSessionId } = await import('@/api/profile')
      const result = await createSession()
      if (result?.sessionId) setStoredSessionId(result.sessionId)
    } catch {
      // Session create is best-effort
    }
    return mapped
  }, [])

  const signUp = React.useCallback(
    async (email: string, password: string, fullName?: string, role?: 'guest' | 'host' | 'concierge') => {
      auditLog('signup_attempt', { email })
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: role ?? 'guest' },
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      })
      if (error) {
        auditLog('signup_failure', { email, error: error.message })
        throw error
      }
      auditLog('signup_success', { email, userId: data?.user?.id })
      const u = data?.user ?? null
      const mapped = mapSupabaseUser(u)
      if (!mapped) throw new Error('Signup failed')
      const needsEmailVerification =
        !(u as { email_confirmed_at?: string })?.email_confirmed_at &&
        !(u as { confirmed_at?: boolean })?.confirmed_at
      if (!needsEmailVerification) {
        try {
          const { createSession } = await import('@/api/sessions')
          const { setStoredSessionId } = await import('@/api/profile')
          const result = await createSession()
          if (result?.sessionId) setStoredSessionId(result.sessionId)
        } catch {
          // Session create is best-effort
        }
      }
      return { user: mapped, needsEmailVerification: !!needsEmailVerification }
    },
    []
  )

  const signOut = React.useCallback(async () => {
    auditLog('logout')
    try {
      sessionStorage.removeItem('roam-session-id')
    } catch {
      // ignore
    }
    await supabase.auth.signOut()
  }, [])

  const requestPasswordReset = React.useCallback(async (email: string) => {
    auditLog('password_reset_request', { email })
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-reset`,
    })
    if (error) {
      auditLog('password_reset_failure', { email, error: error.message })
      throw error
    }
    auditLog('password_reset_success', { email })
  }, [])

  const hasRole = React.useCallback(
    (role: UserRole) => {
      if (!state.user) return false
      if (role === 'concierge') return state.user.role === 'concierge' || state.user.role === 'admin'
      if (role === 'host') return state.user.role === 'host' || state.user.role === 'concierge' || state.user.role === 'admin'
      return true
    },
    [state.user]
  )

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    hasRole,
    requestPasswordReset,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
