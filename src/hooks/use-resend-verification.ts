/**
 * Hook for resending verification email.
 */

import { useState, useCallback } from 'react'
import { resendVerification } from '@/api/verification'
import { isValidEmail } from '@/lib/validation/auth-validation'

export interface UseResendVerificationState {
  isLoading: boolean
  error: string | null
}

export function useResendVerification() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resend = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      const trimmed = typeof email === 'string' ? email.trim() : ''
      if (!trimmed) {
        const err = 'Email is required'
        setError(err)
        return { success: false, error: err }
      }
      if (!isValidEmail(trimmed)) {
        const err = 'Please enter a valid email address'
        setError(err)
        return { success: false, error: err }
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await resendVerification(trimmed)
        if (result.success) {
          return { success: true }
        }
        const err = result.error ?? 'Failed to resend verification email'
        setError(err)
        return { success: false, error: err }
      } catch (err) {
        const msg = (err as Error)?.message ?? 'Failed to resend verification email'
        setError(msg)
        return { success: false, error: msg }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { resend, isLoading, error }
}
