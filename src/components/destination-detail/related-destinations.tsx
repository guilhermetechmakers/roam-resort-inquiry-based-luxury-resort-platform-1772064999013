import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Destination } from '@/types'

export interface RelatedDestinationsProps {
  destinations: Destination[]
  currentId?: string
  maxCount?: number
  className?: string
  /** Hide the section heading when used inside a parent that provides it */
  hideHeading?: boolean
}

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'

function getDetailUrl(d: Destination): string {
  const slug = d.slug ?? d.id
  return `/destinations/${slug}`
}

export function RelatedDestinations({
  destinations,
  currentId,
  maxCount = 4,
  className,
  hideHeading = false,
}: RelatedDestinationsProps) {
  const items = Array.isArray(destinations) ? destinations : []
  const filtered = items
    .filter((d) => d.id !== currentId)
    .slice(0, maxCount)

  if (filtered.length === 0) return null

  return (
    <section
      className={cn('', className)}
      aria-label="Related destinations"
    >
      {!hideHeading && (
        <h2 className="font-serif text-2xl font-semibold mb-6">
          Explore More Destinations
        </h2>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((dest) => {
          const href = getDetailUrl(dest)
          const imageUrl = dest.imageUrl ?? PLACEHOLDER_IMAGE
          const title = dest.title ?? 'Untitled'
          const tagline = dest.tagline ?? dest.excerpt ?? ''
          const region = dest.region ?? ''
          const style = dest.style ?? ''
          const hasTags = Boolean(region || style)

          return (
            <Card
              key={dest.id}
              className={cn(
                'group overflow-hidden border-border transition-all duration-300',
                'hover:shadow-card-hover hover:border-accent/40 hover:scale-[1.02]'
              )}
            >
              <Link to={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-xl">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-primary-foreground">
                    <h3 className="font-serif text-lg font-semibold leading-tight">
                      {title}
                    </h3>
                    {hasTags && (
                      <span className="mt-1 block text-xs text-primary-foreground/90">
                        {[region, style].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  {tagline && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {tagline}
                    </p>
                  )}
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-accent hover:text-accent/90 transition-colors">
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
