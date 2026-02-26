import { Search, Download, FileDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const ICON_SIZE = 'h-4 w-4' as const

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'closed', label: 'Closed' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'general', label: 'General' },
  { value: 'concierge', label: 'Concierge' },
]

export interface AdminContactInquiryToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  typeFilter: string
  onTypeFilterChange: (v: string) => void
  onExportCsv: () => void
  selectedCount?: number
  onBulkExport?: () => void
  disabled?: boolean
  className?: string
}

export function AdminContactInquiryToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onExportCsv,
  selectedCount = 0,
  onBulkExport,
  disabled = false,
  className,
}: AdminContactInquiryToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Label htmlFor="inquiry-search" className="sr-only">
            Search inquiries by name, email, or reference
          </Label>
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground',
              ICON_SIZE
            )}
            aria-hidden
          />
          <Input
            id="inquiry-search"
            type="search"
            placeholder="Search by name, email, reference..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-full sm:w-[140px]" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {selectedCount > 0 && onBulkExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkExport}
            className="border-accent/50 hover:border-accent hover:bg-accent/10 focus-visible:ring-accent"
          >
            <FileDown className={cn('mr-2 shrink-0', ICON_SIZE)} aria-hidden />
            Export {selectedCount} selected
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCsv}
          disabled={disabled}
        >
          <Download className={cn('mr-2 shrink-0', ICON_SIZE)} aria-hidden />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
