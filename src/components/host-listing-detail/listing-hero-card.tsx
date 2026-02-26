/**
 * ListingHeroCard — Hero area for Host Listing Detail.
 * Displays cover image, title, status badge (Draft/Live), and last updated.
 */

import { formatDate } from '@/lib/utils'
import type { HostListingDetail } from '@/types/host-listing-detail'
import { cn } from '@/lib/utils'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'

export interface ListingHeroCardProps {
  listing: HostListingDetail | null
  className?: string
}

export function ListingHeroCard({ listing, className }: ListingHeroCardProps) {
  if (!listing) return null

  const coverUrl =
    listing.cover_image_url ??
    (Array.isArray(listing.gallery_urls) && listing.gallery_urls.length > 0
      ? listing.gallery_urls[0]
      : PLACEHOLDER_IMAGE)

  const statusLabel = listing.status === 'Live' ? 'Live' : 'Draft'
  const isLive = listing.status === 'Live'

  return (
    <section
      className={cn('relative overflow-hidden rounded-xl', className)}
      aria-labelledby="listing-hero-title"
    >
      <div
        className="relative h-[50vh] min-h-[320px] bg-cover bg-center"
        style={{ backgroundImage: `url(${coverUrl})` }}
        role="img"
        aria-label={listing.title ?? 'Listing cover'}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-10">
          <span
            className={cn(
              'mb-4 inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wider',
              isLive
                ? 'bg-emerald-500/90 text-white'
                : 'bg-amber-500/90 text-white'
            )}
          >
            {statusLabel}
          </span>
          <h1
            id="listing-hero-title"
            className="font-serif text-4xl font-bold text-primary-foreground sm:text-5xl md:text-6xl"
          >
            {listing.title ?? 'Untitled'}
          </h1>
          {listing.subtitle && (
            <p className="mt-2 text-lg text-primary-foreground/90">
              {listing.subtitle}
            </p>
          )}
          <p className="mt-4 text-sm italic text-primary-foreground/80">
            Last updated {formatDate(listing.last_updated)}
          </p>
        </div>
      </div>
    </section>
  )
}
