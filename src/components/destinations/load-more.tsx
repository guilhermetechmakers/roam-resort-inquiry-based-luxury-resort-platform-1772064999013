import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadMoreProps {
  onClick: () => void
  isLoading?: boolean
  hasMore?: boolean
  className?: string
}

export function LoadMore({
  onClick,
  isLoading = false,
  hasMore = true,
  className,
}: LoadMoreProps) {
  if (!hasMore) return null

  return (
    <div className={cn('mt-12 flex justify-center py-8', className)}>
      <Button
        variant="outline"
        size="lg"
        onClick={onClick}
        disabled={isLoading}
        aria-label={isLoading ? 'Loading more destinations' : 'Load more destinations'}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Loading...
          </>
        ) : (
          'Load More'
        )}
      </Button>
    </div>
  )
}
