import { useState } from 'react'
import { SlidersHorizontal, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DestinationSortOption } from '@/types'

const REGION_OPTIONS = [
  { value: '__all__', label: 'All Regions' },
  { value: 'Santorini', label: 'Santorini' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Italy', label: 'Italy' },
  { value: 'France', label: 'France' },
  { value: 'Morocco', label: 'Morocco' },
]

const STYLE_OPTIONS = [
  { value: '__all__', label: 'All Styles' },
  { value: 'Coastal', label: 'Coastal' },
  { value: 'Alpine', label: 'Alpine' },
  { value: 'Safari', label: 'Safari' },
  { value: 'Cultural', label: 'Cultural' },
]

const TAG_OPTIONS = [
  { value: 'luxury', label: 'Luxury' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'family', label: 'Family' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'secluded', label: 'Secluded' },
  { value: 'beach', label: 'Beach' },
  { value: 'mountain', label: 'Mountain' },
]

const SORT_OPTIONS: { value: DestinationSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'alphabetical', label: 'A–Z' },
]

export interface DestinationFiltersState {
  region: string
  style: string
  tags: string[]
  query: string
  sort: DestinationSortOption
}

export interface DestinationFiltersPanelProps {
  filters: DestinationFiltersState
  onFiltersChange: (filters: DestinationFiltersState) => void
  onReset?: () => void
  className?: string
}

export function DestinationFiltersPanel({
  filters,
  onFiltersChange,
  onReset,
  className,
}: DestinationFiltersPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const selectedTags = Array.isArray(filters.tags) ? filters.tags : []

  const handleRegionChange = (value: string) => {
    onFiltersChange({
      ...filters,
      region: value === '__all__' ? '' : (value ?? ''),
    })
  }

  const handleStyleChange = (value: string) => {
    onFiltersChange({
      ...filters,
      style: value === '__all__' ? '' : (value ?? ''),
    })
  }

  const handleTagToggle = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    onFiltersChange({ ...filters, tags: next })
  }

  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sort: (value as DestinationSortOption) ?? 'newest',
    })
  }

  const handleReset = () => {
    onFiltersChange({
      region: '',
      style: '',
      tags: [],
      query: filters.query,
      sort: 'newest',
    })
    onReset?.()
    setMobileOpen(false)
  }

  const hasActiveFilters =
    (filters.region ?? '').trim() !== '' ||
    (filters.style ?? '').trim() !== '' ||
    selectedTags.length > 0 ||
    filters.sort !== 'newest'

  const filterContent = (
    <div className="flex flex-wrap items-center gap-4">
      <Select value={filters.region || '__all__'} onValueChange={handleRegionChange}>
        <SelectTrigger className="w-[160px]" aria-label="Filter by region">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          {REGION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.style || '__all__'} onValueChange={handleStyleChange}>
        <SelectTrigger className="w-[160px]" aria-label="Filter by style">
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          {STYLE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Keyword tags">
        {TAG_OPTIONS.map((opt) => {
          const isSelected = selectedTags.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTagToggle(opt.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                'border focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2',
                isSelected
                  ? 'border-accent bg-accent/15 text-accent-foreground'
                  : 'border-border bg-card hover:border-accent/40 hover:bg-secondary/50'
              )}
              aria-pressed={isSelected}
              aria-label={`Filter by ${opt.label}`}
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
              {opt.label}
            </button>
          )
        })}
      </div>
      <Select value={filters.sort} onValueChange={(v) => handleSortChange(v)}>
        <SelectTrigger className="w-[140px]" aria-label="Sort destinations">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          aria-label="Reset all filters"
        >
          Reset
        </Button>
      )}
    </div>
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop */}
      <div className="hidden lg:block">{filterContent}</div>

      {/* Mobile */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close filters' : 'Open filters'}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium">
                {selectedTags.length +
                  (filters.region ? 1 : 0) +
                  (filters.style ? 1 : 0)}
              </span>
            )}
          </span>
          <X
            className={cn('h-4 w-4 transition-transform', mobileOpen && 'rotate-90')}
          />
        </Button>
        {mobileOpen && (
          <div
            className="mt-4 space-y-4 rounded-xl border border-border bg-card p-4 animate-fade-in"
            role="region"
            aria-label="Filter options"
          >
            {filterContent}
          </div>
        )}
      </div>
    </div>
  )
}
