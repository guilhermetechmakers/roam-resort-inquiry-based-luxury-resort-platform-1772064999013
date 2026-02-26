import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getRoleRedirectPath } from '@/lib/guards'
import type { User } from '@/types'
import type { UserRole } from '@/types/auth'

export interface RedirectHandlerProps {
  user: User | null
  isLoading: boolean
  /** If true, redirect authenticated users away from auth pages */
  redirectIfAuthenticated?: boolean
  /** Override redirect path (e.g. from ?redirect= query) */
  redirectTo?: string | null
}

/**
 * Handles post-auth routing based on user role.
 * - Guest -> /destinations
 * - Host -> /host
 * - Concierge -> /admin
 * Uses ?redirect= query param when provided (and valid).
 */
export function RedirectHandler({
  user,
  isLoading,
  redirectIfAuthenticated = false,
  redirectTo,
}: RedirectHandlerProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (isLoading) return

    const redirect = redirectTo ?? searchParams.get('redirect')

    if (user && redirectIfAuthenticated) {
      // User is logged in on auth page -> redirect away
      const path =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//')
          ? redirect
          : getRoleRedirectPath(user.role as UserRole)
      navigate(path, { replace: true })
    }
  }, [user, isLoading, redirectIfAuthenticated, redirectTo, searchParams, navigate])

  return null
}
