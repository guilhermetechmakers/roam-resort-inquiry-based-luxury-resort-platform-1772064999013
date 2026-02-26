import { Search, Download, FileDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, reference..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[160px]">
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
          <SelectTrigger className="w-[140px]">
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
      <div className="flex items-center gap-2">
        {selectedCount > 0 && onBulkExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkExport}
            className="border-accent/50"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export {selectedCount} selected
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCsv}
          disabled={disabled}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
