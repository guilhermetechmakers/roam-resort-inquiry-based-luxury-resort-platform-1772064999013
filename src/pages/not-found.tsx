/**
 * NotFoundPage - Brand-aligned 404 Not Found page for Roam Resort.
 * Warm apology, quick recovery actions (Home, Search, Report Issue),
 * optional suggestions. Runtime-safe with guarded array operations.
 */
import { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  QuickSearchWidget,
  ReportIssueModal,
  ContentCard,
} from '@/components/not-found'
import { fetchPublishedDestinations } from '@/api/destinations'
import type { Destination } from '@/types'
import { toast } from 'sonner'

export function NotFoundPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [lastSearchedResults, setLastSearchedResults] = useState<Destination[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<Destination[]>([])

  const safeSuggestions = Array.isArray(suggestions) ? suggestions : []
  const safeResults = Array.isArray(lastSearchedResults) ? lastSearchedResults : []

  useEffect(() => {
    let cancelled = false
    async function loadSuggestions() {
      try {
        const res = await fetchPublishedDestinations({
          page: 1,
          pageSize: 4,
          sort: 'newest',
        })
        const list = Array.isArray(res?.data) ? res.data : []
        if (!cancelled) setSuggestions(list)
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }
    loadSuggestions()
    return () => { cancelled = true }
  }, [])

  const handleSearchSubmit = useCallback(async (query: string) => {
    const trimmed = (query ?? '').trim()
    if (trimmed.length === 0) return

    setSearchQuery(trimmed)
    setIsSearching(true)
    try {
      const res = await fetchPublishedDestinations({
        query: trimmed,
        page: 1,
        pageSize: 6,
      })
      const list = Array.isArray(res?.data) ? res.data : []
      setLastSearchedResults(list)
    } catch {
      setLastSearchedResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleReportSubmit = useCallback(() => {
    toast.success('Thank you for your report. We\'ll look into it shortly.')
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero section - deep navy with gradient */}
      <section
        className="relative overflow-hidden bg-primary py-20 sm:py-24 lg:py-32"
        aria-labelledby="not-found-heading"
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'linear-gradient(135deg, rgb(180 149 135 / 0.15) 0%, transparent 50%, rgb(35 33 42) 100%)',
          }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1
            id="not-found-heading"
            className="font-serif text-5xl font-bold tracking-tight text-primary-foreground sm:text-6xl lg:text-7xl"
          >
            We&apos;re sorry — that page couldn&apos;t be found.
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/85 leading-relaxed">
            The page you&apos;re looking for may have been moved, removed, or
            perhaps the address was mistyped. We&apos;re here to help you find
            your way back.
          </p>

          {/* Quick actions */}
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button
              asChild
              size="lg"
              className="min-h-[44px] min-w-[140px] bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent-glow transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link to="/">
                <Home className="mr-2 h-5 w-5" aria-hidden />
                Go Home
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="min-h-[44px] border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/destinations')}
            >
              Browse Destinations
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="min-h-[44px] border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setIsReportOpen(true)}
              aria-label="Report this broken link"
            >
              <AlertCircle className="mr-2 h-5 w-5" aria-hidden />
              Report Issue
            </Button>
          </div>

          {/* Inline search */}
          <div className="mt-12 flex justify-center" role="search">
            <QuickSearchWidget
              placeholder="Search destinations, regions..."
              onSubmit={handleSearchSubmit}
            />
          </div>
        </div>
      </section>

      {/* Search results (when user has searched) */}
      {searchQuery && (
        <section
          className="border-t border-border bg-secondary/30 py-16"
          aria-labelledby="search-results-heading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2
              id="search-results-heading"
              className="font-serif text-2xl font-semibold text-foreground"
            >
              Search results for &quot;{searchQuery}&quot;
            </h2>
            {isSearching ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : safeResults.length > 0 ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(safeResults ?? []).map((dest) => (
                  <ContentCard
                    key={dest.id}
                    title={dest.title ?? 'Destination'}
                    body={dest.excerpt ?? dest.tagline}
                    imageUrl={dest.imageUrl}
                    to={`/destinations/${dest.slug ?? dest.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  No destinations match your search. Try a different term or{' '}
                  <Link to="/destinations" className="text-accent hover:underline">
                    browse all destinations
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Suggestions section */}
      {safeSuggestions.length > 0 && !searchQuery && (
        <section
          className="py-16 lg:py-24"
          aria-labelledby="suggestions-heading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              You might also like
            </p>
            <h2
              id="suggestions-heading"
              className="mt-2 font-serif text-3xl font-bold text-foreground"
            >
              Explore These Destinations
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {(safeSuggestions ?? []).map((dest) => (
                <ContentCard
                  key={dest.id}
                  title={dest.title ?? 'Destination'}
                  body={dest.excerpt ?? dest.tagline}
                  imageUrl={dest.imageUrl}
                  to={`/destinations/${dest.slug ?? dest.id}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Report Issue Modal */}
      <ReportIssueModal
        visible={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReportSubmit}
      />
    </div>
  )
}
