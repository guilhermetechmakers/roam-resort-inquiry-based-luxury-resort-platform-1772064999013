/**
 * Filters panel: status, host, destination, keyword search.
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { HostOption } from '@/types/export'

const INQUIRY_STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export interface ExportFiltersConfig {
  status?: string
  hostId?: string
  destinationId?: string
  search?: string
}

export interface FiltersPanelProps {
  hosts: HostOption[]
  currentFilters: ExportFiltersConfig
  onFiltersChange: (filters: ExportFiltersConfig) => void
  disabled?: boolean
  className?: string
}

export function FiltersPanel({
  hosts,
  currentFilters,
  onFiltersChange,
  disabled = false,
  className,
}: FiltersPanelProps) {
  const filters = currentFilters ?? {}
  const safeHosts = Array.isArray(hosts) ? hosts : []

  const update = (key: keyof ExportFiltersConfig, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Label className="text-sm font-medium block">Filters</Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(v) => update('status', v === 'all' ? undefined : v)}
            disabled={disabled}
          >
            <SelectTrigger id="filter-status" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {INQUIRY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-destination">Destination / Host</Label>
          <Select
            value={filters.destinationId ?? filters.hostId ?? 'all'}
            onValueChange={(v) => {
              update('destinationId', v === 'all' ? undefined : v)
              update('hostId', v === 'all' ? undefined : v)
            }}
            disabled={disabled}
          >
            <SelectTrigger id="filter-destination" aria-label="Filter by destination">
              <SelectValue placeholder="All destinations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All destinations</SelectItem>
              {safeHosts.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name ?? h.slug ?? h.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="filter-search">Keyword search</Label>
        <Input
          id="filter-search"
          type="search"
          placeholder="Search by reference..."
          value={filters.search ?? ''}
          onChange={(e) => update('search', e.target.value.trim() || undefined)}
          disabled={disabled}
          aria-label="Keyword search"
        />
      </div>
    </div>
  )
}
