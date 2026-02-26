import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface DestinationLoadingSkeletonProps {
  count?: number
  className?: string
}

export function DestinationLoadingSkeleton({
  count = 6,
  className,
}: DestinationLoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <div
      className={cn(
        'grid gap-6 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
      role="status"
      aria-label="Loading destinations"
    >
      {items.map((i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="p-6 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-32 mt-4" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading destinations...</span>
    </div>
  )
}
