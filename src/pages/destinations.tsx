import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from '@/hooks/use-debounce'
import {
  DestinationSearchBar,
  DestinationFiltersPanel,
  ResultsHint,
  DestinationCardGrid,
  EditorialSidebarBlock,
  DestinationLoadingSkeleton,
  DestinationEmptyState,
  LoadMore,
  type DestinationFiltersState,
} from '@/components/destinations'
import { Button } from '@/components/ui/button'
import { useInfiniteDestinations, useFeaturedEditorial } from '@/hooks/use-destinations'

const DEFAULT_FILTERS: DestinationFiltersState = {
  region: '',
  style: '',
  tags: [],
  query: '',
  sort: 'newest',
}

function parseFiltersFromUrl(searchParams: URLSearchParams): Partial<DestinationFiltersState> {
  const q = searchParams.get('q')?.trim() ?? ''
  const region = searchParams.get('region')?.trim() ?? ''
  const style = searchParams.get('style')?.trim() ?? ''
  const tagsParam = searchParams.get('tags')?.trim()
  const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean) : []
  const sort = (searchParams.get('sort') as DestinationFiltersState['sort']) ?? 'newest'
  return { query: q, region, style, tags, sort }
}

function buildSearchParams(
  filters: DestinationFiltersState,
  page: number
): URLSearchParams {
  const params = new URLSearchParams()
  if ((filters.query ?? '').trim()) params.set('q', filters.query!.trim())
  if ((filters.region ?? '').trim()) params.set('region', filters.region!.trim())
  if ((filters.style ?? '').trim()) params.set('style', filters.style!.trim())
  if ((filters.tags ?? []).length > 0) {
    params.set('tags', (filters.tags ?? []).join(','))
  }
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort)
  if (page > 1) params.set('page', String(page))
  return params
}

export function DestinationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlFilters = useMemo(() => parseFiltersFromUrl(searchParams), [searchParams])

  const [filters, setFilters] = useState<DestinationFiltersState>(() => ({
    ...DEFAULT_FILTERS,
    ...urlFilters,
  }))

  useEffect(() => {
    setFilters((prev) => ({ ...prev, ...urlFilters }))
  }, [urlFilters])

  const updateUrl = useCallback(
    (nextFilters: DestinationFiltersState, page = 1) => {
      const next = buildSearchParams(nextFilters, page)
      const str = next.toString()
      setSearchParams(str ? `?${str}` : '', { replace: true })
    },
    [setSearchParams]
  )

  const debouncedQuery = useDebounce(filters.query ?? '', 280)

  const handleFiltersChange = useCallback(
    (next: DestinationFiltersState) => {
      setFilters(next)
      updateUrl(next, 1)
    },
    [updateUrl]
  )

  const filtersForApi = useMemo(
    () => ({
      region: filters.region?.trim() || undefined,
      style: filters.style?.trim() || undefined,
      query: debouncedQuery?.trim() || undefined,
      tags: (filters.tags ?? []).length > 0 ? (filters.tags ?? []) : undefined,
      sort: filters.sort ?? 'newest',
    }),
    [filters.region, filters.style, filters.tags, filters.sort, debouncedQuery]
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
    const list = pages.flatMap((p) => (Array.isArray(p?.data) ? p.data : []))
    return list
  }, [data?.pages])

  const totalCount = data?.pages?.[0]?.total ?? 0

  const hasActiveFilters =
    (filters.region ?? '').trim() !== '' ||
    (filters.style ?? '').trim() !== '' ||
    (filters.query ?? '').trim() !== '' ||
    ((filters.tags ?? []).length > 0)

  const handleResetFilters = useCallback(() => {
    const reset = { ...DEFAULT_FILTERS }
    setFilters(reset)
    updateUrl(reset, 1)
  }, [updateUrl])

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
        {/* Search + Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1 min-w-0 max-w-xl">
              <DestinationSearchBar
                value={filters.query ?? ''}
                onChange={(v) => handleFiltersChange({ ...filters, query: v })}
                placeholder="Search destinations..."
                region={filters.region}
                style={filters.style}
              />
            </div>
            <DestinationFiltersPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
              className="lg:flex-1"
            />
          </div>
          <ResultsHint
            total={totalCount}
            filters={filters}
            onReset={hasActiveFilters ? handleResetFilters : undefined}
          />
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
