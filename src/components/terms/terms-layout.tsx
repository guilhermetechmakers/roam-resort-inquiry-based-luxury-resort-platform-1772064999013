import { Link } from 'react-router-dom'
import { Mail, FileText, AlertCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card'
import { SectionCard } from './section-card'
import { HeroBar } from './hero-bar'
import { PrivacyLinkBlock } from './privacy-link-block'
import { FooterLinks } from './footer-links'
import { AccessibilityToolbar } from './accessibility-toolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { TermsSection, TermsContactInfo, FooterLink } from '@/types/terms'

export interface TermsLayoutProps {
  sections?: TermsSection[]
  lastUpdated?: string
  contactInfo?: TermsContactInfo
  footerLinks?: FooterLink[]
  className?: string
  isLoading?: boolean
  hasError?: boolean
}

function TermsEmptyState() {
  return (
    <Card
      className="border-accent/30 bg-secondary/20"
      aria-live="polite"
      aria-label="Empty state"
    >
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center sm:py-20">
        <FileText
          className="h-16 w-16 text-muted-foreground/60 sm:h-20 sm:w-20"
          aria-hidden
        />
        <h2 className="mt-4 font-serif text-xl font-semibold text-foreground sm:text-2xl">
          Terms content unavailable
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The terms of service are currently being updated. Please check back
          later or contact us for assistance.
        </p>
      </CardContent>
    </Card>
  )
}

function TermsErrorState() {
  return (
    <Card
      className="border-destructive/30 bg-destructive/5"
      aria-live="assertive"
      aria-label="Error state"
    >
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center sm:py-20">
        <AlertCircle
          className="h-16 w-16 text-destructive/80 sm:h-20 sm:w-20"
          aria-hidden
        />
        <h2 className="mt-4 font-serif text-xl font-semibold text-foreground sm:text-2xl">
          Something went wrong
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          We could not load the terms of service. Please try again later or
          contact our legal team for assistance.
        </p>
      </CardContent>
    </Card>
  )
}

function TermsLoadingSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-label="Loading terms">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-2/3 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TermsLayout({
  sections = [],
  lastUpdated = '',
  contactInfo = {},
  footerLinks = [],
  className,
  isLoading = false,
  hasError = false,
}: TermsLayoutProps) {
  const safeSections = Array.isArray(sections) ? sections : []
  const safeFooterLinks = Array.isArray(footerLinks) ? footerLinks : []
  const formattedDate = lastUpdated ? formatDate(lastUpdated) : ''

  const {
    email = '',
    label = 'Legal Inquiries',
    href = 'mailto:legal@roamresort.com',
  } = contactInfo ?? {}

  const contactHref =
    href || (email ? `mailto:${email}` : 'mailto:legal@roamresort.com')

  const contactLinkClass =
    'inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <AccessibilityToolbar className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" />

      <HeroBar
        title="Terms of Service"
        subtitle="Please read these terms carefully. By using Roam Resort, you agree to be bound by these terms."
      />

      <article
        id="terms-main-content"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
        aria-label="Terms of Service content"
      >
        {isLoading ? (
          <TermsLoadingSkeleton />
        ) : hasError ? (
          <TermsErrorState />
        ) : safeSections.length === 0 ? (
          <TermsEmptyState />
        ) : (
          <div className="space-y-12 sm:space-y-16 lg:space-y-20">
            {(safeSections ?? []).map((section, idx) => {
              const {
                id = `section-${idx}`,
                title = '',
                body = '',
                bullets,
                disclaimer,
                listType = 'ul',
              } = section ?? {}
              return (
                <SectionCard
                  key={id}
                  id={id}
                  title={title}
                  body={body}
                  bullets={bullets}
                  disclaimer={disclaimer}
                  listType={listType}
                  className="animate-fade-in-up"
                />
              )
            })}
          </div>
        )}

        {!isLoading && !hasError && (
          <>
            {/* Privacy & Data Rights CTA - shadcn Card */}
            <Card
              className="mt-12 border-accent/30 bg-secondary/20 transition-all duration-300 hover:shadow-card-hover sm:mt-16 lg:mt-20"
              aria-labelledby="privacy-cta-heading"
            >
              <CardHeader>
                <h2
                  id="privacy-cta-heading"
                  className="font-serif text-xl font-semibold text-foreground sm:text-2xl"
                >
                  Exercise Your Privacy & Data Rights
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Under GDPR and CCPA, you have the right to access, export, and
                  delete your personal data. Learn more in our Privacy Policy, or
                  exercise your rights in Settings if you have an account.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <PrivacyLinkBlock
                    label="Privacy Policy"
                    href="/privacy"
                    tier="primary"
                  />
                  <PrivacyLinkBlock
                    label="Settings (Data Export & Deletion)"
                    href="/settings"
                    tier="ghost"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Last Updated & Contact - shadcn Card */}
            <Card className="mt-8 sm:mt-12">
              <CardFooter className="flex flex-col gap-6 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                {formattedDate ? (
                  <p className="text-sm text-muted-foreground">
                    Last updated: {formattedDate}
                  </p>
                ) : (
                  <span className="text-sm text-muted-foreground" aria-hidden>
                    —
                  </span>
                )}
                {contactHref.startsWith('mailto:') ? (
                  <a
                    href={contactHref}
                    className={contactLinkClass}
                    aria-label={label}
                  >
                    <Mail className="h-4 w-4 shrink-0" aria-hidden />
                    {label}
                  </a>
                ) : (
                  <Link
                    to={contactHref}
                    className={contactLinkClass}
                    aria-label={label}
                  >
                    <Mail className="h-4 w-4 shrink-0" aria-hidden />
                    {label}
                  </Link>
                )}
              </CardFooter>
            </Card>
          </>
        )}
      </article>

      <FooterLinks
        links={
          safeFooterLinks.length > 0
            ? safeFooterLinks
            : [
                { text: 'Privacy Policy', href: '/privacy' },
                { text: 'Contact', href: '/contact' },
                { text: 'Help', href: '/help' },
              ]
        }
        lastUpdated={formattedDate}
      />
    </div>
  )
}
