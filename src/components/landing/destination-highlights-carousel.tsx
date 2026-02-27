import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DestinationCard } from '@/types'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'

export interface DestinationHighlightsCarouselProps {
  destinations: DestinationCard[]
  isLoading?: boolean
  className?: string
}

function DestinationCardItem({ dest }: { dest: DestinationCard }) {
  const imageUrl = dest.imageUrl ?? PLACEHOLDER_IMAGE
  const slug = dest.slug ?? dest.id
  const href = `/destinations/${slug}`

  return (
    <article
      className="group flex-shrink-0 w-[min(85vw,320px)] sm:w-[min(90vw,380px)] snap-center"
      aria-label={`${dest.name} - View destination`}
    >
      <Link
        to={href}
        className={cn(
          'block overflow-hidden rounded-xl border border-border shadow-card',
          'transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] hover:border-accent/60'
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={dest.name ? `${dest.name} - Destination` : 'Destination image'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 text-primary-foreground">
            <h3 className="font-serif text-xl font-semibold leading-tight sm:text-2xl">
              {dest.name}
            </h3>
            {dest.editorialSnippet && (
              <p className="mt-2 line-clamp-2 text-sm text-primary-foreground/90">
                {dest.editorialSnippet}
              </p>
            )}
            <span className="mt-4 self-start inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all group-hover:bg-primary-foreground/30 group-hover:scale-105">
              View
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

export function DestinationHighlightsCarousel({
  destinations,
  isLoading = false,
  className,
}: DestinationHighlightsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const items = (destinations ?? []).slice(0, 6)
  const hasItems = items.length > 0

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState)
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState, hasItems])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector('article')?.clientWidth ?? 320
    const gap = 24
    const scrollAmount = (cardWidth + gap) * (direction === 'left' ? -1 : 1)
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasItems) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scroll('left')
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      scroll('right')
    }
  }

  if (isLoading) {
    return (
      <section className={cn('py-16', className)} aria-label="Destination highlights loading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-5 w-96 mx-auto mt-4" />
          </div>
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-[320px] flex-shrink-0 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!hasItems) return null

  return (
    <section
      className={cn('py-16', className)}
      aria-label="Featured destinations carousel"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-12">
          <div className="text-center md:text-left">
            <h2 className="font-serif text-4xl font-bold text-foreground">
              Featured Destinations
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Handpicked properties where storytelling meets luxury.
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous destinations"
              className="rounded-full border-accent/50 text-accent hover:bg-accent/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Next destinations"
              className="rounded-full border-accent/50 text-accent hover:bg-accent/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          role="region"
          aria-label="Destination cards"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 snap-x snap-mandatory scroll-smooth scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((dest) => (
            <DestinationCardItem key={dest.id} dest={dest} />
          ))}
        </div>
      </div>
    </section>
  )
}
