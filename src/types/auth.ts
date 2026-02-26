/** User roles for Roam Resort */
export type UserRole = 'guest' | 'host' | 'concierge'

/** Auth response shape from login/signup */
export interface AuthUser {
  id: string
  email: string
  name?: string
  role: UserRole
  emailVerified?: boolean
}

export interface AuthResponse {
  sessionToken?: string
  user: AuthUser
}

export interface AuthError {
  message: string
  code?: string
  details?: unknown
}

/** Signup response may indicate email verification needed */
export interface SignupResponse {
  user: AuthUser
  needsEmailVerification?: boolean
}
