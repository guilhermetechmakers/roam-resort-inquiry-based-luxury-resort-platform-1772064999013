import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SessionManagementPanel } from '@/components/profile'
import { useAuth } from '@/hooks/use-auth'

export function ProfileSessions() {
  const { user } = useAuth()

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
        <h1 className="font-serif text-3xl font-bold">Active sessions</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your active sessions and sign out from other devices
        </p>

        <div className="mt-8">
          <SessionManagementPanel userId={user?.id} />
        </div>
      </div>
    </div>
  )
}
