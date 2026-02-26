import { Link } from 'react-router-dom'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DestinationEmptyStateProps {
  onReset?: () => void
  hasActiveFilters?: boolean
  className?: string
}

export function DestinationEmptyState({
  onReset,
  hasActiveFilters = false,
  className,
}: DestinationEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        'rounded-xl border border-border bg-card/50',
        className
      )}
      role="status"
    >
      <div className="rounded-full bg-secondary/50 p-4">
        <MapPin className="h-12 w-12 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="mt-6 font-serif text-2xl font-semibold text-foreground">
        No destinations match your search
      </h3>
      <p className="mt-3 max-w-md text-muted-foreground">
        Try broadening your filters or search terms. You can also browse all
        destinations to discover what we have to offer.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {hasActiveFilters && onReset && (
          <Button variant="outline" onClick={onReset} aria-label="Clear filters">
            Clear filters
          </Button>
        )}
        <Link to="/destinations" onClick={onReset}>
          <Button aria-label="Browse all destinations">
            <Search className="mr-2 h-4 w-4" />
            Browse All Destinations
          </Button>
        </Link>
      </div>
    </div>
  )
}
