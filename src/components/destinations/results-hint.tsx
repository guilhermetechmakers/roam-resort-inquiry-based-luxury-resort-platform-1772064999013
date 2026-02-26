import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ResultsHintFilters {
  region?: string
  style?: string
  tags?: string[]
  query?: string
}

export interface ResultsHintProps {
  total: number
  filters: ResultsHintFilters
  onReset?: () => void
  className?: string
}

export function ResultsHint({
  total,
  filters,
  onReset,
  className,
}: ResultsHintProps) {
  const tagsArr = Array.isArray(filters.tags) ? filters.tags : []
  const hasActiveFilters =
    (filters.region ?? '').trim() !== '' ||
    (filters.style ?? '').trim() !== '' ||
    (filters.query ?? '').trim() !== '' ||
    tagsArr.length > 0

  const label =
    total === 0
      ? 'No destinations found'
      : total === 1
        ? '1 destination'
        : `${total} destinations`

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 text-sm text-muted-foreground',
        className
      )}
    >
      <span>{label}</span>
      {hasActiveFilters && (
        <>
          <span aria-hidden>·</span>
          <span>Filtered by region, style, tags, or keyword</span>
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-muted-foreground hover:text-foreground"
              onClick={onReset}
              aria-label="Clear all filters"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </>
      )}
    </div>
  )
}
