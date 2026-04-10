import { useState, useCallback, useEffect } from 'react'
import { FileText, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/layout/sidebar'
import { hostSidebarLinks } from '@/components/layout/sidebar-links'
import {
  QuickStatsPanel,
  CreateListingButton,
  InquiriesSummary,
  ListingCard,
} from '@/components/host-dashboard'
import { EscapiaConnectPanel } from '@/components/integrations/EscapiaConnectPanel'
import { useAuth } from '@/hooks/use-auth'
import { useHostListings, useHostStats, useListingInquiries } from '@/hooks/use-host-dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import type { Listing } from '@/types'
import { cn } from '@/lib/utils'

const STORAGE_KEY_FILTER = 'roam-host-listings-filter'
const STORAGE_KEY_SORT = 'roam-host-listings-sort'

type FilterStatus = 'all' | 'draft' | 'live'
type SortKey = 'updated_at' | 'status' | 'title'

function loadStoredFilter(): FilterStatus {
  try {
    const v = localStorage.getItem(STORAGE_KEY_FILTER)
    if (v === 'draft' || v === 'live' || v === 'all') return v
  } catch {
    // ignore
  }
  return 'all'
}

function loadStoredSort(): SortKey {
  try {
    const v = localStorage.getItem(STORAGE_KEY_SORT)
    if (v === 'updated_at' || v === 'status' || v === 'title') return v
  } catch {
    // ignore
  }
  return 'updated_at'
}

export function HostDashboardListingsPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(loadStoredFilter)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>(loadStoredSort)
  const [inquiriesListing, setInquiriesListing] = useState<Listing | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILTER, filterStatus)
    } catch {
      // ignore
    }
  }, [filterStatus])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SORT, sortKey)
    } catch {
      // ignore
    }
  }, [sortKey])

  const options = {
    status: filterStatus,
    search: searchQuery.trim(),
    sort: sortKey,
  }

  const { data: listings = [], isLoading: listingsLoading } = useHostListings(options)
  const { data: stats, isLoading: statsLoading } = useHostStats()
  const { data: inquiries = [], isLoading: inquiriesLoading } = useListingInquiries(
    inquiriesListing?.id
  )

  const handleViewInquiries = useCallback((listing: Listing) => {
    setInquiriesListing(listing)
  }, [])

  const handleCloseInquiries = useCallback(() => {
    setInquiriesListing(null)
  }, [])

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

  const listingsList = Array.isArray(listings) ? listings : []

  return (
    <div className="flex min-h-screen">
      <Sidebar links={hostSidebarLinks} title="Host" />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                Listings
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your editorial destination listings.
              </p>
            </div>
            <CreateListingButton />
          </div>

          <QuickStatsPanel
            stats={stats}
            isLoading={statsLoading}
            className="mt-8"
          />

          <EscapiaConnectPanel className="mt-6" />

          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  aria-label="Search listings"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Status:
                </span>
                {(['all', 'draft', 'live'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      filterStatus === status &&
                        'bg-accent text-accent-foreground hover:bg-accent/90'
                    )}
                    aria-pressed={filterStatus === status}
                    aria-label={`Filter by ${status}`}
                  >
                    {status === 'all' ? 'All' : status === 'live' ? 'Live' : 'Draft'}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Sort:
                </span>
                <select
                  value={sortKey}
                  onChange={(e) =>
                    setSortKey(e.target.value as SortKey)
                  }
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Sort listings"
                >
                  <option value="updated_at">Last Updated</option>
                  <option value="status">Status</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>

            {listingsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-80 rounded-xl"
                    aria-hidden
                  />
                ))}
              </div>
            ) : listingsList.length === 0 ? (
              <div
                className="rounded-xl border border-border bg-card p-12 text-center animate-fade-in"
                role="status"
              >
                <FileText
                  className="mx-auto h-14 w-14 text-muted-foreground"
                  aria-hidden
                />
                <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">
                  No listings yet
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Create your first editorial listing, or connect your Escapia account above to import all your properties automatically.
                </p>
                <div className="mt-6">
                  <CreateListingButton />
                </div>
              </div>
            ) : (
              <div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                role="list"
              >
                {listingsList.map((listing, idx) => (
                  <div
                    key={listing.id}
                    className="animate-fade-in-up"
                    style={{
                      animationDelay: `${Math.min(idx * 50, 300)}ms`,
                      animationFillMode: 'backwards',
                    }}
                  >
                    <ListingCard
                      listing={listing}
                      onViewInquiries={handleViewInquiries}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <InquiriesSummary
        open={!!inquiriesListing}
        onOpenChange={(open) => !open && handleCloseInquiries()}
        listingTitle={inquiriesListing?.title ?? ''}
        inquiries={inquiries}
        isLoading={inquiriesLoading}
      />
    </div>
  )
}
