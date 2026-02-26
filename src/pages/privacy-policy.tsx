import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeroBar } from '@/components/terms/hero-bar'
import { FooterLinks } from '@/components/terms/footer-links'
import { AccessibilityToolbar } from '@/components/terms/accessibility-toolbar'
import {
  PolicySectionComponent,
  ContactInfoCard,
  PdfDownloadButton,
  PrivacyToolsBanner,
} from '@/components/privacy'
import { formatDate } from '@/lib/utils'
import {
  PRIVACY_POLICY_SECTIONS,
  DEFAULT_PRIVACY_LAST_UPDATED,
  DEFAULT_PRIVACY_CONTACT,
  PRIVACY_PDF_URL,
} from '@/data/privacy-data'
import { fetchPrivacyPolicy } from '@/api/privacy'
import type { PolicySection } from '@/types/privacy'

const META_DESCRIPTION =
  'Roam Resort Privacy Policy. How we collect, use, store, and protect your data. Your rights under GDPR and CCPA. Data export and account deletion.'

const FOOTER_LINKS = [
  { text: 'Terms of Service', href: '/terms' },
  { text: 'Privacy & Data Tools', href: '/settings' },
  { text: 'Contact', href: '/contact' },
  { text: 'Help', href: '/help' },
]

export function PrivacyPolicyPage() {
  const [sections, setSections] = useState<PolicySection[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>(DEFAULT_PRIVACY_LAST_UPDATED)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const content = await fetchPrivacyPolicy()
        if (cancelled) return
        if (content) {
          const safeSections = Array.isArray(content.sections) ? content.sections : []
          setSections(safeSections.length > 0 ? safeSections : PRIVACY_POLICY_SECTIONS)
          setLastUpdated(content.lastUpdated ?? DEFAULT_PRIVACY_LAST_UPDATED)
        } else {
          setSections(PRIVACY_POLICY_SECTIONS)
          setLastUpdated(DEFAULT_PRIVACY_LAST_UPDATED)
        }
      } catch {
        if (!cancelled) {
          setSections(PRIVACY_POLICY_SECTIONS)
          setLastUpdated(DEFAULT_PRIVACY_LAST_UPDATED)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const displaySections =
    Array.isArray(sections) && sections.length > 0 ? sections : PRIVACY_POLICY_SECTIONS
  const formattedDate = lastUpdated ? formatDate(lastUpdated) : ''

  useEffect(() => {
    const prevTitle = document.title
    const metaDesc = document.querySelector('meta[name="description"]')
    const prevMeta = metaDesc?.getAttribute('content') ?? ''
    document.title = 'Privacy Policy | Roam Resort'
    metaDesc?.setAttribute('content', META_DESCRIPTION)

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy | Roam Resort',
      description: META_DESCRIPTION,
      publisher: {
        '@type': 'Organization',
        name: 'Roam Resort',
        url: typeof window !== 'undefined' ? window.location.origin : '',
      },
      mainEntity: {
        '@type': 'LegalPolicy',
        name: 'Privacy Policy',
        url: typeof window !== 'undefined' ? `${window.location.origin}/privacy` : '/privacy',
      },
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(structuredData)
    script.id = 'privacy-policy-structured-data'
    document.head.appendChild(script)

    return () => {
      document.title = prevTitle
      metaDesc?.setAttribute('content', prevMeta)
      document.getElementById('privacy-policy-structured-data')?.remove()
    }
  }, [])

  useEffect(() => {
    const scriptId = 'privacy-policy-schema'
    const existing = document.getElementById(scriptId)
    if (existing) existing.remove()
    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy | Roam Resort',
      description: META_DESCRIPTION,
      publisher: {
        '@type': 'Organization',
        name: 'Roam Resort',
        url: typeof window !== 'undefined' ? window.location.origin : '',
      },
      mainEntity: {
        '@type': 'LegalPolicy',
        name: 'Roam Resort Privacy Policy',
        description: META_DESCRIPTION,
      },
    })
    document.head.appendChild(script)
    return () => document.getElementById(scriptId)?.remove()
  }, [])

  return (
    <div>
      <AccessibilityToolbar
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        contentId="privacy-main-content"
      />

      <HeroBar
        title="Privacy Policy"
        subtitle="How we collect, use, store, and protect your data. Your rights under GDPR and CCPA."
      />

      <main
        id="privacy-main-content"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-label="Privacy Policy content"
      >
        {isLoading ? (
          <div className="space-y-8">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <div className="space-y-16 sm:space-y-20">
              {(displaySections ?? []).map((section, idx) => (
                <PolicySectionComponent
                  key={section?.id ?? `section-${idx}`}
                  section={section ?? { id: `section-${idx}`, title: '', content: '' }}
                  className="animate-fade-in-up"
                />
              ))}
            </div>

            <PrivacyToolsBanner className="mt-20" />

            <section
              className="mt-20 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between"
              aria-label="Policy actions and contact"
            >
              <div className="flex flex-col gap-4">
                <PdfDownloadButton pdfUrl={PRIVACY_PDF_URL} label="Download PDF" />
                <p className="text-sm text-muted-foreground">
                  Download a copy of this policy for your records.
                </p>
              </div>
              {formattedDate ? (
                <p className="text-sm text-muted-foreground">Last updated: {formattedDate}</p>
              ) : null}
            </section>

            <section className="mt-16" aria-labelledby="contact-privacy-officer-heading">
              <ContactInfoCard
                officerName={DEFAULT_PRIVACY_CONTACT.officerName}
                email={DEFAULT_PRIVACY_CONTACT.email}
                portalLink={DEFAULT_PRIVACY_CONTACT.portalLink}
              />
            </section>

            <section className="mt-16" aria-label="Related links">
              <h2 className="font-serif text-lg font-semibold text-foreground">
                Related
              </h2>
              <nav className="mt-4 flex flex-wrap gap-4" aria-label="Legal and support links">
                <Link
                  to="/terms"
                  className="text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/settings"
                  className="text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                >
                  Cookie Preferences & Data Tools
                </Link>
                <Link
                  to="/contact"
                  className="text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                >
                  Contact Us
                </Link>
              </nav>
            </section>
          </>
        )}
      </main>

      <FooterLinks
        links={FOOTER_LINKS}
        lastUpdated={formattedDate}
      />
    </div>
  )
}
