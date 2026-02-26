import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getTokenValidation, postRequestReset, postResetPassword } from '@/api/password-reset'

export type PasswordResetMode = 'request' | 'reset' | 'success' | 'invalid-token'

export type SuccessType = 'request' | 'reset'

export interface UsePasswordResetState {
  mode: PasswordResetMode
  successType: SuccessType | null
  isLoading: boolean
  isCheckingSession: boolean
  error: string | null
  userEmail: string
}

function hasRecoveryHash(): boolean {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash ?? ''
  return hash.includes('type=recovery') || hash.includes('access_token=')
}

export function usePasswordReset() {
  const [mode, setMode] = useState<PasswordResetMode>('request')
  const [successType, setSuccessType] = useState<SuccessType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')

  const checkRecoverySession = useCallback(async () => {
    setIsCheckingSession(true)
    setError(null)
    try {
      const result = await getTokenValidation()
      const hashHasRecovery = hasRecoveryHash()
      if (result?.valid) {
        setMode('reset')
      } else if (hashHasRecovery) {
        setMode('invalid-token')
      } else {
        setMode('request')
      }
    } catch {
      const hashHasRecovery = hasRecoveryHash()
      setMode(hashHasRecovery ? 'invalid-token' : 'request')
    } finally {
      setIsCheckingSession(false)
    }
  }, [])

  useEffect(() => {
    checkRecoverySession()
  }, [checkRecoverySession])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkRecoverySession()
    })
    return () => subscription.unsubscribe()
  }, [checkRecoverySession])

  const requestReset = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await postRequestReset(email)
      if (result?.success) {
        setUserEmail(email)
        setSuccessType('request')
        setMode('success')
        return true
      }
      setError(result?.message ?? 'Failed to send reset email')
      return false
    } catch (err) {
      const msg = (err as Error)?.message ?? 'Failed to send reset email'
      setError(msg)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(
    async (data: { password: string; confirmPassword: string }): Promise<boolean> => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await postResetPassword({
          password: data.password,
        })
        if (result?.success) {
          setSuccessType('reset')
          setMode('success')
          return true
        }
        setError(result?.message ?? 'Failed to update password')
        return false
      } catch (err) {
        const msg = (err as Error)?.message ?? 'Failed to update password'
        setError(msg)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    mode,
    successType,
    isLoading,
    isCheckingSession,
    error,
    userEmail,
    requestReset,
    resetPassword,
    checkRecoverySession,
  }
}
