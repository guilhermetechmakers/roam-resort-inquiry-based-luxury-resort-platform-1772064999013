import type { User } from '@/types'
import type { UserRole } from '@/types/auth'

/** Check if user is authenticated */
export function isAuthenticated(user: User | null): boolean {
  return user != null && !!user.id
}

/** Check if user has a specific role (or higher) */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false
  if (role === 'concierge') return user.role === 'concierge'
  if (role === 'host') return user.role === 'host' || user.role === 'concierge'
  return true // guest or any
}

/** Get redirect path for role after login */
export function getRoleRedirectPath(role: UserRole): string {
  switch (role) {
    case 'concierge':
      return '/admin'
    case 'host':
      return '/host'
    case 'guest':
    default:
      return '/destinations'
  }
}
