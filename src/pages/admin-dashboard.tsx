import { Link } from 'react-router-dom'
import { FileText, TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useAdminInquiries } from '@/hooks/use-inquiries'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminDashboardPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: inquiries, isLoading } = useAdminInquiries()

  if (authLoading) return null
  if (!hasRole('concierge')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied. Admin role required.</p>
      </div>
    )
  }

  const newCount = inquiries?.filter((i) => i.status === 'new').length ?? 0
  const pendingCount = inquiries?.filter((i) =>
    ['contacted', 'new'].includes(i.status)
  ).length ?? 0
  const recent = inquiries?.slice(0, 5) ?? []

  return (
    <div className="flex min-h-screen">
      <Sidebar links={adminSidebarLinks} title="Concierge" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Concierge overview and recent inquiries.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  New Inquiries
                </span>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-3xl font-bold">{newCount}</span>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Pending
                </span>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-3xl font-bold">{pendingCount}</span>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Inquiries
                </span>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-3xl font-bold">{inquiries?.length ?? 0}</span>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h2 className="font-serif text-xl font-semibold">Recent Inquiries</h2>
            <div className="mt-4 space-y-2">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))
                : recent.length === 0
                  ? (
                      <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                          No inquiries yet.
                        </CardContent>
                      </Card>
                    )
                  : recent.map((inquiry) => (
                      <Link key={inquiry.id} to={`/admin/inquiries/${inquiry.id}`}>
                        <Card className="transition-colors hover:bg-secondary/50">
                          <CardContent className="flex items-center justify-between py-4">
                            <div>
                              <span className="font-mono text-sm text-muted-foreground">
                                {inquiry.reference}
                              </span>
                              <p className="font-medium">
                                {typeof inquiry.listing === 'object' && inquiry.listing
                                  ? inquiry.listing.title
                                  : 'Destination'}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                inquiry.status === 'new'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inquiry.status}
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Link to="/admin/inquiries">
              <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
                <CardContent className="py-4">
                  View All Inquiries
                </CardContent>
              </Card>
            </Link>
            <Link to="/admin/exports">
              <Card className="cursor-pointer transition-colors hover:bg-secondary/50">
                <CardContent className="py-4">
                  Export CSV
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
