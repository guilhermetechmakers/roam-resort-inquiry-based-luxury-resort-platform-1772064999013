import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar, hostSidebarLinks } from '@/components/layout/sidebar'
import { ListingForm } from '@/components/host-listing/listing-form'
import { useAuth } from '@/contexts/auth-context'
import { useListingById } from '@/hooks/use-listings'
import { useCreateListing, useUpdateListing } from '@/hooks/use-host-listings'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import type { ListingFormValues } from '@/lib/validation/listing-schema'
import type { ListingStatus } from '@/types'

export function HostListingEditPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const isNew = listingId === 'new' || !listingId
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: listing, isLoading } = useListingById(
    isNew ? undefined : listingId ?? undefined
  )
  const createListing = useCreateListing()
  const updateListing = useUpdateListing()

  if (authLoading) return null
  if (!hasRole('host')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  if (!isNew && isLoading && !listing) {
    return (
      <div className="flex min-h-screen">
        <Sidebar links={hostSidebarLinks} title="Host" />
        <main className="flex-1 p-8">
          <Skeleton className="h-96 rounded-xl" />
        </main>
      </div>
    )
  }

  if (!isNew && !listing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Listing not found.</p>
        <Link to="/host/dashboard/listings" className="ml-4">
          <Button>Back to Listings</Button>
        </Link>
      </div>
    )
  }

  const handleSubmit = async (
    values: ListingFormValues & { galleryUrls: string[]; status: ListingStatus }
  ) => {
    try {
      const slug =
        listing?.slug ??
        values.title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')

      const experienceDetails = {
        datesSuggestion: values.datesSuggestion
          ? values.datesSuggestion.split('\n').filter(Boolean)
          : [],
        guestCapacity: values.guestCapacity ?? 4,
        amenities: values.amenities
          ? values.amenities.split(',').map((a) => a.trim()).filter(Boolean)
          : [],
        sampleItineraries: values.sampleItineraries
          ? values.sampleItineraries.split('\n').filter(Boolean)
          : [],
      }

      const payload = {
        title: values.title,
        slug,
        subtitle: values.subtitle,
        region: values.region,
        style: values.style,
        editorial_content: values.narrative,
        experienceDetails,
        gallery_urls: values.galleryUrls ?? [],
        status: values.status,
      }

      if (isNew) {
        const created = await createListing.mutateAsync(payload)
        toast.success('Listing created')
        navigate(`/host/listings/${created.id}`)
      } else if (listing) {
        await updateListing.mutateAsync({
          id: listing.id,
          payload,
        })
        toast.success('Listing updated')
      }
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to save listing')
    }
  }

  const isSubmitting = createListing.isPending || updateListing.isPending

  return (
    <div className="flex min-h-screen">
      <Sidebar links={hostSidebarLinks} title="Host" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Link
            to="/host/dashboard/listings"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Link>

          <h1 className="font-serif text-3xl font-bold">
            {isNew ? 'Create Listing' : 'Edit Listing'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isNew
              ? 'Add a new destination to your portfolio.'
              : `Editing ${listing?.title ?? 'listing'}`}
          </p>

          <div className="mt-8">
            <ListingForm
              listing={listing ?? null}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
