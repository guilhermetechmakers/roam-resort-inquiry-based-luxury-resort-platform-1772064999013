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
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export interface BulkStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  selectedStatus: string
  onStatusChange: (status: string) => void
  onConfirm: () => void
  isPending?: boolean
  className?: string
}

export function BulkStatusModal({
  open,
  onOpenChange,
  selectedCount,
  selectedStatus,
  onStatusChange,
  onConfirm,
  isPending = false,
  className,
}: BulkStatusModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('sm:max-w-md', className)}
        aria-describedby="bulk-status-desc"
      >
        <DialogHeader>
          <DialogTitle>Bulk Update Status</DialogTitle>
          <DialogDescription id="bulk-status-desc">
            Update the status of {selectedCount} selected inquiry
            {selectedCount !== 1 ? 'ies' : ''}. Choose the new status below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="bulk-status" className="text-sm font-medium">
              New status
            </label>
            <Select
              value={selectedStatus}
              onValueChange={onStatusChange}
              disabled={isPending}
            >
              <SelectTrigger id="bulk-status" aria-label="Select new status">
                <SelectValue placeholder="Select status" />
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
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending || !selectedStatus}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
