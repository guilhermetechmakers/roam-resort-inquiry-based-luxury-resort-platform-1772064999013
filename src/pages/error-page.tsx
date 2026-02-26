/**
 * 500 Server Error page for Roam Resort.
 * Gracefully communicates server-side issues, offers retry, and reporting guidance.
 * Runtime-safe: no API calls; all data guarded with nullish checks.
 */
import { useState, useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ErrorLayoutWrapper } from '@/components/error-500'

const DEFAULT_ERROR_ID = 'UNKNOWN_ERROR_ID'

interface LocationState {
  errorId?: string
}

/** Safe extraction of errorId from URL params or route state */
function useErrorId(): string {
  const [searchParams] = useSearchParams()
  const location = useLocation()

  const fromUrl = searchParams.get('errorId')
  const state = (location?.state ?? {}) as LocationState
  const fromState = typeof state?.errorId === 'string' ? state.errorId : undefined

  const raw = fromUrl ?? fromState ?? null
  return typeof raw === 'string' && raw.trim().length > 0
    ? raw.trim()
    : DEFAULT_ERROR_ID
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
      supportLink="/contact"
      showHomeLink
      isRetrying={isRetrying}
    />
  )
}
