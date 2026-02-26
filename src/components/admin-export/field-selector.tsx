/**
 * Multi-select field picker with search.
 */

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import type { ExportFieldOption } from '@/types/export'

export interface FieldSelectorProps {
  options: ExportFieldOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function FieldSelector({
  options,
  value,
  onChange,
  placeholder = 'Select fields',
  disabled = false,
  className,
}: FieldSelectorProps) {
  const [search, setSearch] = useState('')
  const selectedSet = useMemo(() => new Set(value ?? []), [value])
  const safeOptions = Array.isArray(options) ? options : []

  const filtered = useMemo(() => {
    if (!search.trim()) return safeOptions
    const q = search.toLowerCase()
    return safeOptions.filter(
      (o) =>
        (o.label ?? '').toLowerCase().includes(q) ||
        (o.id ?? '').toLowerCase().includes(q)
    )
  }, [safeOptions, search])

  const handleToggle = (id: string, checked: boolean) => {
    const next = checked
      ? [...(value ?? []), id]
      : (value ?? []).filter((v) => v !== id)
    onChange(next)
  }

  const handleSelectAll = () => {
    const ids = filtered.map((o) => o.id)
    const allSelected = ids.every((id) => selectedSet.has(id))
    if (allSelected) {
      onChange((value ?? []).filter((v) => !ids.includes(v)))
    } else {
      const merged = new Set([...(value ?? []), ...ids])
      onChange([...merged])
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          className="pl-9"
          aria-label="Search export fields"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{placeholder}</Label>
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className="text-xs text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          {filtered.every((o) => selectedSet.has(o.id)) ? 'Deselect all' : 'Select all'}
        </button>
      </div>
      <div
        className="max-h-48 overflow-y-auto rounded-md border border-border bg-background p-2 space-y-1"
        role="listbox"
        aria-multiselectable
        aria-label="Export fields"
      >
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No fields match
          </p>
        ) : (
          filtered.map((opt) => (
            <label
              key={opt.id}
              className={cn(
                'flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer hover:bg-secondary transition-colors',
                selectedSet.has(opt.id) && 'bg-accent/10'
              )}
            >
              <Checkbox
                checked={selectedSet.has(opt.id)}
                onCheckedChange={(c) => handleToggle(opt.id, c === true)}
                disabled={disabled}
                aria-label={`Select ${opt.label}`}
              />
              <span className="text-sm">{opt.label ?? opt.id}</span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}
