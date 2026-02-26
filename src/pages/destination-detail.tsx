import { useParams, Link } from 'react-router-dom'
import { Users, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useListing } from '@/hooks/use-listings'
import { Skeleton } from '@/components/ui/skeleton'

export function DestinationDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: listing, isLoading } = useListing(slug)

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[60vh] w-full rounded-none" />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-48 w-full" />
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
    <div className="min-h-screen">
      {/* Hero gallery */}
      <div className="relative h-[70vh] min-h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${listing.hero_image_url ?? listing.gallery_urls?.[0]})`,
          }}
        />
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="mx-auto max-w-4xl">
            <span className="text-sm font-medium text-secondary">
              {listing.region} · {listing.style}
            </span>
            <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">
              {listing.title}
            </h1>
            <p className="mt-2 text-lg text-white/90">{listing.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <article className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground">
              {listing.editorial_content
                ? listing.editorial_content.split('\n\n').map((block, i) => {
                    if (block.startsWith('## '))
                      return (
                        <h2 key={i} className="mt-8 text-2xl font-semibold">
                          {block.slice(3)}
                        </h2>
                      )
                    if (block.startsWith('### '))
                      return (
                        <h3 key={i} className="mt-6 text-xl font-semibold">
                          {block.slice(4)}
                        </h3>
                      )
                    return (
                      <p key={i} className="mt-4 text-muted-foreground leading-relaxed">
                        {block}
                      </p>
                    )
                  })
                : (
                    <p className="text-muted-foreground">{listing.subtitle ?? ''}</p>
                  )}
            </article>
          </div>

          <div className="space-y-6">
            {/* Sticky CTA */}
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-serif text-xl font-semibold">Request a Stay</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Submit an inquiry and our concierge will respond within 24 hours.
              </p>
              <Link to={`/inquiry/${listing.id}`} className="mt-6 block">
                <Button className="w-full" size="lg">
                  Request a Stay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Experience details */}
            <div className="rounded-xl border border-border bg-secondary/30 p-6">
              <h4 className="font-serif font-semibold">Experience</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                {listing.experience_details}
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                {listing.capacity && (
                  <span className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    Up to {listing.capacity} guests
                  </span>
                )}
                {listing.region && (
                  <span className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {listing.region}
                  </span>
                )}
              </div>
              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Amenities</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {listing.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-background px-3 py-1 text-xs"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
