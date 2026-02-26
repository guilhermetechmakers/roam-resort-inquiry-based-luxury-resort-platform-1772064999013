import { useState, useMemo } from 'react'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useAdminInquiries } from '@/hooks/use-inquiries'
import {
  AdminInquiryListToolbar,
  AdminInquiryListTable,
  AdminInquiryDetailDrawer,
  CsvExportModal,
} from '@/components/admin-concierge'
import { ErrorBanner } from '@/components/auth'
import { shapeInquiryToAdmin, generateInquiriesCsv, downloadCsv } from '@/api/admin'
import { toUserMessage } from '@/lib/errors'
import type { Inquiry } from '@/types'

export function AdminInquiryListPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: inquiries, isLoading, isError, error, refetch } = useAdminInquiries()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [drawerInquiry, setDrawerInquiry] = useState<Inquiry | null>(null)

  const list = Array.isArray(inquiries) ? inquiries : []
  const filtered = useMemo(() => {
    let result = list.filter((i) => {
      const matchSearch =
        !search ||
        (i.reference ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (typeof i.listing === 'object' &&
          i.listing?.title?.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = statusFilter === 'all' || i.status === statusFilter
      return matchSearch && matchStatus
    })
    result = [...result].sort((a, b) => {
      if (sortBy === 'newest')
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      if (sortBy === 'oldest')
        return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      if (sortBy === 'reference') return (a.reference ?? '').localeCompare(b.reference ?? '')
      if (sortBy === 'status') return (a.status ?? '').localeCompare(b.status ?? '')
      return 0
    })
    return result
  }, [list, search, statusFilter, sortBy])

  const handleBulkExport = () => {
    const selected = (filtered ?? []).filter((i) => selectedIds.has(i.id))
    const shaped = selected.map((i) => shapeInquiryToAdmin(i))
    const csv = generateInquiriesCsv(shaped)
    downloadCsv(csv, `inquiries-selected-${new Date().toISOString().slice(0, 10)}.csv`)
    setSelectedIds(new Set())
  }

  const handleExportSingle = (inquiry: Inquiry) => {
    const shaped = shapeInquiryToAdmin(inquiry)
    const csv = generateInquiriesCsv([shaped])
    downloadCsv(csv, `inquiry-${inquiry.reference ?? inquiry.id}-${new Date().toISOString().slice(0, 10)}.csv`)
  }

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
          <h1 className="font-serif text-3xl font-bold">Inquiries</h1>
          <p className="mt-2 text-muted-foreground">
            Manage all stay inquiries, apply filters, and export to CSV.
          </p>

          {isError && (
            <ErrorBanner
              message={toUserMessage(error, 'Failed to load inquiries')}
              onRetry={() => refetch()}
              className="mb-6"
            />
          )}

          <div className="mt-8 space-y-6">
            <AdminInquiryListToolbar
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onExportCsv={() => setCsvModalOpen(true)}
              selectedCount={selectedIds.size}
              onBulkExport={selectedIds.size > 0 ? handleBulkExport : undefined}
              disabled={(filtered ?? []).length === 0}
            />

            <AdminInquiryListTable
              inquiries={filtered ?? []}
              isLoading={isLoading}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onExportSingle={handleExportSingle}
              onQuickView={(i) => setDrawerInquiry(i)}
            />
          </div>
        </div>
      </main>

      <CsvExportModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        inquiries={filtered ?? []}
        appliedFilters={{ status: statusFilter === 'all' ? undefined : statusFilter }}
      />

      <AdminInquiryDetailDrawer
        inquiry={drawerInquiry}
        open={!!drawerInquiry}
        onClose={() => setDrawerInquiry(null)}
      />
    </div>
  )
}
