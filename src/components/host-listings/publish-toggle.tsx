import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ListingStatus } from '@/types'

export interface PublishToggleProps {
  status: ListingStatus
  onStatusChange: (status: ListingStatus) => void
  validationErrors: string[]
  isPublishing?: boolean
  disabled?: boolean
  className?: string
}

export function PublishToggle({
  status,
  onStatusChange,
  validationErrors,
  isPublishing,
  disabled,
  className,
}: PublishToggleProps) {
  const canPublish = validationErrors.length === 0
  const isLive = status === 'live'

  return (
    <Card className={cn('border-border shadow-card', className)}>
      <CardHeader>
        <h3 className="font-serif text-lg font-semibold">Visibility</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onStatusChange('draft')}
            disabled={disabled}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              !isLive
                ? 'bg-accent/20 text-accent ring-2 ring-accent'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            )}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => canPublish && onStatusChange('live')}
            disabled={disabled || !canPublish}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              isLive
                ? 'bg-accent/20 text-accent ring-2 ring-accent'
                : canPublish
                  ? 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  : 'cursor-not-allowed bg-secondary/30 text-muted-foreground opacity-60'
            )}
          >
            Live
          </button>
        </div>
        {validationErrors.length > 0 && (
          <ul className="space-y-1 text-sm text-destructive">
            {validationErrors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        )}
        {isPublishing && (
          <p className="text-sm text-muted-foreground">Publishing...</p>
        )}
      </CardContent>
    </Card>
  )
}
