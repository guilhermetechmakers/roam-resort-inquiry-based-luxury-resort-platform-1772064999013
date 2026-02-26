import * as React from 'react'
import type { User, UserRole } from '@/types'

export interface AuthState {
  user: User | null
  supabaseUser: import('@supabase/supabase-js').User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string, fullName?: string, role?: 'guest' | 'host' | 'concierge') => Promise<{ user: User; needsEmailVerification?: boolean }>
  signOut: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  requestPasswordReset: (email: string) => Promise<void>
}

export const AuthContext = React.createContext<AuthContextValue | null>(null)
