import { useState, useCallback } from 'react'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import {
  useAdminInquiriesPaginated,
  useAdminDestinations,
  useAdminHosts,
  useBulkUpdateInquiryStatus,
} from '@/hooks/use-admin-inquiries'
import {
  AdminInquiryListToolbar,
  AdminInquiryListTable,
  AdminInquiryDetailDrawer,
  CsvExportModal,
  BulkStatusUpdateModal,
} from '@/components/admin-concierge'
import { ErrorBanner } from '@/components/auth'
import {
  shapeInquiryToAdmin,
  generateInquiriesCsv,
  downloadCsv,
  fetchAdminInquiries,
} from '@/api/admin'
import { toUserMessage } from '@/lib/errors'
import { toast } from 'sonner'
import type { Inquiry } from '@/types'
import type { AdminInquiryFilters } from '@/api/admin'

export function AdminInquiryListPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [hostId, setHostId] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [drawerInquiry, setDrawerInquiry] = useState<Inquiry | null>(null)

  const filters: AdminInquiryFilters = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    destination_id: destinationId || undefined,
    host_id: hostId || undefined,
    guest_email: guestEmail.trim() || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search.trim() || undefined,
    page,
    pageSize,
  }

  const { data, isLoading, isError, error, refetch } = useAdminInquiriesPaginated(filters)
  const { data: listings = [] } = useAdminDestinations()
  const { data: hosts = [] } = useAdminHosts()
  const bulkStatusMutation = useBulkUpdateInquiryStatus()

  const inquiries = data?.data ?? []
  const total = data?.total ?? 0

  const fetchAllFiltered = useCallback(async () => {
    const result = await fetchAdminInquiries({
      ...filters,
      page: 1,
      pageSize: 1000,
    })
    return result?.data ?? []
  }, [
    search,
    statusFilter,
    dateFrom,
    dateTo,
    destinationId,
    hostId,
    guestEmail,
  ])

  const handleBulkExport = useCallback(() => {
    const selected = (inquiries ?? []).filter((i) => selectedIds.has(i.id))
    const shaped = selected.map((i) => shapeInquiryToAdmin(i))
    const csv = generateInquiriesCsv(shaped)
    downloadCsv(csv, `inquiries-selected-${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success(`Exported ${selected.length} inquiries`)
    setSelectedIds(new Set())
  }, [inquiries, selectedIds])

  const handleExportSingle = useCallback((inquiry: Inquiry) => {
    const shaped = shapeInquiryToAdmin(inquiry)
    const csv = generateInquiriesCsv([shaped])
    downloadCsv(csv, `inquiry-${inquiry.reference ?? inquiry.id}-${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success('CSV exported')
  }, [])

  const handleBulkStatusConfirm = useCallback(
    async (status: string) => {
      const ids = Array.from(selectedIds)
      const result = await bulkStatusMutation.mutateAsync({ ids, status })
      toast.success(`Updated ${result.updated} inquiries`)
      setSelectedIds(new Set())
      refetch()
    },
    [selectedIds, bulkStatusMutation, refetch]
  )

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
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              destinationId={destinationId}
              onDestinationChange={setDestinationId}
              hostId={hostId}
              onHostChange={setHostId}
              guestEmail={guestEmail}
              onGuestEmailChange={setGuestEmail}
              listings={listings}
              hosts={hosts}
              onExportCsv={() => setCsvModalOpen(true)}
              selectedCount={selectedIds.size}
              onBulkExport={selectedIds.size > 0 ? handleBulkExport : undefined}
              onBulkStatus={selectedIds.size > 0 ? () => setBulkStatusOpen(true) : undefined}
              disabled={(inquiries ?? []).length === 0}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />

            <AdminInquiryListTable
              inquiries={inquiries ?? []}
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
        inquiries={inquiries ?? []}
        fetchAllFiltered={fetchAllFiltered}
        appliedFilters={{
          status: statusFilter === 'all' ? undefined : statusFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }}
      />

      <BulkStatusUpdateModal
        open={bulkStatusOpen}
        onOpenChange={setBulkStatusOpen}
        selectedCount={selectedIds.size}
        selectedIds={selectedIds}
        onConfirm={handleBulkStatusConfirm}
        isPending={bulkStatusMutation.isPending}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <AdminInquiryDetailDrawer
        inquiry={drawerInquiry}
        open={!!drawerInquiry}
        onClose={() => setDrawerInquiry(null)}
      />
    </div>
  )
}
