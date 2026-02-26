import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export interface BulkStatusUpdateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  selectedIds: Set<string>
  onConfirm: (status: string) => Promise<void>
  isPending?: boolean
  onClearSelection?: () => void
}

export function BulkStatusUpdateModal({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isPending,
  onClearSelection,
}: BulkStatusUpdateModalProps) {
  const [status, setStatus] = useState<string>('')

  const handleConfirm = async () => {
    if (!status) return
    await onConfirm(status)
    onOpenChange(false)
    setStatus('')
    onClearSelection?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="bulk-status-desc">
        <DialogHeader>
          <DialogTitle>Bulk Update Status</DialogTitle>
          <DialogDescription id="bulk-status-desc">
            Update status for {selectedCount} selected {selectedCount === 1 ? 'inquiry' : 'inquiries'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="bulk-status" className="text-sm font-medium">
              New status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="bulk-status" aria-label="Select new status">
                <SelectValue placeholder="Choose status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isPending || !status}
              aria-busy={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Updating…
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
