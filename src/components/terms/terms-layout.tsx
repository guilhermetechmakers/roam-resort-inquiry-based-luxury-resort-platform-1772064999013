import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { SectionCard } from './section-card'
import { HeroBar } from './hero-bar'
import { PrivacyLinkBlock } from './privacy-link-block'
import { FooterLinks } from './footer-links'
import { AccessibilityToolbar } from './accessibility-toolbar'
import { formatDate } from '@/lib/utils'
import type { TermsSection, TermsContactInfo, FooterLink } from '@/types/terms'

export interface TermsLayoutProps {
  sections?: TermsSection[]
  lastUpdated?: string
  contactInfo?: TermsContactInfo
  footerLinks?: FooterLink[]
  className?: string
}

export function TermsLayout({
  sections = [],
  lastUpdated = '',
  contactInfo = {},
  footerLinks = [],
  className,
}: TermsLayoutProps) {
  const safeSections = Array.isArray(sections) ? sections : []
  const safeFooterLinks = Array.isArray(footerLinks) ? footerLinks : []
  const formattedDate = lastUpdated
    ? formatDate(lastUpdated)
    : ''

  const {
    email = '',
    label = 'Legal Inquiries',
    href = 'mailto:legal@roamresort.com',
  } = contactInfo ?? {}

  const contactHref = href || (email ? `mailto:${email}` : 'mailto:legal@roamresort.com')

  return (
    <div className={className}>
      <AccessibilityToolbar className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" />

      <HeroBar
        title="Terms of Service"
        subtitle="Please read these terms carefully. By using Roam Resort, you agree to be bound by these terms."
      />

      <article
        id="terms-main-content"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-label="Terms of Service content"
      >
        <div className="space-y-16 sm:space-y-20">
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

        {/* Privacy & Data Rights CTA */}
        <section
          className="mt-20 rounded-xl border border-accent/30 bg-secondary/30 p-8 sm:p-10"
          aria-labelledby="privacy-cta-heading"
        >
          <h2
            id="privacy-cta-heading"
            className="font-serif text-2xl font-semibold text-foreground"
          >
            Privacy & Data Rights
          </h2>
          <p className="mt-4 text-muted-foreground">
            Under GDPR and CCPA, you have the right to access, export, and delete
            your personal data. Learn more in our Privacy Policy, or exercise
            your rights in Settings if you have an account.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
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
        </section>

        {/* Last Updated & Contact */}
        <section
          className="mt-16 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Page metadata"
        >
          {formattedDate ? (
            <p className="text-sm text-muted-foreground">
              Last updated: {formattedDate}
            </p>
          ) : null}
          {contactHref.startsWith('mailto:') ? (
            <a
              href={contactHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={label}
            >
              <Mail className="h-4 w-4" aria-hidden />
              {label}
            </a>
          ) : (
            <Link
              to={contactHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={label}
            >
              <Mail className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          )}
        </section>
      </article>

      <FooterLinks
        links={[
          ...safeFooterLinks,
          { text: 'Privacy Policy', href: '/privacy' },
          { text: 'Contact', href: '/contact' },
        ]}
        lastUpdated={formattedDate}
      />
    </div>
  )
}
