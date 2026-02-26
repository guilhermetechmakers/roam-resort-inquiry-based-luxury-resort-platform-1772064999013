/**
 * AuthGate - Route protection wrapper for guest/host/concierge flows.
 * Alias for ProtectedRoute with consistent naming for auth-gated flows.
 * Redirects unauthenticated users to login; enforces role-based access.
 */

import { ProtectedRoute } from './protected-route'
import type { UserRole } from '@/types'

export interface AuthGateProps {
  children: React.ReactNode
  /** Required role: guest (any auth), host, or concierge */
  role?: UserRole
  /** If true, redirect unauthenticated users to /login?redirect=... */
  redirectToLogin?: boolean
}

/**
 * Guards routes by authentication and optional role.
 * - Unauthenticated + redirectToLogin -> /login?redirect=currentPath
 * - Authenticated but wrong role -> access denied message
 */
export function AuthGate({
  children,
  role,
  redirectToLogin = true,
}: AuthGateProps) {
  return (
    <ProtectedRoute role={role} redirectToLogin={redirectToLogin}>
      {children}
    </ProtectedRoute>
  )
}
