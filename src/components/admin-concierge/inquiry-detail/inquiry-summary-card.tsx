/**
 * InquirySummaryCard - Displays guest contact, destination, dates, message, attachments.
 * All fields guarded for null values; safe iteration for attachments.
 */

import { FileText, Download } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AdminInquiryDetail } from '@/types/admin'

export interface InquirySummaryCardProps {
  inquiry: AdminInquiryDetail | null
  className?: string
}

export function InquirySummaryCard({ inquiry, className }: InquirySummaryCardProps) {
  if (!inquiry) return null

  const reference = inquiry.reference ?? inquiry.id ?? '—'
  const guestName = inquiry.guestName ?? '—'
  const guestEmail = inquiry.guestEmail ?? ''
  const guestPhone = inquiry.guestPhone ?? ''
  const destination = inquiry.destinationName ?? '—'
  const startDate = inquiry.dates?.start ?? ''
  const endDate = inquiry.dates?.end ?? ''
  const guestMessage = inquiry.guestMessage ?? ''
  const attachments = inquiry.attachments ?? []

  return (
    <Card
      className={cn(
        'overflow-hidden border-border transition-all duration-300 hover:shadow-card-hover',
        className
      )}
    >
      <CardHeader className="border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            {reference}
          </h2>
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            {inquiry.status ?? '—'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Guest
            </p>
            <p className="mt-1 font-medium">{guestName}</p>
            {guestEmail ? (
              <a
                href={`mailto:${guestEmail}`}
                className="mt-0.5 block text-sm text-accent hover:underline"
              >
                {guestEmail}
              </a>
            ) : null}
            {guestPhone ? (
              <a
                href={`tel:${guestPhone}`}
                className="mt-0.5 block text-sm text-muted-foreground hover:text-foreground"
              >
                {guestPhone}
              </a>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Destination
            </p>
            <p className="mt-1 font-medium">{destination}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Requested Dates
            </p>
            <p className="mt-1">
              {startDate ? formatDate(startDate) : '—'} –{' '}
              {endDate ? formatDate(endDate) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Guests
            </p>
            <p className="mt-1">{inquiry.guests ?? 0}</p>
          </div>
        </div>

        {guestMessage ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Guest Message
            </p>
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted/20 p-4 text-sm">
              {guestMessage}
            </p>
          </div>
        ) : null}

        {attachments.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Attachments
            </p>
            <ul className="mt-2 space-y-2" role="list">
              {attachments.map((att) => (
                <li key={att.id}>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/50 hover:border-accent/40"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{att.name ?? 'Attachment'}</span>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
