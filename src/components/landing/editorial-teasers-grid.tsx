import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { EditorialTeaser } from '@/types'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'

export interface EditorialTeasersGridProps {
  teasers: EditorialTeaser[]
  isLoading?: boolean
  className?: string
}

function EditorialTeaserCard({ teaser }: { teaser: EditorialTeaser }) {
  const imageUrl = teaser.imageUrl ?? PLACEHOLDER_IMAGE
  const href = teaser.destinationSlug
    ? `/destinations/${teaser.destinationSlug}`
    : '/destinations'

  return (
    <Link
      to={href}
      className={cn(
        'group block overflow-hidden rounded-xl border border-border bg-card shadow-card',
        'transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] hover:border-accent/50'
      )}
      aria-label={`${teaser.title} - Read story`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={teaser.title ? `${teaser.title} - Editorial` : 'Editorial image'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-40" />
      </div>
      <div className="p-6">
        <span className="text-xs font-medium uppercase tracking-wider text-accent">
          Editor&apos;s Pick
        </span>
        <h3 className="mt-2 font-serif text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
          {teaser.title}
        </h3>
        {teaser.excerpt && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {teaser.excerpt}
          </p>
        )}
        <span className="mt-4 inline-flex items-center text-accent font-medium group-hover:text-accent/90 transition-colors">
          Read Story
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

export function EditorialTeasersGrid({
  teasers,
  isLoading = false,
  className,
}: EditorialTeasersGridProps) {
  const items = (teasers ?? []).slice(0, 6)
  const hasItems = items.length > 0

  if (isLoading) {
    return (
      <section className={cn('py-24 border-t border-border', className)} aria-label="Editorial teasers loading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-56 mx-auto" />
            <Skeleton className="h-5 w-80 mx-auto mt-4" />
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!hasItems) return null

  return (
    <section
      className={cn('py-24 border-t border-border bg-secondary/20', className)}
      aria-label="Editorial stories"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl font-bold text-foreground">
            Stories & Experiences
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Curated narratives from our hosts and destinations.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((teaser) => (
            <EditorialTeaserCard key={teaser.id} teaser={teaser} />
          ))}
        </div>
      </div>
    </section>
  )
}
