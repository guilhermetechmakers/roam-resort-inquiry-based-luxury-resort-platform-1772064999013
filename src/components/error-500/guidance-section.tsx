/**
 * GuidanceSection - Actionable steps to report the issue.
 * Resilient to missing data: links/email hidden gracefully if not provided.
 */
import { Link } from 'react-router-dom'
import { Mail, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GuidanceSectionProps {
  /** Support email; if absent, section hides contact link */
  supportEmail?: string | null
  /** Support form URL; if absent, uses contact page as fallback */
  supportLink?: string | null
  /** Error ID to include in guidance (guarded) */
  errorId?: string
  className?: string
}

const REPORT_STEPS = [
  'Include the Error ID shown above',
  'Describe what you were doing when the error occurred',
  'Note your browser and device (e.g., Chrome on Windows)',
] as const

export function GuidanceSection({
  supportEmail,
  supportLink,
  errorId,
  className,
}: GuidanceSectionProps) {
  const hasEmail = typeof supportEmail === 'string' && supportEmail.trim().length > 0
  const contactUrl = (typeof supportLink === 'string' && supportLink.trim().length > 0)
    ? supportLink.trim()
    : '/contact'

  return (
    <section
      className={cn('text-left', className)}
      aria-labelledby="guidance-heading"
    >
      <h2
        id="guidance-heading"
        className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Need more help?
      </h2>
      <p className="mt-3 text-sm text-foreground">
        If the issue persists, please report it to our support team. Include the
        following information:
      </p>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground" role="list">
        {(REPORT_STEPS ?? []).map((step, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {step}
          </li>
        ))}
        {errorId && (
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            Error ID: <code className="font-mono text-foreground">{errorId}</code>
          </li>
        )}
      </ul>
      <div className="mt-6 flex flex-wrap gap-4">
        {hasEmail && (
          <a
            href={`mailto:${supportEmail!.trim()}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/90 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
          >
            <Mail className="h-4 w-4" aria-hidden />
            {supportEmail!.trim()}
          </a>
        )}
        <Link
          to={contactUrl}
          className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/90 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          Contact Support
        </Link>
      </div>
    </section>
  )
}
