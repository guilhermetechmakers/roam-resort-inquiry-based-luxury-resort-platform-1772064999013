import { Link } from 'react-router-dom'
import { FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useMyInquiries } from '@/hooks/use-inquiries'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  deposit_paid: 'Deposit Paid',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  deposit_paid: 'bg-green-100 text-green-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: inquiries, isLoading } = useMyInquiries(user?.id)

  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="font-serif text-2xl font-semibold">Sign in to view your profile</h2>
        <Link to="/login" className="mt-4">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">My Inquiries</h1>
        <p className="mt-2 text-muted-foreground">
          {user?.full_name ?? user?.email}
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !inquiries?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-serif text-xl font-semibold">No inquiries yet</h3>
            <p className="mt-2 text-center text-muted-foreground max-w-sm">
              Submit a stay inquiry from any destination page to see it here.
            </p>
            <Link to="/destinations" className="mt-6">
              <Button>Browse Destinations</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <span className="font-mono text-sm text-muted-foreground">
                    {inquiry.reference}
                  </span>
                  <h3 className="mt-1 font-serif text-lg font-semibold">
                    {typeof inquiry.listing === 'object' && inquiry.listing
                      ? inquiry.listing.title
                      : 'Destination'}
                  </h3>
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    statusColors[inquiry.status] ?? 'bg-gray-100 text-gray-800'
                  )}
                >
                  {statusLabels[inquiry.status] ?? inquiry.status}
                </span>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {inquiry.check_in && (
                    <span>Check-in: {formatDate(inquiry.check_in)}</span>
                  )}
                  {inquiry.check_out && (
                    <span>Check-out: {formatDate(inquiry.check_out)}</span>
                  )}
                  {inquiry.guests_count && (
                    <span>{inquiry.guests_count} guests</span>
                  )}
                </div>
                {inquiry.payment_link && (
                  <a
                    href={inquiry.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-accent hover:underline"
                  >
                    Complete Payment
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-12">
        <Link to="/settings">
          <Button variant="outline">Account Settings</Button>
        </Link>
      </div>
    </div>
  )
}
