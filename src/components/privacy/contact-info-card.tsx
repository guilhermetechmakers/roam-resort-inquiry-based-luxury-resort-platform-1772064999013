import { Mail, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PrivacyContactInfo } from '@/types/privacy'

export interface ContactInfoCardProps {
  officerName?: string
  email?: string
  portalLink?: string
  className?: string
}

export function ContactInfoCard({
  officerName = 'Privacy Officer',
  email = 'privacy@roamresort.com',
  portalLink = '/settings',
  className,
}: ContactInfoCardProps) {
  const safeEmail = typeof email === 'string' && email.trim() ? email.trim() : ''
  const safePortalLink = typeof portalLink === 'string' && portalLink.trim() ? portalLink.trim() : '/settings'
  const mailtoHref = safeEmail ? `mailto:${safeEmail}` : 'mailto:privacy@roamresort.com'

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-card-hover border-accent/30',
        className
      )}
      aria-labelledby="contact-privacy-officer-heading"
    >
      <CardHeader>
        <h2
          id="contact-privacy-officer-heading"
          className="font-serif text-xl font-semibold text-foreground"
        >
          Contact Privacy Officer
        </h2>
        <p className="text-sm text-muted-foreground">
          For data access requests, corrections, deletions, or privacy questions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {officerName ? (
          <p className="text-foreground/90 font-medium">{officerName}</p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <a
            href={mailtoHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            aria-label={`Email ${officerName ?? 'Privacy Officer'}`}
          >
            <Mail className="h-4 w-4" aria-hidden />
            {safeEmail || 'privacy@roamresort.com'}
          </a>
          <Link
            to={safePortalLink}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            aria-label="Go to data requests portal"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Data Requests Portal
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

/** Renders ContactInfoCard from PrivacyContactInfo object */
export function ContactInfoCardFromContact(contact: PrivacyContactInfo | null | undefined) {
  const {
    officerName = 'Privacy Officer',
    email = 'privacy@roamresort.com',
    portalLink = '/settings',
  } = contact ?? {}
  return (
    <ContactInfoCard
      officerName={officerName}
      email={email}
      portalLink={portalLink}
    />
  )
}
