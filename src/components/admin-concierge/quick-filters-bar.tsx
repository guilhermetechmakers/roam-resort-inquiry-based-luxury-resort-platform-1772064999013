import { cn } from '@/lib/utils'

export type QuickFilterValue = 'all' | 'new' | 'contacted' | 'deposit_paid' | 'confirmed' | 'cancelled'

export interface QuickFiltersBarProps {
  value: QuickFilterValue
  onChange: (value: QuickFilterValue) => void
  destinationOptions?: { id: string; name: string }[]
  selectedDestination?: string
  onDestinationChange?: (id: string) => void
  dateFrom?: string
  dateTo?: string
  onDateFromChange?: (v: string) => void
  onDateToChange?: (v: string) => void
  className?: string
}

const STATUS_FILTERS: { value: QuickFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function QuickFiltersBar({
  value,
  onChange,
  destinationOptions = [],
  selectedDestination,
  onDestinationChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  className,
}: QuickFiltersBarProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="group"
      aria-label="Quick filters"
    >
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              value === filter.value
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
            aria-pressed={value === filter.value}
            aria-label={`Filter by ${filter.label}`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      {destinationOptions.length > 0 && onDestinationChange && (
        <select
          value={selectedDestination ?? ''}
          onChange={(e) => onDestinationChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by destination"
        >
          <option value="">All destinations</option>
          {(destinationOptions ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      )}
      {onDateFromChange && onDateToChange && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom ?? ''}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Date from"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="date"
            value={dateTo ?? ''}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Date to"
          />
        </div>
      )}
    </div>
  )
}
