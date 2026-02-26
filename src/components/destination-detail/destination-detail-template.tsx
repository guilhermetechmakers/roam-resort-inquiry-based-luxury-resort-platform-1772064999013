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
}

/**
 * Reusable template for destination detail pages.
 * Renders editorial narrative, image gallery, experiences, host content, and inquiry CTA.
 */
export function DestinationDetailTemplate({
  listing,
  relatedDestinations = [],
  relatedMaxCount = 4,
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
        {safeRelated.length > 0 && (
          <div className="mt-20 pt-12 border-t border-border">
            <RelatedDestinations
              destinations={safeRelated}
              currentId={listing.id}
              maxCount={relatedMaxCount}
            />
          </div>
        )}
      </div>
    </div>
  )
}
