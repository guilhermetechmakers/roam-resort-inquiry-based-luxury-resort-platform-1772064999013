import { Link } from 'react-router-dom'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Sidebar, hostSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { mockListings } from '@/data/mock-listings'
import { cn } from '@/lib/utils'

export function HostDashboardPage() {
  const { user, hasRole, isLoading } = useAuth()
  const listings = mockListings.filter((l) => l.host_id === 'host-1' || !user)

  if (isLoading) return null
  if (!hasRole('host')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied. Host role required.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar links={hostSidebarLinks} title="Host" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold">Listings</h1>
              <p className="mt-2 text-muted-foreground">
                Manage your editorial destination listings.
              </p>
            </div>
            <Link to="/host/listings/new">
              <Button>
                <Plus className="mr-2 h-5 w-5" />
                Create Listing
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <div
                  className="h-40 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${listing.hero_image_url ?? listing.gallery_urls?.[0]})`,
                  }}
                />
                <CardHeader className="flex flex-row items-center justify-between">
                  <h3 className="font-serif font-semibold">{listing.title}</h3>
                  <span
                    className={cn(
                      'rounded-full px-2 py-1 text-xs',
                      listing.status === 'live'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    )}
                  >
                    {listing.status}
                  </span>
                </CardHeader>
                <CardContent>
                  <Link to={`/host/listings/${listing.id}`}>
                    <Button variant="outline" size="sm">
                      View / Edit
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {listings.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-serif text-xl font-semibold">No listings yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Create your first editorial listing.
                </p>
                <Link to="/host/listings/new" className="mt-6">
                  <Button>
                    <Plus className="mr-2 h-5 w-5" />
                    Create Listing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
