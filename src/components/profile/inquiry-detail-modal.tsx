import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import { useInquiryDetail, useAddInternalNote } from '@/hooks/use-inquiry-detail'
import { useAuth } from '@/contexts/auth-context'
import { InternalNotesPanel } from './internal-notes-panel'
import { ReceiptLinkCard } from './receipt-link-card'
import { TimelineCard } from '@/components/activity-timeline'
import type { Inquiry } from '@/types'

function mapNote(n: Record<string, unknown>) {
  return {
    id: String(n.id ?? ''),
    inquiryId: String(n.inquiry_id ?? n.inquiryId ?? ''),
    authorId: String(n.author_id ?? n.authorId ?? ''),
    authorName: (n.author_name ?? n.authorName) as string | undefined,
    content: String(n.content ?? (n as { text?: string }).text ?? ''),
    createdAt: String(n.created_at ?? n.createdAt ?? ''),
    created_at: n.created_at as string | undefined,
  }
}

export interface InquiryDetailModalProps {
  inquiry: Inquiry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InquiryDetailModal({
  inquiry,
  open,
  onOpenChange,
}: InquiryDetailModalProps) {
  const { user, hasRole } = useAuth()
  const isStaff = hasRole('host') || hasRole('concierge')

  const { data: detail, isLoading } = useInquiryDetail(
    inquiry?.id,
    user?.id,
    isStaff
  )

  const addNote = useAddInternalNote(inquiry?.id)

  const listing = detail?.listing ?? inquiry?.listing
  const title =
    typeof listing === 'object' && listing ? listing.title : 'Destination'

  const notes = (detail?.internalNotes ?? []).map((n) =>
    typeof n === 'object' && n !== null ? mapNote(n as unknown as Record<string, unknown>) : mapNote({})
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" showClose>
        <DialogHeader>
          <DialogTitle className="font-serif">
            {inquiry?.reference ?? 'Inquiry'} — {title}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-mono font-medium">{inquiry?.reference}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p>
                      {inquiry?.check_in
                        ? formatDate(inquiry.check_in)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p>
                      {inquiry?.check_out
                        ? formatDate(inquiry.check_out)
                        : '—'}
                    </p>
                  </div>
                </div>
                {inquiry?.guests_count != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Guests</p>
                    <p>{inquiry.guests_count}</p>
                  </div>
                )}
                {inquiry?.message && (
                  <div>
                    <p className="text-sm text-muted-foreground">Message</p>
                    <p className="whitespace-pre-wrap text-sm">
                      {inquiry.message}
                    </p>
                  </div>
                )}
                <ReceiptLinkCard
                  receiptUrl={inquiry?.receipt_url ?? inquiry?.payment_link}
                  inquiryReference={inquiry?.reference}
                />
              </div>
            </TabsContent>
            <TabsContent value="activity" className="space-y-4 pt-4">
              <div className="space-y-3">
                {(detail?.events ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No activity events yet.
                  </p>
                ) : (
                  (detail?.events ?? []).map((evt) => {
                    const e = evt as { id: string; eventType?: string; timestamp?: string; metadata?: Record<string, unknown> }
                    const legacy = {
                      id: e.id,
                      inquiryId: inquiry?.id ?? '',
                      type: e.eventType ?? 'status_changed',
                      description: (e.metadata?.details as string) ?? (e.metadata?.content as string) ?? 'Event',
                      createdAt: e.timestamp ?? '',
                      authorName: undefined,
                    }
                    return <TimelineCard key={e.id} activity={legacy} />
                  })
                )}
              </div>

              {isStaff && (
                <div className="border-t border-border pt-4">
                  <InternalNotesPanel
                    notes={notes}
                    inquiryId={inquiry?.id ?? ''}
                    canEdit={isStaff}
                    onAddNote={
                      user?.id
                        ? async (content) => {
                            await addNote.mutateAsync({
                              content,
                              authorId: user.id,
                              authorName: user.full_name ?? user.email ?? 'Staff',
                            })
                          }
                        : undefined
                    }
                    isLoading={addNote.isPending}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
