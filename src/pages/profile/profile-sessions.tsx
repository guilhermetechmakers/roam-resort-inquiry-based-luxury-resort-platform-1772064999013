import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SessionManagementPanel } from '@/components/profile'
import { useAuth } from '@/hooks/use-auth'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function ProfileSessions() {
  const { user, isLoading: authLoading } = useAuth()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          aria-label="Back to profile overview"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to overview
        </Link>
        <h1 className="font-serif text-2xl font-bold sm:text-3xl text-foreground">
          Active sessions
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Manage your active sessions and sign out from other devices
        </p>

        <section
          className="mt-6 sm:mt-8"
          aria-labelledby="sessions-heading"
          aria-describedby="sessions-description"
        >
          <h2 id="sessions-heading" className="sr-only">
            Session management
          </h2>
          <p id="sessions-description" className="sr-only">
            View and manage your active sessions across devices. Sign out from individual devices or all other devices.
          </p>
          {authLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </CardContent>
            </Card>
          ) : (
            <SessionManagementPanel userId={user?.id} />
          )}
        </section>
      </div>
    </div>
  )
}
