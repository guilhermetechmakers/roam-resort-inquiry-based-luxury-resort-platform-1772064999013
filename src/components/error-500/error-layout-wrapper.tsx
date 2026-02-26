/**
 * ErrorLayoutWrapper - Centralizes typography, alignment, and layout for error pages.
 * Handles safe rendering when data is missing. Runtime-safe: all props guarded.
 */
import { cn } from '@/lib/utils'
import { HeroVisual } from './hero-visual'
import { ErrorCard } from './error-card'
import { RetryCTA } from './retry-cta'
import { GuidanceSection } from './guidance-section'
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export interface ErrorLayoutWrapperProps {
  /** Main heading */
  title?: string
  /** Supporting subtitle */
  subtitle?: string
  /** Error reference ID; guarded with fallback */
  errorId?: string | null
  /** Retry handler; if absent, RetryCTA navigates to / */
  onRetry?: () => void
  /** Optional support email */
  supportEmail?: string | null
  /** Optional support form URL */
  supportLink?: string | null
  /** Show compact homepage link */
  showHomeLink?: boolean
  /** Loading state for retry */
  isRetrying?: boolean
  /** Skeleton/loading state for content */
  isLoading?: boolean
  className?: string
}

function safeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback
}

export function ErrorLayoutWrapper({
  title,
  subtitle,
  errorId,
  onRetry,
  supportEmail,
  supportLink,
  showHomeLink = true,
  isRetrying = false,
  isLoading = false,
  className,
}: ErrorLayoutWrapperProps) {
  const safeTitle = safeString(title, "We're sorry — something went wrong")
  const safeSubtitle =
    safeString(
      subtitle,
      'Our team has been notified. Please try again, or reach out if the problem persists.'
    ) ?? ''
  const safeErrorId = typeof errorId === 'string' && errorId.trim().length > 0
    ? errorId.trim()
    : 'UNKNOWN_ERROR_ID'

  if (isLoading) {
    return (
      <div
        className={cn(
          'relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-16',
          className
        )}
      >
        <HeroVisual />
        <div className="relative z-10 mx-auto max-w-xl w-full space-y-6 animate-pulse">
          <div className="h-12 w-3/4 mx-auto rounded-lg bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 mx-auto rounded bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-12 w-40 mx-auto rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-16',
        className
      )}
    >
      <HeroVisual />
      <div className="relative z-10 mx-auto max-w-xl w-full text-center">
        <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl animate-fade-in-up">
          {safeTitle}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed animate-fade-in-up">
          {safeSubtitle}
        </p>

        <div className="mt-10 flex justify-center w-full max-w-md mx-auto animate-fade-in-up">
          <ErrorCard
            errorId={safeErrorId}
            explanation="Share this reference when contacting support."
            className="w-full"
          />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
          <RetryCTA onRetry={onRetry} isLoading={isRetrying} />
          {showHomeLink && (
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded transition-colors"
            >
              <Home className="h-4 w-4" aria-hidden />
              Return to Home
            </Link>
          )}
        </div>

        <div className="mt-16 pt-12 border-t border-border max-w-md mx-auto animate-fade-in-up">
          <GuidanceSection
            supportEmail={supportEmail ?? undefined}
            supportLink={supportLink ?? '/contact'}
            errorId={safeErrorId}
          />
        </div>
      </div>
    </div>
  )
}
