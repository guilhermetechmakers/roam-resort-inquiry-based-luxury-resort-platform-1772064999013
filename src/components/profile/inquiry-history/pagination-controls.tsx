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
  className?: string
}

export function PaginationControls({
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  currentPage,
  totalPages = 1,
  className,
}: PaginationControlsProps) {
  return (
    <nav
      className={cn('flex items-center justify-between gap-4', className)}
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next page"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </nav>
  )
}
