import { Search, Download } from 'lucide-react'
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

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'reference', label: 'Reference' },
  { value: 'status', label: 'Status' },
] as const

export interface AdminInquiryListToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  sortBy: string
  onSortByChange: (v: string) => void
  onExportCsv: () => void
  selectedCount: number
  onBulkExport?: () => void
  disabled?: boolean
  className?: string
}

export function AdminInquiryListToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  onExportCsv,
  selectedCount,
  onBulkExport,
  disabled,
  className,
}: AdminInquiryListToolbarProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}
      role="toolbar"
      aria-label="Inquiry list filters and actions"
    >
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search by reference or listing..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Search inquiries"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px]" aria-label="Filter by status">
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
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[160px]" aria-label="Sort by">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
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
  )
}
