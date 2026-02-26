import { useParams, Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useListing } from '@/hooks/use-listings'
import { useRelatedDestinations } from '@/hooks/use-destinations'
import { DestinationDetailTemplate } from '@/components/destination-detail'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Destination } from '@/types'

export function DestinationDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: listing, isLoading: isListingLoading } = useListing(slug)
  const {
    data: relatedData,
    isLoading: isRelatedLoading,
    isError: isRelatedError,
  } = useRelatedDestinations(listing?.id, 4)

  const relatedDestinations: Destination[] = Array.isArray(relatedData)
    ? relatedData
    : []

  const isPageLoading = isListingLoading
  const showRelatedLoading = !isListingLoading && !!listing?.id && isRelatedLoading

  if (isPageLoading) {
    return (
      <div className="min-h-screen">
        {/* Page-level loading indicator */}
        <div
          className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-muted"
          aria-hidden
        >
          <div
            className="h-full w-1/3 animate-loading-bar rounded-full bg-accent"
            role="progressbar"
            aria-label="Loading"
          />
        </div>
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-8 w-8 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            Destination not found
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            The destination you&apos;re looking for may have been moved or removed.
          </p>
          <Link to="/destinations" className="mt-2">
            <Button
              variant="default"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Browse Destinations
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Page-level loading indicator for related destinations fetch */}
      {showRelatedLoading && (
        <div
          className={cn(
            'fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-muted',
            'transition-opacity duration-300'
          )}
          aria-hidden
        >
          <div
            className="h-full w-1/3 animate-loading-bar rounded-full bg-accent"
            role="progressbar"
            aria-label="Loading related destinations"
          />
        </div>
      )}
      <DestinationDetailTemplate
        listing={listing}
        relatedDestinations={relatedDestinations}
        relatedMaxCount={4}
        isRelatedLoading={showRelatedLoading}
        isRelatedError={isRelatedError}
      />
    </>
  )
}
