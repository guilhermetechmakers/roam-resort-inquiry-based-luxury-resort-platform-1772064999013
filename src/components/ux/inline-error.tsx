/**
 * Field-level error message with ARIA attributes for accessibility.
 */

import { cn } from '@/lib/utils'

export interface InlineErrorProps {
  message: string
  id?: string
  className?: string
}

export function InlineError({ message, id, className }: InlineErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn('mt-1 text-sm text-destructive', className)}
    >
      {message}
    </p>
  )
}
