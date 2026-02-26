import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { Download } from 'lucide-react'

export function AdminExportsPage() {
  const { hasRole, isLoading: authLoading } = useAuth()

  if (authLoading) return null
  if (!hasRole('concierge')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar links={adminSidebarLinks} title="Concierge" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="font-serif text-3xl font-bold">CSV Export</h1>
          <p className="mt-2 text-muted-foreground">
            Build and download exports for reconciliation.
          </p>

          <Card className="mt-8">
            <CardHeader>
              <h2 className="font-serif text-xl font-semibold">Export Builder</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select date range and filters to generate a CSV export. The export
                will be assembled in the background and a download link will be
                provided.
              </p>
              <Button disabled>
                <Download className="mr-2 h-5 w-5" />
                Create Export (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
