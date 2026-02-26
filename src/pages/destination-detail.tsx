import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useListing } from '@/hooks/use-listings'
import { useRelatedDestinations } from '@/hooks/use-destinations'
import {
  HeroGallery,
  EditorialNarrative,
  ExperienceDetailsPanel,
  HostInfoBlock,
  CTAStickyPanel,
  RelatedDestinations,
} from '@/components/destination-detail'
import { Skeleton } from '@/components/ui/skeleton'
import type { Destination, HostProfile } from '@/types'

export function DestinationDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: listing, isLoading } = useListing(slug)
  const { data: relatedData } = useRelatedDestinations(listing?.id, 4)

  const relatedDestinations: Destination[] = Array.isArray(relatedData)
    ? relatedData
    : []

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[70vh] w-full rounded-none" />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="font-serif text-2xl font-semibold">Destination not found</h2>
        <Link to="/destinations" className="mt-4">
          <Button>Browse Destinations</Button>
        </Link>
      </div>
    )
  }

  const galleryImages = (listing.gallery_urls ?? []).length > 0
    ? (listing.gallery_urls ?? []).map((url) => ({ url, altText: listing.title }))
    : listing.hero_image_url
      ? [{ url: listing.hero_image_url, altText: listing.title }]
      : []

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
            <CTAStickyPanel listingId={listing.id} slug={listing.slug} />
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
          <RelatedDestinations
            destinations={relatedDestinations}
            currentId={listing.id}
            maxCount={4}
          />
        </div>
      </div>
    </div>
  )
}
