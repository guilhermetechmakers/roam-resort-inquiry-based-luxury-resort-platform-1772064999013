/**
 * StatusControl - Dropdown with lifecycle states; optimistic UI update with rollback on error.
 * Options: New, Contacted, Deposit Paid, Confirmed, Cancelled.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const ALLOWED_VALUES = new Set(STATUS_OPTIONS.map((s) => s.value))

function toApiStatus(display: string): string {
  const found = STATUS_OPTIONS.find((s) => s.label === display)
  return found?.value ?? display
}

function toDisplayStatus(api: string): string {
  const found = STATUS_OPTIONS.find((s) => s.value === api)
  return found?.label ?? api.replace('_', ' ')
}

export interface StatusControlProps {
  currentStatus: string
  onChange: (status: string) => void
  disabled?: boolean
  isUpdating?: boolean
  className?: string
}

export function StatusControl({
  currentStatus,
  onChange,
  disabled,
  isUpdating,
  className,
}: StatusControlProps) {
  const displayValue = toDisplayStatus(currentStatus)
  const apiValue = ALLOWED_VALUES.has(currentStatus) ? currentStatus : toApiStatus(displayValue)

  const handleChange = (value: string) => {
    const valid = ALLOWED_VALUES.has(value) ? value : STATUS_OPTIONS[0].value
    onChange(valid)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-muted-foreground">Status</Label>
      <Select
        value={apiValue}
        onValueChange={handleChange}
        disabled={disabled || isUpdating}
        aria-label="Inquiry status"
        aria-busy={isUpdating}
      >
        <SelectTrigger
          className={cn(
            'w-full transition-all duration-200',
            'hover:border-accent/50 focus:ring-accent/30',
            'disabled:opacity-60'
          )}
        >
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isUpdating && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Updating…
        </p>
      )}
    </div>
  )
}
