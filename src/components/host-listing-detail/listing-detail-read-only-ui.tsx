/**
 * ListingDetailReadOnlyUI — Host-facing read-only detail view for a listing.
 * Hero, editorial preview, inquiries panel, and lightweight actions.
 * No mutation of inquiry data or statuses.
 */

import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { hostSidebarLinks } from '@/components/layout/sidebar-links'
import { ListingHeroCard } from './listing-hero-card'
import { EditorialPreviewPanel } from './editorial-preview-panel'
import { InquiriesPanel } from './inquiries-panel'
import { ActionsBar } from './actions-bar'
import { useHostListingDetail, useHostListingInquiriesDetail } from '@/hooks/use-host-listing-detail'
import { Skeleton } from '@/components/ui/skeleton'

export interface ListingDetailReadOnlyUIProps {
  listingId: string
  /** Base URL for share link (e.g. window.location.origin) */
  baseUrl?: string
  /** Whether host can toggle visibility (read-only on this page) */
  canToggleVisibility?: boolean
}

export function ListingDetailReadOnlyUI({
  listingId,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
  canToggleVisibility = false,
}: ListingDetailReadOnlyUIProps) {
  const { data: listing, isLoading: listingLoading, error: listingError } = useHostListingDetail(listingId)
  const { data: inquiries = [], isLoading: inquiriesLoading } = useHostListingInquiriesDetail(listingId)

  const safeInquiries = Array.isArray(inquiries) ? inquiries : []
  const listingUrl = `${baseUrl}/destinations/${listing?.slug ?? listingId}`

  if (listingLoading && !listing) {
    return (
      <div className="flex min-h-screen">
        <Sidebar links={hostSidebarLinks} title="Host" />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <Skeleton className="h-[50vh] rounded-xl" />
          <Skeleton className="mt-8 h-48 rounded-xl" />
          <Skeleton className="mt-8 h-64 rounded-xl" />
        </main>
      </div>
    )
  }

  if (listingError || (!listingLoading && !listing)) {
    return (
      <div className="flex min-h-screen">
        <Sidebar links={hostSidebarLinks} title="Host" />
        <main className="flex flex-1 flex-col items-center justify-center p-8">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Listing not found
          </h2>
          <p className="mt-2 text-muted-foreground">
            This listing may have been removed or you may not have access.
          </p>
          <Link
            to="/host/dashboard/listings"
            className="mt-6 text-accent hover:underline"
          >
            Back to Listings
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar links={hostSidebarLinks} title="Host" />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <Link
            to="/host/dashboard/listings"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Listings
          </Link>

          <div className="mt-6 space-y-8">
            <ListingHeroCard listing={listing ?? null} />

            <ActionsBar
              listing={listing ?? null}
              listingUrl={listingUrl}
              canToggleVisibility={canToggleVisibility}
            />

            <EditorialPreviewPanel listing={listing ?? null} />

            <InquiriesPanel
              listingId={listingId}
              inquiries={safeInquiries}
              isLoading={inquiriesLoading}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
