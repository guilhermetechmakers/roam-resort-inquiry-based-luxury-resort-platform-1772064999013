import { useState, useMemo } from 'react'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useContactInquiries } from '@/hooks/use-contact-inquiries'
import {
  AdminContactInquiryListTable,
  AdminContactInquiryDetailDrawer,
  AdminContactInquiryToolbar,
  AdminContactInquiryCsvModal,
} from '@/components/admin-contact'
import { ErrorBanner } from '@/components/auth'
import { toUserMessage } from '@/lib/errors'
import {
  generateContactInquiriesCsv,
  downloadCsv,
} from '@/lib/contact-inquiry-export'
import type { ContactInquiry } from '@/types/contact-inquiry'

export function AdminContactInquiriesPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: inquiries, isLoading, isError, error, refetch } = useContactInquiries()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [drawerInquiry, setDrawerInquiry] = useState<ContactInquiry | null>(null)

  const list = Array.isArray(inquiries) ? inquiries : []
  const filtered = useMemo(() => {
    let result = list.filter((i) => {
      const matchSearch =
        !search ||
        (i.inquiry_reference ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (i.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (i.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (i.subject ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || i.status === statusFilter
      const matchType =
        typeFilter === 'all' ||
        (typeFilter === 'concierge' && i.is_concierge) ||
        (typeFilter === 'general' && !i.is_concierge)
      return matchSearch && matchStatus && matchType
    })
    result = [...result].sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    )
    return result
  }, [list, search, statusFilter, typeFilter])

  const handleBulkExport = () => {
    const selected = filtered.filter((i) => selectedIds.has(i.id))
    const csv = generateContactInquiriesCsv(selected)
    downloadCsv(csv, `contact-inquiries-${new Date().toISOString().slice(0, 10)}.csv`)
    setSelectedIds(new Set())
  }

  const handleExportSingle = (inquiry: ContactInquiry) => {
    const csv = generateContactInquiriesCsv([inquiry])
    downloadCsv(
      csv,
      `contact-inquiry-${inquiry.inquiry_reference ?? inquiry.id}-${new Date().toISOString().slice(0, 10)}.csv`
    )
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
          {isError && (
            <ErrorBanner
              message={toUserMessage(error, 'Failed to load contact inquiries')}
              onRetry={() => refetch()}
              className="mb-6"
            />
          )}

          <h1 className="font-serif text-3xl font-bold">Contact Inquiries</h1>
          <p className="mt-2 text-muted-foreground">
            Manage general support and concierge requests. Filter, view details, and export to CSV.
          </p>

          <div className="mt-8 space-y-6">
            <AdminContactInquiryToolbar
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              onExportCsv={() => setCsvModalOpen(true)}
              selectedCount={selectedIds.size}
              onBulkExport={selectedIds.size > 0 ? handleBulkExport : undefined}
              disabled={filtered.length === 0}
            />

            <AdminContactInquiryListTable
              inquiries={filtered}
              isLoading={isLoading}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onExportSingle={handleExportSingle}
              onQuickView={(i) => setDrawerInquiry(i)}
            />
          </div>
        </div>
      </main>

      <AdminContactInquiryCsvModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        inquiries={filtered}
        appliedFilters={{
          status: statusFilter === 'all' ? undefined : statusFilter,
          type: typeFilter === 'all' ? undefined : typeFilter,
        }}
      />

      <AdminContactInquiryDetailDrawer
        inquiry={drawerInquiry}
        open={!!drawerInquiry}
        onClose={() => setDrawerInquiry(null)}
      />
    </div>
  )
}
