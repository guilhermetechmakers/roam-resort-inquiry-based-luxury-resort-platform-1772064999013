import { Filter } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import type { ActivityFilters as ActivityFiltersType } from '@/types'
import { cn } from '@/lib/utils'

const EVENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'inquiry_created', label: 'Inquiry created' },
  { value: 'email_sent', label: 'Email sent' },
  { value: 'status_changed', label: 'Status changed' },
  { value: 'internal_note_added', label: 'Internal note' },
  { value: 'payment_link_created', label: 'Payment link' },
  { value: 'payment_received', label: 'Payment received' },
]

export interface TimelineFiltersProps {
  filters: ActivityFiltersType
  onChange: (filters: ActivityFiltersType) => void
  showInternalToggle?: boolean
  className?: string
}

export function TimelineFilters({
  filters,
  onChange,
  showInternalToggle = true,
  className,
}: TimelineFiltersProps) {
  const eventType = filters.event_type?.[0] ?? 'all'

  return (
    <div className={cn('flex flex-wrap items-end gap-4', className)}>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={eventType}
          onValueChange={(v) =>
            onChange({
              ...filters,
              event_type: v === 'all' ? undefined : [v],
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              date_from: e.target.value || undefined,
            })
          }
          className="w-[140px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              date_to: e.target.value || undefined,
            })
          }
          className="w-[140px]"
        />
      </div>

      {showInternalToggle && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-internal"
            checked={filters.is_internal === true}
            onCheckedChange={(c) =>
              onChange({
                ...filters,
                is_internal: c === true ? true : undefined,
              })
            }
          />
          <Label htmlFor="show-internal" className="text-sm font-normal cursor-pointer">
            Internal only
          </Label>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            event_type: undefined,
            date_from: undefined,
            date_to: undefined,
            actor_id: undefined,
            is_internal: undefined,
          })
        }
      >
        Clear
      </Button>
    </div>
  )
}
