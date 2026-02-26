import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import type { InquiryHistoryStatusFilter } from '@/hooks/use-guest-inquiry-history'

export interface InquiryHistoryFilterBarProps {
  currentStatus: InquiryHistoryStatusFilter
  startDate: string
  endDate: string
  onStatusChange: (value: InquiryHistoryStatusFilter) => void
  onDateChange: (type: 'from' | 'to', value: string) => void
  onReset: () => void
}

export function InquiryHistoryFilterBar({
  currentStatus,
  startDate,
  endDate,
  onStatusChange,
  onDateChange,
  onReset,
}: InquiryHistoryFilterBarProps) {
  const hasActiveFilters =
    currentStatus !== '' || startDate !== '' || endDate !== ''

  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
      role="group"
      aria-label="Filter inquiries"
    >
      <div className="flex flex-col gap-2 sm:w-40">
        <Label htmlFor="status-filter" className="text-xs uppercase tracking-wider text-muted-foreground">
          Status
        </Label>
        <Select
          value={currentStatus === '' ? 'all' : currentStatus}
          onValueChange={(v) =>
            onStatusChange(v === 'all' ? '' : (v as InquiryHistoryStatusFilter))
          }
        >
          <SelectTrigger id="status-filter" aria-label="Filter by status">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:w-40">
        <Label htmlFor="from-date" className="text-xs uppercase tracking-wider text-muted-foreground">
          From
        </Label>
        <Input
          id="from-date"
          type="date"
          value={startDate}
          onChange={(e) => onDateChange('from', e.target.value)}
          aria-label="Filter from date"
        />
      </div>

      <div className="flex flex-col gap-2 sm:w-40">
        <Label htmlFor="to-date" className="text-xs uppercase tracking-wider text-muted-foreground">
          To
        </Label>
        <Input
          id="to-date"
          type="date"
          value={endDate}
          onChange={(e) => onDateChange('to', e.target.value)}
          aria-label="Filter to date"
          min={startDate || undefined}
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          aria-label="Clear all filters"
          className="self-end"
        >
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
