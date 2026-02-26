/**
 * Bulk add internal note modal for selected inquiries.
 */

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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export interface BulkAddNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  selectedIds: Set<string>
  onConfirm: (note: string) => Promise<void>
  isPending?: boolean
  onClearSelection?: () => void
}

export function BulkAddNoteModal({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isPending,
  onClearSelection,
}: BulkAddNoteModalProps) {
  const [note, setNote] = useState('')

  const handleConfirm = async () => {
    const trimmed = note?.trim()
    if (!trimmed) return
    await onConfirm(trimmed)
    onOpenChange(false)
    setNote('')
    onClearSelection?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="bulk-note-desc">
        <DialogHeader>
          <DialogTitle>Add Note to Inquiries</DialogTitle>
          <DialogDescription id="bulk-note-desc">
            Add an internal note to {selectedCount} selected {selectedCount === 1 ? 'inquiry' : 'inquiries'}.
            The note will be visible to all concierge staff.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-note">Note</Label>
            <Textarea
              id="bulk-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter internal note..."
              rows={4}
              disabled={isPending}
              className="resize-none"
              aria-label="Internal note text"
            />
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
              disabled={isPending || !note?.trim()}
              aria-busy={isPending}
              className="bg-accent hover:bg-accent/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Adding…
                </>
              ) : (
                'Add Note'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
