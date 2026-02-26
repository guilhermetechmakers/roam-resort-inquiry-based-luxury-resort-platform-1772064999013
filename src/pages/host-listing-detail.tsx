/**
 * Host Listing Detail (Read-Only Inquiries) page.
 * Host-facing view of a listing with related inquiries.
 */

import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { ListingDetailReadOnlyUI } from '@/components/host-listing-detail'

export function HostListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const { hasRole, isLoading: authLoading } = useAuth()

  if (authLoading) return null

  if (!hasRole('host')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">
          Access denied. Host role required.
        </p>
      </div>
    )
  }

  if (!listingId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Listing ID is required.</p>
      </div>
    )
  }

  return (
    <ListingDetailReadOnlyUI
      listingId={listingId}
      canToggleVisibility={false}
    />
  )
}
