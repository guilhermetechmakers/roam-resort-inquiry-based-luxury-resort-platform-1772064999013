/**
 * 500 Server Error page for Roam Resort.
 * Gracefully communicates server-side issues, offers retry, and reporting guidance.
 * Runtime-safe: no API calls; all data guarded with nullish checks.
 */
import { useState, useCallback, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ErrorLayoutWrapper } from '@/components/error-500'

const DEFAULT_ERROR_ID = 'UNKNOWN_ERROR_ID'

interface LocationState {
  errorId?: string
}

/** Generate a unique error reference for support tracking */
function generateErrorId(): string {
  try {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let ref = 'RR-500-'
    for (let i = 0; i < 8; i++) {
      ref += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return ref
  } catch {
    return DEFAULT_ERROR_ID
  }
}

/** Safe extraction of errorId from URL params, route state, or generated fallback */
function useErrorId(): string {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const generated = useMemo(() => generateErrorId(), [])

  const fromUrl = searchParams.get('errorId')
  const state = (location?.state ?? {}) as LocationState
  const fromState = typeof state?.errorId === 'string' ? state.errorId : undefined

  const raw = fromUrl ?? fromState ?? null
  return typeof raw === 'string' && raw.trim().length > 0
    ? raw.trim()
    : generated
}

export function ErrorPage() {
  const [isRetrying, setIsRetrying] = useState(false)
  const errorId = useErrorId()

  const handleRetry = useCallback(() => {
    setIsRetrying(true)
    window.setTimeout(() => {
      window.location.reload()
    }, 300)
    window.setTimeout(() => {
      setIsRetrying(false)
    }, 2000)
  }, [])

  return (
    <ErrorLayoutWrapper
      title="We're sorry — something went wrong"
      subtitle="Our team has been notified. Please try again, or reach out if the problem persists."
      errorId={errorId}
      onRetry={handleRetry}
      supportEmail="support@roamresort.com"
      supportLink="/contact"
      showHomeLink
      isRetrying={isRetrying}
    />
  )
}
