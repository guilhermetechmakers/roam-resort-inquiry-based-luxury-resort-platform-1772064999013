/**
 * QuickSearchWidget - Lightweight search input for 404 page.
 * Allows users to quickly search site content (destinations).
 * Runtime-safe: guards against null input and results.
 */
import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface QuickSearchWidgetProps {
  /** Placeholder text for the search input */
  placeholder?: string
  /** Callback when user submits a search query */
  onSubmit?: (query: string) => void
  /** Optional className for the container */
  className?: string
}

export function QuickSearchWidget({
  placeholder = 'Search destinations, regions...',
  onSubmit,
  className,
}: QuickSearchWidgetProps) {
  const [localQuery, setLocalQuery] = useState<string>('')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = (localQuery ?? '').trim()
      if (trimmed.length > 0 && onSubmit) {
        onSubmit(trimmed)
      }
    },
    [localQuery, onSubmit]
  )

  return (
    <form
      role="search"
      aria-label="Quick search"
      onSubmit={handleSubmit}
      className={cn('flex w-full max-w-md gap-2', className)}
    >
      <Input
        type="search"
        value={localQuery ?? ''}
        onChange={(e) => setLocalQuery(e.target.value ?? '')}
        placeholder={placeholder ?? 'Search destinations, regions...'}
        aria-label="Search query"
        className="bg-secondary/50 border-border focus-visible:ring-accent"
      />
      <Button
        type="submit"
        size="icon"
        aria-label="Submit search"
        className="shrink-0 bg-accent hover:bg-accent/90"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
}
