/**
 * Host Listing Preview — Secure preview route for draft listings.
 * Restricted to host/admin; renders draft content in Destination Detail template.
 */

import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useListingById } from '@/hooks/use-listings'
import {
  HeroGallery,
  EditorialNarrative,
  ExperienceDetailsPanel,
  HostInfoBlock,
} from '@/components/destination-detail'
import { Skeleton } from '@/components/ui/skeleton'
import type { HostProfile } from '@/types'

export function HostListingPreviewPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: listing, isLoading } = useListingById(listingId ?? undefined)

  if (authLoading) return null

  if (!hasRole('host')) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="font-serif text-2xl font-semibold">Access denied</h2>
        <p className="mt-2 text-muted-foreground">
          Preview is restricted to hosts and admins.
        </p>
        <Link to="/destinations" className="mt-6">
          <Button>Browse Destinations</Button>
        </Link>
      </div>
    )
  }

  if (isLoading && !listing) {
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="font-serif text-2xl font-semibold">Listing not found</h2>
        <Link to="/host/dashboard/listings" className="mt-6">
          <Button>Back to Listings</Button>
        </Link>
      </div>
    )
  }

  const galleryImages = (listing.gallery_urls ?? []).length > 0
    ? (listing.gallery_urls ?? []).map((url) => ({
        url: typeof url === 'string' ? url : '',
        altText: listing.title,
      }))
    : listing.hero_image_url
      ? [{ url: listing.hero_image_url, altText: listing.title ?? 'Listing' }]
      : [{ url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200', altText: listing.title ?? 'Preview' }]

  const isDraft = listing.status === 'draft'

  return (
    <div className="min-h-screen">
      {/* Draft preview banner */}
      {isDraft && (
        <div
          className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-accent/95 text-accent-foreground px-4 py-3 shadow-md"
          role="status"
          aria-live="polite"
        >
          <span className="font-medium">
            Draft preview — not visible to the public
          </span>
          <Link to={`/host/listings/${listing.id}`}>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-accent-foreground border-0"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      )}

      <HeroGallery
        images={galleryImages}
        title={listing.title}
        region={listing.region}
        style={listing.style}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          to={`/host/listings/${listing.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to editor
        </Link>

        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-12">
            <EditorialNarrative content={listing.editorial_content ?? ''} />

            <HostInfoBlock
              host={(listing.host as HostProfile | undefined) ?? null}
            />
          </div>

          <div className="space-y-6">
            <ExperienceDetailsPanel
              experienceDetails={listing.experienceDetails}
              experienceDetailsText={listing.experience_details}
              capacity={listing.capacity}
              amenities={listing.amenities}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
