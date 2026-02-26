/**
 * Hook for email verification flow.
 * Handles both Supabase hash redirect and query token verification.
 */

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  verifyToken,
  getSessionAfterRedirect,
} from '@/api/verification'
import {
  hasVerificationHash,
  hasVerificationToken,
  parseQueryParam,
} from '@/lib/url-utils'
import type { User } from '@/types'

export type VerificationStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseVerifyTokenState {
  verificationStatus: VerificationStatus
  errorMessage: string | null
  user: User | null
  hasTokenOrHash: boolean
}

export function useVerifyToken() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null)

  const runVerification = useCallback(async () => {
    setVerificationStatus('loading')
    setErrorMessage(null)
    setVerifiedUser(null)

    try {
      // Flow 1: Hash params (Supabase default redirect) - getSession() triggers Supabase to process hash
      if (hasVerificationHash()) {
        const result = await getSessionAfterRedirect()
        if (result.success && result.user) {
          setVerifiedUser(result.user)
          setVerificationStatus('success')
          return
        }
        setErrorMessage(result.error ?? 'Verification link is invalid or has expired.')
        setVerificationStatus('error')
        return
      }

      // Flow 2: Token in query param (token, verification_token, token_hash)
      const token =
        parseQueryParam('token') ||
        parseQueryParam('verification_token') ||
        parseQueryParam('token_hash')
      if (token && token.length > 0) {
        const result = await verifyToken(token)
        if (result.success && result.user) {
          setVerifiedUser(result.user)
          setVerificationStatus('success')
          return
        }
        setErrorMessage(result.error ?? 'Invalid or expired token')
        setVerificationStatus('error')
        return
      }

      // Flow 3: No token - check if already verified (e.g. user navigated back)
      if (authUser) {
        const { supabase } = await import('@/lib/supabase')
        const { data } = await supabase.auth.getUser()
        const u = data?.user ?? null
        if (u?.email_confirmed_at ?? (u as { confirmed_at?: boolean })?.confirmed_at) {
          setVerifiedUser(authUser)
          setVerificationStatus('success')
          return
        }
      }

      setVerificationStatus('error')
      setErrorMessage('No verification token found. Please use the link from your email.')
    } catch (err) {
      const msg = (err as Error)?.message ?? 'Verification failed'
      setErrorMessage(msg)
      setVerificationStatus('error')
    }
  }, [authUser])

  useEffect(() => {
    if (authLoading) return

    const token = parseQueryParam('token') || parseQueryParam('verification_token')
    const hash = hasVerificationHash()

    if (token || hash) {
      runVerification()
    } else if (authUser) {
      // User might already be verified - check session
      const checkSession = async () => {
        const { supabase } = await import('@/lib/supabase')
        const { data } = await supabase.auth.getSession()
        const u = data?.session?.user ?? null
        if (u?.email_confirmed_at ?? (u as { confirmed_at?: boolean })?.confirmed_at) {
          setVerifiedUser(authUser)
          setVerificationStatus('success')
        } else {
          setVerificationStatus('error')
          setErrorMessage('No verification token found. Please use the link from your email.')
        }
      }
      checkSession()
    } else {
      setVerificationStatus('error')
      setErrorMessage('No verification token found. Please use the link from your email.')
    }
  }, [authLoading, authUser, runVerification])

  const hasTokenOrHash =
    hasVerificationToken() || hasVerificationHash()

  const user = verifiedUser ?? authUser ?? null

  return {
    verificationStatus,
    errorMessage,
    user,
    hasTokenOrHash,
    retry: runVerification,
  }
}
