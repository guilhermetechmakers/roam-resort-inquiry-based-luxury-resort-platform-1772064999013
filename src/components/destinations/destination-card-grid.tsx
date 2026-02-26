import { DestinationCard } from './destination-card'
import { cn } from '@/lib/utils'
import type { Destination } from '@/types'

export interface DestinationCardGridProps {
  destinations: Destination[]
  className?: string
}

export function DestinationCardGrid({
  destinations,
  className,
}: DestinationCardGridProps) {
  const items = Array.isArray(destinations) ? destinations : []

  return (
    <div
      className={cn(
        'grid gap-6 sm:grid-cols-2 lg:grid-cols-3',
        'animate-fade-in',
        className
      )}
      role="list"
      aria-label="Destination listings"
    >
      {items.map((destination) => (
        <article
          key={destination.id}
          role="listitem"
          className="min-w-0"
        >
          <DestinationCard destination={destination} />
        </article>
      ))}
    </div>
  )
}
