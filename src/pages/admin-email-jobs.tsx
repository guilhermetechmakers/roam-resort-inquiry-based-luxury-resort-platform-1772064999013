import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { adminSidebarLinks } from '@/components/layout/sidebar-links'
import { useAuth } from '@/hooks/use-auth'
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
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-4 sm:p-6 md:p-8">
          <header className="mb-6 sm:mb-8">
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
              Email & Suppression
            </h1>
            <p className="mt-2 text-muted-foreground">
              Monitor email job queue and suppression list (bounces, unsubscribes).
            </p>
          </header>

          <Tabs defaultValue="jobs" className="mt-6 sm:mt-8">
            <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="jobs" className="gap-2 flex-1 sm:flex-initial">
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                Email Jobs
              </TabsTrigger>
              <TabsTrigger value="suppression" className="gap-2 flex-1 sm:flex-initial">
                <ShieldOff className="h-4 w-4 shrink-0" aria-hidden />
                Suppression List
              </TabsTrigger>
            </TabsList>
            <TabsContent value="jobs" className="mt-4 sm:mt-6">
              <section aria-labelledby="email-jobs-heading">
                <h2 id="email-jobs-heading" className="sr-only">
                  Email Jobs
                </h2>
                {jobsError && (
                  <ErrorBanner
                    message={toUserMessage(jobsErr, 'Failed to load email jobs')}
                    onRetry={() => refetchJobs()}
                    className="mb-4"
                  />
                )}
                {!jobsError && (
                  <AdminEmailJobsPanel
                    jobs={jobsList}
                    isLoading={jobsLoading}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                  />
                )}
              </section>
            </TabsContent>
            <TabsContent value="suppression" className="mt-4 sm:mt-6">
              <section aria-labelledby="suppression-list-heading">
                <h2 id="suppression-list-heading" className="sr-only">
                  Suppression List
                </h2>
                {suppError && (
                  <ErrorBanner
                    message={toUserMessage(suppErr, 'Failed to load suppression list')}
                    onRetry={() => refetchSupp()}
                    className="mb-4"
                  />
                )}
                {!suppError && (
                  <AdminSuppressionList entries={suppList} isLoading={suppLoading} />
                )}
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
