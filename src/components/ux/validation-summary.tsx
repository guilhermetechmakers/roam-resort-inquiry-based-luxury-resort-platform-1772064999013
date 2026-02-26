/**
 * Consolidated form validation messages.
 * Displays field-level errors in a single panel for accessibility.
 */

import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ValidationSummaryProps {
  errors: Array<{ field: string; message: string }>
  id?: string
  title?: string
  className?: string
}

export function ValidationSummary({
  errors,
  id = 'form-errors',
  title = 'Please fix the following:',
  className,
}: ValidationSummaryProps) {
  const list = Array.isArray(errors) ? errors : []
  if (list.length === 0) return null

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'rounded-lg border border-destructive/50 bg-destructive/10 p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-destructive">{title}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-destructive">
            {list.map(({ field, message }) => (
              <li key={field}>
                <span className="sr-only">{field}: </span>
                {message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
