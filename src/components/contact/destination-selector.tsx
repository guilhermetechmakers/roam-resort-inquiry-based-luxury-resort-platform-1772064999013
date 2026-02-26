import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPublishedDestinations } from '@/api/destinations'
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
import type { Destination } from '@/types'

export interface DestinationSelectorProps {
  value?: string | null
  onChange: (destinationId: string | null, destination?: Destination) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export function DestinationSelector({
  value,
  onChange,
  placeholder = 'Select a destination (optional)',
  disabled = false,
  className,
  id = 'destination-select',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
}: DestinationSelectorProps) {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['destinations', 'contact', { query: search, pageSize: 50 }],
    queryFn: () =>
      fetchPublishedDestinations({
        query: search.trim() || undefined,
        pageSize: 50,
      }),
  })

  const destinations = useMemo(() => {
    const list = data?.data ?? []
    return Array.isArray(list) ? list : []
  }, [data?.data])

  const selectedDestination = useMemo(() => {
    if (!value) return null
    return destinations.find((d) => d.id === value) ?? null
  }, [destinations, value])

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="text-muted-foreground">
        Destination
      </Label>
      <div className="flex gap-2">
        <Input
          type="search"
          placeholder="Search destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-[200px]"
          aria-label="Search destinations"
        />
        <Select
          value={value && value !== '__none__' ? value : '__none__'}
          onValueChange={(v) => {
            if (v === '__none__' || !v) {
              onChange(null)
              return
            }
            const dest = destinations.find((d) => d.id === v) ?? null
            onChange(v, dest ?? undefined)
          }}
          disabled={disabled || isLoading}
        >
          <SelectTrigger
            id={id}
            className="flex-1"
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedby}
            aria-invalid={ariaInvalid}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {destinations.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.title ?? d.slug ?? d.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedDestination && (
        <p className="text-sm text-muted-foreground">
          Selected: {selectedDestination.title ?? selectedDestination.slug}
        </p>
      )}
    </div>
  )
}
