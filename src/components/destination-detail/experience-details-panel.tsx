import { Users, Calendar, Sparkles, MapPin } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ExperienceDetails } from '@/types'

export interface ExperienceDetailsPanelProps {
  experienceDetails?: ExperienceDetails | null
  /** Legacy: plain text experience_details */
  experienceDetailsText?: string | null
  /** Legacy: capacity from listing root */
  capacity?: number
  /** Legacy: amenities from listing root */
  amenities?: string[]
  className?: string
}

export function ExperienceDetailsPanel({
  experienceDetails,
  experienceDetailsText,
  capacity,
  amenities,
  className,
}: ExperienceDetailsPanelProps) {
  const dates = experienceDetails?.datesSuggestion ?? []
  const guestCap = experienceDetails?.guestCapacity ?? capacity ?? 0
  const amenityList =
    experienceDetails?.amenities ?? amenities ?? []
  const itineraries = experienceDetails?.sampleItineraries ?? []

  const hasDates = Array.isArray(dates) && dates.length > 0
  const hasAmenities = Array.isArray(amenityList) && amenityList.length > 0
  const hasItineraries = Array.isArray(itineraries) && itineraries.length > 0

  if (!hasDates && !hasAmenities && !hasItineraries && !experienceDetailsText && guestCap === 0) {
    return null
  }

  return (
    <Card
      className={cn(
        'rounded-xl border border-border bg-card shadow-card',
        'transition-all duration-300 hover:shadow-card-hover',
        className
      )}
    >
      <CardHeader>
        <h3 className="font-serif text-xl font-semibold">Experience Details</h3>
      </CardHeader>
      <CardContent className="pt-0">
        {experienceDetailsText && (
          <p className="mb-6 text-sm text-muted-foreground">
            {experienceDetailsText}
          </p>
        )}

        <div className="space-y-4">
          {guestCap > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">Guest Capacity</p>
                <p className="text-muted-foreground">Up to {guestCap} guests</p>
              </div>
            </div>
          )}

          <Accordion type="multiple" defaultValue={['dates', 'amenities', 'itineraries']} className="w-full">
            {hasDates && (
              <AccordionItem value="dates" className="border-0">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent" />
                    Suggested Dates
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {(dates ?? []).map((d, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {hasAmenities && (
              <AccordionItem value="amenities" className="border-0">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Amenities
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {(amenityList ?? []).map((a) => (
                      <span
                        key={a}
                        className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {hasItineraries && (
              <AccordionItem value="itineraries" className="border-0">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    Sample Itineraries
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {(itineraries ?? []).map((it, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
                          {i + 1}
                        </span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  )
}
