import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Sidebar, hostSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useListingById } from '@/hooks/use-listings'
import { mockListings } from '@/data/mock-listings'
import { Skeleton } from '@/components/ui/skeleton'

export function HostListingEditPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: listing, isLoading } = useListingById(listingId)
  const fallback = listingId ? mockListings.find((l) => l.id === listingId) : null
  const listingData = listing ?? fallback

  if (authLoading) return null
  if (!hasRole('host')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  if (isLoading && !listingData) {
    return (
      <div className="flex min-h-screen">
        <Sidebar links={hostSidebarLinks} title="Host" />
        <main className="flex-1 p-8">
          <Skeleton className="h-96 rounded-xl" />
        </main>
      </div>
    )
  }

  if (!listingData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Listing not found.</p>
        <Link to="/host" className="ml-4">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar links={hostSidebarLinks} title="Host" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Link
            to="/host"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Link>

          <h1 className="font-serif text-3xl font-bold">Edit Listing</h1>
          <p className="mt-2 text-muted-foreground">{listingData.title}</p>

          <Card className="mt-8">
            <CardHeader>
              <h2 className="font-serif text-xl font-semibold">Listing Preview</h2>
            </CardHeader>
            <CardContent>
              <div
                className="h-48 rounded-lg bg-cover bg-center"
                style={{
                  backgroundImage: `url(${listingData.hero_image_url ?? listingData.gallery_urls?.[0]})`,
                }}
              />
              <p className="mt-4 text-sm text-muted-foreground">
                Full CMS with Cloudinary upload, SEO metadata, and publish controls
                would be implemented here. This is a placeholder view.
              </p>
              <Link to={`/destinations/${listingData.slug}`} className="mt-4 inline-block">
                <Button variant="outline">View Live</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
