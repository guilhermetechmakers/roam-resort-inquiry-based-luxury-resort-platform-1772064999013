/**
 * Host Listing Detail (Read-Only Inquiries) page.
 * Host-facing view of a listing with related inquiries.
 */

import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { ListingDetailReadOnlyUI } from '@/components/host-listing-detail'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function HostListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const { hasRole, isLoading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-6 p-6 md:p-8" role="status" aria-live="polite" aria-busy="true">
        <Skeleton className="h-8 w-48 rounded-lg" aria-hidden />
        <Skeleton className="h-[40vh] rounded-xl" aria-hidden />
        <Skeleton className="h-48 rounded-xl" aria-hidden />
      </div>
    )
  }

  if (!hasRole('host')) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center p-6 md:p-8"
        role="alert"
        aria-live="assertive"
        aria-labelledby="access-denied-heading"
      >
        <Card className="w-full max-w-md overflow-hidden border-destructive/30 bg-card shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="rounded-full bg-destructive/10 p-4" aria-hidden>
              <ShieldAlert className="h-12 w-12 text-destructive" aria-hidden />
            </div>
            <h2
              id="access-denied-heading"
              className="mt-6 font-serif text-2xl font-semibold text-foreground"
            >
              Access denied
            </h2>
            <p className="mt-3 max-w-sm text-muted-foreground">
              Host role is required to view listing details. Please sign in with a host account.
            </p>
            <Link
              to="/host/dashboard"
              className="mt-6"
              aria-label="Go to host dashboard"
            >
              <Button
                variant="outline"
                className="border-accent bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!listingId) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center p-6 md:p-8"
        role="alert"
        aria-live="assertive"
        aria-labelledby="missing-listing-heading"
      >
        <Card className="w-full max-w-md overflow-hidden border-destructive/30 bg-card shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="rounded-full bg-destructive/10 p-4" aria-hidden>
              <AlertCircle className="h-12 w-12 text-destructive" aria-hidden />
            </div>
            <h2
              id="missing-listing-heading"
              className="mt-6 font-serif text-2xl font-semibold text-foreground"
            >
              Listing ID is required
            </h2>
            <p className="mt-3 max-w-sm text-muted-foreground">
              The listing URL appears to be invalid or incomplete. Please return to your listings and select a valid listing.
            </p>
            <Link
              to="/host/dashboard/listings"
              className="mt-6"
              aria-label="Return to host listings"
            >
              <Button
                variant="default"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Back to Listings
              </Button>
            </Link>
          </CardContent>
        </Card>
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
