import * as React from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

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
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (role: UserRole) => boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function mapSupabaseUser(u: SupabaseUser | null): User | null {
  if (!u) return null
  const meta = (u.user_metadata ?? {}) as SupabaseUserMeta
  return {
    id: u.id,
    email: u.email ?? '',
    role: (meta.role as UserRole) ?? 'guest',
    full_name: meta.full_name,
    avatar_url: meta.avatar_url,
    created_at: u.created_at,
    updated_at: (u as { updated_at?: string }).updated_at ?? u.created_at,
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = React.useCallback(
    async (email: string, password: string, fullName?: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: 'guest' } },
      })
      if (error) throw error
    },
    []
  )

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const hasRole = React.useCallback(
    (role: UserRole) => {
      if (!state.user) return false
      if (role === 'concierge') return state.user.role === 'concierge'
      if (role === 'host') return state.user.role === 'host' || state.user.role === 'concierge'
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
