import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useListings } from '@/hooks/use-listings'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function HomePage() {
  const { data: listings, isLoading } = useListings()
  const featured = listings?.slice(0, 3) ?? []

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center gradient-hero"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920)`,
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
          <div className="max-w-2xl animate-fade-in-up">
            <h1 className="font-serif text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Curated Stays.
              <br />
              <span className="text-secondary">Inquiry-First.</span>
            </h1>
            <p className="mt-6 text-lg text-white/90 max-w-xl">
              Discover editorial destination pages and submit high-quality stay
              inquiries. Our concierge team personalizes every experience.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/destinations">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-accent-glow"
                >
                  Explore Destinations
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10">
                  Request a Stay
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Destination highlights */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-serif text-4xl font-bold text-foreground">
              Featured Destinations
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Handpicked properties where storytelling meets luxury.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))
              : featured.map((listing, i) => (
                  <Link
                    key={listing.id}
                    to={`/destinations/${listing.slug}`}
                    className={cn(
                      'group block overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02]',
                      i === 0 && 'sm:col-span-2 sm:row-span-2'
                    )}
                  >
                    <div
                      className={cn(
                        'bg-cover bg-center transition-transform duration-500 group-hover:scale-105',
                        i === 0 ? 'h-96 sm:h-full min-h-[400px]' : 'h-48'
                      )}
                      style={{
                        backgroundImage: `url(${listing.hero_image_url ?? listing.gallery_urls?.[0]})`,
                      }}
                    />
                    <div className="p-6">
                      <span className="text-sm font-medium text-accent">
                        {listing.region}
                      </span>
                      <h3 className="mt-1 font-serif text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
                        {listing.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {listing.subtitle}
                      </p>
                    </div>
                  </Link>
                ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/destinations">
              <Button variant="outline" size="lg">
                View All Destinations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Roam?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Submit an inquiry and our concierge team will craft a personalized
            experience for your stay.
          </p>
          <Link to="/login" className="mt-8 inline-block">
            <Button size="lg" className="shadow-accent-glow">
              Request a Stay
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
