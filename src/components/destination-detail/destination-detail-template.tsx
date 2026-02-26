import { Link } from 'react-router-dom'
import { Compass, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Listing, HostProfile, Destination } from '@/types'
import { HeroGallery } from './hero-gallery'
import { EditorialNarrative } from './editorial-narrative'
import { ExperienceDetailsPanel } from './experience-details-panel'
import { HostInfoBlock } from './host-info-block'
import { InquiriesCTABar } from './inquiries-cta-bar'
import { RelatedDestinations } from './related-destinations'

export interface DestinationDetailTemplateProps {
  listing: Listing
  relatedDestinations?: Destination[]
  /** Optional: override related destinations max count */
  relatedMaxCount?: number
  /** Whether related destinations are currently loading */
  isRelatedLoading?: boolean
  /** Whether related destinations fetch failed */
  isRelatedError?: boolean
}

/**
 * Reusable template for destination detail pages.
 * Renders editorial narrative, image gallery, experiences, host content, and inquiry CTA.
 */
export function DestinationDetailTemplate({
  listing,
  relatedDestinations = [],
  relatedMaxCount = 4,
  isRelatedLoading = false,
  isRelatedError = false,
}: DestinationDetailTemplateProps) {
  const galleryImages =
    (listing.gallery_urls ?? []).length > 0
      ? (listing.gallery_urls ?? []).map((url) => ({
          url,
          altText: listing.title,
        }))
      : listing.hero_image_url
        ? [{ url: listing.hero_image_url, altText: listing.title }]
        : []

  const safeRelated = Array.isArray(relatedDestinations) ? relatedDestinations : []

  return (
    <div className="min-h-screen">
      <HeroGallery
        images={galleryImages}
        title={listing.title}
        region={listing.region}
        style={listing.style}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-12">
            <EditorialNarrative content={listing.editorial_content ?? ''} />

            <HostInfoBlock
              host={(listing.host as HostProfile | undefined) ?? null}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <InquiriesCTABar
              listingId={listing.id}
              slug={listing.slug}
              destinationName={listing.title}
              region={listing.region}
            />
            <ExperienceDetailsPanel
              experienceDetails={listing.experienceDetails}
              experienceDetailsText={listing.experience_details}
              capacity={listing.capacity}
              amenities={listing.amenities}
            />
          </div>
        </div>

        {/* Related destinations */}
        <div className="mt-20 pt-12 border-t border-border">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
            Explore More Destinations
          </h2>
          {isRelatedLoading ? (
            <RelatedDestinationsSkeleton />
          ) : isRelatedError ? (
            <RelatedDestinationsErrorState />
          ) : safeRelated.length > 0 ? (
            <RelatedDestinations
              destinations={safeRelated}
              currentId={listing.id}
              maxCount={relatedMaxCount}
              hideHeading
            />
          ) : (
            <RelatedDestinationsEmptyState />
          )}
        </div>
      </div>
    </div>
  )
}

function RelatedDestinationsSkeleton() {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Loading related destinations"
    >
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function RelatedDestinationsErrorState() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-border',
        'bg-muted/30 px-6 py-12 text-center'
      )}
    >
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t load related destinations. Please try again later.
      </p>
      <Link to="/destinations" className="mt-4">
        <Button
          variant="outline"
          size="sm"
          className="border-accent/40 text-accent hover:bg-accent/10"
        >
          Browse All Destinations
        </Button>
      </Link>
    </div>
  )
}

function RelatedDestinationsEmptyState() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-border',
        'bg-muted/30 px-6 py-16 text-center'
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
        <Compass className="h-7 w-7 text-accent" aria-hidden />
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
        No related destinations yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Explore our full collection of luxury stays and discover your next escape.
      </p>
      <Link to="/destinations" className="mt-6">
        <Button
          className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] transition-all"
          size="lg"
        >
          Browse Destinations
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}
