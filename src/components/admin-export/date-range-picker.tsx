/**
 * Date range picker with presets.
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const PRESETS = [
  { label: 'Last 7 days', getRange: () => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 7)
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
  }},
  { label: 'Last 30 days', getRange: () => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
  }},
  { label: 'This month', getRange: () => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) }
  }},
  { label: 'Custom', getRange: () => ({ from: '', to: '' }) },
]

export interface DateRangePickerProps {
  from: string
  to: string
  onRangeChange: (from: string, to: string) => void
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  from,
  to,
  onRangeChange,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const handlePreset = (preset: (typeof PRESETS)[0]) => {
    const { from: f, to: t } = preset.getRange()
    onRangeChange(f, t)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label className="text-sm font-medium mb-2 block">Date range</Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p)}
              disabled={disabled}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                'border border-border bg-background hover:bg-secondary hover:border-accent/50',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date-from">From</Label>
          <Input
            id="date-from"
            type="date"
            value={from}
            onChange={(e) => onRangeChange(e.target.value, to)}
            disabled={disabled}
            aria-label="Date from"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-to">To</Label>
          <Input
            id="date-to"
            type="date"
            value={to}
            onChange={(e) => onRangeChange(from, e.target.value)}
            disabled={disabled}
            aria-label="Date to"
          />
        </div>
      </div>
      {from && to && new Date(from) > new Date(to) && (
        <p className="text-sm text-destructive" role="alert">
          From date must be before or equal to To date
        </p>
      )}
    </div>
  )
}
