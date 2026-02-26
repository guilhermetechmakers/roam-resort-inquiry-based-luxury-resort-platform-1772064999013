import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { InquiryStatusValue } from '@/types/admin'

const STATUS_OPTIONS: { value: InquiryStatusValue; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export interface StatusControlProps {
  currentStatus: InquiryStatusValue | string
  onChange: (status: InquiryStatusValue) => void | Promise<void>
  disabled?: boolean
  className?: string
}

export function StatusControl({
  currentStatus,
  onChange,
  disabled,
  className,
}: StatusControlProps) {
  const [optimisticStatus, setOptimisticStatus] = useState<InquiryStatusValue | null>(null)
  const displayStatus = optimisticStatus ?? (currentStatus as InquiryStatusValue)

  const handleChange = (value: string) => {
    const next = value as InquiryStatusValue
    if (!['new', 'contacted', 'in_review', 'deposit_paid', 'confirmed', 'closed', 'cancelled'].includes(next)) {
      return
    }
    setOptimisticStatus(next)
    Promise.resolve(onChange(next)).finally(() => {
      setOptimisticStatus(null)
    })
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-muted-foreground">Status</Label>
      <Select
        value={displayStatus}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-full bg-muted/30 focus:ring-accent"
          aria-label="Inquiry status"
          aria-live="polite"
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
    </div>
  )
}
