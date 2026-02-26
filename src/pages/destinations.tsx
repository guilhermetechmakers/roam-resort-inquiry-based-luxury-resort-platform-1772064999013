import { useState, useMemo } from 'react'
import {
  FilterBar,
  DestinationCardGrid,
  EditorialSidebarBlock,
  DestinationLoadingSkeleton,
  DestinationEmptyState,
  LoadMore,
  type DestinationFilters,
} from '@/components/destinations'
import { Button } from '@/components/ui/button'
import { useInfiniteDestinations, useFeaturedEditorial } from '@/hooks/use-destinations'

const DEFAULT_FILTERS: DestinationFilters = {
  region: '',
  style: '',
  query: '',
  sort: 'newest',
}

export function DestinationsPage() {
  const [filters, setFilters] = useState<DestinationFilters>(DEFAULT_FILTERS)

  const filtersForApi = useMemo(
    () => ({
      region: filters.region?.trim() || undefined,
      style: filters.style?.trim() || undefined,
      query: filters.query?.trim() || undefined,
      sort: filters.sort ?? 'newest',
    }),
    [filters]
  )

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteDestinations(filtersForApi)

  const { data: editorial } = useFeaturedEditorial()

  const destinations = useMemo(() => {
    const pages = data?.pages ?? []
    const list = pages.flatMap((p) => Array.isArray(p?.data) ? p.data : [])
    return list
  }, [data?.pages])

  const hasActiveFilters =
    (filters.region ?? '').trim() !== '' ||
    (filters.style ?? '').trim() !== '' ||
    (filters.query ?? '').trim() !== ''

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <section className="border-b border-border bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            Destinations
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">
            Browse our curated editorial listings. Each destination tells a story.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Filter bar */}
        <div className="mb-12">
          <FilterBar filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Main content: grid + sidebar */}
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            {isLoading ? (
              <DestinationLoadingSkeleton count={6} />
            ) : isError ? (
              <div className="py-24 text-center">
                <p className="text-destructive">
                  {error instanceof Error ? error.message : 'Failed to load destinations.'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (destinations ?? []).length === 0 ? (
              <DestinationEmptyState
                hasActiveFilters={hasActiveFilters}
                onReset={handleResetFilters}
              />
            ) : (
              <>
                <DestinationCardGrid destinations={destinations} />
                <LoadMore
                  onClick={() => fetchNextPage()}
                  isLoading={isFetchingNextPage}
                  hasMore={hasNextPage ?? false}
                />
              </>
            )}
          </div>

          {/* Editorial sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <EditorialSidebarBlock editorial={editorial ?? null} />
            </div>
          </aside>
        </div>

        {/* Mobile: editorial below grid */}
        <div className="mt-12 lg:hidden">
          <EditorialSidebarBlock editorial={editorial ?? null} />
        </div>
      </div>
    </div>
  )
}
