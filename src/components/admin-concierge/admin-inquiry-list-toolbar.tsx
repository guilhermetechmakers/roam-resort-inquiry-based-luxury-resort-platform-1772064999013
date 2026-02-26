import { Search, Download, ChevronLeft, ChevronRight, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Refunded' },
] as const

const PAGE_SIZE_OPTIONS = [
  { value: '20', label: '20 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
] as const

export interface AdminInquiryListToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  paymentStatusFilter?: string
  onPaymentStatusFilterChange?: (v: string) => void
  dateFrom?: string
  dateTo?: string
  onDateFromChange?: (v: string) => void
  onDateToChange?: (v: string) => void
  destinationId?: string
  onDestinationChange?: (v: string) => void
  hostId?: string
  onHostChange?: (v: string) => void
  guestEmail?: string
  onGuestEmailChange?: (v: string) => void
  listings?: Array<{ id: string; title: string }>
  hosts?: Array<{ id: string; full_name: string; email: string }>
  onExportCsv: () => void
  selectedCount: number
  onBulkExport?: () => void
  onBulkStatus?: () => void
  onBulkAddNote?: () => void
  disabled?: boolean
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?: string
}

export function AdminInquiryListToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentStatusFilter,
  onPaymentStatusFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  destinationId,
  onDestinationChange,
  hostId,
  onHostChange,
  guestEmail,
  onGuestEmailChange,
  listings = [],
  hosts = [],
  onExportCsv,
  selectedCount,
  onBulkExport,
  onBulkStatus,
  onBulkAddNote,
  disabled,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onPageSizeChange,
  className,
}: AdminInquiryListToolbarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div
      className={cn('space-y-4', className)}
      role="toolbar"
      aria-label="Inquiry list filters and actions"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-md flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              placeholder="Search by reference, destination, or guest email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              aria-label="Search inquiries"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[160px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onPaymentStatusFilterChange && (
            <Select
              value={paymentStatusFilter || 'all'}
              onValueChange={(v) => onPaymentStatusFilterChange(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-[140px]" aria-label="Filter by payment status">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onDestinationChange && (
            <Select
              value={destinationId ?? 'all'}
              onValueChange={(v) => onDestinationChange(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-[180px]" aria-label="Filter by destination">
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All destinations</SelectItem>
                {(listings ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.title ?? l.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onHostChange && (
            <Select
              value={hostId ?? 'all'}
              onValueChange={(v) => onHostChange(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-[180px]" aria-label="Filter by host">
                <SelectValue placeholder="Host" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All hosts</SelectItem>
                {(hosts ?? []).map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.full_name ?? h.email ?? h.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onGuestEmailChange && (
            <Input
              placeholder="Guest email"
              value={guestEmail ?? ''}
              onChange={(e) => onGuestEmailChange(e.target.value)}
              className="w-[180px]"
              aria-label="Filter by guest email"
            />
          )}
          {onDateFromChange && (
            <Input
              type="date"
              value={dateFrom ?? ''}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-[140px]"
              aria-label="Date from"
            />
          )}
          {onDateToChange && (
            <Input
              type="date"
              value={dateTo ?? ''}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-[140px]"
              aria-label="Date to"
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 && onBulkStatus && (
            <Button
              variant="default"
              size="sm"
              onClick={onBulkStatus}
              disabled={disabled}
              aria-label={`Update status for ${selectedCount} selected`}
              className="bg-accent hover:bg-accent/90"
            >
              Update status ({selectedCount})
            </Button>
          )}
          {selectedCount > 0 && onBulkAddNote && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkAddNote}
              disabled={disabled}
              aria-label={`Add note to ${selectedCount} selected`}
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Add note ({selectedCount})
            </Button>
          )}
          {selectedCount > 0 && onBulkExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkExport}
              disabled={disabled}
              aria-label={`Export ${selectedCount} selected inquiries`}
            >
              <Download className="mr-2 h-4 w-4" />
              Export {selectedCount} selected
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onExportCsv}
            disabled={disabled}
            aria-label="Export all filtered inquiries to CSV"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {onPageChange && onPageSizeChange && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Showing {from}–{to} of {total}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="w-[120px]" aria-label="Items per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[80px] px-2 text-center text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
