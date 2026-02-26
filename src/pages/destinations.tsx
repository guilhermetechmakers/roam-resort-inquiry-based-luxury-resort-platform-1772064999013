import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useListings } from '@/hooks/use-listings'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const regions = ['All', 'Santorini', 'Switzerland', 'Kenya']
const styles = ['All', 'Coastal', 'Alpine', 'Safari']

export function DestinationsPage() {
  const [region, setRegion] = useState('')
  const [style, setStyle] = useState('')
  const [search, setSearch] = useState('')
  const { data: listings, isLoading } = useListings({
    region: region || undefined,
    style: style || undefined,
  })

  const filtered = (listings ?? []).filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.title.toLowerCase().includes(q) ||
      l.subtitle?.toLowerCase().includes(q) ||
      l.region?.toLowerCase().includes(q) ||
      l.style?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">
            Destinations
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">
            Browse our curated editorial listings. Each destination tells a story.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r === 'All' ? '' : r)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  (r === 'All' && !region) || region === r
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {r}
              </button>
            ))}
            {styles.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s === 'All' ? '' : s)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  (s === 'All' && !style) || style === s
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-xl" />
              ))
            : filtered.map((listing) => (
                <Link key={listing.id} to={`/destinations/${listing.slug}`}>
                  <Card className="h-full overflow-hidden transition-all duration-300">
                    <div
                      className="h-56 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${listing.hero_image_url ?? listing.gallery_urls?.[0]})`,
                      }}
                    />
                    <CardContent className="p-6">
                      <span className="text-sm font-medium text-accent">
                        {listing.region} · {listing.style}
                      </span>
                      <h3 className="mt-2 font-serif text-xl font-semibold">
                        {listing.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {listing.subtitle}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">No destinations match your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
