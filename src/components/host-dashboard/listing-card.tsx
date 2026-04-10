import { Link } from 'react-router-dom'
import { Pencil, MessageSquare, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { Listing } from '@/types'
import { cn } from '@/lib/utils'

export interface ListingCardProps {
  listing: Listing
  onViewInquiries: (listing: Listing) => void
}

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'

export function ListingCard({ listing, onViewInquiries }: ListingCardProps) {
  const imageUrl =
    listing.hero_image_url ??
    (Array.isArray(listing.gallery_urls) && listing.gallery_urls.length > 0
      ? listing.gallery_urls[0]
      : PLACEHOLDER_IMAGE)

  const statusLabel = listing.status === 'live' ? 'Live' : 'Draft'
  const isLive = listing.status === 'live'
  const isImported = !!listing.external_source

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-accent/30 hover:scale-[1.01]"
      role="article"
      aria-labelledby={`listing-title-${listing.id}`}
    >
      <div
        className="relative h-40 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
        <span
          className={cn(
            'absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wider',
            isLive
              ? 'bg-emerald-500/90 text-white'
              : 'bg-amber-500/90 text-white'
          )}
        >
          {statusLabel}
        </span>
        {isImported && (
          <span className="absolute left-3 top-3 rounded-full bg-blue-500/90 px-2.5 py-1 text-xs font-medium text-white capitalize">
            {listing.external_source}
          </span>
        )}
      </div>

      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <h3
          id={`listing-title-${listing.id}`}
          className="font-serif text-lg font-semibold leading-tight text-foreground line-clamp-2"
        >
          {listing.title ?? 'Untitled'}
        </h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {listing.region && (
            <span className="font-medium">{listing.region}</span>
          )}
          {listing.region && listing.style && (
            <span className="mx-1">·</span>
          )}
          {listing.style && <span>{listing.style}</span>}
        </div>

        <p className="text-xs text-muted-foreground">
          Updated {formatDate(listing.updated_at)}
        </p>

        <div className="flex flex-wrap gap-2">
          <Link to={`/host/dashboard/listings/${listing.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="hover:border-accent hover:bg-accent/10 hover:text-accent"
              aria-label={`View ${listing.title}`}
            >
              <Eye className="mr-1.5 h-4 w-4" aria-hidden />
              View
            </Button>
          </Link>
          <Link to={`/host/listings/${listing.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="hover:border-accent hover:bg-accent/10 hover:text-accent"
              aria-label={`Edit ${listing.title}`}
            >
              <Pencil className="mr-1.5 h-4 w-4" aria-hidden />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewInquiries(listing)}
            className="hover:border-accent hover:bg-accent/10 hover:text-accent"
            aria-label={`View inquiries for ${listing.title}`}
          >
            <MessageSquare className="mr-1.5 h-4 w-4" aria-hidden />
            View Inquiries
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
