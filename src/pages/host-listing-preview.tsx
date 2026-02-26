/**
 * Host Listing Preview — Secure preview route for draft listings.
 * Restricted to host/admin; renders draft content in Destination Detail template.
 */

import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit3, FileQuestion, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useListingById } from '@/hooks/use-listings'
import {
  HeroGallery,
  EditorialNarrative,
  ExperienceDetailsPanel,
  HostInfoBlock,
} from '@/components/destination-detail'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBanner } from '@/components/auth'
import { RetryButton } from '@/components/ux'
import { toUserMessage } from '@/lib/errors'
import type { HostProfile } from '@/types'

export function HostListingPreviewPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const { hasRole, isLoading: authLoading } = useAuth()
  const {
    data: listing,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useListingById(listingId ?? undefined)

  if (authLoading) {
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

  if (!hasRole('host')) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 sm:px-6">
        <Card className="w-full max-w-md border-border shadow-card">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-muted"
              aria-hidden
            >
              <ShieldX className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
              Access denied
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Preview is restricted to hosts and admins.
            </p>
            <Link to="/destinations" className="mt-6">
              <Button variant="outline" aria-label="Browse destinations">
                Browse Destinations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorBanner
          message={toUserMessage(error, 'Failed to load listing preview')}
          onRetry={() => refetch()}
          className="mb-6"
        />
        <Card
          className="border-destructive/30 bg-destructive/5"
          role="alert"
          aria-live="assertive"
          aria-label="Error loading listing"
        >
          <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between">
            <p className="text-sm text-destructive">
              {toUserMessage(error, 'Failed to load listing preview')}
            </p>
            <RetryButton
              onRetry={() => refetch()}
              label="Retry loading preview"
              variant="outline"
              size="sm"
              isLoading={isFetching}
            />
          </CardContent>
        </Card>
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 sm:px-6">
        <Card className="w-full max-w-md border-border shadow-card">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-muted"
              aria-hidden
            >
              <FileQuestion className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
              Listing not found
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This listing may have been removed or the link is incorrect.
            </p>
            <Link to="/host/dashboard/listings" className="mt-6">
              <Button variant="outline" aria-label="Back to listings">
                Back to Listings
              </Button>
            </Link>
          </CardContent>
        </Card>
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
      : [
          {
            url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200',
            altText: listing.title ?? 'Preview',
          },
        ]

  const isDraft = listing.status === 'draft'

  return (
    <div className="min-h-screen">
      {/* Draft preview banner */}
      {isDraft && (
        <div
          className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-accent/95 px-4 py-3 text-accent-foreground shadow-md"
          role="status"
          aria-live="polite"
          aria-label="Draft preview mode"
        >
          <span className="font-medium">
            Draft preview — not visible to the public
          </span>
          <Link
            to={`/host/listings/${listing.id}`}
            aria-label="Edit this listing"
          >
            <Button
              variant="secondary"
              size="sm"
              className="border-0 bg-primary-foreground/20 text-accent-foreground transition-colors hover:bg-primary-foreground/30"
            >
              <Edit3 className="mr-2 h-4 w-4" aria-hidden />
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
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to listing editor"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to editor
        </Link>

        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
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
