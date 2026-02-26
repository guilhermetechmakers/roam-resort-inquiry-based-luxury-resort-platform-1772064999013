/**
 * MessageModal — Full inquiry message viewer.
 * Keyboard accessible, focus trap; fetches full message when opened.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { useHostInquiryDetail } from '@/hooks/use-host-listing-detail'
import { cn } from '@/lib/utils'

export interface MessageModalProps {
  listingId: string
  inquiryId: string | null
  isOpen: boolean
  onClose: () => void
}

export function MessageModal({
  listingId,
  inquiryId,
  isOpen,
  onClose,
}: MessageModalProps) {
  const { data: detail, isLoading } = useHostInquiryDetail(
    listingId,
    inquiryId ?? undefined,
    isOpen && !!inquiryId
  )

  const guestName = detail?.guest_name ?? 'Guest'
  const startDate = detail?.start_date ? formatDate(detail.start_date) : '—'
  const endDate = detail?.end_date ? formatDate(detail.end_date) : '—'
  const inquiryDate = detail?.created_at ? formatDate(detail.created_at) : '—'
  const fullMessage = detail?.full_message ?? ''

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        aria-describedby="message-modal-desc"
      >
        <DialogHeader>
          <DialogTitle className="font-serif">
            Inquiry Message — {guestName}
          </DialogTitle>
          <DialogDescription id="message-modal-desc">
            Read-only view. Full message and stay details.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Stay dates
                  </p>
                  <p className="font-medium">{startDate} — {endDate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Inquiry date
                  </p>
                  <p className="font-medium">{inquiryDate}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Message
                </p>
                <div
                  className={cn(
                    'mt-2 rounded-lg border border-border bg-secondary/30 p-4',
                    'prose prose-sm max-w-none prose-p:text-foreground'
                  )}
                >
                  {fullMessage ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {fullMessage}
                    </p>
                  ) : (
                    <p className="italic text-muted-foreground">
                      No message content.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
