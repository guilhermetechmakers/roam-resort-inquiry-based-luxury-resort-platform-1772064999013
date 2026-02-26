import { useState } from 'react'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useEmailJobs, useSuppressionList } from '@/hooks/use-email-jobs'
import { AdminEmailJobsPanel, AdminSuppressionList } from '@/components/admin-email'
import { ErrorBanner } from '@/components/auth'
import { toUserMessage } from '@/lib/errors'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, ShieldOff } from 'lucide-react'

export function AdminEmailJobsPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data: jobs, isLoading: jobsLoading, isError: jobsError, error: jobsErr, refetch: refetchJobs } = useEmailJobs({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 50,
  })
  const { data: suppressions, isLoading: suppLoading, isError: suppError, error: suppErr, refetch: refetchSupp } = useSuppressionList({ limit: 100 })

  const jobsList = Array.isArray(jobs) ? jobs : []
  const suppList = Array.isArray(suppressions) ? suppressions : []

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
          {(jobsError || suppError) && (
            <ErrorBanner
              message={toUserMessage(jobsErr ?? suppErr, 'Failed to load')}
              onRetry={() => {
                refetchJobs()
                refetchSupp()
              }}
              className="mb-6"
            />
          )}

          <h1 className="font-serif text-3xl font-bold">Email & Suppression</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor email job queue and suppression list (bounces, unsubscribes).
          </p>

          <Tabs defaultValue="jobs" className="mt-8">
            <TabsList className="mb-6">
              <TabsTrigger value="jobs" className="gap-2">
                <Mail className="h-4 w-4" />
                Email Jobs
              </TabsTrigger>
              <TabsTrigger value="suppression" className="gap-2">
                <ShieldOff className="h-4 w-4" />
                Suppression List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="jobs">
              <AdminEmailJobsPanel
                jobs={jobsList}
                isLoading={jobsLoading}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
            </TabsContent>
            <TabsContent value="suppression">
              <AdminSuppressionList entries={suppList} isLoading={suppLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
