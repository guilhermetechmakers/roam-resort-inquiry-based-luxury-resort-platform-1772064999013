import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ValidationSummaryProps {
  errors: string[]
  fieldErrors?: Record<string, string>
  onJumpToField?: (field: string) => void
  className?: string
}

export function ValidationSummary({
  errors,
  fieldErrors = {},
  onJumpToField,
  className,
}: ValidationSummaryProps) {
  const list = Array.isArray(errors) ? errors : []

  if (list.length === 0) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'rounded-lg border border-destructive/50 bg-destructive/5 p-4',
        className
      )}
    >
      <div className="flex gap-2">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
        <div className="flex-1">
          <h3 className="font-medium text-destructive">
            Please fix the following before publishing:
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-destructive/90">
            {list.map((err, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0">•</span>
                <span>{err}</span>
              </li>
            ))}
          </ul>
          {Object.keys(fieldErrors).length > 0 && onJumpToField && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.keys(fieldErrors).map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => onJumpToField(field)}
                  className="text-xs underline text-destructive hover:no-underline"
                >
                  Go to {field}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
