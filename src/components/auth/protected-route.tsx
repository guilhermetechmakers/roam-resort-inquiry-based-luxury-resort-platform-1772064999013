import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import type { UserRole } from '@/types'

export interface ProtectedRouteProps {
  children: React.ReactNode
  /** Required role; if not met, show access denied or redirect */
  role?: UserRole
  /** If true, redirect unauthenticated users to login */
  redirectToLogin?: boolean
}

/**
 * Guards routes by auth and role.
 * - When redirectToLogin: unauthenticated users go to /login?redirect=...
 * - When role specified: users without role see access denied (handled by child pages)
 */
export function ProtectedRoute({
  children,
  role,
  redirectToLogin = true,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { user, isLoading, hasRole } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user && redirectToLogin) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace state={{ from: location }} />
  }

  if (role && user && !hasRole(role)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">
          Access denied. {role === 'concierge' ? 'Admin' : 'Host'} role required.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
