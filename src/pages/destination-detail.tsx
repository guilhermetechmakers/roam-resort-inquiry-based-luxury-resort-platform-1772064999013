import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useListing } from '@/hooks/use-listings'
import { useRelatedDestinations } from '@/hooks/use-destinations'
import { DestinationDetailTemplate } from '@/components/destination-detail'
import { Skeleton } from '@/components/ui/skeleton'
import type { Destination } from '@/types'

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

  return (
    <DestinationDetailTemplate
      listing={listing}
      relatedDestinations={relatedDestinations}
      relatedMaxCount={4}
    />
  )
}
