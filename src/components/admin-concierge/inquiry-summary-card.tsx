import { Download, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Inquiry } from '@/types'
import type { Attachment } from '@/types'

export interface InquirySummaryCardProps {
  inquiry: Inquiry | null
  className?: string
}

function getAttachmentUrl(att: string | Attachment): string {
  if (typeof att === 'string') return att
  return (att as Attachment).file_url ?? (att as Attachment).url ?? ''
}

function getAttachmentName(att: string | Attachment): string {
  if (typeof att === 'string') return 'Attachment'
  return (att as Attachment).name ?? 'Attachment'
}

export function InquirySummaryCard({ inquiry, className }: InquirySummaryCardProps) {
  if (!inquiry) return null

  const listing = typeof inquiry.listing === 'object' ? inquiry.listing : null
  const guest = typeof inquiry.guest === 'object' ? inquiry.guest : null
  const guestName = guest?.full_name ?? guest?.email ?? 'Guest'
  const guestEmail = guest?.email ?? ''
  const destination = listing?.title ?? 'Destination'
  const attachments = Array.isArray(inquiry.attachments) ? inquiry.attachments : []

  return (
    <Card className={cn('transition-all duration-300 hover:shadow-card-hover', className)}>
      <CardHeader className="pb-4">
        <h2 className="font-serif text-xl font-semibold">
          {inquiry.reference ?? inquiry.id}
        </h2>
        <p className="text-sm text-muted-foreground">
          Inquiry summary
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Guest contact
          </p>
          <p className="mt-1 font-medium">{guestName}</p>
          {guestEmail && (
            <a
              href={`mailto:${guestEmail}`}
              className="text-sm text-accent hover:underline"
            >
              {guestEmail}
            </a>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Destination
          </p>
          <p className="mt-1 font-medium">{destination}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Check-in
            </p>
            <p className="mt-1">
              {inquiry.check_in ? formatDate(inquiry.check_in) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Check-out
            </p>
            <p className="mt-1">
              {inquiry.check_out ? formatDate(inquiry.check_out) : '—'}
            </p>
          </div>
        </div>

        {inquiry.guests_count != null && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Guests
            </p>
            <p className="mt-1">{inquiry.guests_count}</p>
          </div>
        )}

        {inquiry.message && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Guest message
            </p>
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-sm">
              {inquiry.message}
            </p>
          </div>
        )}

        {(inquiry.room_prefs ?? []).length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Room preferences
            </p>
            <p className="mt-1 text-sm">
              {(inquiry.room_prefs ?? []).join(', ')}
            </p>
          </div>
        )}

        {inquiry.budget_hint && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Budget hint
            </p>
            <p className="mt-1 text-sm">{inquiry.budget_hint}</p>
          </div>
        )}

        {attachments.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Attachments
            </p>
            <ul className="mt-2 space-y-2" role="list">
              {(attachments ?? []).map((att, idx) => {
                const url = getAttachmentUrl(att)
                const name = getAttachmentName(att)
                return (
                  <li key={idx}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      asChild
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="h-4 w-4" />
                        {name}
                      </a>
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {attachments.length === 0 && !inquiry.message && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No attachments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
