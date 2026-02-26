/**
 * Spinner - Accessible SVG-based loader with aria-label and screen reader support.
 * Configurable size and color to align with Roam Resort design system.
 */
import { cn } from '@/lib/utils'

export interface SpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Tailwind color class for the spinner stroke */
  className?: string
  /** Accessible label for screen readers */
  'aria-label'?: string
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
}

export function Spinner({
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Loading',
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      className={cn('inline-flex items-center justify-center', className)}
    >
      <svg
        className={cn('animate-spin text-accent', sizeClasses[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-100"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  )
}
