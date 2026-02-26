/**
 * InquirySummaryCard - Key details (destination, dates, guests, reference).
 * Robust rendering with guards; uses defaults for missing data.
 */

import { MapPin, Calendar, Users } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export interface InquirySummaryCardProps {
  destinationName?: string
  startDate?: string
  endDate?: string
  guests?: number
  reference?: string
}

export function InquirySummaryCard({
  destinationName = 'Destination',
  startDate,
  endDate,
  guests = 0,
  reference,
}: InquirySummaryCardProps) {
  const hasDates = !!(startDate || endDate)
  const hasGuests = (guests ?? 0) > 0

  return (
    <Card className="rounded-xl border-border/80 bg-card/50 shadow-card transition-all duration-300 hover:shadow-card-hover">
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Inquiry Summary
        </h2>
        {reference && (
          <p className="font-mono text-sm text-accent" aria-label="Reference number">
            {reference}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div>
            <p className="text-sm text-muted-foreground">Destination</p>
            <p className="font-serif text-lg font-semibold text-foreground">
              {destinationName}
            </p>
          </div>
        </div>

        {hasDates && (
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-sm text-muted-foreground">Dates</p>
              <p className="text-foreground">
                {startDate ? formatDate(startDate) : '—'}
                {endDate && ` — ${formatDate(endDate)}`}
              </p>
            </div>
          </div>
        )}

        {hasGuests && (
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-sm text-muted-foreground">Guests</p>
              <p className="text-foreground">{guests}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
