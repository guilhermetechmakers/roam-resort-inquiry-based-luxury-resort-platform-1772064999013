import { useState, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebounce } from '@/hooks/use-debounce'
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

const SORT_OPTIONS: { value: DestinationSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'alphabetical', label: 'A–Z' },
]

export interface DestinationFilters {
  region: string
  style: string
  query: string
  sort: DestinationSortOption
}

export interface FilterBarProps {
  filters: DestinationFilters
  onFiltersChange: (filters: DestinationFilters) => void
  className?: string
}

export function FilterBar({
  filters,
  onFiltersChange,
  className,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.query)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const debouncedQuery = useDebounce(searchInput, 300)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  useEffect(() => {
    if (debouncedQuery !== filtersRef.current.query) {
      onFiltersChange({ ...filtersRef.current, query: debouncedQuery.trim() })
    }
  }, [debouncedQuery, onFiltersChange])

  useEffect(() => {
    if (filters.query === '' && searchInput !== '') {
      setSearchInput('')
    }
  }, [filters.query])

  const handleQueryChange = (value: string) => {
    setSearchInput(value)
  }

  const handleRegionChange = (value: string) => {
    onFiltersChange({
      ...filters,
      region: value === '__all__' ? '' : (value ?? ''),
      query: searchInput.trim(),
    })
  }

  const handleStyleChange = (value: string) => {
    onFiltersChange({
      ...filters,
      style: value === '__all__' ? '' : (value ?? ''),
      query: searchInput.trim(),
    })
  }

  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sort: (value as DestinationSortOption) ?? 'newest',
      query: searchInput.trim(),
    })
  }

  const handleReset = () => {
    const reset: DestinationFilters = {
      region: '',
      style: '',
      query: '',
      sort: 'newest',
    }
    setSearchInput('')
    onFiltersChange(reset)
    setMobileFiltersOpen(false)
  }

  const hasActiveFilters =
    filters.region ||
    filters.style ||
    filters.query ||
    filters.sort !== 'newest'

  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop: horizontal filter bar */}
      <div className="hidden lg:flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search destinations..."
            value={searchInput}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-10 bg-secondary/50 border-border focus:ring-accent/20"
            aria-label="Search destinations by keyword"
          />
        </div>
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
        <Select
          value={filters.sort}
          onValueChange={(v) => handleSortChange(v)}
        >
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

      {/* Mobile: collapsible filters */}
      <div className="lg:hidden space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-10"
              aria-label="Search destinations"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            aria-label={mobileFiltersOpen ? 'Close filters' : 'Open filters'}
            aria-expanded={mobileFiltersOpen}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
        {mobileFiltersOpen && (
          <div
            className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card animate-fade-in"
            role="region"
            aria-label="Filter options"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filters</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Select value={filters.region || '__all__'} onValueChange={handleRegionChange}>
              <SelectTrigger aria-label="Region">
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
              <SelectTrigger aria-label="Style">
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
            <Select value={filters.sort} onValueChange={(v) => handleSortChange(v)}>
              <SelectTrigger aria-label="Sort">
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
              <Button variant="outline" onClick={handleReset}>
                Reset filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
