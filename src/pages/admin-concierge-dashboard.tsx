import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Wallet, Download, ClipboardList } from 'lucide-react'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useAdminInquiries } from '@/hooks/use-inquiries'
import {
  MetricCard,
  RecentInquiriesFeed,
  QuickFiltersBar,
  ShortcutsPanel,
  CsvExportModal,
  DataVisualizationPanel,
} from '@/components/admin-concierge'
import type { QuickFilterValue } from '@/components/admin-concierge'
import { computeDashboardMetrics } from '@/api/admin'
import { Input } from '@/components/ui/input'

export function AdminConciergeDashboardPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: inquiries, isLoading } = useAdminInquiries()
  const navigate = useNavigate()
  const [quickFilter, setQuickFilter] = useState<QuickFilterValue>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [csvModalOpen, setCsvModalOpen] = useState(false)

  const list = Array.isArray(inquiries) ? inquiries : []
  const filtered = useMemo(() => {
    let result = list
    if (quickFilter !== 'all') {
      result = result.filter((i) => i.status === quickFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          (i.reference ?? '').toLowerCase().includes(q) ||
          (typeof i.listing === 'object' && i.listing?.title?.toLowerCase().includes(q))
      )
    }
    return result
  }, [list, quickFilter, searchQuery])

  const metrics = useMemo(() => computeDashboardMetrics(list), [list])
  const recentItems = filtered.slice(0, 10)

  if (authLoading) return null
  if (!hasRole('concierge')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied. Concierge Admin role required.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar links={adminSidebarLinks} title="Concierge" />
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-8">
          {/* Header with global search */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                Concierge Dashboard
              </h1>
              <p className="mt-2 text-muted-foreground">
                Monitor metrics, recent inquiries, and quick actions.
              </p>
            </div>
            <div className="relative max-w-xs">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search inquiries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search inquiries"
              />
            </div>
          </div>

          {/* Overview metric cards */}
          <section
            className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            aria-label="Overview metrics"
          >
            <MetricCard
              title="Total Inquiries"
              value={metrics.totalInquiries}
              icon={FileText}
              isLoading={isLoading}
            />
            <MetricCard
              title="New This Week"
              value={metrics.newThisWeek}
              icon={FileText}
              isLoading={isLoading}
              variant="accent"
            />
            <MetricCard
              title="Overdue"
              value={metrics.overdue}
              icon={FileText}
              isLoading={isLoading}
              variant={metrics.overdue > 0 ? 'accent' : 'default'}
            />
            <MetricCard
              title="Unresolved"
              value={metrics.unresolved}
              icon={FileText}
              isLoading={isLoading}
            />
            <MetricCard
              title="Revenue"
              value={`$${metrics.revenue.toLocaleString()}`}
              icon={Wallet}
              isLoading={isLoading}
              variant="accent"
            />
          </section>

          {/* Quick filters */}
          <section className="mb-8" aria-label="Quick filters">
            <h2 className="mb-4 font-serif text-xl font-semibold">Quick Filters</h2>
            <QuickFiltersBar value={quickFilter} onChange={setQuickFilter} />
          </section>

          {/* Shortcuts */}
          <section className="mb-10" aria-label="Shortcuts">
            <h2 className="mb-4 font-serif text-xl font-semibold">Shortcuts</h2>
            <ShortcutsPanel
              items={[
                {
                  label: 'Manage Inquiries',
                  icon: ClipboardList,
                  href: '/admin/inquiries',
                  ariaLabel: 'View and manage all stay inquiries',
                },
                {
                  label: 'Export Reports',
                  icon: Download,
                  onClick: () => setCsvModalOpen(true),
                  ariaLabel: 'Export inquiries or reconciliation data to CSV',
                },
                {
                  label: 'Reconcile Payments',
                  icon: Wallet,
                  href: '/admin/exports',
                  ariaLabel: 'Go to exports for reconciliation',
                },
              ]}
            />
          </section>

          {/* Recent inquiries feed */}
          <section className="mb-10" aria-label="Recent inquiries">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Recent Inquiries</h2>
              <button
                type="button"
                onClick={() => navigate('/admin/inquiries')}
                className="text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                View all →
              </button>
            </div>
            <RecentInquiriesFeed
              inquiries={recentItems}
              isLoading={isLoading}
              maxItems={8}
              onOpenDetails={(i) => navigate(`/admin/inquiries/${i.id}`)}
            />
          </section>

          {/* Data visualization */}
          <section className="mb-8" aria-label="Data visualization">
            <h2 className="mb-4 font-serif text-xl font-semibold">Trends</h2>
            <DataVisualizationPanel inquiries={list} isLoading={isLoading} />
          </section>
        </div>
      </main>

      <CsvExportModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        inquiries={filtered}
        appliedFilters={{
          status: quickFilter === 'all' ? undefined : quickFilter,
        }}
      />
    </div>
  )
}
