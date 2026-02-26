import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'

export function SettingsPage() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account preferences.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <h2 className="font-serif text-xl font-semibold">Account</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{user?.full_name ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-serif text-xl font-semibold">Notifications</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email notifications for inquiry updates and payment links.
          </p>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Link to="/profile">
          <Button variant="outline">Back to Profile</Button>
        </Link>
      </div>
    </div>
  )
}
