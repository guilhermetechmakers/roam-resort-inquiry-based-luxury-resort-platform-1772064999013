import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Inquiry, InquiryStatus } from '@/types'

const STATUS_OPTIONS: InquiryStatus[] = [
  'new',
  'contacted',
  'deposit_paid',
  'confirmed',
  'cancelled',
]

export interface InquiryStatusPanelProps {
  inquiry: Inquiry
  onStatusChange?: (inquiryId: string, status: InquiryStatus) => void | Promise<void>
  onNotesChange?: (inquiryId: string, notes: string) => void | Promise<void>
  onExport?: () => void | Promise<void>
  className?: string
}

export function InquiryStatusPanel({
  inquiry,
  onStatusChange,
  onNotesChange,
  onExport,
  className,
}: InquiryStatusPanelProps) {
  const [internalNotes, setInternalNotes] = useState(inquiry.internal_notes ?? '')
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status)

  useEffect(() => {
    queueMicrotask(() => {
      setInternalNotes(inquiry.internal_notes ?? '')
      setStatus(inquiry.status)
    })
  }, [inquiry.internal_notes, inquiry.status])

  const handleStatusChange = (value: string) => {
    const next = value as InquiryStatus
    setStatus(next)
    onStatusChange?.(inquiry.id, next)
  }

  const handleNotesBlur = () => {
    if (internalNotes !== (inquiry.internal_notes ?? '')) {
      onNotesChange?.(inquiry.id, internalNotes)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <Label className="text-muted-foreground">Status</Label>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="mt-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-muted-foreground">Internal Notes</Label>
        <Textarea
          placeholder="Add internal notes (concierge only)..."
          rows={4}
          className="mt-2"
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          onBlur={handleNotesBlur}
        />
      </div>

      {onExport && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onExport()}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      )}
    </div>
  )
}
