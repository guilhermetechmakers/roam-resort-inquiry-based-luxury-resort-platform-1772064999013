import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { fetchPublishedDestinations } from '@/api/destinations'
import { getDetailUrl } from '@/lib/destination-utils'
import type { Destination } from '@/types'

const DEBOUNCE_MS = 280

export interface DestinationSearchBarProps {
  value: string
  onChange: (value: string) => void
  onSuggestionSelect?: (destination: Destination) => void
  placeholder?: string
  className?: string
  /** Optional filters to apply when fetching suggestions */
  region?: string
  style?: string
}

export function DestinationSearchBar({
  value,
  onChange,
  onSuggestionSelect,
  placeholder = 'Search destinations...',
  className,
  region,
  style,
}: DestinationSearchBarProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Destination[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const debouncedQuery = useDebounce(value.trim(), DEBOUNCE_MS)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setSuggestions([])
      return
    }
    setIsLoadingSuggestions(true)
    try {
      const res = await fetchPublishedDestinations({
        query: q,
        region: region?.trim() || undefined,
        style: style?.trim() || undefined,
        page: 1,
        pageSize: 6,
      })
      const list = Array.isArray(res?.data) ? res.data : []
      setSuggestions(list)
    } catch {
      setSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [region, style])

  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery, fetchSuggestions])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [suggestions])

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showSuggestions = isOpen && (value.trim().length >= 2 || suggestions.length > 0)

  const handleSelect = (destination: Destination) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(destination)
    } else {
      navigate(getDetailUrl(destination))
    }
    setIsOpen(false)
    setSuggestions([])
    onChange('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape') setIsOpen(false)
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex] ?? suggestions[0])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }

  const handleInputChange = (v: string) => {
    onChange(v)
    setIsOpen(true)
  }

  const handleFocus = () => setIsOpen(true)

  return (
    <div ref={containerRef} className={cn('relative', className)} role="search">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-controls="destination-search-suggestions"
          aria-activedescendant={
            highlightedIndex >= 0 && highlightedIndex < suggestions.length
              ? `suggestion-${suggestions[highlightedIndex]?.id}`
              : undefined
          }
          aria-label="Search destinations by keyword, region, or style"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 bg-secondary/50 border-border focus:ring-accent/20 transition-all duration-200 hover:border-accent/30"
        />
      </div>

      {showSuggestions && (
        <ul
          id="destination-search-suggestions"
          ref={listRef}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-card py-2 shadow-card animate-fade-in"
        >
          {isLoadingSuggestions ? (
            <li className="px-4 py-3 text-sm text-muted-foreground" role="status">
              Searching...
            </li>
          ) : suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground" role="status">
              No destinations match your search
            </li>
          ) : (
            (suggestions ?? []).map((dest, i) => (
              <li
                key={dest.id}
                id={`suggestion-${dest.id}`}
                role="option"
                aria-selected={highlightedIndex === i}
                className={cn(
                  'cursor-pointer px-4 py-3 text-sm transition-colors',
                  highlightedIndex === i
                    ? 'bg-accent/15 text-accent-foreground'
                    : 'hover:bg-secondary/80'
                )}
                onMouseEnter={() => setHighlightedIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(dest)
                }}
              >
                <span className="font-medium">{dest.title ?? 'Untitled'}</span>
                {(dest.region ?? dest.style) && (
                  <span className="ml-2 text-muted-foreground">
                    {[dest.region, dest.style].filter(Boolean).join(' · ')}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {showSuggestions && suggestions.length > 0
          ? `${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''} available`
          : ''}
      </div>
    </div>
  )
}
