import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Skeleton } from '@/components/ui/skeleton'
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
        <Skeleton className="h-12 w-48 rounded-lg" aria-hidden />
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Skeleton className="h-10 w-full rounded-md" aria-hidden />
          <Skeleton className="h-10 w-full rounded-md" aria-hidden />
          <Skeleton className="h-10 w-48 rounded-md" aria-hidden />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Loading...
        </p>
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
