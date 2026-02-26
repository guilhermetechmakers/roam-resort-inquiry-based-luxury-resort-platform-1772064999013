/**
 * ErrorCard - Visual container with soft elevation, rounded corners, light borders.
 * Displays errorId and a brief explanation. Runtime-safe: errorId guarded.
 */
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

export interface ErrorCardProps {
  /** Error reference ID; guarded with fallback to UNKNOWN_ERROR_ID */
  errorId: string
  /** Optional brief explanation */
  explanation?: string
  className?: string
}

/** Safe validation: ensure errorId is a string before display */
function safeErrorId(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : 'UNKNOWN_ERROR_ID'
}

export function ErrorCard({ errorId, explanation, className }: ErrorCardProps) {
  const id = safeErrorId(errorId ?? 'UNKNOWN_ERROR_ID')

  return (
    <Card
      className={cn(
        'border-secondary/60 bg-card/95 shadow-card backdrop-blur-sm',
        className
      )}
    >
      <CardContent className="p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Error Reference
        </p>
        <p
          className="mt-2 font-mono text-lg font-semibold text-foreground"
          aria-label={`Error ID: ${id}`}
        >
          {id}
        </p>
        {explanation && (
          <p className="mt-3 text-sm text-muted-foreground">{explanation}</p>
        )}
      </CardContent>
    </Card>
  )
}
