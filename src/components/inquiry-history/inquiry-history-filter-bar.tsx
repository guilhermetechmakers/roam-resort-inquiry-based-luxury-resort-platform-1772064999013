import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { InquiryStatusFilter } from '@/api/guest-inquiries'

export interface InquiryHistoryFilterBarProps {
  currentStatus: InquiryStatusFilter
  startDate: string
  endDate: string
  onStatusChange: (value: InquiryStatusFilter) => void
  onDateChange: (field: 'from' | 'to', value: string) => void
  onReset: () => void
  className?: string
}

/**
 * Filter bar with status select, date range pickers, and reset.
 */
export function InquiryHistoryFilterBar({
  currentStatus,
  startDate,
  endDate,
  onStatusChange,
  onDateChange,
  onReset,
  className,
}: InquiryHistoryFilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:flex-wrap sm:items-end',
        className
      )}
      role="search"
      aria-label="Filter inquiry history"
    >
      <div className="flex flex-col gap-2 sm:w-40">
        <Label htmlFor="filter-status" className="text-xs uppercase tracking-wider text-muted-foreground">
          Status
        </Label>
        <Select
          value={currentStatus || 'all'}
          onValueChange={(v) => onStatusChange((v as InquiryStatusFilter) || 'all')}
        >
          <SelectTrigger id="filter-status" aria-label="Filter by status">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:w-40">
        <Label htmlFor="filter-from" className="text-xs uppercase tracking-wider text-muted-foreground">
          From date
        </Label>
        <Input
          id="filter-from"
          type="date"
          value={startDate}
          onChange={(e) => onDateChange('from', e.target.value)}
          aria-label="Filter from date"
        />
      </div>

      <div className="flex flex-col gap-2 sm:w-40">
        <Label htmlFor="filter-to" className="text-xs uppercase tracking-wider text-muted-foreground">
          To date
        </Label>
        <Input
          id="filter-to"
          type="date"
          value={endDate}
          onChange={(e) => onDateChange('to', e.target.value)}
          aria-label="Filter to date"
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="shrink-0"
        aria-label="Clear all filters"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
  )
}
