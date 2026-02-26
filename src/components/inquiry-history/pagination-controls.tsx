import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PaginationControlsProps {
  hasNext: boolean
  hasPrev: boolean
  onNext: () => void
  onPrev: () => void
  currentPage: number
  totalPages?: number
  totalItems?: number
  className?: string
}

/**
 * Pagination controls with prev/next and optional page info.
 */
export function PaginationControls({
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  currentPage,
  totalPages,
  totalItems,
  className,
}: PaginationControlsProps) {
  return (
    <nav
      className={cn('flex items-center justify-between gap-4', className)}
      aria-label="Pagination"
    >
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {(totalPages != null || totalItems != null) && (
        <p className="text-sm text-muted-foreground">
          {totalPages != null && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
          {totalItems != null && totalPages != null && ' • '}
          {totalItems != null && (
            <span>{totalItems} total</span>
          )}
        </p>
      )}
    </nav>
  )
}
