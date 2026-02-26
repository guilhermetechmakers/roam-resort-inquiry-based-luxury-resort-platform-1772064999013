import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useUpdateContactInquiry } from '@/hooks/use-contact-inquiries'
import { toast } from 'sonner'
import type { ContactInquiry, ContactInquiryStatus } from '@/types/contact-inquiry'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'closed', label: 'Closed' },
]

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return String(d)
  }
}

export interface AdminContactInquiryDetailDrawerProps {
  inquiry: ContactInquiry | null
  open: boolean
  onClose: () => void
}

export function AdminContactInquiryDetailDrawer({
  inquiry,
  open,
  onClose,
}: AdminContactInquiryDetailDrawerProps) {
  const [internalNotes, setInternalNotes] = useState(inquiry?.internal_notes ?? '')
  const [status, setStatus] = useState(inquiry?.status ?? 'new')
  const updateMutation = useUpdateContactInquiry()

  useEffect(() => {
    if (inquiry) {
      setInternalNotes(inquiry.internal_notes ?? '')
      setStatus(inquiry.status ?? 'new')
    }
  }, [inquiry])

  const handleSave = async () => {
    if (!inquiry) return
    try {
      await updateMutation.mutateAsync({
        id: inquiry.id,
        updates: { status, internal_notes: internalNotes || undefined },
      })
      toast.success('Inquiry updated')
      onClose()
    } catch {
      toast.error('Failed to update inquiry')
    }
  }

  if (!inquiry) return null

  const dest = inquiry.destination
  const destName = typeof dest === 'object' && dest ? (dest.title ?? dest.slug ?? '') : ''

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            Contact Inquiry — {inquiry.inquiry_reference ?? inquiry.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="mt-1 font-medium">{inquiry.name ?? '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="mt-1">
                <a
                  href={`mailto:${inquiry.email ?? ''}`}
                  className="text-accent hover:underline"
                >
                  {inquiry.email ?? '—'}
                </a>
              </p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Subject</Label>
            <p className="mt-1 font-medium">{inquiry.subject ?? '—'}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Message</Label>
            <p className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-muted/20 p-4 text-sm">
              {inquiry.message ?? '—'}
            </p>
          </div>

          {inquiry.is_concierge && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-muted-foreground">Destination</Label>
                <p className="mt-1">{destName || '—'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Check-in</Label>
                <p className="mt-1">{formatDate(inquiry.start_date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Check-out</Label>
                <p className="mt-1">{formatDate(inquiry.end_date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Guests</Label>
                <p className="mt-1">{inquiry.guests ?? '—'}</p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="drawer-status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ContactInquiryStatus)}
            >
              <SelectTrigger id="drawer-status" className="mt-2">
                <SelectValue />
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

          <div>
            <Label htmlFor="drawer-notes">Internal notes</Label>
            <Textarea
              id="drawer-notes"
              rows={4}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes..."
              className="mt-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-accent hover:bg-accent/90"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
